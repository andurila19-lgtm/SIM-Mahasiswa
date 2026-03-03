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
    School,
    Sparkles,
    MessageSquare,
    Zap,
    BrainCircuit,
    Cpu,
    X,
    TrendingDown,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
            setLoading(true);
            try {
                const formatCurrency = (n: number) => {
                    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
                };

                if (profile?.role === 'superadmin') {
                    // ─── Superadmin: real counts + real monthly payment ───
                    const { count: sCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mahasiswa');
                    const { count: lCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'dosen');

                    // Monthly paid amount
                    const now = new Date();
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                    const { data: monthlyBills } = await supabase
                        .from('student_bills')
                        .select('amount')
                        .eq('status', 'paid')
                        .gte('created_at', startOfMonth);
                    const monthlyPaid = (monthlyBills || []).reduce((s: number, b: any) => s + (b.amount || 0), 0);

                    const adminStats: Stat[] = [
                        { id: 1, name: 'Total Mahasiswa', value: (sCount || 0).toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { id: 2, name: 'Total Dosen', value: (lCount || 0).toString(), icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                        { id: 3, name: 'Pembayaran (Bln)', value: formatCurrency(monthlyPaid), icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { id: 4, name: 'Status Sistem', value: 'Online', icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50' },
                    ];
                    setStats(adminStats);

                } else if (profile?.role === 'dosen') {
                    // ─── Dosen: real student count ───
                    const { count: mhsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mahasiswa');
                    const { count: pendingKrs } = await supabase.from('student_krs').select('*', { count: 'exact', head: true }).eq('status', 'pending');

                    const lecturerStats: Stat[] = [
                        { id: 1, name: 'Kelas Aktif', value: '-', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { id: 2, name: 'Total Mahasiswa', value: (mhsCount || 0).toString(), icon: User, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                        { id: 3, name: 'KRS Pending', value: (pendingKrs || 0).toString(), icon: ClipboardCheck, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                        { id: 4, name: 'Butuh Penilaian', value: '-', icon: GraduationCap, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                    ];
                    setStats(lecturerStats);

                } else if (profile?.role === 'akademik') {
                    // ─── Akademik: real KRS pending, student counts ───
                    const { count: pendingKrs } = await supabase.from('student_krs').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                    const { count: totalMhs } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mahasiswa');
                    const { count: totalDosen } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'dosen');

                    const akademikStats: Stat[] = [
                        { id: 1, name: 'KRS Pending', value: (pendingKrs || 0).toString(), icon: ClipboardCheck, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                        { id: 2, name: 'Total Mahasiswa', value: (totalMhs || 0).toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { id: 3, name: 'Total Dosen', value: (totalDosen || 0).toString(), icon: User, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                        { id: 4, name: 'Status Sistem', value: 'Aktif', icon: MapPin, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                    ];
                    setStats(akademikStats);

                } else if (profile?.role === 'keuangan') {
                    // ─── Keuangan: real-time financial stats ───
                    const { data: allBills } = await supabase
                        .from('student_bills')
                        .select('amount, status, student_id, created_at');

                    const bills = allBills || [];
                    const paidTotal = bills.filter((b: any) => b.status === 'paid').reduce((s: number, b: any) => s + (b.amount || 0), 0);
                    const unpaidStudents = new Set(bills.filter((b: any) => b.status === 'unpaid').map((b: any) => b.student_id));

                    // Invoice baru = tagihan yang dibuat dalam 7 hari terakhir
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    const newInvoices = bills.filter((b: any) => new Date(b.created_at) >= sevenDaysAgo).length;

                    const pendingCount = bills.filter((b: any) => b.status === 'pending').length;

                    const keuanganStats: Stat[] = [
                        { id: 1, name: 'Total Pemasukan', value: formatCurrency(paidTotal), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { id: 2, name: 'Mhs Belum Bayar', value: unpaidStudents.size.toString(), icon: Users, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                        { id: 3, name: 'Invoice Baru', value: newInvoices.toString(), icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { id: 4, name: 'Menunggu Verifikasi', value: pendingCount.toString(), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    ];
                    setStats(keuanganStats);

                } else {
                    // ─── Mahasiswa: real-time personal stats ───
                    let ipk = '0.00';
                    let totalSks = 0;

                    // Fetch KRS dengan courses untuk hitung SKS
                    const { data: krsData } = await supabase
                        .from('student_krs')
                        .select('courses')
                        .eq('student_id', profile?.id)
                        .eq('status', 'approved');

                    if (krsData && krsData.length > 0) {
                        krsData.forEach((krs: any) => {
                            if (krs.courses && Array.isArray(krs.courses)) {
                                totalSks += krs.courses.reduce((s: number, c: any) => s + (c.sks || 0), 0);
                            }
                        });
                    }

                    // Fetch payment status
                    const { data: myBills } = await supabase
                        .from('student_bills')
                        .select('status')
                        .eq('student_id', profile?.id);

                    const hasUnpaid = (myBills || []).some((b: any) => b.status === 'unpaid');
                    const hasPending = (myBills || []).some((b: any) => b.status === 'pending');
                    const paymentStatus = hasUnpaid ? 'Belum Lunas' : hasPending ? 'Menunggu' : (myBills && myBills.length > 0 ? 'Lunas' : 'N/A');
                    const paymentColor = hasUnpaid ? 'text-rose-500' : hasPending ? 'text-amber-500' : 'text-emerald-500';
                    const paymentBg = hasUnpaid ? 'bg-rose-50 dark:bg-rose-900/20' : hasPending ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';

                    const defaultStats: Stat[] = [
                        { id: 1, name: 'IPK Terakhir', value: ipk, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { id: 2, name: 'SKS Kumulatif', value: totalSks.toString(), icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                        { id: 3, name: 'Presensi', value: '100%', icon: ClipboardCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                        { id: 4, name: 'Status Bayar', value: paymentStatus, icon: CreditCard, color: paymentColor, bg: paymentBg },
                    ];
                    setStats(defaultStats);
                }
            } catch (err) {
                console.error('Dashboard Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchAnnouncements = async () => {
            try {
                const { data, error } = await supabase
                    .from('announcements')
                    .select('*')
                    .order('is_pinned', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (error) throw error;
                if (data) {
                    setAnnouncements(data.map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        date: new Date(item.created_at).toLocaleDateString(),
                        tag: item.category || 'INFO',
                        content: item.content
                    })));
                }
            } catch (err) {
                console.error('Announcements Error:', err);
            }
        };

        const fetchScheduleData = async () => {
            if (profile?.role !== 'mahasiswa') return;
            try {
                const { data, error } = await supabase
                    .from('student_krs')
                    .select('courses')
                    .eq('student_id', profile.id)
                    .eq('status', 'approved')
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                if (data?.courses) {
                    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
                    const todaySchedule = data.courses.filter((c: any) => c.schedule.startsWith(today));
                    setSchedule(todaySchedule.map((c: any, i: number) => ({
                        id: i,
                        time: c.schedule.split(', ')[1] || '08:00 - 10:00',
                        subject: c.name,
                        room: c.room,
                        lecturer: c.lecturer,
                        type: 'Mata Kuliah'
                    })));
                }
            } catch (err) {
                console.error('Schedule Error:', err);
            }
        };

        fetchDashboardData();
        fetchAnnouncements();
        fetchScheduleData();
    }, [profile]);

    const [loading, setLoading] = useState(true);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
        { role: 'ai', text: `Halo ${profile?.full_name?.split(' ')[0] || 'User'}, saya SIM AI. Ada yang bisa saya bantu terkait jadwal atau administrasi kampus hari ini?` }
    ]);
    const [input, setInput] = useState('');

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');

        // SIM AI Reasoning Logic (Simulated ML)
        setTimeout(() => {
            let reply = "Mohon maaf, saya sedang mempelajari data terbaru. Bisakah Anda bertanya tentang KRS atau Jadwal?";
            const msg = userMsg.toLowerCase();

            if (msg.includes('jadwal')) reply = "Anda memiliki " + schedule.length + " perkuliahan hari ini. Silakan cek kartu jadwal di dashboard untuk detail ruangan.";
            else if (msg.includes('krs')) reply = "Periode KRS masih dibuka hingga 10 Maret. Pastikan Anda sudah melunasi tagihan sebelum mendaftar.";
            else if (msg.includes('halo') || msg.includes('hi')) reply = "Halo! Senang melihat Anda kembali. Apa kabar studi Anda hari ini?";
            else if (msg.includes('terima kasih')) reply = "Sama-sama! Semangat kuliahnya ya!";

            setChatMessages(prev => [...prev, { role: 'ai', text: reply }]);
        }, 1000);
    };

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
                    {/* AI Predictor Card - Only for Students */}
                    {profile?.role === 'mahasiswa' && (
                        <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 relative z-10">
                                <div>
                                    <h3 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <BrainCircuit size={20} className="text-primary animate-pulse" />
                                        AI Predictor & Insights
                                    </h3>
                                    <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">Analisis prediktif berdasarkan aktivitas akademik Anda</p>
                                </div>
                                <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2">
                                    <Zap size={14} className="text-primary" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Model: SIM-Brain v1.0</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Prediksi IPK Semester</p>
                                    <div className="flex items-end gap-3 mb-4">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white">3.88</span>
                                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg mb-1 flex items-center gap-1">
                                            <TrendingUp size={12} /> +0.02
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium italic">"Berdasarkan tingkat kehadiran 100% dan histori nilai, Anda diprediksi lulus dengan pujian semester ini."</p>
                                </div>
                                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Sparkles size={12} /> Rekomendasi AI
                                        </p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed">Ambil sertifikasi Cloud Engineering untuk memperkuat portofolio Anda di Semester ini.</p>
                                    </div>
                                    <button className="mt-4 text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 group">
                                        Lihat Path Karir <ArrowRight size={14} className="group-hover:translate-x-1 transition-all" />
                                    </button>
                                </div>
                            </div>

                            {/* Futuristic Background Element */}
                            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-0"></div>
                            <div className="absolute top-0 right-0 p-8 text-primary/5 -z-0">
                                <Cpu size={120} strokeWidth={1} />
                            </div>
                        </div>
                    )}

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

            {/* AI Assistant Floating Button - Only for Students */}
            {profile?.role === 'mahasiswa' && (
                <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
                    <AnimatePresence>
                        {isAssistantOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="w-[320px] sm:w-[380px] h-[500px] bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
                            >
                                <div className="p-6 bg-primary text-white flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                            <Cpu size={20} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm uppercase tracking-tight">SIM AI Assistant</h4>
                                            <p className="text-[10px] opacity-70">Tersambung • Brain v1.0</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsAssistantOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={cn(
                                            "max-w-[85%] p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm",
                                            msg.role === 'ai'
                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 self-start rounded-tl-none"
                                                : "bg-primary text-white self-end rounded-tr-none ml-auto"
                                        )}>
                                            {msg.text}
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Tanya SIM AI..."
                                        className="flex-1 bg-white dark:bg-slate-900 border-none outline-none p-3 rounded-xl text-xs font-bold shadow-inner"
                                    />
                                    <button type="submit" className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                        <ArrowRight size={18} />
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                        className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all transform hover:scale-110 active:scale-95 group relative",
                            isAssistantOpen ? "bg-slate-900 dark:bg-slate-800" : "bg-primary"
                        )}
                    >
                        {isAssistantOpen ? <X size={28} /> : <MessageSquare size={28} />}
                        {!isAssistantOpen && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-bounce"></span>
                        )}
                        <div className="absolute -left-32 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest whitespace-nowrap">Tanya SIM AI</p>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
