import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { t, lang, setLang } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) { toast.error(t('errorName')); return; }
    if (!universityId.trim()) { toast.error(t('errorUnivId')); return; }
    if (password.length < 6) { toast.error(t('errorPassword')); return; }
    if (password !== confirmPassword) { toast.error(t('errorPasswordMatch')); return; }

    setLoading(true);
    try {
      await signUp(universityId.trim(), fullName.trim(), password);
      toast.success(`${t('successRegister')} ${fullName}!`);
      navigate('/dashboard');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t('errorGeneral');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">📝</div>
            <h1 className="text-2xl font-black text-white mb-1">{t('createAccount')}</h1>
            <p className="text-green-300 text-sm">{t('deptName')}</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-8 shadow-card-md">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={lang === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  className="input-field"
                  required
                />
              </div>

              {/* University ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('universityId')} *
                </label>
                <input
                  type="text"
                  value={universityId}
                  onChange={e => setUniversityId(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: 2020123456' : 'e.g. 2020123456'}
                  className="input-field"
                  required
                  dir="ltr"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('password')} *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                  dir="ltr"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {lang === 'ar' ? 'على الأقل 6 أحرف' : 'At least 6 characters'}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('confirmPassword')} *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                  dir="ltr"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    {t('loading')}
                  </span>
                ) : t('register')}
              </button>
            </form>

            {/* Link to sign in */}
            <p className="text-center text-sm text-gray-500 mt-6">
              {t('haveAccount')}{' '}
              <Link to="/signin" className="text-green-700 font-semibold hover:underline">
                {t('loginHere')}
              </Link>
            </p>
          </div>

          {/* Copyright */}
          <p className="text-center text-green-400/60 text-xs mt-6">{t('copyright')}</p>
        </div>
      </div>
    </div>
  );
}
