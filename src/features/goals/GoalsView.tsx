import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Goal, GoalPriority, GoalTask } from '../../types';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  Trash2,
  Calendar,
  AlertCircle,
  TrendingUp,
  RotateCcw,
  Star,
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiBreaking, setIsAiBreaking] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'starred'>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [isStarred, setIsStarred] = useState(false);
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await api.getGoals();
      setGoals(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAiBreakdown = async () => {
    if (!title.trim()) return;
    setIsAiBreaking(true);
    try {
      const { tasks: generated } = await api.generateGoalTasksAI(title, description);
      setTasks(generated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiBreaking(false);
    }
  };

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    setTasks([...tasks, newTaskInput.trim()]);
    setNewTaskInput('');
  };

  const handleRemoveTask = (idx: number) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedTasks: GoalTask[] = tasks.map((t, idx) => ({
      id: 'gt-' + Date.now() + '-' + idx,
      goalId: '',
      userId: '',
      taskText: t,
      isCompleted: false,
      orderIndex: idx + 1,
    }));

    try {
      const newGoal = await api.createGoal({
        title,
        description,
        deadline,
        priority,
        isStarred,
        progressPercentage: 0,
        status: 'active',
        tasks: formattedTasks,
      });

      setGoals([newGoal, ...goals]);
      setIsModalOpen(false);

      // Reset
      setTitle('');
      setDescription('');
      setDeadline('');
      setIsStarred(false);
      setTasks([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStar = async (goalId: string) => {
    try {
      const updated = await api.toggleStarGoal(goalId);
      setGoals(goals.map(g => g.id === goalId ? updated : g));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTask = async (goalId: string, taskId: string) => {
    try {
      const updated = await api.toggleGoalTask(goalId, taskId);
      setGoals(goals.map(g => g.id === goalId ? updated : g));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await api.deleteGoal(goalId);
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Academic & Career Goals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Turn broad aspirations into concrete, AI-decomposed milestones.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Goals ({goals.length})
        </button>
        <button
          onClick={() => setActiveFilter('starred')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeFilter === 'starred'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${activeFilter === 'starred' ? 'fill-white' : 'text-amber-500 fill-amber-400'}`} />
          <span>Starred Goals ({goals.filter(g => g.isStarred).length})</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.filter(g => activeFilter === 'starred' ? g.isStarred : true).length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-300" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {activeFilter === 'starred' ? 'No starred goals yet' : 'No goals created'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeFilter === 'starred'
              ? 'Star your primary goals to focus your efforts on what matters most.'
              : 'Create goals and let buddy4students break them into actionable tasks.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals
            .filter(g => activeFilter === 'starred' ? g.isStarred : true)
            .map((goal) => {
              const completedCount = goal.tasks.filter(t => t.isCompleted).length;
              const totalTasks = goal.tasks.length;

              return (
                <div
                  key={goal.id}
                  className={`bg-white border rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-all ${
                    goal.isStarred
                      ? 'border-amber-300 ring-1 ring-amber-200/60 bg-gradient-to-b from-amber-50/20 to-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          goal.priority === 'urgent'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : goal.priority === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {goal.priority}
                        </span>
                        {goal.isStarred && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                            Primary Focus
                          </span>
                        )}
                        {goal.deadline && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {goal.deadline}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStar(goal.id)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            goal.isStarred ? 'text-amber-500 hover:bg-amber-100' : 'text-slate-300 hover:text-amber-500'
                          }`}
                          title={goal.isStarred ? 'Unstar goal' : 'Star as primary focus goal'}
                        >
                          <Star className={`w-4 h-4 ${goal.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{goal.title}</h3>
                {goal.description && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{goal.description}</p>
                )}

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Milestone Progress</span>
                    <span className="font-semibold text-indigo-700">{goal.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Task Checklist */}
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Tasks ({completedCount}/{totalTasks})
                  </span>
                  <div className="space-y-1.5 mt-1">
                    {goal.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(goal.id, task.id)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          task.isCompleted
                            ? 'bg-slate-50 text-slate-400'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        {task.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        )}
                        <span className={task.isCompleted ? 'line-through text-slate-400' : 'font-medium'}>
                          {task.taskText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* CREATE GOAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-indigo-600" />
              Create Learning Goal
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your target and use AI to automatically break it down into achievable tasks.
            </p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Technical Interview Problem Solving"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  placeholder="e.g. Solve 50 core LeetCode problems covering arrays, trees, and graphs."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* AI Breakdown Button */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    AI Task Breakdown
                  </span>
                  <button
                    type="button"
                    onClick={handleAiBreakdown}
                    disabled={isAiBreaking || !title.trim()}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-[11px] font-semibold flex items-center gap-1"
                  >
                    {isAiBreaking ? (
                      <>
                        <RotateCcw className="w-3 h-3 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <span>Break into Tasks</span>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-indigo-700/80">
                  buddy4students will decompose your goal into sequential actionable steps.
                </p>
              </div>

              {/* Task list preview */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Sub-Tasks ({tasks.length})</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {tasks.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="truncate pr-2">{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(idx)}
                        className="text-slate-400 hover:text-red-500 shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a custom task..."
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTask();
                      }
                    }}
                    className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Star as Primary Goal */}
              <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <input
                  type="checkbox"
                  checked={isStarred}
                  onChange={(e) => setIsStarred(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                />
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  Star as a Primary Focus Goal
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
