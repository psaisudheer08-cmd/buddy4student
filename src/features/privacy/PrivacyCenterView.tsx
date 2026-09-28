import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ShieldCheck,
  Download,
  Trash2,
  Lock,
  EyeOff,
  Server,
  Database,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

export const PrivacyCenterView: React.FC = () => {
  const { user, profile, deleteAccount } = useAuth();
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [dataStats, setDataStats] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadStats();
  }, [user?.id]);

  const loadStats = async () => {
    try {
      const [notes, goals, plans, convs, certs, projs, skills, memories] = await Promise.all([
        api.getNotes().catch(() => []),
        api.getGoals().catch(() => []),
        api.getStudyPlans().catch(() => []),
        api.getConversations().catch(() => []),
        api.getCertificates().catch(() => []),
        api.getProjects().catch(() => []),
        api.getSkills().catch(() => []),
        api.getAIMemories().catch(() => []),
      ]);

      setDataStats({
        notesCount: notes.length,
        goalsCount: goals.length,
        plansCount: plans.length,
        conversationsCount: convs.length,
        certificatesCount: certs.length,
        projectsCount: projs.length,
        skillsCount: skills.length,
        memoriesCount: memories.length,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadData = async () => {
    setIsExporting(true);
    try {
      const data = await api.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buddy4students_student_archive_${user?.id || 'data'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Settings, Theme & Privacy Center
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          buddy4students is your strictly private student OS. You hold 100% ownership and control over your records and appearance.
        </p>
      </div>

      {/* Theme & Appearance Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              Appearance & Theme Mode
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize how buddy4students looks on your device. Choose bright mode for daylight study or dark mode for night focus.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Bright Mode Card */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              !isDark
                ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              {!isDark && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">Active</span>
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Bright / Daylight Mode</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">High-clarity, high-contrast crisp white interface for daytime study.</p>
            </div>
          </button>

          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              isDark
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/25 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              {isDark && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">Active</span>
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Dark / Night Mode</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Low-glare, eye-friendly deep navy theme ideal for late night study sessions.</p>
            </div>
          </button>
        </div>
      </div>

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Row-Level Security (RLS)</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Every database query evaluates session ownership. Students cannot access another student's data.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <EyeOff className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Zero Public Leakage</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            No public profiles, no unauthenticated indexing, and no telemetry data shared with external brokers.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Complete Portability</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Download your raw archive in machine-readable JSON or purge all records with cascade deletion.
          </p>
        </div>
      </div>

      {/* Data Inventory Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-blue-600" />
          Your Stored Data Inventory
        </h2>

        {dataStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Study Notes</span>
              <strong className="text-base text-slate-900">{dataStats.notesCount}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Study Plans</span>
              <strong className="text-base text-slate-900">{dataStats.plansCount}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Goals & Tasks</span>
              <strong className="text-base text-slate-900">{dataStats.goalsCount}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">AI Chats</span>
              <strong className="text-base text-slate-900">{dataStats.conversationsCount}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Certificates</span>
              <strong className="text-base text-slate-900">{dataStats.certificatesCount}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Projects</span>
              <strong className="text-base text-slate-900">{dataStats.projectsCount}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Verified Skills</span>
              <strong className="text-base text-slate-900">{dataStats.skillsCount}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">AI Memories</span>
              <strong className="text-base text-slate-900">{dataStats.memoriesCount}</strong>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Loading stored data counts...</div>
        )}
      </div>

      {/* Export & Cascade Delete Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Data Export & Destruction</h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Download Full Student Archive</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Export all your profile facts, study plans, notes, quizzes, and certificates in JSON format.
            </p>
          </div>
          <button
            onClick={handleDownloadData}
            disabled={isExporting}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            {isExporting ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download Archive (.JSON)</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-50/60 rounded-xl border border-red-200">
          <div>
            <h4 className="text-xs font-bold text-red-950">Permanently Delete Account & Wipe Records</h4>
            <p className="text-[11px] text-red-800/80 mt-0.5">
              Instantly cascades deletion across all notes, study plans, chats, certificates, and files. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Confirm Irreversible Account Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will immediately purge your student profile, study notes, certificates, and private chat history.
              </p>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
              Type <strong className="font-mono font-bold">DELETE</strong> in capital letters to confirm:
            </div>

            <input
              type="text"
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full text-center font-mono font-bold text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={confirmText !== 'DELETE' || isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
