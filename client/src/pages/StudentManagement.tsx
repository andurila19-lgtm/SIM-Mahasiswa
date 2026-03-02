import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Search,
    Plus,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    GraduationCap,
    CheckCircle2,
    Clock,
    XCircle,
    Download,
    ChevronRight,
    Edit2,
    Trash2,
    X,
    ClipboardCheck,
    FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { ACADEMIC_DATA } from '../config/academicData';
import { saveAs } from 'file-saver';
import Toast, { ToastType } from '../components/Toast';

interface Student {
    id: string;
    full_name: string;
    nim_nip: string;
    email: string;
    role: string;
    status: 'active' | 'inactive' | 'pending';
    faculty: string;
    study_program: string;
    semester: number;
    class_name: string;
    avatar_url?: string;
}


const StudentManagement: React.FC = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>(() => {
        const saved = localStorage.getItem('sim_students');
        // We define normalization locally here since the helper is defined later
        const normalize = (data: any[]) => data.map(s => {
            let faculty = s.faculty || '';
            let prodi = s.study_program || '';
            if (faculty === 'Teknologi Informasi' || faculty === 'Teknik') {
                faculty = 'Fakultas Teknik (FT)';
                if (prodi === 'Informatika') prodi = 'Teknik Informatika (S1)';
            } else if (faculty === 'Ekonomi & Bisnis') {
                faculty = 'Fakultas Ekonomi dan Bisnis (FEB)';
            }
            const firstName = (s.full_name || '').trim().split(' ')[0].toLowerCase();
            const email = (s.nim_nip && firstName) ? `${firstName}_${s.nim_nip}@student.ac.id` : s.email;
            return { ...s, faculty, study_program: prodi, email, class_name: s.class_name || 'A' };
        });

        if (saved) return normalize(JSON.parse(saved));
        return [];
    });

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    // Persist to LocalStorage whenever students list changes
    useEffect(() => {
        localStorage.setItem('sim_students', JSON.stringify(students));
    }, [students]);

    const normalizeStudentData = (data: Student[]): Student[] => {
        return data.map(s => {
            let faculty = s.faculty || '';
            let prodi = s.study_program || '';

            // Normalize Faculty
            if (faculty === 'Teknologi Informasi' || faculty === 'Teknik') {
                faculty = 'Fakultas Teknik (FT)';
                if (prodi === 'Informatika') prodi = 'Teknik Informatika (S1)';
            } else if (faculty === 'Ekonomi & Bisnis') {
                faculty = 'Fakultas Ekonomi dan Bisnis (FEB)';
            }

            // Normalize Email (namaadepan_nim@student.ac.id)
            const firstName = (s.full_name || '').trim().split(' ')[0].toLowerCase();
            const email = (s.nim_nip && firstName)
                ? `${firstName}_${s.nim_nip}@student.ac.id`
                : s.email;

            return { ...s, faculty, study_program: prodi, email, class_name: s.class_name || 'A' };
        });
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'mahasiswa')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Once we have data (even an empty array), we trust the DB and clear mock/local data
                setStudents(normalizeStudentData(data as Student[]));
                // Clear from localStorage if DB returns empty to sync deletion across sessions
                if (data.length === 0) {
                    localStorage.removeItem('sim_students');
                }
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedStudent) return;

        // Optimistic update
        setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
        setIsDeleteModalOpen(false);

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', selectedStudent.id);

            if (error) throw error;

            // Success notification or log
            console.log('Student deleted successfully from Supabase');
        } catch (err: any) {
            console.error('Error deleting student:', err);
            // Revert state if sync fails
            showToast(`Gagal menghapus: ${err.message || 'Izin ditolak'}`, 'error');
            fetchStudents();
        } finally {
            setSelectedStudent(null);
        }
    };

    const [formData, setFormData] = useState({
        full_name: '',
        nim_nip: '',
        email: '',
        status: 'active' as 'active' | 'inactive',
        faculty: '',
        study_program: '',
        semester: 1,
        class_name: 'A'
    });

    useEffect(() => {
        if (selectedStudent) {
            // Helper to migrate old faculty names to new labels
            const getMigratedFaculty = (f: string) => {
                if (f === 'Teknologi Informasi') return 'Fakultas Teknik (FT)';
                if (f === 'Ekonomi & Bisnis') return 'Fakultas Ekonomi dan Bisnis (FEB)';
                return f;
            };

            const migratedFaculty = getMigratedFaculty(selectedStudent.faculty || '');

            setFormData({
                full_name: selectedStudent.full_name,
                nim_nip: selectedStudent.nim_nip,
                email: selectedStudent.email || '',
                status: selectedStudent.status as any,
                faculty: migratedFaculty,
                study_program: selectedStudent.study_program || '',
                semester: selectedStudent.semester || 1,
                class_name: selectedStudent.class_name || 'A'
            });
        } else {
            setFormData({
                full_name: '',
                nim_nip: '',
                email: '',
                status: 'active',
                faculty: '',
                study_program: '',
                semester: 1,
                class_name: 'A'
            });
        }
    }, [selectedStudent, isAddModalOpen]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.full_name || !formData.nim_nip) return;

        setLoading(true);
        try {
            if (selectedStudent) {
                // Update existing
                const profileUpdate = {
                    full_name: formData.full_name,
                    nim_nip: formData.nim_nip,
                    email: formData.email,
                    status: formData.status,
                    faculty: formData.faculty,
                    study_program: formData.study_program,
                    semester: formData.semester,
                    class_name: formData.class_name
                };

                const { error } = await supabase
                    .from('profiles')
                    .update(profileUpdate)
                    .eq('id', selectedStudent.id);

                if (error) throw error;

                const updatedStudent = { ...selectedStudent, ...formData };
                setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updatedStudent : s));
            } else {
                // Insert new student record
                // Note: For a real app, this should generate a Firebase User too.
                // For now, we use a random UUID-like string for the profile ID.
                const newId = crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9);
                const firstName = formData.full_name.trim().split(' ')[0].toLowerCase();
                const newEmail = formData.email || `${firstName}_${formData.nim_nip}@student.ac.id`;

                const newStudentData = {
                    id: newId,
                    ...formData,
                    email: newEmail,
                    role: 'mahasiswa'
                };

                const { error } = await supabase
                    .from('profiles')
                    .insert([newStudentData]);

                if (error) throw error;

                setStudents(prev => [newStudentData as Student, ...prev]);
            }

            setIsAddModalOpen(false);
            setSelectedStudent(null);
            showToast(selectedStudent ? 'Data berhasil diperbarui!' : 'Mahasiswa berhasil ditambahkan!');
        } catch (err: any) {
            console.error('Error saving student:', err);
            showToast('Gagal menyimpan data: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        const excelData = displayStudents.map(s => ({
            'Nama Lengkap': s.full_name,
            'NIM / NIP': s.nim_nip,
            'Fakultas': s.faculty,
            'Prodi': s.study_program,
            'Semester': s.semester,
            'Email': s.email,
            'Status': s.status.toUpperCase()
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Mahasiswa");

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `Data_Mahasiswa_${new Date().getTime()}.xlsx`);
        setIsExportMenuOpen(false);
    };

    const filteredStudents = students.filter(s =>
        (s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.nim_nip?.includes(searchTerm)) &&
        (filterStatus === 'all' || s.status === filterStatus)
    );

    const displayStudents = filteredStudents;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section (Web & Mobile) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative group no-print">
                <div className="relative z-10 text-center lg:text-left">
                    <div className="flex flex-col lg:flex-row items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                            <Users size={28} />
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Manajemen Mahasiswa</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Total {displayStudents.length} Mahasiswa terdaftar dalam sistem.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
                    <div className="relative w-full sm:w-auto">
                        <button
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                        >
                            <Download size={18} />
                            Export Data
                        </button>

                        <AnimatePresence>
                            {isExportMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsExportMenuOpen(false)}
                                    ></div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-30"
                                    >
                                        <button
                                            onClick={() => { window.print(); setIsExportMenuOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                        >
                                            <div className="w-8 h-8 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center">
                                                <X size={16} />
                                            </div>
                                            Export PDF
                                        </button>
                                        <button
                                            onClick={handleExportExcel}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                        >
                                            <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                                                <ClipboardCheck size={16} />
                                            </div>
                                            Export Excel
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all transform active:scale-95"
                    >
                        <Plus size={18} />
                        Tambah Mahasiswa
                    </button>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="print-only mb-8 text-center border-b-2 border-slate-800 pb-6">
                <h1 className="text-2xl font-bold uppercase tracking-widest mb-1">Daftar Mahasiswa</h1>
                <p className="text-sm font-medium">Sistem Informasi Manajemen Mahasiswa Terpadu</p>
                <p className="text-xs text-slate-500 mt-2">Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans no-print">
                <form
                    onSubmit={(e) => e.preventDefault()}
                    className="md:col-span-2 relative group"
                >
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama atau NIM..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-4 pl-14 pr-12 rounded-2xl text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/5 transition-all text-sm font-medium"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </form>
                <div className="relative group">
                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-4 pl-14 pr-10 rounded-2xl text-slate-700 dark:text-slate-200 focus:border-primary/50 transition-all text-sm font-bold cursor-pointer"
                    >
                        <option value="all">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Non-Aktif</option>
                    </select>
                </div>
            </div>

            {/* Students Table */}
            {/* Table/Card View Toggle Container */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Mobile View: Cards */}
                <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
                    {displayStudents.map((student) => (
                        <div key={student.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    {student.avatar_url ? (
                                        <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">{student.full_name.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{student.full_name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wider">{student.nim_nip}</p>
                                </div>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    student.status === 'active' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-red-50 dark:bg-red-500/10 text-red-600"
                                )}>
                                    {student.status}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Program Studi</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{student.study_program}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Semester/Kelas</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{student.semester} - {student.class_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    onClick={() => { setSelectedStudent(student); setIsAddModalOpen(true); }}
                                    className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={14} /> Detail
                                </button>
                                <button
                                    onClick={() => { setSelectedStudent(student); setIsDeleteModalOpen(true); }}
                                    className="w-12 h-12 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden lg:block overflow-x-auto print-full-width">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Fakultas / Prodi</th>
                                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Semester</th>
                                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Kontak</th>
                                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest no-print">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {displayStudents.map((student) => (
                                <motion.tr
                                    key={student.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center text-primary font-bold">
                                                {student.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{student.full_name}</p>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">NIM: {student.nim_nip}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{student.faculty}</span>
                                            <span className="text-[11px] text-slate-400 font-medium">{student.study_program}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-black text-slate-700 dark:text-slate-200">
                                        <div className="flex flex-col">
                                            <span>Semester {student.semester}</span>
                                            <span className="text-[10px] text-primary/70 font-bold uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg w-fit mt-1">Kelas {student.class_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                            <Mail size={14} />
                                            {student.email}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
                                            student.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                        )}>
                                            {student.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                            {student.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right no-print">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => navigate('/krs', { state: { student } })}
                                                className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="Kelola KRS"
                                            >
                                                <FileText size={18} />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedStudent(student); setIsAddModalOpen(true); }}
                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedStudent(student); setIsDeleteModalOpen(true); }}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Tambah/Edit Mahasiswa */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden font-sans"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {selectedStudent ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru'}
                                </h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <form
                                onSubmit={handleSave}
                                className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                        placeholder="Contoh: Ahmad Wijaya"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                        placeholder="ahmad@student.ac.id"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">NIM / NIP</label>
                                        <input
                                            type="text"
                                            value={formData.nim_nip}
                                            onChange={(e) => setFormData({ ...formData, nim_nip: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                            placeholder="21.05.xxxx"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Semester</label>
                                        <select
                                            value={formData.semester}
                                            onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm cursor-pointer"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(s => (
                                                <option key={s} value={s}>Semester {s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Kelas</label>
                                        <select
                                            value={formData.class_name}
                                            onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm cursor-pointer"
                                        >
                                            {['A', 'B', 'C', 'D', 'RPL'].map(c => (
                                                <option key={c} value={c}>Kelas {c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Fakultas</label>
                                        <select
                                            value={formData.faculty}
                                            onChange={(e) => setFormData({ ...formData, faculty: e.target.value, study_program: ACADEMIC_DATA[e.target.value as keyof typeof ACADEMIC_DATA]?.[0] || '' })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm cursor-pointer"
                                        >
                                            <option value="">Pilih Fakultas</option>
                                            {Object.keys(ACADEMIC_DATA).map(f => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Program Studi</label>
                                        <select
                                            value={formData.study_program}
                                            onChange={(e) => setFormData({ ...formData, study_program: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm cursor-pointer"
                                            disabled={!formData.faculty}
                                        >
                                            <option value="">Pilih Program Studi</option>
                                            {formData.faculty && ACADEMIC_DATA[formData.faculty as keyof typeof ACADEMIC_DATA]?.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Non-Aktif</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
                                >
                                    Simpan Perubahan
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Konfirmasi Hapus */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></motion.div>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative z-10 text-center">
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Hapus Mahasiswa?</h3>
                            <p className="text-slate-500 text-sm mb-8">Data <b>{selectedStudent?.full_name}</b> akan dihapus permanen dari sistem.</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all">Batal</button>
                                <button onClick={handleDelete} className="py-3.5 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all">Ya, Hapus</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast
                isOpen={toast.isOpen}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, isOpen: false })}
            />
        </div>
    );
};

export default StudentManagement;
