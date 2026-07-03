import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FunctionsHttpError } from '@supabase/supabase-js';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { lang, setLang } = useLanguage();

  const [universityId, setUniversityId] = useState('');
  const [fullName, setFullName]         = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPw, setConfirmPw]       = useState('');
  const [loading, setLoading]           = useState(false);

  const t = lang === 'ar' ? {
    title: 'إنشاء حساب جديد',
    subtitle: 'قسم العلوم الحياتية',
    uniId: 'الرقم الجامعي',
    uniIdPh: 'مثال: 20210001',
    fullName: 'الاسم الكامل',
    fullNamePh: 'الاسم الرباعي',
    password: 'كلمة المرور',
    confirmPw: 'تأكيد كلمة المرور',
    minPw: 'على الأقل 8 أحرف',
    register: 'إنشاء الحساب',
    haveAccount: 'لديك حساب؟',
    signIn: 'سجّل دخولك',
    switchLang: 'English',
    loading: 'جاري الإنشاء...',
    copyright: '© 2026 قسم العلوم الحياتية – جامعة الحسين بن طلال | عمّار النوافلة',
  } : {
    title: 'Create an Account',
    subtitle: 'Life Sciences Department',
    uniId: 'University ID',
    uniIdPh: 'e.g. 20210001',
    fullName: 'Full Name',
    fullNamePh: 'Your full name',
    password: 'Password',
    confirmPw: 'Confirm password',
    minPw: 'At least 8 characters',
    register: 'Create Account',
    haveAccount: 'Already have an account?',
    signIn: 'Sign in',
    switchLang: 'عربي',
    loading: 'Creating account...',
    copyright: '© 2026 Life Sciences Dept – Al-Hussein Bin Talal University | Ammar Al-Nawafla',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!universityId.trim()) {
      toast.error(lang === 'ar' ? 'أدخل الرقم الجامعي' : 'Enter your university ID');
      return;
    }
    if (!fullName.trim()) {
      toast.error(lang === 'ar' ? 'أدخل الاسم الكامل' : 'Enter your full name');
      return;
    }
    if (password.length < 8) {
      toast.error(lang === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPw) {
      toast.error(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-student', {
        body: { universityId: universityId.trim(), fullName: fullName.trim(), password },
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const textContent = await error.context?.text();
            const parsed = textContent ? JSON.parse(textContent) : null;
            errorMessage = parsed?.error ?? textContent ?? error.message;
          } catch {
            errorMessage = error.message;
          }
        }
        toast.error(errorMessage);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // If session returned, set it
      if (data?.session) {
        await supabase.auth.setSession(data.session);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('university_id, full_name, is_admin')
            .eq('id', user.id)
            .single();
          login({
            id: user.id,
            email: user.email ?? '',
            universityId: profile?.university_id ?? universityId.trim(),
            fullName: profile?.full_name ?? fullName.trim(),
            isAdmin: profile?.is_admin ?? false,
          });
          toast.success(lang === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
          navigate('/dashboard');
          return;
        }
      }

      // Needs confirmation
      toast.success(lang === 'ar' ? 'تم إنشاء الحساب! يمكنك تسجيل الدخول الآن.' : 'Account created! You can now sign in.');
      navigate('/signin');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
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
            <div className="text-5xl mb-3">🧬</div>
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
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.fullName}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t.fullNamePh}
                  className="input-field"
                  required
                  autoComplete="name"
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
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-400 mt-1">{t.minPw}</p>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.confirmPw}</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                  dir="ltr"
                  autoComplete="new-password"
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
                ) : t.register}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {t.haveAccount}{' '}
              <Link to="/signin" className="text-green-700 font-semibold hover:underline">{t.signIn}</Link>
            </p>
          </div>

          <p className="text-center text-green-400/60 text-xs mt-6">{t.copyright}</p>
        </div>
      </div>
    </div>
  );
}
