import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Calendar,
    Download,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    ShieldCheck,
    ArrowUpRight,
    TrendingUp,
    History,
    Info,
    ExternalLink,
    ChevronLeft,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Toast, { ToastType } from '../components/Toast';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    created_at: string;
    status: 'paid' | 'pending' | 'unpaid';
    payment_method?: string;
    proof_url?: string;
}

const PaymentsPage: React.FC = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('active');
    const [bills, setBills] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Transaction | null>(null);
    const [proofUrl, setProofUrl] = useState('');

    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const fetchBills = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_bills')
                .select('*')
                .eq('student_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBills(data || []);
        } catch (err: any) {
            console.error('Fetch Bills Error:', err);
            showToast('Gagal memuat data tagihan', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBills();
    }, [profile]);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBill) return;

        try {
            const { error } = await supabase
                .from('student_bills')
                .update({
                    status: 'pending',
                    proof_url: proofUrl,
                    payment_method: 'Transfer Bank'
                })
                .eq('id', selectedBill.id);

            if (error) throw error;
            showToast('Bukti pembayaran berhasil dikirim. Menunggu verifikasi.');
            setIsPayModalOpen(false);
            fetchBills();
        } catch (err: any) {
            showToast(err.message, 'error');
        }
    };

    const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amt);
    };

    const activeBills = bills.filter(b => b.status !== 'paid');
    const historyBills = bills.filter(b => b.status === 'paid');

    const totalBill = activeBills.reduce((sum, b) => sum + b.amount, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <CreditCard size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Keuangan & Pembayaran</h1>
                    <p className="text-slate-500 dark:text-slate-400">Ringkasan tagihan, status UKT, dan riwayat transaksi.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group">
                        Bayar Sekarang
                        <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 shadow-sm",
                        totalBill === 0 ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-900/10" : "bg-red-50 text-red-500 dark:bg-red-900/10"
                    )}>
                        {totalBill === 0 ? <ShieldCheck size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Keuangan</p>
                        <h3 className={cn("text-2xl font-black", totalBill === 0 ? "text-emerald-500" : "text-red-500")}>
                            {totalBill === 0 ? 'BEBAS TAGIHAN' : 'ADA TAGIHAN'}
                        </h3>
                    </div>
                    {totalBill === 0 && (
                        <div className="absolute top-0 right-0 p-8 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors">
                            <CheckCircle2 size={128} strokeWidth={1} />
                        </div>
                    )}
                </motion.div>

                <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform shadow-sm">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Tunggakan</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalBill)}</h3>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -3 }} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/10 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform border border-white/10 shadow-sm">
                            <CreditCard size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pembayaran Terakhir</p>
                        <h3 className="text-2xl font-black text-white">{historyBills[0] ? formatCurrency(historyBills[0].amount) : 'Rp 0'}</h3>
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-8 flex items-center gap-1.5 cursor-pointer hover:underline group-hover:gap-3 transition-all">
                            Lihat Detail Struk
                            <ChevronRight size={14} />
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -z-0"></div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Tab Column */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 overflow-hidden relative group">
                        <div className="space-y-1 relative z-10 px-2 py-4">
                            <button onClick={() => setActiveTab('active')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'active' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                <div className="flex items-center gap-4">
                                    <CreditCard size={18} />
                                    <span className="text-sm font-bold">Tagihan Aktif</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'active' ? "translate-x-1" : "opacity-0")} />
                            </button>
                            <button onClick={() => setActiveTab('history')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'history' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                <div className="flex items-center gap-4">
                                    <History size={18} />
                                    <span className="text-sm font-bold">Riwayat Bayar</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'history' ? "translate-x-1" : "opacity-0")} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-3xl p-8 border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
                        <div className="w-10 h-10 bg-white dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-500 shrink-0 shadow-sm shadow-blue-500/10">
                            <Info size={22} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-400 mb-2">Info Pembayaran</h4>
                            <p className="text-xs text-blue-700 dark:text-blue-500 leading-relaxed font-medium italic opacity-80 tracking-tight">Gunakan Virtual Account BNI atau BRI untuk proses verifikasi otomatis dalam 5 menit.</p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'history' ? (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/10">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Log Transaksi Berhasil</h3>
                                        <p className="text-xs text-slate-500 font-medium">Menampilkan riwayat pembayaran tervalidasi sistem.</p>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {historyBills.length > 0 ? historyBills.map((tx) => (
                                        <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                            <div className="flex items-center gap-8">
                                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-sm bg-emerald-50 text-emerald-500 dark:bg-emerald-900/10">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors text-base">{tx.description}</h3>
                                                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                        <span className="flex items-center gap-1.5"><Calendar size={12} className="opacity-60" /> {new Date(tx.created_at).toLocaleDateString()}</span>
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-black text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">LUNAS</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-10">
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-emerald-500">VERIFIED</p>
                                                </div>
                                                <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                    <Download size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center opacity-40">Belum ada riwayat pembayaran</div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="active"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-6">
                                    {activeBills.length > 0 ? activeBills.map((bill) => (
                                        <div key={bill.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                            <div className="flex items-center gap-6">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                                                    bill.status === 'pending' ? "bg-amber-50 text-amber-500" : "bg-red-50 text-red-500"
                                                )}>
                                                    {bill.status === 'pending' ? <Clock size={24} /> : <AlertCircle size={24} />}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-800 dark:text-white">{bill.description}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                        {bill.status === 'pending' ? 'Tengah Diverifikasi' : 'Menunggu Pembayaran'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(bill.amount)}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(bill.created_at).toLocaleDateString()}</p>
                                                </div>
                                                {bill.status === 'unpaid' && (
                                                    <button
                                                        onClick={() => { setSelectedBill(bill); setIsPayModalOpen(true); }}
                                                        className="px-6 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                                    >
                                                        Bayar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mb-8 border border-emerald-100 dark:border-transparent scale-110 shadow-xl shadow-emerald-500/10">
                                                <CheckCircle2 size={48} />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Semua Tagihan Lunas</h3>
                                            <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium leading-relaxed italic opacity-80 tracking-tight">Tidak ada tagihan yang tertunda saat ini. Anda dapat melakukan pendaftaran KRS dan kegiatan akademik lainnya.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {/* Payment Modal */}
            <AnimatePresence>
                {isPayModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPayModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden">
                            <form onSubmit={handlePayment} className="p-8 space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Upload Bukti</h2>
                                    <button type="button" onClick={() => setIsPayModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><X size={20} /></button>
                                </div>
                                <p className="text-sm text-slate-500">Silakan transfer ke BNI Virtual Account <b>98888 2024 0000 123</b> sebesar <b className="text-slate-900 dark:text-white">{formatCurrency(selectedBill?.amount || 0)}</b></p>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">URL Bukti Bayar / Referensi</label>
                                    <input
                                        type="text" required value={proofUrl}
                                        onChange={(e) => setProofUrl(e.target.value)}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold"
                                        placeholder="Masukkan link gambar bukti..."
                                    />
                                </div>

                                <button type="submit" className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95">
                                    Konfirmasi Pembayaran
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default PaymentsPage;
