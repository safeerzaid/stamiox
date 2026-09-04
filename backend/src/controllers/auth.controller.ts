import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.service';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, company } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      email,
      passwordHash,
      name,
      company,
    });

    const subscription = await db.getSubscriptionByUserId(user.id);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtSecret, {
      expiresIn: '30d',
    });

    const now = new Date();
    const trialDaysLeft = subscription
      ? Math.max(0, Math.ceil((new Date(subscription.trialEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 90;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Enjoy your 3-Month Free Trial.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
      },
      subscription: {
        ...subscription,
        trialDaysLeft,
        isTrialActive: trialDaysLeft > 0,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const subscription = await db.getSubscriptionByUserId(user.id);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtSecret, {
      expiresIn: '30d',
    });

    const now = new Date();
    const trialDaysLeft = subscription
      ? Math.max(0, Math.ceil((new Date(subscription.trialEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
      },
      subscription: {
        ...subscription,
        trialDaysLeft,
        isTrialActive: trialDaysLeft > 0,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const demoLogin = async (_req: Request, res: Response) => {
  try {
    const demoUser = await db.findUserByEmail('demo@stamiox.com');
    if (!demoUser) {
      return res.status(404).json({ success: false, message: 'Demo user not found' });
    }

    const subscription = await db.getSubscriptionByUserId(demoUser.id);
    const token = jwt.sign({ id: demoUser.id, email: demoUser.email, role: demoUser.role }, config.jwtSecret, {
      expiresIn: '30d',
    });

    const now = new Date();
    const trialDaysLeft = subscription
      ? Math.max(0, Math.ceil((new Date(subscription.trialEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 90;

    return res.json({
      success: true,
      token,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        company: demoUser.company,
        role: demoUser.role,
      },
      subscription: {
        ...subscription,
        trialDaysLeft,
        isTrialActive: trialDaysLeft > 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Demo login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const subscription = await db.getSubscriptionByUserId(user.id);
    const now = new Date();
    const trialDaysLeft = subscription
      ? Math.max(0, Math.ceil((new Date(subscription.trialEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
      },
      subscription: {
        ...subscription,
        trialDaysLeft,
        isTrialActive: trialDaysLeft > 0 || subscription?.status === 'ACTIVE',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
  }
};
