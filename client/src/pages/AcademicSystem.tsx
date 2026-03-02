import React, { useState, useEffect } from 'react';
import {
    School,
    BookOpen,
    Users,
    Search,
    Filter,
    Calendar,
    Clock,
    MapPin,
    User,
    Plus,
    MoreVertical,
    Download,
    CheckCircle2,
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    Zap,
    Star,
    ExternalLink,
    Lock,
    GraduationCap,
    X,
    Trash2,
    Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { utils, writeFile } from 'xlsx';
import Toast, { ToastType } from '../components/Toast';

interface Course {
    id: string;
    code: string;
    name: string;
    sks: number;
    semester_recommended: number;
    study_program_id?: string;
    study_programs?: { name: string };
}

interface ClassSchedule {
    id: string;
    name: string;
    day: string;
    start_time: string;
    end_time: string;
    room: string;
    capacity: number;
    courses?: { name: string };
    profiles?: { full_name: string };
}

const AcademicSystem: React.FC = () => {
    const [activeTab, setActiveTab] = useState('courses');
    const [courses, setCourses] = useState<Course[]>([]);
    const [classes, setClasses] = useState<ClassSchedule[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Toast state
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        sks: 2,
        semester_recommended: 1
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'courses') await fetchCourses();
        else if (activeTab === 'classes') await fetchClasses();
        else if (activeTab === 'lecturers') await fetchLecturers();
        setLoading(false);
    };

    const fetchCourses = async () => {
        const { data, error } = await supabase
            .from('courses')
            .select('*, study_programs(name)')
            .order('semester_recommended', { ascending: true });
        if (!error) setCourses(data || []);
    };

    const fetchClasses = async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('*, courses(name), profiles(full_name)')
            .order('day', { ascending: true });
        if (!error) setClasses(data || []);
    };

    const fetchLecturers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'dosen')
            .order('full_name', { ascending: true });
        if (!error) setLecturers(data || []);
    };

    const handleSaveCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedCourse) {
                const { error } = await supabase
                    .from('courses')
                    .update(formData)
                    .eq('id', selectedCourse.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('courses')
                    .insert([formData]);
                if (error) throw error;
            }
            setCourses(prev => [...prev, formData as Course]);
            setIsAddModalOpen(false);
            fetchCourses();
            showToast('Data berhasil disimpan');
        } catch (err: any) {
            showToast('Gagal menyimpan: ' + err.message, 'error');
        }
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm('Yakin ingin menghapus mata kuliah ini?')) return;
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id);
        if (!error) {
            fetchCourses();
            showToast('Mata kuliah berhasil dihapus');
        } else {
            showToast('Gagal menghapus: ' + error.message, 'error');
        }
    };

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExport = () => {
        if (courses.length === 0) {
            showToast('Tidak ada data kurikulum untuk diekspor', 'error');
            return;
        }

        const exportData = courses.map(c => ({
            'Kode MK': c.code,
            'Nama Mata Kuliah': c.name,
            'SKS': c.sks,
            'Semester': c.semester_recommended,
            'Program Studi': c.study_programs?.name || '-'
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'Kurikulum');

        // Auto-size columns
        const colWidths = [
            { wch: 10 }, // Kode
            { wch: 40 }, // Nama
            { wch: 5 },  // SKS
            { wch: 10 }, // Semester
            { wch: 30 }  // Prodi
        ];
        ws['!cols'] = colWidths;

        writeFile(wb, `Kurikulum_SIM_Akademik_${new Date().getFullYear()}.xlsx`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <School size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Sistem Akademik</h1>
                    <p className="text-slate-500 dark:text-slate-400">Kelola kurikulum, jadwal perkuliahan, dan pengampu mata kuliah.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Download size={18} />
                        Ekspor Kurikulum
                    </button>
                    <button
                        onClick={() => {
                            setSelectedCourse(null);
                            setFormData({ code: '', name: '', sks: 2, semester_recommended: 1 });
                            setIsAddModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group active:scale-95"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        Tambah Mata Kuliah
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Column */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 overflow-hidden relative group">
                        <div className="space-y-1 relative z-10 px-2 py-4">
                            <button onClick={() => setActiveTab('courses')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'courses' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                <div className="flex items-center gap-4">
                                    <BookOpen size={18} />
                                    <span className="text-sm font-bold">Daftar Mata Kuliah</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'courses' ? "translate-x-1" : "opacity-0")} />
                            </button>
                            <button onClick={() => setActiveTab('classes')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'classes' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                <div className="flex items-center gap-4">
                                    <Calendar size={18} />
                                    <span className="text-sm font-bold">Jadwal & Kelas</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'classes' ? "translate-x-1" : "opacity-0")} />
                            </button>
                            <button onClick={() => setActiveTab('lecturers')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'lecturers' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                <div className="flex items-center gap-4">
                                    <User size={18} />
                                    <span className="text-sm font-bold">Data Dosen</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'lecturers' ? "translate-x-1" : "opacity-0")} />
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 -z-0"></div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative group">
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform border border-white/10 shadow-sm">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg mb-2">Statistik Akademik</h4>
                                <p className="text-slate-400 text-xs font-medium italic opacity-80 mb-8 leading-relaxed tracking-tight">Performa lulusan dan kualitas pengajaran periode Semester Ganjil.</p>
                                <button className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group/link cursor-pointer hover:gap-3 transition-all">
                                    Lihat Laporan Lengkap
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -z-0"></div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'courses' && (
                            <motion.div
                                key="courses"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/10">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Manajemen Kurikulum</h3>
                                        <p className="text-xs text-slate-500 font-medium">Daftar mata kuliah tervalidasi pada Program Studi aktif.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari Mata Kuliah..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="bg-slate-100 dark:bg-slate-800 border-none outline-none py-2.5 pl-10 pr-4 rounded-xl text-xs w-48 transition-all focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {loading ? (
                                        <div className="p-20 text-center text-slate-400 font-bold">Memuat data...</div>
                                    ) : filteredCourses.length === 0 ? (
                                        <div className="p-20 text-center text-slate-400 font-bold">Tidak ada mata kuliah ditemukan.</div>
                                    ) : (
                                        filteredCourses.map((course) => (
                                            <div key={course.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                                <div className="flex items-center gap-8">
                                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary/10 group-hover:text-primary transition-all border border-slate-100 dark:border-slate-700 shadow-sm uppercase">
                                                        {course.code.slice(0, 2)}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors text-base">{course.name}</h4>
                                                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                            <span className="flex items-center gap-1.5"><Star size={12} className="opacity-60" /> {course.code}</span>
                                                            <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-primary/80">{course.sks} SKS</span>
                                                            <span className="flex items-center gap-1.5 opacity-60">Sem {course.semester_recommended}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCourse(course);
                                                            setFormData({
                                                                code: course.code,
                                                                name: course.name,
                                                                sks: course.sks,
                                                                semester_recommended: course.semester_recommended
                                                            });
                                                            setIsAddModalOpen(true);
                                                        }}
                                                        className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCourse(course.id)}
                                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'classes' && (
                            <motion.div
                                key="classes"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-8"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Jadwal & Kelas Aktif</h3>
                                        <p className="text-xs text-slate-500 font-medium">Monitoring ruangan dan jadwal perkuliahan hari ini.</p>
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 animate-pulse">
                                        Live: 12 Kelas Berjalan
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {loading ? (
                                        <div className="col-span-full p-20 text-center text-slate-400 font-bold">Memuat data...</div>
                                    ) : classes.length === 0 ? (
                                        <div className="col-span-full p-20 text-center text-slate-400 font-bold">Tidak ada jadwal aktif.</div>
                                    ) : (
                                        classes.map((item) => (
                                            <div key={item.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary/20 transition-all group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-bold text-primary shadow-sm uppercase tracking-widest">
                                                        {item.day}: {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                                                    </div>
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 dark:text-white mb-2 group-hover:text-primary transition-colors">{item.courses?.name} - Kelas {item.name}</h4>
                                                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary/60" /> {item.room}</span>
                                                    <span className="flex items-center gap-1.5"><Users size={14} className="text-primary/60" /> {item.capacity} Mhs</span>
                                                    <span className="flex items-center gap-1.5"><User size={14} className="text-primary/60" /> {item.profiles?.full_name?.split(' ')[0]}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'lecturers' && (
                            <motion.div
                                key="lecturers"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                            >
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/10">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Data Dosen Pengampu</h3>
                                    <p className="text-xs text-slate-500 font-medium">Informasi jabatan fungsional dan beban mengajar dosen.</p>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {loading ? (
                                        <div className="p-20 text-center text-slate-400 font-bold">Memuat data...</div>
                                    ) : lecturers.length === 0 ? (
                                        <div className="p-20 text-center text-slate-400 font-bold">Tidak ada data dosen.</div>
                                    ) : (
                                        lecturers.map((lecturer) => (
                                            <div key={lecturer.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-bold shadow-sm">
                                                        {lecturer.avatar_url ? (
                                                            <img src={lecturer.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                        ) : lecturer.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-white group-hover:text-primary">{lecturer.full_name}</p>
                                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-tight opacity-70">NIDN: {lecturer.nim_nip || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 rounded-lg uppercase tracking-widest">{lecturer.status}</span>
                                                    <ChevronRight size={18} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal: Tambah/Edit Mata Kuliah */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 overflow-hidden font-sans">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {selectedCourse ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}
                                </h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveCourse} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Kode MK</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                            placeholder="TI601"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nama Mata Kuliah</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                            placeholder="Pemrograman Web II"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">SKS</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max="6"
                                                value={formData.sks}
                                                onChange={(e) => setFormData({ ...formData, sks: parseInt(e.target.value) })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Semester</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max="8"
                                                value={formData.semester_recommended}
                                                onChange={(e) => setFormData({ ...formData, semester_recommended: parseInt(e.target.value) })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] mt-4"
                                >
                                    {selectedCourse ? 'Simpan Perubahan' : 'Tambah Mata Kuliah'}
                                </button>
                            </form>
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

const ArrowRight: React.FC<{ size: number, className?: string }> = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
);

export default AcademicSystem;
