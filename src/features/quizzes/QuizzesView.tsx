import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Quiz, QuizQuestion, QuizAttempt } from '../../types';
import {
  HelpCircle,
  Plus,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export const QuizzesView: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const data = await api.getQuizzes();
      setQuizzes(data);
      if (data.length > 0 && !activeQuiz) {
        setActiveQuiz(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const { questions } = await api.generateQuizAI(topic, questionCount);
      const newQuiz = await api.createQuiz({
        title: `${topic} Diagnostic Quiz`,
        subject: topic,
        questions: questions.map((q: any, idx: number) => ({
          id: 'q-' + Date.now() + '-' + idx,
          type: q.type || 'mcq',
          question: q.question,
          options: q.options || ['True', 'False'],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || 'Review fundamental definitions.',
        })),
      });

      setQuizzes([newQuiz, ...quizzes]);
      setActiveQuiz(newQuiz);
      setUserAnswers({});
      setSubmitted(false);
      setIsModalOpen(false);
      setTopic('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    if (submitted) return;
    setUserAnswers({ ...userAnswers, [questionId]: option });
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    let correct = 0;
    activeQuiz.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });

    setScore(correct);
    setSubmitted(true);

    try {
      await api.submitQuizAttempt(activeQuiz.id, userAnswers, correct, activeQuiz.questions.length);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-violet-600" />
            Diagnostic Quizzes & Active Recall
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test and cement conceptual mastery through low-stakes diagnostic quizzes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Quiz with AI</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Quiz Selector */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Available Quizzes ({quizzes.length})
          </h3>

          <div className="space-y-1.5">
            {quizzes.map((q) => {
              const isSelected = q.id === activeQuiz?.id;
              return (
                <div
                  key={q.id}
                  onClick={() => {
                    setActiveQuiz(q);
                    setUserAnswers({});
                    setSubmitted(false);
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-violet-50/80 border-violet-300 text-slate-900 shadow-2xs font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="truncate">{q.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{q.questions.length} Questions</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Quiz Player */}
        <div className="lg:col-span-3">
          {activeQuiz ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider">
                    {activeQuiz.subject}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{activeQuiz.title}</h2>
                </div>

                {submitted && (
                  <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-800">
                    <Award className="w-4 h-4 text-violet-600" />
                    <span>
                      Score: {score} / {activeQuiz.questions.length} (
                      {Math.round((score / activeQuiz.questions.length) * 100)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {activeQuiz.questions.map((q, idx) => {
                  const selected = userAnswers[q.id];
                  const isCorrect = selected === q.correctAnswer;

                  return (
                    <div key={q.id} className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900">{q.question}</h3>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                        {q.options.map((opt) => {
                          const isOptionSelected = selected === opt;
                          let optionClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';

                          if (submitted) {
                            if (opt === q.correctAnswer) {
                              optionClass = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold';
                            } else if (isOptionSelected) {
                              optionClass = 'bg-red-50 border-red-300 text-red-800';
                            }
                          } else if (isOptionSelected) {
                            optionClass = 'bg-violet-50 border-violet-500 text-violet-900 font-semibold shadow-2xs';
                          }

                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectOption(q.id, opt)}
                              disabled={submitted}
                              className={`p-3 text-xs text-left rounded-xl border transition-all flex items-center justify-between ${optionClass}`}
                            >
                              <span>{opt}</span>
                              {submitted && opt === q.correctAnswer && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              {submitted && isOptionSelected && opt !== q.correctAnswer && (
                                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation if submitted */}
                      {submitted && (
                        <div className="ml-7 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                          <strong className="text-slate-800">Explanation: </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Answers</span>
                </button>

                {!submitted ? (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(userAnswers).length === 0}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetQuiz}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Retake Quiz
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400">
              No quiz selected.
            </div>
          )}
        </div>
      </div>

      {/* GENERATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-violet-600" />
              Generate Diagnostic Quiz
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter any concept or textbook topic to generate targeted multiple choice questions.
            </p>

            <form onSubmit={handleGenerateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graph Traversal (BFS & DFS) or SQL Joins"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value={3}>3 Questions (Quick Sprint)</option>
                  <option value={4}>4 Questions (Standard)</option>
                  <option value={6}>6 Questions (Deep Diagnostic)</option>
                </select>
              </div>

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
                  disabled={isGenerating}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {isGenerating ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Quiz...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate</span>
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
