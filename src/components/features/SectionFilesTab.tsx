import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Section { id: string; title: string; sort_order: number; }
interface SectionFile { id: string; section_id: string; name: string; file_path: string; file_type: string; }

interface Props {
  tablePrefix: 'course' | 'exam';
  emptyIcon: string;
  emptyText: string;
  emptyTextEn: string;
}

export default function SectionFilesTab({ tablePrefix, emptyIcon, emptyText, emptyTextEn }: Props) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAdmin = user?.isAdmin ?? false;

  const sectionsTable = tablePrefix === 'course' ? 'course_sections' : 'exam_sections';
  const filesTable    = tablePrefix === 'course' ? 'section_files'   : 'exam_files';

  const [sections, setSections]   = useState<Section[]>([]);
  const [files, setFiles]         = useState<SectionFile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [newTitle, setNewTitle]   = useState('');
  const [editId, setEditId]       = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting]   = useState<Set<string>>(new Set());
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: secs }, { data: fls }] = await Promise.all([
      supabase.from(sectionsTable).select('*').order('sort_order').order('created_at'),
      supabase.from(filesTable).select('*').order('created_at'),
    ]);
    if (!mountedRef.current) return;
    setSections(secs ?? []);
    setFiles(fls ?? []);
    setLoading(false);
  }, [sectionsTable, filesTable]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function filesBySec(secId: string) { return files.filter(f => f.section_id === secId); }

  async function addSection() {
    const t = newTitle.trim();
    if (!t) return;
    const { data, error } = await supabase.from(sectionsTable).insert({
      title: t, sort_order: sections.length, created_by: user?.id
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setSections(p => [...p, data]);
    setNewTitle('');
    toast.success(lang === 'ar' ? 'تمت الإضافة' : 'Section added');
  }

  async function deleteSection(id: string) {
    if (!window.confirm(lang === 'ar' ? 'هل تريد حذف هذه الوحدة وجميع ملفاتها؟' : 'Delete this section and all its files?')) return;
    setDeleting(p => new Set(p).add(id));
    setSections(p => p.filter(s => s.id !== id));
    setFiles(p => p.filter(f => f.section_id !== id));
    await supabase.from(sectionsTable).delete().eq('id', id);
    setDeleting(p => { const n = new Set(p); n.delete(id); return n; });
    toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted');
  }

  async function saveEditTitle(id: string) {
    const t = editTitle.trim();
    if (!t) return;
    setSections(p => p.map(s => s.id === id ? { ...s, title: t } : s));
    setEditId(null);
    await supabase.from(sectionsTable).update({ title: t }).eq('id', id);
  }

  async function handleFileUpload(secId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(p => ({ ...p, [secId]: true }));

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
      const path = `${tablePrefix}/${secId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('course-files').upload(path, file);
      if (uploadErr) { toast.error(uploadErr.message); continue; }

      const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
      const { data: fData, error: dbErr } = await supabase.from(filesTable).insert({
        section_id: secId, name: file.name, file_path: path, file_type: fileType
      }).select().single();

      if (dbErr) { toast.error(dbErr.message); continue; }
      if (mountedRef.current) setFiles(p => [...p, fData]);
    }

    if (mountedRef.current) {
      setUploading(p => ({ ...p, [secId]: false }));
      toast.success(lang === 'ar' ? 'تم الرفع بنجاح' : 'Uploaded successfully');
    }
  }

  async function deleteFile(file: SectionFile) {
    setDeleting(p => new Set(p).add(file.id));
    setFiles(p => p.filter(f => f.id !== file.id));
    await supabase.storage.from('course-files').remove([file.file_path]);
    await supabase.from(filesTable).delete().eq('id', file.id);
    setDeleting(p => { const n = new Set(p); n.delete(file.id); return n; });
  }

  function getPublicUrl(path: string) {
    const { data } = supabase.storage.from('course-files').getPublicUrl(path);
    return data.publicUrl;
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
      {/* Admin: Add section */}
      {isAdmin && (
        <div className="card p-4 bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700 font-semibold mb-3">
            👑 {lang === 'ar' ? 'إضافة وحدة جديدة (للمشرف فقط)' : 'Add new section (Admin only)'}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSection()}
              placeholder={lang === 'ar' ? 'اسم الوحدة مثلاً: علوم حياتية (1)' : 'Section name e.g. Life Sciences (1)'}
              className="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white"
            />
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

      {sections.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="text-5xl mb-4">{emptyIcon}</div>
          <p className="text-gray-400">{lang === 'ar' ? emptyText : emptyTextEn}</p>
          {isAdmin && <p className="text-xs text-amber-600 mt-2">{lang === 'ar' ? 'أضف وحدات من الأعلى' : 'Add sections above'}</p>}
        </div>
      ) : (
        sections.map(sec => {
          const secFiles = filesBySec(sec.id);
          const isCollapsed = collapsed[sec.id];
          const isUp = uploading[sec.id];
          const isDel = deleting.has(sec.id);

          return (
            <div key={sec.id} className={`card overflow-hidden transition-all duration-200 ${isDel ? 'opacity-40 scale-95' : ''}`}>
              {/* Section header */}
              <div className="flex items-center justify-between px-5 py-3 bg-green-50 border-b border-green-100">
                {editId === sec.id && isAdmin ? (
                  <div className="flex gap-2 flex-1 me-2">
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEditTitle(sec.id)}
                      className="flex-1 border border-green-300 rounded-lg px-3 py-1 text-sm focus:outline-none"
                    />
                    <button onClick={() => saveEditTitle(sec.id)} className="bg-green-700 text-white rounded-lg px-3 py-1 text-xs">
                      {lang === 'ar' ? 'حفظ' : 'Save'}
                    </button>
                    <button onClick={() => setEditId(null)} className="text-gray-400 px-2 text-sm">✕</button>
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-3 flex-1 text-start"
                    onClick={() => setCollapsed(p => ({ ...p, [sec.id]: !p[sec.id] }))}
                  >
                    <span className="w-8 h-8 bg-green-800 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {tablePrefix === 'course' ? '📖' : '📝'}
                    </span>
                    <span className="font-bold text-green-900">{sec.title}</span>
                    <span className="text-xs text-green-600 bg-green-100 rounded-full px-2 py-0.5">{secFiles.length} {lang === 'ar' ? 'ملف' : 'files'}</span>
                    <span className="text-green-400 text-xs ms-auto">{isCollapsed ? '▼' : '▲'}</span>
                  </button>
                )}

                {isAdmin && editId !== sec.id && (
                  <div className="flex items-center gap-1 ms-2 flex-shrink-0">
                    <button
                      onClick={() => { setEditId(sec.id); setEditTitle(sec.title); }}
                      className="text-gray-400 hover:text-blue-600 text-xs px-2 py-1 rounded transition-colors"
                      title={lang === 'ar' ? 'تعديل الاسم' : 'Edit name'}
                    >✏️</button>
                    <button
                      onClick={() => deleteSection(sec.id)}
                      className="text-gray-400 hover:text-red-500 text-xs px-2 py-1 rounded transition-colors"
                      title={lang === 'ar' ? 'حذف الوحدة' : 'Delete section'}
                    >🗑️</button>
                  </div>
                )}
              </div>

              {/* Section body */}
              {!isCollapsed && (
                <div className="p-4 space-y-3">
                  {/* Files grid */}
                  {secFiles.length === 0 ? (
                    <p className="text-gray-400 text-xs text-center py-4">
                      {lang === 'ar' ? 'لا توجد ملفات بعد' : 'No files yet'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {secFiles.map(f => {
                        const url = getPublicUrl(f.file_path);
                        const isImage = f.file_type === 'image';
                        const isFileDel = deleting.has(f.id);
                        return (
                          <div
                            key={f.id}
                            className={`relative border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all duration-200 group ${isFileDel ? 'opacity-40 scale-95' : ''}`}
                          >
                            {isImage ? (
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={f.name} className="w-full h-36 object-cover" />
                              </a>
                            ) : (
                              <a href={url} target="_blank" rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center h-28 bg-red-50 hover:bg-red-100 transition-colors">
                                <span className="text-4xl mb-1">📄</span>
                                <span className="text-xs text-red-600 font-semibold">PDF</span>
                              </a>
                            )}
                            <div className="p-2 flex items-center justify-between gap-1">
                              <span className="text-xs text-gray-700 font-medium truncate flex-1" title={f.name}>{f.name}</span>
                              <div className="flex gap-1 flex-shrink-0">
                                <a href={url} download={f.name} className="text-blue-400 hover:text-blue-600 text-xs p-1" title="Download">⬇️</a>
                                {isAdmin && (
                                  <button onClick={() => deleteFile(f)} disabled={isFileDel}
                                    className="text-gray-300 hover:text-red-500 text-xs p-1 transition-colors disabled:cursor-not-allowed" title="Delete">✕</button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Admin: Upload files */}
                  {isAdmin && (
                    <div>
                      <input
                        ref={el => { fileInputRefs.current[sec.id] = el; }}
                        type="file"
                        multiple
                        accept=".pdf,image/*"
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
                          <>📎 {lang === 'ar' ? 'رفع ملفات PDF أو صور' : 'Upload PDF or image files'}</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
