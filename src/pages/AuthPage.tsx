import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const { t, lang, setLang, isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      {/* Language Toggle */}
      <div className="flex justify-end p-4">
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all border border-white/20"
        >
          {t('switchLang')}
        </button>
      </div>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-400 opacity-10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-300 opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🧬</div>
          <h1 className="text-3xl font-black text-white mb-2">{t('deptName')}</h1>
          <p className="text-green-300">{t('uniName')}</p>
        </div>

        {/* Cards */}
        <div className="w-full max-w-md space-y-4">
          {/* Sign Up Card */}
          <button
            onClick={() => navigate('/signup')}
            className="w-full bg-white text-green-900 rounded-2xl p-6 text-start shadow-card-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:bg-green-200 transition-colors">
                📝
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">{t('createAccount')}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{t('createAccountDesc')}</p>
              </div>
              <span className={`text-green-700 text-xl ${isRTL ? 'rotate-180' : ''}`}>→</span>
            </div>
          </button>

          {/* Sign In Card */}
          <button
            onClick={() => navigate('/signin')}
            className="w-full bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 rounded-2xl p-6 text-start hover:bg-white/20 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:bg-white/30 transition-colors">
                🔑
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">{t('loginAccount')}</h2>
                <p className="text-sm text-green-300 leading-relaxed">{t('loginAccountDesc')}</p>
              </div>
              <span className={`text-green-300 text-xl ${isRTL ? 'rotate-180' : ''}`}>→</span>
            </div>
          </button>
        </div>

        {/* Copyright */}
        <p className="mt-12 text-green-400/60 text-xs text-center">{t('copyright')}</p>
      </div>
    </div>
  );
}
