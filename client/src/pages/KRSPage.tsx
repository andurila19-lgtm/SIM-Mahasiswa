import React, { useState, useEffect, useMemo } from 'react';
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
import SuccessNotification from '../components/SuccessNotification';
import Toast, { ToastType } from '../components/Toast';

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
    const [selectedClass, setSelectedClass] = useState<string>(targetStudent?.class_name || 'all');
    const [krsStatus, setKrsStatus] = useState<'draft' | 'pending' | 'approved'>('draft');

    // Notification state
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Toast state
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const mockAvailableCourses: Course[] = [];

    // Persist KRS per student
    useEffect(() => {
        const studentId = targetStudent?.nim_nip || profile?.id; // Fallback to self
        if (!studentId) return;

        const saved = localStorage.getItem(`krs_selected_${studentId}`);
        const savedStatus = localStorage.getItem(`krs_status_${studentId}`);

        if (saved) {
            setSelectedCourses(JSON.parse(saved));
        }
        if (savedStatus) {
            setKrsStatus(savedStatus as any);
        } else if (targetStudent?.study_program) {
            // Auto-select 21 SKS by default for all students based on prodi & semester
            const availableForProdi = mockAvailableCourses.filter(c =>
                c.prodi === targetStudent.study_program &&
                c.semester === targetStudent.semester &&
                (c.class_name === targetStudent.class_name || c.class_name === 'A')
            );

            let currentSKS = 0;
            const autoSelected: Course[] = [];

            for (const course of availableForProdi) {
                if (currentSKS + course.sks <= 24) {
                    autoSelected.push(course);
                    currentSKS += course.sks;
                    if (currentSKS >= 21) break;
                }
            }
            setSelectedCourses(autoSelected);
            // Save initial auto-selection
            localStorage.setItem(`krs_selected_${studentId}`, JSON.stringify(autoSelected));
        }
    }, [targetStudent, profile]);

    useEffect(() => {
        const studentId = targetStudent?.nim_nip || profile?.id;
        if (!studentId) return;

        localStorage.setItem(`krs_selected_${studentId}`, JSON.stringify(selectedCourses));
        localStorage.setItem(`krs_status_${studentId}`, krsStatus);
    }, [selectedCourses, krsStatus, targetStudent, profile]);

    const handleAjukanKRS = () => {
        if (selectedCourses.length === 0) {
            showToast('Silakan pilih mata kuliah terlebih dahulu.', 'error');
            return;
        }
        setKrsStatus('pending');
        setSuccessMessage(isAcademicAdmin ? 'KRS Mahasiswa berhasil diverifikasi!' : 'KRS berhasil diajukan! Menunggu persetujuan dosen pembimbing.');
        setShowSuccess(true);
    };

    const handleSimpanDraf = () => {
        setKrsStatus('draft');
        setSuccessMessage('Draf KRS berhasil disimpan.');
        setShowSuccess(true);
    };

    const filteredCourses = useMemo(() => {
        return mockAvailableCourses.filter(course =>
            (selectedSemester === 'all' || course.semester === selectedSemester) &&
            (selectedProdi === 'all' || course.prodi === selectedProdi) &&
            (selectedClass === 'all' || course.class_name === selectedClass)
        );
    }, [selectedSemester, selectedProdi, selectedClass]);

    const toggleCourse = (course: Course) => {
        // We allow both students and admins to edit now
        if (selectedCourses.find(c => c.id === course.id)) {
            setSelectedCourses(selectedCourses.filter(c => c.id !== course.id));
        } else {
            if (totalSKS + course.sks > 24) {
                showToast('Maksimal SKS yang dapat diambil adalah 24 SKS.', 'error');
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
                    {!isAcademicAdmin && (
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 border rounded-xl transition-all duration-500",
                            krsStatus === 'pending' ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                                krsStatus === 'approved' ? "bg-green-500/10 border-green-500/20 text-green-600" :
                                    "bg-slate-500/10 border-slate-500/20 text-slate-500"
                        )}>
                            <Clock size={16} className={cn(krsStatus === 'pending' && "animate-pulse")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {krsStatus === 'pending' ? 'Menunggu Konfirmasi Dosen' :
                                    krsStatus === 'approved' ? 'KRS Disetujui' : 'Status: Draf'}
                            </span>
                        </div>
                    )}
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
                        disabled={isAcademicAdmin}
                        className={cn(
                            "w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none transition-all font-bold text-sm cursor-pointer",
                            isAcademicAdmin ? "opacity-70 cursor-not-allowed border-dashed" : "focus:border-primary/50"
                        )}
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
                        disabled={isAcademicAdmin}
                        className={cn(
                            "w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none transition-all font-bold text-sm cursor-pointer",
                            isAcademicAdmin ? "opacity-70 cursor-not-allowed border-dashed" : "focus:border-primary/50"
                        )}
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
                        disabled={isAcademicAdmin}
                        className={cn(
                            "w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none transition-all font-bold text-sm cursor-pointer",
                            isAcademicAdmin ? "opacity-70 cursor-not-allowed border-dashed" : "focus:border-primary/50"
                        )}
                    >
                        <option value="all">Semua Kelas</option>
                        <option value="A">Kelas A</option>
                        <option value="B">Kelas B</option>
                        <option value="C">Kelas C</option>
                        <option value="D">Kelas D</option>
                        <option value="RPL">Kelas RPL</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Course List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/10">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Zap size={18} className="text-amber-500 fill-amber-500" />
                                Mata Kuliah Tersedia
                            </h3>
                            <button
                                onClick={() => showToast('Fitur Tambah Matkul Baru sedang dikembangkan.', 'info')}
                                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <Plus size={14} /> Tambah Matkul
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-12">Pilih</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hari</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Waktu</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mata Kuliah</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kelas</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SKS</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Smt</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Informasi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {filteredCourses.length > 0 ? (
                                        filteredCourses.map((course) => {
                                            const isSelected = selectedCourses.some(c => c.id === course.id);
                                            // Split schedule "Hari, 08:00 - 10:30"
                                            const scheduleParts = course.schedule.split(', ');
                                            const day = scheduleParts[0];
                                            const time = scheduleParts[1] || '-';
                                            const [start, end] = time.split(' - ');

                                            return (
                                                <tr
                                                    key={course.id}
                                                    className={cn(
                                                        "hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer",
                                                        isSelected && "bg-primary/[0.02]"
                                                    )}
                                                    onClick={() => toggleCourse(course)}
                                                >
                                                    <td className="p-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleCourse(course)}
                                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-transform active:scale-90"
                                                        />
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-slate-700 dark:text-slate-300">{day}</td>
                                                    <td className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span>{start}</span>
                                                            <span className="opacity-40">-</span>
                                                            <span>{end}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-xs font-black text-primary font-mono">{course.code}</td>
                                                    <td className="p-4">
                                                        <div className="space-y-0.5">
                                                            <div className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{course.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium italic">Dosen: {course.lecturer}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                                            {course.class_name}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm font-black text-slate-700 dark:text-slate-300 text-center">{course.sks}</td>
                                                    <td className="p-4 text-sm font-black text-slate-700 dark:text-slate-300 text-center">{course.semester}</td>
                                                    <td className="p-4 text-center">
                                                        <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-tighter border border-green-500/20 whitespace-nowrap">
                                                            Tepat Semester
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="p-20 text-center">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                                                    <X size={32} />
                                                </div>
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tidak ada mata kuliah yang sesuai filter</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
                                            {!isAcademicAdmin && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleCourse(course); }}
                                                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
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

                            {isAcademicAdmin ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 text-primary">
                                        <ShieldCheck size={20} />
                                        <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">
                                            Mode Pengelolaan Admin <br />
                                            <span className="text-[10px] opacity-70">Anda dapat mengubah KRS mahasiswa ini</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleAjukanKRS}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all transform active:scale-95"
                                    >
                                        <CheckCircle2 size={18} />
                                        Simpan & Verifikasi KRS
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleAjukanKRS}
                                        disabled={krsStatus === 'approved'}
                                        className={cn(
                                            "w-full flex items-center justify-center gap-3 py-4 font-bold rounded-2xl shadow-xl transition-all transform active:scale-95",
                                            krsStatus === 'pending' ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20" :
                                                "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                                        )}
                                    >
                                        <Send size={18} />
                                        {krsStatus === 'pending' ? 'Update Pengajuan' : 'Ajukan KRS Sekarang'}
                                    </button>
                                    {krsStatus === 'draft' && (
                                        <button
                                            onClick={handleSimpanDraf}
                                            className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 text-white/70 font-bold rounded-2xl border border-white/5 transition-all text-xs uppercase tracking-widest"
                                        >
                                            <Save size={16} />
                                            Simpan Draf
                                        </button>
                                    )}
                                </>
                            )}
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
            <SuccessNotification
                isOpen={showSuccess}
                message={successMessage}
                onClose={() => setShowSuccess(false)}
            />
            <Toast
                isOpen={toast.isOpen}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, isOpen: false })}
            />
        </div>
    );
};

export default KRSPage;
