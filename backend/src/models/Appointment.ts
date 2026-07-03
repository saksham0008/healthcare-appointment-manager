import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class Appointment extends Model {
  public id!: number;
  public patient_id!: number;
  public doctor_id!: number;
  public appointment_time!: Date;
  public status!: 'booked' | 'confirmed' | 'completed' | 'cancelled';
  public slot_lock_id!: string;
  public slot_lock_expires_at!: Date;
  public google_calendar_event_id!: string | null;
}

Appointment.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    doctor_id: { type: DataTypes.INTEGER, allowNull: false },
    appointment_time: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM('booked', 'confirmed', 'completed', 'cancelled'),
      defaultValue: 'booked',
    },
    slot_lock_id: { type: DataTypes.STRING(255) },
    slot_lock_expires_at: { type: DataTypes.DATE },
    google_calendar_event_id: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    tableName: 'appointments',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['doctor_id', 'appointment_time'],
      },
    ],
  }
);

export default Appointment;
