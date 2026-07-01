import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  COURSES, CATEGORY_COLORS, TOTAL_REQUIRED_CREDITS,
  type Course
} from '@/constants/courses';

interface DbSemester { id: string; year_number: number; semester_number: number; type: string; }
interface DbCourse   { id: string; semester_id: string; course_id: string; is_retake: boolean; grade: number | null; }

const YEAR_LABELS_AR = ['السنة الأولى','السنة الثانية','السنة الثالثة','السنة الرابعة'];
const YEAR_LABELS_EN = ['Year 1','Year 2','Year 3','Year 4'];
const SEM_AR = ['الفصل الأول','الفصل الثاني','الفصل الصيفي'];
const SEM_EN = ['Semester 1','Semester 2','Summer Semester'];

function semKey(year: number, sem: number) { return `${year}-${sem}`; }

export default function StudyPlanTab() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const [semesters, setSemesters] = useState<DbSemester[]>([]);
  const [courses, setCourses]     = useState<DbCourse[]>([]);
  const [loading, setLoading]     = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const name = (c: Course) => lang === 'ar' ? c.nameAr : c.nameEn;
  const catColor = (cat: string) => CATEGORY_COLORS[cat] ?? { bg:'bg-gray-100', text:'text-gray-700', border:'border-gray-200', dot:'#6b7280' };

  // ── Initial fetch only ─────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: sems } = await supabase
      .from('student_semesters').select('*').eq('user_id', user.id).order('year_number').order('semester_number');
    const { data: crs } = await supabase
      .from('student_courses').select('*').eq('user_id', user.id);
    if (!mountedRef.current) return;
    setSemesters(sems ?? []);
    setCourses(crs ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const semMap = useMemo(() => {
    const m: Record<string, DbSemester> = {};
    semesters.forEach(s => { m[semKey(s.year_number, s.semester_number)] = s; });
    return m;
  }, [semesters]);

  const coursesBySem = useMemo(() => {
    const m: Record<string, DbCourse[]> = {};
    courses.forEach(c => {
      if (!m[c.semester_id]) m[c.semester_id] = [];
      m[c.semester_id].push(c);
    });
    return m;
  }, [courses]);

  const allTakenIds = useMemo(() => courses.filter(c => !c.is_retake).map(c => c.course_id), [courses]);

  const totalCompleted = useMemo(() =>
    allTakenIds.reduce((sum, id) => {
      const c = COURSES.find(x => x.id === id);
      return sum + (c?.credits ?? 0);
    }, 0), [allTakenIds]);

  const progressPct = Math.min((totalCompleted / TOTAL_REQUIRED_CREDITS) * 100, 100);

  function availableForSem(semId: string) {
    const semCourseIds = (coursesBySem[semId] ?? []).filter(c => !c.is_retake).map(c => c.course_id);
    return COURSES.filter(c => {
      if (allTakenIds.includes(c.id)) return false;
      if (semCourseIds.includes(c.id)) return false;
      // Check minCredits requirement (e.g. seminar needs 100 cr)
      if (c.minCredits && totalCompleted < c.minCredits) return false;
      return c.prereqs.every(p => allTakenIds.includes(p));
    });
  }

  function retakeForSem(semId: string) {
    const semRetakeIds = (coursesBySem[semId] ?? []).filter(c => c.is_retake).map(c => c.course_id);
    return COURSES.filter(c => allTakenIds.includes(c.id) && !semRetakeIds.includes(c.id));
  }

  function semCredits(semId: string) {
    return (coursesBySem[semId] ?? []).reduce((s, dc) => {
      const c = COURSES.find(x => x.id === dc.course_id);
      return s + (c?.credits ?? 0);
    }, 0);
  }

  function creditStatus(semId: string, isSummer: boolean) {
    const total = semCredits(semId);
    if (isSummer) return { ok: total <= 10, msg: `${total} / 10 ${t('credits')}`, total };
    if (total < 12) return { ok: false, msg: `${total} / 12-18 ${t('credits')}`, total };
    if (total > 18) return { ok: false, msg: `${total} / 18 ${t('credits')} ⚠️`, total };
    return { ok: true, msg: `${total} ${t('credits')} ✓`, total };
  }

  // ── Optimistic Mutations (no page flicker) ─────────────────────────────────
  async function addSummer(year: number) {
    if (!user) return;
    const actionKey = `add-summer-${year}`;
    if (pendingActions.has(actionKey)) return;
    setPendingActions(p => new Set(p).add(actionKey));

    // Optimistic: add temp semester immediately
    const tempId = `temp-${Date.now()}`;
    const tempSem: DbSemester = { id: tempId, year_number: year, semester_number: 3, type: 'summer' };
    setSemesters(prev => [...prev, tempSem]);

    const { data, error } = await supabase.from('student_semesters').insert({
      user_id: user.id, year_number: year, semester_number: 3, type: 'summer'
    }).select().single();

    if (!mountedRef.current) return;

    if (error) {
      // Rollback
      setSemesters(prev => prev.filter(s => s.id !== tempId));
      toast.error(error.message);
    } else {
      // Replace temp with real
      setSemesters(prev => prev.map(s => s.id === tempId ? data : s));
      toast.success(lang === 'ar' ? 'تمت إضافة الفصل الصيفي' : 'Summer semester added');
    }

    setPendingActions(p => { const n = new Set(p); n.delete(actionKey); return n; });
  }

  async function removeSummer(semId: string) {
    const actionKey = `remove-summer-${semId}`;
    if (pendingActions.has(actionKey)) return;
    setPendingActions(p => new Set(p).add(actionKey));

    // Optimistic remove
    const removed = semesters.find(s => s.id === semId);
    const removedCourses = coursesBySem[semId] ?? [];
    setSemesters(prev => prev.filter(s => s.id !== semId));
    setCourses(prev => prev.filter(c => c.semester_id !== semId));

    const { error } = await supabase.from('student_semesters').delete().eq('id', semId);

    if (!mountedRef.current) return;

    if (error) {
      // Rollback
      if (removed) setSemesters(prev => [...prev, removed]);
      setCourses(prev => [...prev, ...removedCourses]);
      toast.error(error.message);
    } else {
      toast.success(lang === 'ar' ? 'تم حذف الفصل الصيفي' : 'Summer semester removed');
    }

    setPendingActions(p => { const n = new Set(p); n.delete(actionKey); return n; });
  }

  async function addCourse(semId: string, courseId: string, isRetake: boolean) {
    if (!user) return;
    const actionKey = `add-${semId}-${courseId}`;
    if (pendingActions.has(actionKey)) return;
    setPendingActions(p => new Set(p).add(actionKey));

    const course = COURSES.find(c => c.id === courseId);
    if (!course) { setPendingActions(p => { const n = new Set(p); n.delete(actionKey); return n; }); return; }

    // Optimistic add
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempCourse: DbCourse = { id: tempId, semester_id: semId, course_id: courseId, is_retake: isRetake, grade: null };
    setCourses(prev => [...prev, tempCourse]);

    const { data, error } = await supabase.from('student_courses').insert({
      user_id: user.id, semester_id: semId, course_id: courseId, is_retake: isRetake
    }).select().single();

    if (!mountedRef.current) return;

    if (error) {
      // Rollback
      setCourses(prev => prev.filter(c => c.id !== tempId));
      toast.error(error.message);
    } else {
      // Replace temp with real record
      setCourses(prev => prev.map(c => c.id === tempId ? data : c));
    }

    setPendingActions(p => { const n = new Set(p); n.delete(actionKey); return n; });
  }

  async function removeCourse(dbId: string) {
    const actionKey = `remove-${dbId}`;
    if (pendingActions.has(actionKey)) return;
    setPendingActions(p => new Set(p).add(actionKey));

    // Optimistic remove
    const removed = courses.find(c => c.id === dbId);
    setCourses(prev => prev.filter(c => c.id !== dbId));

    const { error } = await supabase.from('student_courses').delete().eq('id', dbId);

    if (!mountedRef.current) return;

    if (error) {
      // Rollback
      if (removed) setCourses(prev => [...prev, removed]);
      toast.error(error.message);
    }

    setPendingActions(p => { const n = new Set(p); n.delete(actionKey); return n; });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <svg className="animate-spin w-8 h-8 me-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        {t('loading')}
      </div>
    );
  }

  // Category breakdown for header
  const breakdown: Record<string, number> = {};
  allTakenIds.forEach(id => {
    const c = COURSES.find(x => x.id === id);
    if (c) breakdown[c.categoryAr] = (breakdown[c.categoryAr] ?? 0) + c.credits;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress Header */}
      <div className="card p-5 bg-hero-gradient text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold">{t('studyPlan')}</h2>
            <p className="text-green-300 text-sm">{t('requiredCredits')}</p>
          </div>
          <div className="text-end">
            <div className="text-3xl font-black">{totalCompleted}</div>
            <div className="text-green-300 text-xs">/ {TOTAL_REQUIRED_CREDITS} {t('credits')}</div>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, background: progressPct >= 100 ? '#34d399' : '#7dd3fc' }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-green-300">
          <span>{Math.round(progressPct)}% {t('progressPct')}</span>
          <span>{TOTAL_REQUIRED_CREDITS - totalCompleted} {t('remainingCredits')}</span>
        </div>
        {/* Category breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(breakdown).map(([cat, hrs]) => {
              const cc = catColor(cat);
              return (
                <span key={cat} className="flex items-center gap-1 text-xs bg-white/10 rounded-full px-2.5 py-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cc.dot }} />
                  {lang === 'ar' ? cat : COURSES.find(c => c.categoryAr === cat)?.categoryEn ?? cat}: {hrs}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Years */}
      {[1, 2, 3, 4].map(year => {
        const yearLabel = lang === 'ar' ? YEAR_LABELS_AR[year-1] : YEAR_LABELS_EN[year-1];
        const yearKey = `year-${year}`;
        const isYearCollapsed = collapsed[yearKey];

        return (
          <div key={year} className="card overflow-hidden">
            {/* Year Header */}
            <button
              className="w-full flex items-center justify-between px-5 py-4 bg-green-50 hover:bg-green-100 transition-colors border-b border-green-100"
              onClick={() => setCollapsed(p => ({ ...p, [yearKey]: !p[yearKey] }))}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-green-800 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">{year}</span>
                <span className="text-lg font-bold text-green-900">{yearLabel}</span>
              </div>
              <span className="text-green-600 text-sm">{isYearCollapsed ? '▼' : '▲'}</span>
            </button>

            {!isYearCollapsed && (
              <div className="p-4 space-y-4">
                {/* Regular semesters */}
                {[1, 2].map(semNum => {
                  const key = semKey(year, semNum);
                  const sem = semMap[key];
                  const semLabel = lang === 'ar' ? SEM_AR[semNum-1] : SEM_EN[semNum-1];
                  const semId = sem?.id ?? '';
                  const semCourses = sem ? (coursesBySem[semId] ?? []) : [];
                  const status = sem ? creditStatus(semId, false) : null;
                  const available = sem ? availableForSem(semId) : [];
                  const retakeList = sem ? retakeForSem(semId) : [];
                  const isCollapsed = collapsed[key];

                  return (
                    <div key={semNum} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Semester Header */}
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        onClick={() => setCollapsed(p => ({ ...p, [key]: !p[key] }))}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 text-sm">{semLabel}</span>
                          {status && (
                            <span className={`badge text-xs ${status.ok ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {status.msg}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 text-xs">{isCollapsed ? '▼' : '▲'}</span>
                      </button>

                      {!isCollapsed && sem && (
                        <div className="p-4 space-y-3">
                          {/* Courses */}
                          {semCourses.length === 0 ? (
                            <p className="text-gray-400 text-xs text-center py-3">{t('noCourses')}</p>
                          ) : (
                            <div className="space-y-2">
                              {semCourses.map(dc => {
                                const c = COURSES.find(x => x.id === dc.course_id);
                                if (!c) return null;
                                const cc = catColor(c.categoryAr);
                                const isPending = pendingActions.has(`remove-${dc.id}`);
                                return (
                                  <div
                                    key={dc.id}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 ${
                                      isPending ? 'opacity-40 scale-95' :
                                      dc.is_retake ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cc.dot }} />
                                    <span className="flex-1 text-sm font-medium text-gray-800 leading-tight">{name(c)}</span>
                                    {dc.is_retake && <span className="badge bg-amber-100 text-amber-700 text-xs">{t('retake')}</span>}
                                    <span className="text-xs text-gray-500 font-semibold flex-shrink-0">{c.credits} {t('credit')}</span>
                                    <button
                                      onClick={() => removeCourse(dc.id)}
                                      disabled={isPending}
                                      className="text-gray-300 hover:text-red-500 transition-colors text-sm flex-shrink-0 w-6 h-6 flex items-center justify-center disabled:cursor-not-allowed"
                                      title={t('removeCourse')}
                                    >
                                      {isPending ? (
                                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                        </svg>
                                      ) : '✕'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Add course dropdowns */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">{t('addCourse')}</label>
                              <select
                                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 cursor-pointer"
                                value=""
                                onChange={e => { if (e.target.value) { addCourse(semId, e.target.value, false); e.target.value = ''; }}}
                              >
                                <option value="">{t('selectCourse')}</option>
                                {Object.entries(
                                  available.reduce<Record<string, Course[]>>((acc, c) => {
                                    const cat = lang === 'ar' ? c.categoryAr : c.categoryEn;
                                    (acc[cat] = acc[cat] ?? []).push(c);
                                    return acc;
                                  }, {})
                                ).map(([cat, list]) => (
                                  <optgroup key={cat} label={cat}>
                                    {list.map(c => (
                                      <option key={c.id} value={c.id}>{name(c)} ({c.credits} {t('credit')})</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">{t('retakeCourse')}</label>
                              <select
                                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={retakeList.length === 0}
                                value=""
                                onChange={e => { if (e.target.value) { addCourse(semId, e.target.value, true); e.target.value = ''; }}}
                              >
                                <option value="">{t('retakeCourse')}</option>
                                {retakeList.map(c => (
                                  <option key={c.id} value={c.id}>{name(c)}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Summer semester */}
                {(() => {
                  const summerKey = semKey(year, 3);
                  const summer = semMap[summerKey];
                  const isAddingSum = pendingActions.has(`add-summer-${year}`);

                  if (!summer) {
                    return (
                      <button
                        onClick={() => addSummer(year)}
                        disabled={isAddingSum}
                        className="w-full border-2 border-dashed border-amber-300 text-amber-600 hover:border-amber-400 hover:bg-amber-50 rounded-xl py-3 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isAddingSum && (
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                        )}
                        {t('addSummer')}
                      </button>
                    );
                  }

                  const semId = summer.id;
                  const semCourses = coursesBySem[semId] ?? [];
                  const status = creditStatus(semId, true);
                  const available = availableForSem(semId);
                  const retakeList = retakeForSem(semId);
                  const isCollapsed = collapsed[summerKey];
                  const isRemoving = pendingActions.has(`remove-summer-${semId}`);

                  return (
                    <div className={`border-2 border-amber-200 rounded-xl overflow-hidden transition-all duration-200 ${isRemoving ? 'opacity-40 scale-95' : ''}`}>
                      <div className="flex items-center justify-between px-4 py-3 bg-amber-50">
                        <button className="flex items-center gap-2 flex-1" onClick={() => setCollapsed(p => ({ ...p, [summerKey]: !p[summerKey] }))}>
                          <span className="font-semibold text-amber-800 text-sm">{lang === 'ar' ? SEM_AR[2] : SEM_EN[2]}</span>
                          <span className="badge bg-amber-200 text-amber-700 text-xs">{t('summerOptional')}</span>
                          <span className={`badge text-xs ${status.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{status.msg}</span>
                        </button>
                        <button
                          onClick={() => removeSummer(semId)}
                          disabled={isRemoving}
                          className="text-amber-400 hover:text-red-500 text-xs transition-colors px-2 disabled:cursor-not-allowed"
                        >
                          {isRemoving ? '...' : t('removeSummer')}
                        </button>
                      </div>
                      {!isCollapsed && (
                        <div className="p-4 space-y-3">
                          {semCourses.length === 0 ? (
                            <p className="text-gray-400 text-xs text-center py-2">{t('noCourses')}</p>
                          ) : (
                            <div className="space-y-2">
                              {semCourses.map(dc => {
                                const c = COURSES.find(x => x.id === dc.course_id);
                                if (!c) return null;
                                const cc = catColor(c.categoryAr);
                                const isPending = pendingActions.has(`remove-${dc.id}`);
                                return (
                                  <div key={dc.id} className={`flex items-center gap-3 p-2.5 rounded-lg bg-white border border-amber-100 transition-all duration-200 ${isPending ? 'opacity-40 scale-95' : ''}`}>
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cc.dot }} />
                                    <span className="flex-1 text-sm font-medium">{name(c)}</span>
                                    <span className="text-xs text-gray-500">{c.credits} {t('credit')}</span>
                                    <button
                                      onClick={() => removeCourse(dc.id)}
                                      disabled={isPending}
                                      className="text-gray-300 hover:text-red-500 text-sm w-6 h-6 flex items-center justify-center transition-colors disabled:cursor-not-allowed"
                                    >
                                      {isPending ? (
                                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                        </svg>
                                      ) : '✕'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">{t('addCourse')} (max 10 {t('credits')})</label>
                            <select
                              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400"
                              value=""
                              onChange={e => { if (e.target.value) { addCourse(semId, e.target.value, false); e.target.value = ''; }}}
                            >
                              <option value="">{t('selectCourse')}</option>
                              {available.map(c => <option key={c.id} value={c.id}>{name(c)} ({c.credits} {t('credit')})</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}

      {/* Stats footer */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('completedCredits'),  value: totalCompleted,                               color: 'text-green-700' },
          { label: t('remainingCredits'),  value: Math.max(0, TOTAL_REQUIRED_CREDITS - totalCompleted), color: 'text-red-600'   },
          { label: t('progressPct'),       value: `${Math.round(progressPct)}%`,                color: 'text-blue-600'  },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
