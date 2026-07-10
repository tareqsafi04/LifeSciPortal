import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Student {
  id: string;
  university_id: string | null;
  full_name: string | null;
  email: string;
  created_at?: string;
  is_admin?: boolean;
}

const POLL_INTERVAL = 30_000;

export default function AdminPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const [students, setStudents]       = useState<Student[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef  = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Fetch directly from DB (no edge function) ───────────────────────────────
  const fetchStudents = useCallback(async (silent = false) => {
    if (!user?.isAdmin) return;

    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, university_id, full_name, email, is_admin')
        .order('email', { ascending: true });

      if (error) {
        if (!silent) toast.error(error.message);
        return;
      }

      // Get created_at from auth.users via RPC isn't available directly,
      // so we enrich with created_at from user_profiles if available
      if (mountedRef.current) {
        setStudents(data ?? []);
        setLastUpdated(new Date());
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (!silent) toast.error(message);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user]);

  // Initial + polling
  useEffect(() => {
    fetchStudents(false);
    intervalRef.current = setInterval(() => fetchStudents(true), POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchStudents]);

  // ── Access guard ────────────────────────────────────────────────────────────
  if (!user?.isAdmin) {
    return (
      <div className="card p-10 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-gray-500">{lang === 'ar' ? 'ليس لديك صلاحية الوصول' : 'Access denied'}</p>
      </div>
    );
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered  = students.filter(s =>
    !search ||
    s.university_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  );
  const nonAdmins = students.filter(s => !s.is_admin);
  const admins    = students.filter(s => s.is_admin);

  function formatTime(d: Date) {
    return d.toLocaleTimeString(lang === 'ar' ? 'ar-JO' : 'en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Live indicator */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${refreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="text-xs text-gray-500">
            {refreshing
              ? (lang === 'ar' ? 'جاري التحديث...' : 'Refreshing...')
              : (lang === 'ar' ? 'مباشر – يتحدث كل 30 ثانية' : 'Live – updates every 30s')}
          </span>
        </div>
        {lastUpdated && (
          <span className="text-xs text-gray-400">
            {lang === 'ar' ? 'آخر تحديث: ' : 'Last update: '}
            {formatTime(lastUpdated)}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { icon: '🎓', value: nonAdmins.length, label: t('studentsCount'),                                          color: 'text-green-700'  },
          { icon: '👑', value: admins.length,    label: lang === 'ar' ? 'المشرفون'           : 'Admins',            color: 'text-amber-600'  },
          { icon: '📊', value: students.length,  label: lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',       color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="card p-4 text-center">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className={`text-3xl font-black transition-all duration-300 ${s.color}`}>
              {loading
                ? <span className="inline-block w-8 h-7 bg-gray-100 animate-pulse rounded" />
                : s.value}
            </div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Students table */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            {t('studentsList')}
            {!loading && (
              <span className="text-xs font-normal text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                {filtered.length}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث بالاسم أو الرقم...' : 'Search by name or ID...'}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400 w-44"
            />
            <button
              onClick={() => fetchStudents(false)}
              disabled={loading || refreshing}
              className="btn-secondary py-2 px-3 text-sm flex items-center gap-1.5"
            >
              <svg
                className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {lang === 'ar' ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 animate-pulse">
                <div className="w-6 h-4 bg-gray-100 rounded" />
                <div className="w-20 h-4 bg-gray-100 rounded" />
                <div className="w-32 h-4 bg-gray-100 rounded" />
                <div className="flex-1 h-4 bg-gray-100 rounded hidden sm:block" />
              </div>
            ))}
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
                  <th className="text-start px-4 py-3 font-semibold text-gray-600 w-10">#</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-600">{t('universityIdCol')}</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-600">{t('nameCol')}</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">{t('emailCol')}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-50 hover:bg-green-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}
                  >
                    <td className="px-4 py-3 text-gray-300 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs" dir="ltr">
                        {s.university_id ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell text-xs" dir="ltr">{s.email}</td>
                    <td className="px-4 py-3 text-center">
                      {s.is_admin
                        ? <span className="badge bg-amber-100 text-amber-700 text-xs">👑 {t('adminBadge')}</span>
                        : <span className="badge bg-green-100 text-green-700 text-xs">🎓 {lang === 'ar' ? 'طالب' : 'Student'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="card p-4 bg-amber-50 border border-amber-200">
        <p className="text-amber-700 text-sm leading-relaxed">
          <span className="font-bold">💡 {lang === 'ar' ? 'ملاحظة:' : 'Note:'}</span>{' '}
          {lang === 'ar'
            ? 'لمنح صلاحيات الإدارة لطالب، قم بتحديث حقل is_admin إلى true في جدول user_profiles عبر لوحة البيانات.'
            : 'To grant admin privileges, set is_admin=true in the user_profiles table via the Cloud Data dashboard.'}
        </p>
      </div>
    </div>
  );
}
