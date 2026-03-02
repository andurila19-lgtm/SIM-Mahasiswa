import React, { useState } from 'react';
import { CreditCard, CheckCircle2, Search, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import Toast, { ToastType } from '../components/Toast';

interface PaymentRecord {
    id: string;
    studentName: string;
    nim: string;
    semester: number;
    amount: number;
    paidAmount: number;
    paymentDate?: string;
    status: 'paid' | 'pending' | 'overdue';
    method?: string;
}

const PaymentVerificationPage: React.FC = () => {
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({ isOpen: false, message: '', type: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const [payments, setPayments] = useState<PaymentRecord[]>(() => {
        const saved = localStorage.getItem('payment_verifications_clean');
        return saved ? JSON.parse(saved) : [];
    });

    const handleVerify = (id: string) => {
        const updated = payments.map(p => p.id === id ? { ...p, status: 'paid' as const, paidAmount: p.amount, paymentDate: new Date().toISOString().split('T')[0] } : p);
        setPayments(updated);
        localStorage.setItem('payment_verifications_clean', JSON.stringify(updated));
        showToast('Pembayaran berhasil diverifikasi');
    };

    const filtered = payments.filter(p => {
        const matchSearch = p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || p.nim.includes(searchTerm);
        const matchStatus = filterStatus === 'all' || p.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const totalPaid = payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.paidAmount, 0);
    const totalOverdue = payments.filter(p => p.status === 'overdue').length;
    const totalPending = payments.filter(p => p.status === 'pending').length;

    const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const statusStyle = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-500/20';
            case 'overdue': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-500/20';
            default: return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-500/20';
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
                    <div><p className="text-xs text-slate-500">Menunggak</p><p className="text-lg font-bold text-slate-900 dark:text-white">{totalOverdue} Mahasiswa</p></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-500"><FileText size={20} /></div>
                    <div><p className="text-xs text-slate-500">Belum Verifikasi</p><p className="text-lg font-bold text-slate-900 dark:text-white">{totalPending} Pembayaran</p></div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari mahasiswa..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:border-primary/50 transition-all" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-3.5 px-4 rounded-2xl text-sm font-bold cursor-pointer">
                    <option value="all">Semua Status</option>
                    <option value="paid">Lunas</option>
                    <option value="pending">Menunggu</option>
                    <option value="overdue">Menunggak</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Smt</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tagihan</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Dibayar</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tanggal</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 text-sm">
                                        <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                                        Belum ada data pembayaran.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                    <td className="p-4"><p className="text-sm font-bold text-slate-800 dark:text-white">{p.studentName}</p><p className="text-xs text-slate-400 font-mono">{p.nim}</p></td>
                                    <td className="p-4 text-sm font-bold text-center text-slate-700 dark:text-white">{p.semester}</td>
                                    <td className="p-4 text-sm font-bold text-right text-slate-700 dark:text-white">{formatCurrency(p.amount)}</td>
                                    <td className="p-4 text-sm font-bold text-right text-primary">{formatCurrency(p.paidAmount)}</td>
                                    <td className="p-4 text-xs text-center text-slate-500">{p.paymentDate || '-'}</td>
                                    <td className="p-4 text-center"><span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", statusStyle(p.status))}>{p.status === 'paid' ? 'Lunas' : p.status === 'pending' ? 'Menunggu' : 'Menunggak'}</span></td>
                                    <td className="p-4 text-center">
                                        {p.status !== 'paid' && (
                                            <button onClick={() => handleVerify(p.id)} className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all active:scale-95">
                                                Verifikasi
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default PaymentVerificationPage;
