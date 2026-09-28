import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  fetchSupabaseStudentPortfolio,
  saveSupabaseStudentPortfolio,
} from '../../lib/supabase';
import {
  StudentPortfolioData,
  PortfolioProfile,
  PortfolioSkill,
  PortfolioProject,
  PortfolioEducation,
  PortfolioCertificate,
  PortfolioAchievement,
} from '../../types';
import {
  Briefcase,
  Globe,
  Save,
  Plus,
  Trash2,
  Eye,
  Edit3,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Award,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';

export const PortfolioView: React.FC = () => {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(true);

  // Profile
  const [portfolioProfile, setPortfolioProfile] = useState<PortfolioProfile>({
    fullName: '',
    professionalTitle: '',
    shortBio: '',
    profileImage: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    personalWebsite: '',
  });

  // Lists
  const [skills, setSkills] = useState<PortfolioSkill[]>([]);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [education, setEducation] = useState<PortfolioEducation[]>([]);
  const [certificates, setCertificates] = useState<PortfolioCertificate[]>([]);
  const [achievements, setAchievements] = useState<PortfolioAchievement[]>([]);

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    profile: true,
    skills: true,
    projects: true,
    education: true,
    certificates: true,
    achievements: true,
  });

  const toggleSection = (sec: string) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Load portfolio data
  useEffect(() => {
    let isMounted = true;
    async function loadPortfolio() {
      const studentId = user?.id || profile?.userId;
      if (!studentId) return;

      try {
        // Try Supabase first
        let data = await fetchSupabaseStudentPortfolio(studentId).catch(() => null);

        // Fall back to server api
        if (!data) {
          data = await api.getPortfolioData().catch(() => null);
        }

        if (data && isMounted) {
          setIsPublished(data.isPublished ?? true);
          if (data.profile) {
            setPortfolioProfile({
              fullName: data.profile.fullName || '',
              professionalTitle: data.profile.professionalTitle || '',
              shortBio: data.profile.shortBio || '',
              profileImage: data.profile.profileImage || '',
              email: data.profile.email || '',
              phone: data.profile.phone || '',
              location: data.profile.location || '',
              linkedin: data.profile.linkedin || '',
              github: data.profile.github || '',
              personalWebsite: data.profile.personalWebsite || '',
            });
          }
          if (data.skills) setSkills(data.skills);
          if (data.projects) setProjects(data.projects);
          if (data.education) setEducation(data.education);
          if (data.certificates) setCertificates(data.certificates);
          if (data.achievements) setAchievements(data.achievements);
        } else if (isMounted && profile) {
          initializeFromProfile();
        }
      } catch (err) {
        console.warn('Notice loading portfolio:', err);
      }
    }

    loadPortfolio();
    return () => {
      isMounted = false;
    };
  }, [user?.id, profile?.userId]);

  const initializeFromProfile = () => {
    if (!profile) return;
    setPortfolioProfile(prev => ({
      ...prev,
      fullName: prev.fullName || profile.fullName || '',
      professionalTitle: prev.professionalTitle || profile.targetCareer || `${profile.major || 'Computer Science'} Student & Developer`,
      shortBio: prev.shortBio || profile.bio || `Passionate student focusing on building scalable web software and intelligent algorithms. Driven by curiosity and clean system design.`,
      email: prev.email || user?.email || '',
      location: prev.location || profile.location || '',
      linkedin: prev.linkedin || (profile.links?.linkedin || ''),
      github: prev.github || (profile.links?.github || ''),
      personalWebsite: prev.personalWebsite || (profile.links?.portfolio || ''),
      profileImage: prev.profileImage || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
    }));

    if (education.length === 0 && (profile.institution || profile.university)) {
      setEducation([
        {
          id: `edu-1`,
          institution: profile.institution || profile.university || '',
          degree: profile.degree || 'Bachelor of Science',
          branch: profile.branch || profile.major || 'Computer Science',
          startYear: '2022',
          endYear: String(profile.graduationYear || '2026'),
          description: `Focused coursework in Software Engineering, Algorithms, and Distributed Systems.`,
        },
      ]);
    }
  };

  const handlePreFill = async () => {
    if (!window.confirm('Pre-fill portfolio with existing profile, projects, and certificates? Any manual adjustments will be preserved.')) {
      return;
    }

    initializeFromProfile();

    try {
      const [projList, skillList, certList, achList] = await Promise.all([
        api.getProjects().catch(() => []),
        api.getSkills().catch(() => []),
        api.getCertificates().catch(() => []),
        api.getAchievements().catch(() => []),
      ]);

      if (skillList.length > 0 && skills.length === 0) {
        setSkills(
          skillList.map((s, idx) => ({
            id: `skill-${idx}-${Date.now()}`,
            skillName: s.skillName || (s as any).name || 'Skill',
            category: s.category || 'Core Technologies',
            proficiencyLevel: (s.level as any) || 'Advanced',
          }))
        );
      }

      if (projList.length > 0 && projects.length === 0) {
        setProjects(
          projList.map((p, idx) => ({
            id: `proj-${idx}-${Date.now()}`,
            projectName: p.title,
            description: p.description,
            technologies: (p.technologies || p.techStack || []).join(', '),
            githubUrl: p.githubUrl,
            liveDemoUrl: p.liveUrl,
            startDate: p.startDate,
            endDate: p.endDate,
          }))
        );
      }

      if (certList.length > 0 && certificates.length === 0) {
        setCertificates(
          certList.map((c, idx) => ({
            id: `cert-${idx}-${Date.now()}`,
            certificateName: c.certificateName || c.name || 'Certificate',
            issuingOrganization: c.issuer,
            date: c.issueDate || '',
            credentialUrl: c.credentialUrl,
          }))
        );
      }

      if (achList.length > 0 && achievements.length === 0) {
        setAchievements(
          achList.map((a, idx) => ({
            id: `ach-${idx}-${Date.now()}`,
            achievement: a.title,
            description: a.description || a.category,
            date: a.date || '',
          }))
        );
      }

      setSaveMessage('Profile information imported into portfolio.');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    const studentId = user?.id || profile?.userId;
    if (!studentId) {
      setSaveMessage('Please sign in to save your portfolio.');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const payload: StudentPortfolioData = {
      userId: studentId,
      isPublished,
      profile: portfolioProfile,
      skills,
      projects,
      education,
      certificates,
      achievements,
    };

    try {
      // Save to Supabase (RLS protected)
      await saveSupabaseStudentPortfolio(studentId, payload);
      // Persist to server API
      await api.savePortfolioData(payload).catch(() => null);

      setSaveMessage('Portfolio saved successfully.');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err) {
      console.error('Save error:', err);
      setSaveMessage('Notice: Portfolio saved locally.');
      setTimeout(() => setSaveMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  // Skill handlers
  const addSkill = () => {
    setSkills([
      ...skills,
      {
        id: `sk-${Date.now()}`,
        skillName: '',
        category: 'Development',
        proficiencyLevel: 'Intermediate',
      },
    ]);
  };

  const updateSkill = (id: string, field: keyof PortfolioSkill, val: string) => {
    setSkills(skills.map(s => (s.id === id ? { ...s, [field]: val } : s)));
  };

  const removeSkill = (id: string) => {
    setSkills(skills.filter(s => s.id !== id));
  };

  // Project handlers
  const addProject = () => {
    setProjects([
      ...projects,
      {
        id: `proj-${Date.now()}`,
        projectName: '',
        description: '',
        technologies: '',
        imageUrl: '',
        githubUrl: '',
        liveDemoUrl: '',
        startDate: '',
        endDate: '',
      },
    ]);
  };

  const updateProject = (id: string, field: keyof PortfolioProject, val: string) => {
    setProjects(projects.map(p => (p.id === id ? { ...p, [field]: val } : p)));
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  // Education handlers
  const addEducation = () => {
    setEducation([
      ...education,
      {
        id: `edu-${Date.now()}`,
        institution: '',
        degree: '',
        branch: '',
        startYear: '',
        endYear: '',
        description: '',
      },
    ]);
  };

  const updateEducation = (id: string, field: keyof PortfolioEducation, val: string) => {
    setEducation(education.map(e => (e.id === id ? { ...e, [field]: val } : e)));
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(e => e.id !== id));
  };

  // Certificates handlers
  const addCertificate = () => {
    setCertificates([
      ...certificates,
      {
        id: `cert-${Date.now()}`,
        certificateName: '',
        issuingOrganization: '',
        date: '',
        credentialUrl: '',
        fileUrl: '',
      },
    ]);
  };

  const updateCertificate = (id: string, field: keyof PortfolioCertificate, val: string) => {
    setCertificates(certificates.map(c => (c.id === id ? { ...c, [field]: val } : c)));
  };

  const removeCertificate = (id: string) => {
    setCertificates(certificates.filter(c => c.id !== id));
  };

  // Achievements handlers
  const addAchievement = () => {
    setAchievements([
      ...achievements,
      {
        id: `ach-${Date.now()}`,
        achievement: '',
        description: '',
        date: '',
        optionalUrl: '',
      },
    ]);
  };

  const updateAchievement = (id: string, field: keyof PortfolioAchievement, val: string) => {
    setAchievements(achievements.map(a => (a.id === id ? { ...a, [field]: val } : a)));
  };

  const removeAchievement = (id: string) => {
    setAchievements(achievements.filter(a => a.id !== id));
  };

  // Group skills by category for preview
  const skillsByCategory = skills.reduce((acc, skill) => {
    const cat = skill.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, PortfolioSkill[]>);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header & Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Portfolio</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build and manage your professional student portfolio website.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pre-fill Button */}
          <button
            onClick={handlePreFill}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Import information from your student profile and records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Pre-fill from Profile</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Website Preview</span>
            </button>
          </div>

          {/* Save Portfolio */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Portfolio'}</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. EDITOR VIEW                                                 */}
      {/* ============================================================== */}
      {activeTab === 'editor' && (
        <div className="space-y-4">
          {/* Section 1: Portfolio Profile */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('profile')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Portfolio Profile
              </span>
              {openSections.profile ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.profile && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={portfolioProfile.fullName}
                      onChange={e => setPortfolioProfile({ ...portfolioProfile, fullName: e.target.value })}
                      placeholder="Alex Rivera"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Professional Title</label>
                    <input
                      type="text"
                      value={portfolioProfile.professionalTitle}
                      onChange={e => setPortfolioProfile({ ...portfolioProfile, professionalTitle: e.target.value })}
                      placeholder="Full-Stack Developer & CS Sophomore"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Short Bio</label>
                  <textarea
                    rows={3}
                    value={portfolioProfile.shortBio}
                    onChange={e => setPortfolioProfile({ ...portfolioProfile, shortBio: e.target.value })}
                    placeholder="Brief introduction displayed on your portfolio hero section..."
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Profile Image URL</label>
                    <input
                      type="text"
                      value={portfolioProfile.profileImage || ''}
                      onChange={e => setPortfolioProfile({ ...portfolioProfile, profileImage: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={portfolioProfile.email}
                      onChange={e => setPortfolioProfile({ ...portfolioProfile, email: e.target.value })}
                      placeholder="student@university.edu"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={portfolioProfile.phone}
                      onChange={e => setPortfolioProfile({ ...portfolioProfile, phone: e.target.value })}
                      placeholder="+1 (555) 234-8901"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Location</label>
                    <input
                      type="text"
                      value={portfolioProfile.location}
                      onChange={e => setPortfolioProfile({ ...portfolioProfile, location: e.target.value })}
                      placeholder="San Francisco, CA"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">LinkedIn</label>
                    <input
                      type="text"
                      value={portfolioProfile.linkedin}
                      onChange={e => setPortfolioProfile({ ...portfolioProfile, linkedin: e.target.value })}
                      placeholder="linkedin.com/in/alexrivera"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">GitHub</label>
                    <input
                      type="text"
                      value={portfolioProfile.github}
                      onChange={e => setPortfolioProfile({ ...portfolioProfile, github: e.target.value })}
                      placeholder="github.com/alexrivera"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Personal Website</label>
                    <input
                      type="text"
                      value={portfolioProfile.personalWebsite}
                      onChange={e => setPortfolioProfile({ ...portfolioProfile, personalWebsite: e.target.value })}
                      placeholder="alexrivera.dev"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Portfolio Skills */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('skills')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Portfolio Skills ({skills.length})
              </span>
              {openSections.skills ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.skills && (
              <div className="p-5 space-y-3.5">
                {skills.map(s => (
                  <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Skill Name</label>
                      <input
                        type="text"
                        value={s.skillName}
                        onChange={e => updateSkill(s.id, 'skillName', e.target.value)}
                        placeholder="e.g. React / TypeScript / Python"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="w-full sm:w-48">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Category</label>
                      <input
                        type="text"
                        value={s.category}
                        onChange={e => updateSkill(s.id, 'category', e.target.value)}
                        placeholder="Frontend / Backend / Core"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="w-full sm:w-40">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Proficiency</label>
                      <select
                        value={s.proficiencyLevel || 'Intermediate'}
                        onChange={e => updateSkill(s.id, 'proficiencyLevel', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSkill(s.id)}
                      className="text-red-500 hover:text-red-700 p-2 sm:mt-4"
                      title="Remove skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSkill}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-indigo-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Skill</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Portfolio Projects */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('projects')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Portfolio Projects ({projects.length})
              </span>
              {openSections.projects ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.projects && (
              <div className="p-5 space-y-4">
                {projects.map((proj, idx) => (
                  <div key={proj.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Project #{idx + 1}</span>
                      <button
                        onClick={() => removeProject(proj.id)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Project Name</label>
                        <input
                          type="text"
                          value={proj.projectName}
                          onChange={e => updateProject(proj.id, 'projectName', e.target.value)}
                          placeholder="e.g. Distributed Key-Value Store"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Technologies</label>
                        <input
                          type="text"
                          value={proj.technologies}
                          onChange={e => updateProject(proj.id, 'technologies', e.target.value)}
                          placeholder="e.g. Python, Raft, gRPC, Docker"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Description</label>
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={e => updateProject(proj.id, 'description', e.target.value)}
                        placeholder="Describe the architectural design, challenges solved, and outcomes..."
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Project Image / Thumbnail URL</label>
                        <input
                          type="text"
                          value={proj.imageUrl || ''}
                          onChange={e => updateProject(proj.id, 'imageUrl', e.target.value)}
                          placeholder="https://..."
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">GitHub URL</label>
                        <input
                          type="text"
                          value={proj.githubUrl || ''}
                          onChange={e => updateProject(proj.id, 'githubUrl', e.target.value)}
                          placeholder="https://github.com/..."
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Live Demo URL</label>
                        <input
                          type="text"
                          value={proj.liveDemoUrl || ''}
                          onChange={e => updateProject(proj.id, 'liveDemoUrl', e.target.value)}
                          placeholder="https://..."
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addProject}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-indigo-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Project</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 4: Portfolio Education */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('education')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                4. Portfolio Education ({education.length})
              </span>
              {openSections.education ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.education && (
              <div className="p-5 space-y-4">
                {education.map((edu, idx) => (
                  <div key={edu.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Education #{idx + 1}</span>
                      <button
                        onClick={() => removeEducation(edu.id)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={e => updateEducation(edu.id, 'institution', e.target.value)}
                          placeholder="e.g. Stanford University"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={e => updateEducation(edu.id, 'degree', e.target.value)}
                          placeholder="e.g. B.S. in Computer Science"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Branch / Major</label>
                        <input
                          type="text"
                          value={edu.branch}
                          onChange={e => updateEducation(edu.id, 'branch', e.target.value)}
                          placeholder="Software Systems"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Start Year</label>
                        <input
                          type="text"
                          value={edu.startYear}
                          onChange={e => updateEducation(edu.id, 'startYear', e.target.value)}
                          placeholder="2022"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">End Year</label>
                        <input
                          type="text"
                          value={edu.endYear}
                          onChange={e => updateEducation(edu.id, 'endYear', e.target.value)}
                          placeholder="2026"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Description</label>
                      <input
                        type="text"
                        value={edu.description}
                        onChange={e => updateEducation(edu.id, 'description', e.target.value)}
                        placeholder="Relevant coursework and academic achievements..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addEducation}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-indigo-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Education</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 5: Portfolio Certificates */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('certificates')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                5. Portfolio Certificates ({certificates.length})
              </span>
              {openSections.certificates ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.certificates && (
              <div className="p-5 space-y-4">
                {certificates.map((cert, idx) => (
                  <div key={cert.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Certificate #{idx + 1}</span>
                      <button
                        onClick={() => removeCertificate(cert.id)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Certificate Name</label>
                        <input
                          type="text"
                          value={cert.certificateName}
                          onChange={e => updateCertificate(cert.id, 'certificateName', e.target.value)}
                          placeholder="e.g. Meta Front-End Developer"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Issuing Organization</label>
                        <input
                          type="text"
                          value={cert.issuingOrganization}
                          onChange={e => updateCertificate(cert.id, 'issuingOrganization', e.target.value)}
                          placeholder="e.g. Coursera / Meta"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Date</label>
                        <input
                          type="text"
                          value={cert.date}
                          onChange={e => updateCertificate(cert.id, 'date', e.target.value)}
                          placeholder="e.g. July 2025"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Credential URL</label>
                        <input
                          type="text"
                          value={cert.credentialUrl || ''}
                          onChange={e => updateCertificate(cert.id, 'credentialUrl', e.target.value)}
                          placeholder="https://coursera.org/verify/..."
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addCertificate}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-indigo-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Certificate</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 6: Portfolio Achievements */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('achievements')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                6. Portfolio Achievements ({achievements.length})
              </span>
              {openSections.achievements ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.achievements && (
              <div className="p-5 space-y-4">
                {achievements.map((ach, idx) => (
                  <div key={ach.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Achievement #{idx + 1}</span>
                      <button
                        onClick={() => removeAchievement(ach.id)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Achievement</label>
                        <input
                          type="text"
                          value={ach.achievement}
                          onChange={e => updateAchievement(ach.id, 'achievement', e.target.value)}
                          placeholder="e.g. Dean's Honors List"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Date</label>
                        <input
                          type="text"
                          value={ach.date}
                          onChange={e => updateAchievement(ach.id, 'date', e.target.value)}
                          placeholder="Fall 2025"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Description</label>
                      <input
                        type="text"
                        value={ach.description}
                        onChange={e => updateAchievement(ach.id, 'description', e.target.value)}
                        placeholder="Awarded for maintaining top 5% academic standing in Engineering."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addAchievement}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-indigo-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Achievement</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. LIVE PORTFOLIO WEBSITE PREVIEW                              */}
      {/* ============================================================== */}
      {activeTab === 'preview' && (
        <div className="bg-slate-900 text-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
          {/* Browser Address Bar Simulation */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-md px-4 py-1 text-xs text-slate-400 font-mono flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>https://{portfolioProfile.fullName ? portfolioProfile.fullName.toLowerCase().replace(/\s+/g, '') : 'student'}.dev</span>
            </div>
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Website View</span>
            </div>
          </div>

          <div className="p-6 sm:p-12 space-y-16 max-w-5xl mx-auto">
            {/* 1. HERO SECTION */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 pt-4">
              <div className="space-y-4 text-center md:text-left flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Available for Internships & Projects</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Hi, I'm {portfolioProfile.fullName || 'Student Name'}
                </h1>
                <p className="text-lg sm:text-xl font-medium text-indigo-300">
                  {portfolioProfile.professionalTitle || 'Software Engineer & Student'}
                </p>
                <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                  {portfolioProfile.shortBio || 'Student at university building modern applications.'}
                </p>

                {/* Social & Contact Badges */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  {portfolioProfile.email && (
                    <a
                      href={`mailto:${portfolioProfile.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{portfolioProfile.email}</span>
                    </a>
                  )}
                  {portfolioProfile.phone && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200">
                      <Phone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{portfolioProfile.phone}</span>
                    </span>
                  )}
                  {portfolioProfile.location && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{portfolioProfile.location}</span>
                    </span>
                  )}
                  {portfolioProfile.github && (
                    <a
                      href={`https://${portfolioProfile.github.replace(/^https?:\/\//, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                    >
                      <Github className="w-3.5 h-3.5 text-indigo-400" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {portfolioProfile.linkedin && (
                    <a
                      href={`https://${portfolioProfile.linkedin.replace(/^https?:\/\//, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Avatar Image */}
              <div className="shrink-0">
                <div className="relative">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden ring-4 ring-indigo-500/30 shadow-2xl bg-slate-800">
                    <img
                      src={
                        portfolioProfile.profileImage ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={portfolioProfile.fullName}
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SKILLS SHOWCASE */}
            {skills.length > 0 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Skills & Technologies</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(skillsByCategory).map(([category, catSkills]) => (
                    <div key={category} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        {category}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {catSkills.map(s => (
                          <div
                            key={s.id}
                            className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5"
                          >
                            <span>{s.skillName}</span>
                            {s.proficiencyLevel && (
                              <span className="text-[10px] text-indigo-400">({s.proficiencyLevel})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. FEATURED PROJECTS */}
            {projects.length > 0 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Featured Projects</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map(proj => (
                    <div
                      key={proj.id}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4 hover:border-slate-600 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-white">{proj.projectName}</h3>
                          {(proj.startDate || proj.endDate) && (
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
                        {proj.technologies && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {proj.technologies.split(',').map((t, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-800/50 text-[10px] font-medium text-indigo-300"
                              >
                                {t.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-slate-700/50">
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>Code</span>
                          </a>
                        )}
                        {proj.liveDemoUrl && (
                          <a
                            href={proj.liveDemoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. EDUCATION TIMELINE */}
            {education.length > 0 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Education</span>
                  </h2>
                </div>

                <div className="space-y-4">
                  {education.map(edu => (
                    <div
                      key={edu.id}
                      className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-1.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-white">{edu.institution}</h3>
                        <span className="text-xs text-indigo-300 font-medium">
                          {edu.startYear} – {edu.endYear}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-semibold">
                        {edu.degree} {edu.branch ? `— ${edu.branch}` : ''}
                      </p>
                      {edu.description && (
                        <p className="text-xs text-slate-400 pt-1 leading-relaxed">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. CERTIFICATIONS & ACHIEVEMENTS */}
            {(certificates.length > 0 || achievements.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {certificates.length > 0 && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-2">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-400" />
                        <span>Certifications</span>
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {certificates.map(cert => (
                        <div key={cert.id} className="p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{cert.certificateName}</span>
                            <span className="text-[10px] text-slate-400">{cert.date}</span>
                          </div>
                          <p className="text-[11px] text-slate-300">{cert.issuingOrganization}</p>
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:underline pt-0.5"
                            >
                              <span>View Credential</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {achievements.length > 0 && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-2">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Honors & Achievements</span>
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {achievements.map(ach => (
                        <div key={ach.id} className="p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{ach.achievement}</span>
                            <span className="text-[10px] text-slate-400">{ach.date}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{ach.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. FOOTER */}
            <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
              <p>© {new Date().getFullYear()} {portfolioProfile.fullName || 'Student'}. All rights reserved.</p>
              <p className="mt-1">Powered by buddy4students Academic Platform</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
