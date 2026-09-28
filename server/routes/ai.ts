import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import {
  generateAIChatResponse,
  generateAIStudyPlan,
  generateAIGoalTasks,
  generateAIQuiz,
  analyzeJobDescription,
  processNoteAIAction,
} from '../ai';
import { db } from '../db';

const router = Router();
router.use(requireAuth);

const uid = (req: Request) => req.user!.id;

// AI Chat Interaction
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, mode, conversationId, studentContext, forceWebSearch } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const aiMode = mode || 'tutor';
    let history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    // If conversationId is supplied, retrieve prior messages to provide thread continuity
    if (conversationId) {
      const conv = db.getConversationById(uid(req), conversationId);
      if (conv && conv.messages) {
        history = conv.messages.map(m => ({ role: m.role, content: m.content }));
      }
    }

    // Merge validated student context (degree, branch, academicYear, targetCareer, preferredLanguage)
    const storedProfile = db.getProfile(uid(req));
    const mergedStudentContext = {
      fullName: studentContext?.fullName || storedProfile?.fullName,
      degree: studentContext?.degree || storedProfile?.degree,
      branch: studentContext?.branch || storedProfile?.major || storedProfile?.branch,
      academicYear: studentContext?.academicYear || storedProfile?.academicYear,
      semester: studentContext?.semester || storedProfile?.semester,
      graduationYear: studentContext?.graduationYear || storedProfile?.graduationYear,
      targetCareer: studentContext?.targetCareer || storedProfile?.targetCareer,
      preferredLanguage: studentContext?.preferredLanguage || storedProfile?.preferredLanguage,
      learningStyle: studentContext?.learningStyle || storedProfile?.learningStyle,
      university: studentContext?.university || storedProfile?.university,
    };

    const result = await generateAIChatResponse({
      userId: uid(req),
      mode: aiMode,
      conversationHistory: history,
      userPrompt: prompt,
      studentContext: mergedStudentContext,
      forceWebSearch,
    });

    // If part of a conversation, persist the interaction with real-time grounding metadata
    if (conversationId) {
      db.addMessage(uid(req), conversationId, 'user', prompt);
      db.addMessage(uid(req), conversationId, 'assistant', result.text, {
        usedWebSearch: result.usedWebSearch,
        sources: result.sources,
        searchQueries: result.searchQueries,
      });
    }

    return res.json({
      response: result.text,
      usedWebSearch: result.usedWebSearch,
      sources: result.sources,
      searchQueries: result.searchQueries,
    });
  } catch (err: any) {
    console.error('[AI Chat Route Error]:', err);
    return res.status(500).json({
      error: 'buddy4students encountered a temporary issue generating your response. Please try again shortly.',
    });
  }
});

// Generate Adaptive Study Plan
router.post('/study-plan', async (req: Request, res: Response) => {
  try {
    const { subject, topic, totalDays, dailyMinutes, currentLevel, examDate } = req.body;
    if (!subject || !topic) {
      return res.status(400).json({ error: 'Subject and topic are required' });
    }

    const days = Number(totalDays) || 7;
    const mins = Number(dailyMinutes) || 45;

    const tasks = await generateAIStudyPlan({
      subject,
      topic,
      totalDays: days,
      dailyMinutes: mins,
      currentLevel: currentLevel || 'beginner',
      examDate,
    });

    return res.json({ tasks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed generating study plan' });
  }
});

// Break Down Goal Into Tasks
router.post('/goal-tasks', async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Goal title is required' });
    }

    const tasks = await generateAIGoalTasks(title, description || '');
    return res.json({ tasks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed generating goal tasks' });
  }
});

// Generate Quiz Questions
router.post('/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { topic, count } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const questions = await generateAIQuiz(topic, Number(count) || 4);
    return res.json({ questions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed generating quiz' });
  }
});

// Analyze Job Description
router.post('/analyze-job', async (req: Request, res: Response) => {
  try {
    const { jobText } = req.body;
    if (!jobText) {
      return res.status(400).json({ error: 'Job description text is required' });
    }

    // Retrieve approved student skills
    const skills = db.getSkills(uid(req)).map(s => s.skillName);

    const analysis = await analyzeJobDescription(jobText, skills);
    return res.json(analysis);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed analyzing job description' });
  }
});

// Note Action (Summarize / Flashcards / Explain)
router.post('/note-action', async (req: Request, res: Response) => {
  try {
    const { action, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const result = await processNoteAIAction(action || 'summarize', content);
    return res.json({ result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed processing note' });
  }
});

export default router;
