import { Router } from 'express';
import {
  createDoctor,
  addDoctorLeave,
  removeDoctorLeave,
  getDoctorLeaves,
  getAllAppointments,
} from '../controllers/adminController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware, roleMiddleware(['admin']));

router.post('/doctors', createDoctor);
router.post('/doctors/:doctorId/leave', addDoctorLeave);
router.delete('/doctors/:doctorId/leave/:leaveId', removeDoctorLeave);
router.get('/doctors/:doctorId/leave', getDoctorLeaves);
router.get('/appointments', getAllAppointments);

export default router;
