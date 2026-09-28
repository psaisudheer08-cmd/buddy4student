import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth } from '../auth';

const router = Router();
router.use(requireAuth);

// Helper to get authenticated user id
const uid = (req: Request) => req.user!.id;

// ========================
// 1. PROFILE & PREFERENCES
// ========================
router.get('/profile', (req: Request, res: Response) => {
  const profile = db.getProfile(uid(req));
  return res.json(profile);
});

router.put('/profile', (req: Request, res: Response) => {
  const updated = db.updateProfile(uid(req), req.body);
  return res.json(updated);
});

router.get('/preferences', (req: Request, res: Response) => {
  const pref = db.getPreferences(uid(req));
  return res.json(pref);
});

router.put('/preferences', (req: Request, res: Response) => {
  const updated = db.updatePreferences(uid(req), req.body);
  return res.json(updated);
});

// ========================
// 2. AI MEMORY
// ========================
router.get('/memories', (req: Request, res: Response) => {
  const memories = db.getAIMemories(uid(req));
  return res.json(memories);
});

router.post('/memories', (req: Request, res: Response) => {
  const memory = db.addAIMemory(uid(req), req.body);
  return res.status(201).json(memory);
});

router.put('/memories/:id', (req: Request, res: Response) => {
  const memory = db.updateAIMemory(uid(req), req.params.id, req.body);
  return res.json(memory);
});

router.delete('/memories/:id', (req: Request, res: Response) => {
  db.deleteAIMemory(uid(req), req.params.id);
  return res.json({ success: true });
});

// ========================
// 3. CONVERSATIONS & CHAT
// ========================
router.get('/conversations', (req: Request, res: Response) => {
  const convs = db.getConversations(uid(req));
  return res.json(convs);
});

router.post('/conversations', (req: Request, res: Response) => {
  const { title, aiMode } = req.body;
  const conv = db.createConversation(uid(req), title || 'New Learning Chat', aiMode || 'tutor');
  return res.status(201).json(conv);
});

router.get('/conversations/:id', (req: Request, res: Response) => {
  try {
    const conv = db.getConversationById(uid(req), req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    return res.json(conv);
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }
});

router.post('/conversations/:id/messages', (req: Request, res: Response) => {
  try {
    const { role, content } = req.body;
    const msg = db.addMessage(uid(req), req.params.id, role, content);
    return res.status(201).json(msg);
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }
});

router.delete('/conversations/:id', (req: Request, res: Response) => {
  db.deleteConversation(uid(req), req.params.id);
  return res.json({ success: true });
});

// ========================
// 4. STUDY PLANS
// ========================
router.get('/study-plans', (req: Request, res: Response) => {
  const plans = db.getStudyPlans(uid(req));
  return res.json(plans);
});

router.post('/study-plans', (req: Request, res: Response) => {
  const plan = db.createStudyPlan(uid(req), req.body);
  return res.status(201).json(plan);
});

router.put('/study-plans/:planId/tasks/:taskId', (req: Request, res: Response) => {
  const { isCompleted } = req.body;
  const updated = db.updateStudyPlanTask(uid(req), req.params.planId, req.params.taskId, isCompleted);
  return res.json(updated);
});

router.delete('/study-plans/:id', (req: Request, res: Response) => {
  db.deleteStudyPlan(uid(req), req.params.id);
  return res.json({ success: true });
});

// ========================
// 5. GOALS & TASKS
// ========================
router.get('/goals', (req: Request, res: Response) => {
  const goals = db.getGoals(uid(req));
  return res.json(goals);
});

router.post('/goals', (req: Request, res: Response) => {
  const goal = db.createGoal(uid(req), req.body);
  return res.status(201).json(goal);
});

router.post('/goals/:id/star', (req: Request, res: Response) => {
  const updated = db.toggleStarGoal(uid(req), req.params.id);
  return res.json(updated);
});

router.put('/goals/:goalId/tasks/:taskId/toggle', (req: Request, res: Response) => {
  const updated = db.toggleGoalTask(uid(req), req.params.goalId, req.params.taskId);
  return res.json(updated);
});

router.delete('/goals/:id', (req: Request, res: Response) => {
  db.deleteGoal(uid(req), req.params.id);
  return res.json({ success: true });
});

// ========================
// 6. NOTES & DOCUMENTS
// ========================
router.get('/notes', (req: Request, res: Response) => {
  const notes = db.getNotes(uid(req));
  return res.json(notes);
});

router.post('/notes', (req: Request, res: Response) => {
  const note = db.createNote(uid(req), req.body);
  return res.status(201).json(note);
});

router.put('/notes/:id', (req: Request, res: Response) => {
  const updated = db.updateNote(uid(req), req.params.id, req.body);
  return res.json(updated);
});

router.delete('/notes/:id', (req: Request, res: Response) => {
  db.deleteNote(uid(req), req.params.id);
  return res.json({ success: true });
});

router.get('/documents', (req: Request, res: Response) => {
  const docs = db.getDocuments(uid(req));
  return res.json(docs);
});

router.post('/documents', (req: Request, res: Response) => {
  const doc = db.addDocument(uid(req), req.body);
  return res.status(201).json(doc);
});

router.delete('/documents/:id', (req: Request, res: Response) => {
  db.deleteDocument(uid(req), req.params.id);
  return res.json({ success: true });
});


// ========================
// 8. QUIZZES
// ========================
router.get('/quizzes', (req: Request, res: Response) => {
  const quizzes = db.getQuizzes(uid(req));
  return res.json(quizzes);
});

router.post('/quizzes', (req: Request, res: Response) => {
  const quiz = db.createQuiz(uid(req), req.body);
  return res.status(201).json(quiz);
});

router.post('/quizzes/:id/attempt', (req: Request, res: Response) => {
  const { answers, score, totalQuestions } = req.body;
  const attempt = db.recordQuizAttempt(uid(req), req.params.id, answers, score, totalQuestions);
  return res.status(201).json(attempt);
});

router.get('/quizzes/attempts', (req: Request, res: Response) => {
  const attempts = db.getQuizAttempts(uid(req));
  return res.json(attempts);
});

// ========================
// 9. SKILLS & EVIDENCE
// ========================
router.get('/skills', (req: Request, res: Response) => {
  const skills = db.getSkills(uid(req));
  return res.json(skills);
});

router.post('/skills', (req: Request, res: Response) => {
  const skill = db.addSkill(uid(req), req.body);
  return res.status(201).json(skill);
});

router.post('/skills/:id/star', (req: Request, res: Response) => {
  const updated = db.toggleStarSkill(uid(req), req.params.id);
  return res.json(updated);
});

router.put('/skills/:id/rating', (req: Request, res: Response) => {
  const { starRating } = req.body;
  const updated = db.setSkillRating(uid(req), req.params.id, starRating);
  return res.json(updated);
});

router.delete('/skills/:id', (req: Request, res: Response) => {
  db.deleteSkill(uid(req), req.params.id);
  return res.json({ success: true });
});

// ========================
// 10. CERTIFICATES
// ========================
router.get('/certificates', (req: Request, res: Response) => {
  const certs = db.getCertificates(uid(req));
  return res.json(certs);
});

router.post('/certificates', (req: Request, res: Response) => {
  const cert = db.addCertificate(uid(req), req.body);
  return res.status(201).json(cert);
});

router.put('/certificates/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = db.updateCertificateStatus(uid(req), req.params.id, status);
  return res.json(updated);
});

router.delete('/certificates/:id', (req: Request, res: Response) => {
  db.deleteCertificate(uid(req), req.params.id);
  return res.json({ success: true });
});

// ========================
// 11. PROJECTS & ACHIEVEMENTS
// ========================
router.get('/projects', (req: Request, res: Response) => {
  const projs = db.getProjects(uid(req));
  return res.json(projs);
});

router.post('/projects', (req: Request, res: Response) => {
  const proj = db.addProject(uid(req), req.body);
  return res.status(201).json(proj);
});

router.post('/projects/:id/star', (req: Request, res: Response) => {
  const updated = db.toggleStarProject(uid(req), req.params.id);
  return res.json(updated);
});

router.delete('/projects/:id', (req: Request, res: Response) => {
  db.deleteProject(uid(req), req.params.id);
  return res.json({ success: true });
});

router.get('/achievements', (req: Request, res: Response) => {
  const achs = db.getAchievements(uid(req));
  return res.json(achs);
});

router.post('/achievements', (req: Request, res: Response) => {
  const ach = db.addAchievement(uid(req), req.body);
  return res.status(201).json(ach);
});

router.delete('/achievements/:id', (req: Request, res: Response) => {
  db.deleteAchievement(uid(req), req.params.id);
  return res.json({ success: true });
});

// ========================
// 12. RESUMES & CVS
// ========================
router.get('/resumes', (req: Request, res: Response) => {
  const resumes = db.getResumes(uid(req));
  return res.json(resumes);
});

router.post('/resumes', (req: Request, res: Response) => {
  const resume = db.saveResume(uid(req), req.body);
  return res.status(201).json(resume);
});

router.get('/cvs', (req: Request, res: Response) => {
  const cvs = db.getCVs(uid(req));
  return res.json(cvs);
});

router.post('/cvs', (req: Request, res: Response) => {
  const cv = db.saveCV(uid(req), req.body);
  return res.status(201).json(cv);
});

// MANUAL CV BUILDER DATA
router.get('/cv-builder', (req: Request, res: Response) => {
  const cv = db.getStudentCV(uid(req));
  return res.json(cv);
});

router.post('/cv-builder', (req: Request, res: Response) => {
  const saved = db.saveStudentCV(uid(req), req.body);
  return res.json(saved);
});

// MANUAL PORTFOLIO BUILDER DATA
router.get('/portfolio-builder', (req: Request, res: Response) => {
  const port = db.getStudentPortfolio(uid(req));
  return res.json(port);
});

router.post('/portfolio-builder', (req: Request, res: Response) => {
  const saved = db.saveStudentPortfolio(uid(req), req.body);
  return res.json(saved);
});

// ========================
// 13. MOCK INTERVIEWS
// ========================
router.get('/interviews', (req: Request, res: Response) => {
  const sessions = db.getInterviews(uid(req));
  return res.json(sessions);
});

router.post('/interviews', (req: Request, res: Response) => {
  const session = db.saveInterview(uid(req), req.body);
  return res.status(201).json(session);
});

// ========================
// 14. DATA EXPORT ("Download My Data")
// ========================
router.get('/export', (req: Request, res: Response) => {
  const data = db.exportUserData(uid(req));
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="buddy4students_data_${req.user!.id}.json"`);
  return res.json(data);
});

// ========================
// 15. STUDENT STARS FEATURE & REWARDS
// ========================
router.get('/stars', (req: Request, res: Response) => {
  const summary = db.getStarsSummary(uid(req));
  return res.json(summary);
});

router.post('/stars/award', (req: Request, res: Response) => {
  const { amount, reason, category } = req.body;
  const summary = db.awardStars(uid(req), Number(amount) || 10, reason || 'Academic Milestone', category || 'milestone');
  return res.json(summary);
});

router.post('/stars/claim', (req: Request, res: Response) => {
  const { milestoneId } = req.body;
  const summary = db.claimStarMilestone(uid(req), milestoneId);
  return res.json(summary);
});

export default router;
