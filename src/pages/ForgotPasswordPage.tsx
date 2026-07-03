import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type Step = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const { lang, setLang } = useLanguage();

  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep]     = useState<Step>('form');

  const t = {
    ar: {
      title: 'استعادة كلمة المرور',
      subtitle: 'قسم العلوم الحياتية',
      desc: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.',
      email: 'البريد الإلكتروني',
      emailPh: 'example@mail.com',
      submit: 'إرسال رابط الاستعادة',
      loading: 'جاري الإرسال...',
      backSignIn: 'العودة إلى تسجيل الدخول',
      sentTitle: 'تم إرسال رابط الاستعادة!',
      sentMsg: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى',
      sentNote: 'تحقق من صندوق الوارد (وأيضاً مجلد السبام). الرابط صالح لمدة ساعة.',
      switchLang: 'English',
      copyright: '© 2026 قسم العلوم الحياتية – جامعة الحسين بن طلال | عمّار النوافلة',
    },
    en: {
      title: 'Forgot Password',
      subtitle: 'Life Sciences Department',
      desc: 'Enter your email address and we will send you a password reset link.',
      email: 'Email address',
      emailPh: 'example@mail.com',
      submit: 'Send Reset Link',
      loading: 'Sending...',
      backSignIn: 'Back to Sign In',
      sentTitle: 'Reset link sent!',
      sentMsg: 'A password reset link was sent to',
      sentNote: 'Check your inbox (and spam folder). The link is valid for 1 hour.',
      switchLang: 'عربي',
      copyright: '© 2026 Life Sciences Dept – Al-Hussein Bin Talal University | Ammar Al-Nawafla',
    },
  }[lang] ?? {
    title: 'استعادة كلمة المرور', subtitle: 'قسم العلوم الحياتية',
    desc: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.',
    email: 'البريد الإلكتروني', emailPh: 'example@mail.com',
    submit: 'إرسال رابط الاستعادة', loading: 'جاري الإرسال...',
    backSignIn: 'العودة إلى تسجيل الدخول',
    sentTitle: 'تم إرسال رابط الاستعادة!',
    sentMsg: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى',
    sentNote: 'تحقق من صندوق الوارد (وأيضاً مجلد السبام).',
    switchLang: 'English',
    copyright: '© 2026 قسم العلوم الحياتية – جامعة الحسين بن طلال | عمّار النوافلة',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error(lang === 'ar' ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setStep('sent');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Don't expose whether email exists for security
      toast.error(lang === 'ar'
        ? 'حدث خطأ أثناء الإرسال. حاول مرة أخرى.'
        : `Error: ${msg}`);
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
            <div className="text-5xl mb-3">{step === 'form' ? '🔒' : '📬'}</div>
            <h1 className="text-2xl font-black text-white mb-1">{t.title}</h1>
            <p className="text-green-300 text-sm">{t.subtitle}</p>
          </div>

          {step === 'form' ? (
            <div className="bg-white rounded-3xl p-8 shadow-card-md">
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">{t.desc}</p>

              <form onSubmit={handleSubmit} className="space-y-5">
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

              <div className="text-center mt-6">
                <Link to="/signin" className="text-sm text-green-600 hover:underline font-medium">
                  ← {t.backSignIn}
                </Link>
              </div>
            </div>
          ) : (
            /* Sent confirmation */
            <div className="bg-white rounded-3xl p-8 shadow-card-md text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-2">{t.sentTitle}</h2>
              <p className="text-gray-500 text-sm mb-1">{t.sentMsg}</p>
              <p className="text-green-700 font-semibold mb-4 break-all">{email}</p>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">{t.sentNote}</p>
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
