import express from 'express';
import cors from 'cors';
import { config } from './config';
import apiRoutes from './routes';
import { db } from './services/db.service';

const app = express();

// Middleware
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Stamiox Backend API',
    timestamp: new Date().toISOString(),
    trialDurationDays: config.trialDurationDays,
  });
});

// API Routes
app.use('/api', apiRoutes);
app.use('/api/v1', apiRoutes);

// Error Handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server (after the database is ready)
db.init()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`=============================================`);
      console.log(`🚀 Stamiox Backend Server running on port ${config.port}`);
      console.log(`🌐 Health check: http://localhost:${config.port}/health`);
      console.log(`🎯 Free Trial: 90 Days (3 Months) Enabled`);
      console.log(`=============================================`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  });
