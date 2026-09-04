import { Response } from 'express';
import { db } from '../services/db.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const SUBSCRIPTION_PLANS = [
  {
    id: 'FREE_TRIAL',
    name: '3-Month Free Trial',
    price: 0,
    interval: '3_months',
    description: 'Full unrestricted access to all stamp templates and CorelDRAW-like Studio Editor for 90 days.',
    features: [
      '90 Days Unlimited Free Access',
      'All Pre-built Stamp Templates',
      'Full Studio Vector Canvas Editor',
      'High-Resolution SVG & PDF Export',
      'Laser Engraving Negative / Mirror Mode',
      'Up to 10 Cloud Saved Designs',
      'Standard Clipart & Font Library',
    ],
    popular: false,
    badge: '90 DAYS FREE',
  },
  {
    id: 'MONTHLY_PRO',
    name: 'Pro Monthly',
    price: 9.99,
    interval: 'month',
    description: 'Perfect for small businesses, notaries, offices, and regular stamp creators.',
    features: [
      'Everything in Free Trial',
      'Unlimited Cloud Saved Designs',
      'Commercial Stamp Production License',
      'Priority Vector High-Res SVG/PDF Rendering',
      'Custom Clipart & Brand Logo Vectorizer',
      'Priority Customer & Technical Support',
      'Cancel Anytime with 1-Click',
    ],
    popular: true,
    badge: 'MOST POPULAR',
  },
  {
    id: 'YEARLY_PRO',
    name: 'Pro Annual (Best Value)',
    price: 89.00,
    interval: 'year',
    description: 'Save over 25% with full yearly access for high-volume stamp makers and print shops.',
    features: [
      'Everything in Pro Monthly',
      'Save $30+ vs Monthly Billing (25% OFF)',
      'Batch Stamp Generator & Mail-merge Export',
      'Direct Laser Machine Profile Presets (Trotec/Epilog)',
      'VIP Stamp Template Requests',
      'Early Access to New Features & Guilloche Rosettes',
    ],
    popular: false,
    badge: 'SAVE 25%',
  },
  {
    id: 'ENTERPRISE',
    name: 'Commercial Manufacturer',
    price: 199.00,
    interval: 'year',
    description: 'For commercial stamp factories, rubber plate manufacturers, and multi-seat print networks.',
    features: [
      'Unlimited Team Seats & Sub-Accounts',
      'White-label Stamp Builder Widget for Client Websites',
      'API Access for Automated Order Processing',
      'Custom Machine Output Formats (DXF, AI, EPS)',
      'Dedicated Account Manager',
    ],
    popular: false,
    badge: 'ENTERPRISE',
  },
];

export const getPlans = async (_req: AuthRequest, res: Response) => {
  return res.json({ success: true, plans: SUBSCRIPTION_PLANS });
};

export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const subscription = await db.getSubscriptionByUserId(req.user.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const now = new Date();
    const trialDaysLeft = Math.max(
      0,
      Math.ceil((new Date(subscription.trialEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const isTrialActive = subscription.status === 'TRIALING' && trialDaysLeft > 0;
    const isProActive = subscription.status === 'ACTIVE';

    return res.json({
      success: true,
      subscription: {
        ...subscription,
        trialDaysLeft,
        isActive: isTrialActive || isProActive,
        isTrialActive,
        isProActive,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve subscription' });
  }
};

export const upgradeSubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { planId, paymentMethod } = req.body;
    const validPlans = ['MONTHLY_PRO', 'YEARLY_PRO', 'ENTERPRISE'];

    if (!validPlans.includes(planId)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const now = new Date();
    const durationDays = planId === 'MONTHLY_PRO' ? 30 : 365;
    const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const updated = await db.updateSubscription(req.user.id, {
      plan: planId,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    return res.json({
      success: true,
      message: `Successfully upgraded to ${planId.replace('_', ' ')}! Your account now has unlimited access.`,
      subscription: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to upgrade subscription' });
  }
};

export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await db.updateSubscription(req.user.id, {
      cancelAtPeriodEnd: true,
    });

    return res.json({
      success: true,
      message: 'Subscription will not renew after current billing cycle.',
      subscription: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to cancel subscription' });
  }
};
