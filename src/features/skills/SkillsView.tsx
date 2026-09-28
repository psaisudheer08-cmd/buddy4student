import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Skill, Certificate, Project, Achievement, QuizAttempt } from '../../types';
import {
  GraduationCap,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  FolderGit2,
  Trophy,
  HelpCircle,
  Trash2,
  Star,
  Sparkles,
} from 'lucide-react';

export const SkillsView: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'starred'>('all');

  // Add Skill Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState<'technical' | 'soft' | 'academic' | 'tool'>('technical');
  const [selfLevel, setSelfLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [targetLevel, setTargetLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('advanced');
  const [isStarred, setIsStarred] = useState(false);
  const [starRating, setStarRating] = useState(3);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [skillsData, certsData, projsData, achsData, qAttemptsData] = await Promise.all([
        api.getSkills(),
        api.getCertificates(),
        api.getProjects(),
        api.getAchievements(),
        api.getQuizAttempts(),
      ]);
      setSkills(skillsData);
      setCertificates(certsData);
      setProjects(projsData);
      setAchievements(achsData);
      setQuizAttempts(qAttemptsData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    try {
      const newSkill = await api.addSkill({
        skillName: skillName.trim(),
        category,
        selfAssessedLevel: selfLevel,
        targetLevel,
        isStarred,
        starRating,
        evidenceCount: 0,
        evidenceSources: [],
      });
      setSkills([...skills, newSkill]);
      setIsModalOpen(false);
      setSkillName('');
      setIsStarred(false);
      setStarRating(3);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStar = async (id: string) => {
    try {
      const updated = await api.toggleStarSkill(id);
      setSkills(skills.map(s => s.id === id ? updated : s));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetRating = async (id: string, rating: number) => {
    try {
      const updated = await api.setSkillRating(id, rating);
      setSkills(skills.map(s => s.id === id ? updated : s));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await api.deleteSkill(id);
      setSkills(skills.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to find matching evidence for a skill
  const getSkillEvidence = (skillNameStr: string) => {
    const sLower = skillNameStr.toLowerCase();
    const matchingCerts = certificates.filter(c =>
      c.relatedSkills.some(sk => sk.toLowerCase().includes(sLower)) ||
      (c.name || c.certificateName || '').toLowerCase().includes(sLower)
    );
    const matchingProjects = projects.filter(p =>
      (p.techStack || p.technologies || []).some(t => t.toLowerCase().includes(sLower)) ||
      p.title.toLowerCase().includes(sLower)
    );
    return {
      certs: matchingCerts,
      projects: matchingProjects,
      totalCount: matchingCerts.length + matchingProjects.length,
    };
  };

  const starredCount = skills.filter(s => s.isStarred).length;
  const filteredSkills = activeFilter === 'starred'
    ? skills.filter(s => s.isStarred)
    : skills;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Skills Matrix & Evidence Graph
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every skill is backed by real, tamper-proof student evidence (certificates, projects, drills).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skill</span>
        </button>
      </div>

      {/* Anti-Hallucination & Evidence Notice */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Anti-Fabrication & Evidence Guarantee: </strong>
          buddy4students never fabricates or invents skills on your resume or student profile. Skills with attached verified certificates and projects are tagged as <em>Evidence-Backed</em>, while unproven items remain strictly labeled as <em>Self-Assessed</em>.
        </div>
      </div>

      {/* Filter Tabs with Stars feature */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Skills ({skills.length})
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
          <span>Starred Core Skills ({starredCount})</span>
        </button>
      </div>

      {/* Skills Matrix Grid */}
      {filteredSkills.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-300" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {activeFilter === 'starred' ? 'No starred skills yet' : 'No skills recorded'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeFilter === 'starred'
              ? 'Star your primary competencies to highlight them with star ratings on your CV.'
              : 'Add skills to your profile to track evidence and proficiency ratings.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const evidence = getSkillEvidence(skill.skillName);
            const isVerified = evidence.totalCount > 0;
            const currentRating = skill.starRating || (skill.selfAssessedLevel === 'expert' ? 5 : skill.selfAssessedLevel === 'advanced' ? 4 : skill.selfAssessedLevel === 'intermediate' ? 3 : 2);

            return (
              <div
                key={skill.id}
                className={`bg-white border rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4 transition-all ${
                  skill.isStarred
                    ? 'border-amber-300 ring-1 ring-amber-200/60 bg-gradient-to-b from-amber-50/20 to-white'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {skill.category}
                        </span>
                        {skill.isStarred && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300/80 px-1.5 py-0.2 rounded-full">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                            Core
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{skill.skillName}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Self-Assessed
                        </span>
                      )}

                      {/* Star Toggle Button */}
                      <button
                        onClick={() => handleToggleStar(skill.id)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          skill.isStarred
                            ? 'text-amber-500 hover:bg-amber-100'
                            : 'text-slate-300 hover:text-amber-500'
                        }`}
                        title={skill.isStarred ? 'Unstar skill' : 'Star as primary competency'}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            skill.isStarred ? 'fill-amber-400 text-amber-500' : ''
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="text-slate-300 hover:text-red-500 p-1"
                        title="Delete skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 1-5 Interactive Star Rating */}
                  <div className="mt-3 flex items-center justify-between py-1.5 px-3 bg-amber-50/40 border border-amber-100 rounded-lg">
                    <span className="text-[10px] font-semibold text-amber-900">Proficiency Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((starNum) => (
                        <button
                          key={starNum}
                          type="button"
                          onClick={() => handleSetRating(skill.id, starNum)}
                          className="p-0.5 hover:scale-125 transition-transform cursor-pointer"
                          title={`Set rating to ${starNum} Stars`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              starNum <= currentRating
                                ? 'text-amber-500 fill-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-[10px] font-bold text-amber-800 ml-1">
                        {currentRating}/5
                      </span>
                    </div>
                  </div>

                  {/* Levels */}
                  <div className="mt-2.5 flex items-center justify-between text-xs py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Level</span>
                      <span className="font-semibold text-slate-800 capitalize">{skill.selfAssessedLevel}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Target Level</span>
                      <span className="font-semibold text-blue-600 capitalize">{skill.targetLevel}</span>
                    </div>
                  </div>

                  {/* Attached Evidence Items */}
                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Linked Proof ({evidence.totalCount})
                    </span>

                    {evidence.totalCount === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No certificates or projects linked yet.</p>
                    ) : (
                      <div className="space-y-1 text-xs">
                        {evidence.certs.map(c => (
                          <div key={c.id} className="flex items-center gap-1.5 text-slate-700 truncate">
                            <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{c.name}</span>
                          </div>
                        ))}
                        {evidence.projects.map(p => (
                          <div key={p.id} className="flex items-center gap-1.5 text-slate-700 truncate">
                            <FolderGit2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{p.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD SKILL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Skill to Student Matrix</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your skill and proficiency targets. buddy4students will automatically match evidence.
            </p>

            <form onSubmit={handleCreateSkill} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Skill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python, SQL, Docker, or System Design"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="technical">Technical</option>
                  <option value="tool">Tool / Framework</option>
                  <option value="academic">Academic Concept</option>
                  <option value="soft">Communication / Soft Skill</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Self-Assessed Level</label>
                  <select
                    value={selfLevel}
                    onChange={(e) => setSelfLevel(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Goal Level</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isStarred}
                    onChange={(e) => setIsStarred(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                  />
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    Star this as a Core Competency
                  </span>
                </label>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                    Self-Rating (1 to 5 Stars):
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setStarRating(num)}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            num <= starRating
                              ? 'text-amber-500 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-900 ml-1.5">
                      {starRating} of 5 Stars
                    </span>
                  </div>
                </div>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
