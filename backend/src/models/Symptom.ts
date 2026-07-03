import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class Symptom extends Model {
  public id!: number;
  public appointment_id!: number;
  public symptom_description!: string;
  public urgency_level!: 'Low' | 'Medium' | 'High';
  public chief_complaint!: string;
  public suggested_questions!: string[];
}

Symptom.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    appointment_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    symptom_description: { type: DataTypes.TEXT, allowNull: false },
    urgency_level: { type: DataTypes.ENUM('Low', 'Medium', 'High') },
    chief_complaint: { type: DataTypes.STRING(255) },
    suggested_questions: { type: DataTypes.JSON },
  },
  { sequelize, tableName: 'symptoms', timestamps: false }
);

export default Symptom;