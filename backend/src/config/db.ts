import { Sequelize } from 'sequelize';
import { config } from './env';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.DB_STORAGE,
  logging: false,
});

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize;