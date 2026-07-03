import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type Status = 'idle' | 'verifying' | 'ready' | 'success' | 'error';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { lang, setLang } = useLanguage();

  const [status, setStatus]     = useState<Status>('verifying');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const t = {
    ar: {
      title: 'إعادة تعيين كلمة المرور',
      subtitle: 'قسم العلوم الحياتية',
      newPw: 'كلمة المرور الجديدة',
      confirmPw: 'تأكيد كلمة المرور',
      minPw: 'على الأقل 8 أحرف',
      submit: 'تعيين كلمة المرور',
      loading: 'جاري الحفظ...',
      successTitle: 'تم تغيير كلمة المرور!',
      successMsg: 'يمكنك الآن تسجيل الدخول بكلمة مرورك الجديدة.',
      goSignIn: 'تسجيل الدخول',
      invalidLink: 'الرابط غير صالح أو منتهي الصلاحية.',
      switchLang: 'English',
      copyright: '© 2026 قسم العلوم الحياتية – جامعة الحسين بن طلال | عمّار النوافلة',
    },
    en: {
      title: 'Reset Password',
      subtitle: 'Life Sciences Department',
      newPw: 'New password',
      confirmPw: 'Confirm new password',
      minPw: 'At least 8 characters',
      submit: 'Set New Password',
      loading: 'Saving...',
      successTitle: 'Password changed!',
      successMsg: 'You can now sign in with your new password.',
      goSignIn: 'Sign In',
      invalidLink: 'Invalid or expired reset link.',
      switchLang: 'عربي',
      copyright: '© 2026 Life Sciences Dept – Al-Hussein Bin Talal University | Ammar Al-Nawafla',
    },
  }[lang] ?? {
    title: 'إعادة تعيين كلمة المرور', subtitle: 'قسم العلوم الحياتية',
    newPw: 'كلمة المرور الجديدة', confirmPw: 'تأكيد كلمة المرور',
    minPw: 'على الأقل 8 أحرف', submit: 'تعيين كلمة المرور',
    loading: 'جاري الحفظ...', successTitle: 'تم تغيير كلمة المرور!',
    successMsg: 'يمكنك الآن تسجيل الدخول بكلمة مرورك الجديدة.',
    goSignIn: 'تسجيل الدخول', invalidLink: 'الرابط غير صالح أو منتهي الصلاحية.',
    switchLang: 'English',
    copyright: '© 2026 قسم العلوم الحياتية – جامعة الحسين بن طلال | عمّار النوافلة',
  };

  useEffect(() => {
    // Supabase embeds the recovery token in the URL hash
    // onAuthStateChange fires PASSWORD_RECOVERY when the token is valid
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready');
      }
    });

    // Also check URL params for error
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const errCode = params.get('error_code') ?? params.get('error');
    if (errCode) {
      setStatus('error');
      setErrorMsg(t.invalidLink);
    }

    // Fallback: if no hash params at all, treat as invalid
    const timeout = setTimeout(() => {
      setStatus(prev => prev === 'verifying' ? 'error' : prev);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      await updatePassword(password);
      setStatus('success');
      toast.success(lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح!' : 'Password updated successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      {/* Lang toggle */}
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">
              {status === 'success' ? '✅' : status === 'error' ? '❌' : '🔐'}
            </div>
            <h1 className="text-2xl font-black text-white mb-1">{t.title}</h1>
            <p className="text-green-300 text-sm">{t.subtitle}</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-card-md">
            {status === 'verifying' && (
              <div className="flex items-center justify-center py-10 text-gray-400 gap-3">
                <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span>{lang === 'ar' ? 'جاري التحقق من الرابط...' : 'Verifying link...'}</span>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">⚠️</div>
                <p className="text-red-500 font-semibold mb-4">{errorMsg || t.invalidLink}</p>
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  {lang === 'ar' ? 'طلب رابط جديد' : 'Request a new link'}
                </button>
              </div>
            )}

            {status === 'ready' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.newPw}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field"
                    required
                    dir="ltr"
                    autoFocus
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t.minPw}</p>
                </div>

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

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-base"
                >
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
            )}

            {status === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-black text-gray-800 mb-2">{t.successTitle}</h2>
                <p className="text-gray-500 text-sm mb-6">{t.successMsg}</p>
                <button
                  onClick={() => navigate('/signin')}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  {t.goSignIn}
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-green-400/60 text-xs mt-6">{t.copyright}</p>
        </div>
      </div>
    </div>
  );
}
