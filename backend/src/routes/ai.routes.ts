import { Router } from 'express';
import { generateStampController, refineStampController } from '../controllers/ai.controller';

const router = Router();

// POST /api/v1/ai/generate-stamp
router.post('/generate-stamp', generateStampController);

// POST /api/v1/ai/refine-stamp
router.post('/refine-stamp', refineStampController);

export default router;
