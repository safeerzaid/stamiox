'use client';

import React, { useState } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Lock,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SubscriptionModal: React.FC = () => {
  const { isUpgradeModalOpen, closeUpgradeModal, plans, upgradeToPlan, isPro } = useSubscription();
  const { user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('YEARLY_PRO');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isUpgradeModalOpen) return null;

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      const ok = await upgradeToPlan(selectedPlanId);
      if (ok) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setSuccessMessage('Congratulations! Your Pro Subscription is now active.');
        setTimeout(() => {
          setSuccessMessage(null);
          closeUpgradeModal();
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={closeUpgradeModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Subscription & Billing
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Unlock Unlimited Rubber Stamp Production
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm max-w-xl mx-auto mt-1.5">
            After your 3-Month Free Trial, choose the ideal plan for your business, notary practice, or stamp manufacturing shop.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {successMessage ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Upgrade Successful!</h3>
              <p className="text-sm text-slate-600">{successMessage}</p>
            </div>
          ) : (
            <>
              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isFree = plan.id === 'FREE_TRIAL';

                  return (
                    <div
                      key={plan.id}
                      onClick={() => !isFree && setSelectedPlanId(plan.id)}
                      className={`relative rounded-xl border-2 p-5 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-md shadow-blue-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      } ${isFree ? 'opacity-80 cursor-default bg-slate-50' : ''}`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                          {plan.badge}
                        </span>
                      )}

                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {plan.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                          {plan.description}
                        </p>

                        <div className="mt-3 mb-4">
                          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                            ${plan.price}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {plan.interval === '3_months'
                              ? ' / 90 days'
                              : plan.interval === 'year'
                              ? ' / year'
                              : ' / month'}
                          </span>
                        </div>

                        <ul className="space-y-2 border-t border-slate-100 pt-3">
                          {plan.features.slice(0, 5).map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-3">
                        {isFree ? (
                          <div className="w-full text-center py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">
                            Current Starter Offer
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? 'Selected Plan' : 'Select Plan'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Instant activation • 30-day money-back guarantee • Cancel anytime</span>
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={isProcessing || selectedPlanId === 'FREE_TRIAL'}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02]"
                >
                  {isProcessing ? (
                    <span>Processing Subscription...</span>
                  ) : (
                    <>
                      <span>Activate {selectedPlanId === 'YEARLY_PRO' ? 'Annual Pro ($89/yr)' : 'Pro Monthly ($9.99/mo)'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
