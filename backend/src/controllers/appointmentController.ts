import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import {
  Appointment,
  Symptom,
  Doctor,
  PostVisitNote,
  Patient,
  User,
  DoctorLeave,
  Medication,
} from '../models';
import { generatePreVisitSummary, generatePostVisitSummary } from '../config/llm';
import {
  sendBookingConfirmation,
  sendCancellationNotification,
} from '../services/notificationService';
import { createAppointmentEvent } from '../services/calendarService';

const SLOT_LOCK_DURATION = 5 * 60 * 1000; // 5 minutes

const toInt = (value: unknown): number | null => {
  const v = Array.isArray(value) ? value[0] : value;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ---------------------------------------------------------------------------
// GET /appointments/slots?doctor_id=X&date=YYYY-MM-DD
// ---------------------------------------------------------------------------
export const getAvailableSlots = async (req: Request, res: Response): Promise<Response> => {
  try {
    const doctorId = toInt(req.query.doctor_id);
    const date = Array.isArray(req.query.date) ? req.query.date[0] : req.query.date;

    if (!doctorId || !date) {
      return res.status(400).json({ message: 'doctor_id and date are required' });
    }

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Build all theoretical slots
    const slots: string[] = [];
    const startHour = parseInt(String(doctor.working_hours_start).split(':')[0], 10);
    const endHour = parseInt(String(doctor.working_hours_end).split(':')[0], 10);
    const slotDuration = doctor.slot_duration;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        slots.push(
          `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        );
      }
    }

    // Fetch already-booked slots for that day
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const bookedAppointments = await Appointment.findAll({
      where: {
        doctor_id: doctorId,
        status: { [Op.in]: ['booked', 'confirmed'] },
        appointment_time: { [Op.between]: [startOfDay, endOfDay] },
      },
    });

    const bookedTimes = new Set(
      bookedAppointments.map((a) => {
        const d = new Date(a.appointment_time);
        return `${d.getUTCHours().toString().padStart(2, '0')}:${d
          .getUTCMinutes()
          .toString()
          .padStart(2, '0')}`;
      })
    );

    const availableSlots = slots.filter((slot) => !bookedTimes.has(slot));

    return res.json({ slots: availableSlots });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch slots', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /appointments/availability?doctor_id=X&date=YYYY-MM-DD
// ---------------------------------------------------------------------------
export const getDoctorAvailability = async (req: Request, res: Response): Promise<Response> => {
  try {
    const doctorId = toInt(req.query.doctor_id);
    const date = Array.isArray(req.query.date) ? req.query.date[0] : req.query.date;

    if (!doctorId || !date) {
      return res.status(400).json({ message: 'doctor_id and date are required' });
    }

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if doctor is on leave
    const leave = await DoctorLeave.findOne({ where: { doctor_id: doctorId, leave_date: date } });
    if (leave) {
      return res.json({ available: false, reason: 'Doctor on leave' });
    }

    // Build available slots (reuse slot-generation logic)
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const bookedAppointments = await Appointment.findAll({
      where: {
        doctor_id: doctorId,
        status: { [Op.in]: ['booked', 'confirmed'] },
        appointment_time: { [Op.between]: [startOfDay, endOfDay] },
      },
    });

    const bookedTimes = new Set(
      bookedAppointments.map((a) => {
        const d = new Date(a.appointment_time);
        return `${d.getUTCHours().toString().padStart(2, '0')}:${d
          .getUTCMinutes()
          .toString()
          .padStart(2, '0')}`;
      })
    );

    const startHour = parseInt(String(doctor.working_hours_start).split(':')[0], 10);
    const endHour = parseInt(String(doctor.working_hours_end).split(':')[0], 10);
    const slotDuration = doctor.slot_duration;

    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slot = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;
        if (!bookedTimes.has(slot)) {
          slots.push(slot);
        }
      }
    }

    return res.json({ available: true, slots });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch availability', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /appointments/book
// ---------------------------------------------------------------------------
export const bookAppointment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const doctorId = toInt(req.body.doctor_id);
    const appointmentTime = req.body.appointment_time;
    const symptoms = req.body.symptoms;
    const patientCalendarToken: string | undefined = req.body.patient_calendar_token;

    // Accept either patient_id (patients.id) or user_id (users.id) for flexibility
    const rawPatientId = toInt(req.body.patient_id);
    const rawUserId = req.user?.id; // from JWT

    if (!doctorId || !appointmentTime) {
      return res.status(400).json({
        message: 'doctor_id and appointment_time are required',
      });
    }

    // Resolve patient record - try by patient.id first, fallback to user_id from JWT
    let patient: Patient | null = null;
    if (rawPatientId) {
      patient = await Patient.findByPk(rawPatientId, {
        include: [{ model: User, as: 'user' }],
      });
    }
    if (!patient && rawUserId) {
      patient = await Patient.findOne({
        where: { user_id: rawUserId },
        include: [{ model: User, as: 'user' }],
      });
    }
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const doctor = await Doctor.findByPk(doctorId, {
      include: [{ model: User, as: 'user' }],
    });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointmentDate = new Date(appointmentTime);
    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: 'Invalid appointment_time format' });
    }

    // Check doctor is not on leave that day
    const leaveDate = appointmentDate.toISOString().split('T')[0];
    const doctorOnLeave = await DoctorLeave.findOne({
      where: { doctor_id: doctorId, leave_date: leaveDate },
    });
    if (doctorOnLeave) {
      return res.status(409).json({ message: 'Doctor is on leave on the selected date' });
    }

    const existingAppointment = await Appointment.findOne({
      where: { doctor_id: doctorId, appointment_time: appointmentDate },
    });

    if (existingAppointment && existingAppointment.status !== 'cancelled') {
      return res.status(409).json({ message: 'Slot already booked' });
    }

    const appointment = await Appointment.create({
      patient_id: patient.id,
      doctor_id: doctorId,
      appointment_time: appointmentDate,
      status: 'booked',
      slot_lock_id: uuidv4(),
      slot_lock_expires_at: new Date(Date.now() + SLOT_LOCK_DURATION),
      google_calendar_event_id: null,
    });

    if (symptoms) {
      const summary: any = await generatePreVisitSummary(symptoms);
      await Symptom.create({
        appointment_id: appointment.id,
        symptom_description: symptoms,
        urgency_level: summary?.urgencyLevel || 'Medium',
        chief_complaint: summary?.chiefComplaint || symptoms,
        suggested_questions: summary?.suggestedQuestions || [],
      });
    }

    // Send booking confirmation notification (graceful)
    try {
      const patientUser = (patient as any).user as User;
      const doctorUser = (doctor as any).user as User;
      if (patientUser && doctorUser) {
        await sendBookingConfirmation(appointment, patientUser, doctorUser);
      }
    } catch (notifyError) {
      console.error('❌ Failed to send booking confirmation:', notifyError);
    }

    // Attempt Google Calendar event creation (graceful)
    try {
      if (patientCalendarToken) {
        const patientUser = (patient as any).user as User;
        const doctorUser = (doctor as any).user as User;
        if (patientUser && doctorUser) {
          const doctorName =
            `${doctorUser.first_name || ''} ${doctorUser.last_name || ''}`.trim() ||
            doctorUser.email;
          const calResult = await createAppointmentEvent(
            patientCalendarToken,
            null,
            appointment,
            patientUser.email,
            doctorUser.email,
            doctorName
          );
          if (calResult?.patientEventId) {
            await appointment.update({
              google_calendar_event_id: calResult.patientEventId,
            });
          }
        }
      }
    } catch (calError) {
      console.error('❌ Failed to create calendar event:', calError);
    }

    return res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error: any) {
    console.error('Booking error:', error);
    return res.status(500).json({ message: 'Failed to book appointment', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /appointments
// ---------------------------------------------------------------------------
export const getAppointments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const where: any = {};

    const patientIdParam = toInt(req.query.patient_id);
    const doctorIdParam = toInt(req.query.doctor_id);
    const status = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;

    // If the caller is a patient, auto-resolve their patient record and filter by it.
    if (req.user?.role === 'patient') {
      const patientRecord = await Patient.findOne({ where: { user_id: req.user.id } });
      if (!patientRecord) {
        return res.status(404).json({ message: 'Patient profile not found for this user' });
      }
      where.patient_id = patientRecord.id;
    } else {
      // Admins / doctors may pass explicit query params
      if (patientIdParam) where.patient_id = patientIdParam;
      if (doctorIdParam) where.doctor_id = doctorIdParam;
    }

    if (status) where.status = status;

    const appointments = await Appointment.findAll({
      where,
      include: [
        {
          model: Patient,
          as: 'patient',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
            },
          ],
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
            },
          ],
        },
        { model: Symptom, as: 'symptom' },
        {
          model: PostVisitNote,
          as: 'postVisitNote',
        },
      ],
      order: [['appointment_time', 'DESC']],
    });

    return res.json(appointments);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE /appointments/:appointment_id
// ---------------------------------------------------------------------------
export const cancelAppointment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const appointmentId = toInt(req.params.appointment_id);
    if (!appointmentId) {
      return res.status(400).json({ message: 'Invalid appointment_id' });
    }

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const previousEventId = appointment.google_calendar_event_id;

    await appointment.update({ status: 'cancelled' });

    // Send cancellation notification (graceful)
    try {
      const patient = await Patient.findByPk(appointment.patient_id, {
        include: [{ model: User, as: 'user' }],
      });
      const doctor = await Doctor.findByPk(appointment.doctor_id, {
        include: [{ model: User, as: 'user' }],
      });

      if (patient && doctor) {
        const patientUser = (patient as any).user as User;
        const doctorUser = (doctor as any).user as User;
        if (patientUser && doctorUser) {
          await sendCancellationNotification(appointment, patientUser, doctorUser);
        }
      }
    } catch (notifyError) {
      console.error('❌ Failed to send cancellation notification:', notifyError);
    }

    // Delete calendar event if available (graceful)
    if (previousEventId) {
      try {
        const { deleteCalendarEvent } = await import('../config/calendar');
        const patientCalendarToken: string | undefined = req.body?.patient_calendar_token;
        if (patientCalendarToken) {
          await deleteCalendarEvent(patientCalendarToken, previousEventId);
        }
      } catch (calError) {
        console.error('❌ Failed to delete calendar event:', calError);
      }
    }

    return res.json({ message: 'Appointment cancelled successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to cancel appointment', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /appointments/post-visit
// ---------------------------------------------------------------------------
export const addPostVisitNotes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const appointmentId = toInt(req.body.appointment_id);
    const { clinical_notes, prescription } = req.body;
    const medications: Array<{
      medication_name: string;
      dosage: string;
      frequency: string;
      duration_days: number;
    }> = req.body.medications || [];

    if (!appointmentId || !clinical_notes) {
      return res.status(400).json({
        message: 'appointment_id and clinical_notes are required',
      });
    }

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const postVisitNote = await PostVisitNote.create({
      appointment_id: appointmentId,
      clinical_notes,
      prescription: prescription || null,
    });

    // Generate patient-friendly summary via LLM (graceful)
    try {
      const llmResult = await generatePostVisitSummary(clinical_notes, prescription || '');
      if (llmResult.summary) {
        await postVisitNote.update({ patient_friendly_summary: llmResult.summary });
      }
    } catch (llmError) {
      console.error('❌ Failed to generate post-visit summary:', llmError);
    }

    // Create medication records if provided
    const createdMedications: Medication[] = [];
    for (const med of medications) {
      if (med.medication_name && med.dosage && med.frequency && med.duration_days) {
        const m = await Medication.create({
          post_visit_note_id: postVisitNote.id,
          medication_name: med.medication_name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration_days: med.duration_days,
          reminder_sent_at: null,
        });
        createdMedications.push(m);
      }
    }

    // Reload the note to include latest data
    await postVisitNote.reload();

    return res.status(201).json({
      message: 'Post-visit notes added',
      postVisitNote,
      medications: createdMedications,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to add post-visit notes', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /appointments/:appointment_id
// ---------------------------------------------------------------------------
export const getAppointmentDetails = async (req: Request, res: Response): Promise<Response> => {
  try {
    const appointmentId = toInt(req.params.appointment_id);
    if (!appointmentId) {
      return res.status(400).json({ message: 'Invalid appointment_id' });
    }

    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: Symptom, as: 'symptom' },
        {
          model: PostVisitNote,
          as: 'postVisitNote',
          include: [{ model: Medication, as: 'medications' }],
        },
        {
          model: Patient,
          as: 'patient',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
            },
          ],
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
            },
          ],
        },
      ],
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    return res.json(appointment);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch appointment details', error: error.message });
  }
};
