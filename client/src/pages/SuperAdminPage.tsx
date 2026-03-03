import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Settings, Calendar, Building2, DoorOpen, BookOpen, ScrollText,
    Download, Database, Users, GraduationCap, CreditCard, ClipboardCheck,
    Plus, Edit2, Trash2, X, Check, Search, RefreshCw, FileDown, ChevronDown,
    Activity, Eye, Lock, Unlock, AlertTriangle, CheckCircle2, Clock, Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import Toast, { ToastType } from '../components/Toast';

// ── Types ──
interface Permission { id: string; name: string; display_name: string; description: string; module: string; }
interface RolePermission { id: string; role: string; permission_id: string; permissions: Permission; }
interface AcademicYear { id: string; year: string; semester: string; is_active: boolean; start_date: string; end_date: string; }
interface StudyProgram { id: string; code: string; name: string; faculty: string; degree: string; accreditation: string; head_of_program: string; status: string; }
interface Room { id: string; code: string; name: string; building: string; floor: number; capacity: number; type: string; facilities: string; status: string; }
interface Course { id: string; code: string; name: string; sks: number; semester_recommended: number; study_program_id: string; }
interface AuditLog { id: string; user_email: string; user_role: string; action: string; module: string; target_type: string; details: any; created_at: string; }
interface DashboardStats { totalStudents: number; totalLecturers: number; totalCourses: number; totalRooms: number; paidTotal: number; pendingPayments: number; activeKrs: number; recentLogs: AuditLog[]; }

type TabId = 'dashboard' | 'rbac' | 'academic' | 'prodi' | 'rooms' | 'courses' | 'audit' | 'export' | 'backup';

const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dasbor', icon: Activity },
    { id: 'rbac', label: 'Hak Akses', icon: Shield },
    { id: 'academic', label: 'Tahun Akademik', icon: Calendar },
    { id: 'prodi', label: 'Program Studi', icon: Building2 },
    { id: 'rooms', label: 'Ruangan', icon: DoorOpen },
    { id: 'courses', label: 'Mata Kuliah', icon: BookOpen },
    { id: 'audit', label: 'Riwayat Aktivitas', icon: ScrollText },
    { id: 'export', label: 'Ekspor Data', icon: Download },
    { id: 'backup', label: 'Cadangkan & Pulihkan', icon: Database },
];

const MODULE_LABELS: Record<string, string> = {
    dashboard: 'Dasbor', users: 'Pengguna', students: 'Mahasiswa', lecturers: 'Dosen',
    academic: 'Akademik', courses: 'Mata Kuliah', prodi: 'Program Studi', rooms: 'Ruangan',
    finance: 'Keuangan', krs: 'KRS', announcements: 'Pengumuman', settings: 'Pengaturan',
    audit: 'Audit', reports: 'Laporan', backup: 'Cadangan', rbac: 'Hak Akses',
};

const ACTION_LABELS: Record<string, string> = {
    create: 'Tambah', update: 'Ubah', delete: 'Hapus', soft_delete: 'Nonaktifkan',
    login: 'Masuk', export: 'Ekspor', backup: 'Cadangkan', reset_password: 'Reset Sandi',
    restore: 'Pulihkan', restore_simulation: 'Simulasi Pulihkan',
};

const ROLES = ['superadmin', 'akademik', 'keuangan', 'dosen', 'mahasiswa'];

const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

// ── API Helper ──
const apiCall = async (token: string, path: string, method = 'GET', body?: any) => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/superadmin${path}`;
    const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        ...(body ? { body: JSON.stringify(body) } : {})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
};

// ── Modal Component ──
const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => (
    <AnimatePresence>
        {open && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X size={20} className="text-slate-400" /></button>
                    </div>
                    <div className="p-6">{children}</div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

// ── Stat Card ──
const StatCard: React.FC<{ label: string; value: string | number; icon: any; color: string; bg: string }> = ({ label, value, icon: Icon, color, bg }) => (
    <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", bg, color)}><Icon size={22} /></div>
        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p><p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p></div>
    </motion.div>
);

// ── MAIN COMPONENT ──
const SuperAdminPage: React.FC = () => {
    const { user: authUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({ isOpen: false, message: '', type: 'success' });
    const [loading, setLoading] = useState(false);

    // Data states
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    const [selectedRole, setSelectedRole] = useState('akademik');
    const [checkedPerms, setCheckedPerms] = useState<Set<string>>(new Set());
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [auditTotal, setAuditTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editItem, setEditItem] = useState<any>(null);
    const [form, setForm] = useState<Record<string, any>>({});

    const showToast = (message: string, type: ToastType = 'success') => setToast({ isOpen: true, message, type });
    const getToken = async () => authUser?.getIdToken() || '';

    // ── Data Fetchers ──
    const fetchStats = useCallback(async () => {
        try { const t = await getToken(); setStats(await apiCall(t, '/dashboard-stats')); } catch (e: any) { console.error(e); }
    }, [authUser]);

    const fetchPermissions = useCallback(async () => {
        const { data } = await supabase.from('permissions').select('*').order('module').order('name');
        if (data) setPermissions(data);
    }, []);

    const fetchRolePerms = useCallback(async (role: string) => {
        const { data } = await supabase.from('role_permissions').select('*, permissions(*)').eq('role', role);
        if (data) { setRolePermissions(data); setCheckedPerms(new Set(data.map((rp: any) => rp.permission_id))); }
    }, []);

    const fetchAcademicYears = useCallback(async () => {
        const { data } = await supabase.from('academic_years').select('*').is('deleted_at', null).order('year', { ascending: false });
        if (data) setAcademicYears(data);
    }, []);

    const fetchStudyPrograms = useCallback(async () => {
        const { data } = await supabase.from('study_programs').select('*').is('deleted_at', null).order('faculty').order('name');
        if (data) setStudyPrograms(data);
    }, []);

    const fetchRooms = useCallback(async () => {
        const { data } = await supabase.from('rooms').select('*').is('deleted_at', null).order('building').order('code');
        if (data) setRooms(data);
    }, []);

    const fetchCourses = useCallback(async () => {
        const { data } = await supabase.from('courses').select('*').order('code');
        if (data) setCourses(data);
    }, []);

    const fetchAuditLogs = useCallback(async () => {
        const { data, count } = await supabase.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(100);
        if (data) { setAuditLogs(data); setAuditTotal(count || 0); }
    }, []);

    useEffect(() => {
        if (activeTab === 'dashboard') fetchStats();
        else if (activeTab === 'rbac') { fetchPermissions(); fetchRolePerms(selectedRole); }
        else if (activeTab === 'academic') fetchAcademicYears();
        else if (activeTab === 'prodi') fetchStudyPrograms();
        else if (activeTab === 'rooms') fetchRooms();
        else if (activeTab === 'courses') fetchCourses();
        else if (activeTab === 'audit') fetchAuditLogs();
    }, [activeTab]);

    useEffect(() => { if (activeTab === 'rbac') fetchRolePerms(selectedRole); }, [selectedRole]);

    // ── RBAC Save ──
    const saveRolePerms = async () => {
        setLoading(true);
        try {
            const t = await getToken();
            await apiCall(t, '/role-permissions', 'POST', { role: selectedRole, permission_ids: Array.from(checkedPerms) });
            showToast(`Hak akses untuk ${selectedRole} berhasil disimpan`);
        } catch (e: any) { showToast(e.message, 'error'); } finally { setLoading(false); }
    };

    // ── CRUD Helpers ──
    const openCreateModal = (defaults: Record<string, any> = {}) => { setModalMode('create'); setEditItem(null); setForm(defaults); setModalOpen(true); };
    const openEditModal = (item: any) => { setModalMode('edit'); setEditItem(item); setForm({ ...item }); setModalOpen(true); };

    const handleCrudSubmit = async (path: string, fetchFn: () => void) => {
        setLoading(true);
        try {
            const t = await getToken();
            if (modalMode === 'edit' && editItem) await apiCall(t, `${path}/${editItem.id}`, 'PUT', form);
            else await apiCall(t, path, 'POST', form);
            showToast(`Data berhasil ${modalMode === 'edit' ? 'diperbarui' : 'ditambahkan'}`);
            setModalOpen(false); fetchFn();
        } catch (e: any) { showToast(e.message, 'error'); } finally { setLoading(false); }
    };

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; path: string; id: string; fetchFn: () => void }>({ open: false, path: '', id: '', fetchFn: () => { } });

    const handleDelete = async (path: string, id: string, fetchFn: () => void) => {
        setConfirmModal({ open: true, path, id, fetchFn });
    };

    const confirmDelete = async () => {
        try {
            const t = await getToken();
            await apiCall(t, `${confirmModal.path}/${confirmModal.id}`, 'DELETE');
            showToast('Data berhasil dihapus'); confirmModal.fetchFn();
        } catch (e: any) { showToast(e.message, 'error'); }
        setConfirmModal({ open: false, path: '', id: '', fetchFn: () => { } });
    };

    // ── Export ──
    const handleExport = async (type: string, format: 'excel' | 'pdf') => {
        try {
            const t = await getToken();
            const data = await apiCall(t, `/export/${type}`);
            if (format === 'excel') {
                const csv = [Object.keys(data[0] || {}).join(','), ...data.map((r: any) => Object.values(r).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${type}_${Date.now()}.csv`; a.click();
            } else {
                const content = data.map((r: any) => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(' | ')).join('\n');
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${type}_${Date.now()}.txt`; a.click();
            }
            showToast(`Data ${type} berhasil di-export`);
        } catch (e: any) { showToast(e.message, 'error'); }
    };

    // ── Backup ──
    const handleBackup = async () => {
        setLoading(true);
        try {
            const t = await getToken();
            const backup = await apiCall(t, '/backup', 'POST');
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `backup_${Date.now()}.json`; a.click();
            showToast('Backup berhasil diunduh');
        } catch (e: any) { showToast(e.message, 'error'); } finally { setLoading(false); }
    };

    const handleRestore = async () => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
        input.onchange = async (e: any) => {
            const file = e.target.files[0]; if (!file) return;
            const text = await file.text(); const backupData = JSON.parse(text);
            try {
                const t = await getToken();
                const result = await apiCall(t, '/restore', 'POST', { data: backupData });
                showToast(result.message);
            } catch (err: any) { showToast(err.message, 'error'); }
        };
        input.click();
    };

    // ── Input helper ──
    const inp = (key: string, label: string, type = 'text', required = false) => (
        <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
            <input type={type} required={required} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none p-3 rounded-xl text-slate-900 dark:text-white font-bold text-sm" />
        </div>
    );

    const sel = (key: string, label: string, options: { value: string; label: string }[]) => (
        <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
            <select value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none p-3 rounded-xl text-slate-900 dark:text-white font-bold text-sm">
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );

    // ── Action Badge ──
    const actionBadge = (action: string) => {
        const colors: Record<string, string> = { create: 'bg-emerald-50 text-emerald-600', update: 'bg-blue-50 text-blue-600', delete: 'bg-red-50 text-red-600', soft_delete: 'bg-orange-50 text-orange-600', login: 'bg-purple-50 text-purple-600', export: 'bg-indigo-50 text-indigo-600', backup: 'bg-amber-50 text-amber-600', reset_password: 'bg-rose-50 text-rose-600' };
        return <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase", colors[action] || 'bg-slate-50 text-slate-600')}>{ACTION_LABELS[action] || action}</span>;
    };

    // ── Grouped permissions by module ──
    const permsByModule = permissions.reduce((acc, p) => { (acc[p.module] = acc[p.module] || []).push(p); return acc; }, {} as Record<string, Permission[]>);

    // ── RENDER TABS ──
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                if (!stats) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-primary" size={32} /></div>;
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Total Mahasiswa" value={stats.totalStudents} icon={Users} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/20" />
                            <StatCard label="Total Dosen" value={stats.totalLecturers} icon={GraduationCap} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-900/20" />
                            <StatCard label="Total Pembayaran" value={formatCurrency(stats.paidTotal)} icon={CreditCard} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-900/20" />
                            <StatCard label="KRS Aktif" value={stats.activeKrs} icon={ClipboardCheck} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-900/20" />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Mata Kuliah" value={stats.totalCourses} icon={BookOpen} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/20" />
                            <StatCard label="Ruangan" value={stats.totalRooms} icon={DoorOpen} color="text-cyan-500" bg="bg-cyan-50 dark:bg-cyan-900/20" />
                            <StatCard label="Menunggu Bayar" value={stats.pendingPayments} icon={Clock} color="text-orange-500" bg="bg-orange-50 dark:bg-orange-900/20" />
                            <StatCard label="Status Sistem" value="Aktif" icon={CheckCircle2} color="text-green-500" bg="bg-green-50 dark:bg-green-900/20" />
                        </div>
                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Activity size={20} className="text-primary" /> Aktivitas Terbaru</h3>
                            <div className="space-y-3">
                                {(stats.recentLogs || []).slice(0, 8).map(log => (
                                    <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            {actionBadge(log.action)}
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.user_email}</span>
                                            <span className="text-[10px] text-slate-400">{log.module} • {log.target_type}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">{formatDate(log.created_at)}</span>
                                    </div>
                                ))}
                                {(!stats.recentLogs || stats.recentLogs.length === 0) && <p className="text-sm text-slate-400 text-center py-8">Belum ada aktivitas tercatat</p>}
                            </div>
                        </div>
                    </div>
                );

            case 'rbac':
                return (
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            {ROLES.map(r => (
                                <button key={r} onClick={() => setSelectedRole(r)} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", selectedRole === r ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200")}>{r}</button>
                            ))}
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-900 dark:text-white">Hak Akses untuk <span className="text-primary uppercase">{selectedRole}</span></h3>
                                <button onClick={saveRolePerms} disabled={loading} className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50">
                                    <Check size={16} /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                            {Object.entries(permsByModule).map(([mod, perms]) => (
                                <div key={mod} className="mb-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2"><Shield size={12} /> {MODULE_LABELS[mod] || mod}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {perms.map(p => (
                                            <label key={p.id} className={cn("flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border", checkedPerms.has(p.id) ? "bg-primary/5 border-primary/20" : "bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200")}>
                                                <input type="checkbox" checked={checkedPerms.has(p.id)} onChange={() => { const n = new Set(checkedPerms); n.has(p.id) ? n.delete(p.id) : n.add(p.id); setCheckedPerms(n); }}
                                                    className="w-4 h-4 rounded text-primary accent-blue-500" />
                                                <div><p className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.display_name}</p><p className="text-[10px] text-slate-400">{p.name}</p></div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'academic':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-end"><button onClick={() => openCreateModal({ year: '', semester: 'ganjil', is_active: false })} className="px-5 py-3 bg-primary text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20"><Plus size={16} /> Tambah</button></div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <table className="w-full text-left"><thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                {['Tahun', 'Semester', 'Periode', 'Status', 'Aksi'].map(h => <th key={h} className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                            </tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {academicYears.map(ay => (
                                        <tr key={ay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group">
                                            <td className="p-4 font-bold text-slate-800 dark:text-white">{ay.year}</td>
                                            <td className="p-4 capitalize font-medium text-slate-600 dark:text-slate-300">{ay.semester}</td>
                                            <td className="p-4 text-xs text-slate-500">{ay.start_date ? `${ay.start_date} — ${ay.end_date}` : '-'}</td>
                                            <td className="p-4">{ay.is_active ? <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg flex items-center gap-1 w-fit"><CheckCircle2 size={12} /> AKTIF</span> : <span className="text-[10px] text-slate-400">Nonaktif</span>}</td>
                                            <td className="p-4"><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => openEditModal(ay)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete('/academic-years', ay.id, fetchAcademicYears)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                            </div></td>
                                        </tr>
                                    ))}
                                    {academicYears.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-400">Belum ada data tahun akademik</td></tr>}
                                </tbody></table>
                        </div>
                        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'edit' ? 'Edit Tahun Akademik' : 'Tambah Tahun Akademik'}>
                            <form onSubmit={e => { e.preventDefault(); handleCrudSubmit('/academic-years', fetchAcademicYears); }} className="space-y-4">
                                {inp('year', 'Tahun Akademik (cth: 2024/2025)', 'text', true)}
                                {sel('semester', 'Semester', [{ value: 'ganjil', label: 'Ganjil' }, { value: 'genap', label: 'Genap' }])}
                                <div className="grid grid-cols-2 gap-3">{inp('start_date', 'Tanggal Mulai', 'date')}{inp('end_date', 'Tanggal Selesai', 'date')}</div>
                                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                                    <input type="checkbox" checked={form.is_active || false} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-blue-500" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Semester Aktif</span>
                                </label>
                                <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan'}</button>
                            </form>
                        </Modal>
                    </div>
                );

            case 'prodi':
                const prodiByFakultas = studyPrograms.reduce((acc, sp) => {
                    const fak = sp.faculty || 'Lainnya';
                    (acc[fak] = acc[fak] || []).push(sp);
                    return acc;
                }, {} as Record<string, StudyProgram[]>);

                return (
                    <div className="space-y-6">
                        <div className="flex justify-end"><button onClick={() => openCreateModal({ degree: 'S1', accreditation: 'B', status: 'active' })} className="px-5 py-3 bg-primary text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20"><Plus size={16} /> Tambah Prodi</button></div>

                        {Object.entries(prodiByFakultas).map(([fakultas, prodiList]) => (
                            <div key={fakultas} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                {/* Header Fakultas */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Building2 size={18} className="text-blue-600" />
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{fakultas}</h3>
                                            <p className="text-[10px] text-slate-500">{prodiList.length} program studi</p>
                                        </div>
                                    </div>
                                    <button onClick={() => openCreateModal({ faculty: fakultas, degree: 'S1', accreditation: 'B', status: 'active' })} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-primary text-[11px] font-bold rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all flex items-center gap-1.5 shadow-sm">
                                        <Plus size={14} /> Tambah Prodi
                                    </button>
                                </div>

                                {/* Tabel Prodi */}
                                <table className="w-full text-left">
                                    <thead><tr className="border-b border-slate-100 dark:border-slate-800">
                                        {['Kode', 'Program Studi', 'Jenjang', 'Akreditasi', 'Kaprodi', 'Aksi'].map(h => <th key={h} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                                    </tr></thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {prodiList.map(sp => (
                                            <tr key={sp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group">
                                                <td className="px-6 py-3.5 font-mono font-bold text-primary text-sm">{sp.code}</td>
                                                <td className="px-6 py-3.5">
                                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{sp.name}</p>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black",
                                                        sp.degree === 'S1' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' :
                                                            sp.degree === 'S2' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' :
                                                                sp.degree === 'S3' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30' :
                                                                    'bg-teal-50 text-teal-600 dark:bg-teal-900/30'
                                                    )}>{sp.degree}</span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black",
                                                        sp.accreditation === 'Unggul' ? 'bg-emerald-50 text-emerald-600' :
                                                            sp.accreditation === 'A' ? 'bg-amber-50 text-amber-600' :
                                                                sp.accreditation === 'B' ? 'bg-orange-50 text-orange-600' :
                                                                    'bg-red-50 text-red-600'
                                                    )}>{sp.accreditation}</span>
                                                </td>
                                                <td className="px-6 py-3.5 text-sm text-slate-500">{sp.head_of_program || '-'}</td>
                                                <td className="px-6 py-3.5"><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => openEditModal(sp)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDelete('/study-programs', sp.id, fetchStudyPrograms)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                                </div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}

                        {studyPrograms.length === 0 && <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">Belum ada program studi</div>}
                        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'edit' ? 'Edit Program Studi' : 'Tambah Program Studi'}>
                            <form onSubmit={e => { e.preventDefault(); handleCrudSubmit('/study-programs', fetchStudyPrograms); }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">{inp('code', 'Kode Prodi', 'text', true)}{inp('name', 'Nama Prodi', 'text', true)}</div>
                                {inp('faculty', 'Fakultas', 'text', true)}
                                <div className="grid grid-cols-3 gap-3">
                                    {sel('degree', 'Jenjang', [{ value: 'D3', label: 'D3' }, { value: 'S1', label: 'S1' }, { value: 'S2', label: 'S2' }, { value: 'S3', label: 'S3' }, { value: 'Profesi', label: 'Profesi' }])}
                                    {sel('accreditation', 'Akreditasi', [{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }, { value: 'Unggul', label: 'Unggul' }, { value: 'BaikSekali', label: 'Baik Sekali' }])}
                                    {sel('status', 'Status', [{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }])}
                                </div>
                                {inp('head_of_program', 'Ketua Prodi')}
                                <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan'}</button>
                            </form>
                        </Modal>
                    </div>
                );

            case 'rooms':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-end"><button onClick={() => openCreateModal({ type: 'kelas', status: 'available', floor: 1, capacity: 30 })} className="px-5 py-3 bg-primary text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20"><Plus size={16} /> Tambah Ruangan</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rooms.map(room => (
                                <motion.div key={room.id} whileHover={{ y: -3 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 group relative overflow-hidden">
                                    <div className="flex items-start justify-between mb-3">
                                        <div><p className="font-mono font-bold text-primary text-lg">{room.code}</p><p className="font-bold text-slate-800 dark:text-white text-sm">{room.name}</p></div>
                                        <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black", room.status === 'available' ? 'bg-emerald-50 text-emerald-600' : room.status === 'maintenance' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600')}>{room.status === 'available' ? 'Tersedia' : room.status === 'maintenance' ? 'Perawatan' : 'Tidak Tersedia'}</span>
                                    </div>
                                    <div className="space-y-1 text-xs text-slate-500 mb-3">
                                        <p>🏢 {room.building || '-'} • Lt. {room.floor}</p>
                                        <p>👤 Kapasitas: {room.capacity} orang</p>
                                        <p>📋 Tipe: {room.type}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => openEditModal(room)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete('/rooms', room.id, fetchRooms)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                                    </div>
                                </motion.div>
                            ))}
                            {rooms.length === 0 && <div className="col-span-3 text-center py-12 text-slate-400">Belum ada ruangan</div>}
                        </div>
                        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'edit' ? 'Edit Ruangan' : 'Tambah Ruangan'}>
                            <form onSubmit={e => { e.preventDefault(); handleCrudSubmit('/rooms', fetchRooms); }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">{inp('code', 'Kode Ruang', 'text', true)}{inp('name', 'Nama Ruang', 'text', true)}</div>
                                <div className="grid grid-cols-3 gap-3">{inp('building', 'Gedung')}{inp('floor', 'Lantai', 'number')}{inp('capacity', 'Kapasitas', 'number')}</div>
                                <div className="grid grid-cols-2 gap-3">
                                    {sel('type', 'Tipe', [{ value: 'kelas', label: 'Kelas' }, { value: 'lab', label: 'Laboratorium' }, { value: 'auditorium', label: 'Auditorium' }, { value: 'ruang_dosen', label: 'Ruang Dosen' }, { value: 'lainnya', label: 'Lainnya' }])}
                                    {sel('status', 'Status', [{ value: 'available', label: 'Tersedia' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'unavailable', label: 'Tidak Tersedia' }])}
                                </div>
                                {inp('facilities', 'Fasilitas')}
                                <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan'}</button>
                            </form>
                        </Modal>
                    </div>
                );

            case 'courses':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-end"><button onClick={() => openCreateModal({ sks: 3, semester_recommended: 1 })} className="px-5 py-3 bg-primary text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20"><Plus size={16} /> Tambah MK</button></div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <table className="w-full text-left"><thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                {['Kode', 'Mata Kuliah', 'SKS', 'Semester', 'Aksi'].map(h => <th key={h} className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                            </tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {courses.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group">
                                            <td className="p-4 font-mono font-bold text-primary text-sm">{c.code}</td>
                                            <td className="p-4 font-bold text-slate-800 dark:text-white">{c.name}</td>
                                            <td className="p-4"><span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-black rounded-lg">{c.sks} SKS</span></td>
                                            <td className="p-4 text-sm text-slate-500">Sem {c.semester_recommended || '-'}</td>
                                            <td className="p-4"><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => openEditModal(c)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete('/courses', c.id, fetchCourses)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                            </div></td>
                                        </tr>
                                    ))}
                                    {courses.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-400">Belum ada mata kuliah</td></tr>}
                                </tbody></table>
                        </div>
                        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'edit' ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}>
                            <form onSubmit={e => { e.preventDefault(); handleCrudSubmit('/courses', fetchCourses); }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">{inp('code', 'Kode MK', 'text', true)}{inp('name', 'Nama MK', 'text', true)}</div>
                                <div className="grid grid-cols-2 gap-3">{inp('sks', 'SKS', 'number', true)}{inp('semester_recommended', 'Semester', 'number')}</div>
                                <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan'}</button>
                            </form>
                        </Modal>
                    </div>
                );

            case 'audit':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500 font-bold">{auditTotal} total log tercatat</p>
                            <button onClick={fetchAuditLogs} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><RefreshCw size={18} /></button>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-[600px] overflow-y-auto">
                                {auditLogs.map(log => (
                                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {actionBadge(log.action)}
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.user_email || 'Sistem'}</span>
                                            <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-black rounded-lg">{MODULE_LABELS[log.module] || log.module}</span>
                                            {log.target_type && <span className="text-[10px] text-slate-400">→ {log.target_type}</span>}
                                            {log.details && <span className="text-[10px] text-slate-400 max-w-[200px] truncate">{JSON.stringify(log.details)}</span>}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-4">{formatDate(log.created_at)}</span>
                                    </div>
                                ))}
                                {auditLogs.length === 0 && <div className="p-12 text-center text-slate-400">Belum ada log audit</div>}
                            </div>
                        </div>
                    </div>
                );

            case 'export':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { type: 'students', label: 'Data Mahasiswa', icon: Users, color: 'blue', desc: 'Unduh semua data mahasiswa yang terdaftar' },
                            { type: 'lecturers', label: 'Data Dosen', icon: GraduationCap, color: 'indigo', desc: 'Unduh semua data dosen yang terdaftar' },
                            { type: 'payments', label: 'Data Pembayaran', icon: CreditCard, color: 'emerald', desc: 'Unduh semua riwayat pembayaran' },
                        ].map(exp => (
                            <motion.div key={exp.type} whileHover={{ y: -3 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
                                <div className={cn(`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${exp.color}-50 text-${exp.color}-500`)}><exp.icon size={24} /></div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{exp.label}</h3>
                                <p className="text-xs text-slate-500 mb-6 flex-1">{exp.desc}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => handleExport(exp.type, 'excel')} className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1"><FileDown size={14} /> Unduh Excel</button>
                                    <button onClick={() => handleExport(exp.type, 'pdf')} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1"><FileDown size={14} /> Unduh PDF</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                );

            case 'backup':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4"><Database size={32} /></div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cadangkan Database</h3>
                            <p className="text-sm text-slate-500 mb-6">Unduh seluruh data penting ke file JSON sebagai cadangan data.</p>
                            <button onClick={handleBackup} disabled={loading} className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <><RefreshCw size={16} className="animate-spin" /> Memproses...</> : <><Download size={16} /> Cadangkan Sekarang</>}
                            </button>
                        </motion.div>
                        <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4"><RefreshCw size={32} /></div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pulihkan Database</h3>
                            <p className="text-sm text-slate-500 mb-6">Unggah file cadangan JSON untuk memulihkan data. (Mode simulasi)</p>
                            <button onClick={handleRestore} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                                <AlertTriangle size={16} /> Unggah & Pulihkan
                            </button>
                        </motion.div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-2xl lg:rounded-3xl p-6 text-white shadow-lg shadow-rose-600/20 relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center"><Shield size={24} /></div>
                        <div>
                            <h1 className="text-xl lg:text-2xl font-black">Panel Super Admin</h1>
                            <p className="text-xs opacity-70">Kontrol penuh atas sistem SIM CEPAT</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Hak Akses Dinamis</p>
                        <p className="text-sm font-bold">Berbasis Database</p>
                    </div>
                </div>
                <div className="absolute top-0 right-0 p-4 text-white/5"><Settings size={120} strokeWidth={1} className="animate-spin-slow" /></div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0",
                            activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:border-primary/30")}>
                        <tab.icon size={16} />{tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    {renderContent()}
                </motion.div>
            </AnimatePresence>

            {/* Modal Konfirmasi Hapus */}
            <AnimatePresence>
                {confirmModal.open && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmModal({ ...confirmModal, open: false })} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 text-center">
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={28} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Hapus Data?</h3>
                            <p className="text-sm text-slate-500 mb-6">Data yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmModal({ ...confirmModal, open: false })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                    Batal
                                </button>
                                <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2">
                                    <Trash2 size={16} /> Hapus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default SuperAdminPage;
