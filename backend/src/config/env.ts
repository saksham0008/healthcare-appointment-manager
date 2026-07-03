import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  DB_DIALECT: process.env.DB_DIALECT || 'sqlite',
  DB_STORAGE: process.env.DB_STORAGE || './database.sqlite',

  JWT_SECRET: process.env.JWT_SECRET || 'your_secret_key',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',

  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  SENDER_EMAIL: process.env.SENDER_EMAIL || '',

  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-3.5-turbo',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export default config;