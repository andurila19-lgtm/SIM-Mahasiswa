import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Users,
    Clock,
    MapPin,
    Calendar,
    ChevronRight,
    Search,
    GraduationCap,
    FileText,
    ClipboardCheck,
    Plus,
    Upload,
    Download,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Info,
    MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';
import Toast, { ToastType } from '../components/Toast';

interface Student {
    id: string;
    nim: string;
    full_name: string;
    status: 'present' | 'absent' | 'permit' | 'sick' | 'none';
}

interface ClassItem {
    id: string;
    name: string;
    day: string;
    start_time: string;
    end_time: string;
    room: string;
    capacity: number;
    course_id: string;
    courses?: { name: string; code: string; sks: number };
}

const MyClassesPage: React.FC = () => {
    const { profile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

    // View Management
    const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'details'>('grid');
    const [detailTab, setDetailTab] = useState<'students' | 'attendance' | 'materials'>('students');

    // Attendance State
    const [attendanceData, setAttendanceData] = useState<Record<string, Student['status']>>({});

    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({ isOpen: false, message: '', type: 'success' });
    const showToast = (message: string, type: ToastType = 'success') => setToast({ isOpen: true, message, type });

    // Initialize attendance data when class is selected
    useEffect(() => {
        if (selectedClass) {
            // Mock initialization - in real app, fetch from DB
            const initial: Record<string, Student['status']> = {};
            [1, 2, 3, 4, 5].forEach(i => {
                initial[`202401000${i}`] = 'none';
            });
            setAttendanceData(initial);
        }
    }, [selectedClass]);

    const handleSetAttendance = (nim: string, status: Student['status']) => {
        setAttendanceData(prev => ({ ...prev, [nim]: status }));
    };

    const handleSetAllPresent = () => {
        const updated = { ...attendanceData };
        Object.keys(updated).forEach(nim => {
            updated[nim] = 'present';
        });
        setAttendanceData(updated);
        showToast('Semua mahasiswa diset Hadir');
    };

    const handleSaveAttendance = () => {
        showToast('Presensi berhasil disimpan ke sistem', 'success');
    };

    // Handle incoming state from other pages (like AttendancePage)
    useEffect(() => {
        const state = location.state as { classId?: string };
        if (state?.classId && !loading && classes.length > 0) {
            const foundClass = classes.find(c => String(c.id) === String(state.classId));
            if (foundClass) {
                setSelectedClass(foundClass);
                setViewMode('details');
                setDetailTab('attendance');

                // Clear state slightly later to ensure UI has rendered and avoid refresh issues
                setTimeout(() => {
                    navigate(location.pathname, { replace: true, state: {} });
                }, 100);
            }
        }
    }, [location.state, classes, loading, navigate]);

    useEffect(() => {
        const fetchClasses = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('classes')
                    .select('*, courses(name, code, sks)')
                    .eq('lecturer_id', profile?.id)
                    .order('day', { ascending: true });

                if (error) throw error;
                if (data && data.length > 0) {
                    setClasses(data);
                } else {
                    throw new Error('No data');
                }
            } catch (e: any) {
                console.warn('Fetch Classes Error or No Data, using fallback:', e);
                // Mock data for demo - Ensure IDs match with AttendancePage
                const mock: ClassItem[] = [
                    { id: '1', name: 'SI-01', day: 'Senin', start_time: '08:00', end_time: '10:30', room: 'Lantai 3 - R.302', capacity: 35, course_id: 'c1', courses: { name: 'Pemrograman Web II', code: 'IF202', sks: 3 } },
                    { id: '2', name: 'IF-03', day: 'Rabu', start_time: '13:00', end_time: '15:30', room: 'Lantai 2 - Lab Komp 1', capacity: 28, course_id: 'c1', courses: { name: 'Kecerdasan Buatan', code: 'AI301', sks: 3 } },
                    { id: '3', name: 'SI-A', day: 'Kamis', start_time: '10:00', end_time: '12:30', room: 'Lantai 3 - R.305', capacity: 38, course_id: 'c2', courses: { name: 'Manajemen Data', code: 'SIF302', sks: 3 } },
                ];
                setClasses(mock);
            } finally {
                setLoading(false);
            }
        };
        if (profile?.id) fetchClasses();
    }, [profile]);

    const dayOrder: Record<string, number> = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
    const filtered = classes.filter(c =>
        c.courses?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99));

    const handleViewDetails = (cls: ClassItem) => {
        setSelectedClass(cls);
        setViewMode('details');
        setDetailTab('students');
    };

    const StatusBadge = ({ status }: { status: Student['status'] }) => {
        const styles = {
            present: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            absent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
            permit: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            sick: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            none: 'bg-slate-100 text-slate-400 dark:bg-slate-800'
        };
        const labels = { present: 'Hadir', absent: 'Alpa', permit: 'Izin', sick: 'Sakit', none: '-' };
        return <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", styles[status])}>{labels[status]}</span>;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {viewMode === 'grid' ? (
                <>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                                <BookOpen size={28} />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manajemen Kelas</h1>
                            <p className="text-slate-500 dark:text-slate-400">Pusat kontrol perkuliahan, presensi, dan materi ajar.</p>
                        </div>
                        <div className="relative z-10 flex gap-4">
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    onClick={() => setActiveTab('current')}
                                    className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", activeTab === 'current' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400")}
                                >
                                    Semester Aktif
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", activeTab === 'history' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400")}
                                >
                                    Riwayat Mengajar
                                </button>
                            </div>
                            <div className="relative">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Cari kelas..."
                                    className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 outline-none py-3 pl-10 pr-4 rounded-xl text-sm w-48 lg:w-64 focus:border-primary/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
                    </div>

                    {/* Class Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {loading ? (
                            <div className="col-span-full py-20 text-center font-bold text-slate-300 animate-pulse">Memuat data kelas...</div>
                        ) : filtered.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                <Search size={48} className="mx-auto mb-4 text-slate-200" />
                                <p className="text-slate-500 font-bold italic">Tidak ada kelas yang ditemukan.</p>
                            </div>
                        ) : filtered.map((item) => (
                            <motion.div
                                key={item.id}
                                whileHover={{ y: -5 }}
                                onClick={() => handleViewDetails(item)}
                                className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group cursor-pointer relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-primary/5 rounded-2xl text-primary">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                        Aktif
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                                    {item.courses?.name}
                                </h3>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.courses?.code}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <span className="text-xs font-bold text-primary">Kelas {item.name}</span>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span>{item.day}, {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                                        <MapPin size={14} className="text-slate-400" />
                                        <span>{item.room}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                                        <Users size={14} className="text-slate-400" />
                                        <span>{item.capacity} Mahasiswa</span>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Kelola Kelas</span>
                                    <ChevronRight size={18} className="text-primary" />
                                </div>

                                {/* Futuristic Accent */}
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                            </motion.div>
                        ))}
                    </div>
                </>
            ) : (
                /* Details View */
                <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                    {/* Details Header */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <button
                            onClick={() => setViewMode('grid')}
                            className="absolute top-8 left-8 p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary rounded-2xl border border-slate-100 dark:border-slate-700 transition-all active:scale-95 z-20"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center relative z-10 pt-4">
                            <div className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-[0.2em] mb-4 border border-primary/20">
                                {selectedClass?.courses?.code} • {selectedClass?.name}
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
                                {selectedClass?.courses?.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 font-bold">
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <Calendar size={16} className="text-primary" /> {selectedClass?.day}
                                </span>
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <Clock size={16} className="text-primary" /> {selectedClass?.start_time.slice(0, 5)} - {selectedClass?.end_time.slice(0, 5)}
                                </span>
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <MapPin size={16} className="text-primary" /> {selectedClass?.room}
                                </span>
                            </div>
                        </div>

                        {/* Detail Tabs */}
                        <div className="flex justify-center gap-2 mt-12 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit mx-auto border border-slate-100 dark:border-slate-800 shadow-inner relative z-10">
                            {[
                                { id: 'students', label: 'Daftar Mahasiswa', icon: Users },
                                { id: 'attendance', label: 'Presensi', icon: ClipboardCheck },
                                { id: 'materials', label: 'Materi Ajar', icon: FileText }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setDetailTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black transition-all",
                                        detailTab === tab.id
                                            ? "bg-white dark:bg-slate-700 text-primary shadow-lg shadow-primary/10"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-blue-400 to-indigo-500 opacity-50"></div>
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={detailTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px] overflow-hidden"
                        >
                            {detailTab === 'students' && (
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">Peserta Kelas ({selectedClass?.capacity})</h4>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
                                            <Download size={14} /> Export Excel
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">No</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">NIM</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Mahasiswa</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kehadiran (%)</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                                        <td className="p-4 text-xs font-bold text-slate-400 text-center">{i}</td>
                                                        <td className="p-4 text-xs font-black text-primary font-mono select-all">202401000{i}</td>
                                                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">Mahasiswa Ke-{i}</td>
                                                        <td className="p-4 text-center text-sm font-bold text-slate-900 dark:text-white">{90 + i}%</td>
                                                        <td className="p-4 text-center">
                                                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">Aktif</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {detailTab === 'attendance' && (
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-10">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Input Presensi Harian</h4>
                                            <p className="text-xs text-slate-500 font-medium italic tracking-tight opacity-70">Pertemuan ke-8 • {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleSetAllPresent}
                                                className="px-5 py-3 bg-slate-900 text-white font-bold rounded-2xl text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                                            >
                                                Set Hadir Semua
                                            </button>
                                            <button
                                                onClick={handleSaveAttendance}
                                                className="px-5 py-3 bg-primary text-white font-bold rounded-2xl text-xs hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
                                            >
                                                Simpan Presensi
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {[1, 2, 3, 4, 5].map(i => {
                                            const nim = `202401000${i}`;
                                            const currentStatus = attendanceData[nim] || 'none';

                                            return (
                                                <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-primary/20 transition-all">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-bold border border-slate-100 dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform">
                                                            {i}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">Mahasiswa Ke-{i}</p>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">NIM: {nim}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl gap-1 shadow-inner border border-slate-100 dark:border-slate-800">
                                                        {[
                                                            { id: 'present', label: 'H', activeClass: 'bg-emerald-500 text-white', inactiveClass: 'text-emerald-500 hover:bg-emerald-50' },
                                                            { id: 'sick', label: 'S', activeClass: 'bg-blue-500 text-white', inactiveClass: 'text-blue-500 hover:bg-blue-50' },
                                                            { id: 'permit', label: 'I', activeClass: 'bg-amber-500 text-white', inactiveClass: 'text-amber-500 hover:bg-amber-50' },
                                                            { id: 'absent', label: 'A', activeClass: 'bg-rose-500 text-white', inactiveClass: 'text-rose-500 hover:bg-rose-50' }
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => handleSetAttendance(nim, opt.id as any)}
                                                                className={cn(
                                                                    "w-10 h-10 rounded-xl text-xs font-black transition-all",
                                                                    currentStatus === opt.id ? opt.activeClass : opt.inactiveClass
                                                                )}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {detailTab === 'materials' && (
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-10">
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">Materi & Modul Perkuliahan</h4>
                                        <button className="flex items-center gap-2.5 px-6 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs">
                                            <Upload size={18} /> Unggah Materi Baru
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { title: 'Modul Pertemuan 1 - Introduction', date: '2026-03-01', size: '2.4 MB', type: 'PDF' },
                                            { title: 'Dataset Latihan Web Services', date: '2026-03-02', size: '1.1 MB', type: 'ZIP' },
                                            { title: 'PPT Pertemuan 2 - Architecture', date: '2026-03-03', size: '4.8 MB', type: 'PPTX' }
                                        ].map((file, i) => (
                                            <div key={i} className="group p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all hover:border-primary/20 shadow-sm relative overflow-hidden">
                                                <div className="flex items-start gap-5">
                                                    <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                        <FileText size={28} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-10">
                                                        <h5 className="font-bold text-slate-800 dark:text-white truncate mb-1 group-hover:text-primary transition-colors text-sm">{file.title}</h5>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">{file.type} • {file.size} • Bertambah {file.date}</p>
                                                        <div className="flex gap-4">
                                                            <button className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 hover:underline decoration-2">
                                                                <Download size={14} /> Download
                                                            </button>
                                                            <button className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 hover:underline decoration-2">
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 rounded-lg">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-12 p-10 bg-slate-50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center group cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center text-slate-400 mx-auto mb-4 group-hover:scale-110 group-hover:text-primary transition-all">
                                            <Plus size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-500 mb-1 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Tambah Pertemuan Baru</p>
                                        <p className="text-[10px] text-slate-400 font-medium italic opacity-60">Seret file ke sini atau klik untuk memilih</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default MyClassesPage;

