import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo } from '../../components/BrandLogo';
import {
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';

function getFriendlyAuthErrorMessage(err: any): string {
  if (!err) return 'Authentication failed. Please try again.';
  const raw = typeof err === 'string' ? err : err.message || '';
  const lower = raw.toLowerCase();

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid grant') ||
    lower.includes('invalid_grant') ||
    lower.includes('invalid email or password')
  ) {
    return 'Incorrect email or password. Please verify your credentials or use the 1-Click Demo Login below.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Your email address has not been confirmed yet. You can sign in using Demo Student or try re-registering.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (lower.includes('password should be at least') || lower.includes('at least 6 characters')) {
    return 'Password must be at least 6 characters long.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('over_email_send_rate_limit')) {
    return 'Authentication rate limit reached. Please use the 1-Click Demo Login to enter immediately.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('fetch failed')) {
    return 'Network connection issue. Please verify your connection or use Demo Login.';
  }
  return raw || 'Authentication failed. Please check your credentials and try again.';
}

export const AuthModal: React.FC<{ isStandalone?: boolean }> = ({ isStandalone = false }) => {
  const {
    authModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    signup,
    loginAsDemo,
    emailConfirmationPending,
  } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Active form view: 'login' | 'signup'
  const activeTab: 'login' | 'signup' = authModalMode === 'signup' ? 'signup' : 'login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [progressStage, setProgressStage] = useState<'idle' | 'verifying' | 'entering'>('idle');

  // If not standalone and not open, don't render
  if (!isStandalone && !authModalOpen) return null;

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const switchTab = (tab: 'login' | 'signup') => {
    setError(null);
    setSuccessNotice(null);
    setAuthModalMode(tab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address (e.g. student@university.edu).');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setProgressStage('verifying');

    try {
      await login(cleanEmail, password);
      setProgressStage('entering');
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err));
      setProgressStage('idle');
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address (e.g. student@university.edu).');
      return;
    }
    if (!password) {
      setError('Please create a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    setProgressStage('verifying');

    try {
      const result = await signup(cleanEmail, password, cleanName);
      if (result?.confirmationRequired) {
        setSuccessNotice('Account created! Please check your inbox for verification or sign in directly.');
        setProgressStage('idle');
        setIsSubmitting(false);
      } else {
        setProgressStage('entering');
      }
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err));
      setProgressStage('idle');
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setSuccessNotice(null);
    setIsDemoSubmitting(true);
    setProgressStage('verifying');

    try {
      await loginAsDemo();
      setProgressStage('entering');
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err));
      setProgressStage('idle');
      setIsDemoSubmitting(false);
    }
  };

  const handleFillDemoCreds = () => {
    setEmail('student@buddy4students.ai');
    setPassword('password123');
    setError(null);
  };

  const containerContent = (
    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden relative transition-all">
      {/* Dynamic Animated Progress Bar during Login Progress */}
      {(isSubmitting || isDemoSubmitting) && (
        <div className="h-1.5 w-full bg-blue-100 dark:bg-blue-950 overflow-hidden absolute top-0 left-0 right-0 z-20">
          <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-pulse w-full"></div>
        </div>
      )}

      {/* Header with Brand Logo & Academic Tagline */}
      <div className="p-6 sm:p-8 pb-4 text-center border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900/90 dark:to-slate-900 relative">
        {/* Quick Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title={isDark ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Bright/Dark Mode"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-500 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        <div className="flex justify-center mb-3">
          <BrandLogo size="lg" className="justify-center" showTagline={false} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold tracking-wide border border-blue-100/80 dark:border-blue-900/50 mb-2">
          <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span>Student Learning Operating System</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          Private, AI-powered study planner, coursework assistant, and portfolio builder.
        </p>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mt-5">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('signup')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 pt-5">
        {/* Instant 1-Click Demo Login Banner */}
        <div className="mb-5 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl relative overflow-hidden group">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Instant Demo Student Access</span>
              </div>
              <p className="text-[11px] text-blue-700/90 dark:text-blue-300/90 truncate mt-0.5">
                Explore with pre-seeded Stanford CS coursework & goals
              </p>
            </div>
            <button
              type="button"
              disabled={isDemoSubmitting || isSubmitting}
              onClick={handleDemoLogin}
              className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isDemoSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Entering...</span>
                </>
              ) : (
                <>
                  <span>1-Click Enter</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center mb-5">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="shrink mx-3 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            or sign in with email
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Error Alert with Quick Demo Option */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
            <div className="pl-6">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-red-800 underline font-semibold hover:text-red-900 cursor-pointer"
              >
                Or enter immediately with 1-Click Demo Login &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {(successNotice || emailConfirmationPending) && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              {successNotice ||
                'Confirmation email sent! Please check your inbox or sign in below.'}
            </span>
          </div>
        )}

        {/* ==================================================== */}
        {/* 1. SIGN IN FORM (NORMAL, INTUITIVE, MODERN)          */}
        {/* ==================================================== */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoFocus
                  disabled={isSubmitting || isDemoSubmitting}
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={handleFillDemoCreds}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer"
                >
                  Fill demo credentials
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isSubmitting || isDemoSubmitting}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">Remember this device</span>
              </label>
            </div>

            {/* Submit Button with Dynamic Progress State */}
            <button
              type="submit"
              disabled={isSubmitting || isDemoSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {progressStage === 'verifying'
                      ? 'Verifying credentials...'
                      : 'Entering buddy4students...'}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ==================================================== */}
        {/* 2. CREATE ACCOUNT FORM (FAST, NO BLOCKERS)           */}
        {/* ==================================================== */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoFocus
                  disabled={isSubmitting || isDemoSubmitting}
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                University / Student Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  disabled={isSubmitting || isDemoSubmitting}
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  disabled={isSubmitting || isDemoSubmitting}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Must be at least 6 characters</p>
            </div>

            {/* Submit Button with Dynamic Progress State */}
            <button
              type="submit"
              disabled={isSubmitting || isDemoSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {progressStage === 'verifying'
                      ? 'Creating student account...'
                      : 'Setting up workspace...'}
                  </span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Student Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security & Privacy Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Encrypted sessions & private academic records</span>
        </div>
      </div>
    </div>
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center items-center p-4 transition-colors duration-150 relative">
        <div className="absolute top-4 right-4 z-30">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-white dark:hover:bg-slate-900 cursor-pointer transition-all"
            title={isDark ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span>{isDark ? 'Bright Mode' : 'Dark Mode'}</span>
          </button>
        </div>
        {containerContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {containerContent}
    </div>
  );
};
