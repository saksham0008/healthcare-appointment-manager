import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, Doctor, DoctorLeave, Appointment, Patient, Symptom, PostVisitNote } from '../models';
import { sendLeaveNotification } from '../services/notificationService';

export const createDoctor = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      specialization,
      bio,
      working_hours_start,
      working_hours_end,
      slot_duration,
    } = req.body;

    if (!username || !email || !password || !specialization) {
      return res.status(400).json({
        message: 'username, email, password, and specialization are required',
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'doctor',
      first_name,
      last_name,
      phone,
    });

    const doctor = await Doctor.create({
      user_id: user.id,
      specialization,
      bio: bio || null,
      working_hours_start: working_hours_start || '09:00:00',
      working_hours_end: working_hours_end || '17:00:00',
      slot_duration: slot_duration || 30,
    });

    return res.status(201).json({
      message: 'Doctor created successfully',
      user: { id: user.id, email: user.email, role: user.role },
      doctor,
    });
  } catch (error: any) {
    console.error('createDoctor error:', error);
    return res.status(500).json({ message: 'Failed to create doctor', error: error.message });
  }
};

export const addDoctorLeave = async (req: Request, res: Response): Promise<Response> => {
  try {
    const doctorId = parseInt(req.params.doctorId, 10);
    const { leave_date, reason } = req.body;

    if (!doctorId || Number.isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctorId' });
    }

    if (!leave_date) {
      return res.status(400).json({ message: 'leave_date is required (YYYY-MM-DD)' });
    }

    const doctor = await Doctor.findByPk(doctorId, {
      include: [{ model: User, as: 'user' }],
    });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const [leave, created] = await DoctorLeave.findOrCreate({
      where: { doctor_id: doctorId, leave_date },
      defaults: { doctor_id: doctorId, leave_date, reason: reason || null },
    });

    if (!created) {
      return res.status(409).json({ message: 'Leave already exists for this date' });
    }

    // Find affected appointments (booked/confirmed) on that leave date
    const startOfDay = new Date(`${leave_date}T00:00:00.000Z`);
    const endOfDay = new Date(`${leave_date}T23:59:59.999Z`);

    const affectedAppointments = await Appointment.findAll({
      where: {
        doctor_id: doctorId,
        status: { [Op.in]: ['booked', 'confirmed'] },
        appointment_time: { [Op.between]: [startOfDay, endOfDay] },
      },
    });

    // Cancel affected appointments and notify patients
    for (const appointment of affectedAppointments) {
      await appointment.update({ status: 'cancelled' });

      try {
        const patient = await Patient.findByPk(appointment.patient_id, {
          include: [{ model: User, as: 'user' }],
        });

        const doctorUser = (doctor as any).user as User | null;

        if (patient && doctorUser) {
          const patientUser = (patient as any).user as User | null;
          if (patientUser) {
            await sendLeaveNotification(
              [appointment],
              patientUser,
              doctorUser,
              leave_date
            );
          }
        }
      } catch (notifyError) {
        console.error(`❌ Failed to notify patient for appointment ${appointment.id}:`, notifyError);
      }
    }

    return res.status(201).json({
      message: 'Doctor leave added',
      leave,
      affectedAppointmentsCount: affectedAppointments.length,
    });
  } catch (error: any) {
    console.error('addDoctorLeave error:', error);
    return res.status(500).json({ message: 'Failed to add doctor leave', error: error.message });
  }
};

export const removeDoctorLeave = async (req: Request, res: Response): Promise<Response> => {
  try {
    const doctorId = parseInt(req.params.doctorId, 10);
    const leaveId = parseInt(req.params.leaveId, 10);

    if (Number.isNaN(doctorId) || Number.isNaN(leaveId)) {
      return res.status(400).json({ message: 'Invalid doctorId or leaveId' });
    }

    const leave = await DoctorLeave.findOne({ where: { id: leaveId, doctor_id: doctorId } });
    if (!leave) {
      return res.status(404).json({ message: 'Leave record not found' });
    }

    await leave.destroy();
    return res.json({ message: 'Doctor leave removed successfully' });
  } catch (error: any) {
    console.error('removeDoctorLeave error:', error);
    return res.status(500).json({ message: 'Failed to remove doctor leave', error: error.message });
  }
};

export const getDoctorLeaves = async (req: Request, res: Response): Promise<Response> => {
  try {
    const doctorId = parseInt(req.params.doctorId, 10);

    if (Number.isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctorId' });
    }

    const leaves = await DoctorLeave.findAll({ where: { doctor_id: doctorId } });
    return res.json(leaves);
  } catch (error: any) {
    console.error('getDoctorLeaves error:', error);
    return res.status(500).json({ message: 'Failed to fetch doctor leaves', error: error.message });
  }
};

export const getAllAppointments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        {
          model: Patient,
          as: 'patient',
          include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] }],
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] }],
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
    console.error('getAllAppointments error:', error);
    return res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
  }
};
