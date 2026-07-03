export interface User {
  id: number;
  email: string;
  username: string;
  role: 'patient' | 'doctor' | 'admin';
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface Doctor {
  id: number;
  user_id: number;
  specialization: string;
  bio?: string;
  working_hours_start: string;
  working_hours_end: string;
  slot_duration: number;
  user?: User;
}

export interface Patient {
  id: number;
  user_id: number;
  user?: User;
}

export interface Symptom {
  id: number;
  appointment_id: number;
  symptom_description: string;
  urgency_level: 'Low' | 'Medium' | 'High';
  chief_complaint: string;
  suggested_questions: string[];
}

export interface Medication {
  id: number;
  post_visit_note_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  reminder_sent_at?: string | null;
}

export interface PostVisitNote {
  id: number;
  appointment_id: number;
  clinical_notes: string;
  prescription?: string;
  patient_friendly_summary?: string;
  follow_up_date?: string;
  medications?: Medication[];
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  status: 'booked' | 'confirmed' | 'completed' | 'cancelled';
  google_calendar_event_id?: string | null;
  patient?: Patient;
  doctor?: Doctor;
  symptom?: Symptom;
  postVisitNote?: PostVisitNote;
}

export interface DoctorLeave {
  id: number;
  doctor_id: number;
  leave_date: string;
  reason?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
