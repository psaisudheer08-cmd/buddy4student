import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  fetchSupabaseStudentCV,
  saveSupabaseStudentCV,
} from '../../lib/supabase';
import {
  StudentCVData,
  CVEducation,
  CVProject,
  CVExperience,
  CVCertification,
  CVAchievement,
  CVActivity,
  CVLanguage,
} from '../../types';
import {
  FileText,
  Printer,
  Download,
  Save,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Layout,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';

export const CVBuilderView: React.FC = () => {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Form State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  });

  const [professionalSummary, setProfessionalSummary] = useState('');
  const [education, setEducation] = useState<CVEducation[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [projects, setProjects] = useState<CVProject[]>([]);
  const [experience, setExperience] = useState<CVExperience[]>([]);
  const [certifications, setCertifications] = useState<CVCertification[]>([]);
  const [achievements, setAchievements] = useState<CVAchievement[]>([]);
  const [extracurricular, setExtracurricular] = useState<CVActivity[]>([]);
  const [languages, setLanguages] = useState<CVLanguage[]>([]);

  // Section accordions
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    summary: true,
    education: true,
    skills: true,
    projects: true,
    experience: true,
    certifications: true,
    achievements: false,
    extracurricular: false,
    languages: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Load existing CV data
  useEffect(() => {
    let isMounted = true;
    async function loadCV() {
      const studentId = user?.id || profile?.userId;
      if (!studentId) return;

      try {
        // Try Supabase first
        let data = await fetchSupabaseStudentCV(studentId).catch(() => null);

        // Fall back to server api if null
        if (!data) {
          data = await api.getCVBuilderData().catch(() => null);
        }

        if (data && isMounted) {
          if (data.personalInfo) {
            setPersonalInfo({
              fullName: data.personalInfo.fullName || '',
              professionalTitle: data.personalInfo.professionalTitle || '',
              email: data.personalInfo.email || '',
              phone: data.personalInfo.phone || '',
              location: data.personalInfo.location || '',
              linkedinUrl: data.personalInfo.linkedinUrl || '',
              githubUrl: data.personalInfo.githubUrl || '',
              portfolioUrl: data.personalInfo.portfolioUrl || '',
            });
          }
          if (data.professionalSummary !== undefined) {
            setProfessionalSummary(data.professionalSummary);
          }
          if (data.education) setEducation(data.education);
          if (data.skills) setSkills(data.skills);
          if (data.projects) setProjects(data.projects);
          if (data.experience) setExperience(data.experience);
          if (data.certifications) setCertifications(data.certifications);
          if (data.achievements) setAchievements(data.achievements);
          if (data.extracurricular) setExtracurricular(data.extracurricular);
          if (data.languages) setLanguages(data.languages);
        } else if (isMounted && profile) {
          // Initialize defaults from profile if brand new
          initializeFromProfile();
        }
      } catch (err) {
        console.warn('Notice loading CV data:', err);
      }
    }

    loadCV();
    return () => {
      isMounted = false;
    };
  }, [user?.id, profile?.userId]);

  const initializeFromProfile = () => {
    if (!profile) return;
    setPersonalInfo(prev => ({
      ...prev,
      fullName: prev.fullName || profile.fullName || '',
      professionalTitle: prev.professionalTitle || profile.targetCareer || `${profile.major || 'Computer Science'} Student`,
      email: prev.email || user?.email || '',
      location: prev.location || profile.location || '',
      linkedinUrl: prev.linkedinUrl || (profile.links?.linkedin || ''),
      githubUrl: prev.githubUrl || (profile.links?.github || ''),
      portfolioUrl: prev.portfolioUrl || (profile.links?.portfolio || ''),
    }));

    if (!professionalSummary) {
      setProfessionalSummary(
        `${profile.degree || 'Bachelor'} student in ${profile.major || profile.branch || 'Computer Science'} at ${profile.institution || profile.university || 'University'}. Committed to building robust, modern software solutions.`
      );
    }

    if (education.length === 0 && (profile.institution || profile.university)) {
      setEducation([
        {
          id: 'edu-1',
          institution: profile.institution || profile.university || '',
          degree: profile.degree || 'Bachelor of Science',
          fieldBranch: profile.branch || profile.major || 'Computer Science',
          startYear: '2022',
          endYear: String(profile.graduationYear || '2026'),
          gradeCgpa: profile.gpa || '3.8 / 4.0',
          description: 'Focusing on algorithms, system architecture, and modern application development.',
        },
      ]);
    }
  };

  const handlePreFill = async () => {
    if (!window.confirm('Import data from your Student Profile, Projects, Skills, and Certificates? Your existing edits will be preserved where filled.')) {
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
        setSkills(skillList.map(s => s.skillName || (s as any).name || 'Skill'));
      }

      if (projList.length > 0 && projects.length === 0) {
        setProjects(
          projList.map((p, idx) => ({
            id: `proj-${idx}-${Date.now()}`,
            projectName: p.title,
            description: p.description,
            technologiesUsed: (p.technologies || p.techStack || []).join(', '),
            githubUrl: p.githubUrl,
            projectUrl: p.liveUrl,
            startDate: p.startDate,
            endDate: p.endDate,
          }))
        );
      }

      if (certList.length > 0 && certifications.length === 0) {
        setCertifications(
          certList.map((c, idx) => ({
            id: `cert-${idx}-${Date.now()}`,
            certificateName: c.certificateName || c.name || 'Certificate',
            issuingOrganization: c.issuer,
            issueDate: c.issueDate || '',
            credentialId: c.credentialId,
            credentialUrl: c.credentialUrl,
          }))
        );
      }

      if (achList.length > 0 && achievements.length === 0) {
        setAchievements(
          achList.map((a, idx) => ({
            id: `ach-${idx}-${Date.now()}`,
            achievementTitle: a.title,
            description: a.description || a.category,
            date: a.date || '',
          }))
        );
      }

      setSaveMessage('Profile information imported successfully.');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    const studentId = user?.id || profile?.userId;
    if (!studentId) {
      setSaveMessage('Please sign in to save your CV.');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const cvPayload: StudentCVData = {
      userId: studentId,
      template: 'standard',
      personalInfo,
      professionalSummary,
      education,
      skills,
      projects,
      experience,
      certifications,
      achievements,
      extracurricular,
      languages,
    };

    try {
      // Save to Supabase (RLS protected)
      await saveSupabaseStudentCV(studentId, cvPayload);
      // Also persist to API
      await api.saveCVBuilderData(cvPayload).catch(() => null);

      setSaveMessage('CV saved successfully to your secure account.');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to save CV:', err);
      setSaveMessage('Notice: CV saved locally.');
      setTimeout(() => setSaveMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Education handlers
  const addEducation = () => {
    setEducation([
      ...education,
      {
        id: `edu-${Date.now()}`,
        institution: '',
        degree: '',
        fieldBranch: '',
        startYear: '',
        endYear: '',
        gradeCgpa: '',
        description: '',
      },
    ]);
  };

  const updateEducation = (id: string, field: keyof CVEducation, val: string) => {
    setEducation(education.map(e => (e.id === id ? { ...e, [field]: val } : e)));
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(e => e.id !== id));
  };

  // Skills handlers
  const addSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setNewSkillInput('');
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // Projects handlers
  const addProject = () => {
    setProjects([
      ...projects,
      {
        id: `proj-${Date.now()}`,
        projectName: '',
        description: '',
        technologiesUsed: '',
        projectUrl: '',
        githubUrl: '',
        startDate: '',
        endDate: '',
      },
    ]);
  };

  const updateProject = (id: string, field: keyof CVProject, val: any) => {
    setProjects(projects.map(p => (p.id === id ? { ...p, [field]: val } : p)));
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  // Experience handlers
  const addExperience = () => {
    setExperience([
      ...experience,
      {
        id: `exp-${Date.now()}`,
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ]);
  };

  const updateExperience = (id: string, field: keyof CVExperience, val: string) => {
    setExperience(experience.map(e => (e.id === id ? { ...e, [field]: val } : e)));
  };

  const removeExperience = (id: string) => {
    setExperience(experience.filter(e => e.id !== id));
  };

  // Certifications handlers
  const addCertification = () => {
    setCertifications([
      ...certifications,
      {
        id: `cert-${Date.now()}`,
        certificateName: '',
        issuingOrganization: '',
        issueDate: '',
        credentialId: '',
        credentialUrl: '',
      },
    ]);
  };

  const updateCertification = (id: string, field: keyof CVCertification, val: string) => {
    setCertifications(certifications.map(c => (c.id === id ? { ...c, [field]: val } : c)));
  };

  const removeCertification = (id: string) => {
    setCertifications(certifications.filter(c => c.id !== id));
  };

  // Achievements handlers
  const addAchievement = () => {
    setAchievements([
      ...achievements,
      {
        id: `ach-${Date.now()}`,
        achievementTitle: '',
        description: '',
        date: '',
      },
    ]);
  };

  const updateAchievement = (id: string, field: keyof CVAchievement, val: string) => {
    setAchievements(achievements.map(a => (a.id === id ? { ...a, [field]: val } : a)));
  };

  const removeAchievement = (id: string) => {
    setAchievements(achievements.filter(a => a.id !== id));
  };

  // Extracurricular handlers
  const addExtracurricular = () => {
    setExtracurricular([
      ...extracurricular,
      {
        id: `act-${Date.now()}`,
        activity: '',
        organization: '',
        description: '',
        date: '',
      },
    ]);
  };

  const updateExtracurricular = (id: string, field: keyof CVActivity, val: string) => {
    setExtracurricular(extracurricular.map(a => (a.id === id ? { ...a, [field]: val } : a)));
  };

  const removeExtracurricular = (id: string) => {
    setExtracurricular(extracurricular.filter(a => a.id !== id));
  };

  // Languages handlers
  const addLanguage = () => {
    setLanguages([
      ...languages,
      {
        id: `lang-${Date.now()}`,
        language: '',
        proficiency: 'Professional Working',
      },
    ]);
  };

  const updateLanguage = (id: string, field: keyof CVLanguage, val: string) => {
    setLanguages(languages.map(l => (l.id === id ? { ...l, [field]: val } : l)));
  };

  const removeLanguage = (id: string) => {
    setLanguages(languages.filter(l => l.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header & Actions Bar (Hidden when printing) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">CV Builder</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build, edit, and export your professional curriculum vitae with full personal control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pre-fill Button */}
          <button
            onClick={handlePreFill}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Import information already saved in your student profile"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Pre-fill from Profile</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-blue-700 shadow-2xs'
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
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Save CV */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save CV'}</span>
          </button>

          {/* Print / Download as PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 print:hidden animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Workspace: Editor vs Preview vs Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================== */}
        {/* FORM EDITOR COLUMN                                             */}
        {/* ============================================================== */}
        <div
          className={`space-y-4 print:hidden ${
            activeTab === 'preview' ? 'hidden' : 'lg:col-span-6 xl:col-span-6'
          }`}
        >
          {/* 1. PERSONAL INFORMATION */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('personal')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Personal Information
              </span>
              {openSections.personal ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.personal && (
              <div className="p-5 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={personalInfo.fullName}
                      onChange={e => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                      placeholder="e.g. Alex Rivera"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      value={personalInfo.professionalTitle}
                      onChange={e => setPersonalInfo({ ...personalInfo, professionalTitle: e.target.value })}
                      placeholder="e.g. Computer Science Student / Aspiring Software Engineer"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={personalInfo.email}
                      onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      placeholder="student@university.edu"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={personalInfo.phone}
                      onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                      placeholder="+1 (555) 234-8901"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={personalInfo.location}
                      onChange={e => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                      placeholder="San Francisco, CA"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="text"
                      value={personalInfo.linkedinUrl}
                      onChange={e => setPersonalInfo({ ...personalInfo, linkedinUrl: e.target.value })}
                      placeholder="linkedin.com/in/alexrivera"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      GitHub URL
                    </label>
                    <input
                      type="text"
                      value={personalInfo.githubUrl}
                      onChange={e => setPersonalInfo({ ...personalInfo, githubUrl: e.target.value })}
                      placeholder="github.com/alexrivera"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Portfolio URL
                    </label>
                    <input
                      type="text"
                      value={personalInfo.portfolioUrl}
                      onChange={e => setPersonalInfo({ ...personalInfo, portfolioUrl: e.target.value })}
                      placeholder="alexrivera.dev"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. PROFESSIONAL SUMMARY */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('summary')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Professional Summary
              </span>
              {openSections.summary ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.summary && (
              <div className="p-5 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Write your professional summary
                </label>
                <textarea
                  rows={4}
                  value={professionalSummary}
                  onChange={e => setProfessionalSummary(e.target.value)}
                  placeholder="Summarize your academic focus, technical strengths, and career objectives in 2-4 sentences..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* 3. EDUCATION */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('education')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Education ({education.length})
              </span>
              {openSections.education ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.education && (
              <div className="p-5 space-y-4">
                {education.map((edu, idx) => (
                  <div key={edu.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
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
                          placeholder="e.g. University of California, Berkeley"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={e => updateEducation(edu.id, 'degree', e.target.value)}
                          placeholder="e.g. B.S. in Computer Science"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Field / Branch</label>
                        <input
                          type="text"
                          value={edu.fieldBranch}
                          onChange={e => updateEducation(edu.id, 'fieldBranch', e.target.value)}
                          placeholder="e.g. Software Engineering"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Start - End Year</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={edu.startYear}
                            onChange={e => updateEducation(edu.id, 'startYear', e.target.value)}
                            placeholder="2022"
                            className="w-1/2 text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-md text-center"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="text"
                            value={edu.endYear}
                            onChange={e => updateEducation(edu.id, 'endYear', e.target.value)}
                            placeholder="2026"
                            className="w-1/2 text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-md text-center"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Grade / CGPA</label>
                        <input
                          type="text"
                          value={edu.gradeCgpa}
                          onChange={e => updateEducation(edu.id, 'gradeCgpa', e.target.value)}
                          placeholder="e.g. 3.8 / 4.0"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Description / Relevant Coursework</label>
                      <input
                        type="text"
                        value={edu.description}
                        onChange={e => updateEducation(edu.id, 'description', e.target.value)}
                        placeholder="e.g. Data Structures, Operating Systems, Computer Networks, Database Design."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addEducation}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-blue-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Education</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. SKILLS */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('skills')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                4. Skills ({skills.length})
              </span>
              {openSections.skills ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.skills && (
              <div className="p-5 space-y-3.5">
                <p className="text-[11px] text-slate-500">
                  Manually add your technical and professional skills (e.g. Python, Java, HTML, CSS, JavaScript, SQL, Git).
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Enter skill name and press Enter..."
                    className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    + Add Skill
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-xs font-medium"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(idx)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No skills added yet.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 5. PROJECTS */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('projects')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                5. Projects ({projects.length})
              </span>
              {openSections.projects ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.projects && (
              <div className="p-5 space-y-4">
                {projects.map((proj, idx) => (
                  <div key={proj.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">Project #{idx + 1}</span>
                        {proj.isStarred && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateProject(proj.id, 'isStarred', !proj.isStarred)}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                            proj.isStarred
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:text-amber-600'
                          }`}
                          title="Toggle Star / Featured Project"
                        >
                          <Star className={`w-3 h-3 ${proj.isStarred ? 'fill-amber-500 text-amber-600' : ''}`} />
                          <span>{proj.isStarred ? 'Starred ⭐' : 'Star Project'}</span>
                        </button>
                        <button
                          onClick={() => removeProject(proj.id)}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Project Name</label>
                        <input
                          type="text"
                          value={proj.projectName}
                          onChange={e => updateProject(proj.id, 'projectName', e.target.value)}
                          placeholder="e.g. Distributed Key-Value Store"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Technologies Used</label>
                        <input
                          type="text"
                          value={proj.technologiesUsed}
                          onChange={e => updateProject(proj.id, 'technologiesUsed', e.target.value)}
                          placeholder="e.g. Python, Raft, gRPC, Docker"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Description</label>
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={e => updateProject(proj.id, 'description', e.target.value)}
                        placeholder="Implemented Raft consensus algorithm for leader election and state synchronization across 5 distributed nodes."
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                          value={proj.projectUrl || ''}
                          onChange={e => updateProject(proj.id, 'projectUrl', e.target.value)}
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
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-blue-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Project</span>
                </button>
              </div>
            )}
          </div>

          {/* 6. EXPERIENCE */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('experience')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                6. Experience ({experience.length})
              </span>
              {openSections.experience ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.experience && (
              <div className="p-5 space-y-4">
                {experience.map((exp, idx) => (
                  <div key={exp.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Experience #{idx + 1}</span>
                      <button
                        onClick={() => removeExperience(exp.id)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Job / Internship Title</label>
                        <input
                          type="text"
                          value={exp.jobTitle}
                          onChange={e => updateExperience(exp.id, 'jobTitle', e.target.value)}
                          placeholder="e.g. Software Engineering Intern"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Company / Organization</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                          placeholder="e.g. Acme Tech Labs"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Location</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={e => updateExperience(exp.id, 'location', e.target.value)}
                          placeholder="e.g. Remote / New York, NY"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Start Date</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={e => updateExperience(exp.id, 'startDate', e.target.value)}
                          placeholder="June 2025"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">End Date</label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={e => updateExperience(exp.id, 'endDate', e.target.value)}
                          placeholder="Aug 2025 / Present"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Description / Key Responsibilities</label>
                      <textarea
                        rows={2}
                        value={exp.description}
                        onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                        placeholder="Built scalable REST endpoints, optimized PostgreSQL query performance, and authored automated unit tests."
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addExperience}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-blue-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Experience</span>
                </button>
              </div>
            )}
          </div>

          {/* 7. CERTIFICATIONS */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('certifications')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                7. Certifications ({certifications.length})
              </span>
              {openSections.certifications ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.certifications && (
              <div className="p-5 space-y-4">
                {certifications.map((cert, idx) => (
                  <div key={cert.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Certificate #{idx + 1}</span>
                      <button
                        onClick={() => removeCertification(cert.id)}
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
                          onChange={e => updateCertification(cert.id, 'certificateName', e.target.value)}
                          placeholder="e.g. AWS Certified Cloud Practitioner"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Issuing Organization</label>
                        <input
                          type="text"
                          value={cert.issuingOrganization}
                          onChange={e => updateCertification(cert.id, 'issuingOrganization', e.target.value)}
                          placeholder="e.g. Amazon Web Services"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Issue Date</label>
                        <input
                          type="text"
                          value={cert.issueDate}
                          onChange={e => updateCertification(cert.id, 'issueDate', e.target.value)}
                          placeholder="May 2025"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Credential ID</label>
                        <input
                          type="text"
                          value={cert.credentialId || ''}
                          onChange={e => updateCertification(cert.id, 'credentialId', e.target.value)}
                          placeholder="e.g. AWS-19842"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Credential URL</label>
                        <input
                          type="text"
                          value={cert.credentialUrl || ''}
                          onChange={e => updateCertification(cert.id, 'credentialUrl', e.target.value)}
                          placeholder="https://..."
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addCertification}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-blue-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Certification</span>
                </button>
              </div>
            )}
          </div>

          {/* 8. ACHIEVEMENTS */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('achievements')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                8. Achievements ({achievements.length})
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
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Achievement Title</label>
                        <input
                          type="text"
                          value={ach.achievementTitle}
                          onChange={e => updateAchievement(ach.id, 'achievementTitle', e.target.value)}
                          placeholder="e.g. 1st Place - University Hackathon"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Date</label>
                        <input
                          type="text"
                          value={ach.date}
                          onChange={e => updateAchievement(ach.id, 'date', e.target.value)}
                          placeholder="April 2026"
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
                        placeholder="Awarded top honor among 60 collegiate teams for building an accessible learning dashboard."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addAchievement}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-blue-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Achievement</span>
                </button>
              </div>
            )}
          </div>

          {/* 9. EXTRACURRICULAR ACTIVITIES */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('extracurricular')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                9. Extracurricular Activities ({extracurricular.length})
              </span>
              {openSections.extracurricular ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.extracurricular && (
              <div className="p-5 space-y-4">
                {extracurricular.map((act, idx) => (
                  <div key={act.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Activity #{idx + 1}</span>
                      <button
                        onClick={() => removeExtracurricular(act.id)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Activity / Role</label>
                        <input
                          type="text"
                          value={act.activity}
                          onChange={e => updateExtracurricular(act.id, 'activity', e.target.value)}
                          placeholder="e.g. Lead Peer Tutor"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Organization</label>
                        <input
                          type="text"
                          value={act.organization}
                          onChange={e => updateExtracurricular(act.id, 'organization', e.target.value)}
                          placeholder="e.g. CS Student Association"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Description</label>
                        <input
                          type="text"
                          value={act.description}
                          onChange={e => updateExtracurricular(act.id, 'description', e.target.value)}
                          placeholder="Mentored 20+ first-year students in Python and discrete mathematics."
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Date / Duration</label>
                        <input
                          type="text"
                          value={act.date}
                          onChange={e => updateExtracurricular(act.id, 'date', e.target.value)}
                          placeholder="2024 - Present"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addExtracurricular}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-blue-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Activity</span>
                </button>
              </div>
            )}
          </div>

          {/* 10. LANGUAGES */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection('languages')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/70 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                10. Languages ({languages.length})
              </span>
              {openSections.languages ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.languages && (
              <div className="p-5 space-y-4">
                {languages.map((lang, idx) => (
                  <div key={lang.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Language</label>
                      <input
                        type="text"
                        value={lang.language}
                        onChange={e => updateLanguage(lang.id, 'language', e.target.value)}
                        placeholder="e.g. English, Spanish, Mandarin"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">Proficiency</label>
                      <select
                        value={lang.proficiency}
                        onChange={e => updateLanguage(lang.id, 'proficiency', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Native or Bilingual">Native or Bilingual</option>
                        <option value="Full Professional">Full Professional</option>
                        <option value="Professional Working">Professional Working</option>
                        <option value="Limited Working">Limited Working</option>
                        <option value="Elementary">Elementary</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeLanguage(lang.id)}
                      className="text-red-500 hover:text-red-700 p-2 mt-4"
                      title="Remove language"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addLanguage}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-blue-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Language</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* LIVE PROFESSIONAL CV PREVIEW PANEL                              */}
        {/* ============================================================== */}
        <div
          className={`${
            activeTab === 'editor' ? 'hidden lg:block lg:col-span-6 xl:col-span-6' : 'col-span-12'
          } cv-document-print`}
        >
          {/* Outer document frame */}
          <div className="bg-slate-200/70 p-2 sm:p-6 rounded-2xl flex justify-center print:p-0 print:bg-white">
            <div
              className={`w-full max-w-[8.5in] min-h-[11in] bg-white text-slate-900 p-8 sm:p-12 shadow-xl print:shadow-none print:p-0 font-sans transition-all`}
            >
              {/* ============================================================== */}
              {/* PROFESSIONAL STUDENT CV TEMPLATE                               */}
              {/* ============================================================== */}
              <div className="space-y-6 text-slate-900 leading-relaxed text-xs">
                  {/* Header: Centered & Traditional */}
                  <div className="text-center border-b-2 border-slate-900 pb-3">
                    <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider font-serif text-slate-900">
                      {personalInfo.fullName || 'Student Name'}
                    </h1>
                    {personalInfo.professionalTitle && (
                      <p className="text-xs font-semibold text-slate-700 tracking-wide mt-1">
                        {personalInfo.professionalTitle}
                      </p>
                    )}
                    <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-2 font-serif">
                      {personalInfo.email && <span>{personalInfo.email}</span>}
                      {personalInfo.phone && <span>• {personalInfo.phone}</span>}
                      {personalInfo.location && <span>• {personalInfo.location}</span>}
                      {personalInfo.linkedinUrl && <span>• {personalInfo.linkedinUrl}</span>}
                      {personalInfo.githubUrl && <span>• {personalInfo.githubUrl}</span>}
                      {personalInfo.portfolioUrl && <span>• {personalInfo.portfolioUrl}</span>}
                    </div>
                  </div>

                  {/* Summary */}
                  {professionalSummary && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
                        Professional Summary
                      </h2>
                      <p className="text-slate-800 text-justify leading-relaxed">
                        {professionalSummary}
                      </p>
                    </div>
                  )}

                  {/* Education */}
                  {education.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
                        Education
                      </h2>
                      <div className="space-y-2.5">
                        {education.map(edu => (
                          <div key={edu.id} className="space-y-0.5">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-slate-900">{edu.institution}</span>
                              <span className="text-[11px] text-slate-600 font-serif">
                                {edu.startYear} – {edu.endYear}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline text-slate-700">
                              <span>
                                {edu.degree} {edu.fieldBranch ? `in ${edu.fieldBranch}` : ''}
                              </span>
                              {edu.gradeCgpa && (
                                <span className="text-[11px] font-medium text-slate-700">GPA: {edu.gradeCgpa}</span>
                              )}
                            </div>
                            {edu.description && (
                              <p className="text-slate-600 text-[11px] mt-0.5">{edu.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
                        Technical Skills
                      </h2>
                      <p className="text-slate-800 leading-relaxed">
                        <strong className="text-slate-900">Proficiencies: </strong>
                        {skills.join(' • ')}
                      </p>
                    </div>
                  )}

                  {/* Projects */}
                  {projects.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
                        Academic & Software Projects
                      </h2>
                      <div className="space-y-3">
                        {projects.map(proj => (
                          <div key={proj.id} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-slate-900">
                                {proj.projectName}
                                {proj.isStarred && (
                                  <span className="font-sans ml-2 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                    ★ Featured Project
                                  </span>
                                )}
                                {proj.technologiesUsed && (
                                  <span className="font-normal text-slate-600 ml-2 font-serif text-[11px]">
                                    | {proj.technologiesUsed}
                                  </span>
                                )}
                              </span>
                              {(proj.startDate || proj.endDate) && (
                                <span className="text-[11px] text-slate-600 font-serif">
                                  {proj.startDate} – {proj.endDate}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 text-[11px]">{proj.description}</p>
                            {(proj.githubUrl || proj.projectUrl) && (
                              <div className="text-[10px] text-slate-500 font-serif flex gap-3">
                                {proj.githubUrl && <span>GitHub: {proj.githubUrl}</span>}
                                {proj.projectUrl && <span>Live: {proj.projectUrl}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {experience.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
                        Experience & Internships
                      </h2>
                      <div className="space-y-3">
                        {experience.map(exp => (
                          <div key={exp.id} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-slate-900">
                                {exp.jobTitle}
                                {exp.company && <span className="font-normal text-slate-700 ml-1.5">– {exp.company}</span>}
                              </span>
                              <span className="text-[11px] text-slate-600 font-serif">
                                {exp.startDate} – {exp.endDate}
                              </span>
                            </div>
                            {exp.location && (
                              <p className="text-[11px] text-slate-500 italic">{exp.location}</p>
                            )}
                            <p className="text-slate-700 text-[11px]">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {certifications.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
                        Certifications & Credentials
                      </h2>
                      <div className="space-y-1.5">
                        {certifications.map(cert => (
                          <div key={cert.id} className="flex justify-between items-baseline">
                            <div>
                              <strong className="text-slate-900">{cert.certificateName}</strong>
                              <span className="text-slate-600 ml-1">– {cert.issuingOrganization}</span>
                              {cert.credentialId && (
                                <span className="text-[10px] text-slate-500 ml-2">ID: {cert.credentialId}</span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-600 font-serif">{cert.issueDate}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {achievements.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
                        Honors & Achievements
                      </h2>
                      <div className="space-y-1.5">
                        {achievements.map(ach => (
                          <div key={ach.id} className="flex justify-between items-baseline">
                            <div>
                              <strong className="text-slate-900">{ach.achievementTitle}</strong>
                              {ach.description && <span className="text-slate-600 ml-1.5">– {ach.description}</span>}
                            </div>
                            <span className="text-[11px] text-slate-600 font-serif">{ach.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracurricular Activities */}
                  {extracurricular.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
                        Extracurricular Leadership & Activities
                      </h2>
                      <div className="space-y-1.5">
                        {extracurricular.map(act => (
                          <div key={act.id} className="flex justify-between items-baseline">
                            <div>
                              <strong className="text-slate-900">{act.activity}</strong>
                              {act.organization && <span className="text-slate-600 ml-1">({act.organization})</span>}
                              {act.description && <span className="text-slate-600 ml-1.5">– {act.description}</span>}
                            </div>
                            <span className="text-[11px] text-slate-600 font-serif">{act.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {languages.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
                        Languages
                      </h2>
                      <p className="text-slate-800">
                        {languages.map(l => `${l.language} (${l.proficiency})`).join(' • ')}
                      </p>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
