import { Op } from 'sequelize';
import { Appointment, Patient, Doctor, User, Notification, Medication, PostVisitNote } from '../models';
import {
  sendAppointmentReminder,
  retryFailedEmails,
} from '../services/notificationService';
import { sendEmail } from '../config/email';

const HOUR_MS = 60 * 60 * 1000;
const HOURS_24_MS = 24 * HOUR_MS;

const sendAppointmentReminders = async (): Promise<void> => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + HOURS_24_MS - 30 * 60 * 1000); // 23h30 from now
    const windowEnd = new Date(now.getTime() + HOURS_24_MS + 30 * 60 * 1000);   // 24h30 from now

    const upcomingAppointments = await Appointment.findAll({
      where: {
        status: { [Op.in]: ['booked', 'confirmed'] },
        appointment_time: { [Op.between]: [windowStart, windowEnd] },
      },
    });

    for (const appointment of upcomingAppointments) {
      try {
        // Check if a reminder notification was already sent for this appointment
        const existingReminder = await Notification.findOne({
          where: {
            appointment_id: appointment.id,
            notification_type: 'reminder',
            email_status: { [Op.in]: ['sent', 'pending'] },
          },
        });

        if (existingReminder) {
          continue; // Already reminded
        }

        const patient = await Patient.findByPk(appointment.patient_id, {
          include: [{ model: User, as: 'user' }],
        });
        const doctor = await Doctor.findByPk(appointment.doctor_id, {
          include: [{ model: User, as: 'user' }],
        });

        if (!patient || !doctor) {
          continue;
        }

        const patientUser = (patient as any).user as User | null;
        const doctorUser = (doctor as any).user as User | null;

        if (patientUser && doctorUser) {
          await sendAppointmentReminder(appointment, patientUser, doctorUser);
          console.log(`✅ Reminder sent for appointment ${appointment.id}`);
        }
      } catch (innerError) {
        console.error(`❌ Failed to send reminder for appointment ${appointment.id}:`, innerError);
      }
    }
  } catch (error) {
    console.error('❌ Error in sendAppointmentReminders job:', error);
  }
};

const sendMedicationReminders = async (): Promise<void> => {
  try {
    // Find medications with no reminder sent, whose appointment is 'completed'
    const pendingMedications = await Medication.findAll({
      where: { reminder_sent_at: null },
      include: [
        {
          model: PostVisitNote,
          as: 'postVisitNote',
          required: true,
          include: [
            {
              model: Appointment,
              as: 'appointment',
              required: true,
              where: { status: 'completed' },
              include: [
                {
                  model: Patient,
                  as: 'patient',
                  required: true,
                  include: [{ model: User, as: 'user', required: true }],
                },
              ],
            },
          ],
        },
      ],
    });

    for (const medication of pendingMedications) {
      try {
        const postVisitNote = (medication as any).postVisitNote;
        const appointment = postVisitNote?.appointment;
        const patient = appointment?.patient;
        const patientUser: User | null = patient?.user ?? null;

        if (!patientUser) {
          continue;
        }

        const subject = 'Medication Reminder';
        const html = `
          <h2>Medication Reminder</h2>
          <p>Dear ${patientUser.first_name || patientUser.email},</p>
          <p>This is a reminder to take your medication as prescribed:</p>
          <ul>
            <li><strong>Medication:</strong> ${medication.medication_name}</li>
            <li><strong>Dosage:</strong> ${medication.dosage}</li>
            <li><strong>Frequency:</strong> ${medication.frequency}</li>
            <li><strong>Duration:</strong> ${medication.duration_days} days</li>
          </ul>
          <p>Please follow your doctor's instructions carefully.</p>
        `;

        const success = await sendEmail({ to: patientUser.email, subject, html });

        if (success) {
          await medication.update({ reminder_sent_at: new Date() });
          console.log(`✅ Medication reminder sent for medication ${medication.id}`);
        } else {
          console.warn(`⚠️  Failed to send medication reminder for medication ${medication.id}`);
        }
      } catch (innerError) {
        console.error(`❌ Error processing medication reminder ${medication.id}:`, innerError);
      }
    }
  } catch (error) {
    console.error('❌ Error in sendMedicationReminders job:', error);
  }
};

const runReminderJob = async (): Promise<void> => {
  console.log('🔔 Running reminder job...');
  await sendAppointmentReminders();
  await sendMedicationReminders();
  await retryFailedEmails();
  console.log('✅ Reminder job complete.');
};

export const startReminderJob = (): void => {
  // Run immediately on startup, then every hour
  runReminderJob();
  setInterval(runReminderJob, HOUR_MS);
  console.log('⏰ Reminder job scheduled (every 1 hour)');
};

export default startReminderJob;
