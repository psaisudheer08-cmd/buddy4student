import { createClient } from '@supabase/supabase-js';
import { Profile, StudentCVData, StudentPortfolioData } from '../types';

// Supabase credentials from environment variables
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://nkgwgijegozuvhqsobgu.supabase.co';

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_GZy_N0uT9bc2bhkq8f7Rnw_t-FyZ1QR';

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    '[Supabase] Warning: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variables.'
  );
}

// Reusable Supabase client with persistent sessions
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

export interface SupabaseProfileRow {
  id: string;
  full_name: string | null;
  preferred_name: string | null;
  university: string | null;
  degree: string | null;
  branch: string | null;
  academic_year: string | null;
  semester: string | null;
  graduation_year: number | null;
  target_career: string | null;
  preferred_language: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export function toAppProfile(row: SupabaseProfileRow, email?: string): Profile {
  const nameFallback = email ? email.split('@')[0] : 'Student';
  return {
    id: row.id,
    userId: row.id,
    fullName: row.full_name || nameFallback,
    preferredName: row.preferred_name || (row.full_name ? row.full_name.split(' ')[0] : nameFallback),
    university: row.university || '',
    institution: row.university || '',
    degree: row.degree || 'Bachelor of Science',
    branch: row.branch || '',
    major: row.branch || 'Computer Science',
    academicYear: row.academic_year || 'Year 3',
    semester: row.semester || 'Semester 5',
    graduationYear: row.graduation_year || 2026,
    targetCareer: row.target_career || 'Software Engineer',
    preferredLanguage: row.preferred_language || 'English',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function toSupabasePayload(data: Partial<Profile>): Partial<SupabaseProfileRow> {
  const payload: Partial<SupabaseProfileRow> = {};

  if (data.fullName !== undefined) payload.full_name = data.fullName;
  if (data.preferredName !== undefined) payload.preferred_name = data.preferredName;
  if (data.university !== undefined) payload.university = data.university;
  if (data.institution !== undefined && !payload.university) payload.university = data.institution;
  if (data.degree !== undefined) payload.degree = data.degree;
  if (data.branch !== undefined) payload.branch = data.branch;
  if (data.major !== undefined && !payload.branch) payload.branch = data.major;
  if (data.academicYear !== undefined) payload.academic_year = data.academicYear;
  if (data.semester !== undefined) payload.semester = data.semester;
  if (data.graduationYear !== undefined) {
    const yr = Number(data.graduationYear);
    payload.graduation_year = isNaN(yr) ? 2026 : yr;
  }
  if (data.targetCareer !== undefined) payload.target_career = data.targetCareer;
  if (data.preferredLanguage !== undefined) payload.preferred_language = data.preferredLanguage;

  payload.updated_at = new Date().toISOString();
  return payload;
}

/**
 * Validates whether a given string is a valid RFC4122 UUID required by PostgreSQL uuid columns
 */
export function isValidUuid(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

/**
 * Fetch profile for the authenticated user from public.profiles
 */
export async function fetchSupabaseProfile(userId: string): Promise<Profile | null> {
  if (!isValidUuid(userId)) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Supabase] Profile lookup notice:', error.message);
    return null;
  }

  if (!data) return null;
  return toAppProfile(data as SupabaseProfileRow);
}

/**
 * Ensures a profile exists in public.profiles for the authenticated user
 */
export async function ensureSupabaseProfile(
  userId: string,
  userEmail?: string,
  initialData?: Partial<Profile>
): Promise<Profile> {
  const defaultName = initialData?.fullName || (userEmail ? userEmail.split('@')[0] : 'Student');

  if (!isValidUuid(userId)) {
    return {
      id: userId,
      userId,
      fullName: defaultName,
      preferredName: initialData?.preferredName || defaultName.split(' ')[0],
      university: initialData?.university || initialData?.institution || '',
      institution: initialData?.university || initialData?.institution || '',
      degree: initialData?.degree || 'Bachelor of Science',
      branch: initialData?.branch || initialData?.major || 'Computer Science',
      major: initialData?.branch || initialData?.major || 'Computer Science',
      academicYear: initialData?.academicYear || 'Year 1',
      semester: initialData?.semester || 'Semester 1',
      graduationYear: Number(initialData?.graduationYear) || 2026,
      targetCareer: initialData?.targetCareer || 'Software Engineer',
      preferredLanguage: initialData?.preferredLanguage || 'English',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Check if profile already exists
  const existing = await fetchSupabaseProfile(userId).catch(() => null);
  if (existing) {
    return existing;
  }

  // Create new profile record in public.profiles
  const insertPayload: SupabaseProfileRow = {
    id: userId,
    full_name: defaultName,
    preferred_name: initialData?.preferredName || defaultName.split(' ')[0],
    university: initialData?.university || initialData?.institution || 'University',
    degree: initialData?.degree || 'Bachelor of Science',
    branch: initialData?.branch || initialData?.major || 'Computer Science',
    academic_year: initialData?.academicYear || 'Year 1',
    semester: initialData?.semester || 'Semester 1',
    graduation_year: Number(initialData?.graduationYear) || 2027,
    target_career: initialData?.targetCareer || 'Software Engineer',
    preferred_language: initialData?.preferredLanguage || 'English',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    console.warn('[Supabase] Failed to create profile record:', error.message);
    const refetched = await fetchSupabaseProfile(userId).catch(() => null);
    if (refetched) return refetched;
    return toAppProfile(insertPayload, userEmail);
  }

  return toAppProfile(data as SupabaseProfileRow, userEmail);
}

/**
 * Updates the user's profile in public.profiles with Row-Level Security
 */
export async function updateSupabaseProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile> {
  if (!isValidUuid(userId)) {
    return {
      id: userId,
      userId,
      fullName: updates.fullName || 'Student',
      preferredName: updates.preferredName || updates.fullName?.split(' ')[0] || 'Student',
      university: updates.university || '',
      institution: updates.university || updates.institution || '',
      degree: updates.degree || 'Bachelor of Science',
      branch: updates.branch || updates.major || '',
      major: updates.branch || updates.major || '',
      academicYear: updates.academicYear || 'Year 1',
      semester: updates.semester || 'Semester 1',
      graduationYear: Number(updates.graduationYear) || 2026,
      targetCareer: updates.targetCareer || '',
      preferredLanguage: updates.preferredLanguage || 'English',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates,
    };
  }

  const payload = toSupabasePayload(updates);

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.warn('[Supabase] Notice updating public.profiles:', error.message);
    return {
      id: userId,
      userId,
      fullName: updates.fullName || 'Student',
      preferredName: updates.preferredName || updates.fullName?.split(' ')[0] || 'Student',
      university: updates.university || '',
      institution: updates.university || updates.institution || '',
      degree: updates.degree || 'Bachelor of Science',
      branch: updates.branch || updates.major || '',
      major: updates.branch || updates.major || '',
      academicYear: updates.academicYear || 'Year 1',
      semester: updates.semester || 'Semester 1',
      graduationYear: Number(updates.graduationYear) || 2026,
      targetCareer: updates.targetCareer || '',
      preferredLanguage: updates.preferredLanguage || 'English',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates,
    };
  }

  return toAppProfile(data as SupabaseProfileRow);
}

/**
 * Saves chat interaction to Supabase if chat tables exist in the user's project schema
 */
export async function recordChatMessageToSupabase(params: {
  userId: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  usedWebSearch?: boolean;
  sources?: Array<{ title: string; url: string }>;
}): Promise<void> {
  if (!isValidUuid(params.userId)) return;

  try {
    const { error } = await supabase.from('chat_messages').insert([
      {
        user_id: params.userId,
        conversation_id: params.conversationId,
        role: params.role,
        content: params.content,
        used_web_search: !!params.usedWebSearch,
        sources: params.sources ? JSON.stringify(params.sources) : null,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error && error.code !== '42P01') {
      console.debug('[Supabase chat_messages]', error.message);
    }
  } catch {
    // Non-blocking
  }
}

/**
 * ========================================================
 * SUPABASE STUDENT CV PERSISTENCE (RLS Enforced)
 * ========================================================
 */
export async function fetchSupabaseStudentCV(userId: string): Promise<StudentCVData | null> {
  if (!isValidUuid(userId)) return null;

  try {
    const { data, error } = await supabase
      .from('student_cvs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        // Table not created yet
        return null;
      }
      console.warn('[Supabase CV] Fetch notice:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      template: data.template || 'classic',
      personalInfo: data.personal_info || {},
      professionalSummary: data.professional_summary || '',
      education: data.education || [],
      skills: data.skills || [],
      projects: data.projects || [],
      experience: data.experience || [],
      certifications: data.certifications || [],
      achievements: data.achievements || [],
      extracurricular: data.extracurricular || [],
      languages: data.languages || [],
      updatedAt: data.updated_at,
    };
  } catch (e) {
    console.warn('[Supabase CV] Exception loading CV:', e);
    return null;
  }
}

export async function saveSupabaseStudentCV(userId: string, cvData: StudentCVData): Promise<StudentCVData> {
  if (!isValidUuid(userId)) {
    return { ...cvData, userId, updatedAt: new Date().toISOString() };
  }

  const payload = {
    user_id: userId,
    template: cvData.template || 'classic',
    personal_info: cvData.personalInfo,
    professional_summary: cvData.professionalSummary,
    education: cvData.education,
    skills: cvData.skills,
    projects: cvData.projects,
    experience: cvData.experience,
    certifications: cvData.certifications,
    achievements: cvData.achievements,
    extracurricular: cvData.extracurricular,
    languages: cvData.languages,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('student_cvs')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.warn('[Supabase CV] Save warning:', error.message);
      return { ...cvData, userId, updatedAt: new Date().toISOString() };
    }

    return {
      id: data.id,
      userId: data.user_id,
      template: data.template,
      personalInfo: data.personal_info,
      professionalSummary: data.professional_summary,
      education: data.education,
      skills: data.skills,
      projects: data.projects,
      experience: data.experience,
      certifications: data.certifications,
      achievements: data.achievements,
      extracurricular: data.extracurricular,
      languages: data.languages,
      updatedAt: data.updated_at,
    };
  } catch (e) {
    console.warn('[Supabase CV] Exception saving CV:', e);
    return { ...cvData, userId, updatedAt: new Date().toISOString() };
  }
}

/**
 * ========================================================
 * SUPABASE STUDENT PORTFOLIO PERSISTENCE (RLS Enforced)
 * ========================================================
 */
export async function fetchSupabaseStudentPortfolio(userId: string): Promise<StudentPortfolioData | null> {
  if (!isValidUuid(userId)) return null;

  try {
    const { data, error } = await supabase
      .from('student_portfolios')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        return null;
      }
      console.warn('[Supabase Portfolio] Fetch notice:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      isPublished: !!data.is_published,
      profile: data.profile || {},
      skills: data.skills || [],
      projects: data.projects || [],
      education: data.education || [],
      certificates: data.certificates || [],
      achievements: data.achievements || [],
      updatedAt: data.updated_at,
    };
  } catch (e) {
    console.warn('[Supabase Portfolio] Exception loading:', e);
    return null;
  }
}

export async function saveSupabaseStudentPortfolio(userId: string, portfolioData: StudentPortfolioData): Promise<StudentPortfolioData> {
  if (!isValidUuid(userId)) {
    return { ...portfolioData, userId, updatedAt: new Date().toISOString() };
  }

  const payload = {
    user_id: userId,
    is_published: !!portfolioData.isPublished,
    profile: portfolioData.profile,
    skills: portfolioData.skills,
    projects: portfolioData.projects,
    education: portfolioData.education,
    certificates: portfolioData.certificates,
    achievements: portfolioData.achievements,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('student_portfolios')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.warn('[Supabase Portfolio] Save warning:', error.message);
      return { ...portfolioData, userId, updatedAt: new Date().toISOString() };
    }

    return {
      id: data.id,
      userId: data.user_id,
      isPublished: data.is_published,
      profile: data.profile,
      skills: data.skills,
      projects: data.projects,
      education: data.education,
      certificates: data.certificates,
      achievements: data.achievements,
      updatedAt: data.updated_at,
    };
  } catch (e) {
    console.warn('[Supabase Portfolio] Exception saving:', e);
    return { ...portfolioData, userId, updatedAt: new Date().toISOString() };
  }
}
