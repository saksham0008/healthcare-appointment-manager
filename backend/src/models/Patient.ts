import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class Patient extends Model {
  public id!: number;
  public user_id!: number;
}

Patient.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  },
  { sequelize, tableName: 'patients', timestamps: false }
);

export default Patient;