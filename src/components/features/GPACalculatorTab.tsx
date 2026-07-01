import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { COURSES, type Course } from '@/constants/courses';

interface DbCourse { id: string; course_id: string; is_retake: boolean; grade: number | null; }

export default function GPACalculatorTab() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const [dbCourses, setDbCourses] = useState<DbCourse[]>([]);
  const [grades, setGrades]       = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('student_courses')
      .select('id, course_id, is_retake, grade')
      .eq('user_id', user.id);
    setDbCourses(data ?? []);

    const init: Record<string, string> = {};
    (data ?? []).forEach(dc => {
      if (dc.grade !== null) init[dc.id] = String(dc.grade);
    });
    setGrades(init);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Deduplicate: keep retake entry if exists, else use original
  const uniqueCourses = useMemo(() => {
    const seen = new Map<string, DbCourse & { course: Course }>();
    // process non-retakes first
    [...dbCourses].sort((a, b) => Number(a.is_retake) - Number(b.is_retake)).forEach(dc => {
      const c = COURSES.find(x => x.id === dc.course_id);
      if (!c || c.credits === 0) return;
      if (!seen.has(dc.course_id)) {
        seen.set(dc.course_id, { ...dc, course: c });
      } else if (dc.is_retake) {
        // Override with retake record
        seen.set(dc.course_id, { ...seen.get(dc.course_id)!, id: dc.id, is_retake: true });
      }
    });
    return Array.from(seen.values());
  }, [dbCourses]);

  // Weighted average from 100
  const result = useMemo(() => {
    let totalWeighted = 0, totalCredits = 0, passedCredits = 0, failedCount = 0;
    uniqueCourses.forEach(dc => {
      const gStr = grades[dc.id];
      if (!gStr) return;
      const g = parseFloat(gStr);
      if (isNaN(g) || g < 35 || g > 100) return;
      totalWeighted += g * dc.course.credits;
      totalCredits  += dc.course.credits;
      if (g >= 50) passedCredits += dc.course.credits;
      else failedCount++;
    });
    const avg = totalCredits > 0 ? totalWeighted / totalCredits : 0;
    return { avg: parseFloat(avg.toFixed(2)), totalCredits, passedCredits, failedCount };
  }, [uniqueCourses, grades]);

  async function saveGrade(dbId: string, g: number) {
    setSaving(true);
    await supabase.from('student_courses').update({ grade: g }).eq('id', dbId);
    setSaving(false);
  }

  function handleGradeChange(dbId: string, val: string) {
    setGrades(p => ({ ...p, [dbId]: val }));
    setErrors(p => ({ ...p, [dbId]: '' }));

    if (val === '') return;
    const g = parseFloat(val);
    if (isNaN(g)) return;

    if (g < 35) {
      setErrors(p => ({ ...p, [dbId]: lang === 'ar' ? 'أقل درجة مقبولة هي 35' : 'Min accepted grade is 35' }));
      return;
    }
    if (g > 100) {
      setErrors(p => ({ ...p, [dbId]: lang === 'ar' ? 'الدرجة القصوى 100' : 'Max grade is 100' }));
      return;
    }
    saveGrade(dbId, g);
  }

  function gradeColor(g: number) {
    if (g >= 90) return { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' };
    if (g >= 80) return { bg: 'bg-blue-50',    border: 'border-blue-300',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700'    };
    if (g >= 70) return { bg: 'bg-sky-50',     border: 'border-sky-300',     text: 'text-sky-700',     badge: 'bg-sky-100 text-sky-700'      };
    if (g >= 60) return { bg: 'bg-amber-50',   border: 'border-amber-300',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700'  };
    if (g >= 50) return { bg: 'bg-orange-50',  border: 'border-orange-300',  text: 'text-orange-700',  badge: 'bg-orange-100 text-orange-700'};
    return        { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700'    };
  }

  function gradeLabel(g: number): { ar: string; en: string } {
    if (g >= 97) return { ar: 'ممتاز+',    en: 'Excellent+' };
    if (g >= 93) return { ar: 'ممتاز',     en: 'Excellent'  };
    if (g >= 90) return { ar: 'ممتاز-',    en: 'Excellent-' };
    if (g >= 87) return { ar: 'جيد جداً+', en: 'Very Good+' };
    if (g >= 83) return { ar: 'جيد جداً',  en: 'Very Good'  };
    if (g >= 80) return { ar: 'جيد جداً-', en: 'Very Good-' };
    if (g >= 77) return { ar: 'جيد+',      en: 'Good+'      };
    if (g >= 73) return { ar: 'جيد',       en: 'Good'       };
    if (g >= 70) return { ar: 'جيد-',      en: 'Good-'      };
    if (g >= 68) return { ar: 'مقبول+',    en: 'Pass+'      };
    if (g >= 65) return { ar: 'مقبول',     en: 'Pass'       };
    if (g >= 60) return { ar: 'مقبول-',    en: 'Pass-'      };
    if (g >= 50) return { ar: 'مقبول--',   en: 'Min Pass'   };
    return              { ar: 'راسب',      en: 'Fail'       };
  }

  function avgColor(avg: number) {
    if (avg >= 80) return 'text-emerald-300';
    if (avg >= 70) return 'text-sky-300';
    if (avg >= 60) return 'text-amber-300';
    if (avg >= 50) return 'text-orange-300';
    return 'text-red-300';
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

  if (uniqueCourses.length === 0) {
    return (
      <div className="card p-10 text-center animate-fade-in">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-lg font-bold text-gray-700 mb-2">{t('gpaTitle')}</h3>
        <p className="text-gray-400">{t('noGradesYet')}</p>
      </div>
    );
  }

  const hasAny = Object.values(grades).some(v => {
    const g = parseFloat(v);
    return !isNaN(g) && g >= 35 && g <= 100;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary card */}
      <div className="card p-6 bg-hero-gradient text-white">
        <h2 className="text-lg font-bold mb-1">{t('gpaTitle')}</h2>
        <p className="text-green-300 text-sm mb-5">{lang === 'ar' ? 'المعدل المئوي المرجح بالساعات' : 'Weighted percentage average by credit hours'}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center bg-white/10 rounded-xl p-4 col-span-2 sm:col-span-1">
            <div className={`text-5xl font-black ${hasAny ? avgColor(result.avg) : 'text-white/40'}`}>
              {hasAny ? result.avg.toFixed(1) : '—'}
            </div>
            <div className="text-green-300 text-xs mt-1">
              {lang === 'ar' ? 'المعدل التراكمي / 100' : 'Cumulative Avg / 100'}
            </div>
          </div>
          <div className="text-center bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-black">{result.totalCredits}</div>
            <div className="text-green-300 text-xs mt-1">{lang === 'ar' ? 'ساعات مُدخَلة' : 'Graded Credits'}</div>
          </div>
          <div className="text-center bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-black text-emerald-300">{result.passedCredits}</div>
            <div className="text-green-300 text-xs mt-1">{lang === 'ar' ? 'ساعات ناجح' : 'Passed Credits'}</div>
          </div>
          <div className="text-center bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-black text-red-300">{result.failedCount}</div>
            <div className="text-green-300 text-xs mt-1">{lang === 'ar' ? 'مواد راسب' : 'Failed Courses'}</div>
          </div>
        </div>
        {saving && <p className="text-green-300 text-xs mt-3">💾 {lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</p>}
      </div>

      {/* Info bar */}
      <div className="card p-3 bg-blue-50 border border-blue-200 flex flex-wrap gap-3 text-xs text-blue-700">
        <span>✅ {lang === 'ar' ? 'ناجح: 50–100' : 'Pass: 50–100'}</span>
        <span className="text-gray-300">|</span>
        <span>❌ {lang === 'ar' ? 'راسب: 35–49' : 'Fail: 35–49'}</span>
        <span className="text-gray-300">|</span>
        <span>⚠️ {lang === 'ar' ? 'مقبول من الدرجة 68 فصاعداً' : 'Acceptable grade: 68+'}</span>
        <span className="text-gray-300">|</span>
        <span>🚫 {lang === 'ar' ? 'لا تُقبل درجات أقل من 35' : 'Grades below 35 not accepted'}</span>
      </div>

      {/* Courses table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('courseName')}</th>
                <th className="px-3 py-3 font-semibold text-gray-700 text-center w-16">{lang === 'ar' ? 'ساعات' : 'Cr.'}</th>
                <th className="px-3 py-3 font-semibold text-gray-700 text-center w-32">{lang === 'ar' ? 'الدرجة / 100' : 'Grade / 100'}</th>
                <th className="px-3 py-3 font-semibold text-gray-700 text-center w-28">{lang === 'ar' ? 'التقدير' : 'Grade'}</th>
                <th className="px-3 py-3 font-semibold text-gray-700 text-center w-24">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {uniqueCourses.map((dc, idx) => {
                const gStr = grades[dc.id] ?? '';
                const g    = parseFloat(gStr);
                const hasGrade = !isNaN(g) && g >= 35 && g <= 100;
                const colors = hasGrade ? gradeColor(g) : null;
                const lbl    = hasGrade ? gradeLabel(g) : null;
                const err    = errors[dc.id];
                const passed = hasGrade && g >= 50;

                return (
                  <tr key={dc.id} className={`border-b border-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800 leading-tight">
                      {lang === 'ar' ? dc.course.nameAr : dc.course.nameEn}
                      {dc.is_retake && (
                        <span className="badge bg-amber-100 text-amber-700 text-xs ms-2">{t('retake')}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-600 font-semibold">{dc.course.credits}</td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <input
                          type="number"
                          min="35" max="100" step="0.5"
                          value={gStr}
                          onChange={e => handleGradeChange(dc.id, e.target.value)}
                          placeholder="—"
                          className={`w-20 text-center border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 transition-colors ${
                            err
                              ? 'border-red-400 bg-red-50 focus:ring-red-200'
                              : colors
                              ? `${colors.border} ${colors.bg} focus:ring-green-200`
                              : 'border-gray-200 focus:border-green-400 focus:ring-green-200'
                          }`}
                          dir="ltr"
                        />
                        {err && <span className="text-xs text-red-500">{err}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {lbl ? (
                        <span className={`badge text-xs font-semibold ${colors?.badge}`}>
                          {lang === 'ar' ? lbl.ar : lbl.en}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {hasGrade ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-2 py-0.5 ${
                          passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {passed ? '✓' : '✗'} {passed
                            ? (lang === 'ar' ? 'ناجح' : 'Pass')
                            : (lang === 'ar' ? 'راسب' : 'Fail')}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade reference */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-3">{lang === 'ar' ? 'سلم الدرجات (النظام المئوي)' : 'Grading Scale (Percentage System)'}</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          {[
            { range: '97–100', label: lang === 'ar' ? 'ممتاز+' : 'Excellent+', cls: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
            { range: '90–96',  label: lang === 'ar' ? 'ممتاز'  : 'Excellent',  cls: 'bg-emerald-50  border-emerald-200 text-emerald-700' },
            { range: '80–89',  label: lang === 'ar' ? 'جيد جداً' : 'Very Good',  cls: 'bg-blue-100 border-blue-300 text-blue-800' },
            { range: '70–79',  label: lang === 'ar' ? 'جيد'    : 'Good',       cls: 'bg-sky-100  border-sky-300  text-sky-800'  },
            { range: '68–69',  label: lang === 'ar' ? 'مقبول+' : 'Pass+',      cls: 'bg-amber-100 border-amber-300 text-amber-800' },
            { range: '50–67',  label: lang === 'ar' ? 'مقبول'  : 'Min Pass',   cls: 'bg-orange-100 border-orange-300 text-orange-800' },
            { range: '35–49',  label: lang === 'ar' ? 'راسب'   : 'Fail',       cls: 'bg-red-100 border-red-300 text-red-800' },
          ].map(r => (
            <div key={r.range} className={`rounded-lg px-2 py-2 text-center border ${r.cls}`}>
              <div className="font-bold">{r.label}</div>
              <div className="text-gray-500 mt-0.5">{r.range}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
