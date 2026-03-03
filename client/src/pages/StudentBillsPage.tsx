import React, { useState, useEffect, useMemo } from 'react';
import {
    CreditCard,
    Plus,
    X,
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    Trash2,
    Edit3,
    Send,
    Calendar,
    DollarSign,
    RefreshCw,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import Toast, { ToastType } from '../components/Toast';
import { DataTable } from '../components/DataTable';
import { logAction } from '../lib/auditLogger';
import { useAuth } from '../context/AuthContext';

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
    status: 'unpaid' | 'pending' | 'paid' | 'partial';
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

const categories: BillCategory[] = ['UKT', 'SPP', 'Praktikum', 'Wisuda', 'Her-registrasi', 'Lainnya'];

const StudentBillsPage: React.FC = () => {
    const { profile: currentUser } = useAuth();
    const [bills, setBills] = useState<Bill[]>([]);
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    // Form state
    const [formStudentId, setFormStudentId] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formCategory, setFormCategory] = useState<BillCategory>('UKT');
    const [formSemester, setFormSemester] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [formStatus, setFormStatus] = useState<'unpaid' | 'pending' | 'paid' | 'partial'>('unpaid');
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [studentSearchInModal, setStudentSearchInModal] = useState('');

    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const fetchBills = async () => {
        setLoading(true);
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
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBills((data as Bill[]) || []);
        } catch (err: any) {
            showToast('Gagal memuat data tagihan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, nim_nip, email, role, faculty, study_program')
                .eq('role', 'mahasiswa')
                .is('deleted_at', null)
                .order('full_name');
            if (error) throw error;
            setStudents(data || []);
        } catch (err) { }
    };

    useEffect(() => {
        fetchBills();
        fetchStudents();
    }, []);

    const stats = useMemo(() => {
        const totalAmount = bills.reduce((s, b) => s + b.amount, 0);
        const paidAmount = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0);
        const unpaidAmount = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.amount, 0);
        const pendingCount = bills.filter(b => b.status === 'pending').length;
        return { totalAmount, paidAmount, unpaidAmount, pendingCount };
    }, [bills]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formStudentId || !formDescription || !formAmount || !currentUser) return;
        setFormSubmitting(true);

        try {
            const newData = {
                student_id: formStudentId,
                description: formDescription,
                amount: parseInt(formAmount),
                status: 'unpaid',
                category: formCategory,
                semester: formSemester || null,
                due_date: formDueDate || null,
            };
            const { error } = await supabase.from('student_bills').insert([newData]);
            if (error) throw error;

            await logAction(currentUser.id, currentUser.role, 'CREATE_BILL', 'Finance', 'new', null, newData);

            showToast('Tagihan berhasil dibuat!');
            setIsCreateOpen(false);
            fetchBills();
        } catch (err: any) {
            showToast('Gagal: ' + err.message, 'error');
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBill || !currentUser) return;
        setFormSubmitting(true);

        try {
            const updData = {
                description: formDescription,
                amount: parseInt(formAmount),
                status: formStatus,
                category: formCategory,
                semester: formSemester || null,
                due_date: formDueDate || null,
            };
            const { error } = await supabase.from('student_bills').update(updData).eq('id', selectedBill.id);
            if (error) throw error;

            await logAction(currentUser.id, currentUser.role, 'UPDATE_BILL', 'Finance', selectedBill.id, selectedBill, updData);

            showToast('Tagihan diperbarui!');
            setIsEditOpen(false);
            fetchBills();
        } catch (err: any) {
            showToast('Gagal: ' + err.message, 'error');
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBill || !currentUser) return;
        setFormSubmitting(true);
        try {
            const { error } = await supabase.from('student_bills').update({ deleted_at: new Date().toISOString() }).eq('id', selectedBill.id);
            if (error) throw error;

            await logAction(currentUser.id, currentUser.role, 'DELETE_BILL', 'Finance', selectedBill.id, selectedBill, { deleted: true });

            showToast('Tagihan dihapus (Soft Delete)');
            setIsDeleteOpen(false);
            fetchBills();
        } catch (err: any) {
            showToast('Gagal: ' + err.message, 'error');
        } finally {
            setFormSubmitting(false);
        }
    };

    const filteredStudentsInModal = useMemo(() => {
        if (!studentSearchInModal) return students.slice(0, 10);
        return students.filter(s => s.full_name.toLowerCase().includes(studentSearchInModal.toLowerCase()) || s.nim_nip.includes(studentSearchInModal)).slice(0, 5);
    }, [students, studentSearchInModal]);

    const statusConfig = {
        paid: { label: 'Lunas', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-500/20', icon: CheckCircle2 },
        pending: { label: 'Verifikasi', color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:border-amber-500/20', icon: Clock },
        partial: { label: 'Cicilan', color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:border-blue-500/20', icon: CreditCard },
        unpaid: { label: 'Belum Bayar', color: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/10 dark:border-rose-500/20', icon: AlertCircle },
    };

    const columns = [
        {
            header: 'Mahasiswa',
            accessorKey: (b: Bill) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-white capitalize">{b.profiles?.full_name || 'N/A'}</span>
                    <span className="text-[10px] font-mono text-slate-400">NIM: {b.profiles?.nim_nip || 'N/A'}</span>
                </div>
            )
        },
        {
            header: 'Keterangan',
            accessorKey: (b: Bill) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{b.description}</span>
                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest">{b.category} • {b.semester || 'Umum'}</span>
                </div>
            )
        },
        {
            header: 'Nominal',
            className: 'text-right',
            accessorKey: (b: Bill) => (
                <span className="font-black text-slate-900 dark:text-white">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(b.amount)}
                </span>
            )
        },
        {
            header: 'Status',
            className: 'text-center',
            accessorKey: (b: Bill) => {
                const sc = statusConfig[b.status];
                const StatusIcon = sc.icon;
                return (
                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border", sc.color)}>
                        <StatusIcon size={12} />
                        {sc.label}
                    </span>
                );
            }
        },
        {
            header: 'Aksi',
            className: 'text-right',
            accessorKey: (b: Bill) => (
                <div className="flex items-center justify-end gap-1 opacity-100 group-hover:opacity-100 transition-all">
                    <button onClick={() => {
                        setSelectedBill(b);
                        setFormDescription(b.description);
                        setFormAmount(b.amount.toString());
                        setFormCategory(b.category as any);
                        setFormSemester(b.semester || '');
                        setFormDueDate(b.due_date || '');
                        setFormStatus(b.status);
                        setIsEditOpen(true);
                    }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => { setSelectedBill(b); setIsDeleteOpen(true); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center"><TrendingUp size={24} /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</p><p className="text-xl font-black">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.totalAmount)}</p></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={24} /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lunas</p><p className="text-xl font-black text-emerald-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.paidAmount)}</p></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center"><AlertCircle size={24} /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tunggakan</p><p className="text-xl font-black text-rose-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.unpaidAmount)}</p></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center"><Clock size={24} /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p><p className="text-xl font-black text-amber-600">{stats.pendingCount}</p></div>
                </div>
            </div>

            <DataTable
                title="Daftar Tagihan Mahasiswa"
                description="Monitor status pembayaran dan verifikasi bukti transfer."
                icon={CreditCard}
                data={bills}
                columns={columns as any}
                pageSize={10}
                searchPlaceholder="Cari mahasiswa atau keterangan..."
                exportFileName="Data_Tagihan_Mahasiswa"
                actions={
                    <button onClick={() => { setIsCreateOpen(true); setFormStudentId(''); }} className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"><Plus size={18} /> Buat Tagihan</button>
                }
            />

            {/* Modal: Create */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-xl font-black uppercase tracking-tight">Buat Tagihan Baru</h2>
                                <button onClick={() => setIsCreateOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreate} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Mahasiswa</label>
                                    <input type="text" value={studentSearchInModal} onChange={e => setStudentSearchInModal(e.target.value)} placeholder="Cari Nama/NIM..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold" />
                                    <div className="max-h-32 overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredStudentsInModal.map(s => (
                                            <button key={s.id} type="button" onClick={() => { setFormStudentId(s.id); setStudentSearchInModal(s.full_name); }} className={cn("w-full text-left p-3 text-xs hover:bg-primary/5 transition-all flex justify-between", formStudentId === s.id && "bg-primary/10 text-primary font-bold")}>
                                                <span>{s.full_name} ({s.nim_nip})</span>
                                                {formStudentId === s.id && <CheckCircle2 size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</label>
                                        <select value={formCategory} onChange={e => setFormCategory(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold">
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Semester</label>
                                        <select value={formSemester} onChange={e => setFormSemester(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold">
                                            <option value="">Piliah Semester</option>
                                            {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Keterangan</label>
                                    <input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)} required placeholder="UKT 2025" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nominal (Rp)</label>
                                        <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} required placeholder="0" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jatuh Tempo</label>
                                        <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm" />
                                    </div>
                                </div>
                                <button type="submit" disabled={formSubmitting || !formStudentId} className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
                                    {formSubmitting ? 'Memproses...' : 'Kirim Tagihan'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Edit */}
            <AnimatePresence>
                {isEditOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-xl font-black uppercase tracking-tight">Update Tagihan</h2>
                                <button onClick={() => setIsEditOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUpdate} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                                        <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold">
                                            <option value="unpaid">Belum Bayar</option>
                                            <option value="pending">Menunggu Verifikasi</option>
                                            <option value="partial">Cicilan</option>
                                            <option value="paid">Lunas</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</label>
                                        <select value={formCategory} onChange={e => setFormCategory(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold">
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Keterangan</label>
                                    <input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nominal (Rp)</label>
                                        <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold" />
                                    </div>
                                </div>
                                <button type="submit" disabled={formSubmitting} className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
                                    {formSubmitting ? 'Memproses...' : 'Simpan Perubahan'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Delete */}
            <AnimatePresence>
                {isDeleteOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm p-8 shadow-2xl text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6"><Trash2 size={40} /></div>
                            <h3 className="text-xl font-bold mb-2">Hapus Tagihan?</h3>
                            <p className="text-slate-500 text-sm mb-8">Tagihan ini akan dihapus dari sistem (Soft Delete).</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setIsDeleteOpen(false)} className="py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Batal</button>
                                <button onClick={handleDelete} className="py-3.5 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all">Hapus</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default StudentBillsPage;
