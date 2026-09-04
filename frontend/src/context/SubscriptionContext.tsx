'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ApiService } from '../lib/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  popular?: boolean;
  badge?: string;
}

interface SubscriptionContextType {
  plans: Plan[];
  isUpgradeModalOpen: boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  upgradeToPlan: (planId: string) => Promise<boolean>;
  trialDaysRemaining: number;
  isTrialActive: boolean;
  isPro: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { subscription, refreshUser, user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await ApiService.getPlans();
        if (res.success && res.plans) {
          setPlans(res.plans);
        }
      } catch (err) {
        // Fallback default plans
        setPlans([
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
            ],
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
              'Direct Laser Machine Profile Presets',
              'VIP Stamp Template Requests',
            ],
            badge: 'SAVE 25%',
          },
        ]);
      }
    };
    fetchPlans();
  }, []);

  const trialDaysRemaining = subscription?.trialDaysLeft ?? 90;
  const isTrialActive = subscription?.isTrialActive ?? true;
  const isPro = subscription?.plan === 'MONTHLY_PRO' || subscription?.plan === 'YEARLY_PRO' || subscription?.plan === 'ENTERPRISE';

  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  const upgradeToPlan = async (planId: string): Promise<boolean> => {
    try {
      const res = await ApiService.upgradeSubscription(planId);
      if (res.success) {
        await refreshUser();
        closeUpgradeModal();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Upgrade failed:', e);
      return false;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        plans,
        isUpgradeModalOpen,
        openUpgradeModal,
        closeUpgradeModal,
        upgradeToPlan,
        trialDaysRemaining,
        isTrialActive,
        isPro,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
