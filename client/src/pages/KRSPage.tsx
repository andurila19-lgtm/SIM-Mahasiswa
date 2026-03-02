import React, { useState } from 'react';
import {
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    X,
    Plus,
    Trash2,
    Info,
    ChevronRight,
    ShieldCheck,
    Zap,
    Save,
    Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { ACADEMIC_DATA } from '../config/academicData';

interface Course {
    id: string;
    code: string;
    name: string;
    sks: number;
    semester: number;
    lecturer: string;
    schedule: string;
    room: string;
    prodi: string;
    class_name: string;
}

const KRSPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { profile } = useAuth();

    // Check if we are managing a specific student from Student Management
    const targetStudent = location.state?.student;
    const isAcademicAdmin = !!targetStudent;

    const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
    const [selectedSemester, setSelectedSemester] = useState<number | 'all'>(targetStudent?.semester || 'all');
    const [selectedProdi, setSelectedProdi] = useState<string>(targetStudent?.study_program || 'all');
    const [selectedClass, setSelectedClass] = useState<string>('all');

    const mockAvailableCourses: Course[] = [
        { id: '1', code: 'TI601', name: 'Pemrograman Web II', sks: 3, semester: 6, lecturer: 'Dr. Ahmad Subarjo', schedule: 'Senin, 08:00 - 10:30', room: 'Lab Komp 02', prodi: 'Teknik Informatika (S1)', class_name: 'A' },
        { id: '2', code: 'TI602', name: 'Kecerdasan Buatan', sks: 3, semester: 6, lecturer: 'Ir. Budi Santoso, M.Kom', schedule: 'Selasa, 13:00 - 15:30', room: 'R. Teori 304', prodi: 'Teknik Informatika (S1)', class_name: 'B' },
        { id: '3', code: 'SI401', name: 'Manajemen Data', sks: 3, semester: 4, lecturer: 'Hendro Wijaya, M.T', schedule: 'Rabu, 08:00 - 10:30', room: 'R. Teori 202', prodi: 'Sistem Informasi (S1)', class_name: 'A' },
        { id: '4', code: 'FK101', name: 'Dasar Konseling', sks: 2, semester: 2, lecturer: 'Dr. Maria Ulfa', schedule: 'Kamis, 10:00 - 12:30', room: 'Lab Konsul', prodi: 'Bimbingan dan Konseling (S1)', class_name: 'C' },
        { id: '5', code: 'EB105', name: 'Pengantar Manajemen', sks: 2, semester: 2, lecturer: 'Hj. Ratna Sari, M.H', schedule: 'Jumat, 10:00 - 12:30', room: 'R. Teori 101', prodi: 'Manajemen (S1)', class_name: 'A' },
        { id: '6', code: 'SI405', name: 'Enterprise Architecture', sks: 3, semester: 4, lecturer: 'Prof. Bambang Pamungkas', schedule: 'Sabtu, 08:00 - 10:30', room: 'R. Teori 305', prodi: 'Sistem Informasi (S1)', class_name: 'B' },
        { id: '7', code: 'EB201', name: 'Akuntansi Biaya', sks: 3, semester: 4, lecturer: 'Mulyadi, M.Acc', schedule: 'Senin, 13:00 - 15:30', room: 'R. Teori 401', prodi: 'Akuntansi (S1)', class_name: 'A' },
        { id: '8', code: 'FS101', name: 'Farmakologi Dasar', sks: 3, semester: 2, lecturer: 'Apt. Sari Endah, M.Farm', schedule: 'Selasa, 08:00 - 10:30', room: 'Lab Farmasi', prodi: 'Farmasi (S1)', class_name: 'A' },
        { id: '9', code: 'HK101', name: 'Hukum Perdata', sks: 4, semester: 2, lecturer: 'Dr. Hotman Paris, S.H', schedule: 'Rabu, 13:00 - 16:30', room: 'R. Teori 501', prodi: 'Hukum (S1)', class_name: 'B' },
        { id: '10', code: 'PB601', name: 'Advanced Grammar', sks: 2, semester: 6, lecturer: 'Mr. John Doe', schedule: 'Kamis, 08:00 - 10:00', room: 'R. Bahasa', prodi: 'Pendidikan Bahasa Inggris (S1)', class_name: 'A' },
        { id: '11', code: 'PD701', name: 'Metodologi Penelitian', sks: 3, semester: 1, lecturer: 'Prof. Dr. Suhardi', schedule: 'Sabtu, 13:00 - 15:30', room: 'R. Pasca 01', prodi: 'Pendidikan Dasar (S2)', class_name: 'C' },
    ];

    const filteredCourses = mockAvailableCourses.filter(course =>
        (selectedSemester === 'all' || course.semester === selectedSemester) &&
        (selectedProdi === 'all' || course.prodi === selectedProdi) &&
        (selectedClass === 'all' || course.class_name === selectedClass)
    );

    const toggleCourse = (course: Course) => {
        if (selectedCourses.find(c => c.id === course.id)) {
            setSelectedCourses(selectedCourses.filter(c => c.id !== course.id));
        } else {
            if (totalSKS + course.sks > 24) {
                alert('Maksimal SKS yang dapat diambil adalah 24 SKS.');
                return;
            }
            setSelectedCourses([...selectedCourses, course]);
        }
    };

    const totalSKS = selectedCourses.reduce((sum, c) => sum + c.sks, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <BookOpen size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        {isAcademicAdmin ? `Kelola KRS: ${targetStudent.full_name}` : 'Pendaftaran KRS'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {isAcademicAdmin
                            ? `Mengatur rencana studi untuk NIM: ${targetStudent.nim_nip}`
                            : `Pilih mata kuliah Anda untuk Semester Genap 2023/2024.`}
                    </p>
                    {isAcademicAdmin && (
                        <button
                            onClick={() => navigate(-1)}
                            className="mt-4 flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                        >
                            <ChevronRight size={14} className="rotate-180" /> Kembali ke Manajemen Mahasiswa
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total SKS Terpilih</span>
                        <span className={cn("text-2xl font-black transition-colors", totalSKS > 20 ? "text-amber-500" : "text-primary")}>
                            {totalSKS} <span className="text-xs text-slate-400 font-bold">/ 24</span>
                        </span>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm font-sans no-print">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Program Studi</label>
                    <select
                        value={selectedProdi}
                        onChange={(e) => setSelectedProdi(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm cursor-pointer"
                    >
                        <option value="all">Semua Prodi</option>
                        {Object.entries(ACADEMIC_DATA).map(([faculty, prodis]) => (
                            <optgroup key={faculty} label={faculty}>
                                {prodis.map(prodi => (
                                    <option key={prodi} value={prodi}>{prodi}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Semester</label>
                    <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm cursor-pointer"
                    >
                        <option value="all">Semua Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kelas</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm cursor-pointer"
                    >
                        <option value="all">Semua Kelas</option>
                        <option value="A">Kelas A</option>
                        <option value="B">Kelas B</option>
                        <option value="C">Kelas C</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Course List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/10">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Zap size={18} className="text-amber-500 fill-amber-500" />
                                Mata Kuliah Tersedia
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        className={cn(
                                            "p-8 flex items-center justify-between transition-all group cursor-pointer",
                                            selectedCourses.find(c => c.id === course.id) ? "bg-primary/[0.02]" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                                        )}
                                        onClick={() => toggleCourse(course)}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-sm",
                                                selectedCourses.find(c => c.id === course.id) ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                                            )}>
                                                {selectedCourses.find(c => c.id === course.id) ? <CheckCircle2 size={24} /> : <Plus size={24} />}
                                            </div>
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors text-base">{course.name}</h4>
                                                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas {course.class_name}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary/60" /> {course.schedule}</span>
                                                    <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-primary/60" /> {course.prodi}</span>
                                                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-primary/80 bg-primary/5 px-2 py-0.5 rounded-md">{course.code} • {course.sks} SKS • Smtr {course.semester}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-medium italic">Dosen: {course.lecturer} • Ruang: {course.room}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))
                            ) : (
                                <div className="p-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                                        <X size={32} />
                                    </div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tidak ada mata kuliah yang sesuai filter</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Summary */}
            <div className="space-y-6">
                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                            <h3 className="text-white font-bold text-xl">Ringkasan KRS</h3>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black tracking-widest text-white uppercase border border-white/10">
                                Aktif
                            </div>
                        </div>

                        <div className="flex-1 space-y-6">
                            <AnimatePresence mode="popLayout">
                                {selectedCourses.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-10"
                                    >
                                        <p className="text-slate-500 text-sm font-medium italic">Belum ada mata kuliah yang dipilih.</p>
                                    </motion.div>
                                ) : (
                                    selectedCourses.map((course) => (
                                        <motion.div
                                            key={course.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex items-center justify-between group/item p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all shadow-sm"
                                        >
                                            <div className="flex flex-col gap-1 pr-4">
                                                <p className="text-sm font-bold text-white truncate max-w-[140px] leading-tight mb-1">{course.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{course.code} • {course.sks} SKS</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleCourse(course); }}
                                                className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="mt-12 space-y-4">
                            <div className="flex items-center justify-between text-white border-t border-white/10 pt-6 mb-8">
                                <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">Total SKS Terpilih</p>
                                <p className="text-3xl font-black text-primary">{totalSKS}</p>
                            </div>

                            <button className="w-full flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all transform active:scale-95">
                                <Send size={18} />
                                Ajukan KRS Sekarang
                            </button>
                            <button className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 text-white/70 font-bold rounded-2xl border border-white/5 transition-all text-xs uppercase tracking-widest">
                                <Save size={16} />
                                Simpan Draf
                            </button>
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[80px] -z-0"></div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                        <Info size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-2">Penting!</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic opacity-80 tracking-tight">Setiap perubahan KRS memerlukan persetujuan dari Dosen Pembimbing Akademik (DPA) sebelum jadwal perkuliahan dimulai.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KRSPage;
