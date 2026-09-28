import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './features/dashboard/DashboardView';
import { StudyPlannerView } from './features/study/StudyPlannerView';
import { GoalsView } from './features/goals/GoalsView';
import { NotesView } from './features/notes/NotesView';
import { QuizzesView } from './features/quizzes/QuizzesView';
import { SkillsView } from './features/skills/SkillsView';
import { CertificatesView } from './features/certificates/CertificatesView';
import { ProjectsView } from './features/projects/ProjectsView';
import { AchievementsView } from './features/achievements/AchievementsView';
import { CareerView } from './features/career/CareerView';
import { MockInterviewView } from './features/interview/MockInterviewView';
import { CVBuilderView } from './features/cv/CVBuilderView';
import { PortfolioView } from './features/portfolio/PortfolioView';
import { PrivacyCenterView } from './features/privacy/PrivacyCenterView';
import { ProfileView } from './features/profile/ProfileView';
import { AuthModal } from './features/auth/AuthModal';
import { BrandLogo } from './components/BrandLogo';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Initial Auth State Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <BrandLogo size="lg" showTagline={false} />
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
            <span>Loading buddy4students...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Show Welcome / Authentication screen (Section 7)
  // Never show dashboard, sidebar, or private student data before login
  if (!isAuthenticated) {
    return <AuthModal isStandalone={true} />;
  }

  // 3. Authenticated: Render application views for authenticated student
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
      case 'goals':
        return <GoalsView />;
      case 'study':
        return <StudyPlannerView />;
      case 'skills':
        return <SkillsView />;
      case 'projects':
        return <ProjectsView />;
      case 'certificates':
        return <CertificatesView />;
      case 'cv':
        return <CVBuilderView />;
      case 'portfolio':
        return <PortfolioView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
      case 'privacy':
        return <PrivacyCenterView />;
      case 'notes':
        return <NotesView />;
      case 'quizzes':
        return <QuizzesView />;
      case 'achievements':
        return <AchievementsView />;
      case 'career':
        return <CareerView />;
      case 'interview':
        return <MockInterviewView />;
      default:
        return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 antialiased font-sans selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-200 transition-colors duration-150">
      {/* Top Navbar: Sticky at top */}
      <Navbar
        onNavigate={setActiveTab}
        activeTab={activeTab}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex min-h-[calc(100vh-4rem)] relative">
        {/* Fixed Desktop Sidebar & Mobile Overlay Drawer */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Scrollable Main Content Container */}
        <div className="flex-1 w-full lg:pl-64 overflow-x-hidden">
          <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-w-0">
            {renderActiveView()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
