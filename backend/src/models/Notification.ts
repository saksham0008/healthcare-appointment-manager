import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class Notification extends Model {
  public id!: number;
  public user_id!: number;
  public appointment_id!: number;
  public notification_type!: string;
  public message!: string;
  public email_status!: 'pending' | 'sent' | 'failed';
  public calendar_event_id!: string;
}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    appointment_id: { type: DataTypes.INTEGER },
    notification_type: { type: DataTypes.STRING(50), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    email_status: { type: DataTypes.ENUM('pending', 'sent', 'failed'), defaultValue: 'pending' },
    calendar_event_id: { type: DataTypes.STRING(255) },
  },
  { sequelize, tableName: 'notifications', timestamps: false }
);

export default Notification;