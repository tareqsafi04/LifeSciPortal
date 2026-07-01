import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SplashPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => navigate('/auth'), 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="min-h-screen bg-hero-gradient flex flex-col items-center justify-between cursor-pointer relative overflow-hidden"
      onClick={() => navigate('/auth')}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-400 opacity-10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-green-300 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-emerald-500 opacity-5 rounded-full blur-2xl" />
        {/* DNA Helix decoration */}
        <div className="absolute top-16 left-8 text-8xl opacity-10 select-none">🧬</div>
        <div className="absolute bottom-32 right-8 text-7xl opacity-10 select-none rotate-12">🌿</div>
        <div className="absolute top-1/2 right-12 text-6xl opacity-10 select-none">🔬</div>
        <div className="absolute top-24 right-1/3 text-5xl opacity-10 select-none">🦠</div>
        <div className="absolute bottom-48 left-1/4 text-5xl opacity-10 select-none">🌱</div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 z-10">
        {/* University badge */}
        <div
          className={`mb-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          style={{ transitionDelay: '0.1s' }}
        >
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2.5">
            <span className="text-white/80 text-sm font-medium">جامعة آل الحسين بن طلال</span>
            <span className="text-white/50">•</span>
            <span className="text-white/80 text-sm">Al-Hussein Bin Talal University</span>
          </div>
        </div>

        {/* DNA Icon */}
        <div
          className={`text-8xl mb-6 transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
          style={{ transitionDelay: '0.3s' }}
        >
          🧬
        </div>

        {/* Welcome text */}
        <div
          className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '0.5s' }}
        >
          <h1 className="text-5xl md:text-6xl font-black text-white mb-3 leading-tight">
            {t('splashWelcome')}
          </h1>
          <p className="text-xl text-green-200 font-medium mb-2">{t('splashIn')}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {t('deptName')}
          </h2>
          <p className="text-green-300 text-lg">{t('faculty')}</p>
        </div>

        {/* Decorative line */}
        <div
          className={`mt-10 flex items-center gap-3 transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '0.8s' }}
        >
          <div className="h-px w-16 bg-green-400/50" />
          <span className="text-green-300 text-sm">Life Sciences Portal</span>
          <div className="h-px w-16 bg-green-400/50" />
        </div>

        {/* Stats */}
        <div
          className={`mt-10 grid grid-cols-3 gap-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '1s' }}
        >
          {[
            { num: '132', label: 'ساعة معتمدة', labelEn: 'Credit Hours' },
            { num: '4',   label: 'سنوات دراسية', labelEn: 'Study Years' },
            { num: '80+', label: 'مادة دراسية',  labelEn: 'Courses' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-black text-white">{stat.num}</div>
              <div className="text-green-300 text-xs mt-0.5">{stat.label}</div>
              <div className="text-green-400/60 text-xs">{stat.labelEn}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="z-10 w-full pb-10 px-6 flex flex-col items-center gap-4">
        {/* Click hint */}
        <div
          className={`flex items-center gap-2 text-green-300/80 text-sm transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '1.2s' }}
        >
          <span className="animate-pulse-dot">●</span>
          <span>{t('clickToContinue')}</span>
          <span className="animate-pulse-dot" style={{ animationDelay: '0.5s' }}>●</span>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all duration-[4000ms] ease-linear"
            style={{ width: visible ? '100%' : '0%' }}
          />
        </div>

        {/* Copyright */}
        <p className="text-green-400/60 text-xs text-center">
          {t('copyright')}
        </p>
      </div>
    </div>
  );
}
