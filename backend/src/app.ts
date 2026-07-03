import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { sequelize } from './models';
import authRoutes from './routes/authRoutes';
import doctorRoutes from './routes/doctorRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middleware/errorHandler';
import { startReminderJob } from './jobs/reminderJob';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Healthcare Appointment Management System API' });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: '✅ Backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

// Global error handler – must be last middleware
app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');

    startReminderJob();

    app.listen(config.PORT, '127.0.0.1', () => {
      console.log(`✅ Server running on http://127.0.0.1:${config.PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
