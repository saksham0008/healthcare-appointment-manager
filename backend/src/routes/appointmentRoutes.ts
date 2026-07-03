import { Router } from 'express';
import {
  getAvailableSlots,
  getDoctorAvailability,
  bookAppointment,
  getAppointments,
  cancelAppointment,
  addPostVisitNotes,
  getAppointmentDetails,
} from '../controllers/appointmentController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

// Specific paths MUST come before wildcard /:appointment_id
router.get('/slots', getAvailableSlots);
router.get('/availability', getDoctorAvailability);
router.post('/book', authMiddleware, bookAppointment);
router.post('/post-visit', authMiddleware, roleMiddleware(['doctor', 'admin']), addPostVisitNotes);
router.get('/', authMiddleware, getAppointments);

// Wildcard routes last
router.get('/:appointment_id', authMiddleware, getAppointmentDetails);
router.delete('/:appointment_id', authMiddleware, cancelAppointment);

export default router;
