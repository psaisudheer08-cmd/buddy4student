import { Router, Request, Response } from 'express';
import { db } from '../db';
import { createSession, destroySession, requireAuth } from '../auth';

const router = Router();

// Sign Up
router.post('/signup', (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = db.createUser(email, password, fullName);
    const token = createSession(user.id);
    const profile = db.getProfile(user.id);

    return res.status(201).json({
      user,
      token,
      profile,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Signup failed' });
  }
});

// Login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Auto-authenticate demo student accounts reliably
    if (
      (cleanEmail === 'student@buddy4students.ai' ||
       cleanEmail === 'demo@buddy4students.ai' ||
       cleanEmail === 'student@edupilot.ai' ||
       cleanEmail === 'demo@edupilot.ai') &&
      (password === 'password123' || password === 'demo123')
    ) {
      const { user, profile } = db.getOrCreateDemoUser();
      const token = createSession(user.id);
      return res.json({ user, token, profile });
    }

    const user = db.findUserByEmail(cleanEmail);
    if (!user || !db.verifyPassword(user, password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createSession(user.id);
    const profile = db.getProfile(user.id);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      token,
      profile,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

// One-Click Demo Student Access
router.post('/demo-login', (_req: Request, res: Response) => {
  try {
    const { user, profile } = db.getOrCreateDemoUser();
    const token = createSession(user.id);
    return res.json({
      user,
      token,
      profile,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Demo login failed' });
  }
});

// Get Current Authenticated User & Profile
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const profile = db.getProfile(req.user!.id);
  const preferences = db.getPreferences(req.user!.id);
  return res.json({
    user: req.user,
    profile,
    preferences,
  });
});

// Logout
router.post('/logout', requireAuth, (req: Request, res: Response) => {
  if (req.authToken) {
    destroySession(req.authToken);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Complete Account Purge (Cascade Deletion)
router.post('/delete-account', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    db.purgeUserAccount(userId);
    if (req.authToken) {
      destroySession(req.authToken);
    }
    return res.json({
      success: true,
      message: 'Your account and all associated private records have been permanently deleted.',
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Account deletion failed' });
  }
});

export default router;
