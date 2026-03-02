import React, { useState, useEffect, useMemo } from 'react';
import {
    CreditCard,
    Plus,
    Search,
    X,
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    ChevronDown,
    Trash2,
    Edit3,
    FileText,
    Filter,
    RefreshCw,
    Send,
    Calendar,
    DollarSign,
    UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import Toast, { ToastType } from '../components/Toast';

// ─── Types ───────────────────────────────────────────────────────────
interface StudentProfile {
    id: string;
    full_name: string;
    nim_nip: string;
    email: string;
    role: string;
    faculty?: string;
    study_program?: string;
}

interface Bill {
    id: string;
    student_id: string;
    description: string;
    amount: number;
    status: 'unpaid' | 'pending' | 'paid';
    created_at: string;
    due_date?: string;
    payment_method?: string;
    proof_url?: string;
    semester?: string;
    category?: string;
    profiles?: {
        full_name: string;
        nim_nip: string;
        email: string;
        faculty?: string;
        study_program?: string;
    };
}

type BillCategory = 'UKT' | 'SPP' | 'Praktikum' | 'Wisuda' | 'Her-registrasi' | 'Lainnya';

const semesterOptions = Array.from({ length: 14 }, (_, i) => `Semester ${i + 1}`);

const fakultasProdiMap: Record<string, string[]> = {
    'Fakultas Teknik': ['Teknik Informatika', 'Teknik Sipil', 'Teknik Elektro', 'Teknik Mesin', 'Teknik Industri'],
    'Fakultas Ekonomi & Bisnis': ['Manajemen', 'Akuntansi', 'Ekonomi Pembangunan', 'Bisnis Digital'],
    'Fakultas Hukum': ['Ilmu Hukum'],
    'Fakultas Kedokteran': ['Pendidikan Dokter', 'Keperawatan', 'Farmasi', 'Kesehatan Masyarakat'],
    'Fakultas MIPA': ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Statistika'],
    'Fakultas Ilmu Sosial & Politik': ['Ilmu Komunikasi', 'Ilmu Politik', 'Sosiologi', 'Administrasi Publik'],
    'Fakultas Pertanian': ['Agroteknologi', 'Agribisnis', 'Teknologi Pangan'],
    'Fakultas Keguruan & Ilmu Pendidikan': ['Pendidikan Matematika', 'Pendidikan Bahasa Inggris', 'Pendidikan Guru SD', 'Pendidikan Bahasa Indonesia'],
};

const fakultasList = Object.keys(fakultasProdiMap);

// ─── Component ───────────────────────────────────────────────────────
const StudentBillsPage: React.FC = () => {
    // Data
    const [bills, setBills] = useState<Bill[]>([]);
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'pending' | 'paid'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    // Form state (single)
    const [formStudentId, setFormStudentId] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formCategory, setFormCategory] = useState<BillCategory>('UKT');
    const [formSemester, setFormSemester] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Form state (bulk)
    const [bulkSemester, setBulkSemester] = useState('');
    const [bulkDescription, setBulkDescription] = useState('');
    const [bulkAmount, setBulkAmount] = useState('');
    const [bulkCategory, setBulkCategory] = useState<BillCategory>('UKT');
    const [bulkDueDate, setBulkDueDate] = useState('');
    const [bulkSubmitting, setBulkSubmitting] = useState(false);
    const [bulkFakultas, setBulkFakultas] = useState('');
    const [bulkProdi, setBulkProdi] = useState('');

    // Student search in modal
    const [studentSearch, setStudentSearch] = useState('');

    // Toast
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });
    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    // ─── Fetch ───────────────────────────────────────────────────────
    const fetchBills = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const { data, error } = await supabase
                .from('student_bills')
                .select(`
                    *,
                    profiles:student_id (
                        full_name,
                        nim_nip,
                        email,
                        faculty,
                        study_program
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBills((data as Bill[]) || []);
        } catch (err: any) {
            console.error('Fetch bills error:', err);
            showToast('Gagal memuat data tagihan: ' + err.message, 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, nim_nip, email, role, faculty, study_program')
                .eq('role', 'mahasiswa')
                .order('full_name');

            if (error) throw error;
            setStudents(data || []);
        } catch (err: any) {
            console.error('Fetch students error:', err);
        }
    };

    useEffect(() => {
        fetchBills();
        fetchStudents();
    }, []);

    // ─── Derived Data ────────────────────────────────────────────────
    const stats = useMemo(() => {
        const totalAmount = bills.reduce((s, b) => s + b.amount, 0);
        const paidAmount = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0);
        const unpaidAmount = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.amount, 0);
        const pendingCount = bills.filter(b => b.status === 'pending').length;
        const unpaidCount = bills.filter(b => b.status === 'unpaid').length;
        const paidCount = bills.filter(b => b.status === 'paid').length;
        return { totalAmount, paidAmount, unpaidAmount, pendingCount, unpaidCount, paidCount };
    }, [bills]);

    const filteredBills = useMemo(() => {
        return bills.filter(b => {
            const matchSearch =
                b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.profiles?.nim_nip?.includes(searchTerm) ||
                '';
            const matchStatus = filterStatus === 'all' || b.status === filterStatus;
            const matchCategory = filterCategory === 'all' || b.category === filterCategory;
            return matchSearch && matchStatus && matchCategory;
        });
    }, [bills, searchTerm, filterStatus, filterCategory]);

    const filteredStudents = useMemo(() => {
        if (!studentSearch) return students;
        const q = studentSearch.toLowerCase();
        return students.filter(s =>
            s.full_name.toLowerCase().includes(q) ||
            s.nim_nip?.includes(q) ||
            s.email.toLowerCase().includes(q)
        );
    }, [students, studentSearch]);

    // ─── Handlers ────────────────────────────────────────────────────
    const resetForm = () => {
        setFormStudentId('');
        setFormDescription('');
        setFormAmount('');
        setFormCategory('UKT');
        setFormSemester('');
        setFormDueDate('');
        setStudentSearch('');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formStudentId || !formDescription || !formAmount) {
            showToast('Mohon lengkapi semua field', 'error');
            return;
        }
        setFormSubmitting(true);

        try {
            const { error } = await supabase
                .from('student_bills')
                .insert({
                    student_id: formStudentId,
                    description: formDescription,
                    amount: parseInt(formAmount),
                    status: 'unpaid',
                    category: formCategory,
                    semester: formSemester || null,
                    due_date: formDueDate || null,
                });

            if (error) throw error;
            showToast('Tagihan berhasil dibuat!');
            setIsCreateOpen(false);
            resetForm();
            fetchBills(true);
        } catch (err: any) {
            showToast('Gagal membuat tagihan: ' + err.message, 'error');
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBill) return;
        setFormSubmitting(true);

        try {
            const { error } = await supabase
                .from('student_bills')
                .update({
                    description: formDescription,
                    amount: parseInt(formAmount),
                    category: formCategory,
                    semester: formSemester || null,
                    due_date: formDueDate || null,
                })
                .eq('id', selectedBill.id);

            if (error) throw error;
            showToast('Tagihan berhasil diperbarui!');
            setIsEditOpen(false);
            resetForm();
            fetchBills(true);
        } catch (err: any) {
            showToast('Gagal memperbarui tagihan: ' + err.message, 'error');
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBill) return;
        setFormSubmitting(true);

        try {
            const { error } = await supabase
                .from('student_bills')
                .delete()
                .eq('id', selectedBill.id);

            if (error) throw error;
            showToast('Tagihan berhasil dihapus!');
            setIsDeleteOpen(false);
            setSelectedBill(null);
            fetchBills(true);
        } catch (err: any) {
            showToast('Gagal menghapus tagihan: ' + err.message, 'error');
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleBulkCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetStudents = students.filter(s => {
            if (bulkFakultas && s.faculty !== bulkFakultas) return false;
            if (bulkProdi && s.study_program !== bulkProdi) return false;
            return true;
        });
        if (!bulkDescription || !bulkAmount || targetStudents.length === 0) {
            showToast('Data tidak lengkap atau tidak ada mahasiswa yang sesuai filter', 'error');
            return;
        }
        setBulkSubmitting(true);

        try {
            const billsToInsert = targetStudents.map(s => ({
                student_id: s.id,
                description: bulkDescription,
                amount: parseInt(bulkAmount),
                status: 'unpaid' as const,
                category: bulkCategory,
                semester: bulkSemester || null,
                due_date: bulkDueDate || null,
            }));

            const { error } = await supabase
                .from('student_bills')
                .insert(billsToInsert);

            if (error) throw error;
            showToast(`Berhasil membuat ${targetStudents.length} tagihan!`);
            setIsBulkOpen(false);
            setBulkDescription('');
            setBulkAmount('');
            setBulkSemester('');
            setBulkDueDate('');
            setBulkFakultas('');
            setBulkProdi('');
            fetchBills(true);
        } catch (err: any) {
            showToast('Gagal membuat tagihan massal: ' + err.message, 'error');
        } finally {
            setBulkSubmitting(false);
        }
    };

    const openEditModal = (bill: Bill) => {
        setSelectedBill(bill);
        setFormDescription(bill.description);
        setFormAmount(bill.amount.toString());
        setFormCategory((bill.category as BillCategory) || 'UKT');
        setFormSemester(bill.semester || '');
        setFormDueDate(bill.due_date || '');
        setIsEditOpen(true);
    };

    const openDeleteModal = (bill: Bill) => {
        setSelectedBill(bill);
        setIsDeleteOpen(true);
    };

    // ─── Helpers ─────────────────────────────────────────────────────
    const formatCurrency = (n: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    const statusConfig = {
        paid: { label: 'Lunas', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-500/20', icon: CheckCircle2 },
        pending: { label: 'Menunggu', color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-500/20', icon: Clock },
        unpaid: { label: 'Belum Bayar', color: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-500/20', icon: AlertCircle },
    };

    const categories: BillCategory[] = ['UKT', 'SPP', 'Praktikum', 'Wisuda', 'Her-registrasi', 'Lainnya'];

    // ─── Render ──────────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* ─── Page Header ─────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <CreditCard size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manajemen Tagihan Mahasiswa</h1>
                    <p className="text-slate-500 dark:text-slate-400">Buat, kelola, dan monitor semua tagihan pembayaran mahasiswa.</p>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => setIsBulkOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        <Users size={18} />
                        Tagihan Massal
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsCreateOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} />
                        Buat Tagihan
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* ─── Stats ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500 shadow-sm"><TrendingUp size={22} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(stats.totalAmount)}</p>
                    </div>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 shadow-sm"><CheckCircle2 size={22} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terbayar</p>
                        <p className="text-xl font-black text-emerald-600">{formatCurrency(stats.paidAmount)}</p>
                        <p className="text-[10px] text-slate-400">{stats.paidCount} tagihan</p>
                    </div>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-500 shadow-sm"><AlertCircle size={22} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum Bayar</p>
                        <p className="text-xl font-black text-rose-600">{formatCurrency(stats.unpaidAmount)}</p>
                        <p className="text-[10px] text-slate-400">{stats.unpaidCount} tagihan</p>
                    </div>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-500 shadow-sm"><Clock size={22} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menunggu Verifikasi</p>
                        <p className="text-xl font-black text-amber-600">{stats.pendingCount}</p>
                        <p className="text-[10px] text-slate-400">pembayaran</p>
                    </div>
                </motion.div>
            </div>

            {/* ─── Filter Bar ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nama, NIM, atau deskripsi..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:border-primary/50 transition-all"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-3.5 px-4 rounded-2xl text-sm font-bold cursor-pointer"
                >
                    <option value="all">Semua Status</option>
                    <option value="unpaid">Belum Bayar</option>
                    <option value="pending">Menunggu</option>
                    <option value="paid">Lunas</option>
                </select>
                <div className="flex gap-2">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-3.5 px-4 rounded-2xl text-sm font-bold cursor-pointer"
                    >
                        <option value="all">Semua Kategori</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button
                        onClick={() => fetchBills(true)}
                        disabled={refreshing}
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary hover:border-primary/30 transition-all"
                    >
                        <RefreshCw size={18} className={cn(refreshing && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* ─── Table ───────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Jatuh Tempo</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw size={24} className="animate-spin text-primary" />
                                            <span className="text-sm text-slate-400">Memuat data tagihan...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400">
                                        <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-bold">Tidak ada tagihan ditemukan</p>
                                        <p className="text-xs mt-1 opacity-70">Buat tagihan baru dengan tombol "Buat Tagihan" di atas.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => {
                                    const sc = statusConfig[bill.status];
                                    const StatusIcon = sc.icon;
                                    return (
                                        <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                            <td className="p-4">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">{bill.profiles?.full_name || '-'}</p>
                                                <p className="text-xs text-slate-400 font-mono">{bill.profiles?.nim_nip || '-'}</p>
                                                {(bill.profiles?.faculty || bill.profiles?.study_program) && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{bill.profiles?.faculty}{bill.profiles?.faculty && bill.profiles?.study_program ? ' — ' : ''}{bill.profiles?.study_program}</p>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{bill.description}</p>
                                                {bill.semester && <p className="text-[10px] text-slate-400 mt-0.5">Semester {bill.semester}</p>}
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    {bill.category || '-'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-bold text-right text-slate-900 dark:text-white">
                                                {formatCurrency(bill.amount)}
                                            </td>
                                            <td className="p-4 text-xs text-center text-slate-500">
                                                {bill.due_date ? new Date(bill.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", sc.color)}>
                                                    <StatusIcon size={12} />
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    {bill.status === 'unpaid' && (
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(bill)}
                                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                                title="Edit"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(bill)}
                                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {bill.status === 'pending' && (
                                                        <span className="text-[10px] text-amber-500 font-bold">Menunggu</span>
                                                    )}
                                                    {bill.status === 'paid' && (
                                                        <span className="text-[10px] text-emerald-500 font-bold">Verified</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                {filteredBills.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span>Menampilkan {filteredBills.length} dari {bills.length} tagihan</span>
                        <span className="font-bold">Total ditampilkan: {formatCurrency(filteredBills.reduce((s, b) => s + b.amount, 0))}</span>
                    </div>
                )}
            </div>

            {/* ─── Create Bill Modal ───────────────────────────────── */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Plus size={20} /></div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">Buat Tagihan Baru</h2>
                                </div>
                                <button onClick={() => setIsCreateOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
                                {/* Student Selector */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pilih Mahasiswa *</label>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)}
                                            placeholder="Cari nama atau NIM..."
                                            className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm"
                                        />
                                    </div>
                                    <div className="max-h-32 overflow-y-auto bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 custom-scrollbar">
                                        {filteredStudents.length === 0 ? (
                                            <p className="p-3 text-xs text-slate-400 text-center">Tidak ada mahasiswa ditemukan</p>
                                        ) : (
                                            filteredStudents.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => { setFormStudentId(s.id); setStudentSearch(s.full_name + ' (' + s.nim_nip + ')'); }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 transition-all flex items-center justify-between",
                                                        formStudentId === s.id && "bg-primary/10 text-primary font-bold"
                                                    )}
                                                >
                                                    <div>
                                                        <div>
                                                            <span className="font-medium">{s.full_name}</span>
                                                            <span className="text-xs text-slate-400 ml-2 font-mono">{s.nim_nip}</span>
                                                        </div>
                                                        {(s.faculty || s.study_program) && (
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{s.faculty}{s.faculty && s.study_program ? ' — ' : ''}{s.study_program}</p>
                                                        )}
                                                    </div>
                                                    {formStudentId === s.id && <CheckCircle2 size={14} />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Category & Semester */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kategori</label>
                                        <select
                                            value={formCategory}
                                            onChange={(e) => setFormCategory(e.target.value as BillCategory)}
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold"
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Semester</label>
                                        <select
                                            value={formSemester}
                                            onChange={(e) => setFormSemester(e.target.value)}
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold cursor-pointer"
                                        >
                                            <option value="">Pilih Semester</option>
                                            {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deskripsi Tagihan *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="UKT Semester Genap 2025/2026"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold"
                                    />
                                </div>

                                {/* Amount & Due Date */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nominal (Rp) *</label>
                                        <div className="relative">
                                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="number"
                                                required
                                                value={formAmount}
                                                onChange={(e) => setFormAmount(e.target.value)}
                                                placeholder="5000000"
                                                className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Jatuh Tempo</label>
                                        <div className="relative">
                                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="date"
                                                value={formDueDate}
                                                onChange={(e) => setFormDueDate(e.target.value)}
                                                className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Preview */}
                                {formAmount && (
                                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preview Nominal</p>
                                        <p className="text-lg font-black text-primary">{formatCurrency(parseInt(formAmount) || 0)}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={formSubmitting || !formStudentId}
                                    className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                                >
                                    {formSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                    {formSubmitting ? 'Menyimpan...' : 'Buat Tagihan'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── Edit Bill Modal ──────────────────────────────────── */}
            <AnimatePresence>
                {isEditOpen && selectedBill && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl flex items-center justify-center"><Edit3 size={20} /></div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">Edit Tagihan</h2>
                                </div>
                                <button onClick={() => setIsEditOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleEdit} className="p-8 space-y-5">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mahasiswa</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedBill.profiles?.full_name} ({selectedBill.profiles?.nim_nip})</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kategori</label>
                                        <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as BillCategory)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold">
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Semester</label>
                                        <select value={formSemester} onChange={(e) => setFormSemester(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold cursor-pointer">
                                            <option value="">Pilih Semester</option>
                                            {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deskripsi</label>
                                    <input type="text" required value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nominal (Rp)</label>
                                        <input type="number" required value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Jatuh Tempo</label>
                                        <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm" />
                                    </div>
                                </div>

                                <button type="submit" disabled={formSubmitting} className="w-full py-4 bg-amber-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {formSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Edit3 size={18} />}
                                    {formSubmitting ? 'Menyimpan...' : 'Perbarui Tagihan'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── Delete Confirmation Modal ────────────────────────── */}
            <AnimatePresence>
                {isDeleteOpen && selectedBill && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden p-8 text-center space-y-6">
                            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
                                <Trash2 size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Hapus Tagihan?</h3>
                                <p className="text-sm text-slate-500">{selectedBill.description} — <span className="font-bold">{formatCurrency(selectedBill.amount)}</span></p>
                                <p className="text-xs text-slate-400 mt-1">Untuk: {selectedBill.profiles?.full_name}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={formSubmitting}
                                    className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {formSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    Hapus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── Bulk Create Modal ───────────────────────────────── */}
            <AnimatePresence>
                {isBulkOpen && (() => {
                    const targetStudents = students.filter(s => {
                        if (bulkFakultas && s.faculty !== bulkFakultas) return false;
                        if (bulkProdi && s.study_program !== bulkProdi) return false;
                        return true;
                    });
                    return (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/20 text-violet-500 rounded-xl flex items-center justify-center"><Users size={20} /></div>
                                        <div>
                                            <h2 className="text-xl font-black uppercase tracking-tight">Tagihan Massal</h2>
                                            <p className="text-[10px] text-slate-400 font-bold">Buat tagihan untuk mahasiswa sekaligus</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsBulkOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><X size={20} /></button>
                                </div>

                                <form onSubmit={handleBulkCreate} className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
                                    {/* Fakultas & Prodi Filter */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fakultas</label>
                                            <select
                                                value={bulkFakultas}
                                                onChange={(e) => { setBulkFakultas(e.target.value); setBulkProdi(''); }}
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold cursor-pointer"
                                            >
                                                <option value="">Semua Fakultas</option>
                                                {fakultasList.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Program Studi</label>
                                            <select
                                                value={bulkProdi}
                                                onChange={(e) => setBulkProdi(e.target.value)}
                                                disabled={!bulkFakultas}
                                                className={cn(
                                                    "w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold cursor-pointer",
                                                    !bulkFakultas && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <option value="">{bulkFakultas ? 'Semua Prodi' : 'Pilih Fakultas dulu'}</option>
                                                {bulkFakultas && fakultasProdiMap[bulkFakultas]?.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl flex items-start gap-3">
                                        <UserPlus size={18} className="text-violet-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-violet-700 dark:text-violet-400 font-medium leading-relaxed">
                                            Tagihan akan dibuat untuk <strong>{targetStudents.length} mahasiswa</strong>
                                            {bulkFakultas ? ` di ${bulkFakultas}` : ''}
                                            {bulkProdi ? ` — ${bulkProdi}` : ''}
                                            {!bulkFakultas ? ' (semua fakultas)' : ''}.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kategori</label>
                                            <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value as BillCategory)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold">
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Semester</label>
                                            <select value={bulkSemester} onChange={(e) => setBulkSemester(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold cursor-pointer">
                                                <option value="">Pilih Semester</option>
                                                {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deskripsi Tagihan *</label>
                                        <input type="text" required value={bulkDescription} onChange={(e) => setBulkDescription(e.target.value)} placeholder="UKT Semester Genap 2025/2026" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nominal (Rp) *</label>
                                            <input type="number" required value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} placeholder="5000000" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Jatuh Tempo</label>
                                            <input type="date" value={bulkDueDate} onChange={(e) => setBulkDueDate(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none text-sm" />
                                        </div>
                                    </div>

                                    {/* Total Preview */}
                                    {bulkAmount && (
                                        <div className="p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per Mahasiswa</p>
                                                <p className="text-sm font-black text-violet-600">{formatCurrency(parseInt(bulkAmount) || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Mhs</p>
                                                <p className="text-sm font-black text-violet-600">{targetStudents.length}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                                <p className="text-sm font-black text-violet-600">{formatCurrency((parseInt(bulkAmount) || 0) * targetStudents.length)}</p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={bulkSubmitting || targetStudents.length === 0}
                                        className="w-full py-4 bg-violet-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                                    >
                                        {bulkSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                        {bulkSubmitting ? 'Memproses...' : `Buat ${targetStudents.length} Tagihan Sekaligus`}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default StudentBillsPage;
