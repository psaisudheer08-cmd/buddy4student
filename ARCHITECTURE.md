# EDUPILOT AI — ARCHITECTURE & SECURITY SPECIFICATION

> **Tagline**: Your private AI companion for learning, progress, and growth.  
> **Philosophy**: A private AI-powered student learning operating system. Privacy-first, zero-hallucination, evidence-backed student profile.

---

## 1. PROJECT ARCHITECTURE

- **Frontend**: React 19 SPA, TypeScript, Tailwind CSS v4, Lucide icons, accessible interactive components, zero-pill discipline, ergonomic typography, responsive desktop/tablet/mobile layouts.
- **Backend / API Gateway**: Node.js + Express with TypeScript (`server.ts`). Serves REST API routes for authentication, user data, file storage, and server-side AI proxy using Google GenAI SDK.
- **Database Engine**:
  - Direct local JSON-relational transactional persistence engine with full Row-Level-Security (RLS) enforcement per `user_id`.
  - Accompanying production PostgreSQL/Supabase schema with DDL, foreign keys, indexes, and full RLS policies (`supabase/schema.sql`).
- **Authentication**: Session-token authentication with hashed passwords, account verification, password reset tokens, and deterministic user ownership. Client sends Bearer session tokens; server extracts the authenticated `user_id` from the secure session (never trusting client-supplied IDs).
- **Storage**: User-isolated storage system with strict mime-type check, file-size limit (10MB), and path sandboxing preventing directory traversal.
- **AI Gateway**: Pluggable server-side Gemini integration (`gemini-3.8-flash`) via `@google/genai`. All keys stay server-side. Enforces minimum context transmission and strict anti-hallucination instructions.

---

## 2. FOLDER STRUCTURE

```
/
├── ARCHITECTURE.md                  # System design, data flow, RLS, and security
├── server.ts                        # Full-stack server (Express + Vite middlewares in dev)
├── server/
│   ├── auth.ts                      # Password hashing, session generation, token verification
│   ├── db.ts                        # Relational store with strict RLS enforcement
│   ├── ai.ts                        # Gemini 3.8 Flash AI gateway with prompt-defense & context filtering
│   ├── storage.ts                   # Sandboxed private file storage
│   └── routes/                      # Modular API route handlers
│       ├── auth.ts                  # /api/auth (signup, login, logout, me, reset, delete)
│       ├── ai.ts                    # /api/ai (chat, modes, summarize, analyze, polish)
│       ├── data.ts                  # /api/data (CRUD for all student learning entities)
│       └── storage.ts               # /api/storage (upload, download, view private docs)
├── supabase/
│   └── schema.sql                   # Complete PostgreSQL schema + RLS policies
├── src/
│   ├── index.css                    # Tailwind v4 entry point & design tokens
│   ├── main.tsx                     # React root bootstrap
│   ├── App.tsx                      # Main app orchestrator with layout & routing
│   ├── types/
│   │   └── index.ts                 # Strong TypeScript contracts for all entities
│   ├── context/
│   │   ├── AuthContext.tsx          # Current authenticated student state & switcher
│   │   └── AppContext.tsx           # Global state, active tab, notification toasts
│   ├── services/
│   │   ├── api.ts                   # Type-safe client HTTP SDK with session headers
│   │   └── mockData.ts              # Initial starter dataset for new student onboarding
│   ├── components/
│   │   ├── BrandLogo.tsx            # EduPilot AI mascot & logo component
│   │   ├── Navbar.tsx               # Header with quick AI launcher & user status
│   │   ├── Sidebar.tsx              # Adaptive navigation bar with grouped categories
│   │   ├── SecurityBanner.tsx       # Live indicator of RLS isolation & privacy mode
│   │   ├── Modal.tsx                # Accessible modal container
│   │   └── ErrorBoundary.tsx        # React error boundary
│   └── features/
│       ├── dashboard/               # Dashboard: Focus, Progress, Quick AI, Activity
│       ├── assistant/               # Personal AI Assistant: 9 modes, history, memory
│       ├── study/                   # Study Planner: Adaptive schedules, exams, tasks
│       ├── goals/                   # Goal tracking & AI-driven task breakdown
│       ├── notes/                   # Notes & document viewer with AI study actions
│       ├── quizzes/                 # Interactive quiz engine (MCQ, T/F, short, flashcards)
│       ├── typing/                  # Typing Coach: WPM calculator, tests, accuracy analytics
│       ├── skills/                  # Skills profile & Evidence Graph
│       ├── certificates/            # Certificate vault with verification statuses
│       ├── projects/                # Student projects repository & description polisher
│       ├── achievements/            # Awards, hackathons, publications timeline
│       ├── resume/                  # Resume Builder with templates & PDF export
│       ├── cv/                      # Academic & professional CV builder
│       ├── career/                  # Career Roadmap & Job Description Analyzer
│       ├── interview/               # Interactive Mock Interview simulator
│       └── privacy/                 # Privacy Center: Data export, memory audit, account purge
```

---

## 3. DATABASE SCHEMA

All tables include:
- `id` (UUID primary key)
- `user_id` (UUID foreign key referencing `auth.users`, mandatory)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Entities:
1. `profiles`: Full name, preferred name, university, degree, major, academic year, semester, graduation year, target career, skills, preferred study hours, bio.
2. `student_preferences`: Notification settings, default AI mode, theme, study reminders.
3. `goals`: Title, category, deadline, priority, progress percentage, status (active, completed, paused).
4. `goal_tasks`: Goal ID, task text, is_completed, due_date, order_index.
5. `study_plans`: Subject, topic, exam_date, total_days, daily_minutes, priority, current_level, status.
6. `study_tasks`: Plan ID, day_number, scheduled_date, topic_title, duration_minutes, is_completed.
7. `study_sessions`: Subject, duration_minutes, notes, session_date.
8. `notes`: Title, content (markdown), subject, tags, summary, key_points, is_pinned.
9. `documents`: File name, storage_path, file_size, mime_type, extracted_text, summary.
10. `conversations`: Title, ai_mode, summary, is_pinned, last_message_at.
11. `messages`: Conversation ID, role ('user' | 'assistant'), content, timestamp.
12. `ai_memory`: Category ('goal' | 'preference' | 'learning_style' | 'subject'), key, value, is_active.
13. `typing_sessions`: Lesson type, test_mode, duration_seconds, total_chars, error_count, wpm, accuracy, date.
14. `typing_goals`: Target WPM, target accuracy, deadline, current_best.
15. `quizzes`: Title, topic, difficulty, question_count, questions (JSON).
16. `quiz_attempts`: Quiz ID, score, total_questions, answers (JSON), completed_at.
17. `skills`: Skill name, category, self_assessed_level ('beginner' | 'intermediate' | 'advanced' | 'expert'), notes.
18. `skill_evidence`: Skill ID, evidence_type ('course' | 'certificate' | 'project' | 'achievement' | 'quiz'), reference_id.
19. `certificates`: Certificate name, issuer, issue_date, expiry_date, credential_id, credential_url, storage_path, verification_status ('Uploaded' | 'Extracted' | 'Student Confirmed' | 'Unverified' | 'Issuer Verified').
20. `projects`: Title, description, tech_stack (JSON array), github_url, live_url, role, start_date, end_date.
21. `achievements`: Title, category ('Hackathon' | 'Award' | 'Competition' | 'Internship' | 'Research' | 'Publication' | 'Volunteering'), date, organization, description.
22. `resumes`: Title, template ('modern' | 'minimal' | 'academic' | 'executive'), selected_sections (JSON), custom_summary, contact_info.
23. `cvs`: Title, template, academic_focus, sections (JSON).
24. `career_goals`: Target role, target industries, target timeline, required_skills (JSON), target_skills (JSON).
25. `interview_sessions`: Role, interview_type ('technical' | 'behavioral' | 'hr'), transcript (JSON), feedback (JSON), overall_score.

---

## 4. AUTHENTICATION ARCHITECTURE

- Authenticated sessions pass a Bearer token or session header.
- The server validates the token and attaches the authenticated user record to the request context: `req.user = { id: string, email: string, ... }`.
- **Absolute Rule**: Client-provided `user_id` inside request bodies is completely ignored or validated strictly against `req.user.id`.
- Test student isolation feature: Built-in quick switch between "Student A (Alex Rivera)" and "Student B (Jordan Lee)" allowing the user to immediately verify that Student A cannot view or tamper with Student B's data.

---

## 5. ROW LEVEL SECURITY (RLS) & SECURITY DESIGN

- In PostgreSQL:
  ```sql
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can only read own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can only update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can only insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can only delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = user_id);
  ```
- In our API Engine:
  - Every storage query automatically appends `AND user_id = req.user.id`.
  - Mutation endpoints check entity ownership before executing changes. Unauthorized attempts return HTTP 403 / 404.

---

## 6. STORAGE ARCHITECTURE

- Sandboxed per user: `storage/{user_id}/{category}/{filename}`.
- Path traversal protection: Filenames are sanitized, preventing `../` or hidden prefixes.
- Max file size: 10MB.
- Allowed mime types: `application/pdf`, `image/png`, `image/jpeg`, `text/plain`, `text/markdown`.
- Private download tokens / authenticated endpoints: Files are never served publicly without user session validation.

---

## 7. AI ARCHITECTURE & PROMPT INJECTION DEFENSE

- Pluggable provider: `@google/genai` on server side.
- Model: `gemini-3.8-flash`.
- Data minimization:
  - Typing assistant: receives only WPM history and error patterns.
  - Resume generator: receives only user-approved skills, projects, and education.
  - Doubt/Tutor assistant: receives only the conversation messages and current topic.
- Hallucination Control:
  - System prompt explicitly prohibits inventing certificates, grades, company names, or accomplishments.
  - User documents are demarcated within `<untrusted_student_input>` tags to prevent prompt injection from overriding system safety rules.

---

## 8. DATA-FLOW ARCHITECTURE

```
STUDENT ACTION
    │
    ▼
[AUTHENTICATED CLIENT]
    │  (Bearer Session Token)
    ▼
[EXPRESS API SERVER]
    │  1. Authenticate Token -> extract req.user.id
    │  2. Enforce Row-Level Security (user_id match)
    │  3. Sanitize inputs
    ▼
[PRIVATE STORAGE & DB ENGINE]
    │  Executes private CRUD
    │
    ├─► [AI GATEWAY] (if AI requested)
    │       │  Inject minimal context
    │       │  Inject Anti-Hallucination Guard
    │       ▼
    │   [GEMINI API (gemini-3.8-flash)]
    │       │  Returns structured or streaming advice
    │       ▼
    └─► [RESPONSE RETURNED TO STUDENT]
```

---

## 9. PRIVACY ARCHITECTURE

- Zero public disclosure: No public endpoints or shared student galleries.
- Explicit AI Memory: Every saved AI memory item is visible, editable, toggleable, and deletable by the student in the Privacy Center.
- Complete Data Export ("Download My Data"): Compiles all records across all 25 tables into a single formatted ZIP or structured JSON bundle.
- Account Deletion ("Right to be Forgotten"): Single-click complete cascade purging of all rows, files, memories, and conversations belonging to that student.

---

## 10. IMPLEMENTATION PLAN

- **Phase 1**: Architecture + project setup + authentication + database engine + security rules.
- **Phase 2**: Personal AI assistant with 9 modes, streaming/markdown, chat history, and controlled AI memory.
- **Phase 3**: Learning systems: Adaptive study planner, goal tracker with AI task breakdown, private notes, document learning, and interactive quiz system.
- **Phase 4**: Typing coach with real WPM calculation formula (`total typed chars / 5 / minutes`), live stats, lesson library, speed tests, and analytics.
- **Phase 5**: Portfolio & evidence systems: Skills matrix, evidence graph, certificate vault with status workflows, projects gallery, achievements timeline.
- **Phase 6**: Career & job preparation: Resume builder with templates & PDF export, CV builder, career roadmap, job description analyzer, mock interview simulator.
- **Phase 7**: Privacy center, data export, account deletion, responsive testing, accessibility, UI polish, and cross-user security isolation testing.
