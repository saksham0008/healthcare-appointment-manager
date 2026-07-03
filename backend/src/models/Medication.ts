import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class Medication extends Model {
  public id!: number;
  public post_visit_note_id!: number;
  public medication_name!: string;
  public dosage!: string;
  public frequency!: string;
  public duration_days!: number;
  public reminder_sent_at!: Date | null;
}

Medication.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    post_visit_note_id: { type: DataTypes.INTEGER, allowNull: false },
    medication_name: { type: DataTypes.STRING(255), allowNull: false },
    dosage: { type: DataTypes.STRING(100), allowNull: false },
    frequency: { type: DataTypes.STRING(100), allowNull: false },
    duration_days: { type: DataTypes.INTEGER, allowNull: false },
    reminder_sent_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'medications',
    timestamps: false,
  }
);

export default Medication;
