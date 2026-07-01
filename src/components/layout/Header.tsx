import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Header() {
  const { user, signOut } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    if (confirm(t('logoutConfirm'))) {
      await signOut();
    }
  };

  return (
    <header className="bg-hero-gradient shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧬</span>
          <div className="leading-tight">
            <h1 className="text-white font-bold text-base md:text-lg leading-tight">
              {t('deptName')}
            </h1>
            <p className="text-green-300 text-xs hidden sm:block">{t('uniName')}</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-3 py-2 rounded-full transition-all border border-white/20 min-h-[40px]"
          >
            {t('switchLang')}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-full transition-all border border-white/20 min-h-[40px]"
            >
              <div className="w-7 h-7 bg-green-400 rounded-full flex items-center justify-center text-green-900 font-bold text-xs flex-shrink-0">
                {user?.fullName?.charAt(0) ?? '?'}
              </div>
              <span className="text-sm font-medium hidden md:block max-w-[120px] truncate">
                {user?.fullName}
              </span>
              <svg className={`w-3 h-3 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute end-0 top-12 bg-white rounded-xl shadow-card-md border border-gray-100 py-1 min-w-[180px] z-20">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-800 text-sm">{user?.fullName}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{t('universityId')}: {user?.universityId}</p>
                    {user?.isAdmin && (
                      <span className="badge bg-amber-100 text-amber-700 mt-1">👑 Admin</span>
                    )}
                  </div>
                  <button
                    onClick={() => { setShowMenu(false); handleSignOut(); }}
                    className="w-full text-start px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('logout')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
