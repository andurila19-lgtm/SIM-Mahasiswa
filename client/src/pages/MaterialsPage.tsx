import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Search,
    Upload,
    Folder,
    HardDrive,
    ArrowRight,
    PieChart,
    Plus,
    FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface MaterialStat {
    id: string;
    name: string;
    code: string;
    file_count: number;
    last_upload: string;
}

const MaterialsPage: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<MaterialStat[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('classes')
                    .select('id, name, courses(code)')
                    .eq('lecturer_id', profile?.id);

                if (data) {
                    const mapped: MaterialStat[] = data.map(c => {
                        const course = Array.isArray(c.courses) ? c.courses[0] : c.courses;
                        return {
                            id: c.id,
                            name: c.name,
                            code: course?.code || 'N/A',
                            file_count: Math.floor(Math.random() * 5) + 2,
                            last_upload: '2026-03-01'
                        };
                    });
                    setStats(mapped);
                } else {
                    // Mock
                    setStats([
                        { id: '1', name: 'Pemrograman Web II', code: 'IF202', file_count: 8, last_upload: '2024-03-01' },
                        { id: '2', name: 'Kecerdasan Buatan', code: 'AI301', file_count: 12, last_upload: '2024-03-02' },
                    ]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        if (profile?.id) fetchStats();
    }, [profile]);

    const filtered = stats.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <Folder size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Pusat Materi Kuliah</h1>
                    <p className="text-slate-500 dark:text-slate-400">Kelola modul, presentasi, dan materi ajar untuk semua kelas Anda.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 group active:scale-95 text-xs uppercase tracking-widest">
                        <Plus size={18} />
                        Upload Materi Baru
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total File', value: stats.reduce((acc, s) => acc + s.file_count, 0), icon: FileText, color: 'text-blue-500' },
                    { label: 'Penyimpanan', value: '1.2 GB', icon: HardDrive, color: 'text-amber-500' },
                    { label: 'Kelas Aktif', value: stats.length, icon: BookOpen, color: 'text-green-500' },
                    { label: 'Minggu Ini', value: '4 Upload', icon: PieChart, color: 'text-primary' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center gap-4 group"
                    >
                        <div className={cn("w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm", stat.color)}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <Plus size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">List Materi per Mata Kuliah</h3>
                    </div>
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari Mata Kuliah..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border-none outline-none py-3.5 pl-12 pr-6 rounded-2xl text-sm w-full md:w-64 focus:ring-2 focus:ring-primary/20 font-bold"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                    {loading ? (
                        <div className="col-span-full p-20 text-center font-bold text-slate-300 animate-pulse">Menghubungkan ke storage...</div>
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full p-20 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                            <BookOpen size={40} className="mx-auto mb-4 opacity-10" />
                            <p className="font-bold">Tidak ada mata kuliah yang sesuai</p>
                        </div>
                    ) : filtered.map((s, i) => (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={s.id}
                            onClick={() => navigate('/my-classes')}
                            className="group bg-slate-50/50 dark:bg-slate-800/30 p-8 rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 text-left hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden"
                        >
                            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-lg uppercase tracking-widest">
                                        {s.code}
                                    </span>
                                    <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-primary transition-colors">
                                        {s.name}
                                    </h4>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-slate-400" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.file_count} File</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Background Icon */}
                            <BookOpen size={120} className="absolute -bottom-8 -right-8 text-primary/5 group-hover:text-primary/10 transition-colors -rotate-12" />
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MaterialsPage;

