import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class DoctorLeave extends Model {
  public id!: number;
  public doctor_id!: number;
  public leave_date!: string;
  public reason!: string | null;
}

DoctorLeave.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    doctor_id: { type: DataTypes.INTEGER, allowNull: false },
    leave_date: { type: DataTypes.DATEONLY, allowNull: false },
    reason: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    tableName: 'doctor_leaves',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['doctor_id', 'leave_date'],
      },
    ],
  }
);

export default DoctorLeave;
