import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class Doctor extends Model {
  public id!: number;
  public user_id!: number;
  public specialization!: string;
  public bio!: string;
  public working_hours_start!: string;
  public working_hours_end!: string;
  public slot_duration!: number;
}

Doctor.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    specialization: { type: DataTypes.STRING(100), allowNull: false },
    bio: { type: DataTypes.TEXT },
    working_hours_start: { type: DataTypes.TIME, defaultValue: '09:00:00' },
    working_hours_end: { type: DataTypes.TIME, defaultValue: '17:00:00' },
    slot_duration: { type: DataTypes.INTEGER, defaultValue: 30 },
  },
  { sequelize, tableName: 'doctors', timestamps: false }
);

export default Doctor;