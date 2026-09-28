import {
  User, Profile, StudentPreferences, AIMemory, Conversation, Message,
  StudyPlan, Goal, Note, DocumentItem, Quiz, QuizAttempt,
  Skill, Certificate, Project, Achievement, Resume, CV, MockInterviewSession,
  JobDescriptionAnalysis, AIMode, StudentCVData, StudentPortfolioData, StarSummary
} from '../types';

const TOKEN_KEY = 'buddy4students_session_token';
const LEGACY_TOKEN_KEY = 'edupilot_session_token';

class ApiService {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  }

  public setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    try {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch (e) {}
  }

  public clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    try {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch (e) {}
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // AUTH
  public async login(email: string, password: string) {
    const data = await this.request<{ user: User; token: string; profile: Profile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  public async signup(email: string, password: string, fullName?: string) {
    const data = await this.request<{ user: User; token: string; profile: Profile }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
    this.setToken(data.token);
    return data;
  }

  public async demoLogin() {
    const data = await this.request<{ user: User; token: string; profile: Profile }>('/api/auth/demo-login', {
      method: 'POST',
    });
    this.setToken(data.token);
    return data;
  }

  public async getMe() {
    return this.request<{ user: User; profile: Profile; preferences: StudentPreferences }>('/api/auth/me');
  }

  public async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }


  public async deleteAccount() {
    const res = await this.request<{ success: boolean; message: string }>('/api/auth/delete-account', {
      method: 'POST',
    });
    this.clearToken();
    return res;
  }

  // PROFILE & PREFERENCES
  public async getProfile() {
    return this.request<Profile>('/api/data/profile');
  }

  public async updateProfile(profile: Partial<Profile>) {
    return this.request<Profile>('/api/data/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  public async getPreferences() {
    return this.request<StudentPreferences>('/api/data/preferences');
  }

  public async updatePreferences(preferences: Partial<StudentPreferences>) {
    return this.request<StudentPreferences>('/api/data/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // AI MEMORY
  public async getAIMemories() {
    return this.request<AIMemory[]>('/api/data/memories');
  }

  public async addAIMemory(memory: Omit<AIMemory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    return this.request<AIMemory>('/api/data/memories', {
      method: 'POST',
      body: JSON.stringify(memory),
    });
  }

  public async updateAIMemory(id: string, updates: Partial<AIMemory>) {
    return this.request<AIMemory>(`/api/data/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteAIMemory(id: string) {
    return this.request<{ success: boolean }>(`/api/data/memories/${id}`, {
      method: 'DELETE',
    });
  }

  // CONVERSATIONS
  public async getConversations() {
    return this.request<Conversation[]>('/api/data/conversations');
  }

  public async createConversation(title: string, aiMode: AIMode) {
    return this.request<Conversation>('/api/data/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, aiMode }),
    });
  }

  public async getConversation(id: string) {
    return this.request<Conversation>(`/api/data/conversations/${id}`);
  }

  public async addMessage(convId: string, role: 'user' | 'assistant' | 'system', content: string) {
    return this.request<Message>(`/api/data/conversations/${convId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ role, content }),
    });
  }

  public async deleteConversation(id: string) {
    return this.request<{ success: boolean }>(`/api/data/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  // AI ASSISTANT PROXY
  public async chatAI(
    prompt: string,
    mode: AIMode,
    conversationId?: string,
    studentContext?: {
      fullName?: string;
      degree?: string;
      branch?: string;
      academicYear?: string;
      semester?: string;
      graduationYear?: number | string;
      targetCareer?: string;
      preferredLanguage?: string;
      learningStyle?: string;
      university?: string;
    },
    forceWebSearch?: boolean
  ) {
    return this.request<{
      response: string;
      usedWebSearch?: boolean;
      sources?: Array<{ title: string; url: string }>;
      searchQueries?: string[];
    }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, mode, conversationId, studentContext, forceWebSearch }),
    });
  }

  public async generateStudyPlanAI(params: {
    subject: string;
    topic: string;
    totalDays: number;
    dailyMinutes: number;
    currentLevel: string;
    examDate?: string;
  }) {
    return this.request<{ tasks: Array<{ dayNumber: number; topicTitle: string; durationMinutes: number }> }>(
      '/api/ai/study-plan',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  public async generateGoalTasksAI(title: string, description?: string) {
    return this.request<{ tasks: string[] }>('/api/ai/goal-tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  }

  public async generateQuizAI(topic: string, count: number = 4) {
    return this.request<{ questions: any[] }>('/api/ai/generate-quiz', {
      method: 'POST',
      body: JSON.stringify({ topic, count }),
    });
  }

  public async analyzeJobAI(jobText: string) {
    return this.request<JobDescriptionAnalysis>('/api/ai/analyze-job', {
      method: 'POST',
      body: JSON.stringify({ jobText }),
    });
  }

  public async processNoteAI(action: 'summarize' | 'flashcards' | 'explain', content: string) {
    return this.request<{ result: string }>('/api/ai/note-action', {
      method: 'POST',
      body: JSON.stringify({ action, content }),
    });
  }

  // STUDY PLANS
  public async getStudyPlans() {
    return this.request<StudyPlan[]>('/api/data/study-plans');
  }

  public async createStudyPlan(plan: Partial<StudyPlan>) {
    return this.request<StudyPlan>('/api/data/study-plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  public async toggleStudyTask(planId: string, taskId: string, isCompleted: boolean) {
    return this.request<StudyPlan>(`/api/data/study-plans/${planId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ isCompleted }),
    });
  }

  public async deleteStudyPlan(id: string) {
    return this.request<{ success: boolean }>(`/api/data/study-plans/${id}`, {
      method: 'DELETE',
    });
  }

  // GOALS
  public async getGoals() {
    return this.request<Goal[]>('/api/data/goals');
  }

  public async createGoal(goal: Partial<Goal>) {
    return this.request<Goal>('/api/data/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  }

  public async toggleGoalTask(goalId: string, taskId: string) {
    return this.request<Goal>(`/api/data/goals/${goalId}/tasks/${taskId}/toggle`, {
      method: 'PUT',
    });
  }

  public async deleteGoal(id: string) {
    return this.request<{ success: boolean }>(`/api/data/goals/${id}`, {
      method: 'DELETE',
    });
  }

  // NOTES
  public async getNotes() {
    return this.request<Note[]>('/api/data/notes');
  }

  public async createNote(note: Partial<Note>) {
    return this.request<Note>('/api/data/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  public async updateNote(id: string, updates: Partial<Note>) {
    return this.request<Note>(`/api/data/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteNote(id: string) {
    return this.request<{ success: boolean }>(`/api/data/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // DOCUMENTS
  public async getDocuments() {
    return this.request<DocumentItem[]>('/api/data/documents');
  }

  public async addDocument(doc: Partial<DocumentItem>) {
    return this.request<DocumentItem>('/api/data/documents', {
      method: 'POST',
      body: JSON.stringify(doc),
    });
  }

  public async deleteDocument(id: string) {
    return this.request<{ success: boolean }>(`/api/data/documents/${id}`, {
      method: 'DELETE',
    });
  }


  // QUIZZES
  public async getQuizzes() {
    return this.request<Quiz[]>('/api/data/quizzes');
  }

  public async createQuiz(quiz: Partial<Quiz>) {
    return this.request<Quiz>('/api/data/quizzes', {
      method: 'POST',
      body: JSON.stringify(quiz),
    });
  }

  public async submitQuizAttempt(quizId: string, answers: Record<string, string>, score: number, totalQuestions: number) {
    return this.request<QuizAttempt>(`/api/data/quizzes/${quizId}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ answers, score, totalQuestions }),
    });
  }

  public async getQuizAttempts() {
    return this.request<QuizAttempt[]>('/api/data/quizzes/attempts');
  }

  // SKILLS
  public async getSkills() {
    return this.request<Skill[]>('/api/data/skills');
  }

  public async addSkill(skill: Partial<Skill>) {
    return this.request<Skill>('/api/data/skills', {
      method: 'POST',
      body: JSON.stringify(skill),
    });
  }

  public async deleteSkill(id: string) {
    return this.request<{ success: boolean }>(`/api/data/skills/${id}`, {
      method: 'DELETE',
    });
  }

  // CERTIFICATES
  public async getCertificates() {
    return this.request<Certificate[]>('/api/data/certificates');
  }

  public async addCertificate(cert: Partial<Certificate>) {
    return this.request<Certificate>('/api/data/certificates', {
      method: 'POST',
      body: JSON.stringify(cert),
    });
  }

  public async updateCertificateStatus(id: string, status: string) {
    return this.request<Certificate>(`/api/data/certificates/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  public async deleteCertificate(id: string) {
    return this.request<{ success: boolean }>(`/api/data/certificates/${id}`, {
      method: 'DELETE',
    });
  }

  // PROJECTS
  public async getProjects() {
    return this.request<Project[]>('/api/data/projects');
  }

  public async addProject(proj: Partial<Project>) {
    return this.request<Project>('/api/data/projects', {
      method: 'POST',
      body: JSON.stringify(proj),
    });
  }

  public async deleteProject(id: string) {
    return this.request<{ success: boolean }>(`/api/data/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // ACHIEVEMENTS
  public async getAchievements() {
    return this.request<Achievement[]>('/api/data/achievements');
  }

  public async addAchievement(ach: Partial<Achievement>) {
    return this.request<Achievement>('/api/data/achievements', {
      method: 'POST',
      body: JSON.stringify(ach),
    });
  }

  public async deleteAchievement(id: string) {
    return this.request<{ success: boolean }>(`/api/data/achievements/${id}`, {
      method: 'DELETE',
    });
  }

  // RESUMES & CVS
  public async getResumes() {
    return this.request<Resume[]>('/api/data/resumes');
  }

  public async saveResume(resume: Partial<Resume>) {
    return this.request<Resume>('/api/data/resumes', {
      method: 'POST',
      body: JSON.stringify(resume),
    });
  }

  public async getCVs() {
    return this.request<CV[]>('/api/data/cvs');
  }

  public async saveCV(cv: Partial<CV>) {
    return this.request<CV>('/api/data/cvs', {
      method: 'POST',
      body: JSON.stringify(cv),
    });
  }

  // MANUAL CV BUILDER
  public async getCVBuilderData(): Promise<StudentCVData | null> {
    return this.request<StudentCVData | null>('/api/data/cv-builder');
  }

  public async saveCVBuilderData(cvData: StudentCVData): Promise<StudentCVData> {
    return this.request<StudentCVData>('/api/data/cv-builder', {
      method: 'POST',
      body: JSON.stringify(cvData),
    });
  }

  // MANUAL PORTFOLIO BUILDER
  public async getPortfolioData(): Promise<StudentPortfolioData | null> {
    return this.request<StudentPortfolioData | null>('/api/data/portfolio-builder');
  }

  public async savePortfolioData(portfolioData: StudentPortfolioData): Promise<StudentPortfolioData> {
    return this.request<StudentPortfolioData>('/api/data/portfolio-builder', {
      method: 'POST',
      body: JSON.stringify(portfolioData),
    });
  }

  // MOCK INTERVIEWS
  public async getInterviews() {
    return this.request<MockInterviewSession[]>('/api/data/interviews');
  }

  public async saveInterview(session: Partial<MockInterviewSession>) {
    return this.request<MockInterviewSession>('/api/data/interviews', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  // FILE STORAGE
  public async uploadFile(fileName: string, mimeType: string, base64Data: string, category: string = 'documents') {
    return this.request<{ success: boolean; storagePath: string; fileName: string; fileSize: number }>(
      '/api/storage/upload',
      {
        method: 'POST',
        body: JSON.stringify({ fileName, mimeType, base64Data, category }),
      }
    );
  }

  // DATA EXPORT
  public async exportUserData(): Promise<any> {
    return this.request<any>('/api/data/export');
  }

  // ==========================================
  // STARS FEATURE: TOGGLE & REWARDS API
  // ==========================================
  public async toggleStarProject(id: string): Promise<Project> {
    return this.request<Project>(`/api/data/projects/${id}/star`, {
      method: 'POST',
    });
  }

  public async toggleStarSkill(id: string): Promise<Skill> {
    return this.request<Skill>(`/api/data/skills/${id}/star`, {
      method: 'POST',
    });
  }

  public async setSkillRating(id: string, starRating: number): Promise<Skill> {
    return this.request<Skill>(`/api/data/skills/${id}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ starRating }),
    });
  }

  public async toggleStarGoal(id: string): Promise<Goal> {
    return this.request<Goal>(`/api/data/goals/${id}/star`, {
      method: 'POST',
    });
  }

  public async getStarsSummary(): Promise<StarSummary> {
    return this.request<StarSummary>('/api/data/stars');
  }

  public async awardStars(amount: number, reason: string, category: string = 'milestone'): Promise<StarSummary> {
    return this.request<StarSummary>('/api/data/stars/award', {
      method: 'POST',
      body: JSON.stringify({ amount, reason, category }),
    });
  }

  public async claimStarMilestone(milestoneId: string): Promise<StarSummary> {
    return this.request<StarSummary>('/api/data/stars/claim', {
      method: 'POST',
      body: JSON.stringify({ milestoneId }),
    });
  }
}

export const api = new ApiService();
