import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.service';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Any mobile number → international E.164 form ("+919876543210", "+971501234567"), or null.
 *  - "+971 50 123 4567"            → +971501234567 (full number typed)
 *  - ("50 123 4567", dial "+971")  → +971501234567 (number + chosen country)
 *  - "98765 43210" (no country)    → +919876543210 (India by default)
 * India (+91) must be 10 digits starting 6-9; other countries 6–13 digits after the code.
 */
export const normalizeMobile = (raw: unknown, dial?: unknown): string | null => {
  const text = String(raw ?? '').trim();
  let full: string;
  if (text.startsWith('+') || text.startsWith('00')) {
    full = text.replace(/^00/, '').replace(/\D/g, '');
  } else {
    let national = text.replace(/\D/g, '').replace(/^0+/, '');
    const code = String(dial ?? '').replace(/\D/g, '');
    if (code) full = code + national;
    else if (national.length === 12 && national.startsWith('91')) full = national;
    else full = '91' + national; // no country given → India
  }
  if (full.startsWith('91')) return /^91[6-9]\d{9}$/.test(full) ? '+' + full : null;
  return /^[1-9]\d{7,14}$/.test(full) ? '+' + full : null;
};
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;

const publicUser = (user: any) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  username: user.username,
  mobile: user.mobile,
  company: user.company,
  role: user.role,
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, company, mobile: rawMobile, countryCode, username: rawUsername } = req.body;
    let user;

    if (rawMobile !== undefined || rawUsername !== undefined) {
      // ── mobile number + username + password ──
      const mobile = normalizeMobile(rawMobile, countryCode);
      const username = String(rawUsername ?? '').trim();
      if (!mobile) {
        return res.status(400).json({ success: false, field: 'mobile', message: String(countryCode ?? '+91').replace(/\D/g, '') === '91' ? 'Enter a valid 10-digit mobile number' : 'Enter a valid mobile number for the selected country' });
      }
      if (!USERNAME_RE.test(username)) {
        return res.status(400).json({ success: false, field: 'username', message: 'Username must be 3–20 letters, numbers, _ or .' });
      }
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ success: false, field: 'password', message: 'Password must be at least 6 characters' });
      }
      if (await db.findUserByMobile(mobile)) {
        return res.status(409).json({ success: false, field: 'mobile', message: 'This mobile number is already registered — please log in' });
      }
      if (await db.findUserByUsername(username)) {
        return res.status(409).json({ success: false, field: 'username', message: 'This username is taken — try another' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      user = await db.createUser({
        email: `${username.toLowerCase()}@users.stamiox.local`,
        passwordHash,
        name: username,
        mobile,
        username,
      });
    } else {
      // ── legacy email registration ──
      if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }
      const existingUser = await db.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already registered' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      user = await db.createUser({ email, passwordHash, name, company });
    }

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
      user: publicUser(user),
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
    const { email, password, identifier } = req.body;
    const who = String(identifier ?? email ?? '').trim();

    if (!who || !password) {
      return res.status(400).json({ success: false, message: 'Enter your mobile number or username, and your password' });
    }

    // a mobile number, a username, or (older accounts) an email
    // full number (+971…), an Indian 10-digit number, or just the local digits of any country
    const mobile = normalizeMobile(who);
    const digits = who.replace(/[\s-]/g, '');
    const user =
      (mobile && (await db.findUserByMobile(mobile))) ||
      (/^\d{6,15}$/.test(digits) ? await db.findUserByLocalMobile(digits.replace(/^0+/, '')) : null) ||
      (await db.findUserByUsername(who)) ||
      (who.includes('@') ? await db.findUserByEmail(who) : null);
    const isMatch = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Wrong mobile number / username or password' });
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
      user: publicUser(user),
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
      user: publicUser(user),
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
