import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class PostVisitNote extends Model {
  public id!: number;
  public appointment_id!: number;
  public clinical_notes!: string;
  public prescription!: string;
  public patient_friendly_summary!: string;
  public follow_up_date!: Date;
}

PostVisitNote.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    appointment_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    clinical_notes: { type: DataTypes.TEXT, allowNull: false },
    prescription: { type: DataTypes.TEXT },
    patient_friendly_summary: { type: DataTypes.TEXT },
    follow_up_date: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'post_visit_notes', timestamps: false }
);

export default PostVisitNote;