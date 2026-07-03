import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../config/calendar';
import { config } from '../config/env';

interface AppointmentLike {
  id: number;
  appointment_time: Date;
  doctor_id: number;
}

interface CalendarTokens {
  patientAccessToken?: string;
  doctorAccessToken?: string;
}

interface CalendarEventIds {
  patientEventId?: string | null;
  doctorEventId?: string | null;
}

const SLOT_DURATION_MINUTES = 30;

const buildCalendarEvent = (
  appointment: AppointmentLike,
  patientEmail: string,
  doctorEmail: string,
  doctorName: string
) => {
  const startTime = new Date(appointment.appointment_time);
  const endTime = new Date(startTime.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

  return {
    summary: `Medical Appointment with Dr. ${doctorName}`,
    description: `Healthcare appointment ID: ${appointment.id}`,
    startTime,
    endTime,
    attendees: [patientEmail, doctorEmail],
  };
};

export const createAppointmentEvent = async (
  patientAccessToken: string | null | undefined,
  doctorAccessToken: string | null | undefined,
  appointment: AppointmentLike,
  patientEmail: string,
  doctorEmail: string,
  doctorName: string
): Promise<CalendarEventIds | null> => {
  try {
    if (!config.GOOGLE_CLIENT_ID) {
      console.warn('⚠️  Google Calendar not configured, skipping event creation.');
      return null;
    }

    const calEvent = buildCalendarEvent(appointment, patientEmail, doctorEmail, doctorName);

    let patientEventId: string | null = null;
    let doctorEventId: string | null = null;

    if (patientAccessToken) {
      patientEventId = await createCalendarEvent(patientAccessToken, calEvent);
    }

    if (doctorAccessToken) {
      doctorEventId = await createCalendarEvent(doctorAccessToken, calEvent);
    }

    return { patientEventId, doctorEventId };
  } catch (error) {
    console.error('❌ Error creating appointment calendar events:', error);
    return null;
  }
};

export const updateAppointmentEvent = async (
  tokens: CalendarTokens,
  eventIds: CalendarEventIds,
  appointment: AppointmentLike,
  patientEmail: string,
  doctorEmail: string,
  doctorName: string
): Promise<void> => {
  try {
    if (!config.GOOGLE_CLIENT_ID) {
      console.warn('⚠️  Google Calendar not configured, skipping event update.');
      return;
    }

    const calEvent = buildCalendarEvent(appointment, patientEmail, doctorEmail, doctorName);

    if (tokens.patientAccessToken && eventIds.patientEventId) {
      await updateCalendarEvent(tokens.patientAccessToken, eventIds.patientEventId, calEvent);
    }

    if (tokens.doctorAccessToken && eventIds.doctorEventId) {
      await updateCalendarEvent(tokens.doctorAccessToken, eventIds.doctorEventId, calEvent);
    }
  } catch (error) {
    console.error('❌ Error updating appointment calendar events:', error);
  }
};

export const deleteAppointmentEvent = async (
  tokens: CalendarTokens,
  eventIds: CalendarEventIds
): Promise<void> => {
  try {
    if (!config.GOOGLE_CLIENT_ID) {
      console.warn('⚠️  Google Calendar not configured, skipping event deletion.');
      return;
    }

    if (tokens.patientAccessToken && eventIds.patientEventId) {
      await deleteCalendarEvent(tokens.patientAccessToken, eventIds.patientEventId);
    }

    if (tokens.doctorAccessToken && eventIds.doctorEventId) {
      await deleteCalendarEvent(tokens.doctorAccessToken, eventIds.doctorEventId);
    }
  } catch (error) {
    console.error('❌ Error deleting appointment calendar events:', error);
  }
};

export default {
  createAppointmentEvent,
  updateAppointmentEvent,
  deleteAppointmentEvent,
};
