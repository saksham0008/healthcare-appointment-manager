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

// Allow requests from the frontend (local + deployed)
const allowedOrigins = [
  'http://localhost:3000',
  config.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));

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

    // Bind to 0.0.0.0 in production (required by Render), 127.0.0.1 in dev
    const host = config.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
    app.listen(config.PORT, host, () => {
      console.log(`✅ Server running on http://${host}:${config.PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
