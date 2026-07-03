import sequelize from '../config/db';
import User from './User';
import Doctor from './Doctor';
import Patient from './Patient';
import Appointment from './Appointment';
import Symptom from './Symptom';
import PostVisitNote from './PostVisitNote';
import Notification from './Notification';
import DoctorLeave from './DoctorLeave';
import Medication from './Medication';

// User ↔ Doctor / Patient
User.hasOne(Doctor, { foreignKey: 'user_id', as: 'doctorProfile' });
User.hasOne(Patient, { foreignKey: 'user_id', as: 'patientProfile' });
Doctor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Patient.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Patient / Doctor ↔ Appointment
Patient.hasMany(Appointment, { foreignKey: 'patient_id', as: 'appointments' });
Doctor.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

// Appointment ↔ Symptom
Appointment.hasOne(Symptom, { foreignKey: 'appointment_id', as: 'symptom' });
Symptom.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// Appointment ↔ PostVisitNote
Appointment.hasOne(PostVisitNote, { foreignKey: 'appointment_id', as: 'postVisitNote' });
PostVisitNote.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// User / Appointment ↔ Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Appointment.hasMany(Notification, { foreignKey: 'appointment_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// Doctor ↔ DoctorLeave
Doctor.hasMany(DoctorLeave, { foreignKey: 'doctor_id', as: 'leaves' });
DoctorLeave.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

// PostVisitNote ↔ Medication
PostVisitNote.hasMany(Medication, { foreignKey: 'post_visit_note_id', as: 'medications' });
Medication.belongsTo(PostVisitNote, { foreignKey: 'post_visit_note_id', as: 'postVisitNote' });

export {
  sequelize,
  User,
  Doctor,
  Patient,
  Appointment,
  Symptom,
  PostVisitNote,
  Notification,
  DoctorLeave,
  Medication,
};
