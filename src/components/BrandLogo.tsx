import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  iconOnly = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  const titleSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold tracking-tight',
    lg: 'text-2xl font-extrabold tracking-tight',
    xl: 'text-3xl font-extrabold tracking-tight',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* buddy4students Mascot Robot Icon */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Golden Star */}
          <path
            d="M98 18L100.5 25L108 26.5L102 31.5L104 39L97.5 35L91 39L93 31.5L87 26.5L94.5 25L98 18Z"
            fill="#FBBF24"
          />
          <circle cx="98" cy="28" r="7" fill="#F59E0B" fillOpacity="0.3" />

          {/* Open Book Base */}
          <path
            d="M20 92C32 87 46 88 60 96C74 88 88 87 100 92L96 104C84 100 72 101 60 107C48 101 36 100 24 104L20 92Z"
            fill="url(#bookGrad)"
          />
          <path
            d="M23 93C34 89 47 90 60 97C73 90 86 89 97 93"
            stroke="#93C5FD"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Swirling Blue Energy Wings */}
          <path
            d="M32 78C30 65 38 52 50 48C42 55 40 68 45 76"
            fill="#38BDF8"
            fillOpacity="0.4"
          />
          <path
            d="M88 78C90 65 82 52 70 48C78 55 80 68 75 76"
            fill="#38BDF8"
            fillOpacity="0.4"
          />

          {/* Reaching Arm */}
          <path
            d="M74 58C82 52 89 44 94 36"
            stroke="#2563EB"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="94" cy="36" r="3.5" fill="#3B82F6" />

          {/* Left Resting Arm */}
          <path
            d="M44 65C38 68 35 74 38 80"
            stroke="#2563EB"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Robot Head Outer Body */}
          <rect
            x="40"
            y="42"
            width="40"
            height="34"
            rx="17"
            fill="#F8FAFC"
            stroke="#1D4ED8"
            strokeWidth="3.5"
          />

          {/* Robot Ear Headphones */}
          <rect x="34" y="50" width="6" height="18" rx="3" fill="#2563EB" />
          <rect x="80" y="50" width="6" height="18" rx="3" fill="#2563EB" />

          {/* Cheerful Smiling Eyes (Arcs) */}
          <path
            d="M47 57C49 53 53 53 55 57"
            stroke="#0284C7"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M65 57C67 53 71 53 73 57"
            stroke="#0284C7"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Rosy Cheeks */}
          <ellipse cx="48" cy="64" rx="2.5" ry="1.5" fill="#F43F5E" fillOpacity="0.3" />
          <ellipse cx="72" cy="64" rx="2.5" ry="1.5" fill="#F43F5E" fillOpacity="0.3" />

          {/* Friendly Robot Smile */}
          <path
            d="M56 64C58 67 62 67 64 64"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Graduation Mortarboard Cap */}
          <polygon
            points="60,20 90,30 60,40 30,30"
            fill="#0F172A"
            stroke="#1E293B"
            strokeWidth="2"
          />
          {/* Cap Skull Base */}
          <path
            d="M44 35C44 35 48 42 60 42C72 42 76 35 76 35"
            fill="#0F172A"
          />

          {/* Golden Tassel Button & String */}
          <circle cx="60" cy="30" r="2.5" fill="#F59E0B" />
          <path
            d="M60 30C52 32 46 38 45 44"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="45" cy="45" r="2" fill="#D97706" />

          {/* Gradients */}
          <defs>
            <linearGradient id="bookGrad" x1="20" y1="90" x2="100" y2="105" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284C7" />
              <stop offset="0.5" stopColor="#2563EB" />
              <stop offset="1" stopColor="#4F46E5" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <div className={`leading-none flex items-center gap-0.5 text-slate-900 dark:text-white ${titleSizes[size]}`}>
            <span>buddy</span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              4students
            </span>
          </div>
          {showTagline && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal tracking-normal mt-0.5 max-w-xs">
              Your private AI companion for learning, progress, and growth.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
