import { Request, Response } from 'express';
import { Doctor, User } from '../models/index';

export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const { specialization } = req.query;

    const where: any = {};
    if (specialization) where.specialization = specialization;

    const doctors = await Doctor.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] }],
    });

    res.json(doctors);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch doctors', error: error.message });
  }
};

export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] }],
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch doctor', error: error.message });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { specialization, bio, working_hours_start, working_hours_end, slot_duration } = req.body;

    const doctor = await Doctor.findByPk(id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    await doctor.update({
      specialization: specialization || doctor.specialization,
      bio: bio || doctor.bio,
      working_hours_start: working_hours_start || doctor.working_hours_start,
      working_hours_end: working_hours_end || doctor.working_hours_end,
      slot_duration: slot_duration || doctor.slot_duration,
    });

    res.json({ message: 'Doctor updated successfully', doctor });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update doctor', error: error.message });
  }
};

export const getDoctorAppointments = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // The URL param (:id) may be a user.id (sent by the frontend) or a doctor.id.
    // We resolve the doctor record authoritatively from the JWT user_id for non-admins,
    // and fall back to the URL param for admins viewing other doctors.
    const { Doctor: DoctorModel, Appointment, Patient, User, Symptom } = await import('../models');

    let doctor: InstanceType<typeof DoctorModel> | null = null;

    if (req.user.role === 'admin') {
      // Admin: use the URL param directly as doctor.id
      const paramId = parseInt(req.params.id, 10);
      if (Number.isNaN(paramId)) {
        return res.status(400).json({ message: 'Invalid doctor id' });
      }
      doctor = await DoctorModel.findByPk(paramId);
    } else {
      // Doctor (or any non-admin): resolve by their JWT user_id — this is the reliable source.
      // The frontend passes user.id in the URL, so try user_id first, then fallback to doctor.id.
      doctor = await DoctorModel.findOne({ where: { user_id: req.user.id } });

      if (!doctor) {
        // Fallback: maybe the URL param is actually the doctor.id (e.g. direct API calls)
        const paramId = parseInt(req.params.id, 10);
        if (!Number.isNaN(paramId)) {
          doctor = await DoctorModel.findByPk(paramId);
          // Security: ensure this doctor belongs to the requesting user
          if (doctor && doctor.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
          }
        }
      }
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointments = await Appointment.findAll({
      where: { doctor_id: doctor.id },
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
        { model: Symptom, as: 'symptom' },
      ],
      order: [['appointment_time', 'DESC']],
    });

    return res.json(appointments);
  } catch (error: any) {
    console.error('getDoctorAppointments error:', error);
    return res.status(500).json({ message: 'Failed to fetch doctor appointments', error: error.message });
  }
};
