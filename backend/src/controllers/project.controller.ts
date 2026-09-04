import { Response } from 'express';
import { db } from '../services/db.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const getUserProjects = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const projects = await db.getProjectsByUserId(req.user.id);
    return res.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve projects' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await db.getProjectById(id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Public projects or projects owned by user
    if (!project.isPublic && (!req.user || req.user.id !== project.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied to this project' });
    }

    return res.json({
      success: true,
      project,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve project' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      title,
      description,
      category = 'custom',
      shape = 'ROUND',
      widthMm = 40,
      heightMm = 40,
      inkColor = '#1e3a8a',
      elementsJson = [],
      thumbnailSvg,
      isPublic = false,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Project title is required' });
    }

    const newProject = await db.createProject({
      userId: req.user.id,
      title,
      description,
      category,
      shape,
      widthMm: parseFloat(widthMm),
      heightMm: parseFloat(heightMm),
      inkColor,
      elementsJson,
      thumbnailSvg,
      isTemplate: false,
      isPublic: Boolean(isPublic),
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: newProject,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const existing = await db.getProjectById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (existing.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update your own projects' });
    }

    const updated = await db.updateProject(id, req.body);
    return res.json({
      success: true,
      message: 'Project updated successfully',
      project: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const success = await db.deleteProject(id, req.user.id);

    if (!success) {
      return res.status(404).json({ success: false, message: 'Project not found or not owned by you' });
    }

    return res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
};

export const duplicateProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const existing = await db.getProjectById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const duplicate = await db.createProject({
      userId: req.user.id,
      title: `${existing.title} (Copy)`,
      description: existing.description,
      category: existing.category,
      shape: existing.shape,
      widthMm: existing.widthMm,
      heightMm: existing.heightMm,
      inkColor: existing.inkColor,
      elementsJson: existing.elementsJson,
      thumbnailSvg: existing.thumbnailSvg,
      isTemplate: false,
      isPublic: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Project duplicated successfully',
      project: duplicate,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to duplicate project' });
  }
};
