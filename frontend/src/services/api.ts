import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerPatient = (data: object) => api.post('/auth/register/patient', data);
export const registerDoctor = (data: object) => api.post('/auth/register/doctor', data);
export const login = (data: object) => api.post('/auth/login', data);

// Doctors
export const getDoctors = (specialization?: string) =>
  api.get('/doctors', { params: specialization ? { specialization } : {} });
export const getDoctorById = (id: number) => api.get(`/doctors/${id}`);
export const updateDoctor = (id: number, data: object) => api.put(`/doctors/${id}`, data);
export const getDoctorAppointments = (id: number) => api.get(`/doctors/${id}/appointments`);

// Appointments
export const getAvailableSlots = (doctor_id: number, date: string) =>
  api.get('/appointments/slots', { params: { doctor_id, date } });
export const getDoctorAvailability = (doctor_id: number, date: string) =>
  api.get('/appointments/availability', { params: { doctor_id, date } });
export const getAppointments = (params?: object) => api.get('/appointments', { params });
export const getAppointmentDetails = (id: number) => api.get(`/appointments/${id}`);
export const bookAppointment = (data: object) => api.post('/appointments/book', data);
export const cancelAppointment = (id: number) => api.delete(`/appointments/${id}`);
export const addPostVisitNotes = (data: object) => api.post('/appointments/post-visit', data);

// Admin
export const adminCreateDoctor = (data: object) => api.post('/admin/doctors', data);
export const adminGetAllAppointments = () => api.get('/admin/appointments');
export const adminAddDoctorLeave = (doctorId: number, data: object) =>
  api.post(`/admin/doctors/${doctorId}/leave`, data);
export const adminRemoveDoctorLeave = (doctorId: number, leaveId: number) =>
  api.delete(`/admin/doctors/${doctorId}/leave/${leaveId}`);
export const adminGetDoctorLeaves = (doctorId: number) =>
  api.get(`/admin/doctors/${doctorId}/leave`);

export default api;
