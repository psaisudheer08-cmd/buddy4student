// Server-side persistent database engine with strict Row Level Security (RLS) enforcement
// Every entity operation is strictly verified against the authenticated user_id.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User, Profile, StudentPreferences, AIMemory, Conversation, Message,
  StudyPlan, StudyTask, Goal, GoalTask, Note, DocumentItem,
  Quiz, QuizAttempt, Skill, Certificate, Project, Achievement, Resume, CV,
  MockInterviewSession
} from '../src/types';

export interface DbState {
  users: (User & { passwordHash: string })[];
  profiles: Profile[];
  preferences: StudentPreferences[];
  aiMemories: AIMemory[];
  conversations: Conversation[];
  messages: Message[];
  studyPlans: StudyPlan[];
  goals: Goal[];
  notes: Note[];
  documents: DocumentItem[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  skills: Skill[];
  certificates: Certificate[];
  projects: Project[];
  achievements: Achievement[];
  resumes: Resume[];
  cvs: CV[];
  studentCvs: any[];
  studentPortfolios: any[];
  interviews: MockInterviewSession[];
}

const DB_FILE = path.join(process.cwd(), 'edupilot_db.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_edupilot_salt_2026').digest('hex');
}

function getInitialState(): DbState {
  return {
    users: [],
    profiles: [],
    preferences: [],
    aiMemories: [],
    conversations: [],
    messages: [],
    studyPlans: [],
    goals: [],
    notes: [],
    documents: [],
    quizzes: [],
    quizAttempts: [],
    skills: [],
    certificates: [],
    projects: [],
    achievements: [],
    resumes: [],
    cvs: [],
    studentCvs: [],
    studentPortfolios: [],
    interviews: [],
  };
}

class DatabaseManager {
  private state: DbState;

  constructor() {
    this.state = this.load();
  }

  private load(): DbState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        parsed.studentCvs = parsed.studentCvs || [];
        parsed.studentPortfolios = parsed.studentPortfolios || [];
        return parsed;
      }
    } catch (e) {
      console.error('[DB] Failed reading disk state, using initial state:', e);
    }
    const initial = getInitialState();
    this.saveDirect(initial);
    return initial;
  }

  private save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed writing to disk:', e);
    }
  }

  private saveDirect(state: DbState): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed direct writing to disk:', e);
    }
  }

  // Row Level Security (RLS) enforcement helper
  public enforceRLS(itemUserId: string, authUserId: string, entityName: string = 'entity'): void {
    if (itemUserId !== authUserId) {
      throw new Error(`[RLS VIOLATION] Access Denied: User ${authUserId} attempted to access ${entityName} owned by ${itemUserId}`);
    }
  }

  // User & Auth operations
  public findUserByEmail(email: string) {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string) {
    return this.state.users.find(u => u.id === id);
  }

  public createUser(email: string, password: string, fullName?: string): User {
    const existing = this.findUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }
    const cleanEmail = email.toLowerCase().trim();
    const newUserId = crypto.randomUUID();
    const newUser: User & { passwordHash: string } = {
      id: newUserId,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    this.state.users.push(newUser);

    const displayName = (fullName?.trim() || cleanEmail.split('@')[0]) || 'Student';
    // Bootstrap initial profile and preferences
    const profile: Profile = {
      id: 'prof-' + crypto.randomUUID().slice(0, 8),
      userId: newUserId,
      fullName: displayName,
      preferredName: displayName.split(' ')[0],
      university: '',
      degree: 'Bachelor of Science',
      major: 'Computer Science',
      academicYear: 'Year 1',
      semester: 'Semester 1',
      graduationYear: 2027,
      targetCareer: 'Software Engineer',
      preferredLanguage: 'English',
      preferredStudyHours: '3',
      bio: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.profiles.push(profile);

    const pref: StudentPreferences = {
      id: 'pref-' + crypto.randomUUID().slice(0, 8),
      userId: newUser.id,
      defaultAIMode: 'tutor',
      notificationsEnabled: true,
      dailyStudyGoalMinutes: 60,
      theme: 'light',
    };
    this.state.preferences.push(pref);

    this.save();
    return {
      id: newUser.id,
      email: newUser.email,
      isVerified: newUser.isVerified,
      createdAt: newUser.createdAt,
    };
  }

  public getOrCreateDemoUser(): { user: User; profile: Profile } {
    let demoUser =
      this.findUserByEmail('student@buddy4students.ai') ||
      this.findUserByEmail('demo@buddy4students.ai') ||
      this.findUserByEmail('student@edupilot.ai') ||
      this.findUserByEmail('demo@edupilot.ai');
    if (!demoUser) {
      const newUser: User & { passwordHash: string } = {
        id: 'student-demo-001',
        email: 'student@buddy4students.ai',
        passwordHash: hashPassword('password123'),
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      this.state.users.push(newUser);
      demoUser = newUser;

      const profile: Profile = {
        id: 'prof-demo-001',
        userId: newUser.id,
        fullName: 'Alex Morgan',
        preferredName: 'Alex',
        university: 'Stanford University',
        institution: 'Stanford University',
        degree: 'Bachelor of Science',
        branch: 'Computer Science',
        major: 'Computer Science',
        academicYear: 'Year 3',
        semester: 'Semester 5',
        graduationYear: 2026,
        targetCareer: 'Full Stack & AI Engineer',
        preferredLanguage: 'English',
        preferredStudyHours: '4',
        bio: 'Passionate CS student exploring AI, distributed systems, and product engineering.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.state.profiles.push(profile);

      const pref: StudentPreferences = {
        id: 'pref-demo-001',
        userId: newUser.id,
        defaultAIMode: 'tutor',
        notificationsEnabled: true,
        dailyStudyGoalMinutes: 90,
        theme: 'light',
      };
      this.state.preferences.push(pref);

      // Seed starter goals, skills, and projects for demo student
      this.state.goals.push({
        id: 'goal-demo-1',
        userId: newUser.id,
        title: 'Master System Design & Distributed Systems',
        description: 'Complete core distributed systems foundations, consensus protocols, and scalable services.',
        category: 'academic',
        priority: 'high',
        progressPercentage: 65,
        status: 'active',
        tasks: [
          { id: 'gt-1', goalId: 'goal-demo-1', userId: newUser.id, taskText: 'Complete Distributed Systems Course', isCompleted: true, orderIndex: 0 },
          { id: 'gt-2', goalId: 'goal-demo-1', userId: newUser.id, taskText: 'Design a high-throughput message queue', isCompleted: true, orderIndex: 1 },
          { id: 'gt-3', goalId: 'goal-demo-1', userId: newUser.id, taskText: 'Read Dynamo & Raft consensus papers', isCompleted: false, orderIndex: 2 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      this.state.skills.push(
        { id: 'skill-1', userId: newUser.id, skillName: 'TypeScript & React', level: 'advanced', category: 'Technical', isStarred: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'skill-2', userId: newUser.id, skillName: 'Python & AI Engineering', level: 'intermediate', category: 'Technical', isStarred: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'skill-3', userId: newUser.id, skillName: 'System Architecture', level: 'intermediate', category: 'Technical', isStarred: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      );

      this.state.projects.push({
        id: 'proj-1',
        userId: newUser.id,
        title: 'buddy4students - Autonomous Academic Learning Companion',
        description: 'An AI-powered academic operating system for students with smart study planners, dynamic quizzes, and portfolio builder.',
        techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
        technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
        isStarred: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      this.save();
    }

    const prof = this.getProfile(demoUser.id) || {
      id: 'prof-demo-001',
      userId: demoUser.id,
      fullName: 'Alex Morgan',
      preferredName: 'Alex',
      university: 'Stanford University',
      institution: 'Stanford University',
      degree: 'Bachelor of Science',
      major: 'Computer Science',
      academicYear: 'Year 3',
      semester: 'Semester 5',
      graduationYear: 2026,
      targetCareer: 'Full Stack & AI Engineer',
      preferredLanguage: 'English',
      preferredStudyHours: '4',
      bio: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      user: {
        id: demoUser.id,
        email: demoUser.email,
        isVerified: demoUser.isVerified,
        createdAt: demoUser.createdAt,
      },
      profile: prof,
    };
  }

  public verifyPassword(user: User & { passwordHash: string }, plain: string): boolean {
    return user.passwordHash === hashPassword(plain);
  }

  // PROFILE (RLS Protected)
  public getProfile(userId: string): Profile | null {
    return this.state.profiles.find(p => p.userId === userId) || null;
  }

  public updateProfile(userId: string, updates: Partial<Profile>): Profile {
    let prof = this.state.profiles.find(p => p.userId === userId);
    if (!prof) {
      prof = {
        id: 'prof-' + crypto.randomUUID().slice(0, 8),
        userId,
        fullName: updates.fullName || 'Student',
        preferredName: updates.preferredName || 'Student',
        university: updates.university || '',
        degree: updates.degree || '',
        major: updates.major || '',
        academicYear: updates.academicYear || '',
        semester: updates.semester || '',
        graduationYear: updates.graduationYear || '',
        targetCareer: updates.targetCareer || '',
        preferredLanguage: updates.preferredLanguage || 'English',
        preferredStudyHours: updates.preferredStudyHours || '',
        bio: updates.bio || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.state.profiles.push(prof);
    } else {
      this.enforceRLS(prof.userId, userId, 'profile');
      Object.assign(prof, updates, { updatedAt: new Date().toISOString() });
    }
    this.save();
    return prof;
  }

  // PREFERENCES (RLS Protected)
  public getPreferences(userId: string): StudentPreferences {
    let pref = this.state.preferences.find(p => p.userId === userId);
    if (!pref) {
      pref = {
        id: 'pref-' + crypto.randomUUID().slice(0, 8),
        userId,
        defaultAIMode: 'tutor',
        notificationsEnabled: true,
        dailyStudyGoalMinutes: 60,
                theme: 'light',
      };
      this.state.preferences.push(pref);
      this.save();
    }
    return pref;
  }

  public updatePreferences(userId: string, updates: Partial<StudentPreferences>): StudentPreferences {
    const pref = this.getPreferences(userId);
    this.enforceRLS(pref.userId, userId, 'preferences');
    Object.assign(pref, updates);
    this.save();
    return pref;
  }

  // AI MEMORY (RLS Protected)
  public getAIMemories(userId: string): AIMemory[] {
    return this.state.aiMemories.filter(m => m.userId === userId);
  }

  public addAIMemory(userId: string, memory: Omit<AIMemory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): AIMemory {
    const newMem: AIMemory = {
      id: 'mem-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...memory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.aiMemories.push(newMem);
    this.save();
    return newMem;
  }

  public updateAIMemory(userId: string, memoryId: string, updates: Partial<AIMemory>): AIMemory {
    const mem = this.state.aiMemories.find(m => m.id === memoryId);
    if (!mem) throw new Error('Memory not found');
    this.enforceRLS(mem.userId, userId, 'ai_memory');
    Object.assign(mem, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return mem;
  }

  public deleteAIMemory(userId: string, memoryId: string): void {
    const mem = this.state.aiMemories.find(m => m.id === memoryId);
    if (!mem) return;
    this.enforceRLS(mem.userId, userId, 'ai_memory');
    this.state.aiMemories = this.state.aiMemories.filter(m => m.id !== memoryId);
    this.save();
  }

  // CONVERSATIONS & MESSAGES (RLS Protected)
  public getConversations(userId: string): Conversation[] {
    const convs = this.state.conversations.filter(c => c.userId === userId);
    return convs.map(c => ({
      ...c,
      messages: this.state.messages.filter(m => m.conversationId === c.id),
    })).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  public createConversation(userId: string, title: string, aiMode: any = 'tutor'): Conversation {
    const newConv: Conversation = {
      id: 'conv-' + crypto.randomUUID().slice(0, 8),
      userId,
      title,
      aiMode,
      isPinned: false,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      messages: [],
    };
    this.state.conversations.push(newConv);
    this.save();
    return newConv;
  }

  public getConversationById(userId: string, convId: string): Conversation | null {
    const conv = this.state.conversations.find(c => c.id === convId);
    if (!conv) return null;
    this.enforceRLS(conv.userId, userId, 'conversation');
    return {
      ...conv,
      messages: this.state.messages.filter(m => m.conversationId === conv.id),
    };
  }

  public addMessage(
    userId: string,
    convId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    meta?: {
      usedWebSearch?: boolean;
      sources?: Array<{ title: string; url: string }>;
      searchQueries?: string[];
    }
  ): Message {
    const conv = this.state.conversations.find(c => c.id === convId);
    if (!conv) throw new Error('Conversation not found');
    this.enforceRLS(conv.userId, userId, 'conversation');

    const msg: Message = {
      id: 'msg-' + crypto.randomUUID().slice(0, 8),
      conversationId: convId,
      userId,
      role,
      content,
      createdAt: new Date().toISOString(),
      usedWebSearch: meta?.usedWebSearch,
      sources: meta?.sources,
      searchQueries: meta?.searchQueries,
    };
    this.state.messages.push(msg);
    conv.lastMessageAt = msg.createdAt;
    this.save();
    return msg;
  }

  public deleteConversation(userId: string, convId: string): void {
    const conv = this.state.conversations.find(c => c.id === convId);
    if (!conv) return;
    this.enforceRLS(conv.userId, userId, 'conversation');
    this.state.conversations = this.state.conversations.filter(c => c.id !== convId);
    this.state.messages = this.state.messages.filter(m => m.conversationId !== convId);
    this.save();
  }

  // STUDY PLANS (RLS Protected)
  public getStudyPlans(userId: string): StudyPlan[] {
    return this.state.studyPlans.filter(p => p.userId === userId);
  }

  public createStudyPlan(userId: string, plan: Omit<StudyPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): StudyPlan {
    const newPlan: StudyPlan = {
      id: 'plan-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.studyPlans.push(newPlan);
    this.save();
    return newPlan;
  }

  public updateStudyPlanTask(userId: string, planId: string, taskId: string, isCompleted: boolean): StudyPlan {
    const plan = this.state.studyPlans.find(p => p.id === planId);
    if (!plan) throw new Error('Study plan not found');
    this.enforceRLS(plan.userId, userId, 'study_plan');

    const task = plan.tasks.find(t => t.id === taskId);
    if (task) {
      task.isCompleted = isCompleted;
      task.completedAt = isCompleted ? new Date().toISOString() : undefined;
      plan.updatedAt = new Date().toISOString();
      this.save();
    }
    return plan;
  }

  public deleteStudyPlan(userId: string, planId: string): void {
    const plan = this.state.studyPlans.find(p => p.id === planId);
    if (!plan) return;
    this.enforceRLS(plan.userId, userId, 'study_plan');
    this.state.studyPlans = this.state.studyPlans.filter(p => p.id !== planId);
    this.save();
  }

  // GOALS (RLS Protected)
  public getGoals(userId: string): Goal[] {
    return this.state.goals.filter(g => g.userId === userId);
  }

  public createGoal(userId: string, goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Goal {
    const newGoal: Goal = {
      id: 'goal-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...goal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.goals.push(newGoal);
    this.save();
    return newGoal;
  }

  public toggleGoalTask(userId: string, goalId: string, taskId: string): Goal {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');
    this.enforceRLS(goal.userId, userId, 'goal');

    const task = goal.tasks.find(t => t.id === taskId);
    if (task) {
      task.isCompleted = !task.isCompleted;
      const completedCount = goal.tasks.filter(t => t.isCompleted).length;
      goal.progressPercentage = Math.round((completedCount / (goal.tasks.length || 1)) * 100);
      if (goal.progressPercentage === 100) goal.status = 'completed';
      goal.updatedAt = new Date().toISOString();
      this.save();
    }
    return goal;
  }

  public deleteGoal(userId: string, goalId: string): void {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (!goal) return;
    this.enforceRLS(goal.userId, userId, 'goal');
    this.state.goals = this.state.goals.filter(g => g.id !== goalId);
    this.save();
  }

  // NOTES (RLS Protected)
  public getNotes(userId: string): Note[] {
    return this.state.notes.filter(n => n.userId === userId);
  }

  public createNote(userId: string, note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Note {
    const newNote: Note = {
      id: 'note-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.notes.push(newNote);
    this.save();
    return newNote;
  }

  public updateNote(userId: string, noteId: string, updates: Partial<Note>): Note {
    const note = this.state.notes.find(n => n.id === noteId);
    if (!note) throw new Error('Note not found');
    this.enforceRLS(note.userId, userId, 'note');
    Object.assign(note, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return note;
  }

  public deleteNote(userId: string, noteId: string): void {
    const note = this.state.notes.find(n => n.id === noteId);
    if (!note) return;
    this.enforceRLS(note.userId, userId, 'note');
    this.state.notes = this.state.notes.filter(n => n.id !== noteId);
    this.save();
  }

  // DOCUMENTS (RLS Protected)
  public getDocuments(userId: string): DocumentItem[] {
    return this.state.documents.filter(d => d.userId === userId);
  }

  public addDocument(userId: string, doc: Omit<DocumentItem, 'id' | 'userId' | 'createdAt'>): DocumentItem {
    const newDoc: DocumentItem = {
      id: 'doc-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...doc,
      createdAt: new Date().toISOString(),
    };
    this.state.documents.push(newDoc);
    this.save();
    return newDoc;
  }

  public deleteDocument(userId: string, docId: string): void {
    const doc = this.state.documents.find(d => d.id === docId);
    if (!doc) return;
    this.enforceRLS(doc.userId, userId, 'document');
    this.state.documents = this.state.documents.filter(d => d.id !== docId);
    this.save();
  }

  // QUIZZES & ATTEMPTS (RLS Protected)
  public getQuizzes(userId: string): Quiz[] {
    return this.state.quizzes.filter(q => q.userId === userId);
  }

  public createQuiz(userId: string, quiz: Omit<Quiz, 'id' | 'userId' | 'createdAt'>): Quiz {
    const newQuiz: Quiz = {
      id: 'quiz-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...quiz,
      createdAt: new Date().toISOString(),
    };
    this.state.quizzes.push(newQuiz);
    this.save();
    return newQuiz;
  }

  public recordQuizAttempt(userId: string, quizId: string, answers: Record<string, string>, score: number, totalQuestions: number): QuizAttempt {
    const quiz = this.state.quizzes.find(q => q.id === quizId);
    if (quiz) {
      this.enforceRLS(quiz.userId, userId, 'quiz');
    }
    const attempt: QuizAttempt = {
      id: 'qa-' + crypto.randomUUID().slice(0, 8),
      quizId,
      userId,
      score,
      totalQuestions,
      answers,
      completedAt: new Date().toISOString(),
    };
    this.state.quizAttempts.push(attempt);
    this.save();
    return attempt;
  }

  public getQuizAttempts(userId: string): QuizAttempt[] {
    return this.state.quizAttempts.filter(a => a.userId === userId);
  }

  // SKILLS & EVIDENCE (RLS Protected)
  public getSkills(userId: string): Skill[] {
    return this.state.skills.filter(s => s.userId === userId);
  }

  public addSkill(userId: string, skill: Omit<Skill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Skill {
    const existing = this.state.skills.find(s => s.userId === userId && s.skillName.toLowerCase() === skill.skillName.toLowerCase());
    if (existing) {
      Object.assign(existing, skill, { updatedAt: new Date().toISOString() });
      this.save();
      return existing;
    }
    const newSkill: Skill = {
      id: 'sk-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...skill,
      verifiedByEvidenceCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.skills.push(newSkill);
    this.save();
    return newSkill;
  }

  public deleteSkill(userId: string, skillId: string): void {
    const sk = this.state.skills.find(s => s.id === skillId);
    if (!sk) return;
    this.enforceRLS(sk.userId, userId, 'skill');
    this.state.skills = this.state.skills.filter(s => s.id !== skillId);
    this.save();
  }

  // CERTIFICATES (RLS Protected)
  public getCertificates(userId: string): Certificate[] {
    return this.state.certificates.filter(c => c.userId === userId);
  }

  public addCertificate(userId: string, cert: Omit<Certificate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Certificate {
    const newCert: Certificate = {
      id: 'cert-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...cert,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.certificates.push(newCert);

    // Link evidence to skills
    if (newCert.relatedSkills && newCert.relatedSkills.length > 0) {
      newCert.relatedSkills.forEach(skillName => {
        const skill = this.state.skills.find(s => s.userId === userId && s.skillName.toLowerCase() === skillName.toLowerCase());
        if (skill) {
          skill.verifiedByEvidenceCount = (skill.verifiedByEvidenceCount || 0) + 1;
        }
      });
    }
    this.save();
    return newCert;
  }

  public updateCertificateStatus(userId: string, certId: string, status: any): Certificate {
    const cert = this.state.certificates.find(c => c.id === certId);
    if (!cert) throw new Error('Certificate not found');
    this.enforceRLS(cert.userId, userId, 'certificate');
    cert.verificationStatus = status;
    cert.updatedAt = new Date().toISOString();
    this.save();
    return cert;
  }

  public deleteCertificate(userId: string, certId: string): void {
    const cert = this.state.certificates.find(c => c.id === certId);
    if (!cert) return;
    this.enforceRLS(cert.userId, userId, 'certificate');
    this.state.certificates = this.state.certificates.filter(c => c.id !== certId);
    this.save();
  }

  // PROJECTS (RLS Protected)
  public getProjects(userId: string): Project[] {
    return this.state.projects.filter(p => p.userId === userId);
  }

  public addProject(userId: string, proj: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Project {
    const newProj: Project = {
      id: 'proj-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...proj,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.projects.push(newProj);
    this.save();
    return newProj;
  }

  public deleteProject(userId: string, projId: string): void {
    const proj = this.state.projects.find(p => p.id === projId);
    if (!proj) return;
    this.enforceRLS(proj.userId, userId, 'project');
    this.state.projects = this.state.projects.filter(p => p.id !== projId);
    this.save();
  }

  // ACHIEVEMENTS (RLS Protected)
  public getAchievements(userId: string): Achievement[] {
    return this.state.achievements.filter(a => a.userId === userId);
  }

  public addAchievement(userId: string, ach: Omit<Achievement, 'id' | 'userId' | 'createdAt'>): Achievement {
    const newAch: Achievement = {
      id: 'ach-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...ach,
      createdAt: new Date().toISOString(),
    };
    this.state.achievements.push(newAch);
    this.save();
    return newAch;
  }

  public deleteAchievement(userId: string, achId: string): void {
    const ach = this.state.achievements.find(a => a.id === achId);
    if (!ach) return;
    this.enforceRLS(ach.userId, userId, 'achievement');
    this.state.achievements = this.state.achievements.filter(a => a.id !== achId);
    this.save();
  }

  // RESUMES & CVS (RLS Protected)
  public getResumes(userId: string): Resume[] {
    return this.state.resumes.filter(r => r.userId === userId);
  }

  public saveResume(userId: string, resume: Omit<Resume, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Resume {
    const newRes: Resume = {
      id: 'res-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...resume,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.resumes.push(newRes);
    this.save();
    return newRes;
  }

  public getCVs(userId: string): CV[] {
    return this.state.cvs.filter(c => c.userId === userId);
  }

  public saveCV(userId: string, cv: Omit<CV, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): CV {
    const newCV: CV = {
      id: 'cv-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...cv,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.cvs.push(newCV);
    this.save();
    return newCV;
  }

  // MANUAL STUDENT CV (RLS Protected)
  public getStudentCV(userId: string): any | null {
    const found = (this.state.studentCvs || []).find((c: any) => c.userId === userId);
    return found || null;
  }

  public saveStudentCV(userId: string, data: any): any {
    this.state.studentCvs = this.state.studentCvs || [];
    const index = this.state.studentCvs.findIndex((c: any) => c.userId === userId);
    const updated = {
      ...data,
      id: data.id || 'scv-' + crypto.randomUUID().slice(0, 8),
      userId,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      this.state.studentCvs[index] = updated;
    } else {
      this.state.studentCvs.push(updated);
    }
    this.save();
    return updated;
  }

  // MANUAL STUDENT PORTFOLIO (RLS Protected)
  public getStudentPortfolio(userId: string): any | null {
    const found = (this.state.studentPortfolios || []).find((p: any) => p.userId === userId);
    return found || null;
  }

  public saveStudentPortfolio(userId: string, data: any): any {
    this.state.studentPortfolios = this.state.studentPortfolios || [];
    const index = this.state.studentPortfolios.findIndex((p: any) => p.userId === userId);
    const updated = {
      ...data,
      id: data.id || 'port-' + crypto.randomUUID().slice(0, 8),
      userId,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      this.state.studentPortfolios[index] = updated;
    } else {
      this.state.studentPortfolios.push(updated);
    }
    this.save();
    return updated;
  }

  // MOCK INTERVIEW SESSIONS (RLS Protected)
  public getInterviews(userId: string): MockInterviewSession[] {
    return this.state.interviews.filter(i => i.userId === userId);
  }

  public saveInterview(userId: string, session: Omit<MockInterviewSession, 'id' | 'userId' | 'createdAt'>): MockInterviewSession {
    const newSession: MockInterviewSession = {
      id: 'int-' + crypto.randomUUID().slice(0, 8),
      userId,
      ...session,
      createdAt: new Date().toISOString(),
    };
    this.state.interviews.push(newSession);
    this.save();
    return newSession;
  }

  // ==========================================
  // STARS FEATURE: TOGGLE & RATING OPERATIONS
  // ==========================================
  public toggleStarProject(userId: string, projId: string): Project {
    const proj = this.state.projects.find(p => p.id === projId);
    if (!proj) throw new Error('Project not found');
    this.enforceRLS(proj.userId, userId, 'project');
    proj.isStarred = !proj.isStarred;
    proj.updatedAt = new Date().toISOString();
    this.save();
    return proj;
  }

  public toggleStarSkill(userId: string, skillId: string): Skill {
    const skill = this.state.skills.find(s => s.id === skillId);
    if (!skill) throw new Error('Skill not found');
    this.enforceRLS(skill.userId, userId, 'skill');
    skill.isStarred = !skill.isStarred;
    skill.updatedAt = new Date().toISOString();
    this.save();
    return skill;
  }

  public setSkillRating(userId: string, skillId: string, starRating: number): Skill {
    const skill = this.state.skills.find(s => s.id === skillId);
    if (!skill) throw new Error('Skill not found');
    this.enforceRLS(skill.userId, userId, 'skill');
    skill.starRating = Math.max(1, Math.min(5, starRating));
    skill.updatedAt = new Date().toISOString();
    this.save();
    return skill;
  }

  public toggleStarGoal(userId: string, goalId: string): Goal {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');
    this.enforceRLS(goal.userId, userId, 'goal');
    goal.isStarred = !goal.isStarred;
    goal.updatedAt = new Date().toISOString();
    this.save();
    return goal;
  }

  public getStarsSummary(userId: string): any {
    const profile = this.getProfile(userId);
    const count = profile?.starsCount ?? 145;

    let tier = 'Bronze Scholar';
    let nextThreshold = 50;
    let progress = Math.min(100, Math.round((count / 50) * 100));

    if (count >= 300) {
      tier = 'Platinum Master';
      nextThreshold = 500;
      progress = Math.min(100, Math.round(((count - 300) / 200) * 100));
    } else if (count >= 150) {
      tier = 'Gold Pilot';
      nextThreshold = 300;
      progress = Math.min(100, Math.round(((count - 150) / 150) * 100));
    } else if (count >= 50) {
      tier = 'Silver Ace';
      nextThreshold = 150;
      progress = Math.min(100, Math.round(((count - 50) / 100) * 100));
    }

    const defaultMilestones = [
      { id: 'm-1', title: 'Curate Top Projects', description: 'Star at least one engineering project as featured', stars: 20, isClaimed: true, category: 'project' },
      { id: 'm-2', title: '5-Star Skill Mastery', description: 'Rate your primary skills and mark core competencies', stars: 15, isClaimed: true, category: 'skill' },
      { id: 'm-3', title: 'Target Study Focus', description: 'Star your highest priority academic study goals', stars: 25, isClaimed: false, category: 'goal' },
            { id: 'm-5', title: 'Publish Star Portfolio', description: 'Fill out and generate your interactive student portfolio', stars: 50, isClaimed: false, category: 'portfolio' },
    ];

    const defaultHistory = [
      { id: 'sr-1', reason: 'Starred Featured Project: Algorithmic Pathfinding Visualizer', stars: 20, date: '2026-09-22', category: 'project' },
      { id: 'sr-2', reason: 'Assessed 5-Star Skill: TypeScript & Data Structures', stars: 15, date: '2026-09-21', category: 'skill' },
      { id: 'sr-3', reason: 'Completed 60-Minute Study Session', stars: 25, date: '2026-09-20', category: 'study' },
      { id: 'sr-4', reason: 'Account Onboarding & Profile Setup', stars: 50, date: '2026-09-18', category: 'milestone' },
          ];

    return {
      starsCount: count,
      tier,
      tierProgress: progress,
      nextTierThreshold: nextThreshold,
      recentHistory: defaultHistory,
      milestones: defaultMilestones,
    };
  }

  public awardStars(userId: string, amount: number, reason: string, category: string = 'milestone'): any {
    const profile = this.getProfile(userId);
    if (profile) {
      profile.starsCount = (profile.starsCount ?? 145) + amount;
      this.save();
    }
    return this.getStarsSummary(userId);
  }

  public claimStarMilestone(userId: string, milestoneId: string): any {
    const profile = this.getProfile(userId);
    if (profile) {
      profile.starsCount = (profile.starsCount ?? 145) + 25;
      this.save();
    }
    return this.getStarsSummary(userId);
  }

  // PRIVACY: FULL DATA EXPORT ("Download My Data")
  public exportUserData(userId: string) {
    const profile = this.getProfile(userId);
    const preferences = this.getPreferences(userId);
    const aiMemories = this.getAIMemories(userId);
    const conversations = this.getConversations(userId);
    const studyPlans = this.getStudyPlans(userId);
    const goals = this.getGoals(userId);
    const notes = this.getNotes(userId);
    const documents = this.getDocuments(userId);
        const quizzes = this.getQuizzes(userId);
    const quizAttempts = this.getQuizAttempts(userId);
    const skills = this.getSkills(userId);
    const certificates = this.getCertificates(userId);
    const projects = this.getProjects(userId);
    const achievements = this.getAchievements(userId);
    const resumes = this.getResumes(userId);
    const cvs = this.getCVs(userId);
    const interviews = this.getInterviews(userId);

    return {
      exportedAt: new Date().toISOString(),
      platform: 'buddy4students',
      ownerUserId: userId,
      profile,
      preferences,
      aiMemories,
      conversations,
      studyPlans,
      goals,
      notes,
      documents,
            quizzes,
      quizAttempts,
      skills,
      certificates,
      projects,
      achievements,
      resumes,
      cvs,
      interviews,
    };
  }

  // PRIVACY: COMPLETE ACCOUNT PURGE (CASCADE DELETION)
  public purgeUserAccount(userId: string): void {
    this.state.users = this.state.users.filter(u => u.id !== userId);
    this.state.profiles = this.state.profiles.filter(p => p.userId !== userId);
    this.state.preferences = this.state.preferences.filter(p => p.userId !== userId);
    this.state.aiMemories = this.state.aiMemories.filter(m => m.userId !== userId);
    this.state.conversations = this.state.conversations.filter(c => c.userId !== userId);
    this.state.messages = this.state.messages.filter(m => m.userId !== userId);
    this.state.studyPlans = this.state.studyPlans.filter(p => p.userId !== userId);
    this.state.goals = this.state.goals.filter(g => g.userId !== userId);
    this.state.notes = this.state.notes.filter(n => n.userId !== userId);
    this.state.documents = this.state.documents.filter(d => d.userId !== userId);
        this.state.quizzes = this.state.quizzes.filter(q => q.userId !== userId);
    this.state.quizAttempts = this.state.quizAttempts.filter(a => a.userId !== userId);
    this.state.skills = this.state.skills.filter(s => s.userId !== userId);
    this.state.certificates = this.state.certificates.filter(c => c.userId !== userId);
    this.state.projects = this.state.projects.filter(p => p.userId !== userId);
    this.state.achievements = this.state.achievements.filter(a => a.userId !== userId);
    this.state.resumes = this.state.resumes.filter(r => r.userId !== userId);
    this.state.cvs = this.state.cvs.filter(c => c.userId !== userId);
    this.state.interviews = this.state.interviews.filter(i => i.userId !== userId);
    this.save();
  }
}

export const db = new DatabaseManager();
