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
    School,
    Printer
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
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all profiles for stats
            const { data: allData, error: profileError } = await supabase
                .from('profiles')
                .select('*');
            if (profileError) throw profileError;

            // Fetch students specifically for the list
            const studentProfiles = allData?.filter(p => p.role === 'mahasiswa') || [];

            // Mock IPK logic (since grades are in krs/student_krs)
            // In real app, we would join with grades table
            const studentsWithIpk = studentProfiles.map(s => ({
                ...s,
                gpa: (Math.random() * (4.0 - 2.5) + 2.5).toFixed(2), // Mock GPA
                total_sks: Math.floor(Math.random() * (120 - 40) + 40)
            }));

            setStudents(studentsWithIpk);

            const newStats = {
                total: studentsWithIpk.length,
                active: 0,
                graduated: 0,
                leave: 0,
                prodiDistrib: {} as Record<string, number>
            };

            studentsWithIpk.forEach(s => {
                if (s.status === 'active') newStats.active++;
                else if (s.status === 'graduated') newStats.graduated++;
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

    const handlePrint = (student: any, type: 'khs' | 'transcript') => {
        alert(`Mencetak ${type.toUpperCase()} untuk ${student.full_name}...`);
        window.print();
    };

    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nim_nip?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const prodiLabels = Object.keys(stats.prodiDistrib).slice(0, 5);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <GraduationCap size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Monitoring & Pelaporan</h1>
                    <p className="text-slate-500 dark:text-slate-400">Analisis IPK mahasiswa dan pencetakan dokumen akademik resmi.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10 no-print">
                    <button onClick={fetchData} className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        Refresh Data
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
                {[
                    { label: 'Total Mahasiswa', value: stats.total, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Mahasiswa Aktif', value: stats.active, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Rerata IPK', value: '3.42', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
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

            {/* Student List & GPA Monitoring */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px]">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/10">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Users size={20} className="text-primary" />
                        Daftar Mahasiswa & Monitoring IPK
                    </h3>
                    <div className="relative no-print">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari Mahasiswa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border-none outline-none py-2.5 pl-10 pr-4 rounded-xl text-xs w-64 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 dark:border-slate-800/50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Semester</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total SKS</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">IPK</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right no-print">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Data...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Tidak ada data ditemukan.</td></tr>
                            ) : (
                                filteredStudents.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs border border-primary/10 group-hover:scale-110 transition-transform">
                                                    {s.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{s.full_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{s.nim_nip} • {s.study_program}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center font-bold text-slate-600 dark:text-slate-400 text-sm">
                                            {s.semester || 1}
                                        </td>
                                        <td className="px-8 py-6 text-center font-bold text-slate-600 dark:text-slate-400 text-sm">
                                            {s.total_sks}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={cn(
                                                "inline-block px-3 py-1 rounded-lg text-xs font-black",
                                                parseFloat(s.gpa) >= 3.5 ? "bg-emerald-50 text-emerald-600" :
                                                    parseFloat(s.gpa) >= 3.0 ? "bg-blue-50 text-blue-600" :
                                                        "bg-amber-50 text-amber-600"
                                            )}>
                                                {s.gpa}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right no-print">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handlePrint(s, 'khs')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 rounded-lg hover:border-primary hover:text-primary transition-all uppercase tracking-tighter"
                                                >
                                                    <Printer size={12} />
                                                    KHS
                                                </button>
                                                <button
                                                    onClick={() => handlePrint(s, 'transcript')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/20 text-[10px] font-black text-primary rounded-lg hover:bg-primary hover:text-white transition-all uppercase tracking-tighter shadow-sm shadow-primary/5"
                                                >
                                                    <Download size={12} />
                                                    Transkrip
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AcademicReportPage;
