import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCircle, Save, Check, ShieldCheck, Database, AlertCircle } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { profile, updateProfile, user, isSupabaseAuth } = useAuth();

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [preferredName, setPreferredName] = useState(profile?.preferredName || '');
  const [university, setUniversity] = useState(profile?.university || profile?.institution || '');
  const [degree, setDegree] = useState(profile?.degree || '');
  const [branch, setBranch] = useState(profile?.branch || profile?.major || '');
  const [academicYear, setAcademicYear] = useState(profile?.academicYear || 'Year 3');
  const [semester, setSemester] = useState(profile?.semester || 'Semester 5');
  const [graduationYear, setGraduationYear] = useState(profile?.graduationYear || 2026);
  const [targetCareer, setTargetCareer] = useState(profile?.targetCareer || '');
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferredLanguage || 'English');
  const [bio, setBio] = useState(profile?.bio || '');
  const [learningStyle, setLearningStyle] = useState(profile?.learningStyle || 'visual');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPreferredName(profile.preferredName || '');
      setUniversity(profile.university || profile.institution || '');
      setDegree(profile.degree || '');
      setBranch(profile.branch || profile.major || '');
      setAcademicYear(profile.academicYear || 'Year 3');
      setSemester(profile.semester || 'Semester 5');
      setGraduationYear(profile.graduationYear || 2026);
      setTargetCareer(profile.targetCareer || '');
      setPreferredLanguage(profile.preferredLanguage || 'English');
      setBio(profile.bio || '');
      setLearningStyle(profile.learningStyle || 'visual');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateProfile({
        fullName,
        preferredName,
        university,
        institution: university,
        degree,
        branch,
        major: branch,
        academicYear,
        semester,
        graduationYear: Number(graduationYear),
        targetCareer,
        preferredLanguage,
        bio,
        learningStyle: learningStyle as any,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || 'Failed to update profile. Please verify your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-600" />
            Student Profile & Academic Context
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized with Supabase <code className="text-blue-600 font-mono">public.profiles</code> under Row-Level Security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Supabase RLS Active</span>
          </div>
        </div>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
        {/* Personal details */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Personal & Identification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal / Academic Name (<code className="text-slate-400 font-mono text-[10px]">full_name</code>)
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Name (<code className="text-slate-400 font-mono text-[10px]">preferred_name</code>)
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Academic Details - Supabase columns: university, degree, branch, academic_year, semester, graduation_year */}
        <div className="pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            University & Course Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                University (<code className="text-slate-400 font-mono text-[10px]">university</code>)
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. Stanford University"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Degree (<code className="text-slate-400 font-mono text-[10px]">degree</code>)
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. B.Tech / B.S."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch / Major (<code className="text-slate-400 font-mono text-[10px]">branch</code>)
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Computer Science and Engineering"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Year (<code className="text-slate-400 font-mono text-[10px]">academic_year</code>)
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 3rd Year / Senior"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Semester (<code className="text-slate-400 font-mono text-[10px]">semester</code>)
              </label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. Semester 5"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Graduation Year (<code className="text-slate-400 font-mono text-[10px]">graduation_year</code>)
              </label>
              <input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                placeholder="2026"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Career & Language Preferences */}
        <div className="pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Career Goal & Language
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Career (<code className="text-slate-400 font-mono text-[10px]">target_career</code>)
              </label>
              <input
                type="text"
                value={targetCareer}
                onChange={(e) => setTargetCareer(e.target.value)}
                placeholder="e.g. Software Development Engineer"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Language (<code className="text-slate-400 font-mono text-[10px]">preferred_language</code>)
              </label>
              <input
                type="text"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                placeholder="e.g. English"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* AI Tutor Preferences */}
        <div className="pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            AI Companion Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Learning Style</label>
              <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="visual">Visual (Diagrams & Flowcharts)</option>
                <option value="example_based">Example-Based (Code Snippets & Analogy)</option>
                <option value="theory_first">Theory First (Mathematical & Formal)</option>
                <option value="hands_on">Hands-On (Practice Drills First)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Short Bio</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of your learning journey..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Saved to Supabase public.profiles!</span>
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving to Supabase...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
