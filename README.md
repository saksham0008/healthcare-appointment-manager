# Healthcare Appointment & Follow-up Manager

![React](https://img.shields.io/badge/React-17-61DAFB?logo=react&logoColor=white)

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)

![OpenAI](https://img.shields.io/badge/OpenAI-GPT-10A37F?logo=openai&logoColor=white)

![Deployment](https://img.shields.io/badge/Deployment-Netlify%20%7C%20Render-success)

![License](https://img.shields.io/badge/License-MIT-blue)

## Live Demo

**Frontend (Netlify):**  
https://healthcare-appointment-management.netlify.app

**Backend API (Render):**  
https://healthcare-backend-yj04.onrender.com

**GitHub Repository:**  
https://github.com/saksham0008/healthcare-appointment-manager

## Key Highlights

- Full-stack healthcare appointment and follow-up management platform
- Multi-role authentication (Patient, Doctor, and Admin)
- AI-powered symptom analysis using OpenAI
- AI-generated post-visit summaries
- Doctor appointment booking and management
- Google Calendar integration for appointment scheduling
- SendGrid email notifications and reminders
- PostgreSQL database using Neon Cloud
- RESTful API built with Express and TypeScript
- Redux Toolkit for frontend state management
- Responsive React frontend
- Deployed using Netlify (Frontend) and Render (Backend)

A full-stack clinic management platform with separate portals for **Patients**, **Doctors**, and **Admins**.

## Features
- Patient registration, login, doctor search by specialisation, slot booking
- Symptom form with **LLM-generated pre-visit summary** (urgency level, chief complaint, suggested questions)
- Doctor portal: view patient symptom summaries, submit post-visit notes
- **LLM-generated patient-friendly post-visit summary** with medication schedule
- Email notifications via SendGrid: booking confirmation, reminders, cancellations
- **Google Calendar** events created/updated/deleted on booking changes
- Medication reminders via background job
- Admin: create doctor profiles, manage leave days (auto-cancels bookings & notifies patients)
- Double-booking prevention via DB unique constraint + application-level check

---

## Tech Stack
- **Backend**: Node.js, Express, TypeScript, Sequelize ORM, PostgreSQL
- **Frontend**: React 17, TypeScript, Redux Toolkit, React Router v5, Axios
- **Email**: SendGrid
- **Calendar**: Google Calendar API (OAuth 2.0)
- **LLM**: OpenAI GPT (graceful degradation when key absent)

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <repo-url>
cd healthcare-appointment-manager

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `backend/.env` and fill in values:

```bash
cp .env.example backend/.env
```

Required for full functionality:
- `JWT_SECRET` — any strong random string
- `SENDGRID_API_KEY` + `SENDER_EMAIL` — for emails
- `OPENAI_API_KEY` — for LLM summaries
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — for calendar events

The app **works without** any external API keys; those features degrade gracefully.

### 3. Database Setup

The app uses **PostgreSQL**. You need a PostgreSQL database before running the backend.

#### Option A — Local PostgreSQL
1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Create a database: `createdb healthcare_db`
3. Set in `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/healthcare_db
   ```

#### Option B — Free Cloud PostgreSQL (no install needed)

| Provider | Free Tier | Notes |
|---|---|---|
| **[Neon.tech](https://neon.tech)** *(recommended)* | 3 GB storage, no credit card | Serverless PostgreSQL |
| **[Supabase](https://supabase.com)** | 500 MB | Full Postgres |
| **[Railway](https://railway.app)** | Free tier | Simple setup |
| **[ElephantSQL](https://www.elephantsql.com)** | 20 MB | Classic managed PG |

After creating a database on any of the above, copy the connection string into `backend/.env`:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

> All tables are auto-created via `sequelize.sync({ alter: true })` on server start — no manual migration needed.

#### Render Deployment
Add `DATABASE_URL` as an environment variable in your Render service, pointing to any of the cloud providers above.

### 4. Run

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm start
```

### 5. Create Admin User

Register via API (no frontend admin registration — by design):
```bash
curl -X POST http://localhost:3001/api/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@clinic.com","password":"Admin123","role":"admin"}'
```
Then update the role directly in your PostgreSQL database:
```sql
UPDATE users SET role='admin' WHERE email='admin@clinic.com';
```

---

## Database Schema
See `db/schema.sql`. Tables: `users`, `doctors`, `patients`, `appointments`, `doctor_leaves`, `symptoms`, `post_visit_notes`, `medications`, `notifications`.

The database is auto-created via `sequelize.sync({ alter: true })` on server start — no manual migration needed for development.

---

## LLM Prompts

### Pre-visit
```
Analyse these patient symptoms and provide:
1. Urgency level (Low/Medium/High)
2. Chief complaint (brief summary)
3. Three suggested questions for the doctor

Symptoms: <symptoms>

Respond in JSON format: { "urgencyLevel": "...", "chiefComplaint": "...", "suggestedQuestions": [...] }
```

### Post-visit
```
Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps:

Clinical Notes: <notes>
Prescription: <prescription>
```

---

## Google Calendar Setup

See `docs/google-calendar-setup.md` for detailed OAuth 2.0 setup steps.

Quick summary:
1. Create a project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google Calendar API**
3. Create OAuth 2.0 credentials (Web Application)
4. Add `http://localhost:3001/api/auth/google/callback` as an authorised redirect URI
5. Copy Client ID and Secret to `backend/.env`
6. Patients pass their OAuth access token as `patient_calendar_token` in the booking request

---

## API Documentation
See `docs/api.md` for all endpoints, request/response formats, and auth requirements.

## System Design
See `docs/system-design.md` for architecture decisions around double-booking prevention, leave conflict handling, slot hold mechanism, and notification failure handling.

---

## Project Structure
```
backend/src/
  config/         env, db, email, llm, calendar
  controllers/    auth, doctor, appointment, admin
  jobs/           reminderJob (hourly background job)
  middleware/     auth, errorHandler
  models/         User, Doctor, Patient, Appointment, DoctorLeave,
                  Symptom, PostVisitNote, Medication, Notification
  routes/         auth, doctor, appointment, admin
  services/       notificationService, calendarService

frontend/src/
  components/     Navbar, PrivateRoute
  hooks/          useAuth
  pages/
    patient/      DoctorSearch, BookAppointment, MyAppointments, AppointmentDetail
    doctor/       Dashboard, PostVisitForm
    admin/        Dashboard, CreateDoctor, ManageLeaves
  services/       api.ts (all Axios calls)
  store/          Redux store + authSlice
  types/          TypeScript interfaces
```
---

## 📸 Screenshots

### Landing Page
![Landing Page](screenshots/landing-page.png)

### Find Doctors
![Find Doctors](screenshots/find-doctors.png)

### Book Appointment
![Book Appointment](screenshots/book-appointments.png)

### My Appointments
![My Appointments](screenshots/my-appointments.png)

### Appointment Details
![Appointment Details](screenshots/appointment-details.png)

### Doctor Dashboard
![Doctor Dashboard](screenshots/doctor-dashboard.png)

### Post-Visit Notes
![Post Visit Notes](screenshots/post-visit-notes.png)

### Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)

### Manage Doctor Leaves
![Manage Doctor Leaves](screenshots/manage-doctor-leaves.png)
