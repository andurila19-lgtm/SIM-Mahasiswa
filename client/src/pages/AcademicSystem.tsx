import React, { useState } from 'react';
import {
    School,
    BookOpen,
    Users,
    Search,
    Filter,
    Calendar,
    Clock,
    MapPin,
    User,
    Plus,
    MoreVertical,
    Download,
    CheckCircle2,
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    Zap,
    Star,
    ExternalLink,
    Lock,
    GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Course {
    id: number;
    code: string;
    name: string;
    sks: number;
    semester: number;
    lecturer: string;
}

const AcademicSystem: React.FC = () => {
    const [activeTab, setActiveTab] = useState('courses');

    const mockCourses: Course[] = [
        { id: 1, code: 'TI601', name: 'Pemrograman Web II', sks: 3, semester: 6, lecturer: 'Dr. Ahmad Subarjo' },
        { id: 2, code: 'TI602', name: 'Kecerdasan Buatan', sks: 3, semester: 6, lecturer: 'Ir. Budi Santoso, M.Kom' },
        { id: 3, code: 'TI603', name: 'Audit Sistem Informasi', sks: 2, semester: 6, lecturer: 'Hendro Wijaya, M.T' },
        { id: 4, code: 'TI604', name: 'Metodologi Penelitian', sks: 2, semester: 6, lecturer: 'Dr. Maria Ulfa' },
        { id: 5, code: 'TI605', name: 'Etika Profesi IT', sks: 2, semester: 6, lecturer: 'Hj. Ratna Sari, M.H' },
        { id: 6, code: 'TI606', name: 'Cloud Computing', sks: 3, semester: 6, lecturer: 'Prof. Bambang Pamungkas' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <School size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Sistem Akademik</h1>
                    <p className="text-slate-500 dark:text-slate-400">Kelola kurikulum, jadwal perkuliahan, dan pengampu mata kuliah.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                        <Download size={18} />
                        Ekspor Kurikulum
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group active:scale-95">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        Tambah Data
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Column */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 overflow-hidden relative group">
                        <div className="space-y-1 relative z-10 px-2 py-4">
                            <button onClick={() => setActiveTab('courses')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'courses' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                <div className="flex items-center gap-4">
                                    <BookOpen size={18} />
                                    <span className="text-sm font-bold">Daftar Mata Kuliah</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'courses' ? "translate-x-1" : "opacity-0")} />
                            </button>
                            <button onClick={() => setActiveTab('classes')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'classes' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                <div className="flex items-center gap-4">
                                    <Calendar size={18} />
                                    <span className="text-sm font-bold">Jadwal & Kelas</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'classes' ? "translate-x-1" : "opacity-0")} />
                            </button>
                            <button onClick={() => setActiveTab('lecturers')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'lecturers' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                <div className="flex items-center gap-4">
                                    <User size={18} />
                                    <span className="text-sm font-bold">Data Dosen</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'lecturers' ? "translate-x-1" : "opacity-0")} />
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 -z-0"></div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative group">
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform border border-white/10 shadow-sm">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg mb-2">Statistik Akademik</h4>
                                <p className="text-slate-400 text-xs font-medium italic opacity-80 mb-8 leading-relaxed tracking-tight">Performa lulusan dan kualitas pengajaran periode Semester Ganjil.</p>
                                <button className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group/link cursor-pointer hover:gap-3 transition-all">
                                    Lihat Laporan Lengkap
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -z-0"></div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'courses' && (
                            <motion.div
                                key="courses"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/10">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Manajemen Kurikulum</h3>
                                        <p className="text-xs text-slate-500 font-medium">Daftar mata kuliah tervalidasi pada Program Studi aktif.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari Mata Kuliah..."
                                                className="bg-slate-100 dark:bg-slate-800 border-none outline-none py-2.5 pl-10 pr-4 rounded-xl text-xs w-48 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {mockCourses.map((course) => (
                                        <div key={course.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                            <div className="flex items-center gap-8">
                                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary/10 group-hover:text-primary transition-all border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    {course.code.slice(0, 2)}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors text-base">{course.name}</h4>
                                                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                        <span className="flex items-center gap-1.5"><Star size={12} className="opacity-60" /> {course.code}</span>
                                                        <span className="flex items-center gap-1.5"><User size={12} className="opacity-60" /> {course.lecturer}</span>
                                                        <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-primary/80">{course.sks} SKS</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                <MoreVertical size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'classes' && (
                            <motion.div
                                key="classes"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-8"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Jadwal & Kelas Aktif</h3>
                                        <p className="text-xs text-slate-500 font-medium">Monitoring ruangan dan jadwal perkuliahan hari ini.</p>
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 animate-pulse">
                                        Live: 12 Kelas Berjalan
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary/20 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-bold text-primary shadow-sm">
                                                    08:00 - 10:30
                                                </div>
                                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-white mb-2 group-hover:text-primary transition-colors">Pemrograman Web II - Kelas {String.fromCharCode(64 + i)}</h4>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1.5"><MapPin size={14} /> R. Lab 0{i}</span>
                                                <span className="flex items-center gap-1.5"><Users size={14} /> 40 Mhs</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'lecturers' && (
                            <motion.div
                                key="lecturers"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                            >
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/10">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Data Dosen Pengampu</h3>
                                    <p className="text-xs text-slate-500 font-medium">Informasi jabatan fungsional dan beban mengajar dosen.</p>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-bold shadow-sm">
                                                    D{i}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white group-hover:text-primary">Dosen Pengampu 0{i}, M.Kom</p>
                                                    <p className="text-xs text-slate-500">NIDN: 0411082xxx • Lektor Kepala</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded-lg">12 SKS</span>
                                                <ChevronRight size={18} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const ArrowRight: React.FC<{ size: number, className?: string }> = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
);

export default AcademicSystem;
