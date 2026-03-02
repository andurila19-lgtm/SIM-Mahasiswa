import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, MapPin, Calendar, ChevronRight, Search, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ClassItem {
    id: string;
    name: string;
    day: string;
    start_time: string;
    end_time: string;
    room: string;
    capacity: number;
    courses?: { name: string; code: string; sks: number };
}

const MyClassesPage: React.FC = () => {
    const { profile } = useAuth();
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchClasses = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('classes')
                    .select('*, courses(name, code, sks)')
                    .eq('lecturer_id', profile?.id)
                    .order('day', { ascending: true });

                if (!error && data) setClasses(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (profile?.id) fetchClasses();
    }, [profile]);

    const dayOrder: Record<string, number> = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
    const sortedClasses = [...classes].sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99));
    const filtered = sortedClasses.filter(c =>
        c.courses?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayClasses = filtered;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <BookOpen size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Kelas Saya</h1>
                    <p className="text-slate-500 dark:text-slate-400">Daftar kelas yang Anda ampu semester ini.</p>
                </div>
                <div className="relative z-10">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari kelas..."
                            className="bg-slate-100 dark:bg-slate-800 border-none outline-none py-3 pl-10 pr-4 rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Stats Quick Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Kelas', value: displayClasses.length.toString(), icon: BookOpen, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Total SKS', value: displayClasses.reduce((a, c) => a + (c.courses?.sks || 0), 0).toString(), icon: GraduationCap, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
                    { label: 'Total Mahasiswa', value: displayClasses.reduce((a, c) => a + c.capacity, 0).toString(), icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Hari Mengajar', value: new Set(displayClasses.map(c => c.day)).size.toString(), icon: Calendar, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", stat.color)}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-0.5">{stat.label}</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Class Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-full p-20 text-center text-slate-400 font-bold">Memuat data...</div>
                ) : (
                    displayClasses.map((item) => (
                        <motion.div
                            key={item.id}
                            whileHover={{ y: -4 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="px-3 py-1.5 bg-primary/10 rounded-lg text-[10px] font-bold text-primary uppercase tracking-widest">
                                    {item.day} • {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                                </div>
                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            </div>
                            <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-1 group-hover:text-primary transition-colors">
                                {item.courses?.name || 'Mata Kuliah'}
                            </h4>
                            <p className="text-xs text-slate-400 font-bold mb-4">
                                {item.courses?.code} • Kelas {item.name} • {item.courses?.sks} SKS
                            </p>
                            <div className="flex items-center gap-5 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary/60" /> {item.room}</span>
                                <span className="flex items-center gap-1.5"><Users size={14} className="text-primary/60" /> {item.capacity} Mahasiswa</span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyClassesPage;
