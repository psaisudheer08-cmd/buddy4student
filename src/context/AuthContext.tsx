import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Profile, StudentPreferences } from '../types';
import { api } from '../services/api';
import {
  supabase,
  fetchSupabaseProfile,
  ensureSupabaseProfile,
  updateSupabaseProfile,
  isValidUuid,
} from '../lib/supabase';

export type AuthModalMode = 'login' | 'signup' | 'welcome';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  preferences: StudentPreferences | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSupabaseAuth: boolean;
  emailConfirmationPending: boolean;
  authModalMode: AuthModalMode;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, fullName?: string) => Promise<{ confirmationRequired: boolean }>;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  updatePreferences: (data: Partial<StudentPreferences>) => Promise<void>;
  authModalOpen: boolean;
  setAuthModalMode: (mode: AuthModalMode) => void;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<StudentPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseAuth, setIsSupabaseAuth] = useState<boolean>(false);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  // Synchronize Supabase authenticated user and profile into React state
  const syncSupabaseUser = async (sessionUser: any, token?: string, initialFullName?: string) => {
    if (!sessionUser) {
      setUser(null);
      setProfile(null);
      setIsSupabaseAuth(false);
      api.clearToken();
      return;
    }

    const appUser: User = {
      id: sessionUser.id,
      email: sessionUser.email || '',
      isVerified: Boolean(sessionUser.email_confirmed_at),
      createdAt: sessionUser.created_at || new Date().toISOString(),
    };

    setUser(appUser);
    setIsSupabaseAuth(true);

    if (token) {
      api.setToken(token);
    }

    const resolvedFullName =
      initialFullName?.trim() ||
      sessionUser.user_metadata?.full_name ||
      (sessionUser.email ? sessionUser.email.split('@')[0] : 'Student');

    try {
      // Ensure student profile in public.profiles using authenticated user's ID
      const studentProfile = await ensureSupabaseProfile(
        sessionUser.id,
        sessionUser.email,
        {
          fullName: resolvedFullName,
          preferredName: resolvedFullName.split(' ')[0],
        }
      );
      setProfile(studentProfile);
    } catch (e: any) {
      console.warn('[Auth] Supabase profile sync notice, using local representation:', e.message);
      setProfile({
        id: sessionUser.id,
        userId: sessionUser.id,
        fullName: resolvedFullName,
        preferredName: resolvedFullName.split(' ')[0],
        university: '',
        institution: '',
        degree: 'Bachelor of Science',
        branch: 'Computer Science',
        major: 'Computer Science',
        academicYear: 'Year 1',
        semester: 'Semester 1',
        graduationYear: 2026,
        targetCareer: 'Software Engineer',
        preferredLanguage: 'English',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Initialize session on mount and subscribe to Supabase Auth state changes
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        setIsLoading(true);

        // 1. Check for existing persistent Supabase session
        let hasActiveSession = false;
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user && isMounted) {
            await syncSupabaseUser(session.user, session.access_token);
            hasActiveSession = true;
          }
        } catch (supaErr) {
          console.warn('[Auth] Supabase getSession check:', supaErr);
        }

        // 2. If no Supabase session, check server token
        if (!hasActiveSession && isMounted) {
          try {
            const me = await api.getMe();
            if (me?.user && isMounted) {
              setUser(me.user);
              setProfile(me.profile);
              setPreferences(me.preferences || null);
              setIsSupabaseAuth(false);
              hasActiveSession = true;
            }
          } catch {
            // No valid server token
          }
        }

        if (!hasActiveSession && isMounted) {
          setUser(null);
          setProfile(null);
          setPreferences(null);
          setIsSupabaseAuth(false);
          api.clearToken();
        }
      } catch (err) {
        console.error('[Auth] Session initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await syncSupabaseUser(session.user, session.access_token);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setPreferences(null);
          setIsSupabaseAuth(false);
          api.clearToken();
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Standard Login (Supabase with instant server fallback)
  const login = async (email: string, pass: string) => {
    setEmailConfirmationPending(false);
    const cleanEmail = email.trim();
    if (!cleanEmail) throw new Error('Email is required.');
    if (!pass) throw new Error('Password is required.');

    let loggedIn = false;

    // 1. Try Supabase first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (!error && data.user) {
        await syncSupabaseUser(data.user, data.session?.access_token);
        setAuthModalOpen(false);
        loggedIn = true;
        return;
      }
    } catch {
      // Continue to local backend
    }

    // 2. Try server authentication
    if (!loggedIn) {
      try {
        const result = await api.login(cleanEmail, pass);
        if (result?.user) {
          setUser(result.user);
          setProfile(result.profile);
          setIsSupabaseAuth(false);
          setAuthModalOpen(false);
          return;
        }
      } catch (serverErr: any) {
        throw new Error(serverErr.message || 'Invalid email or password. Please verify your credentials or use Demo Login.');
      }
    }
  };

  // Standard Signup (Supabase with reliable server fallback)
  const signup = async (email: string, pass: string, fullName?: string) => {
    setEmailConfirmationPending(false);
    const cleanEmail = email.trim();
    const cleanName = fullName?.trim() || '';

    if (!cleanEmail) throw new Error('Email is required.');
    if (!pass) throw new Error('Password is required.');
    if (pass.length < 6) throw new Error('Password must be at least 6 characters long.');

    let supaSuccess = false;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (!error && data.user) {
        // If Supabase gave a direct session
        if (data.session) {
          await syncSupabaseUser(data.user, data.session.access_token, cleanName);
          if (cleanName) {
            await updateSupabaseProfile(data.user.id, {
              fullName: cleanName,
              preferredName: cleanName.split(' ')[0],
            }).then((p) => setProfile(p)).catch(() => {});
          }
          setAuthModalOpen(false);
          supaSuccess = true;
          return { confirmationRequired: false };
        } else if (!data.user.email_confirmed_at) {
          // If Supabase wants email verification, create local server account so user can use app immediately!
          console.log('[Auth] Email confirmation pending on Supabase, bootstrapping local account for instant access.');
        }
      }
    } catch (supaErr: any) {
      console.warn('[Auth] Supabase signup error, activating local account:', supaErr.message);
    }

    if (!supaSuccess) {
      // Seamless local server registration fallback
      const result = await api.signup(cleanEmail, pass, cleanName);
      setUser(result.user);
      setProfile(result.profile);
      setIsSupabaseAuth(false);
      setAuthModalOpen(false);
      return { confirmationRequired: false };
    }

    return { confirmationRequired: false };
  };

  // One-Click Demo Student Access
  const loginAsDemo = async () => {
    setIsLoading(true);
    try {
      const result = await api.demoLogin();
      setUser(result.user);
      setProfile(result.profile);
      setIsSupabaseAuth(false);
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error('[Auth] Demo login failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (isSupabaseAuth) {
        await supabase.auth.signOut().catch(() => {});
      }
      await api.logout().catch(() => {});
    } finally {
      setUser(null);
      setProfile(null);
      setPreferences(null);
      setIsSupabaseAuth(false);
      api.clearToken();
      setAuthModalMode('login');
      setAuthModalOpen(true);
    }
  };

  const deleteAccount = async () => {
    if (user) {
      try {
        await supabase.from('profiles').delete().eq('id', user.id);
      } catch {
        // Ignore deletion error
      }
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    setProfile(null);
    setPreferences(null);
    setIsSupabaseAuth(false);
    api.clearToken();
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      if (isSupabaseAuth && isValidUuid(user.id)) {
        const prof = await fetchSupabaseProfile(user.id);
        if (prof) {
          setProfile(prof);
          return;
        }
      }
      const prof = await api.getProfile().catch(() => null);
      if (prof) setProfile(prof);
    } catch (e: any) {
      console.warn('[Auth] Error refreshing profile:', e.message);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) throw new Error('Not authenticated');

    // 1. If Supabase authenticated and user.id is a valid UUID, update Supabase
    if (isSupabaseAuth && isValidUuid(user.id)) {
      try {
        const updated = await updateSupabaseProfile(user.id, data);
        setProfile(updated);
        // Also update local server in background
        api.updateProfile(data).catch(() => {});
        return;
      } catch (e: any) {
        console.warn('[Auth] Supabase profile update failed, using server fallback:', e.message);
      }
    }

    // 2. Otherwise update through server API
    const updated = await api.updateProfile(data);
    setProfile(updated);
  };

  const updatePreferences = async (data: Partial<StudentPreferences>) => {
    const updated = await api.updatePreferences(data).catch(() => null);
    if (updated) setPreferences(updated);
  };

  const openAuthModal = (mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        preferences,
        isLoading,
        isAuthenticated: !!user,
        isSupabaseAuth,
        emailConfirmationPending,
        authModalMode,
        login,
        signup,
        loginAsDemo,
        logout,
        deleteAccount,
        refreshProfile,
        updateProfile,
        updatePreferences,
        authModalOpen,
        setAuthModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
