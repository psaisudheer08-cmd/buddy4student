import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Skill, JobDescriptionAnalysis } from '../../types';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  BookOpen,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

const STANDARD_ROLES = [
  {
    role: 'Software Engineer (Backend)',
    keySkills: ['Data Structures & Algorithms', 'Python', 'SQL', 'System Design', 'Git', 'Docker'],
    overview: 'Designs, implements, and tests scalable server-side systems, databases, and microservices.',
  },
  {
    role: 'AI / Machine Learning Engineer',
    keySkills: ['Python', 'Linear Algebra', 'PyTorch', 'Data Structures & Algorithms', 'Docker', 'SQL'],
    overview: 'Develops machine learning models, handles data pipelines, and deploys inference APIs.',
  },
  {
    role: 'Data Scientist',
    keySkills: ['Python', 'SQL', 'Data Analytics', 'Probability & Statistics', 'Machine Learning'],
    overview: 'Extracts actionable insights, builds predictive statistical models, and communicates findings.',
  },
  {
    role: 'Frontend / Full-Stack Engineer',
    keySkills: ['TypeScript', 'React', 'CSS / Tailwind', 'Node.js', 'Git', 'REST APIs'],
    overview: 'Architects intuitive user interfaces and integrates high-performance client web applications.',
  },
];

export const CareerView: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedRole, setSelectedRole] = useState(profile?.targetCareer || STANDARD_ROLES[0].role);

  // Job Description Analyzer
  const [jobText, setJobText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<JobDescriptionAnalysis | null>(null);

  useEffect(() => {
    api.getSkills().then(setSkills).catch(console.error);
  }, []);

  const handleRoleChange = async (roleName: string) => {
    setSelectedRole(roleName);
    try {
      await updateProfile({ targetCareer: roleName });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnalyzeJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobText.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await api.analyzeJobAI(jobText);
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentRoleConfig = STANDARD_ROLES.find(r => r.role === selectedRole) || STANDARD_ROLES[0];
  const studentSkillNames = skills.map(s => s.skillName.toLowerCase());

  const matchedCoreSkills = currentRoleConfig.keySkills.filter(req =>
    studentSkillNames.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))
  );

  const missingCoreSkills = currentRoleConfig.keySkills.filter(req =>
    !studentSkillNames.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))
  );

  const matchPercentage = Math.round((matchedCoreSkills.length / currentRoleConfig.keySkills.length) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-teal-600" />
          Career Roadmap & Skill Gap Analyzer
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Benchmark your approved student skills against real industry job descriptions without guesswork.
        </p>
      </div>

      {/* Target Role Selector & Alignment Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
              Target Career Path
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {STANDARD_ROLES.map((r) => (
                <button
                  key={r.role}
                  onClick={() => handleRoleChange(r.role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedRole === r.role
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {r.role}
                </button>
              ))}
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
            <span className="text-[11px] text-slate-400 block">Baseline Readiness</span>
            <span className="text-2xl font-black text-teal-700">{matchPercentage}%</span>
            <span className="text-[10px] text-slate-500 block">
              {matchedCoreSkills.length} of {currentRoleConfig.keySkills.length} competencies
            </span>
          </div>
        </div>

        {/* Skill Gap Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Verified Competencies You Have ({matchedCoreSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {matchedCoreSkills.map((sk) => (
                <span key={sk} className="text-xs font-medium bg-emerald-100/70 text-emerald-900 px-2 py-0.5 rounded">
                  {sk}
                </span>
              ))}
              {matchedCoreSkills.length === 0 && (
                <p className="text-xs text-slate-500 italic">None yet recorded.</p>
              )}
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Identified Skill Growth Targets ({missingCoreSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {missingCoreSkills.map((sk) => (
                <span key={sk} className="text-xs font-medium bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded">
                  {sk}
                </span>
              ))}
              {missingCoreSkills.length === 0 && (
                <p className="text-xs text-emerald-700 font-medium">All core prerequisites covered!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real Job Description Gap Analyzer */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Job Description Skill Gap Analyzer</h2>
            <p className="text-xs text-slate-500">
              Paste any internship or full-time posting. buddy4students compares requirements against your verified skills.
            </p>
          </div>
        </div>

        <form onSubmit={handleAnalyzeJob} className="space-y-3">
          <textarea
            rows={4}
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste job posting text here (e.g. 'Software Engineer Intern at Stripe: We are looking for candidates proficient in Python, SQL, and distributed systems...')"
            className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAnalyzing || !jobText.trim()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Posting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Skill Gap Audit</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Analysis Results Display */}
        {analysisResult && (
          <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in">
            <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-lg text-xs">
              <strong className="text-teal-900 font-bold block mb-1">Role Summary:</strong>
              <p className="text-teal-800">{analysisResult.roleSummary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                <span className="font-bold text-slate-900 block">Matched Skills You Have</span>
                <ul className="list-disc pl-4 space-y-1 text-emerald-800">
                  {analysisResult.matchedSkills.map((sk, idx) => (
                    <li key={idx}>{sk}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                <span className="font-bold text-slate-900 block">Skills to Learn or Demonstrate</span>
                <ul className="list-disc pl-4 space-y-1 text-amber-800">
                  {analysisResult.potentialGaps.map((sk, idx) => (
                    <li key={idx}>{sk}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <strong className="text-slate-900 font-bold block">Targeted Learning Steps:</strong>
              <ul className="list-decimal pl-4 space-y-1.5 text-slate-700">
                {analysisResult.learningRecommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
