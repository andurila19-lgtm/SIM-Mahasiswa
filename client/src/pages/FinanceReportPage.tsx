import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Download,
    Calendar,
    Filter,
    BarChart3,
    PieChart as PieChartIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const FinanceReportPage: React.FC = () => {
    const [stats, setStats] = useState({
        totalPaid: 0,
        totalPending: 0,
        totalUnpaid: 0,
        countPaid: 0,
        countPending: 0,
        countUnpaid: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('student_bills').select('amount, status');
            if (error) throw error;

            const newStats = {
                totalPaid: 0,
                totalPending: 0,
                totalUnpaid: 0,
                countPaid: 0,
                countPending: 0,
                countUnpaid: 0
            };

            data?.forEach(bill => {
                if (bill.status === 'paid') {
                    newStats.totalPaid += bill.amount;
                    newStats.countPaid++;
                } else if (bill.status === 'pending') {
                    newStats.totalPending += bill.amount;
                    newStats.countPending++;
                } else {
                    newStats.totalUnpaid += bill.amount;
                    newStats.countUnpaid++;
                }
            });

            setStats(newStats);
        } catch (err) {
            console.error('Report Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amt);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <TrendingUp size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Laporan Keuangan</h1>
                    <p className="text-slate-500 dark:text-slate-400">Ringkasan real-time arus kas dari tagihan mahasiswa.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={18} />
                        Export PDF
                    </button>
                    <button onClick={fetchData} className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        Refresh Data
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                            <DollarSign size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                            <ArrowUpRight size={14} /> 12%
                        </span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pendapatan (Lunas)</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{formatCurrency(stats.totalPaid)}</h3>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[70%]" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{stats.countPaid} Transaksi</span>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                            <CreditCard size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                            DI PROSES
                        </span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tagihan Pending (Verifikasi)</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{formatCurrency(stats.totalPending)}</h3>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-[30%]" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{stats.countPending} Mahasiswa</span>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-xl shadow-slate-900/10 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10">
                                <TrendingDown size={24} />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-black text-red-400 bg-red-400/10 px-2 py-1 rounded-lg border border-red-400/20">
                                <ArrowDownRight size={14} /> PIUTANG
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tunggakan (Belum Bayar)</p>
                        <h3 className="text-3xl font-black text-white mb-4">{formatCurrency(stats.totalUnpaid)}</h3>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-red-500 w-[50%]" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{stats.countUnpaid} Mahasiswa</span>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -z-0"></div>
                </motion.div>
            </div>

            {/* Visual Charts Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="font-bold flex items-center gap-2">
                            <BarChart3 size={18} className="text-primary" />
                            Grafik Pendapatan Bulanan
                        </h3>
                        <div className="flex gap-2">
                            {['6B', '1T'].map(p => <button key={p} className="px-3 py-1 text-[10px] font-black rounded-lg border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary transition-colors">{p}</button>)}
                        </div>
                    </div>

                    <div className="h-64 flex items-end gap-4 px-2">
                        {[40, 65, 45, 80, 55, 90, 75].map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="w-full relative">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${val}%` }}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl group-hover:bg-primary/20 transition-all border border-transparent group-hover:border-primary/20"
                                    />
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${val * 0.7}%` }}
                                        className="absolute bottom-0 left-0 w-full bg-primary rounded-xl"
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Bln {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="font-bold flex items-center gap-2">
                            <PieChartIcon size={18} className="text-primary" />
                            Distribusi Status Tagihan
                        </h3>
                    </div>

                    <div className="flex items-center justify-around gap-8 h-64">
                        <div className="relative w-48 h-48 rounded-full border-[16px] border-slate-50 dark:border-slate-800 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-2xl font-black text-slate-900 dark:text-white">100%</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Akumulasi</p>
                            </div>
                            {/* Simple CSS radial progress simulation could go here */}
                        </div>

                        <div className="space-y-4 flex-1 max-w-[160px]">
                            {[
                                { label: 'Lunas', color: 'bg-emerald-500', val: stats.countPaid },
                                { label: 'Pending', color: 'bg-amber-500', val: stats.countPending },
                                { label: 'Tunggakan', color: 'bg-red-500', val: stats.countUnpaid }
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", item.color)} />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
                                    </div>
                                    <span className="text-xs font-black">{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceReportPage;
