import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    User,
    BookOpen,
    GraduationCap,
    Calendar,
    Bell,
    TrendingUp,
    ArrowRight,
    ClipboardCheck,
    CreditCard,
    MapPin,
    Clock,
    ExternalLink,
    School
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface Stat {
    id: number;
    name: string;
    value: string;
    icon: any;
    color: string;
    bg: string;
}

interface ScheduleItem {
    id: number;
    time: string;
    subject: string;
    room: string;
    lecturer: string;
    type: string;
}

interface NewsItem {
    id: number;
    title: string;
    date: string;
    tag: string;
    content: string;
}

const DashboardPage: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stat[]>([]);
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [announcements, setAnnouncements] = useState<NewsItem[]>([]);
    const [selectedSemester, setSelectedSemester] = useState('Semua Semester');

    const allChartData: any[] = [];

    const [chartData, setChartData] = useState(allChartData);

    useEffect(() => {
        if (selectedSemester === 'Semua Semester') {
            setChartData(allChartData);
        } else {
            const filtered = allChartData.filter(d => d.name === selectedSemester);
            setChartData(filtered);
        }
    }, [selectedSemester]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            // Default stats for students
            const defaultStats: Stat[] = [
                { id: 1, name: 'IPK Terakhir', value: '4.00', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { id: 2, name: 'SKS Kumulatif', value: '0', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                { id: 3, name: 'Presensi', value: '100%', icon: ClipboardCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                { id: 4, name: 'Status Bayar', value: 'Lunas', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            ];

            const lecturerStats: Stat[] = [
                { id: 1, name: 'Kelas Aktif', value: '4', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { id: 2, name: 'Total Mahasiswa', value: '128', icon: User, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                { id: 3, name: 'Kehadiran (Avg)', value: '92%', icon: ClipboardCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { id: 4, name: 'Butuh Penilaian', value: '12', icon: GraduationCap, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
            ];

            const akademikStats: Stat[] = [
                { id: 1, name: 'KRS Pending', value: '24', icon: ClipboardCheck, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                { id: 2, name: 'Jadwal Aktif', value: '56', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { id: 3, name: 'Mhs Cuti', value: '3', icon: Users, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                { id: 4, name: 'Ruang Tersedia', value: '15/40', icon: MapPin, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            ];

            const keuanganStats: Stat[] = [
                { id: 1, name: 'Total Pemasukan', value: 'Rp 450M+', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { id: 2, name: 'Mhs Belum Bayar', value: '12', icon: Users, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                { id: 3, name: 'Invoice Baru', value: '8', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { id: 4, name: 'Laporan Keuangan', value: 'Ready', icon: ClipboardCheck, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            ];

            if (profile?.role === 'superadmin') {
                try {
                    const { count: sCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mahasiswa');
                    const { count: lCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'dosen');
                    const adminStats: Stat[] = [
                        { id: 1, name: 'Total Mahasiswa', value: (sCount || 0).toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { id: 2, name: 'Total Dosen', value: (lCount || 0).toString(), icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                        { id: 3, name: 'Pembayaran (Bln)', value: 'Rp 1.2M', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { id: 4, name: 'Status Sistem', value: 'Online', icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50' },
                    ];
                    setStats(adminStats);
                } catch (err) {
                    console.error('Error fetching admin stats:', err);
                }
            } else if (profile?.role === 'dosen') {
                setStats(lecturerStats);
            } else if (profile?.role === 'akademik') {
                setStats(akademikStats);
            } else if (profile?.role === 'keuangan') {
                setStats(keuanganStats);
            } else {
                setStats(defaultStats);
            }
        };

        const mockSchedule: ScheduleItem[] = [];

        const mockAnnouncements: NewsItem[] = [];

        fetchDashboardData();
        setSchedule(mockSchedule);
        setAnnouncements(mockAnnouncements);
    }, [profile]);

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
            {/* Hero Section - Ultra Compact */}
            <div className="relative overflow-hidden bg-primary rounded-2xl lg:rounded-3xl p-4 lg:p-6 text-white shadow-lg shadow-primary/20">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 lg:gap-6">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0">
                            <School size={20} className="lg:scale-110" />
                        </div>
                        <div>
                            <h1 className="text-xl lg:text-2xl font-black leading-tight mb-1">
                                Hi, <span className="text-white/80">{profile?.full_name?.split(' ')[0] || (profile?.role === 'mahasiswa' ? 'Mahasiswa' : 'User')}!</span>
                            </h1>
                            <p className="text-[10px] lg:text-sm font-medium opacity-70">
                                {profile?.role === 'superadmin' ? 'Monitoring aktivitas kampus Anda hari ini.' :
                                    profile?.role === 'mahasiswa' ? 'Selamat datang kembali di SIM CEPAT.' :
                                        profile?.role === 'dosen' ? 'Selamat mengajar & membimbing mahasiswa.' :
                                            profile?.role === 'akademik' ? 'Kelola kurikulum & jadwal dengan mudah.' :
                                                'Akses data keuangan & pembayaran mahasiswa.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl lg:rounded-2xl border border-white/10">
                        <div className="text-center sm:text-left">
                            <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest opacity-50">Semester</p>
                            <p className="text-xs lg:text-sm font-bold">Gan-5</p>
                        </div>
                        <div className="w-[1px] h-6 bg-white/20"></div>
                        <div className="text-center sm:text-left">
                            <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest opacity-50">Tahun</p>
                            <p className="text-xs lg:text-sm font-bold">23/24</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat) => (
                    <motion.div
                        key={stat.id}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6"
                    >
                        <div className={cn("w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                            <stat.icon size={20} className="lg:scale-125" />
                        </div>
                        <div>
                            <p className="text-[10px] lg:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-0.5 lg:mb-1">{stat.name}</p>
                            <p className="text-lg lg:text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                            <div>
                                <h3 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white">Progres IPK Semester</h3>
                                <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">Statistik performa selama masa studi</p>
                            </div>
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border-none outline-none text-xs lg:text-sm font-bold px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 w-full sm:w-auto cursor-pointer"
                            >
                                <option value="Semua Semester">Semua Semester</option>
                                <option value="Semester 1">Semester 1</option>
                                <option value="Semester 2">Semester 2</option>
                                <option value="Semester 3">Semester 3</option>
                                <option value="Semester 4">Semester 4</option>
                                <option value="Semester 5">Semester 5</option>
                            </select>
                        </div>
                        <div className="h-[250px] lg:h-[300px] w-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 mt-4">
                            <p className="text-slate-400 font-medium text-sm">Belum ada data IPK untuk ditampilkan.</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white">Jadwal Kuliah Hari Ini</h3>
                            {profile?.role !== 'mahasiswa' && (
                                <button
                                    onClick={() => navigate('/academic')}
                                    className="text-primary text-xs lg:text-sm font-bold flex items-center gap-1 hover:underline"
                                >
                                    Lihat Kalender <ExternalLink size={14} />
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {schedule.map((item) => (
                                <div key={item.id} className="group p-4 lg:p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-4 lg:gap-6">
                                        <div className="px-3 py-2 lg:px-4 lg:py-3 bg-white dark:bg-slate-700 rounded-xl text-center shadow-sm min-w-[80px] lg:min-w-[100px]">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Pukul</p>
                                            <p className="text-xs lg:text-sm font-bold text-primary">{item.time.split(' - ')[0]}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{item.subject}</h4>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] lg:text-xs text-slate-500 font-medium">
                                                <span className="flex items-center gap-1"><MapPin size={12} className="text-primary/60" /> {item.room}</span>
                                                <span className="flex items-center gap-1"><User size={12} className="text-primary/60" /> {item.lecturer}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl opacity-0 lg:group-hover:opacity-100 transition-all">
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6 lg:space-y-8">
                    {profile?.role !== 'mahasiswa' && (
                        <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white">Pengumuman</h3>
                                <Bell size={20} className="text-slate-400" />
                            </div>
                            <div className="space-y-6">
                                {announcements.map((news) => (
                                    <div
                                        key={news.id}
                                        onClick={() => navigate('/announcements')}
                                        className="space-y-2 relative pl-4 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-primary/20 hover:before:bg-primary before:transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase tracking-wide">{news.tag}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">{news.date}</span>
                                        </div>
                                        <h4 className="text-xs lg:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors line-clamp-2">{news.title}</h4>
                                        <p className="text-[10px] lg:text-xs text-slate-500 line-clamp-2 leading-relaxed">{news.content}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => navigate('/announcements')}
                                className="w-full mt-8 py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs lg:text-sm rounded-2xl transition-all"
                            >
                                Semua Pengumuman
                            </button>
                        </div>
                    )}

                    <div className="bg-gradient-to-br from-primary to-blue-600 p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-primary/20 shadow-xl shadow-primary/20 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-lg lg:text-xl font-bold mb-2">Pendaftaran KRS</h3>
                            <p className="text-blue-100 text-xs lg:text-sm mb-8 opacity-80 leading-relaxed">Periode Semester Genap 2023/2024 masih dibuka hingga 10 Maret 2026.</p>
                            <button
                                onClick={() => navigate('/krs')}
                                className="w-full sm:w-auto px-6 py-3 bg-white text-primary font-bold rounded-xl text-xs lg:text-sm flex items-center justify-center gap-2 group/btn shadow-lg shadow-black/10 active:scale-95 transition-all"
                            >
                                Daftar Sekarang
                                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="absolute top-4 right-4 text-white/20">
                            <BookOpen size={64} strokeWidth={1} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
