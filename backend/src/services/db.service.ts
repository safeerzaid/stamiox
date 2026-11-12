import { PrismaClient } from '@prisma/client';
import { STAMP_TEMPLATES, StampTemplateSeed } from '../data/templates';
import { CLIPARTS, ClipartSeed } from '../data/cliparts';
import bcrypt from 'bcryptjs';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  /** login by mobile number (10 digits) or username */
  mobile?: string;
  username?: string;
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

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 90; // 3 months free trial
const DEMO_USER_ID = 'user-demo-stamiox-001';
const SHAPES = ['ROUND', 'RECTANGULAR', 'OVAL', 'SQUARE', 'CUSTOM'];
// Project fields a client is allowed to set
const PROJECT_FIELDS = [
  'title', 'description', 'category', 'shape', 'widthMm', 'heightMm',
  'inkColor', 'elementsJson', 'thumbnailSvg', 'isTemplate', 'isPublic',
];

const prisma = new PrismaClient();

// Prisma returns null for empty optional columns; the API used to send undefined.
const toUser = (u: any): UserEntity => ({
  ...u,
  company: u.company ?? undefined,
  mobile: u.mobile ?? undefined,
  username: u.username ?? undefined,
});
const toProject = (p: any): StampProjectEntity => ({
  ...p,
  description: p.description ?? undefined,
  thumbnailSvg: p.thumbnailSvg ?? undefined,
});

// Keeps only known project fields, with safe types, so stray request fields never reach the DB.
const projectData = (input: Record<string, any>): Record<string, any> => {
  const data: Record<string, any> = {};
  for (const key of PROJECT_FIELDS) {
    let value = input[key];
    if (value === undefined) continue;
    if (key === 'shape') {
      const s = String(value).toUpperCase();
      value = SHAPES.includes(s) ? s : 'ROUND';
    }
    if (key === 'widthMm' || key === 'heightMm') value = Number(value) || 40;
    if (key === 'isTemplate' || key === 'isPublic') value = Boolean(value);
    if (key === 'elementsJson' && value === null) value = [];
    data[key] = value;
  }
  return data;
};

const newTrial = (now: Date) => {
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * DAY_MS);
  return {
    plan: 'FREE_TRIAL' as const,
    status: 'TRIALING' as const,
    trialStartDate: now,
    trialEndDate: trialEnd,
    currentPeriodStart: now,
    currentPeriodEnd: trialEnd,
    cancelAtPeriodEnd: false,
  };
};

// Users, subscriptions and projects are stored in PostgreSQL (Prisma).
// Templates and cliparts are fixed data shipped with the code, so they stay in memory.
class DatabaseService {
  private templates: Map<string, StampTemplateSeed> = new Map();
  private cliparts: Map<string, ClipartSeed> = new Map();

  constructor() {
    STAMP_TEMPLATES.forEach((t) => this.templates.set(t.id, t));
    CLIPARTS.forEach((c) => this.cliparts.set(c.id, c));
  }

  // Connects to the DB and makes sure the demo account exists with a running trial.
  async init(): Promise<void> {
    await prisma.$connect();
    const now = new Date();

    const existing = await prisma.user.findUnique({ where: { id: DEMO_USER_ID } });
    if (!existing) {
      const demoTemplate = STAMP_TEMPLATES[0];
      await prisma.user.create({
        data: {
          id: DEMO_USER_ID,
          email: 'demo@stamiox.com',
          passwordHash: bcrypt.hashSync('password123', 10),
          name: 'Alex Mercer (Demo)',
          company: 'Mercer Rubber Stamps & Engraving',
          role: 'USER',
          subscription: { create: { id: 'sub-demo-stamiox-001', ...newTrial(now) } },
          projects: {
            create: {
              id: 'project-demo-01',
              title: 'Official Company Round Seal 40mm',
              description: 'Official seal design for Stamiox Global Enterprises',
              category: 'company',
              shape: 'ROUND',
              widthMm: demoTemplate.widthMm,
              heightMm: demoTemplate.heightMm,
              inkColor: demoTemplate.defaultData.inkColor,
              elementsJson: demoTemplate.defaultData.elements as any,
              isTemplate: false,
              isPublic: true,
            },
          },
        },
      });
      return;
    }

    // The demo account is shared; restart its trial once it runs out.
    const sub = await prisma.subscription.findUnique({ where: { userId: DEMO_USER_ID } });
    if (!sub || sub.trialEndDate < now) {
      await prisma.subscription.upsert({
        where: { userId: DEMO_USER_ID },
        create: { userId: DEMO_USER_ID, ...newTrial(now) },
        update: newTrial(now),
      });
    }
  }

  // --- Users ---
  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    return user ? toUser(user) : null;
  }

  async findUserByMobile(mobile: string): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({ where: { mobile } });
    return user ? toUser(user) : null;
  }

  /** local digits without the country code — only if exactly one account matches */
  async findUserByLocalMobile(digits: string): Promise<UserEntity | null> {
    const hits = await prisma.user.findMany({ where: { mobile: { endsWith: digits } }, take: 2 });
    return hits.length === 1 ? toUser(hits[0]) : null;
  }

  async findUserByUsername(username: string): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    });
    return user ? toUser(user) : null;
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toUser(user) : null;
  }

  async createUser(data: { email: string; passwordHash: string; name: string; company?: string; mobile?: string; username?: string }): Promise<UserEntity> {
    // Every new user gets the 3-month free trial.
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        company: data.company,
        mobile: data.mobile,
        username: data.username,
        role: 'USER',
        subscription: { create: newTrial(new Date()) },
      },
    });
    return toUser(user);
  }

  // --- Subscriptions ---
  async getSubscriptionByUserId(userId: string): Promise<SubscriptionEntity | null> {
    return prisma.subscription.findUnique({ where: { userId } });
  }

  async updateSubscription(userId: string, update: Partial<SubscriptionEntity>): Promise<SubscriptionEntity | null> {
    const { id: _id, userId: _userId, createdAt: _c, updatedAt: _u, ...data } = update;
    try {
      return await prisma.subscription.update({ where: { userId }, data });
    } catch (e: any) {
      if (e?.code === 'P2025') return null; // user has no subscription
      throw e;
    }
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
    const rows = await prisma.stampProject.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(toProject);
  }

  async getProjectById(id: string): Promise<StampProjectEntity | null> {
    const p = await prisma.stampProject.findUnique({ where: { id } });
    return p ? toProject(p) : null;
  }

  async createProject(data: Omit<StampProjectEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<StampProjectEntity> {
    const p = await prisma.stampProject.create({
      data: {
        ...projectData(data),
        title: data.title,
        userId: data.userId,
        elementsJson: data.elementsJson ?? [],
      } as any,
    });
    return toProject(p);
  }

  async updateProject(id: string, update: Partial<StampProjectEntity>): Promise<StampProjectEntity | null> {
    try {
      const p = await prisma.stampProject.update({ where: { id }, data: projectData(update) });
      return toProject(p);
    } catch (e: any) {
      if (e?.code === 'P2025') return null;
      throw e;
    }
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    const result = await prisma.stampProject.deleteMany({ where: { id, userId } });
    return result.count > 0;
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
