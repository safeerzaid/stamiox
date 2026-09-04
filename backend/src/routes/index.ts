import { Router } from 'express';
import { register, login, demoLogin, getMe } from '../controllers/auth.controller';
import { getPlans, getSubscriptionStatus, upgradeSubscription, cancelSubscription } from '../controllers/subscription.controller';
import { getTemplates, getTemplateById } from '../controllers/template.controller';
import {
  getUserProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  duplicateProject,
} from '../controllers/project.controller';
import { getCliparts } from '../controllers/clipart.controller';
import { exportStampPdf, sanitizeAndValidateSvg } from '../controllers/export.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';
import aiRoutes from './ai.routes';

const router = Router();

// --- Auth Routes ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/demo-login', demoLogin);
router.get('/auth/me', authenticateToken, getMe);

// --- Subscription Routes ---
router.get('/subscriptions/plans', getPlans);
router.get('/subscriptions/status', authenticateToken, getSubscriptionStatus);
router.post('/subscriptions/upgrade', authenticateToken, upgradeSubscription);
router.post('/subscriptions/cancel', authenticateToken, cancelSubscription);

// --- Templates Routes ---
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplateById);

// --- Project Routes (Cloud Stamp Designs) ---
router.get('/projects', authenticateToken, getUserProjects);
router.get('/projects/:id', optionalAuth, getProjectById);
router.post('/projects', authenticateToken, createProject);
router.put('/projects/:id', authenticateToken, updateProject);
router.delete('/projects/:id', authenticateToken, deleteProject);
// --- Clipart Library ---
router.get('/cliparts', getCliparts);

// --- Export & Laser Utilities ---
router.post('/export/pdf', exportStampPdf);
router.post('/export/validate', sanitizeAndValidateSvg);

// --- AI Stamp Generator & Copilot ---
router.use('/ai', aiRoutes);

export default router;
