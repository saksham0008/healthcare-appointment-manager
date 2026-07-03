# System Design – Healthcare Appointment & Follow-up Manager

## Overview
A full-stack clinic management platform with three portals: Patient, Doctor, and Admin. Built with Node.js/Express/TypeScript backend, React frontend, and SQLite via Sequelize ORM.

## Double-Booking Prevention
The primary defence is a **database-level unique constraint** on `(doctor_id, appointment_time)` in the appointments table. Even if two requests arrive simultaneously, the database rejects the second insert with a unique violation, which the API maps to HTTP 409. At the application layer, a pre-check query runs first so users receive a meaningful error before the DB constraint fires. Each booking also receives a `slot_lock_id` (UUID) and `slot_lock_expires_at` timestamp (5 minutes) that can be used to hold a slot during a multi-step booking flow without permanently committing it.

## Doctor Leave Conflict Handling
When an admin marks a doctor on leave for a specific date:
1. The system queries all `booked` or `confirmed` appointments for that doctor on that date.
2. Each found appointment is automatically cancelled (status → `cancelled`).
3. For every affected appointment, a `leave_notification` record is created and a cancellation email is dispatched to the patient.
4. All operations are wrapped in per-appointment try/catch so a single email failure does not roll back other cancellations.
5. The admin API response includes `affectedAppointmentsCount` for visibility.

## Slot Hold Mechanism
When a patient selects a slot, the booking endpoint immediately creates an appointment record with `slot_lock_id` and `slot_lock_expires_at = now + 5 minutes`. This prevents another patient from booking the same slot while the first is submitting the symptom form. The lock expires if the booking is not confirmed within the window. A future cleanup job can release stale locks.

## Notification Failure Handling
The notification service follows a store-then-send pattern:
- A `Notification` record with `email_status = 'pending'` is persisted **before** the email is sent.
- If sending succeeds, status updates to `'sent'`. If it fails, status becomes `'failed'`.
- The background reminder job (runs every hour) calls `retryFailedEmails()`, which finds all `'failed'` notifications and re-attempts delivery with a new email payload.
- LLM failures (pre-visit or post-visit summary) are fully isolated — the appointment or post-visit note is still saved with the raw symptom/notes text, and the system returns a graceful degraded response rather than a 500 error.

## LLM Integration
- **Pre-visit**: On booking, if symptoms are provided, the LLM analyses them and returns `urgencyLevel`, `chiefComplaint`, and `suggestedQuestions`. These are stored in the `symptoms` table for the doctor to review before the visit. LLM is called with the exact prompt: *"Analyse these symptoms and return: urgency level (Low/Medium/High), chief complaint, and three suggested questions for the doctor."*
- **Post-visit**: After the doctor submits clinical notes, the LLM converts them into a patient-friendly summary with medication schedule. Stored in `post_visit_notes.patient_friendly_summary`.
- If the API key is absent or the call fails, the system falls back to the raw input.

## Background Job
A Node.js `setInterval` job runs hourly:
1. Finds appointments within a 24h ± 30min window → sends reminder emails (tracks via Notification table to avoid duplicates).
2. Finds medications linked to completed appointments with `reminder_sent_at = null` → sends medication reminder emails, then stamps `reminder_sent_at`.
3. Calls `retryFailedEmails()` to retry any previously failed email sends.

## Database Schema
Key tables: `users`, `doctors`, `patients`, `appointments` (unique on doctor+time), `doctor_leaves` (unique on doctor+date), `symptoms`, `post_visit_notes`, `medications`, `notifications`.

## Security
- All passwords hashed with bcryptjs (salt rounds: 10).
- JWT authentication with role-based middleware (`patient`, `doctor`, `admin`).
- Admin endpoints protected by both `authMiddleware` and `roleMiddleware(['admin'])`.
- Environment variables for all secrets; no secrets in source code.
