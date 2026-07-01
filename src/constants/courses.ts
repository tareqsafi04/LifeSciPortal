export interface Course {
  id: string;
  nameAr: string;
  nameEn: string;
  credits: number;
  categoryAr: string;
  categoryEn: string;
  prereqs: string[];
  minCredits?: number; // minimum completed credits required to unlock
}

export const CATEGORY_AR = {
  UNI_MANDATORY: 'متطلبات الجامعة الإجبارية',
  COLLEGE_MANDATORY: 'متطلبات الكلية الإجبارية',
  MAJOR_MANDATORY: 'متطلبات التخصص الإجبارية',
  MAJOR_ELECTIVE: 'متطلبات التخصص الاختيارية',
  UNI_ELECTIVE_HUMANITIES: 'متطلبات الجامعة الاختيارية - علوم إنسانية',
  UNI_ELECTIVE_SOCIAL: 'متطلبات الجامعة الاختيارية - علوم اجتماعية',
  UNI_ELECTIVE_TECH: 'متطلبات الجامعة الاختيارية - تكنولوجيا وصحة',
};

export const CATEGORY_EN = {
  UNI_MANDATORY: 'University Mandatory',
  COLLEGE_MANDATORY: 'College Mandatory',
  MAJOR_MANDATORY: 'Major Mandatory',
  MAJOR_ELECTIVE: 'Major Elective',
  UNI_ELECTIVE_HUMANITIES: 'University Elective - Humanities',
  UNI_ELECTIVE_SOCIAL: 'University Elective - Social Sciences',
  UNI_ELECTIVE_TECH: 'University Elective - Technology & Health',
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  [CATEGORY_AR.UNI_MANDATORY]:        { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-300',  dot: '#64748b' },
  [CATEGORY_AR.COLLEGE_MANDATORY]:    { bg: 'bg-sky-100',     text: 'text-sky-700',     border: 'border-sky-300',    dot: '#0284c7' },
  [CATEGORY_AR.MAJOR_MANDATORY]:      { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300',dot: '#059669' },
  [CATEGORY_AR.MAJOR_ELECTIVE]:       { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300',  dot: '#d97706' },
  [CATEGORY_AR.UNI_ELECTIVE_HUMANITIES]:{ bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: '#7c3aed' },
  [CATEGORY_AR.UNI_ELECTIVE_SOCIAL]:  { bg: 'bg-pink-100',    text: 'text-pink-700',    border: 'border-pink-300',   dot: '#db2777' },
  [CATEGORY_AR.UNI_ELECTIVE_TECH]:    { bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-300',   dot: '#0d9488' },
};

export const TOTAL_REQUIRED_CREDITS = 132;

// نظام التقدير: الرسوب 35-49، النجاح 50-100، مقبول من 68 فصاعداً
export const GPA_SCALE = [
  { min: 97, max: 100, letterAr: 'ممتاز+',    letterEn: 'A+', points: 4.0  },
  { min: 93, max: 96,  letterAr: 'ممتاز',     letterEn: 'A',  points: 3.75 },
  { min: 90, max: 92,  letterAr: 'ممتاز-',    letterEn: 'A-', points: 3.5  },
  { min: 87, max: 89,  letterAr: 'جيد جداً+', letterEn: 'B+', points: 3.25 },
  { min: 83, max: 86,  letterAr: 'جيد جداً',  letterEn: 'B',  points: 3.0  },
  { min: 80, max: 82,  letterAr: 'جيد جداً-', letterEn: 'B-', points: 2.75 },
  { min: 77, max: 79,  letterAr: 'جيد+',      letterEn: 'C+', points: 2.5  },
  { min: 73, max: 76,  letterAr: 'جيد',       letterEn: 'C',  points: 2.25 },
  { min: 70, max: 72,  letterAr: 'جيد-',      letterEn: 'C-', points: 2.0  },
  { min: 68, max: 69,  letterAr: 'مقبول+',    letterEn: 'D+', points: 1.75 },
  { min: 65, max: 67,  letterAr: 'مقبول',     letterEn: 'D',  points: 1.5  },
  { min: 60, max: 64,  letterAr: 'مقبول-',    letterEn: 'D-', points: 1.25 },
  { min: 50, max: 59,  letterAr: 'مقبول--',   letterEn: 'D--',points: 1.0  },
  { min: 35, max: 49,  letterAr: 'راسب',      letterEn: 'F',  points: 0.0  },
  { min: 0,  max: 34,  letterAr: 'راسب',      letterEn: 'F',  points: 0.0  },
];

export function getGradeInfo(grade: number) {
  return GPA_SCALE.find(g => grade >= g.min && grade <= g.max) ?? GPA_SCALE[GPA_SCALE.length - 1];
}

export const COURSES: Course[] = [
  // ======================== متطلبات الجامعة الإجبارية ========================
  { id: 'eng-exam',    nameAr: 'امتحان مستوى اللغة الإنجليزية', nameEn: 'English Level Exam',                credits: 0, categoryAr: CATEGORY_AR.UNI_MANDATORY, categoryEn: CATEGORY_EN.UNI_MANDATORY, prereqs: [] },
  { id: 'ara-exam',    nameAr: 'امتحان مستوى اللغة العربية',     nameEn: 'Arabic Level Exam',                 credits: 0, categoryAr: CATEGORY_AR.UNI_MANDATORY, categoryEn: CATEGORY_EN.UNI_MANDATORY, prereqs: [] },
  { id: 'comp-exam',   nameAr: 'امتحان مستوى الحاسوب',           nameEn: 'Computer Level Exam',               credits: 0, categoryAr: CATEGORY_AR.UNI_MANDATORY, categoryEn: CATEGORY_EN.UNI_MANDATORY, prereqs: [] },
  { id: 'eng-rem',     nameAr: 'الإنجليزية الاستدراكية',         nameEn: 'Remedial English',                  credits: 0, categoryAr: CATEGORY_AR.UNI_MANDATORY, categoryEn: CATEGORY_EN.UNI_MANDATORY, prereqs: ['eng-exam'] },
  { id: 'ara-rem',     nameAr: 'العربية الاستدراكية',             nameEn: 'Remedial Arabic',                   credits: 0, categoryAr: CATEGORY_AR.UNI_MANDATORY, categoryEn: CATEGORY_EN.UNI_MANDATORY, prereqs: ['ara-exam'] },
  { id: 'comp-rem',    nameAr: 'حاسوب استدراكي',                  nameEn: 'Remedial Computer',                 credits: 0, categoryAr: CATEGORY_AR.UNI_MANDATORY, categoryEn: CATEGORY_EN.UNI_MANDATORY, prereqs: ['comp-exam'] },
  { id: 'nat-edu',     nameAr: 'التربية الوطنية',                 nameEn: 'National Education',                credits: 3, categoryAr: CATEGORY_AR.UNI_MANDATORY, categoryEn: CATEGORY_EN.UNI_MANDATORY, prereqs: [] },
  { id: 'eng-lang',    nameAr: 'اللغة الإنجليزية',               nameEn: 'English Language',                  credits: 3, categoryAr: CATEGORY_AR.UNI_MANDATORY, categoryEn: CATEGORY_EN.UNI_MANDATORY, prereqs: [] },
  { id: 'ara-lang',    nameAr: 'اللغة العربية',                   nameEn: 'Arabic Language',                   credits: 3, categoryAr: CATEGORY_AR.UNI_MANDATORY, categoryEn: CATEGORY_EN.UNI_MANDATORY, prereqs: [] },
  { id: 'mil-sci',     nameAr: 'العلوم العسكرية',                 nameEn: 'Military Sciences',                 credits: 3, categoryAr: CATEGORY_AR.UNI_MANDATORY, categoryEn: CATEGORY_EN.UNI_MANDATORY, prereqs: [] },
  { id: 'leadership',  nameAr: 'القيادة والمسؤولية المجتمعية',   nameEn: 'Leadership & Community Responsibility', credits: 3, categoryAr: CATEGORY_AR.UNI_MANDATORY, categoryEn: CATEGORY_EN.UNI_MANDATORY, prereqs: [] },

  // ======================== متطلبات الكلية الإجبارية ========================
  { id: 'gen-chem-1',  nameAr: 'كيمياء عامة (1)',               nameEn: 'General Chemistry (1)',             credits: 3, categoryAr: CATEGORY_AR.COLLEGE_MANDATORY, categoryEn: CATEGORY_EN.COLLEGE_MANDATORY, prereqs: [] },
  { id: 'calc-1',      nameAr: 'تفاضل وتكامل (1)',              nameEn: 'Calculus (1)',                      credits: 3, categoryAr: CATEGORY_AR.COLLEGE_MANDATORY, categoryEn: CATEGORY_EN.COLLEGE_MANDATORY, prereqs: [] },
  { id: 'life-sci-1',  nameAr: 'علوم حياتية (1)',               nameEn: 'Life Sciences (1)',                 credits: 3, categoryAr: CATEGORY_AR.COLLEGE_MANDATORY, categoryEn: CATEGORY_EN.COLLEGE_MANDATORY, prereqs: [] },
  { id: 'gen-phys-1',  nameAr: 'فيزياء عامة (1)',               nameEn: 'General Physics (1)',               credits: 3, categoryAr: CATEGORY_AR.COLLEGE_MANDATORY, categoryEn: CATEGORY_EN.COLLEGE_MANDATORY, prereqs: [] },
  { id: 'cpp',         nameAr: 'لغة البرمجة ++C',               nameEn: 'C++ Programming Language',         credits: 3, categoryAr: CATEGORY_AR.COLLEGE_MANDATORY, categoryEn: CATEGORY_EN.COLLEGE_MANDATORY, prereqs: [] },
  { id: 'stats',       nameAr: 'طرق إحصائية',                   nameEn: 'Statistical Methods',               credits: 3, categoryAr: CATEGORY_AR.COLLEGE_MANDATORY, categoryEn: CATEGORY_EN.COLLEGE_MANDATORY, prereqs: [] },
  { id: 'env-sci',     nameAr: 'علوم بيئية عامة',               nameEn: 'General Environmental Sciences',   credits: 3, categoryAr: CATEGORY_AR.COLLEGE_MANDATORY, categoryEn: CATEGORY_EN.COLLEGE_MANDATORY, prereqs: [] },

  // ======================== متطلبات التخصص الإجبارية ========================
  { id: 'gen-chem-2',       nameAr: 'كيمياء عامة (2)',                        nameEn: 'General Chemistry (2)',                     credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['gen-chem-1'] },
  { id: 'life-sci-2',       nameAr: 'علوم حياتية (2)',                        nameEn: 'Life Sciences (2)',                         credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['life-sci-1'] },
  { id: 'life-sci-lab-1',   nameAr: 'علوم حياتية – عملي (1)',                nameEn: 'Life Sciences Lab (1)',                     credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['life-sci-1'] },
  { id: 'gen-chem-lab-1',   nameAr: 'كيمياء عامة – عملي (1)',                nameEn: 'General Chemistry Lab (1)',                 credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['gen-chem-1'] },
  { id: 'life-sci-lab-2',   nameAr: 'علوم حياتية – عملي (2)',                nameEn: 'Life Sciences Lab (2)',                     credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['life-sci-2'] },
  { id: 'invert-bio',       nameAr: 'بيولوجيا اللافقاريات',                  nameEn: 'Invertebrate Biology',                      credits: 2, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['life-sci-2'] },
  { id: 'invert-bio-lab',   nameAr: 'بيولوجيا اللافقاريات (عملي)',           nameEn: 'Invertebrate Biology (Lab)',                credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['invert-bio'] },
  { id: 'comp-anat',        nameAr: 'تشريح مقارن',                           nameEn: 'Comparative Anatomy',                       credits: 2, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['life-sci-2'] },
  { id: 'comp-anat-lab',    nameAr: 'تشريح مقارن (عملي)',                    nameEn: 'Comparative Anatomy (Lab)',                 credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['comp-anat'] },
  { id: 'plant-anat',       nameAr: 'تشريح نبات',                            nameEn: 'Plant Anatomy',                             credits: 2, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['life-sci-2'] },
  { id: 'plant-anat-lab',   nameAr: 'تشريح نبات (عملي)',                     nameEn: 'Plant Anatomy (Lab)',                       credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['plant-anat'] },
  { id: 'plant-morph',      nameAr: 'مورفولوجيا نبات',                       nameEn: 'Plant Morphology',                          credits: 2, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['life-sci-2'] },
  { id: 'plant-morph-lab',  nameAr: 'مورفولوجيا نبات (عملي)',                nameEn: 'Plant Morphology (Lab)',                    credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['plant-morph'] },
  { id: 'org-chem',         nameAr: 'كيمياء عضوية لغير طلبة الكيمياء',      nameEn: 'Organic Chemistry (Non-Chemistry)',         credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['gen-chem-2'] },
  { id: 'org-chem-lab',     nameAr: 'كيمياء عضوية عملي لغير طلبة الكيمياء',nameEn: 'Organic Chemistry Lab (Non-Chemistry)',     credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['org-chem'] },
  { id: 'cell-bio',         nameAr: 'بيولوجيا خلية',                         nameEn: 'Cell Biology',                              credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['life-sci-2'] },
  { id: 'bio-stats',        nameAr: 'إحصاء حيوي',                            nameEn: 'Biostatistics',                             credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['stats'] },
  { id: 'anim-physio',      nameAr: 'فسيولوجيا حيوان',                       nameEn: 'Animal Physiology',                         credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['comp-anat'] },
  { id: 'anim-physio-lab',  nameAr: 'فسيولوجيا حيوان (عملي)',                nameEn: 'Animal Physiology (Lab)',                   credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['anim-physio'] },
  { id: 'plant-physio',     nameAr: 'فسيولوجيا نبات',                        nameEn: 'Plant Physiology',                          credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['plant-anat'] },
  { id: 'plant-physio-lab', nameAr: 'فسيولوجيا نبات (عملي)',                 nameEn: 'Plant Physiology (Lab)',                    credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['plant-physio'] },
  { id: 'microbio',         nameAr: 'أحياء دقيقة',                           nameEn: 'Microbiology',                              credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['cell-bio'] },
  { id: 'microbio-lab',     nameAr: 'أحياء دقيقة (عملي)',                    nameEn: 'Microbiology (Lab)',                        credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['microbio'] },
  { id: 'biochem',          nameAr: 'كيمياء حيوية',                          nameEn: 'Biochemistry',                              credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['org-chem'] },
  { id: 'biochem-lab',      nameAr: 'كيمياء حيوية (عملي)',                   nameEn: 'Biochemistry (Lab)',                        credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['biochem'] },
  { id: 'genetics',         nameAr: 'علم الوراثة',                           nameEn: 'Genetics',                                  credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['cell-bio'] },
  { id: 'genetics-lab',     nameAr: 'علم الوراثة (عملي)',                    nameEn: 'Genetics (Lab)',                            credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['genetics'] },
  { id: 'histology',        nameAr: 'أنسجة وتحضير مجهري',                   nameEn: 'Histology and Microscopy',                  credits: 2, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['cell-bio'] },
  { id: 'histology-lab',    nameAr: 'أنسجة وتحضير مجهري (عملي)',             nameEn: 'Histology and Microscopy (Lab)',            credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['histology'] },
  { id: 'ecology',          nameAr: 'علم البيئة',                            nameEn: 'Ecology',                                   credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['life-sci-2'] },
  { id: 'hematology',       nameAr: 'علم الدم',                              nameEn: 'Hematology',                                credits: 2, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['anim-physio'] },
  { id: 'hematology-lab',   nameAr: 'علم الدم (عملي)',                       nameEn: 'Hematology (Lab)',                          credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['hematology'] },
  { id: 'immunology',       nameAr: 'علم المناعة',                           nameEn: 'Immunology',                                credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['microbio'] },
  { id: 'immunology-lab',   nameAr: 'علم المناعة (عملي)',                    nameEn: 'Immunology (Lab)',                          credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['immunology'] },
  { id: 'virology',         nameAr: 'علم الفيروسات',                         nameEn: 'Virology',                                  credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['microbio'] },
  { id: 'mol-bio',          nameAr: 'بيولوجيا جزئية',                        nameEn: 'Molecular Biology',                         credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['genetics'] },
  { id: 'mol-bio-lab',      nameAr: 'بيولوجيا جزئية (عملي)',                 nameEn: 'Molecular Biology (Lab)',                   credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['mol-bio'] },
  { id: 'evolution',        nameAr: 'التطور',                                nameEn: 'Evolution',                                 credits: 3, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['genetics'] },
  { id: 'biotech',          nameAr: 'تقنيات حيوية',                          nameEn: 'Biotechnology',                             credits: 2, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['mol-bio'] },
  { id: 'biotech-lab',      nameAr: 'تقنيات حيوية (عملي)',                   nameEn: 'Biotechnology (Lab)',                       credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: ['biotech'] },
  { id: 'seminar',          nameAr: 'ندوة',                                  nameEn: 'Seminar',                                   credits: 1, categoryAr: CATEGORY_AR.MAJOR_MANDATORY, categoryEn: CATEGORY_EN.MAJOR_MANDATORY, prereqs: [], minCredits: 100 },

  // ======================== متطلبات التخصص الاختيارية ========================
  { id: 'med-ethics',     nameAr: 'أخلاقيات طبية',            nameEn: 'Medical Ethics',               credits: 3, categoryAr: CATEGORY_AR.MAJOR_ELECTIVE, categoryEn: CATEGORY_EN.MAJOR_ELECTIVE, prereqs: [] },
  { id: 'zoo-princ',      nameAr: 'مبادئ علم الحيوان',        nameEn: 'Principles of Zoology',        credits: 3, categoryAr: CATEGORY_AR.MAJOR_ELECTIVE, categoryEn: CATEGORY_EN.MAJOR_ELECTIVE, prereqs: [] },
  { id: 'plant-tax',      nameAr: 'تصنيف النبات',             nameEn: 'Plant Taxonomy',               credits: 3, categoryAr: CATEGORY_AR.MAJOR_ELECTIVE, categoryEn: CATEGORY_EN.MAJOR_ELECTIVE, prereqs: [] },
  { id: 'org-farm',       nameAr: 'الزراعة العضوية',          nameEn: 'Organic Farming',              credits: 3, categoryAr: CATEGORY_AR.MAJOR_ELECTIVE, categoryEn: CATEGORY_EN.MAJOR_ELECTIVE, prereqs: [] },
  { id: 'parasitology',   nameAr: 'علم الطفيليات',            nameEn: 'Parasitology',                 credits: 3, categoryAr: CATEGORY_AR.MAJOR_ELECTIVE, categoryEn: CATEGORY_EN.MAJOR_ELECTIVE, prereqs: [] },
  { id: 'micro-genetics', nameAr: 'وراثة الأحياء الدقيقة',   nameEn: 'Microbial Genetics',           credits: 3, categoryAr: CATEGORY_AR.MAJOR_ELECTIVE, categoryEn: CATEGORY_EN.MAJOR_ELECTIVE, prereqs: [] },
  { id: 'env-micro',      nameAr: 'الأحياء الدقيقة البيئية', nameEn: 'Environmental Microbiology',   credits: 3, categoryAr: CATEGORY_AR.MAJOR_ELECTIVE, categoryEn: CATEGORY_EN.MAJOR_ELECTIVE, prereqs: [] },
  { id: 'bioinformatics', nameAr: 'الأحياء المعلوماتية',      nameEn: 'Bioinformatics',               credits: 3, categoryAr: CATEGORY_AR.MAJOR_ELECTIVE, categoryEn: CATEGORY_EN.MAJOR_ELECTIVE, prereqs: [] },

  // ======================== متطلبات الجامعة الاختيارية - علوم إنسانية ========================
  { id: 'library-sci',    nameAr: 'مدخل علم المكتبات',        nameEn: 'Introduction to Library Science', credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_HUMANITIES, categoryEn: CATEGORY_EN.UNI_ELECTIVE_HUMANITIES, prereqs: [] },
  { id: 'french',         nameAr: 'اللغة الفرنسية',           nameEn: 'French Language',                 credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_HUMANITIES, categoryEn: CATEGORY_EN.UNI_ELECTIVE_HUMANITIES, prereqs: [] },
  { id: 'islamic-cult',   nameAr: 'الثقافة الإسلامية',        nameEn: 'Islamic Culture',                 credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_HUMANITIES, categoryEn: CATEGORY_EN.UNI_ELECTIVE_HUMANITIES, prereqs: [] },
  { id: 'comm-skills',    nameAr: 'مهارات الاتصال',           nameEn: 'Communication Skills',            credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_HUMANITIES, categoryEn: CATEGORY_EN.UNI_ELECTIVE_HUMANITIES, prereqs: [] },
  { id: 'psychology',     nameAr: 'مبادئ علم النفس',          nameEn: 'Principles of Psychology',        credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_HUMANITIES, categoryEn: CATEGORY_EN.UNI_ELECTIVE_HUMANITIES, prereqs: [] },
  { id: 'education-prin', nameAr: 'مبادئ التربية',            nameEn: 'Principles of Education',         credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_HUMANITIES, categoryEn: CATEGORY_EN.UNI_ELECTIVE_HUMANITIES, prereqs: [] },
  { id: 'sports-edu',     nameAr: 'التربية الرياضية',          nameEn: 'Physical Education',              credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_HUMANITIES, categoryEn: CATEGORY_EN.UNI_ELECTIVE_HUMANITIES, prereqs: [] },

  // ======================== متطلبات الجامعة الاختيارية - علوم اجتماعية ========================
  { id: 'law',             nameAr: 'القانون في حياتنا',       nameEn: 'Law in Our Lives',             credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_SOCIAL, categoryEn: CATEGORY_EN.UNI_ELECTIVE_SOCIAL, prereqs: [] },
  { id: 'economics',       nameAr: 'الاقتصاد في حياتنا',      nameEn: 'Economics in Our Lives',       credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_SOCIAL, categoryEn: CATEGORY_EN.UNI_ELECTIVE_SOCIAL, prereqs: [] },
  { id: 'jerusalem-hist',  nameAr: 'تاريخ القدس',             nameEn: 'History of Jerusalem',         credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_SOCIAL, categoryEn: CATEGORY_EN.UNI_ELECTIVE_SOCIAL, prereqs: [] },
  { id: 'management',      nameAr: 'أساسيات الإدارة',         nameEn: 'Management Fundamentals',      credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_SOCIAL, categoryEn: CATEGORY_EN.UNI_ELECTIVE_SOCIAL, prereqs: [] },
  { id: 'entrepreneurship',nameAr: 'الريادة والابتكار',        nameEn: 'Entrepreneurship & Innovation',credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_SOCIAL, categoryEn: CATEGORY_EN.UNI_ELECTIVE_SOCIAL, prereqs: [] },
  { id: 'heritage',        nameAr: 'التراث الحضاري',          nameEn: 'Cultural Heritage',            credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_SOCIAL, categoryEn: CATEGORY_EN.UNI_ELECTIVE_SOCIAL, prereqs: [] },
  { id: 'media-edu',       nameAr: 'التربية الإعلامية',       nameEn: 'Media Education',              credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_SOCIAL, categoryEn: CATEGORY_EN.UNI_ELECTIVE_SOCIAL, prereqs: [] },

  // ======================== متطلبات الجامعة الاختيارية - تكنولوجيا وصحة ========================
  { id: 'astronomy',       nameAr: 'مقدمة علم الفلك',         nameEn: 'Introduction to Astronomy',    credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_TECH, categoryEn: CATEGORY_EN.UNI_ELECTIVE_TECH, prereqs: [] },
  { id: 'info-security',   nameAr: 'أمن المعلومات',           nameEn: 'Information Security',         credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_TECH, categoryEn: CATEGORY_EN.UNI_ELECTIVE_TECH, prereqs: [] },
  { id: 'internet-skills', nameAr: 'مهارات الإنترنت',          nameEn: 'Internet Skills',              credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_TECH, categoryEn: CATEGORY_EN.UNI_ELECTIVE_TECH, prereqs: [] },
  { id: 'radiation-safety',nameAr: 'الأمن الإشعاعي',          nameEn: 'Radiation Safety',             credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_TECH, categoryEn: CATEGORY_EN.UNI_ELECTIVE_TECH, prereqs: [] },
  { id: 'e-gov',           nameAr: 'مبادئ الحكومة الإلكترونية',nameEn: 'Principles of E-Government', credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_TECH, categoryEn: CATEGORY_EN.UNI_ELECTIVE_TECH, prereqs: [] },
  { id: 'chem-humans',     nameAr: 'الكيمياء والإنسان',       nameEn: 'Chemistry and Humans',         credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_TECH, categoryEn: CATEGORY_EN.UNI_ELECTIVE_TECH, prereqs: [] },
  { id: 'first-aid',       nameAr: 'الإسعافات الأولية',       nameEn: 'First Aid',                    credits: 3, categoryAr: CATEGORY_AR.UNI_ELECTIVE_TECH, categoryEn: CATEGORY_EN.UNI_ELECTIVE_TECH, prereqs: [] },
];
