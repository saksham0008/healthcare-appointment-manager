# Google Calendar Integration — Setup Guide

This guide walks you through enabling Google Calendar so that appointment bookings automatically create calendar events for the patient.

> **Optional feature.** The app works fully without Google Calendar. Calendar creation only happens when the frontend passes a `patient_calendar_token` (OAuth access token) in the booking request. No token = no calendar call.

---

## How it works in this project

1. Patient authenticates with Google (OAuth 2.0) and the frontend receives an access token.
2. When the patient books an appointment, the frontend includes `patient_calendar_token` in the request body.
3. `backend/src/services/calendarService.ts` uses that token to call the Google Calendar API and creates an event on the patient's primary calendar.
4. The returned `patientEventId` is stored in `appointments.google_calendar_event_id` so the event can be deleted if the appointment is cancelled.

All calendar calls are wrapped in try/catch — a Calendar API failure never blocks the booking.

---

## Step 1 — Create a Google Cloud project

1. Open [console.cloud.google.com](https://console.cloud.google.com/).
2. Click the project selector → **New Project**.
3. Name it (e.g. `Healthcare Appointment Manager`) and click **Create**.

---

## Step 2 — Enable the Google Calendar API

1. In the left menu go to **APIs & Services → Library**.
2. Search for **Google Calendar API** and open it.
3. Click **Enable**.

---

## Step 3 — Create OAuth 2.0 credentials

1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID**.
3. If prompted, configure the **OAuth consent screen** first:
   - User type: **External**
   - App name, support email, developer contact — fill in anything.
   - Scopes: add `https://www.googleapis.com/auth/calendar.events`
   - Test users: add your own Google account.
4. Back on Create Credentials, set:
   - **Application type:** Web application
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** `http://localhost:3000/auth/google/callback`
5. Click **Create**. Copy the **Client ID** and **Client Secret**.

---

## Step 4 — Add credentials to backend `.env`

Open `backend/.env` and add:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

These variables are read by `backend/src/config/calendar.ts` to configure the OAuth2 client.

---

## Step 5 — Frontend OAuth flow (obtaining the access token)

The frontend must guide the patient through Google sign-in and retrieve an access token. A minimal approach using `@react-oauth/google`:

```tsx
import { useGoogleLogin } from '@react-oauth/google';

const login = useGoogleLogin({
  scope: 'https://www.googleapis.com/auth/calendar.events',
  onSuccess: (tokenResponse) => {
    // tokenResponse.access_token is what you pass as patient_calendar_token
    setPatientCalendarToken(tokenResponse.access_token);
  },
});
```

Pass the token when booking:

```ts
await bookAppointment({
  doctor_id: doctorId,
  appointment_time: appointmentTime,
  patient_id: user.id,
  symptoms: symptoms,
  patient_calendar_token: patientCalendarToken, // optional
});
```

---

## Step 6 — Test the integration

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm start`
3. Log in as a patient, complete the Google OAuth flow, then book an appointment.
4. Check your Google Calendar — a new event should appear.
5. Cancel the appointment in the app and verify the calendar event is removed.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `redirect_uri_mismatch` error | Ensure the redirect URI in Google Console exactly matches `GOOGLE_REDIRECT_URI` in `.env` |
| `invalid_grant` | Access tokens expire in ~1 hour. Re-authenticate to get a fresh token. |
| Event not created but booking works | Check backend logs for `❌ Failed to create calendar event`. Missing token or misconfigured credentials. |
| `insufficientPermissions` | Ensure the OAuth scope includes `https://www.googleapis.com/auth/calendar.events` |

---

## Environment variables reference

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Console |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Must match the URI registered in Google Console |

All three must be set in `backend/.env`. Without them the calendar feature is silently skipped — the app remains fully functional.
