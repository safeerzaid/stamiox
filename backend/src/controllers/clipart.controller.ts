import { Request, Response } from 'express';
import { db } from '../services/db.service';

export const getCliparts = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const cliparts = await db.getAllCliparts(category as string | undefined);
    return res.json({
      success: true,
      count: cliparts.length,
      cliparts,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve cliparts' });
  }
};
