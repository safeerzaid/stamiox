'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useEditor } from '../../context/EditorContext';
import { ApiService } from '../../lib/api';
import { generateStampSvg } from '../../lib/svg-generator';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Plus,
  Clock,
  ShieldCheck,
  Trash2,
  Copy,
  Edit3,
  Sparkles,
  Calendar,
  Compass,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { trialDaysRemaining, isTrialActive, isPro, openUpgradeModal } = useSubscription();
  const { loadProject, resetToBlank } = useEditor();

  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProjects = async () => {
    try {
      const res = await ApiService.getProjects();
      if (res.success && res.projects) {
        setProjects(res.projects);
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenProject = (proj: any) => {
    loadProject(proj);
    router.push('/editor');
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await ApiService.duplicateProject(id);
      if (res.success) {
        await fetchProjects();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stamp design?')) return;
    try {
      const res = await ApiService.deleteProject(id);
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNew = () => {
    resetToBlank('ROUND', 40, 40);
    router.push('/editor');
  };

  return (
    <div className="flex-1 bg-slate-50 py-10 min-h-screen text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* User Account & Subscription Overview Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                User Dashboard
              </span>
              {isPro ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  PRO Active
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  {trialDaysRemaining} Days Free Trial Left
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-[-0.035em] text-[#111827]">
              Welcome back, <span className="font-semibold">{user?.name || 'Stamp Designer'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Manage your saved rubber stamp vectors, laser profiles, and subscription.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {!isPro && (
              <button
                onClick={openUpgradeModal}
                className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md shadow-amber-500/20"
              >
                Upgrade to Pro
              </button>
            )}
            <button
              onClick={handleCreateNew}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>New Stamp Design</span>
            </button>
          </div>
        </div>

        {/* Saved Stamps Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>My Saved Stamp Projects ({projects.length})</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              Loading your designs...
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No saved designs yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start creating custom rubber stamps using our pre-built templates or the full vector studio editor.
              </p>
              <button
                onClick={handleCreateNew}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
              >
                Create Your First Stamp
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((proj) => {
                const svg = generateStampSvg({
                  widthMm: proj.widthMm,
                  heightMm: proj.heightMm,
                  inkColor: proj.inkColor || '#1e3a8a',
                  elements: proj.elementsJson || [],
                  distressEffect: false,
                });

                return (
                  <div
                    key={proj.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-blue-500 transition-all hover:shadow-xl shadow-xs group"
                  >
                    {/* Visual Preview */}
                    <div
                      onClick={() => handleOpenProject(proj)}
                      className="bg-slate-50 rounded-xl p-4 flex items-center justify-center min-h-[170px] mb-4 cursor-pointer group-hover:bg-blue-50/30 transition-colors relative border border-slate-100"
                    >
                      <div className="absolute top-2 left-2 flex items-center gap-1 text-[9px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                        <span>{proj.widthMm}×{proj.heightMm}mm</span>
                      </div>
                      <div
                        className="w-32 h-32 flex items-center justify-center group-hover:scale-105 transition-transform"
                        dangerouslySetInnerHTML={{ __html: svg }}
                      />
                    </div>

                    {/* Metadata */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                        {proj.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Updated: {new Date(proj.updatedAt).toLocaleDateString()}</span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenProject(proj)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDuplicate(proj.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(proj.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
