import { sendEmail } from '../config/email';
import { Notification } from '../models';

interface AppointmentLike {
  id: number;
  appointment_time: Date;
  doctor_id: number;
  patient_id: number;
}

interface UserLike {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}

const MAX_RETRY_ATTEMPTS = 3;

const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const createNotificationRecord = async (
  userId: number,
  appointmentId: number | null,
  notificationType: string,
  message: string
): Promise<Notification> => {
  return Notification.create({
    user_id: userId,
    appointment_id: appointmentId,
    notification_type: notificationType,
    message,
    email_status: 'pending',
  });
};

const sendAndUpdateNotification = async (
  notification: Notification,
  email: string,
  subject: string,
  html: string
): Promise<void> => {
  const success = await sendEmail({ to: email, subject, html });
  await notification.update({ email_status: success ? 'sent' : 'failed' });
};

export const sendBookingConfirmation = async (
  appointment: AppointmentLike,
  patientUser: UserLike,
  doctorUser: UserLike
): Promise<void> => {
  try {
    const appointmentStr = formatDateTime(appointment.appointment_time);
    const doctorName = `${doctorUser.first_name || ''} ${doctorUser.last_name || ''}`.trim();
    const patientName = `${patientUser.first_name || ''} ${patientUser.last_name || ''}`.trim();

    const message = `Booking confirmation for appointment #${appointment.id} on ${appointmentStr}`;

    const notification = await createNotificationRecord(
      patientUser.id,
      appointment.id,
      'booking_confirmation',
      message
    );

    const subject = 'Appointment Booking Confirmation';
    const html = `
      <h2>Appointment Confirmed</h2>
      <p>Dear ${patientName || patientUser.email},</p>
      <p>Your appointment has been successfully booked.</p>
      <ul>
        <li><strong>Doctor:</strong> Dr. ${doctorName || doctorUser.email}</li>
        <li><strong>Date &amp; Time:</strong> ${appointmentStr}</li>
        <li><strong>Appointment ID:</strong> ${appointment.id}</li>
      </ul>
      <p>Please arrive 10 minutes early.</p>
    `;

    await sendAndUpdateNotification(notification, patientUser.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending booking confirmation:', error);
  }
};

export const sendCancellationNotification = async (
  appointment: AppointmentLike,
  patientUser: UserLike,
  doctorUser: UserLike
): Promise<void> => {
  try {
    const appointmentStr = formatDateTime(appointment.appointment_time);
    const doctorName = `${doctorUser.first_name || ''} ${doctorUser.last_name || ''}`.trim();
    const patientName = `${patientUser.first_name || ''} ${patientUser.last_name || ''}`.trim();

    const message = `Cancellation notice for appointment #${appointment.id} on ${appointmentStr}`;

    const notification = await createNotificationRecord(
      patientUser.id,
      appointment.id,
      'cancellation',
      message
    );

    const subject = 'Appointment Cancellation Notice';
    const html = `
      <h2>Appointment Cancelled</h2>
      <p>Dear ${patientName || patientUser.email},</p>
      <p>Your appointment has been cancelled.</p>
      <ul>
        <li><strong>Doctor:</strong> Dr. ${doctorName || doctorUser.email}</li>
        <li><strong>Date &amp; Time:</strong> ${appointmentStr}</li>
        <li><strong>Appointment ID:</strong> ${appointment.id}</li>
      </ul>
      <p>Please book a new appointment if needed.</p>
    `;

    await sendAndUpdateNotification(notification, patientUser.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending cancellation notification:', error);
  }
};

export const sendAppointmentReminder = async (
  appointment: AppointmentLike,
  patientUser: UserLike,
  doctorUser: UserLike
): Promise<void> => {
  try {
    const appointmentStr = formatDateTime(appointment.appointment_time);
    const doctorName = `${doctorUser.first_name || ''} ${doctorUser.last_name || ''}`.trim();
    const patientName = `${patientUser.first_name || ''} ${patientUser.last_name || ''}`.trim();

    const message = `Reminder: appointment #${appointment.id} is in 24 hours on ${appointmentStr}`;

    const notification = await createNotificationRecord(
      patientUser.id,
      appointment.id,
      'reminder',
      message
    );

    const subject = 'Appointment Reminder – 24 Hours';
    const html = `
      <h2>Appointment Reminder</h2>
      <p>Dear ${patientName || patientUser.email},</p>
      <p>This is a reminder that your appointment is in approximately 24 hours.</p>
      <ul>
        <li><strong>Doctor:</strong> Dr. ${doctorName || doctorUser.email}</li>
        <li><strong>Date &amp; Time:</strong> ${appointmentStr}</li>
        <li><strong>Appointment ID:</strong> ${appointment.id}</li>
      </ul>
      <p>Please arrive 10 minutes early.</p>
    `;

    await sendAndUpdateNotification(notification, patientUser.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending appointment reminder:', error);
  }
};

export const sendLeaveNotification = async (
  appointments: AppointmentLike[],
  patientUser: UserLike,
  doctorUser: UserLike,
  leaveDate: string
): Promise<void> => {
  try {
    const doctorName = `${doctorUser.first_name || ''} ${doctorUser.last_name || ''}`.trim();
    const patientName = `${patientUser.first_name || ''} ${patientUser.last_name || ''}`.trim();

    for (const appointment of appointments) {
      const appointmentStr = formatDateTime(appointment.appointment_time);
      const message = `Doctor leave notice: appointment #${appointment.id} on ${leaveDate} has been cancelled`;

      const notification = await createNotificationRecord(
        patientUser.id,
        appointment.id,
        'leave_notification',
        message
      );

      const subject = 'Appointment Cancelled – Doctor on Leave';
      const html = `
        <h2>Appointment Cancelled</h2>
        <p>Dear ${patientName || patientUser.email},</p>
        <p>We regret to inform you that Dr. ${doctorName || doctorUser.email} will be on leave on <strong>${leaveDate}</strong>.</p>
        <p>Your appointment scheduled for ${appointmentStr} (ID: ${appointment.id}) has been cancelled.</p>
        <p>Please book a new appointment at your earliest convenience. We apologise for any inconvenience.</p>
      `;

      await sendAndUpdateNotification(notification, patientUser.email, subject, html);
    }
  } catch (error) {
    console.error('❌ Error sending leave notification:', error);
  }
};

export const retryFailedEmails = async (): Promise<void> => {
  try {
    const failedNotifications = await Notification.findAll({
      where: { email_status: 'failed' },
    });

    for (const notification of failedNotifications) {
      try {
        // Retrieve associated user email via the notification's user_id
        const { User } = await import('../models');
        const user = await User.findByPk(notification.user_id);
        if (!user) {
          continue;
        }

        const success = await sendEmail({
          to: user.email,
          subject: 'Notification Retry',
          html: `<p>${notification.message}</p>`,
        });

        if (success) {
          await notification.update({ email_status: 'sent' });
          console.log(`✅ Retry successful for notification ${notification.id}`);
        } else {
          console.warn(`⚠️  Retry failed for notification ${notification.id}`);
        }
      } catch (innerError) {
        console.error(`❌ Error retrying notification ${notification.id}:`, innerError);
      }
    }
  } catch (error) {
    console.error('❌ Error in retryFailedEmails:', error);
  }
};

export default {
  sendBookingConfirmation,
  sendCancellationNotification,
  sendAppointmentReminder,
  sendLeaveNotification,
  retryFailedEmails,
};
