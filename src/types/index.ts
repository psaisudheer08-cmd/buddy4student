// TypeScript definitions for buddy4students

export type AIMode =
  | 'tutor'
  | 'doubt'
  | 'study'
  | 'practice'
  | 'quiz'
  | 'revision'
  | 'project'
  | 'career'
  | 'interview';

export type CertificateStatus =
  | 'uploaded'
  | 'extracted'
  | 'student_confirmed'
  | 'unverified'
  | 'issuer_verified'
  | 'Uploaded'
  | 'Extracted'
  | 'Student Confirmed'
  | 'Unverified'
  | 'Issuer Verified';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type GoalPriority = 'low' | 'medium' | 'high' | 'urgent';

export type GoalStatus = 'active' | 'completed' | 'paused';

export interface User {
  id: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  preferredName?: string;
  university?: string;
  institution?: string;
  location?: string;
  degree?: string;
  branch?: string;
  major?: string;
  academicYear?: string;
  semester?: string;
  graduationYear?: string | number;
  gpa?: string;
  targetCareer?: string;
  preferredLanguage?: string;
  preferredStudyHours?: string;
  bio?: string;
  learningStyle?: 'visual' | 'example_based' | 'theory_first' | 'hands_on';
  links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  starsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentPreferences {
  id: string;
  userId: string;
  defaultAIMode: AIMode;
  notificationsEnabled: boolean;
  dailyStudyGoalMinutes: number;
  theme: 'light' | 'dark' | 'system';
}

export interface AIMemory {
  id: string;
  userId: string;
  category: 'career_goal' | 'learning_preference' | 'current_focus' | 'strength' | 'weakness';
  key: string;
  value: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageSource {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  usedWebSearch?: boolean;
  sources?: MessageSource[];
  searchQueries?: string[];
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  aiMode: AIMode;
  summary?: string;
  isPinned: boolean;
  lastMessageAt: string;
  createdAt: string;
  messages?: Message[];
}

export interface StudyTask {
  id: string;
  planId: string;
  userId: string;
  dayNumber: number;
  scheduledDate: string;
  topicTitle: string;
  durationMinutes: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface StudyPlan {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  examDate?: string;
  totalDays: number;
  dailyMinutes: number;
  priority: GoalPriority;
  currentKnowledgeLevel: SkillLevel;
  status: 'in_progress' | 'completed' | 'paused';
  tasks: StudyTask[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalTask {
  id: string;
  goalId: string;
  userId: string;
  taskText: string;
  isCompleted: boolean;
  orderIndex: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline?: string;
  category?: string;
  priority: GoalPriority;
  progressPercentage: number;
  status: GoalStatus;
  isStarred?: boolean;
  tasks: GoalTask[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  summary?: string;
  keyPoints?: string[];
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  userId: string;
  fileName?: string;
  title?: string;
  category?: string;
  fileUrl?: string;
  storagePath?: string;
  fileSize: number;
  mimeType: string;
  extractedText?: string;
  summary?: string;
  summaryText?: string;
  tags?: string[];
  createdAt: string;
}


export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'fill_in_the_blank';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  userId: string;
  title: string;
  topic?: string;
  subject?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, string>;
  completedAt: string;
}

export interface Skill {
  id: string;
  userId: string;
  skillName: string;
  category: string;
  level?: SkillLevel;
  selfAssessedLevel?: string;
  targetLevel?: string;
  isStarred?: boolean;
  starRating?: number;
  notes?: string;
  verifiedByEvidenceCount?: number;
  evidenceCount?: number;
  evidenceSources?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  name?: string;
  certificateName?: string;
  issuer: string;
  studentName?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  storagePath?: string;
  relatedSkills: string[];
  verificationStatus: CertificateStatus;
  isStarred?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  technologies?: string[];
  techStack?: string[];
  githubUrl?: string;
  liveUrl?: string;
  role?: string;
  skills?: string[];
  startDate?: string;
  endDate?: string;
  isStarred?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// STUDENT STARS & GAMIFICATION
// ==========================================
export interface StarRecord {
  id: string;
  reason: string;
  stars: number;
  date: string;
  category?: 'study' | 'goal' | 'project' | 'cv' | 'milestone' | 'skill';
}

export interface StarMilestone {
  id: string;
  title: string;
  description: string;
  stars: number;
  isClaimed: boolean;
  category: string;
}

export interface StarSummary {
  starsCount: number;
  tier: string;
  tierProgress: number; // 0 - 100%
  nextTierThreshold: number;
  recentHistory: StarRecord[];
  milestones: StarMilestone[];
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  category: string;
  issuer?: string;
  organization?: string;
  date?: string;
  description?: string;
  proofUrl?: string;
  createdAt: string;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  template: 'modern' | 'minimal' | 'academic' | 'executive';
  summary?: string;
  sections: {
    education: boolean;
    skills: boolean;
    projects: boolean;
    certificates: boolean;
    achievements: boolean;
    customSections?: Array<{ title: string; content: string }>;
  };
  contactInfo: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CV {
  id: string;
  userId: string;
  title: string;
  template: string;
  sections: any;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// MANUAL CV BUILDER SCHEMAS
// ==========================================
export interface CVEducation {
  id: string;
  institution: string;
  degree: string;
  fieldBranch: string;
  startYear: string;
  endYear: string;
  gradeCgpa: string;
  description: string;
}

export interface CVProject {
  id: string;
  projectName: string;
  description: string;
  technologiesUsed: string;
  projectUrl?: string;
  githubUrl?: string;
  startDate?: string;
  endDate?: string;
  isStarred?: boolean;
}

export interface CVExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface CVCertification {
  id: string;
  certificateName: string;
  issuingOrganization: string;
  issueDate: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface CVAchievement {
  id: string;
  achievementTitle: string;
  description: string;
  date: string;
}

export interface CVActivity {
  id: string;
  activity: string;
  organization: string;
  description: string;
  date: string;
}

export interface CVLanguage {
  id: string;
  language: string;
  proficiency: string;
}

export interface StudentCVData {
  id?: string;
  userId: string;
  template?: string;
  personalInfo: {
    fullName: string;
    professionalTitle: string;
    email: string;
    phone: string;
    location: string;
    linkedinUrl: string;
    githubUrl: string;
    portfolioUrl: string;
  };
  professionalSummary: string;
  education: CVEducation[];
  skills: string[];
  projects: CVProject[];
  experience: CVExperience[];
  certifications: CVCertification[];
  achievements: CVAchievement[];
  extracurricular: CVActivity[];
  languages: CVLanguage[];
  updatedAt?: string;
}

// ==========================================
// MANUAL PORTFOLIO BUILDER SCHEMAS
// ==========================================
export interface PortfolioProfile {
  fullName: string;
  professionalTitle: string;
  shortBio: string;
  profileImage?: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  personalWebsite: string;
}

export interface PortfolioSkill {
  id: string;
  skillName: string;
  category: string;
  proficiencyLevel?: string;
  isStarred?: boolean;
  starRating?: number;
}

export interface PortfolioProject {
  id: string;
  projectName: string;
  description: string;
  technologies: string;
  imageUrl?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  startDate?: string;
  endDate?: string;
  isStarred?: boolean;
}

export interface PortfolioEducation {
  id: string;
  institution: string;
  degree: string;
  branch: string;
  startYear: string;
  endYear: string;
  description: string;
}

export interface PortfolioCertificate {
  id: string;
  certificateName: string;
  issuingOrganization: string;
  date: string;
  credentialUrl?: string;
  fileUrl?: string;
}

export interface PortfolioAchievement {
  id: string;
  achievement: string;
  description: string;
  date: string;
  optionalUrl?: string;
}

export interface StudentPortfolioData {
  id?: string;
  userId: string;
  isPublished?: boolean;
  profile: PortfolioProfile;
  skills: PortfolioSkill[];
  projects: PortfolioProject[];
  education: PortfolioEducation[];
  certificates: PortfolioCertificate[];
  achievements: PortfolioAchievement[];
  updatedAt?: string;
}

export interface JobDescriptionAnalysis {
  matchedSkills: string[];
  potentialGaps: string[];
  learningRecommendations: string[];
  resumeImprovements: string[];
  roleSummary: string;
}

export interface MockInterviewTurn {
  id: string;
  interviewerQuestion: string;
  studentAnswer?: string;
  aiFeedback?: {
    strengths: string[];
    improvements: string[];
    sampleBetterAnswer: string;
  };
}

export interface MockInterviewSession {
  id: string;
  userId: string;
  roleTitle?: string;
  jobTitle?: string;
  interviewType: 'technical' | 'behavioral' | 'system_design' | 'hr';
  status?: 'in_progress' | 'completed';
  overallScore?: number;
  transcript?: any;
  feedbackSummary?: string;
  turns?: MockInterviewTurn[];
  overallFeedback?: {
    overallScore: number;
    summary: string;
    keyStrengths: string[];
    recommendedTopics: string[];
  };
  createdAt: string;
}
