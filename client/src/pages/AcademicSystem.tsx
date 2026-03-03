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
    course_id?: string;
    lecturer_id?: string;
    courses?: { name: string };
    profiles?: { full_name: string };
}

const AcademicSystem: React.FC = () => {
    const [activeTab, setActiveTab] = useState('courses');
    const [courses, setCourses] = useState<Course[]>([]);
    const [classes, setClasses] = useState<ClassSchedule[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
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
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        sks: 2,
        semester_recommended: 1
    });

    const [scheduleForm, setScheduleForm] = useState({
        name: 'A',
        course_id: '',
        lecturer_id: '',
        day: 'Senin',
        start_time: '08:00',
        end_time: '10:30',
        room: '',
        capacity: 40
    });

    const [calendarForm, setCalendarForm] = useState({
        event_name: '',
        start_date: '',
        end_date: '',
        type: 'academic' as 'academic' | 'krs' | 'exam'
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'courses') await fetchCourses();
            else if (activeTab === 'classes') await fetchClasses();
            else if (activeTab === 'lecturers') await fetchLecturers();
            else if (activeTab === 'calendar') await fetchCalendar();
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
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

    const fetchCalendar = async () => {
        const { data, error } = await supabase
            .from('academic_calendar')
            .select('*')
            .order('start_date', { ascending: true });
        if (!error) setCalendarEvents(data || []);
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
            setIsAddModalOpen(false);
            fetchCourses();
            showToast('Mata kuliah berhasil disimpan');
        } catch (err: any) {
            showToast('Gagal: ' + err.message, 'error');
        }
    };

    const handleSaveSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Basic conflict check logic
            const conflict = classes.find(c =>
                c.room === scheduleForm.room &&
                c.day === scheduleForm.day &&
                ((scheduleForm.start_time >= c.start_time && scheduleForm.start_time < c.end_time) ||
                    (scheduleForm.end_time > c.start_time && scheduleForm.end_time <= c.end_time))
            );

            if (conflict && (!selectedSchedule || selectedSchedule.id !== conflict.id)) {
                showToast('Jadwal bentrok di ruangan ' + scheduleForm.room, 'error');
                return;
            }

            if (selectedSchedule) {
                const { error } = await supabase
                    .from('classes')
                    .update(scheduleForm)
                    .eq('id', selectedSchedule.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('classes')
                    .insert([scheduleForm]);
                if (error) throw error;
            }
            setIsScheduleModalOpen(false);
            fetchClasses();
            showToast('Jadwal berhasil disimpan');
        } catch (err: any) {
            showToast('Gagal: ' + err.message, 'error');
        }
    };

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
        writeFile(wb, `Kurikulum_SIM_${new Date().getFullYear()}.xlsx`);
    };

    const handleSaveCalendar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('academic_calendar')
                .upsert([calendarForm]);
            if (error) throw error;
            setIsCalendarModalOpen(false);
            fetchCalendar();
            showToast('Kalender akademik berhasil disimpan');
        } catch (err: any) {
            showToast('Gagal: ' + err.message, 'error');
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        if (!confirm('Hapus jadwal ini?')) return;
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (!error) {
            fetchClasses();
            showToast('Jadwal dihapus');
        }
    };

    const handleDeleteCalendar = async (id: string) => {
        if (!confirm('Hapus event ini?')) return;
        const { error } = await supabase.from('academic_calendar').delete().eq('id', id);
        if (!error) {
            fetchCalendar();
            showToast('Event dihapus');
        }
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
                    <p className="text-slate-500 dark:text-slate-400">Kelola kurikulum, jadwal perkuliahan, dan kalender akademik.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Download size={18} />
                        Export
                    </button>
                    <button
                        onClick={() => {
                            if (activeTab === 'courses') {
                                setSelectedCourse(null);
                                setFormData({ code: '', name: '', sks: 2, semester_recommended: 1 });
                                setIsAddModalOpen(true);
                            } else if (activeTab === 'classes') {
                                setSelectedSchedule(null);
                                setScheduleForm({ name: 'A', course_id: '', lecturer_id: '', day: 'Senin', start_time: '08:00', end_time: '10:30', room: '', capacity: 40 });
                                setIsScheduleModalOpen(true);
                            }
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group active:scale-95"
                    >
                        <Plus size={18} className="transition-transform group-hover:rotate-90" />
                        Tambah {activeTab === 'courses' ? 'Mata Kuliah' : 'Jadwal'}
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Column */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 overflow-hidden relative group">
                        <div className="space-y-1 relative z-10 px-2 py-4">
                            <button onClick={() => setActiveTab('courses')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'courses' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold")}>
                                <div className="flex items-center gap-4">
                                    <BookOpen size={18} />
                                    <span>Kurikulum</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'courses' ? "translate-x-1" : "opacity-0")} />
                            </button>
                            <button onClick={() => setActiveTab('classes')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'classes' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold")}>
                                <div className="flex items-center gap-4">
                                    <Calendar size={18} />
                                    <span>Jadwal & Kelas</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'classes' ? "translate-x-1" : "opacity-0")} />
                            </button>
                            <button onClick={() => setActiveTab('calendar')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'calendar' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold")}>
                                <div className="flex items-center gap-4">
                                    <Clock size={18} />
                                    <span>Kalender Akademik</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'calendar' ? "translate-x-1" : "opacity-0")} />
                            </button>
                            <button onClick={() => setActiveTab('lecturers')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'lecturers' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold")}>
                                <div className="flex items-center gap-4">
                                    <User size={18} />
                                    <span>Data Dosen</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'lecturers' ? "translate-x-1" : "opacity-0")} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'courses' && (
                            <motion.div key="courses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/10">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Mata Kuliah</h3>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-100 dark:bg-slate-800 border-none outline-none py-2.5 pl-10 pr-4 rounded-xl text-xs w-48 focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {loading ? <div className="p-20 text-center text-slate-400 font-bold">Memuat...</div> : courses.map(c => (
                                        <div key={c.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-bold">{c.code.slice(0, 2)}</div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white">{c.name}</h4>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.code} • {c.sks} SKS • Semester {c.semester_recommended}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => { setSelectedCourse(c); setFormData({ ...c }); setIsAddModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary rounded-lg"><Edit2 size={18} /></button>
                                                <button onClick={() => handleDeleteCourse(c.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'classes' && (
                            <motion.div key="classes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-8 min-h-[400px]">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Jadwal & Pengelolaan Kelas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {classes.map(item => (
                                        <div key={item.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 relative group">
                                            <div className="flex justify-between mb-4">
                                                <span className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-black text-primary shadow-sm uppercase tracking-widest">{item.day}: {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setSelectedSchedule(item); setScheduleForm({ ...item, course_id: item.course_id || '', lecturer_id: item.lecturer_id || '' }); setIsScheduleModalOpen(true); }} className="text-slate-400 hover:text-primary"><Edit2 size={14} /></button>
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-white mb-2">{item.courses?.name || 'Mata Kuliah'} - Kelas {item.name}</h4>
                                            <div className="flex gap-4 text-xs text-slate-500 font-bold uppercase tracking-tight opacity-70">
                                                <span className="flex items-center gap-1"><MapPin size={12} /> {item.room}</span>
                                                <span className="flex items-center gap-1"><Users size={12} /> {item.capacity} Kapasitas</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'calendar' && (
                            <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px] overflow-hidden">
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/10 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manajemen Kalender Akademik</h3>
                                    <button onClick={() => { setCalendarForm({ event_name: '', start_date: '', end_date: '', type: 'academic' }); setIsCalendarModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 uppercase tracking-widest"><Plus size={14} /> Tambah Event</button>
                                </div>
                                <div className="p-8 space-y-4">
                                    {calendarEvents.length === 0 ? <p className="text-center text-slate-400 py-20 font-bold italic opacity-60">Belum ada agenda akademik.</p> : calendarEvents.map(ev => (
                                        <div key={ev.id} className="flex gap-6 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all border border-transparent hover:border-slate-100 lg:items-center">
                                            <div className="w-16 text-center">
                                                <p className="text-2xl font-black text-primary">{new Date(ev.start_date).getDate()}</p>
                                                <p className="text-[10px] font-black uppercase text-slate-400">{new Date(ev.start_date).toLocaleString('id-ID', { month: 'short' })}</p>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 dark:text-white">{ev.event_name}</h4>
                                                <p className="text-xs text-slate-500">{new Date(ev.start_date).toLocaleDateString('id-ID')} - {new Date(ev.end_date).toLocaleDateString('id-ID')}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest h-fit">{ev.type}</span>
                                                <button onClick={() => { setCalendarForm({ ...ev }); setIsCalendarModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary transition-all"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeleteCalendar(ev.id)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'lecturers' && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/10">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Data Dosen</h3>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {lecturers.map(l => (
                                        <div key={l.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-bold">{l.full_name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white">{l.full_name}</p>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">NIP: {l.nim_nip || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 rounded-lg uppercase tracking-widest">{l.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal MK */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 relative z-10">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white uppercase tracking-tight">{selectedCourse ? 'Edit MK' : 'Tambah MK'}</h2>
                            <form onSubmit={handleSaveCourse} className="space-y-4">
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode MK</label><input required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-none outline-none font-bold text-sm" /></div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama MK</label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-none outline-none font-bold text-sm" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKS</label><input type="number" value={formData.sks} onChange={e => setFormData({ ...formData, sks: parseInt(e.target.value) })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-none outline-none font-bold text-sm" /></div>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label><input type="number" value={formData.semester_recommended} onChange={e => setFormData({ ...formData, semester_recommended: parseInt(e.target.value) })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-none outline-none font-bold text-sm" /></div>
                                </div>
                                <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest">Simpan Data</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Jadwal */}
            <AnimatePresence>
                {isScheduleModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsScheduleModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 relative z-10 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white uppercase tracking-tight">Manajemen Jadwal & Kelas</h2>
                            <form onSubmit={handleSaveSchedule} className="space-y-4">
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mata Kuliah</label>
                                    <select value={scheduleForm.course_id} onChange={e => setScheduleForm({ ...scheduleForm, course_id: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl outline-none font-bold text-sm cursor-pointer">
                                        <option value="">Pilih MK</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                                    </select>
                                </div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dosen Pengampu</label>
                                    <select value={scheduleForm.lecturer_id} onChange={e => setScheduleForm({ ...scheduleForm, lecturer_id: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl outline-none font-bold text-sm cursor-pointer">
                                        <option value="">Pilih Dosen</option>
                                        {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hari</label>
                                        <select value={scheduleForm.day} onChange={e => setScheduleForm({ ...scheduleForm, day: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl outline-none font-bold text-sm">
                                            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ruangan</label><input placeholder="Contoh: R.301" value={scheduleForm.room} onChange={e => setScheduleForm({ ...scheduleForm, room: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl outline-none font-bold text-sm" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mulai</label><input type="time" value={scheduleForm.start_time} onChange={e => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-none outline-none font-bold text-sm" /></div>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selesai</label><input type="time" value={scheduleForm.end_time} onChange={e => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-none outline-none font-bold text-sm" /></div>
                                </div>
                                <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest mt-4">Simpan Jadwal</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Calendar */}
            <AnimatePresence>
                {isCalendarModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCalendarModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 relative z-10">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white uppercase tracking-tight">Krs & Kalender Akademik</h2>
                            <form onSubmit={handleSaveCalendar} className="space-y-4">
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Event</label><input required value={calendarForm.event_name} onChange={e => setCalendarForm({ ...calendarForm, event_name: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-none outline-none font-bold text-sm" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tgl Mulai</label><input type="date" required value={calendarForm.start_date} onChange={e => setCalendarForm({ ...calendarForm, start_date: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl outline-none font-bold text-sm" /></div>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tgl Selesai</label><input type="date" required value={calendarForm.end_date} onChange={e => setCalendarForm({ ...calendarForm, end_date: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl outline-none font-bold text-sm" /></div>
                                </div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe Event</label>
                                    <select value={calendarForm.type} onChange={e => setCalendarForm({ ...calendarForm, type: e.target.value as any })} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl outline-none font-bold text-sm">
                                        <option value="academic">Akademik</option>
                                        <option value="krs">Pengisian KRS</option>
                                        <option value="exam">Ujian</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest mt-4">Simpan Event</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
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
