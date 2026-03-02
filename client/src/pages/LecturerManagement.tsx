import React, { useState } from 'react';
import {
    Users,
    Search,
    Plus,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    GraduationCap,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronRight,
    Edit2,
    Trash2,
    UserCheck,
    BookOpen,
    ShieldCheck,
    Backpack
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface Lecturer {
    id: string;
    full_name: string;
    nidn: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
    type: 'Dosen Mata Kuliah' | 'Dosen Pembimbing';
    sub_type: string;
    faculty: string;
    avatar_url?: string;
}

const LecturerManagement: React.FC = () => {
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<'all' | 'Dosen Mata Kuliah' | 'Dosen Pembimbing'>('all');

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Toast state
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    // Form State
    const [formData, setFormData] = useState<Partial<Lecturer>>({
        full_name: '',
        nidn: '',
        email: '',
        type: 'Dosen Mata Kuliah',
        sub_type: 'Dosen Pengampu Mata Kuliah',
        faculty: 'Fakultas Teknik (FT)',
        status: 'active'
    });

    const fetchLecturers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'dosen')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setLecturers(data as Lecturer[]);
        } catch (err) {
            console.error('Error fetching lecturers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLecturers();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                role: 'dosen',
                nim_nip: formData.nidn // Sync nidn to nim_nip column
            };

            let error;
            if (selectedLecturer) {
                const { error: err } = await supabase
                    .from('profiles')
                    .update(payload)
                    .eq('id', selectedLecturer.id);
                error = err;
            } else {
                const { error: err } = await supabase
                    .from('profiles')
                    .insert([{ ...payload, id: crypto.randomUUID() }]);
                error = err;
            }

            if (error) throw error;

            setIsAddModalOpen(false);
            setSelectedLecturer(null);
            setFormData({
                full_name: '',
                nidn: '',
                email: '',
                type: 'Dosen Mata Kuliah',
                sub_type: 'Dosen Pengampu Mata Kuliah',
                faculty: 'Fakultas Teknik (FT)',
                status: 'active'
            });
            fetchLecturers();
            showToast('Data dosen berhasil disimpan!');
        } catch (err: any) {
            showToast('Gagal menyimpan data: ' + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedLecturer) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', selectedLecturer.id);

            if (error) throw error;
            setIsDeleteModalOpen(false);
            setSelectedLecturer(null);
            fetchLecturers();
            showToast('Data dosen berhasil dihapus');
        } catch (err: any) {
            showToast('Gagal menghapus data: ' + err.message, 'error');
        }
    };

    const filteredLecturers = lecturers.filter(l => {
        const matchesSearch = l.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.nidn.includes(searchTerm);
        const matchesType = selectedType === 'all' || l.type === selectedType;
        return matchesSearch && matchesType;
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Dosen Mata Kuliah': return <BookOpen size={18} />;
            case 'Dosen Pembimbing': return <UserCheck size={18} />;
            default: return <Users size={18} />;
        }
    };

    const getStatusColor = (status: string) => {
        return status === 'active'
            ? "bg-green-500/10 text-green-500 border-green-500/20"
            : "bg-slate-500/10 text-slate-500 border-slate-500/20";
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <Users size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manajemen Dosen</h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md">
                        Kelola data dosen pengampu, pembimbing akademik, dan koordinator mata kuliah dalam satu tempat.
                    </p>
                </div>

                <button
                    onClick={() => {
                        setSelectedLecturer(null);
                        setFormData({
                            full_name: '',
                            nidn: '',
                            email: '',
                            type: 'Dosen Mata Kuliah',
                            sub_type: 'Dosen Pengampu Mata Kuliah',
                            faculty: 'Fakultas Teknik (FT)',
                            status: 'active'
                        });
                        setIsAddModalOpen(true);
                    }}
                    className="relative z-10 flex items-center justify-center gap-3 px-6 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 text-sm uppercase tracking-wider"
                >
                    <Plus size={20} />
                    <span>Tambah Dosen</span>
                </button>

                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Dosen', value: lecturers.length, icon: Users, color: 'text-primary' },
                    { label: 'Dosen Pengampu', value: lecturers.filter(l => l.type === 'Dosen Mata Kuliah').length, icon: BookOpen, color: 'text-amber-500' },
                    { label: 'Dosen Pembimbing', value: lecturers.filter(l => l.type === 'Dosen Pembimbing').length, icon: UserCheck, color: 'text-blue-500' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5"
                    >
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 shadow-inner", stat.color)}>
                            <stat.icon size={26} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama atau NIDN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-primary/50 transition-all font-bold text-sm"
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:border-primary/50 transition-all font-bold text-sm cursor-pointer min-w-[200px]"
                    >
                        <option value="all">Semua Tipe Dosen</option>
                        <option value="Dosen Mata Kuliah">Dosen Mata Kuliah</option>
                        <option value="Dosen Pembimbing">Dosen Pembimbing</option>
                    </select>
                </div>
            </div>

            {/* Lecturers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredLecturers.map((lecturer) => (
                        <motion.div
                            key={lecturer.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 border-b-4 border-b-primary/40 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <span className={cn(
                                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-2",
                                    getStatusColor(lecturer.status)
                                )}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    {lecturer.status}
                                </span>
                            </div>

                            <div className="flex items-start gap-5 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-400 font-bold text-xl shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-500">
                                    {lecturer.avatar_url ? (
                                        <img src={lecturer.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                                    ) : lecturer.full_name.charAt(0)}
                                </div>
                                <div className="space-y-1.5 pr-12">
                                    <h3 className="font-bold text-slate-800 dark:text-white leading-tight group-hover:text-primary transition-colors duration-300">
                                        {lecturer.full_name}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIDN: {lecturer.nidn}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary/70">
                                        {getTypeIcon(lecturer.type)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{lecturer.type}</p>
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{lecturer.sub_type}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer">
                                        <Mail size={14} className="opacity-60" />
                                        <span className="truncate">{lecturer.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                                        <GraduationCap size={14} className="opacity-60" />
                                        <span className="truncate">{lecturer.faculty}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        onClick={() => {
                                            setSelectedLecturer(lecturer);
                                            setFormData(lecturer);
                                            setIsAddModalOpen(true);
                                        }}
                                        className="flex-1 py-3 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-400 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                                    >
                                        <Edit2 size={14} />
                                        Detail
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedLecturer(lecturer);
                                            setIsDeleteModalOpen(true);
                                        }}
                                        className="w-12 py-3 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all border border-red-500/10 flex items-center justify-center"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Helper Section - Sub Types List */}
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 overflow-hidden relative shadow-2xl">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
                            <BookOpen size={20} className="text-amber-500" />
                            Kategori Dosen Mata Kuliah
                        </h4>
                        <div className="space-y-4">
                            {[
                                "Dosen Pengampu Mata Kuliah",
                                "Koordinator Mata Kuliah"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-slate-400 font-bold group">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 group-hover:bg-amber-500 transition-colors" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
                            <UserCheck size={20} className="text-blue-500" />
                            Kategori Dosen Pembimbing
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                "Pembimbing Akademik (PA)",
                                "Pembimbing Skripsi",
                                "Pembimbing Tesis",
                                "Pembimbing Disertasi",
                                "Pembimbing KKN",
                                "Pembimbing PPL",
                                "Pembimbing PKL / Magang"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-[11px] text-slate-400 font-bold group">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 group-hover:bg-blue-500 transition-colors" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-30"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 opacity-20"></div>
            </div>

            {/* Modal Tambah/Edit Dosen */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {selectedLecturer ? 'Edit Data Dosen' : 'Tambah Dosen Baru'}
                                    </h2>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Lengkapi informasi dosen di bawah ini</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap & Gelar</label>
                                        <input
                                            required
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl px-5 py-3.5 outline-none transition-all font-bold text-slate-700 dark:text-white"
                                            placeholder="Contoh: Dr. Jhon Doe, M.Kom"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">NIDN</label>
                                        <input
                                            required
                                            value={formData.nidn}
                                            onChange={(e) => setFormData({ ...formData, nidn: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl px-5 py-3.5 outline-none transition-all font-bold text-slate-700 dark:text-white"
                                            placeholder="10 digit NIDN"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Instansi</label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl px-5 py-3.5 outline-none transition-all font-bold text-slate-700 dark:text-white"
                                            placeholder="nama@univ.ac.id"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fakultas</label>
                                        <select
                                            value={formData.faculty}
                                            onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl px-5 py-3.5 outline-none transition-all font-bold text-slate-700 dark:text-white"
                                        >
                                            <option value="Fakultas Teknik (FT)">Fakultas Teknik (FT)</option>
                                            <option value="Fakultas Ekonomi dan Bisnis (FEB)">Fakultas Ekonomi dan Bisnis (FEB)</option>
                                            <option value="Fakultas Keguruan dan Ilmu Pendidikan (FKIP)">Fakultas Keguruan dan Ilmu Pendidikan (FKIP)</option>
                                            <option value="Fakultas Hukum (FH)">Fakultas Hukum (FH)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipe Dosen</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl px-5 py-3.5 outline-none transition-all font-bold text-slate-700 dark:text-white"
                                        >
                                            <option value="Dosen Mata Kuliah">Dosen Mata Kuliah</option>
                                            <option value="Dosen Pembimbing">Dosen Pembimbing</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kategori Khusus</label>
                                        <input
                                            value={formData.sub_type}
                                            onChange={(e) => setFormData({ ...formData, sub_type: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl px-5 py-3.5 outline-none transition-all font-bold text-slate-700 dark:text-white"
                                            placeholder="Contoh: Pembimbing Skripsi"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-200 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-[2] px-8 py-4 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? 'Menyimpan...' : 'Simpan Data Dosen'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Konfirmasi Hapus */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative z-10 text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Hapus Data Dosen?</h3>
                            <p className="text-slate-500 text-sm font-medium mb-8">
                                Anda akan menghapus data <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLecturer?.full_name}</span>. Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-4 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-red-500/20"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast
                isOpen={toast.isOpen}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, isOpen: false })}
            />
        </div>
    );
};

export default LecturerManagement;
