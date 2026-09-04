import { Request, Response } from 'express';
import { db } from '../services/db.service';

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { category, shape, search } = req.query;
    const templates = await db.getAllTemplates(
      category as string | undefined,
      shape as string | undefined,
      search as string | undefined
    );

    return res.json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve templates' });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await db.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    return res.json({
      success: true,
      template,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve template' });
  }
};
