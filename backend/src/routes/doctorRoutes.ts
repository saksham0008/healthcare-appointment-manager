import { Router } from 'express';
import { getAllDoctors, getDoctorById, updateDoctor, getDoctorAppointments } from '../controllers/doctorController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);
router.put('/:id', authMiddleware, roleMiddleware(['doctor', 'admin']), updateDoctor);
router.get('/:id/appointments', authMiddleware, getDoctorAppointments);

export default router;
