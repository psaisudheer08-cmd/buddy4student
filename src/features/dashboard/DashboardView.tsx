import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Target,
  Clock,
  Calendar,
  Award,
  ChevronRight,
  TrendingUp,
  CalendarDays,
  Plus,
  ArrowRight,
  BookOpen,
  FolderGit2,
  CalendarCheck,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { StudyPlan, Goal, Achievement, Project, Certificate } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle?: string;
  time: string;
  type: 'goal' | 'study' | 'project' | 'certificate';
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { profile, user, isAuthenticated } = useAuth();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        const [plansData, goalsData, achData, projData, certData] = await Promise.all([
          api.getStudyPlans().catch(() => []),
          api.getGoals().catch(() => []),
          api.getAchievements().catch(() => []),
          api.getProjects().catch(() => []),
          api.getCertificates().catch(() => []),
        ]);
        setStudyPlans(plansData || []);
        setGoals(goalsData || []);
        setAchievements(achData || []);
        setProjects(projData || []);
        setCertificates(certData || []);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [profile?.userId, user?.id]);

  // Greeting based on time of day
  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Student name resolution: NEVER hard-code Jordan or Sai Sudheer
  const studentName = profile?.preferredName || profile?.fullName?.split(' ')[0] || (user?.email ? user.email.split('@')[0] : 'Student');

  // Real statistics calculations - NEVER fabricate values
  const activeGoals = goals.filter((g) => g.status === 'active');
  const activeGoalsCount = activeGoals.length;

  // Real study time from completed study tasks or study plans
  const totalCompletedStudyMinutes = studyPlans.reduce((sum, plan) => {
    const completedTasksCount = plan.tasks.filter((t) => t.isCompleted).length;
    return sum + completedTasksCount * Math.round(plan.dailyMinutes / Math.max(1, plan.tasks.length));
  }, 0);

  const formatStudyTime = (minutes: number) => {
    if (minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const achievementsCount = achievements.length;
  const projectsCount = projects.length;

  // Real continue learning items (from active study plans or goals)
  const continueItems = [
    ...studyPlans.map((plan) => {
      const completedCount = plan.tasks.filter((t) => t.isCompleted).length;
      const progress = plan.tasks.length > 0 ? Math.round((completedCount / plan.tasks.length) * 100) : 0;
      const nextTask = plan.tasks.find((t) => !t.isCompleted);
      return {
        id: plan.id,
        course: plan.subject,
        topic: nextTask ? nextTask.topicTitle : 'Study Plan Completed',
        progress,
        category: 'Study Plan',
        actionTab: 'study',
      };
    }),
    ...activeGoals.map((goal) => ({
      id: goal.id,
      course: goal.title,
      topic: goal.tasks.find((t) => !t.isCompleted)?.taskText || 'Goal Tasks in Progress',
      progress: goal.progressPercentage,
      category: goal.category || 'Academic Goal',
      actionTab: 'goals',
    })),
  ];

  // Schedule items for today
  const todayStr = new Date().toISOString().split('T')[0];
  const scheduledTasks = studyPlans.flatMap((p) =>
    p.tasks
      .filter((t) => !t.isCompleted)
      .map((t) => ({
        id: t.id,
        planTitle: p.subject,
        topic: t.topicTitle,
        day: t.dayNumber,
      }))
  );

  // Real recent activities
  const recentActivities: ActivityItem[] = [
    ...goals.map((g) => ({
      id: `goal-${g.id}`,
      title: `Goal: ${g.title}`,
      subtitle: `${g.progressPercentage}% completed`,
      time: g.createdAt,
      type: 'goal' as const,
    })),
    ...projects.map((p) => ({
      id: `proj-${p.id}`,
      title: `Project: ${p.title}`,
      subtitle: p.role,
      time: p.createdAt,
      type: 'project' as const,
    })),
    ...certificates.map((c) => ({
      id: `cert-${c.id}`,
      title: `Certificate: ${c.certificateName}`,
      subtitle: c.issuer,
      time: c.createdAt,
      type: 'certificate' as const,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ======================================================== */}
      {/* 1. TOP GREETING HEADER                                   */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreetingTime()}, {studentName} 👋
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Keep going! Your future is built by what you do today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('goals')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
          <button
            onClick={() => onNavigate('study')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Study Planner</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CONTINUE FROM WHERE YOU LEFT OFF                      */}
      {/* ======================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Continue From Where You Left Off
          </h2>
          {continueItems.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">
              {continueItems.length} active learning track{continueItems.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {continueItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No learning activity yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Start tracking your academic subjects, chapters, and topics to resume right where you left off.
              </p>
            </div>
            <button
              onClick={() => onNavigate('goals')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Start your first study goal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {continueItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1.5">
                    <span className="text-blue-600 font-semibold uppercase tracking-wider">{item.category}</span>
                    <span>{item.progress}% complete</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate" title={item.course}>
                    {item.course}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1" title={item.topic}>
                    {item.topic}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(item.progress, 5)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => onNavigate(item.actionTab)}
                    className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 3. MAIN DASHBOARD CONTENT & RIGHT-SIDE WIDGETS           */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ======================== */}
        {/* LEFT COLUMN (2 Cols)     */}
        {/* ======================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* QUICK STATS (Real data only) */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Quick Stats
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Stat 1: Active Goals */}
              <div
                onClick={() => onNavigate('goals')}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Active Goals</span>
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {activeGoalsCount}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {goals.length} total goal{goals.length === 1 ? '' : 's'}
                </div>
              </div>

              {/* Stat 2: Study Time */}
              <div
                onClick={() => onNavigate('study')}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Study Time</span>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {formatStudyTime(totalCompletedStudyMinutes)}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {studyPlans.length} study plan{studyPlans.length === 1 ? '' : 's'}
                </div>
              </div>

              {/* Stat 3: Projects Built */}
              <div
                onClick={() => onNavigate('projects')}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Projects</span>
                  <FolderGit2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {projectsCount}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {projects.length} recorded project{projects.length === 1 ? '' : 's'}
                </div>
              </div>

              {/* Stat 4: Achievements */}
              <div
                onClick={() => onNavigate('certificates')}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Achievements</span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {achievementsCount}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {certificates.length} certificate{certificates.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          </section>

          {/* ATTENDANCE / PROGRESS CARD */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                <span>Attendance & Academic Standing</span>
              </h3>
              <span className="text-[11px] text-slate-400">Campus Sync</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Attendance data not connected yet</p>
                <p className="text-slate-500 leading-relaxed">
                  Your university attendance portal or biometric LMS sync has not been linked to your private profile yet. buddy4students displays verified records only.
                </p>
              </div>
            </div>
          </section>

          {/* RECENT ACTIVITY */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Activity
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Chronological</span>
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                <p className="italic font-medium">No recent activity</p>
                <p className="text-[11px] text-slate-400">
                  Activities will automatically log here when you create study goals, complete study sessions, or add projects.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentActivities.map((act) => (
                  <div key={act.id} className="py-3 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-slate-500">
                        {act.type === 'goal' && <Target className="w-4 h-4 text-blue-600" />}
                        {act.type === 'project' && <FolderGit2 className="w-4 h-4 text-purple-600" />}
                        {act.type === 'certificate' && <Award className="w-4 h-4 text-amber-500" />}
                        {act.type === 'study' && <Clock className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{act.title}</p>
                        {act.subtitle && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{act.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(act.time).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ======================== */}
        {/* RIGHT COLUMN (1 Col)     */}
        {/* ======================== */}
        <div className="space-y-6">
          {/* YOUR SCHEDULE WIDGET */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Your Schedule</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{todayFormatted}</p>
              </div>
              <button
                onClick={() => onNavigate('study')}
                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="Open Study Planner"
                aria-label="Open Study Planner"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>

            {scheduledTasks.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">Sessions Not Yet Scheduled</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Organize your week by scheduling focused study sessions and milestone reviews.
                </p>
                <button
                  onClick={() => onNavigate('study')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Plan a Session</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {scheduledTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{task.topic}</p>
                      <p className="text-[11px] text-slate-500 truncate">{task.planTitle}</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                      Day {task.day}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* UPCOMING EVENTS WIDGET */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Events</h3>
              <span className="text-[11px] text-slate-400">Milestones</span>
            </div>

            {/* If user has goals with target dates in future */}
            {activeGoals.filter((g) => g.deadline).length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">No Upcoming Events</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Deadlines, semester exams, and interview schedules will appear here when scheduled.
                </p>
                <button
                  onClick={() => onNavigate('goals')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Set Goal Deadline</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeGoals
                  .filter((g) => g.deadline)
                  .map((g) => (
                    <div
                      key={g.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{g.title}</p>
                        <p className="text-[10px] text-slate-500">Deadline</p>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg shrink-0">
                        {new Date(g.deadline!).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
