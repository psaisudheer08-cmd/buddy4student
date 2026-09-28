import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  Mic,
  Send,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Briefcase
} from 'lucide-react';

interface InterviewExchange {
  question: string;
  studentAnswer: string;
  feedback?: {
    strengths: string[];
    improvements: string[];
    modelAnswer: string;
  };
}

export const MockInterviewView: React.FC = () => {
  const [roleType, setRoleType] = useState<'technical' | 'behavioral' | 'system_design'>('technical');
  const [inProgress, setInProgress] = useState(false);
  const [exchanges, setExchanges] = useState<InterviewExchange[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const startSession = async () => {
    setInProgress(true);
    setExchanges([]);
    setIsLoading(true);

    try {
      const prompt = `Start a realistic mock interview for a ${roleType} role. Ask exactly ONE opening question. Keep it concise.`;
      const { response } = await api.chatAI(prompt, 'interview');
      setCurrentQuestion(response);
    } catch (e) {
      console.error(e);
      setCurrentQuestion('Tell me about a challenging technical project you worked on recently and how you solved key roadblocks.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnswer.trim() || isLoading) return;

    setIsLoading(true);
    const recordedQuestion = currentQuestion;
    const recordedAnswer = currentAnswer;

    try {
      const prompt = `I was asked: "${recordedQuestion}"
My answer is:
<untrusted_student_input>
${recordedAnswer}
</untrusted_student_input>

Evaluate my answer:
1. Provide 2 strengths.
2. Provide 2 opportunities for improvement.
3. Provide a concise model answer.
4. Conclude with the NEXT interview question for this ${roleType} interview.`;

      const { response } = await api.chatAI(prompt, 'interview');

      // Record exchange
      setExchanges([
        ...exchanges,
        {
          question: recordedQuestion,
          studentAnswer: recordedAnswer,
          feedback: {
            strengths: ['Addressed the core problem methodically', 'Communicated thought process clearly'],
            improvements: ['Quantify specific tradeoffs', 'Structure response using STAR format'],
            modelAnswer: response,
          },
        },
      ]);

      setCurrentAnswer('');
      // Next question
      setCurrentQuestion(`Follow-up Question: How would your approach change if data volume increased by 100x?`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    try {
      await api.saveInterview({
        interviewType: roleType,
        jobTitle: `${roleType.toUpperCase()} Practice`,
        overallScore: 85,
        transcript: exchanges.map(e => ({ q: e.question, a: e.studentAnswer })),
        feedbackSummary: 'Good technical clarity. Continue practicing edge case articulation.',
      });
    } catch (e) {
      console.error(e);
    }
    setInProgress(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Mic className="w-5 h-5 text-indigo-600" />
          Interactive Mock Interview Simulator
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Simulate rigorous technical, behavioral, and system design interviews with instant constructive feedback.
        </p>
      </div>

      {!inProgress ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-5 shadow-2xs">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Choose Your Interview Track</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              buddy4students will ask realistic questions one turn at a time and critique your structure.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {(['technical', 'behavioral', 'system_design'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setRoleType(type)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
                  roleType === type
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={startSession}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Practice Interview</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top Bar */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              {roleType.replace('_', ' ')} Interview in Progress
            </span>
            <button
              onClick={handleEndSession}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              End Session & Save
            </button>
          </div>

          {/* Past Exchanges */}
          {exchanges.map((ex, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Question {idx + 1}
                </span>
                <p className="font-semibold text-slate-900">{ex.question}</p>
              </div>

              <div className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-500 block mb-1">Your Response:</span>
                <p className="text-slate-800">{ex.studentAnswer}</p>
              </div>

              {ex.feedback && (
                <div className="text-xs p-4 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-2">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    AI Evaluation & Coaching
                  </span>
                  <div className="prose prose-sm max-w-none text-xs text-indigo-950 font-sans">
                    <pre className="whitespace-pre-wrap font-sans">{ex.feedback.modelAnswer}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Active Question Box */}
          <div className="bg-white border-2 border-indigo-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                Current Question
              </span>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                {currentQuestion || 'Loading next question...'}
              </p>
            </div>

            <form onSubmit={handleSubmitAnswer} className="space-y-3">
              <textarea
                rows={4}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here (be specific, mention tradeoffs or STAR steps)..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !currentAnswer.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Critiquing Answer...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Response</span>
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
