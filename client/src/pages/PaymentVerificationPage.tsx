import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Search, TrendingUp, AlertTriangle, FileText, RefreshCw, Eye, X, XCircle, Image, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import Toast, { ToastType } from '../components/Toast';

interface PaymentRecord {
    id: string;
    student_id: string;
    description: string;
    amount: number;
    status: 'paid' | 'pending' | 'unpaid' | 'partial';
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

const PaymentVerificationPage: React.FC = () => {
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({ isOpen: false, message: '', type: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'unpaid' | 'partial'>('all');
    const [filterFaculty, setFilterFaculty] = useState('all');
    const [filterProdi, setFilterProdi] = useState('all');
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [proofModal, setProofModal] = useState<{ isOpen: boolean; url: string; name: string }>({ isOpen: false, url: '', name: '' });
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    // ─── Fetch all bills from Supabase ────────────────────────
    const fetchPayments = async (silent = false) => {
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
                .in('status', ['pending', 'paid', 'unpaid', 'partial'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments((data as PaymentRecord[]) || []);
        } catch (err: any) {
            console.error('Fetch payments error:', err);
            showToast('Gagal memuat data pembayaran: ' + err.message, 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    // ─── Verify payment (set to paid) ────────────────────────
    const handleVerify = async (id: string) => {
        setActionLoading(id);
        try {
            const { error } = await supabase
                .from('student_bills')
                .update({ status: 'paid' })
                .eq('id', id);

            if (error) throw error;
            showToast('Pembayaran berhasil diverifikasi! ✓');
            fetchPayments(true);
        } catch (err: any) {
            showToast('Gagal memverifikasi: ' + err.message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // ─── Reject payment (set back to unpaid) ─────────────────
    const handleReject = async (id: string) => {
        setActionLoading(id);
        try {
            const { error } = await supabase
                .from('student_bills')
                .update({ status: 'unpaid', proof_url: null, payment_method: null })
                .eq('id', id);

            if (error) throw error;
            showToast('Pembayaran ditolak. Mahasiswa perlu upload ulang.');
            fetchPayments(true);
        } catch (err: any) {
            showToast('Gagal menolak: ' + err.message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCicilan = async (id: string) => {
        setActionLoading(id);
        try {
            const { error } = await supabase
                .from('student_bills')
                .update({ status: 'partial' })
                .eq('id', id);

            if (error) throw error;
            showToast('Status tagihan diubah menjadi CICILAN.');
            fetchPayments(true);
        } catch (err: any) {
            showToast('Gagal mengubah status: ' + err.message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // ─── Derived data ─────────────────────────────────────────
    const uniqueFaculties = [...new Set(payments.map(p => p.profiles?.faculty).filter(Boolean))] as string[];
    const uniqueProdi = [...new Set(
        payments
            .filter(p => filterFaculty === 'all' || p.profiles?.faculty === filterFaculty)
            .map(p => p.profiles?.study_program)
            .filter(Boolean)
    )] as string[];

    const filtered = payments.filter(p => {
        const matchSearch =
            p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.profiles?.nim_nip?.includes(searchTerm) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchFaculty = filterFaculty === 'all' || p.profiles?.faculty === filterFaculty;
        const matchProdi = filterProdi === 'all' || p.profiles?.study_program === filterProdi;
        return matchSearch && matchStatus && matchFaculty && matchProdi;
    });

    const totalPaid = payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
    const totalUnpaid = payments.filter(p => p.status === 'unpaid').length;
    const totalPending = payments.filter(p => p.status === 'pending').length;

    const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const statusStyle = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-500/20';
            case 'partial': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-500/20';
            case 'unpaid': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-500/20';
            default: return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-500/20';
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'Lunas';
            case 'partial': return 'Cicilan';
            case 'unpaid': return 'Belum Bayar';
            default: return 'Menunggu';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                        <CreditCard size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Verifikasi Pembayaran</h1>
                    <p className="text-slate-500 dark:text-slate-400">Kelola verifikasi pembayaran UKT/SPP mahasiswa.</p>
                </div>
                <button
                    onClick={() => fetchPayments(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all relative z-10"
                >
                    <RefreshCw size={18} className={cn(refreshing && "animate-spin")} />
                    Refresh
                </button>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500"><TrendingUp size={20} /></div>
                    <div><p className="text-xs text-slate-500">Total Terbayar</p><p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalPaid)}</p></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-500"><AlertTriangle size={20} /></div>
                    <div><p className="text-xs text-slate-500">Belum Bayar</p><p className="text-lg font-bold text-slate-900 dark:text-white">{totalUnpaid} Mahasiswa</p></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-500"><FileText size={20} /></div>
                    <div><p className="text-xs text-slate-500">Menunggu Verifikasi</p><p className="text-lg font-bold text-slate-900 dark:text-white">{totalPending} Pembayaran</p></div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari nama, NIM..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-3 pl-12 pr-4 rounded-2xl text-sm focus:border-primary/50 transition-all" />
                </div>
                <select value={filterFaculty} onChange={(e) => { setFilterFaculty(e.target.value); setFilterProdi('all'); }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-3 px-4 rounded-2xl text-sm font-bold cursor-pointer">
                    <option value="all">Semua Fakultas</option>
                    {uniqueFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={filterProdi} onChange={(e) => setFilterProdi(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-3 px-4 rounded-2xl text-sm font-bold cursor-pointer">
                    <option value="all">Semua Prodi</option>
                    {uniqueProdi.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-3 px-4 rounded-2xl text-sm font-bold cursor-pointer">
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu Verifikasi</option>
                    <option value="partial">Cicilan</option>
                    <option value="unpaid">Belum Bayar</option>
                    <option value="paid">Lunas</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fakultas</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prodi</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tagihan</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Bukti</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw size={24} className="animate-spin text-primary" />
                                            <span className="text-sm text-slate-400">Memuat data pembayaran...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400 text-sm">
                                        <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                                        Belum ada data pembayaran.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{p.profiles?.full_name || '-'}</p>
                                            <p className="text-xs text-slate-400 font-mono">{p.profiles?.nim_nip || '-'}</p>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{p.profiles?.faculty || '-'}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{p.profiles?.study_program || '-'}</td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.description}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{p.category || '-'} {p.semester ? `• ${p.semester}` : ''}</p>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-right text-slate-900 dark:text-white">{formatCurrency(p.amount)}</td>
                                        <td className="p-4 text-center">
                                            {p.proof_url ? (
                                                <button
                                                    onClick={() => setProofModal({ isOpen: true, url: p.proof_url!, name: p.profiles?.full_name || '' })}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all"
                                                >
                                                    <Eye size={12} /> Lihat
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-bold">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", statusStyle(p.status))}>
                                                {p.status === 'paid' && <CheckCircle2 size={12} />}
                                                {p.status === 'pending' && <Clock size={12} />}
                                                {statusLabel(p.status)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {p.status === 'pending' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleVerify(p.id)}
                                                        disabled={actionLoading === p.id}
                                                        className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        {actionLoading === p.id ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                        Verifikasi
                                                    </button>
                                                    <button
                                                        onClick={() => handleCicilan(p.id)}
                                                        disabled={actionLoading === p.id}
                                                        className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 text-xs font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        Cicilan
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(p.id)}
                                                        disabled={actionLoading === p.id}
                                                        className="px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-xs font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {p.status === 'paid' && (
                                                <span className="text-[10px] text-emerald-500 font-bold">Verified ✓</span>
                                            )}
                                            {p.status === 'unpaid' && (
                                                <span className="text-[10px] text-slate-400 font-bold">Belum dibayar</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                {filtered.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span>Menampilkan {filtered.length} dari {payments.length} pembayaran</span>
                        <span className="font-bold">Total: {formatCurrency(filtered.reduce((s, b) => s + b.amount, 0))}</span>
                    </div>
                )}
            </div>

            {/* Proof Image Modal */}
            <AnimatePresence>
                {proofModal.isOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProofModal({ ...proofModal, isOpen: false })} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Image size={20} /></div>
                                    <div>
                                        <h3 className="text-lg font-black">Bukti Pembayaran</h3>
                                        <p className="text-[10px] text-slate-400 font-bold">{proofModal.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setProofModal({ ...proofModal, isOpen: false })} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-6">
                                <img src={proofModal.url} alt="Bukti pembayaran" className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 object-contain max-h-[60vh] bg-slate-50 dark:bg-slate-800" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default PaymentVerificationPage;
