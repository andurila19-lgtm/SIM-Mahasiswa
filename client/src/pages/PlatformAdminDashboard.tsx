import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2,
    Users,
    CreditCard,
    Activity,
    TrendingUp,
    Shield,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Plus,
    X,
    Search,
    RefreshCw,
    Eye,
    Pause,
    Play,
    Key,
    Clock,
    DollarSign,
    BarChart3,
    Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import Toast, { ToastType } from '../components/Toast';

// ─── Types ───────────────────────────────────────────────────────────
interface CampusData {
    id: string;
    name: string;
    domain?: string;
    status: 'active' | 'suspended';
    created_at: string;
    students: number;
    lecturers: number;
    totalUsers: number;
    subscription: {
        id: string;
        plan_name: string;
        max_students: number;
        end_date: string;
        status: string;
        price: number;
    } | null;
}

interface DashboardStats {
    totalCampuses: number;
    activeCampuses: number;
    suspendedCampuses: number;
    totalUsers: number;
    totalStudents: number;
    activeSubscriptions: number;
    expiringSoon: number;
    totalRevenue: number;
}

interface AuditLog {
    id: string;
    user_email?: string;
    user_role?: string;
    action: string;
    module: string;
    created_at: string;
}

const PlatformAdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [campuses, setCampuses] = useState<CampusData[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'campuses' | 'subscriptions' | 'logs'>('overview');

    // Modals
    const [isCreateCampusOpen, setIsCreateCampusOpen] = useState(false);
    const [isCreateSubOpen, setIsCreateSubOpen] = useState(false);
    const [isResetPwOpen, setIsResetPwOpen] = useState(false);
    const [selectedCampus, setSelectedCampus] = useState<CampusData | null>(null);

    // Forms
    const [campusName, setCampusName] = useState('');
    const [campusDomain, setCampusDomain] = useState('');
    const [subPlan, setSubPlan] = useState<'Basic' | 'Pro' | 'Enterprise'>('Basic');
    const [subEndDate, setSubEndDate] = useState('');
    const [resetUid, setResetUid] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false, message: '', type: 'success'
    });
    const showToast = (m: string, t: ToastType = 'success') => setToast({ isOpen: true, message: m, type: t });

    // ─── Fetch Functions ──────────────────────────────────────────
    const fetchDashboard = async () => {
        setLoading(true);
        try {
            // Stats
            const [
                { count: totalCampuses },
                { count: activeCampuses },
                { count: suspendedCampuses },
                { count: totalUsers },
                { count: totalStudents },
                { count: activeSubscriptions },
            ] = await Promise.all([
                supabase.from('campuses').select('*', { count: 'exact', head: true }),
                supabase.from('campuses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('campuses').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).is('deleted_at', null),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mahasiswa').is('deleted_at', null),
                supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            ]);

            const { data: revenueData } = await supabase.from('subscriptions').select('price').eq('status', 'active');
            const totalRevenue = (revenueData || []).reduce((s: number, r: any) => s + (r.price || 0), 0);

            setStats({
                totalCampuses: totalCampuses || 0,
                activeCampuses: activeCampuses || 0,
                suspendedCampuses: suspendedCampuses || 0,
                totalUsers: totalUsers || 0,
                totalStudents: totalStudents || 0,
                activeSubscriptions: activeSubscriptions || 0,
                expiringSoon: 0,
                totalRevenue
            });

            // Campuses with enrichment
            const { data: campusData } = await supabase.from('campuses').select('*').order('created_at', { ascending: false });

            const enriched: CampusData[] = await Promise.all((campusData || []).map(async (c: any) => {
                const [
                    { count: sc },
                    { count: dc },
                    { count: tc },
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('campus_id', c.id).eq('role', 'mahasiswa').is('deleted_at', null),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('campus_id', c.id).eq('role', 'dosen').is('deleted_at', null),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('campus_id', c.id).is('deleted_at', null),
                ]);

                const { data: sub } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('campus_id', c.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                return { ...c, students: sc || 0, lecturers: dc || 0, totalUsers: tc || 0, subscription: sub };
            }));

            setCampuses(enriched);

            // Logs
            const { data: logData } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            setLogs(logData || []);

        } catch (err: any) {
            showToast('Gagal memuat data: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDashboard(); }, []);

    // ─── Handlers ─────────────────────────────────────────────────
    const handleCreateCampus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!campusName) return;
        setSubmitting(true);
        try {
            const { error } = await supabase.from('campuses').insert([{ name: campusName, domain: campusDomain || null, status: 'active' }]);
            if (error) throw error;
            showToast(`Kampus "${campusName}" berhasil dibuat!`);
            setIsCreateCampusOpen(false);
            setCampusName('');
            setCampusDomain('');
            fetchDashboard();
        } catch (err: any) {
            showToast('Gagal: ' + err.message, 'error');
        } finally { setSubmitting(false); }
    };

    const handleToggleStatus = async (campus: CampusData) => {
        const newStatus = campus.status === 'active' ? 'suspended' : 'active';
        try {
            const { error } = await supabase.from('campuses').update({ status: newStatus }).eq('id', campus.id);
            if (error) throw error;
            showToast(`Kampus "${campus.name}" berhasil di-${newStatus === 'active' ? 'aktifkan' : 'suspend'}`);
            fetchDashboard();
        } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); }
    };

    const handleCreateSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCampus || !subEndDate) return;
        setSubmitting(true);
        try {
            await supabase.from('subscriptions').update({ status: 'expired' }).eq('campus_id', selectedCampus.id).eq('status', 'active');

            const defaults: Record<string, { max: number; price: number }> = {
                Basic: { max: 200, price: 500000 },
                Pro: { max: 2000, price: 2500000 },
                Enterprise: { max: 99999, price: 10000000 },
            };
            const d = defaults[subPlan];

            const { error } = await supabase.from('subscriptions').insert([{
                campus_id: selectedCampus.id,
                plan_name: subPlan,
                price: d.price,
                max_students: d.max,
                start_date: new Date().toISOString(),
                end_date: subEndDate,
                status: 'active'
            }]);
            if (error) throw error;
            showToast(`Paket ${subPlan} berhasil diaktifkan untuk ${selectedCampus.name}`);
            setIsCreateSubOpen(false);
            fetchDashboard();
        } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); }
        finally { setSubmitting(false); }
    };

    const filteredCampuses = useMemo(() => {
        if (!search) return campuses;
        return campuses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.domain?.toLowerCase().includes(search.toLowerCase()));
    }, [campuses, search]);

    const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeAgo = (d: string) => {
        const diff = Date.now() - new Date(d).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m lalu`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}j lalu`;
        return `${Math.floor(hrs / 24)}h lalu`;
    };

    const planColors: Record<string, string> = {
        Basic: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        Pro: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        Enterprise: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    };

    // ─── Render ───────────────────────────────────────────────────
    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] border border-slate-700 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                            <Shield size={28} />
                        </div>
                        <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl border border-primary/20">Platform Admin</span>
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">SaaS Management Console</h1>
                    <p className="text-white/40 font-medium">Kelola semua kampus, langganan, dan monitoring platform.</p>
                </div>
                <button onClick={fetchDashboard} className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold rounded-2xl border border-white/10 transition-all">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'campuses', label: 'Kampus', icon: Building2 },
                    { id: 'subscriptions', label: 'Langganan', icon: CreditCard },
                    { id: 'logs', label: 'Usage Logs', icon: Activity },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && stats && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Kampus', value: stats.totalCampuses, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                            { label: 'Total Mahasiswa', value: stats.totalStudents, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                            { label: 'Langganan Aktif', value: stats.activeSubscriptions, icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                            { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/5' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}><stat.icon size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={24} /></div>
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktif</p><p className="text-2xl font-black text-emerald-600">{stats.activeCampuses}</p></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 flex items-center justify-center"><XCircle size={24} /></div>
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suspended</p><p className="text-2xl font-black text-rose-600">{stats.suspendedCampuses}</p></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/10 text-amber-500 flex items-center justify-center"><AlertTriangle size={24} /></div>
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total User</p><p className="text-2xl font-black text-amber-600">{stats.totalUsers}</p></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Campuses */}
            {activeTab === 'campuses' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kampus..." className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-sm font-bold" />
                        </div>
                        <button onClick={() => setIsCreateCampusOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                            <Plus size={18} /> Tambah Kampus
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {filteredCampuses.map(campus => (
                            <div key={campus.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0", campus.status === 'active' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-500 dark:bg-rose-900/20')}>
                                        {campus.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">{campus.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            {campus.domain && <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><Globe size={10} /> {campus.domain}</span>}
                                            <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border", campus.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800')}>
                                                {campus.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 text-center">
                                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mahasiswa</p><p className="text-lg font-black">{campus.students}</p></div>
                                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dosen</p><p className="text-lg font-black">{campus.lecturers}</p></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paket</p>
                                        {campus.subscription ? (
                                            <span className={cn("px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border", planColors[campus.subscription.plan_name] || planColors.Basic)}>
                                                {campus.subscription.plan_name}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-rose-500">Tidak Aktif</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setSelectedCampus(campus); setIsCreateSubOpen(true); }} className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" title="Kelola Langganan"><CreditCard size={18} /></button>
                                    <button onClick={() => handleToggleStatus(campus)} className={cn("p-2.5 rounded-xl transition-all", campus.status === 'active' ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50')} title={campus.status === 'active' ? 'Suspend' : 'Aktifkan'}>
                                        {campus.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab: Subscriptions */}
            {activeTab === 'subscriptions' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Monitor Langganan</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kampus</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Paket</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Mahasiswa</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Limit</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Berakhir</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Harga</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                                {campuses.filter(c => c.subscription).map(campus => {
                                    const sub = campus.subscription!;
                                    const usage = campus.students / sub.max_students * 100;
                                    const isExpiringSoon = new Date(sub.end_date).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

                                    return (
                                        <tr key={campus.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                            <td className="p-4"><span className="font-bold text-slate-800 dark:text-white">{campus.name}</span></td>
                                            <td className="p-4 text-center">
                                                <span className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border", planColors[sub.plan_name])}>
                                                    {sub.plan_name}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black text-sm">{campus.students}</span>
                                                    <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                                                        <div className={cn("h-full rounded-full transition-all", usage > 90 ? 'bg-rose-500' : usage > 70 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(usage, 100)}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-bold text-slate-500">{sub.max_students === 99999 ? '∞' : sub.max_students}</td>
                                            <td className="p-4 text-center">
                                                <span className={cn("text-xs font-bold", isExpiringSoon ? 'text-rose-500' : 'text-slate-500')}>
                                                    {formatDate(sub.end_date)}
                                                    {isExpiringSoon && <AlertTriangle size={12} className="inline ml-1" />}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(sub.price)}</td>
                                        </tr>
                                    );
                                })}
                                {campuses.filter(c => !c.subscription).map(campus => (
                                    <tr key={campus.id} className="opacity-50">
                                        <td className="p-4 font-bold text-slate-500">{campus.name}</td>
                                        <td className="p-4 text-center"><span className="text-[10px] font-bold text-rose-500">TIDAK AKTIF</span></td>
                                        <td colSpan={4} className="p-4 text-center text-xs text-slate-400">Belum memiliki langganan aktif</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Logs */}
            {activeTab === 'logs' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Usage Logs</h3>
                        <p className="text-xs text-slate-400 mt-1">Aktivitas terbaru di seluruh platform</p>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/30 max-h-[600px] overflow-y-auto">
                        {logs.map(log => (
                            <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Activity size={14} /></div>
                                    <div>
                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{log.action}</span>
                                        <span className="text-xs text-slate-400 ml-2">• {log.module}</span>
                                        {log.user_email && <p className="text-[10px] text-slate-400">{log.user_email} ({log.user_role})</p>}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10} /> {timeAgo(log.created_at)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal: Create Campus */}
            <AnimatePresence>
                {isCreateCampusOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateCampusOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-xl font-black uppercase tracking-tight">Kampus Baru</h2>
                                <button onClick={() => setIsCreateCampusOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateCampus} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Kampus</label>
                                    <input value={campusName} onChange={e => setCampusName(e.target.value)} required placeholder="Universitas Indonesia" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Domain (Opsional)</label>
                                    <input value={campusDomain} onChange={e => setCampusDomain(e.target.value)} placeholder="ui.sim-akademik.id" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold" />
                                </div>
                                <button type="submit" disabled={submitting} className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50">
                                    {submitting ? 'Memproses...' : 'Buat Kampus'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Create Subscription */}
            <AnimatePresence>
                {isCreateSubOpen && selectedCampus && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateSubOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-xl font-black uppercase tracking-tight">Aktifkan Langganan</h2>
                                <p className="text-sm text-slate-400 mt-1">Untuk: <span className="text-primary font-bold">{selectedCampus.name}</span></p>
                            </div>
                            <form onSubmit={handleCreateSubscription} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Paket</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['Basic', 'Pro', 'Enterprise'] as const).map(plan => (
                                            <button key={plan} type="button" onClick={() => setSubPlan(plan)} className={cn(
                                                "py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all",
                                                subPlan === plan ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'
                                            )}>
                                                {plan}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Berlaku Hingga</label>
                                    <input type="date" value={subEndDate} onChange={e => setSubEndDate(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none text-sm font-bold" />
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-2">
                                    <div className="flex justify-between text-xs"><span className="text-slate-400">Max Mahasiswa</span><span className="font-black">{subPlan === 'Enterprise' ? '∞' : subPlan === 'Pro' ? '2.000' : '200'}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-400">Harga</span><span className="font-black">{formatCurrency(subPlan === 'Enterprise' ? 10000000 : subPlan === 'Pro' ? 2500000 : 500000)}</span></div>
                                </div>
                                <button type="submit" disabled={submitting} className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50">
                                    {submitting ? 'Memproses...' : 'Aktifkan Paket'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default PlatformAdminDashboard;
