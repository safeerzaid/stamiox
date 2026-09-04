import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../services/db.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token is required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string; role: string };
    const user = await db.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string; role: string };
      const user = await db.findUserById(decoded.id);
      if (user) {
        req.user = { id: user.id, email: user.email, role: user.role };
      }
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
};
