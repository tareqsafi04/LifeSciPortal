import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type Step = 'form' | 'verify';

export default function SignUpPage() {
  const { signUp } = useAuth();
  const { lang, setLang } = useLanguage();

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [loading, setLoading]       = useState(false);

  const t = {
    ar: {
      title: 'إنشاء حساب جديد',
      subtitle: 'قسم العلوم الحياتية',
      email: 'البريد الإلكتروني',
      emailPh: 'example@mail.com',
      password: 'كلمة المرور',
      confirmPw: 'تأكيد كلمة المرور',
      minPw: 'على الأقل 8 أحرف',
      register: 'إنشاء الحساب',
      haveAccount: 'لديك حساب؟',
      signIn: 'سجّل دخولك',
      switchLang: 'English',
      loading: 'جاري الإنشاء...',
      verifyTitle: 'تحقق من بريدك الإلكتروني',
      verifyMsg: 'تم إرسال رابط التحقق إلى',
      verifyNote: 'يرجى فتح رسالة التحقق والنقر على الرابط المرفق للتحقق من حسابك قبل تسجيل الدخول.',
      backSignIn: 'الذهاب إلى تسجيل الدخول',
      copyright: '© 2026 قسم العلوم الحياتية – جامعة الحسين بن طلال | عمّار النوافلة',
    },
    en: {
      title: 'Create an Account',
      subtitle: 'Life Sciences Department',
      email: 'Email address',
      emailPh: 'example@mail.com',
      password: 'Password',
      confirmPw: 'Confirm password',
      minPw: 'At least 8 characters',
      register: 'Create Account',
      haveAccount: 'Already have an account?',
      signIn: 'Sign in',
      switchLang: 'عربي',
      loading: 'Creating account...',
      verifyTitle: 'Verify your email',
      verifyMsg: 'A verification link has been sent to',
      verifyNote: 'Please open the email and click the link to verify your account before signing in.',
      backSignIn: 'Go to Sign in',
      copyright: '© 2026 Life Sciences Dept – Al-Hussein Bin Talal University | Ammar Al-Nawafla',
    },
  }[lang] ?? {
    title: 'إنشاء حساب جديد', subtitle: 'قسم العلوم الحياتية', email: 'البريد الإلكتروني',
    emailPh: 'example@mail.com', password: 'كلمة المرور', confirmPw: 'تأكيد كلمة المرور',
    minPw: 'على الأقل 8 أحرف', register: 'إنشاء الحساب', haveAccount: 'لديك حساب؟',
    signIn: 'سجّل دخولك', switchLang: 'English', loading: 'جاري الإنشاء...',
    verifyTitle: 'تحقق من بريدك الإلكتروني', verifyMsg: 'تم إرسال رابط التحقق إلى',
    verifyNote: 'يرجى فتح رسالة التحقق والنقر على الرابط للتحقق من حسابك.',
    backSignIn: 'الذهاب إلى تسجيل الدخول',
    copyright: '© 2026 قسم العلوم الحياتية – جامعة الحسين بن طلال | عمّار النوافلة',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error(lang === 'ar' ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Enter a valid email address');
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
      await signUp(email.trim(), password);
      setStep('verify');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('User already')) {
        toast.error(lang === 'ar' ? 'هذا البريد الإلكتروني مسجّل مسبقاً' : 'This email is already registered');
      } else {
        toast.error(msg);
      }
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
            <div className="text-5xl mb-3">🧬</div>
            <h1 className="text-2xl font-black text-white mb-1">{t.title}</h1>
            <p className="text-green-300 text-sm">{t.subtitle}</p>
          </div>

          {step === 'form' ? (
            <div className="bg-white rounded-3xl p-8 shadow-card-md">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.email}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t.emailPh}
                    className="input-field"
                    required
                    dir="ltr"
                    autoComplete="email"
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
                  ) : t.register}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                {t.haveAccount}{' '}
                <Link to="/signin" className="text-green-700 font-semibold hover:underline">{t.signIn}</Link>
              </p>
            </div>
          ) : (
            /* Verification sent screen */
            <div className="bg-white rounded-3xl p-8 shadow-card-md text-center">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-xl font-black text-gray-800 mb-2">{t.verifyTitle}</h2>
              <p className="text-gray-500 text-sm mb-1">{t.verifyMsg}</p>
              <p className="text-green-700 font-semibold mb-4 break-all">{email}</p>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">{t.verifyNote}</p>
              <Link
                to="/signin"
                className="btn-primary inline-block px-6 py-3 text-sm"
              >
                {t.backSignIn}
              </Link>
            </div>
          )}

          <p className="text-center text-green-400/60 text-xs mt-6">{t.copyright}</p>
        </div>
      </div>
    </div>
  );
}
