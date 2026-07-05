import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const { lang } = useLanguage();

  const [fullName, setFullName]       = useState(user?.fullName ?? '');
  const [savingName, setSavingName]   = useState(false);

  const [currentPw, setCurrentPw]     = useState('');
  const [newPw, setNewPw]             = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [savingPw, setSavingPw]       = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const t = {
    ar: {
      title: 'الملف الشخصي',
      subtitle: 'إدارة معلوماتك الشخصية',
      uniId: 'الرقم الجامعي',
      email: 'البريد الإلكتروني',
      fullName: 'الاسم الكامل',
      saveInfo: 'حفظ الاسم',
      saving: 'جاري الحفظ...',
      changePw: 'تغيير كلمة المرور',
      currentPw: 'كلمة المرور الحالية',
      newPw: 'كلمة المرور الجديدة',
      confirmPw: 'تأكيد كلمة المرور الجديدة',
      minPw: 'على الأقل 8 أحرف',
      updatePw: 'تحديث كلمة المرور',
      adminBadge: 'مشرف',
      studentBadge: 'طالب',
    },
    en: {
      title: 'Profile',
      subtitle: 'Manage your personal information',
      uniId: 'University ID',
      email: 'Email Address',
      fullName: 'Full Name',
      saveInfo: 'Save Name',
      saving: 'Saving...',
      changePw: 'Change Password',
      currentPw: 'Current Password',
      newPw: 'New Password',
      confirmPw: 'Confirm New Password',
      minPw: 'At least 8 characters',
      updatePw: 'Update Password',
      adminBadge: 'Admin',
      studentBadge: 'Student',
    },
  }[lang] ?? {} as Record<string, string>;

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const name = fullName.trim();
    if (!name || !user) return;
    if (name === user.fullName) {
      toast.info(lang === 'ar' ? 'الاسم لم يتغير' : 'Name unchanged');
      return;
    }

    setSavingName(true);
    const { error: dbError } = await supabase
      .from('user_profiles')
      .update({ full_name: name })
      .eq('id', user.id);

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: name }
    });

    setSavingName(false);
    if (dbError || authError) {
      toast.error((dbError ?? authError)?.message ?? 'Error');
      return;
    }

    // Update local auth state
    login({ ...user, fullName: name });
    toast.success(lang === 'ar' ? 'تم تحديث الاسم بنجاح' : 'Name updated successfully');
  }

  async function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (newPw.length < 8) {
      toast.error(lang === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setSavingPw(true);

    // Re-authenticate first with current password
    const email = `${user.universityId}@student.ahu.edu.jo`;
    const { error: reAuthError } = await supabase.auth.signInWithPassword({ email, password: currentPw });
    if (reAuthError) {
      setSavingPw(false);
      toast.error(lang === 'ar' ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    toast.success(lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
  }

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Profile header card */}
      <div className="card p-6 bg-hero-gradient text-white">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-black flex-shrink-0">
            {user.fullName?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black truncate">{user.fullName}</h2>
            <p className="text-green-300 text-sm" dir="ltr">{user.email}</p>
            <span className={`inline-block text-xs font-bold rounded-full px-3 py-0.5 mt-1 ${
              user.isAdmin ? 'bg-amber-400/30 text-amber-200' : 'bg-white/20 text-green-200'
            }`}>
              {user.isAdmin ? `👑 ${t.adminBadge}` : `🎓 ${t.studentBadge}`}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl px-4 py-3">
            <div className="text-green-300 text-xs mb-1">{t.uniId}</div>
            <div className="font-bold text-lg" dir="ltr">{user.universityId}</div>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3">
            <div className="text-green-300 text-xs mb-1">{t.email}</div>
            <div className="font-bold text-sm truncate" dir="ltr">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Edit full name */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center text-sm">✏️</span>
          {t.fullName}
        </h3>
        <form onSubmit={handleSaveName} className="flex gap-3">
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder={t.fullName}
            className="input-field flex-1"
            required
          />
          <button
            type="submit"
            disabled={savingName || !fullName.trim()}
            className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap disabled:opacity-50"
          >
            {savingName ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {t.saving}
              </span>
            ) : t.saveInfo}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-sm">🔐</span>
          {t.changePw}
        </h3>
        <form onSubmit={handleChangePw} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.currentPw}</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="••••••••"
                className="input-field pe-10"
                required
                dir="ltr"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                onClick={() => setShowCurrent(p => !p)}
              >
                {showCurrent ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.newPw}</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="••••••••"
                className="input-field pe-10"
                required
                dir="ltr"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                onClick={() => setShowNew(p => !p)}
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">{t.minPw}</p>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.confirmPw}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="••••••••"
                className={`input-field pe-10 ${confirmPw && confirmPw !== newPw ? 'border-red-400 bg-red-50' : ''}`}
                required
                dir="ltr"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                onClick={() => setShowConfirm(p => !p)}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {confirmPw && confirmPw !== newPw && (
              <p className="text-xs text-red-500 mt-1">
                {lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={savingPw || !currentPw || !newPw || !confirmPw}
            className="btn-primary w-full text-sm disabled:opacity-50"
          >
            {savingPw ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {t.saving}
              </span>
            ) : t.updatePw}
          </button>
        </form>
      </div>
    </div>
  );
}
