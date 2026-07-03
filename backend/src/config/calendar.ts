import { google } from 'googleapis';
import { config } from './env';

const oauth2Client = new google.auth.OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_REDIRECT_URI
);

interface CalendarEvent {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
}

/**
 * Create Google Calendar event
 */
export const createCalendarEvent = async (accessToken: string, event: CalendarEvent): Promise<string | null> => {
  try {
    if (!config.GOOGLE_CLIENT_ID) {
      console.warn('⚠️  Google Calendar not configured');
      return null;
    }

    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.startTime.toISOString() },
        end: { dateTime: event.endTime.toISOString() },
        attendees: event.attendees?.map((email) => ({ email })),
      },
    });

    console.log(`✅ Calendar event created: ${response.data.id}`);
    return response.data.id || null;
  } catch (error) {
    console.error('❌ Error creating calendar event:', error);
    return null;
  }
};

/**
 * Update Google Calendar event
 */
export const updateCalendarEvent = async (accessToken: string, eventId: string, event: CalendarEvent): Promise<boolean> => {
  try {
    if (!config.GOOGLE_CLIENT_ID) {
      console.warn('⚠️  Google Calendar not configured');
      return false;
    }

    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.startTime.toISOString() },
        end: { dateTime: event.endTime.toISOString() },
      },
    });

    console.log(`✅ Calendar event updated: ${eventId}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating calendar event:', error);
    return false;
  }
};

/**
 * Delete Google Calendar event
 */
export const deleteCalendarEvent = async (accessToken: string, eventId: string): Promise<boolean> => {
  try {
    if (!config.GOOGLE_CLIENT_ID) {
      console.warn('⚠️  Google Calendar not configured');
      return false;
    }

    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    console.log(`✅ Calendar event deleted: ${eventId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting calendar event:', error);
    return false;
  }
};

export default { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent };