import React, { useState, useEffect } from 'react';
import {
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Search,
    Eye,
    X,
    BookOpen,
    Clock,
    Filter,
    MoreVertical,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Toast, { ToastType } from '../components/Toast';

interface CourseItem {
    id?: string;
    code: string;
    name: string;
    sks: number;
    type?: string;
    schedule?: string;
}

interface KRSSubmission {
    id: string;
    student_id: string;
    full_name: string;
    nim: string;
    prodi: string;
    semester: number;
    total_sks: number;
    course_count: number;
    submitted_at: string;
    status: 'pending' | 'approved' | 'rejected';
    courses: CourseItem[];
}

const KRSVerificationPage: React.FC = () => {
    const { profile } = useAuth();
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({ isOpen: false, message: '', type: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<KRSSubmission['status'] | 'all'>('all');
    const [viewingStudent, setViewingStudent] = useState<KRSSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<KRSSubmission[]>([]);

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    useEffect(() => {
        const fetchSubmissions = async () => {
            setLoading(true);
            try {
                // In production: Filter by profiles.advisor_id = profile.id
                const { data, error } = await supabase
                    .from('student_krs')
                    .select('*, profiles(full_name, nim, study_programs(name))')
                    .order('created_at', { ascending: false });

                if (data) {
                    const mapped: KRSSubmission[] = data.map(m => ({
                        id: m.id,
                        student_id: m.student_id,
                        full_name: m.profiles?.full_name || 'Mahasiswa Unknown',
                        nim: m.profiles?.nim || '-',
                        prodi: m.profiles?.study_programs?.name || 'Unknown',
                        semester: m.semester || 1,
                        total_sks: m.total_sks || 0,
                        course_count: Array.isArray(m.courses) ? m.courses.length : 0,
                        submitted_at: m.created_at,
                        status: m.status || 'pending',
                        courses: Array.isArray(m.courses) ? m.courses : []
                    }));
                    setSubmissions(mapped);
                } else {
                    // Mock for Demo
                    const mock: KRSSubmission[] = [
                        { id: '1', student_id: 's1', full_name: 'Budi Santoso', nim: '2024010001', prodi: 'Teknik Informatika', semester: 4, total_sks: 22, course_count: 7, submitted_at: '2026-03-01', status: 'pending', courses: [] },
                        { id: '2', student_id: 's2', full_name: 'Anita Sari', nim: '2024010052', prodi: 'Sistem Informasi', semester: 2, total_sks: 18, course_count: 6, submitted_at: '2026-03-02', status: 'approved', courses: [] },
                    ];
                    setSubmissions(mock);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        if (profile?.id) fetchSubmissions();
    }, [profile]);

    const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
        try {
            // Real update
            const { error } = await supabase
                .from('student_krs')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
            showToast(`KRS berhasil ${newStatus === 'approved' ? 'disetujui' : 'ditolak'}`, newStatus === 'approved' ? 'success' : 'error');
        } catch (e: any) {
            showToast(e.message || 'Gagal mengubah status', 'error');
        }
    };

    const filtered = submissions.filter(s => {
        const matchSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nim.includes(searchTerm);
        const matchStatus = filterStatus === 'all' || s.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const pendingCount = submissions.filter(s => s.status === 'pending').length;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <ClipboardCheck size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Persetujuan KRS</h1>
                    <p className="text-slate-500 dark:text-slate-400">Verifikasi pengajuan rencana studi mahasiswa bimbingan Anda.</p>
                </div>
                {pendingCount > 0 && (
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="relative z-10 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-6 py-3 rounded-2xl text-sm font-black border-2 border-amber-200/50 dark:border-amber-500/20 shadow-xl shadow-amber-500/10"
                    >
                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></div>
                        {pendingCount} Verifikasi Menunggu
                    </motion.div>
                )}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Filter Hub */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nama atau NIM..."
                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 outline-none py-3.5 pl-14 pr-6 rounded-[1.25rem] text-sm focus:border-primary/40 transition-all font-bold shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {[
                        { id: 'all', label: 'Semua Status' },
                        { id: 'pending', label: 'Menunggu' },
                        { id: 'approved', label: 'Disetujui' }
                    ].map(st => (
                        <button
                            key={st.id}
                            onClick={() => setFilterStatus(st.id as any)}
                            className={cn(
                                "px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                filterStatus === st.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800"
                            )}
                        >
                            {st.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Submissions Container */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Sinkronisasi data...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-400">Semua tugas selesai. Tidak ada pengajuan KRS saat ini.</p>
                    </div>
                ) : (
                    filtered.map((s) => (
                        <motion.div
                            layout
                            key={s.id}
                            className={cn(
                                "group p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden",
                                s.status === 'pending' ? 'border-l-4 border-l-amber-500' : s.status === 'approved' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'
                            )}
                        >
                            <div className="flex gap-6 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary font-black text-xl border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-transform">
                                    {s.full_name.charAt(0)}
                                </div>
                                <div className="space-y-1 pt-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{s.full_name}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                                        NIM {s.nim} • {s.prodi} • SMT {s.semester}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-8 lg:gap-12">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total SKS</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white text-center">{s.total_sks}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Mata Kuliah</p>
                                    <button
                                        onClick={() => setViewingStudent(s)}
                                        className="text-2xl font-black text-primary text-center hover:underline block"
                                    >
                                        {s.course_count}
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tgl Pengajuan</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-white text-center">{new Date(s.submitted_at).toLocaleDateString('id-ID')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {s.status === 'pending' ? (
                                    <>
                                        <button
                                            onClick={() => handleAction(s.id, 'approved')}
                                            className="px-6 py-3.5 bg-success text-white font-bold rounded-2xl text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-success/20"
                                        >
                                            Setujui
                                        </button>
                                        <button
                                            onClick={() => handleAction(s.id, 'rejected')}
                                            className="px-6 py-3.5 bg-rose-500 text-white font-bold rounded-2xl text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rose-500/20"
                                        >
                                            Tolak
                                        </button>
                                    </>
                                ) : (
                                    <div className={cn(
                                        "px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-colors",
                                        s.status === 'approved' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                    )}>
                                        {s.status === 'approved' ? 'SELESAI/APPROVED' : 'REJECTED'}
                                    </div>
                                )}
                                <button className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-primary transition-colors">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            {/* Accent Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors"></div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal Detail Matkul */}
            <AnimatePresence>
                {viewingStudent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                        onClick={() => setViewingStudent(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black">
                                        {viewingStudent.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewingStudent.full_name}</h3>
                                        <p className="text-xs text-slate-400">NIM: {viewingStudent.nim} · {viewingStudent.prodi} · Semester {viewingStudent.semester}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewingStudent(null)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 flex items-center gap-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={14} className="text-primary" />
                                    <span className="text-xs font-bold text-slate-500">{viewingStudent.courses?.length || 0} Mata Kuliah</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-primary" />
                                    <span className="text-xs font-bold text-slate-500">Total {viewingStudent.total_sks} SKS</span>
                                </div>
                                <div>
                                    <span className={cn(
                                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                        viewingStudent.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            viewingStudent.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                    )}>
                                        {viewingStudent.status === 'approved' ? 'Disetujui' : viewingStudent.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                    </span>
                                </div>
                            </div>

                            {/* Course List */}
                            <div className="overflow-y-auto max-h-[50vh]">
                                {viewingStudent.courses && viewingStudent.courses.length > 0 ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mata Kuliah</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SKS</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jadwal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {viewingStudent.courses.map((c: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                                    <td className="px-6 py-3 text-xs font-mono font-bold text-primary">{c.code}</td>
                                                    <td className="px-6 py-3 text-sm font-bold text-slate-800 dark:text-white">{c.name}</td>
                                                    <td className="px-6 py-3 text-sm font-bold text-slate-700 dark:text-white text-center">{c.sks}</td>
                                                    <td className="px-6 py-3 text-xs text-slate-500 font-medium">{c.schedule || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-sm italic font-bold">
                                        Daftar mata kuliah belum diinput.
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            {viewingStudent.status === 'pending' && (
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => { handleAction(viewingStudent.id, 'approved'); setViewingStudent(null); }}
                                        className="flex items-center gap-2 px-6 py-3 bg-success text-white rounded-xl transition-all active:scale-95 text-xs font-bold shadow-lg shadow-success/20"
                                    >
                                        <CheckCircle2 size={16} />
                                        Setujui KRS
                                    </button>
                                    <button
                                        onClick={() => { handleAction(viewingStudent.id, 'rejected'); setViewingStudent(null); }}
                                        className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl transition-all active:scale-95 text-xs font-bold shadow-lg shadow-rose-500/20"
                                    >
                                        <XCircle size={16} />
                                        Tolak KRS
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default KRSVerificationPage;

