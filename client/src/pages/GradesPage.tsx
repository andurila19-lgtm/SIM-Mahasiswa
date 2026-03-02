import React, { useState } from 'react';
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
    Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

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
    const [activeSemester, setActiveSemester] = useState(6);

    const mockGrades: Grade[] = [
        { id: 1, code: 'TI501', name: 'Sistem Basis Data', sks: 3, grade_letter: 'A', grade_point: 4.0, lecturer: 'Ir. Budi Santoso' },
        { id: 2, code: 'TI502', name: 'Jaringan Komputer', sks: 3, grade_letter: 'B+', grade_point: 3.5, lecturer: 'Hendro Wijaya, M.T' },
        { id: 3, code: 'TI503', name: 'Matematika Diskrit', sks: 2, grade_letter: 'A', grade_point: 4.0, lecturer: 'Dr. Maria Ulfa' },
        { id: 4, code: 'TI504', name: 'Sistem Operasi', sks: 3, grade_letter: 'A-', grade_point: 3.75, lecturer: 'Dr. Ahmad Subarjo' },
        { id: 5, code: 'TI505', name: 'Pancasila & Kewarganegaraan', sks: 2, grade_letter: 'A', grade_point: 4.0, lecturer: 'Hj. Ratna Sari, M.H' },
        { id: 6, code: 'TI506', name: 'Analisis Desain Sistem', sks: 3, grade_letter: 'B', grade_point: 3.0, lecturer: 'Prof. Bambang Pamungkas' },
    ];

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

                <div className="flex items-center gap-3 relative z-10">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        <Printer size={18} />
                        Cetak KHS
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        <Download size={18} />
                        Unduh PDF Transkrip
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats Column */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 overflow-hidden relative group">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                            <Star size={20} className="fill-primary" />
                        </div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Indeks Prestasi Kumulatif</p>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4">3.82</h3>
                        <div className="flex items-center gap-2 text-green-500 font-bold text-xs bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl border border-green-100 dark:border-transparent w-fit">
                            <ArrowUpRight size={14} />
                            Top 5% Angkatan
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 -z-0"></div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-8 border border-white/5 shadow-2xl overflow-hidden relative group">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Total SKS Lulus</p>
                        <h3 className="text-4xl font-black text-white mb-8">108 <span className="text-sm font-bold text-slate-500 italic">/ 144</span></h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Progres Kelulusan</span>
                                <span className="text-primary">75%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "75%" }}
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
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/10">
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
                            {mockGrades.map((grade) => (
                                <div key={grade.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary/10 group-hover:text-primary transition-all border border-slate-100 dark:border-slate-700 shadow-sm">
                                            {grade.code.slice(0, 2)}
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors text-base">{grade.name}</h4>
                                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                <span className="flex items-center gap-1.5"><Star size={12} className="opacity-60" /> {grade.code}</span>
                                                <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-primary/80">{grade.sks} SKS</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">{grade.grade_letter}</p>
                                            <p className="text-xs text-slate-400 font-medium italic opacity-60 tracking-tight">{grade.grade_point.toFixed(2)} Bobot</p>
                                        </div>
                                        <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                            < ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/10">
                            <p className="text-slate-500 font-medium italic">Menampilkan 6 mata kuliah tervalidasi. <span className="not-italic font-bold text-primary cursor-pointer hover:underline uppercase tracking-tighter">Lihat Seluruh Semester</span></p>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg scale-90 opacity-80"><Zap size={14} /> IP Semester: 3.75</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradesPage;
