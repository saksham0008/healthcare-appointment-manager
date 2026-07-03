import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, Patient, Doctor } from '../models/index';
import { config } from '../config/env';

export const registerPatient = async (req: Request, res: Response) => {
  try {
    const { username, email, password, first_name, last_name, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'patient',
      first_name,
      last_name,
      phone,
    });

    await Patient.create({ user_id: user.id });

    res.status(201).json({
      message: 'Patient registered successfully',
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

export const registerDoctor = async (req: Request, res: Response) => {
  try {
    const { username, email, password, first_name, last_name, phone, specialization, bio } = req.body;

    if (!username || !email || !password || !specialization) {
      return res.status(400).json({ message: 'Username, email, password, and specialization are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'doctor',
      first_name,
      last_name,
      phone,
    });

    await Doctor.create({
      user_id: user.id,
      specialization,
      bio,
    });

    res.status(201).json({
      message: 'Doctor registered successfully',
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const signOptions: SignOptions = {
      expiresIn: config.JWT_EXPIRY as SignOptions['expiresIn'],
    };

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      config.JWT_SECRET,
      signOptions
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};