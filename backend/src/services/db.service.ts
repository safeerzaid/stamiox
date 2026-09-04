import { STAMP_TEMPLATES, StampTemplateSeed } from '../data/templates';
import { CLIPARTS, ClipartSeed } from '../data/cliparts';
import bcrypt from 'bcryptjs';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  company?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionEntity {
  id: string;
  userId: string;
  plan: 'FREE_TRIAL' | 'MONTHLY_PRO' | 'YEARLY_PRO' | 'ENTERPRISE';
  status: 'TRIALING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  trialStartDate: Date;
  trialEndDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StampProjectEntity {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  shape: 'ROUND' | 'RECTANGULAR' | 'OVAL' | 'SQUARE' | 'CUSTOM';
  widthMm: number;
  heightMm: number;
  inkColor: string;
  elementsJson: any;
  thumbnailSvg?: string;
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory Database Store (with persistent seed data)
class DatabaseService {
  private users: Map<string, UserEntity> = new Map();
  private subscriptions: Map<string, SubscriptionEntity> = new Map();
  private projects: Map<string, StampProjectEntity> = new Map();
  private templates: Map<string, StampTemplateSeed> = new Map();
  private cliparts: Map<string, ClipartSeed> = new Map();

  constructor() {
    this.initSeedData();
  }

  private initSeedData() {
    // Populate templates
    STAMP_TEMPLATES.forEach((t) => this.templates.set(t.id, t));
    // Populate cliparts
    CLIPARTS.forEach((c) => this.cliparts.set(c.id, c));

    // Create default Demo User
    const demoId = 'user-demo-stamiox-001';
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days = 3 months
    const passwordHash = bcrypt.hashSync('password123', 10);

    const demoUser: UserEntity = {
      id: demoId,
      email: 'demo@stamiox.com',
      passwordHash,
      name: 'Alex Mercer (Demo)',
      company: 'Mercer Rubber Stamps & Engraving',
      role: 'USER',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(demoId, demoUser);

    const demoSubscription: SubscriptionEntity = {
      id: 'sub-demo-stamiox-001',
      userId: demoId,
      plan: 'FREE_TRIAL',
      status: 'TRIALING',
      trialStartDate: now,
      trialEndDate: trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.set(demoId, demoSubscription);

    // Initial demo project for the user
    const demoTemplate = STAMP_TEMPLATES[0];
    this.projects.set('project-demo-01', {
      id: 'project-demo-01',
      userId: demoId,
      title: 'Official Company Round Seal 40mm',
      description: 'Official seal design for Stamiox Global Enterprises',
      category: 'company',
      shape: 'ROUND',
      widthMm: demoTemplate.widthMm,
      heightMm: demoTemplate.heightMm,
      inkColor: demoTemplate.defaultData.inkColor,
      elementsJson: demoTemplate.defaultData.elements,
      isTemplate: false,
      isPublic: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // --- Users ---
  async findUserByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  async createUser(data: { email: string; passwordHash: string; name: string; company?: string }): Promise<UserEntity> {
    const id = 'user_' + Math.random().toString(36).substring(2, 11);
    const now = new Date();
    const newUser: UserEntity = {
      id,
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      company: data.company,
      role: 'USER',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);

    // Automatically create 3-Month Free Trial Subscription (90 days)
    const trialEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const subscription: SubscriptionEntity = {
      id: 'sub_' + Math.random().toString(36).substring(2, 11),
      userId: id,
      plan: 'FREE_TRIAL',
      status: 'TRIALING',
      trialStartDate: now,
      trialEndDate: trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.set(id, subscription);

    return newUser;
  }

  // --- Subscriptions ---
  async getSubscriptionByUserId(userId: string): Promise<SubscriptionEntity | null> {
    return this.subscriptions.get(userId) || null;
  }

  async updateSubscription(userId: string, update: Partial<SubscriptionEntity>): Promise<SubscriptionEntity | null> {
    const sub = this.subscriptions.get(userId);
    if (!sub) return null;
    const updated = { ...sub, ...update, updatedAt: new Date() };
    this.subscriptions.set(userId, updated);
    return updated;
  }

  // --- Stamp Templates ---
  async getAllTemplates(category?: string, shape?: string, search?: string): Promise<StampTemplateSeed[]> {
    let list = Array.from(this.templates.values());
    if (category && category !== 'all') {
      list = list.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }
    if (shape && shape !== 'all') {
      list = list.filter((t) => t.shape.toLowerCase() === shape.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q)));
    }
    return list;
  }

  async getTemplateById(id: string): Promise<StampTemplateSeed | null> {
    return this.templates.get(id) || null;
  }

  // --- Stamp Projects ---
  async getProjectsByUserId(userId: string): Promise<StampProjectEntity[]> {
    return Array.from(this.projects.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getProjectById(id: string): Promise<StampProjectEntity | null> {
    return this.projects.get(id) || null;
  }

  async createProject(data: Omit<StampProjectEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<StampProjectEntity> {
    const id = 'proj_' + Math.random().toString(36).substring(2, 11);
    const now = new Date();
    const newProject: StampProjectEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: string, update: Partial<StampProjectEntity>): Promise<StampProjectEntity | null> {
    const proj = this.projects.get(id);
    if (!proj) return null;
    const updated = { ...proj, ...update, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    const proj = this.projects.get(id);
    if (!proj || proj.userId !== userId) return false;
    return this.projects.delete(id);
  }

  // --- Cliparts ---
  async getAllCliparts(category?: string): Promise<ClipartSeed[]> {
    let list = Array.from(this.cliparts.values());
    if (category && category !== 'all') {
      list = list.filter((c) => c.category === category);
    }
    return list;
  }
}

export const db = new DatabaseService();
