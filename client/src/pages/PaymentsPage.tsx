import React, { useState } from 'react';
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
    ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Transaction {
    id: number;
    title: string;
    amount: string;
    date: string;
    status: 'success' | 'pending' | 'failed';
    method: string;
}

const PaymentsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('active');

    const mockTransactions: Transaction[] = [];

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
                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500 mb-8 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status Keuangan</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">BEBAS TAGIHAN</h3>
                    </div>
                    <div className="absolute top-0 right-0 p-8 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors">
                        <CheckCircle2 size={128} strokeWidth={1} />
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo Deposit</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Rp 0</h3>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/10 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform border border-white/10 shadow-sm">
                            <CreditCard size={24} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pembayaran Terakhir</p>
                        <h3 className="text-2xl font-black text-white">Rp 4.500.000</h3>
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
                                    {mockTransactions.map((tx) => (
                                        <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                            <div className="flex items-center gap-8">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-sm",
                                                    tx.status === 'success' ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-900/10" : "bg-amber-50 text-amber-500 dark:bg-amber-900/10"
                                                )}>
                                                    {tx.status === 'success' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors text-base">{tx.title}</h3>
                                                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                        <span className="flex items-center gap-1.5"><Calendar size={12} className="opacity-60" /> {tx.date}</span>
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-black text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">{tx.method}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-10">
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-slate-900 dark:text-white">{tx.amount}</p>
                                                    <p className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest mt-1",
                                                        tx.status === 'success' ? "text-emerald-500" : "text-amber-500"
                                                    )}>{tx.status === 'success' ? 'BERHASIL' : 'DIPROSES'}</p>
                                                </div>
                                                <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                    <Download size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
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
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                    <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mb-8 border border-emerald-100 dark:border-transparent scale-110 shadow-xl shadow-emerald-500/10">
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Semua Tagihan Lunas</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium leading-relaxed italic opacity-80 tracking-tight">Tidak ada tagihan yang tertunda saat ini. Anda dapat melakukan pendaftaran KRS dan kegiatan akademik lainnya.</p>
                                    <button className="mt-10 px-8 py-3 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-2xl flex items-center gap-4 group/btn hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                                        Lihat Histori Semester Lalu
                                        <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default PaymentsPage;
