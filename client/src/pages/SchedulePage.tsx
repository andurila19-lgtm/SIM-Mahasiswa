import React, { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    User,
    BookOpen,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Filter,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import Toast, { ToastType } from '../components/Toast';

interface ScheduledCourse {
    id: string;
    name: string;
    code: string;
    lecturer: string;
    schedule: string; // "Monday, 08:00 - 10:30"
    room: string;
    sks: number;
}

const SchedulePage: React.FC = () => {
    const { profile } = useAuth();
    const [courses, setCourses] = useState<ScheduledCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<string>('');

    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const fetchSchedule = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_krs')
                .select('courses')
                .eq('student_id', profile.id)
                .eq('status', 'approved')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data?.courses) {
                setCourses(data.courses);
            }
        } catch (err: any) {
            console.error('Fetch Schedule Error:', err);
            showToast('Gagal memuat jadwal kuliah', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
        // Set current day as default
        const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
        if (days.includes(today)) setSelectedDay(today);
        else setSelectedDay('Senin');
    }, [profile]);

    const filteredCourses = courses.filter(c => {
        if (!selectedDay) return true;
        return c.schedule.startsWith(selectedDay);
    }).sort((a, b) => {
        const timeA = a.schedule.split(', ')[1]?.split(' - ')[0] || '';
        const timeB = b.schedule.split(', ')[1]?.split(' - ')[0] || '';
        return timeA.localeCompare(timeB);
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <CalendarIcon size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Jadwal Perkuliahan</h1>
                    <p className="text-slate-500 dark:text-slate-400">Semester Genap 2023/2024 • {profile?.full_name}</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={18} />
                        Cetak Jadwal
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Day Selector */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
                {days.map(day => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                            "px-8 py-3 rounded-2xl text-sm font-black transition-all",
                            selectedDay === day
                                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        {day}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Schedule List */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                            </div>
                        ) : filteredCourses.length > 0 ? (
                            filteredCourses.map((course, idx) => (
                                <motion.div
                                    key={course.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">
                                                    {course.code}
                                                </span>
                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black rounded-lg uppercase tracking-widest">
                                                    {course.sks} SKS
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-tight">
                                                {course.name}
                                            </h3>
                                            <div className="flex flex-wrap gap-6 text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <User size={16} className="text-slate-400" />
                                                    <span className="font-bold">{course.lecturer}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-slate-400" />
                                                    <span className="font-bold uppercase tracking-wide">{course.room}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center md:items-end shrink-0">
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center min-w-[140px]">
                                                <Clock size={20} className="text-primary mb-2" />
                                                <span className="text-lg font-black text-slate-800 dark:text-white">
                                                    {course.schedule.split(', ')[1]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 left-0 w-2 h-0 group-hover:h-full bg-primary transition-all duration-500 rounded-l-3xl"></div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-slate-900 p-20 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                                    <BookOpen size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Libur hari ini!</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">Tidak ada jadwal perkuliahan untuk hari {selectedDay}. Manfaatkan waktu luangmu dengan bijak.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[32px] p-8 border border-slate-800 shadow-2xl overflow-hidden relative group">
                        <div className="relative z-10">
                            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                                <BookOpen size={18} className="text-primary" />
                                Statistik KRS
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Matkul</span>
                                    <span className="text-2xl font-black text-white">{courses.length}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total SKS</span>
                                    <span className="text-2xl font-black text-primary">
                                        {courses.reduce((sum, c) => sum + (c.sks || 0), 0)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-10 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 text-primary">
                                <Filter size={18} />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                    Status: Terverifikasi <br />
                                    <span className="opacity-70">Sesuai data KRS Semester Genap</span>
                                </p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] -z-0"></div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-[32px] p-8 border border-white/10 flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                            <CalendarIcon size={32} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">Presensi Digital</h4>
                            <p className="text-xs text-slate-500 mb-6 mt-2">Gunakan QR Code di aplikasi mobile untuk melakukan presensi di kelas.</p>
                            <button className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group">
                                Buka QR Scanner
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default SchedulePage;
