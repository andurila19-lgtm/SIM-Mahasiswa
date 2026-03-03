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
    Send,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
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
    // Normalize prodi comparison by cleaning degree suffix for initial filter
    const initialProdi = targetStudent?.study_program ? targetStudent.study_program : 'all';
    const [selectedProdi, setSelectedProdi] = useState<string>('all');
    const [selectedClass, setSelectedClass] = useState<string>(targetStudent?.class_name || 'all');
    const [krsStatus, setKrsStatus] = useState<'draft' | 'pending' | 'approved'>('draft');

    // Notification state
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeYearId, setActiveYearId] = useState<string | null>(null);
    const [hasUnpaidBills, setHasUnpaidBills] = useState(false);
    const [unpaidBillsAmount, setUnpaidBillsAmount] = useState(0);

    // Toast state
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [newCourseForm, setNewCourseForm] = useState({
        code: '',
        name: '',
        sks: 2,
        semester_recommended: 1,
        study_program_id: ''
    });

    const studentId = targetStudent?.id || profile?.id; // Standardize ID usage

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [isPeriodActive, setIsPeriodActive] = useState(true);
    const [prodiList, setProdiList] = useState<{ faculty: string; prodis: { id: string, name: string }[] }[]>([]);

    const checkKRSPeriod = async () => {
        const { data, error } = await supabase
            .from('academic_calendar')
            .select('*')
            .eq('type', 'krs')
            .maybeSingle();

        if (data) {
            const now = new Date();
            const start = new Date(data.start_date);
            const end = new Date(data.end_date);
            setIsPeriodActive(now >= start && now <= end);
        }
    };

    const checkPayments = async () => {
        if (!studentId || isAcademicAdmin) return;

        try {
            const { data, error } = await supabase
                .from('student_bills')
                .select('amount, status, category')
                .eq('student_id', studentId)
                .in('status', ['unpaid', 'pending', 'partial']);

            if (error) throw error;

            // Rule: Mahasiswa tidak bisa KRS jika belum lunas (UKT)
            const unpaidUKT = (data || []).filter(b => b.category === 'UKT');
            if (unpaidUKT.length > 0) {
                setHasUnpaidBills(true);
                setUnpaidBillsAmount(unpaidUKT.reduce((sum, b) => sum + b.amount, 0));
            } else {
                setHasUnpaidBills(false);
                setUnpaidBillsAmount(0);
            }
        } catch (err) {
            console.error('Check Payments Error:', err);
        }
    };

    const fetchAvailableCourses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*, study_programs(name, degree)')
                .order('name', { ascending: true });

            if (error) throw error;

            // Map table fields to Course interface
            const mapped = (data || []).map((c: any) => ({
                id: c.id,
                code: c.code,
                name: c.name,
                sks: c.sks || 2,
                semester: c.semester_recommended || 1,
                lecturer: 'Dosen Tetap',
                schedule: 'Senin, 08:00 - 10:00',
                room: 'A.101',
                prodi: c.study_programs ? `${c.study_programs.name} (${c.study_programs.degree || 'S1'})` : 'Umum',
                class_name: targetStudent?.class_name || 'Reguler'
            }));
            setAvailableCourses(mapped);
        } catch (err: any) {
            showToast('Gagal memuat mata kuliah: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Load KRS from Supabase
    const fetchKRS = async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            // First get active academic year
            const { data: yearData } = await supabase
                .from('academic_years')
                .select('id')
                .eq('is_active', true)
                .maybeSingle();

            if (yearData) {
                setActiveYearId(yearData.id);
            }

            const { data, error } = await supabase
                .from('student_krs')
                .select('*')
                .eq('student_id', studentId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setSelectedCourses(data.courses || []);
                setKrsStatus(data.status || 'draft');
            }
        } catch (err: any) {
            console.error('KRS Fetch Error:', err);
            showToast('Gagal memuat data KRS', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchProdis = async () => {
        const { data, error } = await supabase.from('study_programs').select('id, name, degree, faculty');
        if (!error && data) {
            const grouped: Record<string, { id: string, name: string }[]> = {};
            data.forEach((p: any) => {
                const faculty = p.faculty || 'Lainnya';
                if (!grouped[faculty]) grouped[faculty] = [];
                grouped[faculty].push({
                    id: p.id,
                    name: `${p.name} (${p.degree || 'S1'})`
                });
            });
            const list = Object.entries(grouped).map(([faculty, prodis]) => ({ faculty, prodis }));
            setProdiList(list);

            // If in management mode, auto-set filter to match student prodi
            if (targetStudent?.study_program) {
                let exactMatch = 'all';
                list.forEach(f => {
                    // Try to match the prodi name from student record with our database names
                    const found = f.prodis.find(p => p.name.includes(targetStudent.study_program));
                    if (found) exactMatch = found.name;
                });
                if (exactMatch !== 'all') {
                    setSelectedProdi(exactMatch);
                    // Also ensure class filter matches or is set to all
                    setSelectedClass('all');
                    return exactMatch;
                }
            }
            return 'all';
        }
    };

    const handleSaveNewCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Find study program ID if user typed a name or selected from prodiList
            let study_program_id = newCourseForm.study_program_id;

            // If it's a name, we might need a lookup, but for now let's hope it's an ID 
            // OR we just use the first match from our prodiList logic in a more advanced way

            const { error } = await supabase
                .from('courses')
                .insert([{
                    code: newCourseForm.code,
                    name: newCourseForm.name,
                    sks: newCourseForm.sks,
                    semester_recommended: newCourseForm.semester_recommended,
                    study_program_id: newCourseForm.study_program_id || null
                }]);

            if (error) throw error;

            setIsAddCourseModalOpen(false);
            fetchAvailableCourses();
            showToast('Mata kuliah baru berhasil ditambahkan!');
        } catch (err: any) {
            showToast('Gagal menambah mata kuliah: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            await Promise.all([
                fetchKRS(),
                fetchAvailableCourses(),
                checkKRSPeriod(),
                fetchProdis(),
                checkPayments()
            ]);
        };
        loadAll();
    }, [studentId]);

    // Auto-select packet if empty and is admin
    useEffect(() => {
        const autoSelect = async () => {
            if (isAcademicAdmin && selectedCourses.length === 0 && availableCourses.length > 0 && !loading && selectedProdi !== 'all') {
                handleAutoSelectSemester();
            }
        };
        autoSelect();
    }, [isAcademicAdmin, availableCourses.length, loading, selectedProdi]);

    const handleAjukanKRS = async () => {
        if (!studentId) return;
        if (hasUnpaidBills && !isAcademicAdmin) {
            showToast('Anda memiliki tunggakan UKT. Silakan lakukan pelunasan terlebih dahulu untuk mengisi KRS.', 'error');
            return;
        }
        if (!isPeriodActive && !isAcademicAdmin) {
            showToast('Masa pengisian KRS telah berakhir atau belum dibuka.', 'warning');
            return;
        }
        if (selectedCourses.length === 0) {
            showToast('Silakan pilih mata kuliah terlebih dahulu.', 'error');
            return;
        }

        setLoading(true);
        try {
            const nextStatus = isAcademicAdmin ? 'approved' : 'pending';
            const { error } = await supabase
                .from('student_krs')
                .upsert({
                    student_id: studentId,
                    courses: selectedCourses,
                    total_sks: totalSKS, // Pass this for DB validation
                    status: nextStatus,
                    academic_year_id: activeYearId,
                    semester: targetStudent?.semester || profile?.semester || 1,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                // Check for specific database trigger messages
                if (error.message.includes('tunggakan UKT')) {
                    showToast('Gagal: ' + error.message, 'error');
                } else if (error.message.includes('Maksimal pengambilan')) {
                    showToast('Gagal: ' + error.message, 'error');
                } else {
                    throw error;
                }
                return;
            }

            setKrsStatus(nextStatus);
            setSuccessMessage(isAcademicAdmin ? 'KRS Mahasiswa berhasil diverifikasi!' : 'KRS berhasil diajukan! Menunggu persetujuan dosen pembimbing.');
            setShowSuccess(true);
        } catch (err: any) {
            showToast('Gagal menyimpan KRS: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSimpanDraf = async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('student_krs')
                .upsert({
                    student_id: studentId,
                    courses: selectedCourses,
                    status: 'draft',
                    academic_year_id: activeYearId,
                    semester: targetStudent?.semester || profile?.semester || 1,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setKrsStatus('draft');
            setSuccessMessage('Draf KRS berhasil disimpan.');
            setShowSuccess(true);
        } catch (err: any) {
            showToast('Gagal menyimpan draf: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = useMemo(() => {
        return availableCourses.filter(course =>
            (selectedSemester === 'all' || course.semester === selectedSemester) &&
            (selectedProdi === 'all' || (course.prodi && course.prodi === selectedProdi)) &&
            (selectedClass === 'all' || (course.class_name && course.class_name === selectedClass))
        );
    }, [availableCourses, selectedSemester, selectedProdi, selectedClass]);

    const checkScheduleConflict = (newCourse: Course) => {
        // Simple conflict check (strict string match on schedule)
        // In real app, we would parse time ranges
        const conflict = selectedCourses.find(c => c.schedule === newCourse.schedule);
        return conflict;
    };

    const toggleCourse = (course: Course) => {
        if (selectedCourses.find(c => c.id === course.id)) {
            setSelectedCourses(selectedCourses.filter(c => c.id !== course.id));
        } else {
            if (totalSKS + course.sks > 24) {
                showToast('Maksimal SKS yang dapat diambil adalah 24 SKS.', 'error');
                return;
            }
            // Logic bentrok jadwal dinonaktifkan sementara karena akan diverifikasi oleh DPA
            /*
            const conflict = checkScheduleConflict(course);
            if (conflict) {
                showToast(`Bentrok Jadwal! Mata kuliah ini berbenturan dengan ${conflict.name}`, 'error');
                return;
            }
            */
            setSelectedCourses([...selectedCourses, course]);
        }
    };

    const handleAutoSelectSemester = () => {
        const semesterToSelect = targetStudent?.semester || 1;
        // Search in ALL available courses, not just current filtered view
        const paketCourses = availableCourses.filter(c =>
            c.semester === semesterToSelect &&
            (selectedProdi === 'all' || c.prodi === selectedProdi)
        );

        if (paketCourses.length === 0) {
            showToast(`Tidak ditemukan mata kuliah paket untuk Semester ${semesterToSelect}`, 'warning');
            return;
        }

        // Add all paket courses that aren't already selected
        const newSelections = [...selectedCourses];
        let addedCount = 0;

        paketCourses.forEach(pc => {
            if (!newSelections.find(s => s.id === pc.id)) {
                newSelections.push(pc);
                addedCount++;
            }
        });

        setSelectedCourses(newSelections);
        showToast(`Berhasil memilih ${addedCount} mata kuliah paket semester ini.`);
    };

    const totalSKS = selectedCourses.reduce((sum, c) => sum + c.sks, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-40">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <BookOpen size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        {isAcademicAdmin ? `Kelola KRS: ${targetStudent.full_name}` : 'Pendaftaran KRS'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
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
                            "flex items-center gap-2 px-5 py-2.5 border rounded-2xl transition-all duration-500",
                            krsStatus === 'pending' ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                                krsStatus === 'approved' ? "bg-green-500/10 border-green-500/20 text-green-600" :
                                    "bg-slate-500/10 border-slate-500/20 text-slate-500"
                        )}>
                            <Clock size={16} className={cn(krsStatus === 'pending' && "animate-pulse")} />
                            <span className="text-[11px] font-black uppercase tracking-widest">
                                {krsStatus === 'pending' ? 'Menunggu Konfirmasi' :
                                    krsStatus === 'approved' ? 'Diapproved' : 'Status: Draf'}
                            </span>
                        </div>
                    )}
                    <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col items-end shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total SKS Terpilih</span>
                        <span className={cn("text-3xl font-black transition-colors", totalSKS > 20 ? "text-amber-500" : "text-primary")}>
                            {totalSKS} <span className="text-xs text-slate-400 font-bold tracking-tight">/ 24</span>
                        </span>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm font-sans no-print">
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
                        {prodiList.length > 0 ? prodiList.map(({ faculty, prodis }) => (
                            <optgroup key={faculty} label={faculty}>
                                {prodis.sort((a, b) => a.name.localeCompare(b.name)).map(prodi => (
                                    <option key={prodi.id} value={prodi.name}>{prodi.name}</option>
                                ))}
                            </optgroup>
                        )) : Object.entries(ACADEMIC_DATA).map(([faculty, prodis]) => (
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

            {/* Payment Warning */}
            {hasUnpaidBills && !isAcademicAdmin && (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-500/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <AlertCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 mb-1 uppercase tracking-tight">Akses KRS Terkunci</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Anda memiliki tunggakan UKT sebesar <span className="font-black text-slate-900 dark:text-white">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(unpaidBillsAmount)}</span>. Pelunasan diperlukan untuk melanjutkan.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/payments')}
                        className="px-8 py-4 bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/20 hover:scale-[1.03] active:scale-95 transition-all"
                    >
                        Bayar Sekarang
                    </button>
                </motion.div>
            )}

            {/* Courses Table (Wide) */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                            <Zap size={20} className="fill-amber-500/20" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mata Kuliah Tersedia</h3>
                            <p className="text-xs text-slate-400 font-medium">Klik pada baris untuk memilih mata kuliah</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isAcademicAdmin && (
                            <button
                                onClick={handleAutoSelectSemester}
                                className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-green-500/10 uppercase tracking-widest"
                            >
                                <CheckCircle2 size={16} /> Pilih Paket
                            </button>
                        )}
                        {isAcademicAdmin && (
                            <button
                                onClick={() => {
                                    let studentProdiId = '';
                                    if (targetStudent?.study_program) {
                                        prodiList.forEach(f => {
                                            const match = f.prodis.find(p => p.name.startsWith(targetStudent.study_program));
                                            if (match) studentProdiId = match.id;
                                        });
                                    }
                                    setNewCourseForm({
                                        code: '',
                                        name: '',
                                        sks: 2,
                                        semester_recommended: targetStudent?.semester || 1,
                                        study_program_id: studentProdiId
                                    });
                                    setIsAddCourseModalOpen(true);
                                }}
                                className="bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-primary/10 uppercase tracking-widest"
                            >
                                <Plus size={16} /> Tambah Matkul
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">Pilih</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hari</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Waktu</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mata Kuliah</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kelas</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SKS</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Semester</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map((course) => {
                                    const isSelected = selectedCourses.some(c => c.id === course.id);
                                    const scheduleParts = course.schedule.split(', ');
                                    const day = scheduleParts[0];
                                    const time = scheduleParts[1] || '-';
                                    const [start, end] = time.split(' - ');

                                    return (
                                        <tr
                                            key={course.id}
                                            className={cn(
                                                "hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group cursor-pointer",
                                                isSelected && "bg-primary/[0.03]"
                                            )}
                                            onClick={() => toggleCourse(course)}
                                        >
                                            <td className="p-4 text-center">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center mx-auto transition-all",
                                                    isSelected ? "bg-primary border-primary text-white scale-110" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group-hover:border-primary/50"
                                                )}>
                                                    {isSelected && <CheckCircle2 size={14} />}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-bold text-slate-700 dark:text-slate-200">{day}</td>
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
                                                    <div className="text-[10px] text-slate-400 font-medium italic">Dosen Pengerampu: {course.lecturer}</div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                                    {course.class_name}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-black text-slate-700 dark:text-slate-200 text-center">{course.sks}</td>
                                            <td className="p-4 text-sm font-black text-slate-700 dark:text-slate-200 text-center">{course.semester}</td>
                                            <td className="p-4 text-center">
                                                {course.semester === targetStudent?.semester ? (
                                                    <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-tight border border-green-500/20">
                                                        Sesuai Paket
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-tight border border-slate-200 dark:border-slate-700 opacity-60">
                                                        MK Pilihan
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="p-24 text-center">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-200 dark:text-slate-700 mx-auto mb-6 shadow-inner">
                                            <BookOpen size={40} />
                                        </div>
                                        <h4 className="text-slate-900 dark:text-white font-bold text-lg mb-2">Tidak Ada Mata Kuliah</h4>
                                        <p className="text-slate-400 font-medium text-sm max-w-xs mx-auto mb-8">Data mata kuliah untuk filter yang Anda pilih tidak tersedia dalam sistem.</p>
                                        <button
                                            onClick={handleAutoSelectSemester}
                                            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            <Zap size={16} /> Ambil Paket Smt {targetStudent?.semester || 1}
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-6 relative overflow-hidden">
                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 shadow-sm relative z-10">
                        <Info size={28} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Panduan Pengisian</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Batas pengambilan SKS maksimal adalah 24 SKS. Pastikan Anda telah memilih mata kuliah yang sesuai dengan jadwal dan berkonsultasi dengan Dosen Pembimbing Akademik (DPA) sebelum melakukan pengajuan final.</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-lg flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-white mb-1">Status Verifikasi</h4>
                            <p className="text-sm text-white/40 font-medium uppercase tracking-widest">
                                {krsStatus === 'approved' ? 'Terverifikasi DPA' : 'Menunggu Verifikasi'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-white">{selectedCourses.length}</div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Matkul Terpilih</div>
                    </div>
                </div>
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-6 no-print">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-slate-900/95 backdrop-blur-2xl rounded-[3rem] p-5 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-between gap-8"
                >
                    <div className="pl-6 flex items-center gap-10 divide-x divide-white/10">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Total Bobot</span>
                            <span className="text-2xl font-black text-white tracking-tight">{totalSKS} <span className="text-xs font-bold text-white/20 tracking-normal">SKS</span></span>
                        </div>
                        <div className="pl-10 flex flex-col">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Mata Kuliah</span>
                            <span className="text-2xl font-black text-white tracking-tight">{selectedCourses.length} <span className="text-xs font-bold text-white/20 tracking-normal">Item</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!isAcademicAdmin && krsStatus === 'draft' && (
                            <button
                                onClick={handleSimpanDraf}
                                className="flex items-center gap-3 px-8 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-3xl transition-all border border-white/10 hover:border-white/20"
                            >
                                <Save size={18} /> Simpan Draf
                            </button>
                        )}
                        <button
                            onClick={handleAjukanKRS}
                            disabled={loading || (hasUnpaidBills && !isAcademicAdmin)}
                            className="flex items-center gap-4 px-12 py-5 bg-primary text-white font-black text-sm uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                        >
                            <Send size={20} /> {isAcademicAdmin ? 'Verifikasi & Simpan Final' : 'Ajukan KRS Sekarang'}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Notifications & Modals */}
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

            <AnimatePresence>
                {isAddCourseModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddCourseModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-10 relative z-10 shadow-2xl border border-slate-200 dark:border-slate-800">
                            <h2 className="text-2xl font-black mb-8 text-slate-900 dark:text-white uppercase tracking-tight">Tambah Mata Kuliah</h2>
                            <form onSubmit={handleSaveNewCourse} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Program Studi Target</label>
                                    <select
                                        required
                                        value={newCourseForm.study_program_id}
                                        onChange={e => setNewCourseForm({ ...newCourseForm, study_program_id: e.target.value })}
                                        className="w-full p-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                    >
                                        <option value="">Pilih Program Studi</option>
                                        {prodiList.map(({ faculty, prodis }) => (
                                            <optgroup key={faculty} label={faculty}>
                                                {prodis.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kode MK</label>
                                        <input required placeholder="IF101" value={newCourseForm.code} onChange={e => setNewCourseForm({ ...newCourseForm, code: e.target.value.toUpperCase() })} className="w-full p-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bobot SKS</label>
                                        <input type="number" required min="1" max="6" value={newCourseForm.sks} onChange={e => setNewCourseForm({ ...newCourseForm, sks: parseInt(e.target.value) })} className="w-full p-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Mata Kuliah</label>
                                    <input required placeholder="Contoh: Algoritma dan Struktur Data" value={newCourseForm.name} onChange={e => setNewCourseForm({ ...newCourseForm, name: e.target.value })} className="w-full p-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Semester Rekomendasi</label>
                                    <input type="number" required min="1" max="8" value={newCourseForm.semester_recommended} onChange={e => setNewCourseForm({ ...newCourseForm, semester_recommended: parseInt(e.target.value) })} className="w-full p-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={() => setIsAddCourseModalOpen(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">Batal</button>
                                    <button type="submit" className="flex-[2] py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest">Simpan Data</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KRSPage;
