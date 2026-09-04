import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stamiox?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'stamiox_super_secret_jwt_key_2026_rubber_stamp_studio',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  trialDurationDays: 90, // 3 Months Free Trial
};
