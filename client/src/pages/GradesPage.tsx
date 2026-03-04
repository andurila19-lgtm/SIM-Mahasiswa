import React, { useState, useEffect } from 'react';
import {
    GraduationCap,
    Search,
    ChevronRight,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Layers,
    Star,
    Zap,
    CheckCircle2,
    Clock,
    ExternalLink,
    Printer,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Toast, { ToastType } from '../components/Toast';

interface Grade {
    id: number;
    code: string;
    name: string;
    sks: number;
    grade_letter: string;
    grade_point: number;
    lecturer: string;
}

const GradesPage: React.FC = () => {
    const { profile } = useAuth();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const fetchGrades = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            // 1. Fetch approved KRS to get the list of courses
            const { data: krsData, error: krsError } = await supabase
                .from('student_krs')
                .select('courses, status')
                .eq('student_id', profile.id)
                .single();

            if (krsError && krsError.code !== 'PGRST116') throw krsError;

            // 2. Fetch real locked grades
            const { data: gradesData, error: gradesError } = await supabase
                .from('student_grades')
                .select('class_id, grade_letter, final_score')
                .eq('student_id', profile.id)
                .eq('is_locked', true);

            const gradesMap: Record<string, any> = {};
            (gradesData || []).forEach(g => {
                gradesMap[g.class_id] = g;
            });

            if (krsData?.courses && (krsData.status === 'approved' || krsData.status === 'pending')) {
                const letterToPoint: Record<string, number> = {
                    'A': 4, 'A-': 3.75, 'B+': 3.5, 'B': 3, 'B-': 2.75,
                    'C+': 2.5, 'C': 2, 'D': 1, 'E': 0, 'N/A': 0
                };

                const coursesWithGrades = krsData.courses.map((c: any, i: number) => {
                    const gradeRecord = gradesMap[c.id] || gradesMap[c.class_id] || gradesMap[c.course_id];
                    const letter = gradeRecord?.grade_letter || 'N/A';
                    return {
                        id: i,
                        code: c.code,
                        name: c.name,
                        sks: c.sks,
                        grade_letter: letter,
                        grade_point: letterToPoint[letter] || 0,
                        lecturer: c.lecturer || 'Dosen Pengampu'
                    };
                });
                setGrades(coursesWithGrades);
            }
        } catch (err) {
            console.error('Fetch Grades Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, [profile]);

    const totalSKS = grades.reduce((acc, curr) => acc + curr.sks, 0);
    const totalPoints = grades.reduce((acc, curr) => acc + (curr.grade_point * curr.sks), 0);
    const gpa = totalSKS > 0 ? (totalPoints / totalSKS).toFixed(2) : '0.00';

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        showToast('Sedang menyiapkan PDF Transkrip...', 'info');
        setTimeout(() => {
            showToast('PDF Transkrip berhasil diunduh ke folder Downloads Anda.', 'success');
        }, 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <GraduationCap size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Transkrip & Nilai</h1>
                    <p className="text-slate-500 dark:text-slate-400">Pantau Kartu Hasil Studi (KHS) dan pencapaian akademik Anda.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10 no-print">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Printer size={18} />
                        Cetak KHS
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <Download size={18} />
                        Unduh PDF Transkrip
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Print Header (Only visible when printing) */}
            <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-6 text-center">
                <h1 className="text-2xl font-black uppercase tracking-widest mb-1">Kartu Hasil Studi (KHS)</h1>
                <h2 className="text-xl font-bold text-slate-700">SIM Akademik Universitas Digital</h2>
                <div className="mt-6 grid grid-cols-2 text-left text-sm gap-y-2 max-w-2xl mx-auto border p-4 rounded-xl">
                    <p><span className="font-bold inline-block w-24 tracking-tighter">Nama</span>: {profile?.full_name}</p>
                    <p><span className="font-bold inline-block w-24 tracking-tighter">Fakultas</span>: {profile?.faculty || '-'}</p>
                    <p><span className="font-bold inline-block w-24 tracking-tighter">NIM</span>: {profile?.nim_nip}</p>
                    <p><span className="font-bold inline-block w-24 tracking-tighter">Prodi</span>: {profile?.study_program || '-'}</p>
                    <p><span className="font-bold inline-block w-24 tracking-tighter">Semester</span>: {profile?.semester || '-'}</p>
                    <p><span className="font-bold inline-block w-24 tracking-tighter">Tahun</span>: {new Date().getFullYear()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats Column */}
                <div className="space-y-6 print:hidden">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 overflow-hidden relative group">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                            <Star size={20} className="fill-primary" />
                        </div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Indeks Prestasi Kumulatif</p>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4">{gpa}</h3>
                        <div className="flex items-center gap-2 text-green-500 font-bold text-xs bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl border border-green-100 dark:border-transparent w-fit">
                            <ArrowUpRight size={14} />
                            Top 5% Angkatan
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 -z-0"></div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-8 border border-white/5 shadow-2xl overflow-hidden relative group">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Total SKS Lulus</p>
                        <h3 className="text-4xl font-black text-white mb-8">{totalSKS} <span className="text-sm font-bold text-slate-500 italic">/ 144</span></h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Progres Kelulusan</span>
                                <span className="text-primary">{((totalSKS / 144) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(totalSKS / 144) * 100}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
                                />
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-8 text-white/5">
                            <Layers size={96} strokeWidth={1} />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6 print:col-span-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/10 print:hidden">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Kartu Hasil Studi (KHS)</h3>
                                <p className="text-xs text-slate-500 font-medium">Rekapitulasi nilai akademik Semester 5 (Genap).</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari matakuliah..."
                                        className="bg-slate-100 dark:bg-slate-800 border-none outline-none py-2.5 pl-10 pr-4 rounded-xl text-xs w-48 transition-all"
                                    />
                                </div>
                                <select className="bg-slate-100 dark:bg-slate-800 border-none outline-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all appearance-none cursor-pointer">
                                    <option>Ganjil 2023</option>
                                    <option>Genap 2023</option>
                                </select>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <div className="p-20 text-center">
                                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Nilai...</p>
                                </div>
                            ) : grades.length > 0 ? (
                                <div className="print:block">
                                    {/* Table Header for Print */}
                                    <div className="hidden print:grid grid-cols-6 p-4 font-black uppercase tracking-widest text-[10px] bg-slate-100 border-y">
                                        <div className="col-span-3">Matakuliah</div>
                                        <div className="text-center">SKS</div>
                                        <div className="text-center">Nilai</div>
                                        <div className="text-center">Bobot</div>
                                    </div>
                                    {grades.map((grade) => (
                                        <div key={grade.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group print:p-4 print:grid print:grid-cols-6 print:items-center">
                                            <div className="flex items-center gap-8 print:col-span-3">
                                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary/10 group-hover:text-primary transition-all border border-slate-100 dark:border-slate-700 shadow-sm print:hidden">
                                                    {grade.code.slice(0, 2)}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors text-base">{grade.name}</h4>
                                                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                        <span className="flex items-center gap-1.5"><Star size={12} className="opacity-60" /> {grade.code}</span>
                                                        <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-primary/80 print:hidden">{grade.sks} SKS</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-10 print:contents">
                                                <div className="hidden print:block text-center text-sm font-bold">{grade.sks}</div>
                                                <div className="text-right print:text-center">
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white group-hover:scale-110 transition-transform origin-right print:text-base">{grade.grade_letter}</p>
                                                    <p className="text-xs text-slate-400 font-medium italic opacity-60 tracking-tight print:hidden">{grade.grade_point.toFixed(2)} Bobot</p>
                                                </div>
                                                <div className="hidden print:block text-center text-sm font-bold">{(grade.grade_point * grade.sks).toFixed(2)}</div>
                                                <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all opacity-0 group-hover:opacity-100 print:hidden">
                                                    < ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                                        <X size={32} />
                                    </div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada nilai tervalidasi semester ini.</p>
                                    <p className="text-[10px] text-slate-400 mt-2 italic">Pastikan KRS Anda sudah disetujui DPA.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/10 print:bg-white print:border-slate-900 print:mt-4">
                            <p className="text-slate-500 font-medium italic print:hidden">Menampilkan {grades.length} mata kuliah tervalidasi. <span className="not-italic font-bold text-primary cursor-pointer hover:underline uppercase tracking-tighter">Lihat Seluruh Semester</span></p>
                            <p className="hidden print:block text-slate-500 font-bold uppercase tracking-widest">Total SKS: {totalSKS}</p>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg scale-90 border border-blue-100 dark:border-transparent print:bg-transparent print:text-slate-900 print:font-black print:text-lg print:scale-100 print:border-none"><Zap size={14} className="print:hidden" /> IP Semester: {gpa}</span>
                            </div>
                        </div>
                    </div>

                    {/* Print Signature Footer */}
                    <div className="hidden print:grid grid-cols-2 mt-20 gap-20 px-8">
                        <div className="text-center">
                            <p className="text-xs mb-20 uppercase tracking-widest font-black">Mengetahui,<br />Dosen Pembimbing Akademik</p>
                            <div className="w-48 border-b-2 border-slate-900 mx-auto mb-1"></div>
                            <p className="text-xs font-bold font-mono">NIDN. .........................</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs mb-20 uppercase tracking-widest font-black">Kepala Bagian Akademik</p>
                            <div className="w-48 border-b-2 border-slate-900 mx-auto mb-1"></div>
                            <p className="text-xs font-bold font-mono">NIP. .........................</p>
                        </div>
                    </div>
                </div>
            </div>

            <Toast
                isOpen={toast.isOpen}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, isOpen: false })}
            />
        </div>
    );
};

export default GradesPage;
