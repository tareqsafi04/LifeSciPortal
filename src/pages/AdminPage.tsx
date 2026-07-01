import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface Student {
  id: string;
  university_id: string | null;
  full_name: string | null;
  email: string;
  created_at?: string;
  is_admin?: boolean;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  const fetchStudents = useCallback(async () => {
    if (!user?.isAdmin) return;
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast.error(lang === 'ar' ? 'لا توجد جلسة نشطة' : 'No active session');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-students', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const text = await error.context?.text();
            const parsed = JSON.parse(text || '{}');
            msg = parsed.error || msg;
          } catch { /* keep original */ }
        }
        toast.error(msg);
        setLoading(false);
        return;
      }

      setStudents(data?.students ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [user, lang]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  if (!user?.isAdmin) {
    return (
      <div className="card p-10 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-gray-500">{lang === 'ar' ? 'ليس لديك صلاحية الوصول' : 'Access denied'}</p>
      </div>
    );
  }

  const filtered = students.filter(s =>
    !search ||
    s.university_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const nonAdmins = students.filter(s => !s.is_admin);
  const thisMonth = students.filter(s => {
    if (!s.created_at) return false;
    const d = new Date(s.created_at), now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: '👥', value: nonAdmins.length,                      label: t('studentsCount'),                                           color: 'text-green-700'  },
          { icon: '📅', value: thisMonth.length,                       label: lang === 'ar' ? 'مسجلون هذا الشهر'   : 'Registered this month', color: 'text-blue-600'   },
          { icon: '👑', value: students.filter(s => s.is_admin).length,label: lang === 'ar' ? 'المشرفون'            : 'Admins',               color: 'text-amber-600'  },
          { icon: '📊', value: students.length,                        label: lang === 'ar' ? 'إجمالي المستخدمين'  : 'Total Users',          color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="card p-4 text-center">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Students list */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-2">
          <h2 className="font-bold text-gray-800">{t('studentsList')}</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث بالاسم أو الرقم...' : 'Search by name or ID...'}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400 w-44"
            />
            <button
              onClick={fetchStudents}
              className="btn-secondary py-2 px-3 text-sm"
              disabled={loading}
            >
              {loading ? '⏳' : '🔄'} {t('refreshData')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <svg className="animate-spin w-6 h-6 me-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {t('loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">👥</div>
            <p>{search ? (lang === 'ar' ? 'لا توجد نتائج' : 'No results') : t('noStudents')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-start px-4 py-3 font-semibold text-gray-700">#</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('universityIdCol')}</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('nameCol')}</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">{t('emailCol')}</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">{t('joinDate')}</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-center">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-gray-800" dir="ltr">
                      {s.university_id ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs" dir="ltr">{s.email}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell" dir="ltr">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.is_admin
                        ? <span className="badge bg-amber-100 text-amber-700">👑 {t('adminBadge')}</span>
                        : <span className="badge bg-green-100 text-green-700">🎓 {lang === 'ar' ? 'طالب' : 'Student'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin tip */}
      <div className="card p-4 bg-amber-50 border border-amber-200">
        <p className="text-amber-700 text-sm">
          <span className="font-bold">💡 {lang === 'ar' ? 'ملاحظة:' : 'Note:'}</span>{' '}
          {lang === 'ar'
            ? 'لمنح صلاحيات الإدارة لطالب، قم بتحديث حقل is_admin إلى true في جدول user_profiles عبر لوحة البيانات.'
            : 'To grant admin privileges, set is_admin=true in the user_profiles table via the Cloud Data dashboard.'}
        </p>
      </div>
    </div>
  );
}
