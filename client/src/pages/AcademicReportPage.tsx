import React, { useState, useEffect } from 'react';
import {
    Users,
    GraduationCap,
    TrendingUp,
    BookOpen,
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    PieChart,
    Layers,
    Activity,
    School
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const AcademicReportPage: React.FC = () => {
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        graduated: 0,
        leave: 0,
        prodiDistrib: {} as Record<string, number>
    });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('role, study_program, status');
            if (error) throw error;

            const newStats = {
                total: 0,
                active: 0,
                graduated: 0,
                leave: 0,
                prodiDistrib: {} as Record<string, number>
            };

            const students = data?.filter(p => p.role === 'mahasiswa') || [];
            newStats.total = students.length;

            students.forEach(s => {
                if (s.status === 'Aktif') newStats.active++;
                else if (s.status === 'Lulus') newStats.graduated++;
                else newStats.leave++;

                if (s.study_program) {
                    newStats.prodiDistrib[s.study_program] = (newStats.prodiDistrib[s.study_program] || 0) + 1;
                }
            });

            setStats(newStats);
        } catch (err) {
            console.error('Academic Report Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const prodiLabels = Object.keys(stats.prodiDistrib).slice(0, 5);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <GraduationCap size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Statistik Akademik</h1>
                    <p className="text-slate-500 dark:text-slate-400">Analisis data mahasiswa, persebaran prodi, dan status akademik.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={18} />
                        Download Laporan
                    </button>
                    <button onClick={fetchData} className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        Sinkronisasi Data
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Mahasiswa', value: stats.total, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Mahasiswa Aktif', value: stats.active, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Telah Lulus', value: stats.graduated, icon: School, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Cuti / Non-Aktif', value: stats.leave, icon: Layers, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((item, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative group">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 shadow-sm", item.bg, item.color)}>
                            <item.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{item.value.toLocaleString()}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Prodi Distribution */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="font-bold flex items-center gap-2">
                            <PieChart size={18} className="text-primary" />
                            Distribusi per Program Studi
                        </h3>
                    </div>

                    <div className="flex-1 space-y-6">
                        {prodiLabels.map((prodi, i) => {
                            const count = stats.prodiDistrib[prodi];
                            const percentage = (count / stats.total) * 100 || 0;
                            return (
                                <div key={prodi} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">{prodi}</span>
                                        <span className="text-[10px] font-black text-primary">{count} Mhs ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="h-4 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800/50">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: i * 0.1, duration: 1 }}
                                            className={cn("h-full transition-all rounded-lg",
                                                i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-blue-500" : "bg-emerald-500"
                                            )}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Academic Milestone Sidebar */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-white font-bold text-lg mb-8 flex items-center gap-2">
                                <TrendingUp size={18} className="text-primary" />
                                Rata-rata IPK Universitas
                            </h3>
                            <div className="text-center py-6">
                                <h4 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-blue-400">3.42</h4>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Peningkatan +0.12 dari Semester Lalu</p>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Kelulusan</p>
                                    <p className="text-lg font-black text-white">4.0 Thn</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Keketatan Prodi</p>
                                    <p className="text-lg font-black text-white">1:12</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -z-0"></div>
                    </div>

                    <div className="bg-gradient-to-br from-primary/5 to-emerald-500/5 p-8 rounded-[32px] border border-primary/10 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-primary shadow-sm border border-primary/10">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Trend Aktivitas MK</h4>
                                <p className="text-[10px] text-slate-500 font-medium tracking-tight">Menghitung rata-rata SKS per Mhs.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'SKS Ganjil', val: 21.4, icon: ArrowUpRight, color: 'text-emerald-500' },
                                { label: 'SKS Genap', val: 19.8, icon: ArrowDownRight, color: 'text-red-500' }
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <item.icon size={16} className={item.color} />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-black">{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicReportPage;
