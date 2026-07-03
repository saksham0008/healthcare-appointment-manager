# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Include JWT token in all protected requests:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/register/patient
Register a new patient.
```json
{ "username": "john", "email": "john@email.com", "password": "secret",
  "first_name": "John", "last_name": "Doe", "phone": "1234567890" }
```
Response `201`: `{ message, user: { id, email, role } }`

### POST /auth/register/doctor
Self-register a doctor (for testing; admins use POST /admin/doctors).
```json
{ "username": "dr_smith", "email": "smith@clinic.com", "password": "secret",
  "specialization": "Cardiology", "bio": "..." }
```

### POST /auth/login
```json
{ "email": "john@email.com", "password": "secret" }
```
Response `200`: `{ message, token, user: { id, email, role, username } }`

---

## Doctor Endpoints

### GET /doctors
Query param: `?specialization=Cardiology`
Response: Array of doctor objects with nested user.

### GET /doctors/:id
Single doctor with user details.

### PUT /doctors/:id  🔐 (doctor/admin)
Update doctor profile fields.

### GET /doctors/:id/appointments  🔐 (doctor/admin)
All appointments for a doctor including patient details and symptom summaries.

---

## Appointment Endpoints

### GET /appointments/slots?doctor_id=X&date=YYYY-MM-DD
Returns available (unbooked) time slots for a doctor on a given date.

### GET /appointments/availability?doctor_id=X&date=YYYY-MM-DD
Returns `{ available: false, reason }` if doctor is on leave, otherwise `{ available: true, slots[] }`.

### POST /appointments/book  🔐
```json
{
  "patient_id": 1,
  "doctor_id": 2,
  "appointment_time": "2024-12-20T10:00:00.000Z",
  "symptoms": "Fever for 3 days, sore throat",
  "patient_calendar_token": "<optional Google OAuth token>"
}
```
Response `201`. Triggers: LLM pre-visit summary, booking confirmation email, optional calendar event.

### GET /appointments  🔐
Query: `?patient_id=X`, `?doctor_id=Y`, `?status=booked`

### GET /appointments/:appointment_id  🔐
Full details: patient, doctor, symptom, postVisitNote with medications.

### DELETE /appointments/:appointment_id  🔐
Cancel appointment. Triggers cancellation email.

### POST /appointments/post-visit  🔐 (doctor/admin)
```json
{
  "appointment_id": 5,
  "clinical_notes": "Patient presents with...",
  "prescription": "Amoxicillin 500mg...",
  "follow_up_date": "2024-12-27",
  "medications": [
    { "medication_name": "Amoxicillin", "dosage": "500mg", "frequency": "twice daily", "duration_days": 7 }
  ]
}
```
Triggers LLM post-visit summary generation.

---

## Admin Endpoints  🔐 (admin only)

### POST /admin/doctors
Create a full doctor profile (User + Doctor records).
```json
{ "username", "email", "password", "first_name", "last_name", "phone",
  "specialization", "bio", "working_hours_start", "working_hours_end", "slot_duration" }
```

### GET /admin/appointments
All appointments with patient, doctor, symptom, and post-visit note details.

### POST /admin/doctors/:doctorId/leave
```json
{ "leave_date": "2024-12-25", "reason": "Holiday" }
```
Auto-cancels conflicting appointments and notifies affected patients.

### DELETE /admin/doctors/:doctorId/leave/:leaveId
Remove a leave record.

### GET /admin/doctors/:doctorId/leave
List all leave days for a doctor.
