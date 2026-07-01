import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Section { id: string; title: string; sort_order: number; category: string; }
interface SectionFile { id: string; section_id: string; name: string; file_path: string; file_type: string; }

type SubTab = 'materials' | 'exams';

export default function MaterialsExamsTab() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAdmin = user?.isAdmin ?? false;

  const [subTab, setSubTab] = useState<SubTab>('materials');
  const [sections, setSections] = useState<{ materials: Section[]; exams: Section[] }>({ materials: [], exams: [] });
  const [files, setFiles] = useState<{ materials: SectionFile[]; exams: SectionFile[] }>({ materials: [], exams: [] });
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'college' | 'major'>('major');
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCat, setEditCat] = useState<'college' | 'major'>('major');
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: matSecs }, { data: matFiles }, { data: exSecs }, { data: exFiles }] = await Promise.all([
      supabase.from('course_sections').select('*').order('category').order('sort_order').order('created_at'),
      supabase.from('section_files').select('*').order('created_at'),
      supabase.from('exam_sections').select('*').order('category').order('sort_order').order('created_at'),
      supabase.from('exam_files').select('*').order('created_at'),
    ]);
    if (!mountedRef.current) return;
    setSections({ materials: matSecs ?? [], exams: exSecs ?? [] });
    setFiles({ materials: matFiles ?? [], exams: exFiles ?? [] });
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const curSections = sections[subTab === 'materials' ? 'materials' : 'exams'];
  const curFiles    = files[subTab === 'materials' ? 'materials' : 'exams'];
  const sectionsTable = subTab === 'materials' ? 'course_sections' : 'exam_sections';
  const filesTable    = subTab === 'materials' ? 'section_files'   : 'exam_files';
  const tabIcon       = subTab === 'materials' ? '📖' : '📝';

  function filesBySec(secId: string) { return curFiles.filter(f => f.section_id === secId); }

  const collegeSections = curSections.filter(s => s.category === 'college');
  const majorSections   = curSections.filter(s => s.category === 'major');

  // ── Admin: Add Section ──────────────────────────────────────────────────────
  async function addSection() {
    const t = newTitle.trim();
    if (!t) return;
    const { data, error } = await supabase.from(sectionsTable).insert({
      title: t, category: newCategory, sort_order: curSections.length, created_by: user?.id
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setSections(prev => ({
      ...prev,
      [subTab === 'materials' ? 'materials' : 'exams']: [...curSections, data]
    }));
    setNewTitle('');
    toast.success(lang === 'ar' ? 'تمت الإضافة' : 'Section added');
  }

  async function deleteSection(id: string) {
    if (!window.confirm(lang === 'ar' ? 'هل تريد حذف هذه الوحدة وجميع ملفاتها؟' : 'Delete this section and all files?')) return;
    setDeleting(p => new Set(p).add(id));
    const key = subTab === 'materials' ? 'materials' : 'exams';
    setSections(prev => ({ ...prev, [key]: prev[key].filter(s => s.id !== id) }));
    setFiles(prev => ({ ...prev, [key]: prev[key].filter(f => f.section_id !== id) }));
    await supabase.from(sectionsTable).delete().eq('id', id);
    setDeleting(p => { const n = new Set(p); n.delete(id); return n; });
    toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted');
  }

  async function saveEditTitle(id: string) {
    const t = editTitle.trim();
    if (!t) return;
    const key = subTab === 'materials' ? 'materials' : 'exams';
    setSections(prev => ({
      ...prev,
      [key]: prev[key].map(s => s.id === id ? { ...s, title: t, category: editCat } : s)
    }));
    setEditId(null);
    await supabase.from(sectionsTable).update({ title: t, category: editCat }).eq('id', id);
    toast.success(lang === 'ar' ? 'تم التعديل' : 'Updated');
  }

  // ── File Upload ─────────────────────────────────────────────────────────────
  async function handleFileUpload(secId: string, inputFiles: FileList | null) {
    if (!inputFiles || inputFiles.length === 0) return;
    setUploading(p => ({ ...p, [secId]: true }));
    const prefix = subTab === 'materials' ? 'course' : 'exam';
    const key = subTab === 'materials' ? 'materials' : 'exams';

    for (const file of Array.from(inputFiles)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
      const path = `${prefix}/${secId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('course-files').upload(path, file);
      if (uploadErr) { toast.error(uploadErr.message); continue; }

      const fileType = file.type.startsWith('image/') ? 'image'
        : file.type.includes('presentation') || ext === 'pptx' || ext === 'ppt' ? 'ppt'
        : 'pdf';

      const { data: fData, error: dbErr } = await supabase.from(filesTable).insert({
        section_id: secId, name: file.name, file_path: path, file_type: fileType
      }).select().single();

      if (dbErr) { toast.error(dbErr.message); continue; }
      if (mountedRef.current) {
        setFiles(prev => ({ ...prev, [key]: [...prev[key], fData] }));
      }
    }

    if (mountedRef.current) {
      setUploading(p => ({ ...p, [secId]: false }));
      toast.success(lang === 'ar' ? 'تم الرفع بنجاح' : 'Uploaded successfully');
    }
  }

  async function deleteFile(file: SectionFile) {
    setDeleting(p => new Set(p).add(file.id));
    const key = subTab === 'materials' ? 'materials' : 'exams';
    setFiles(prev => ({ ...prev, [key]: prev[key].filter(f => f.id !== file.id) }));
    await supabase.storage.from('course-files').remove([file.file_path]);
    await supabase.from(filesTable).delete().eq('id', file.id);
    setDeleting(p => { const n = new Set(p); n.delete(file.id); return n; });
  }

  function getPublicUrl(path: string) {
    const { data } = supabase.storage.from('course-files').getPublicUrl(path);
    return data.publicUrl;
  }

  // ── Section renderer ────────────────────────────────────────────────────────
  function renderSection(sec: Section) {
    const secFiles = filesBySec(sec.id);
    const isCollapsed = collapsed[sec.id] ?? true;
    const isUp = uploading[sec.id];
    const isDel = deleting.has(sec.id);

    return (
      <div key={sec.id} className={`border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 ${isDel ? 'opacity-40 scale-95' : ''}`}>
        {/* Section header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
          {editId === sec.id && isAdmin ? (
            <div className="flex gap-2 flex-1 me-2 flex-wrap">
              <input
                autoFocus
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEditTitle(sec.id)}
                className="flex-1 min-w-40 border border-green-300 rounded-lg px-3 py-1 text-sm focus:outline-none"
              />
              <select
                value={editCat}
                onChange={e => setEditCat(e.target.value as 'college' | 'major')}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
              >
                <option value="college">{lang === 'ar' ? 'اجباري كلية' : 'College Mandatory'}</option>
                <option value="major">{lang === 'ar' ? 'اجباري تخصص' : 'Major Mandatory'}</option>
              </select>
              <button onClick={() => saveEditTitle(sec.id)} className="bg-green-700 text-white rounded-lg px-3 py-1 text-xs">
                {lang === 'ar' ? 'حفظ' : 'Save'}
              </button>
              <button onClick={() => setEditId(null)} className="text-gray-400 px-2 text-sm">✕</button>
            </div>
          ) : (
            <button
              className="flex items-center gap-3 flex-1 text-start min-w-0"
              onClick={() => setCollapsed(p => ({ ...p, [sec.id]: !isCollapsed }))}
            >
              <span className="w-8 h-8 bg-green-800 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                {tabIcon}
              </span>
              <span className="font-semibold text-green-900 truncate">{sec.title}</span>
              <span className="text-xs text-green-600 bg-green-100 rounded-full px-2 py-0.5 flex-shrink-0">
                {secFiles.length} {lang === 'ar' ? 'ملف' : 'files'}
              </span>
              <span className="text-green-400 text-xs ms-auto flex-shrink-0">{isCollapsed ? '▼' : '▲'}</span>
            </button>
          )}

          {isAdmin && editId !== sec.id && (
            <div className="flex items-center gap-1 ms-2 flex-shrink-0">
              <button
                onClick={() => { setEditId(sec.id); setEditTitle(sec.title); setEditCat((sec.category as 'college' | 'major')); }}
                className="text-gray-400 hover:text-blue-600 text-xs px-1.5 py-1 rounded transition-colors"
                title={lang === 'ar' ? 'تعديل' : 'Edit'}
              >✏️</button>
              <button
                onClick={() => deleteSection(sec.id)}
                className="text-gray-400 hover:text-red-500 text-xs px-1.5 py-1 rounded transition-colors"
                title={lang === 'ar' ? 'حذف' : 'Delete'}
              >🗑️</button>
            </div>
          )}
        </div>

        {/* Body */}
        {!isCollapsed && (
          <div className="p-4 space-y-3 border-t border-gray-100">
            {secFiles.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-4">
                {lang === 'ar' ? 'لا توجد ملفات بعد' : 'No files yet'}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {secFiles.map(f => {
                  const url = getPublicUrl(f.file_path);
                  const isImage = f.file_type === 'image';
                  const isPpt = f.file_type === 'ppt';
                  const isFileDel = deleting.has(f.id);
                  return (
                    <div
                      key={f.id}
                      className={`relative border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all duration-200 ${isFileDel ? 'opacity-40 scale-95' : ''}`}
                    >
                      {isImage ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={f.name} className="w-full h-28 object-cover" />
                        </a>
                      ) : (
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className={`flex flex-col items-center justify-center h-24 transition-colors ${
                            isPpt ? 'bg-orange-50 hover:bg-orange-100' : 'bg-red-50 hover:bg-red-100'
                          }`}>
                          <span className="text-3xl mb-1">{isPpt ? '📊' : '📄'}</span>
                          <span className={`text-xs font-semibold ${isPpt ? 'text-orange-600' : 'text-red-600'}`}>
                            {isPpt ? 'PPT' : 'PDF'}
                          </span>
                        </a>
                      )}
                      <div className="p-2 flex items-center justify-between gap-1 bg-white">
                        <span className="text-xs text-gray-700 font-medium truncate flex-1" title={f.name}>{f.name}</span>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <a href={url} download={f.name} className="text-blue-400 hover:text-blue-600 text-xs p-1" title="Download">⬇️</a>
                          {isAdmin && (
                            <button onClick={() => deleteFile(f)} disabled={isFileDel}
                              className="text-gray-300 hover:text-red-500 text-xs p-1 transition-colors disabled:cursor-not-allowed">✕</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isAdmin && (
              <div>
                <input
                  ref={el => { fileInputRefs.current[sec.id] = el; }}
                  type="file"
                  multiple
                  accept=".pdf,.ppt,.pptx,image/*"
                  className="hidden"
                  onChange={e => handleFileUpload(sec.id, e.target.files)}
                />
                <button
                  onClick={() => fileInputRefs.current[sec.id]?.click()}
                  disabled={isUp}
                  className="w-full border-2 border-dashed border-green-300 text-green-600 hover:border-green-400 hover:bg-green-50 rounded-xl py-3 text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUp ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      {lang === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                    </>
                  ) : (
                    <>📎 {lang === 'ar' ? 'رفع ملفات (PDF / صور / PowerPoint)' : 'Upload files (PDF / Images / PowerPoint)'}</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <svg className="animate-spin w-8 h-8 me-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Sub-tab switcher */}
      <div className="flex gap-3 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm">
        {([
          { id: 'materials' as SubTab, icon: '📖', ar: 'المواد الدراسية',  en: 'Course Materials' },
          { id: 'exams'     as SubTab, icon: '📝', ar: 'أسئلة السنوات',    en: 'Past Exam Questions' },
        ]).map(s => (
          <button
            key={s.id}
            onClick={() => { setSubTab(s.id); setEditId(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              subTab === s.id
                ? 'bg-green-800 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span>{s.icon}</span>
            <span>{lang === 'ar' ? s.ar : s.en}</span>
          </button>
        ))}
      </div>

      {/* Admin: Add section */}
      {isAdmin && (
        <div className="card p-4 bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700 font-semibold mb-3">
            👑 {lang === 'ar' ? 'إضافة وحدة جديدة (للمشرف فقط)' : 'Add new section (Admin only)'}
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSection()}
              placeholder={lang === 'ar' ? 'اسم المادة...' : 'Section name...'}
              className="flex-1 min-w-48 border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as 'college' | 'major')}
              className="border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            >
              <option value="college">{lang === 'ar' ? 'اجباري كلية' : 'College Mandatory'}</option>
              <option value="major">{lang === 'ar' ? 'اجباري تخصص' : 'Major Mandatory'}</option>
            </select>
            <button
              onClick={addSection}
              disabled={!newTitle.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {lang === 'ar' ? '+ إضافة' : '+ Add'}
            </button>
          </div>
        </div>
      )}

      {/* College Mandatory Group */}
      {collegeSections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-sky-200" />
            <span className="text-xs font-bold text-sky-700 bg-sky-100 border border-sky-200 rounded-full px-3 py-1 flex-shrink-0">
              🏛️ {lang === 'ar' ? 'اجباري كلية' : 'College Mandatory'}
            </span>
            <div className="h-px flex-1 bg-sky-200" />
          </div>
          <div className="space-y-2">{collegeSections.map(renderSection)}</div>
        </div>
      )}

      {/* Major Mandatory Group */}
      {majorSections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-emerald-200" />
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-3 py-1 flex-shrink-0">
              🔬 {lang === 'ar' ? 'اجباري تخصص' : 'Major Mandatory'}
            </span>
            <div className="h-px flex-1 bg-emerald-200" />
          </div>
          <div className="space-y-2">{majorSections.map(renderSection)}</div>
        </div>
      )}

      {/* Empty state */}
      {curSections.length === 0 && (
        <div className="card p-14 text-center">
          <div className="text-5xl mb-4">{tabIcon}</div>
          <p className="text-gray-400">
            {lang === 'ar'
              ? (subTab === 'materials' ? 'لا توجد مواد دراسية بعد' : 'لا توجد أسئلة سنوات بعد')
              : (subTab === 'materials' ? 'No course materials yet' : 'No past exam questions yet')}
          </p>
          {isAdmin && <p className="text-xs text-amber-600 mt-2">{lang === 'ar' ? 'أضف وحدات من الأعلى' : 'Add sections above'}</p>}
        </div>
      )}
    </div>
  );
}
