import React, { useState, useEffect, useMemo } from 'react';
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

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const FinanceReportPage: React.FC = () => {
    const [bills, setBills] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalPaid: 0,
        totalPending: 0,
        totalUnpaid: 0,
        countPaid: 0,
        countPending: 0,
        countUnpaid: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState<string>('all');

    const fetchData = async () => {
        setRefreshing(true);
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_bills')
                .select('*, profiles:student_id(full_name, nim_nip, faculty, study_program)');

            if (error) throw error;
            setBills(data || []);

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
            setRefreshing(false);
        }
    };

    const filteredBills = useMemo(() => {
        if (selectedSemester === 'all') return bills;
        return bills.filter(b => b.semester === selectedSemester);
    }, [bills, selectedSemester]);

    const activeStats = useMemo(() => {
        const s = { totalPaid: 0, totalPending: 0, totalUnpaid: 0, countPaid: 0, countPending: 0, countUnpaid: 0 };
        filteredBills.forEach(b => {
            if (b.status === 'paid') { s.totalPaid += b.amount; s.countPaid++; }
            else if (b.status === 'pending') { s.totalPending += b.amount; s.countPending++; }
            else { s.totalUnpaid += b.amount; s.countUnpaid++; }
        });
        return s;
    }, [filteredBills]);

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amt);
    };

    // ─── Data for Charts ──────────────────────────────────────────
    const chartData = useMemo(() => {
        const monthlyData: Record<string, any> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        // Initialize 6 months
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            monthlyData[key] = { name: key, pendapatan: 0, piutang: 0 };
        }

        filteredBills.forEach(b => {
            const d = new Date(b.created_at);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            if (monthlyData[key]) {
                if (b.status === 'paid') monthlyData[key].pendapatan += b.amount;
                else monthlyData[key].piutang += b.amount;
            }
        });

        return Object.values(monthlyData);
    }, [filteredBills]);

    const pieData = [
        { name: 'Lunas', value: activeStats.totalPaid, color: '#10b981' },
        { name: 'Pending', value: activeStats.totalPending, color: '#f59e0b' },
        { name: 'Belum Bayar', value: activeStats.totalUnpaid, color: '#ef4444' },
    ];

    // ─── Export Laporan Excel ─────────────────────────────────────
    const exportToExcel = () => {
        const worksheetData = bills.map(b => ({
            'Nama Mahasiswa': b.profiles?.full_name || '-',
            'NIM': b.profiles?.nim_nip || '-',
            'Fakultas': b.profiles?.faculty || '-',
            'Prodi': b.profiles?.study_program || '-',
            'Deskripsi': b.description,
            'Kategori': b.category || 'UKT',
            'Semester': b.semester || '-',
            'Nominal': b.amount,
            'Status': b.status === 'paid' ? 'Lunas' : b.status === 'pending' ? 'Pending' : 'Belum Bayar',
            'Tanggal': new Date(b.created_at).toLocaleDateString('id-ID')
        }));

        const ws = XLSX.utils.json_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `Laporan_Keuangan_SIM_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // ─── Export Laporan sebagai PNG ─────────────────────────────
    const exportReport = () => {
        // Reuse existing PNG export if needed, but Excel is better for finance
        exportToExcel();
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
                    <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                        <option value="all">Semua Semester</option>
                        {Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <button onClick={exportReport} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={18} />
                        Export Excel
                    </button>
                    <button onClick={fetchData} disabled={refreshing} className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70">
                        {refreshing && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {refreshing ? 'Memuat...' : 'Refresh Data'}
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
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pendapatan (Lunas)</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{formatCurrency(activeStats.totalPaid)}</h3>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[70%]" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{activeStats.countPaid} Transaksi</span>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                            <CreditCard size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tagihan Pending (Verifikasi)</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{formatCurrency(activeStats.totalPending)}</h3>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-[30%]" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{activeStats.countPending} Mahasiswa</span>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-xl shadow-slate-900/10 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10">
                                <TrendingDown size={24} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tunggakan (Belum Bayar)</p>
                        <h3 className="text-3xl font-black text-white mb-4">{formatCurrency(activeStats.totalUnpaid)}</h3>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-red-500 w-[50%]" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{activeStats.countUnpaid} Mahasiswa</span>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -z-0"></div>
                </motion.div>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-lg">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="font-bold flex items-center gap-2">
                            <BarChart3 size={18} className="text-primary" />
                            Tren Pendapatan & Piutang (6 Bulan Terakhir)
                        </h3>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                                    tickFormatter={(value) => `${value / 1000000}jt`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Bar dataKey="pendapatan" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Pendapatan" />
                                <Bar dataKey="piutang" fill="#ef4444" radius={[4, 4, 0, 0]} name="Piutang" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-lg">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="font-bold flex items-center gap-2">
                            <PieChartIcon size={18} className="text-primary" />
                            Distribusi Realisasi Tagihan
                        </h3>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-around gap-8 h-72">
                        <div className="w-full h-full max-w-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-4 flex-1 w-full max-w-[200px]">
                            {pieData.map(item => (
                                <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">
                                        {Math.round((item.value / (stats.totalPaid + stats.totalPending + stats.totalUnpaid || 1)) * 100)}%
                                    </span>
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
