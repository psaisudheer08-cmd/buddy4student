import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudyPlan, StudyTask } from '../../types';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Trash2,
  BookOpen
} from 'lucide-react';

export const StudyPlannerView: React.FC = () => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [examDate, setExamDate] = useState('');
  const [totalDays, setTotalDays] = useState(14);
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [currentLevel, setCurrentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.getStudyPlans();
      setPlans(data);
      if (data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic) return;

    setIsGenerating(true);
    try {
      // 1. Call AI generator to create structured schedule
      const { tasks: generatedTasks } = await api.generateStudyPlanAI({
        subject,
        topic,
        totalDays,
        dailyMinutes,
        currentLevel,
        examDate,
      });

      // 2. Format tasks
      const formattedTasks: StudyTask[] = generatedTasks.map((t, idx) => ({
        id: 'st-' + Date.now() + '-' + idx,
        planId: '',
        userId: '',
        dayNumber: t.dayNumber || (idx + 1),
        scheduledDate: new Date(Date.now() + idx * 86400000).toISOString().split('T')[0],
        topicTitle: t.topicTitle,
        durationMinutes: t.durationMinutes || dailyMinutes,
        isCompleted: false,
      }));

      // 3. Save to database
      const newPlan = await api.createStudyPlan({
        subject,
        topic,
        examDate,
        totalDays,
        dailyMinutes,
        currentKnowledgeLevel: currentLevel,
        priority: 'high',
        status: 'in_progress',
        tasks: formattedTasks,
      });

      setPlans([newPlan, ...plans]);
      setSelectedPlanId(newPlan.id);
      setIsModalOpen(false);

      // Reset form
      setSubject('');
      setTopic('');
      setExamDate('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    if (!selectedPlanId) return;
    try {
      const updatedPlan = await api.toggleStudyTask(selectedPlanId, taskId, isCompleted);
      setPlans(plans.map(p => p.id === selectedPlanId ? updatedPlan : p));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await api.deleteStudyPlan(id);
      const next = plans.filter(p => p.id !== id);
      setPlans(next);
      if (selectedPlanId === id) {
        setSelectedPlanId(next.length > 0 ? next[0].id : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const completedCount = activePlan?.tasks.filter(t => t.isCompleted).length || 0;
  const totalCount = activePlan?.tasks.length || 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingCount = totalCount - completedCount;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Adaptive Study Planner
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-structured schedules that dynamically adjust to your pace without penalization.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Study Plan</span>
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">No active study plans yet</h2>
          <p className="text-xs text-slate-500 mt-1">
            Let buddy4students structure your upcoming subject or midterm prep into realistic daily goals.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
          >
            Create Your First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Plan Selector Column */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Active Plans ({plans.length})
            </h3>
            {plans.map((p) => {
              const isSelected = p.id === activePlan?.id;
              const pCompleted = p.tasks.filter(t => t.isCompleted).length;
              const pPct = p.tasks.length > 0 ? Math.round((pCompleted / p.tasks.length) * 100) : 0;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 text-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="truncate">{p.subject}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlan(p.id);
                      }}
                      className="text-slate-400 hover:text-red-500 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{p.topic}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{pCompleted}/{p.tasks.length} Days</span>
                    <span className="font-semibold text-blue-700">{pPct}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Plan Timeline & Tasks Column */}
          <div className="lg:col-span-3 space-y-4">
            {activePlan && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                {/* Plan Overview Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      {activePlan.subject}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{activePlan.topic}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {activePlan.dailyMinutes} mins/day
                      </span>
                      {activePlan.examDate && (
                        <span>Exam Date: <strong className="text-slate-700">{activePlan.examDate}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{progressPct}%</div>
                      <div className="text-[11px] text-slate-400">{completedCount} of {totalCount} completed</div>
                    </div>
                  </div>
                </div>

                {/* Adaptive Reassurance Banner */}
                {pendingCount > 0 && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs text-slate-600">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800">Adaptive AI Note: </span>
                      You have {pendingCount} topic milestones remaining. If your schedule changes, buddy4students recalculates the remaining tasks smoothly without shaming.
                    </div>
                  </div>
                )}

                {/* Task Checklist */}
                <div className="mt-5 space-y-2.5">
                  {activePlan.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id, !task.isCompleted)}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        task.isCompleted
                          ? 'bg-slate-50/70 border-slate-200 text-slate-400'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {task.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-slate-500">
                              Day {task.dayNumber}
                            </span>
                            <span className={`font-medium ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {task.topicTitle}
                            </span>
                          </div>
                          {task.scheduledDate && (
                            <span className="text-[10px] text-slate-400">Scheduled: {task.scheduledDate}</span>
                          )}
                        </div>
                      </div>

                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        {task.durationMinutes} min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE PLAN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Generate Adaptive Study Plan
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your subject details and buddy4students will curate a day-by-day learning schedule.
            </p>

            <form onSubmit={handleCreatePlan} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Course</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specific Topic or Goal</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trees, Graphs and Midterm Prep"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Days</label>
                  <input
                    type="number"
                    min={3}
                    max={30}
                    value={totalDays}
                    onChange={(e) => setTotalDays(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Study Time</label>
                  <select
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Level</label>
                  <select
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Date (Optional)</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {isGenerating ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
