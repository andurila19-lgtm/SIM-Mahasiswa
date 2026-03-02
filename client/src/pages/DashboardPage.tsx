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

    const allChartData = [
        { name: 'Semester 1', ipk: 3.42 },
        { name: 'Semester 2', ipk: 3.58 },
        { name: 'Semester 3', ipk: 3.75 },
        { name: 'Semester 4', ipk: 3.82 },
        { name: 'Semester 5', ipk: 3.82 },
    ];

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
        // Data simulasi untuk UI awal
        const defaultStats: Stat[] = [
            { id: 1, name: 'IPK Terakhir', value: '3.82', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { id: 2, name: 'SKS Kumulatif', value: '84', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { id: 3, name: 'Presensi', value: '92%', icon: ClipboardCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
            { id: 4, name: 'Status Bayar', value: 'Lunas', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ];

        const lecturerStats: Stat[] = [
            { id: 1, name: 'Total Mahasiswa', value: '142', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { id: 2, name: 'Mata Kuliah', value: '4', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { id: 3, name: 'Jadwal Hari Ini', value: '2', icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { id: 4, name: 'Butuh Penilaian', value: '48', icon: GraduationCap, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        ];

        const superAdminStats: Stat[] = [
            { id: 1, name: 'Total Pengguna', value: '2.4k', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { id: 2, name: 'Prodi Aktif', value: '12', icon: School, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { id: 3, name: 'Transaksi Hari Ini', value: '84', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { id: 4, name: 'Laporan Sistem', value: '0 Error', icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' },
        ];

        const mockSchedule: ScheduleItem[] = [
            { id: 1, time: '08:00 - 10:00', subject: 'Pemrograman Web II', room: 'Lab Komputer 02', lecturer: 'Dr. Ahmad Subarjo', type: 'lecture' },
            { id: 2, time: '13:00 - 15:00', subject: 'Kecerdasan Buatan', room: 'R. Teori 304', lecturer: 'Ir. Budi Santoso, M.Kom', type: 'lecture' },
        ];

        const mockAnnouncements: NewsItem[] = [
            { id: 1, title: 'Pembayaran UKT Semester Genap 2023/2024', date: '2 Mar 2026', tag: 'Keuangan', content: 'Batas akhir pembayaran UKT diperpanjang hingga 15 Maret 2026.' },
            { id: 2, title: 'Sosialisasi Program MBKM Angkatan 5', date: '28 Feb 2026', tag: 'Akademik', content: 'Dibutuhkan 50 mahasiswa untuk program magang di industri ternama.' },
        ];

        if (profile?.role === 'super_admin') setStats(superAdminStats);
        else if (profile?.role === 'lecturer') setStats(lecturerStats);
        else setStats(defaultStats);

        setSchedule(mockSchedule);
        setAnnouncements(mockAnnouncements);
    }, [profile]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Selamat Datang, <span className="text-primary">{profile?.full_name?.split(' ')[0] || 'User'}</span> 👋
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Berikut ringkasan akademik Anda untuk hari ini, 2 Maret 2026.
                    </p>
                </div>
                <div className="relative z-10 hidden md:block">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-primary shadow-sm">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tahun Akademik</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">2023/2024 Genap</p>
                        </div>
                    </div>
                </div>
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 -z-0"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <motion.div
                        key={stat.id}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6"
                    >
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{stat.name}</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Progres IPK Semester</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Statistik performa selama masa studi</p>
                            </div>
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm font-bold px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300"
                            >
                                <option value="Semua Semester">Semua Semester</option>
                                <option value="Semester 1">Semester 1</option>
                                <option value="Semester 2">Semester 2</option>
                                <option value="Semester 3">Semester 3</option>
                                <option value="Semester 4">Semester 4</option>
                                <option value="Semester 5">Semester 5</option>
                            </select>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                {selectedSemester === 'Semua Semester' ? (
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorIpk" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickMargin={12} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
                                        <Area type="monotone" dataKey="ipk" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIpk)" />
                                    </AreaChart>
                                ) : (
                                    <BarChart data={chartData}>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickMargin={12} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
                                        <Bar dataKey="ipk" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={80} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Jadwal Kuliah Hari Ini</h3>
                            <button
                                onClick={() => navigate('/academic')}
                                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                            >
                                Lihat Kalender <ExternalLink size={14} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {schedule.map((item) => (
                                <div key={item.id} className="group p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="px-4 py-3 bg-white dark:bg-slate-700 rounded-xl text-center shadow-sm min-w-[100px]">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-1">Pukul</p>
                                            <p className="text-sm font-bold text-primary">{item.time.split(' - ')[0]}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{item.subject}</h4>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                                <span className="flex items-center gap-1"><MapPin size={14} className="text-primary/60" /> {item.room}</span>
                                                <span className="flex items-center gap-1"><User size={14} className="text-primary/60" /> {item.lecturer}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pengumuman</h3>
                            <Bell size={20} className="text-slate-400" />
                        </div>
                        <div className="space-y-6">
                            {announcements.map((news) => (
                                <div key={news.id} className="space-y-2 relative pl-4 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-primary/20 hover:before:bg-primary before:transition-colors cursor-pointer group">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase tracking-wide">{news.tag}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{news.date}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{news.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{news.content}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/announcements')}
                            className="w-full mt-10 py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm rounded-2xl transition-all"
                        >
                            Semua Pengumuman
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-primary to-blue-600 p-8 rounded-3xl border border-primary/20 shadow-xl shadow-primary/20 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2">Pendaftaran KRS</h3>
                            <p className="text-blue-100 text-sm mb-8 opacity-80">Periode Semester Genap 2023/2024 masih dibuka hingga 10 Maret 2026.</p>
                            <button
                                onClick={() => navigate('/krs')}
                                className="px-6 py-3 bg-white text-primary font-bold rounded-xl text-sm flex items-center gap-2 group/btn shadow-lg shadow-black/10"
                            >
                                Daftar Sekarang
                                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-all duration-700"></div>
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
