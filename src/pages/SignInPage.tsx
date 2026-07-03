import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SignInPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { lang, setLang } = useLanguage();

  const [universityId, setUniversityId] = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);

  const t = lang === 'ar' ? {
    title: 'تسجيل الدخول',
    subtitle: 'قسم العلوم الحياتية',
    uniId: 'الرقم الجامعي',
    uniIdPh: 'مثال: 20210001',
    password: 'كلمة المرور',
    submit: 'دخول',
    loading: 'جاري الدخول...',
    noAccount: 'ليس لديك حساب؟',
    register: 'سجّل الآن',
    switchLang: 'English',
    copyright: '© 2026 قسم العلوم الحياتية – جامعة الحسين بن طلال | عمّار النوافلة',
  } : {
    title: 'Sign In',
    subtitle: 'Life Sciences Department',
    uniId: 'University ID',
    uniIdPh: 'e.g. 20210001',
    password: 'Password',
    submit: 'Sign In',
    loading: 'Signing in...',
    noAccount: "Don't have an account?",
    register: 'Register now',
    switchLang: 'عربي',
    copyright: '© 2026 Life Sciences Dept – Al-Hussein Bin Talal University | Ammar Al-Nawafla',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!universityId.trim()) {
      toast.error(lang === 'ar' ? 'أدخل الرقم الجامعي' : 'Enter your university ID');
      return;
    }
    if (!password) {
      toast.error(lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password');
      return;
    }

    setLoading(true);
    try {
      await signIn(universityId.trim(), password);
      toast.success(lang === 'ar' ? 'مرحباً بك!' : 'Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('Invalid login') ||
        msg.includes('invalid_credentials') ||
        msg.includes('Invalid credentials')
      ) {
        toast.error(lang === 'ar' ? 'الرقم الجامعي أو كلمة المرور غير صحيحة' : 'Invalid university ID or password');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      <div className="flex justify-end p-4">
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all border border-white/20"
        >
          {t.switchLang}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔑</div>
            <h1 className="text-2xl font-black text-white mb-1">{t.title}</h1>
            <p className="text-green-300 text-sm">{t.subtitle}</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-card-md">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* University ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.uniId}</label>
                <input
                  type="text"
                  value={universityId}
                  onChange={e => setUniversityId(e.target.value)}
                  placeholder={t.uniIdPh}
                  className="input-field"
                  required
                  dir="ltr"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.password}</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                  dir="ltr"
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full text-base">
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    {t.loading}
                  </span>
                ) : t.submit}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {t.noAccount}{' '}
              <Link to="/signup" className="text-green-700 font-semibold hover:underline">{t.register}</Link>
            </p>
          </div>

          <p className="text-center text-green-400/60 text-xs mt-6">{t.copyright}</p>
        </div>
      </div>
    </div>
  );
}
