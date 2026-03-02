import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, Search, Eye, X, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import Toast, { ToastType } from '../components/Toast';

interface CourseItem {
    code: string;
    name: string;
    sks: number;
    type: 'Wajib' | 'Pilihan';
    schedule: string;
}

interface KRSSubmission {
    id: string;
    studentName: string;
    nim: string;
    prodi: string;
    semester: number;
    totalSKS: number;
    courses: number;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    courseList: CourseItem[];
}

const KRSVerificationPage: React.FC = () => {
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({ isOpen: false, message: '', type: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [viewingStudent, setViewingStudent] = useState<KRSSubmission | null>(null);

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const [submissions, setSubmissions] = useState<KRSSubmission[]>(() => {
        const saved = localStorage.getItem('krs_verifications_clean');
        return saved ? JSON.parse(saved) : [];
    });

    const updateSubmissions = (newData: KRSSubmission[]) => {
        setSubmissions(newData);
        localStorage.setItem('krs_verifications_clean', JSON.stringify(newData));
    };

    const handleApprove = (id: string) => {
        const updated = submissions.map(s => s.id === id ? { ...s, status: 'approved' as const } : s);
        updateSubmissions(updated);
        showToast('KRS berhasil disetujui');
    };

    const handleReject = (id: string) => {
        const updated = submissions.map(s => s.id === id ? { ...s, status: 'rejected' as const } : s);
        updateSubmissions(updated);
        showToast('KRS ditolak', 'error');
    };

    const filtered = submissions.filter(s => {
        const matchSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || s.nim.includes(searchTerm);
        const matchStatus = filterStatus === 'all' || s.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const statusStyle = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-500/20';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-500/20';
            default: return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-500/20';
        }
    };

    const pendingCount = submissions.filter(s => s.status === 'pending').length;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                        <ClipboardCheck size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Verifikasi KRS</h1>
                    <p className="text-slate-500 dark:text-slate-400">Tinjau dan setujui pengajuan KRS mahasiswa.</p>
                </div>
                {pendingCount > 0 && (
                    <div className="relative z-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-5 py-3 rounded-2xl text-sm font-bold border border-amber-100 dark:border-amber-500/20 animate-pulse">
                        {pendingCount} KRS Menunggu Persetujuan
                    </div>
                )}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari berdasarkan nama atau NIM..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:border-primary/50 transition-all"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-3.5 px-4 rounded-2xl text-sm font-bold cursor-pointer"
                >
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prodi</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Smt</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SKS</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Matkul</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 text-sm">
                                        <ClipboardCheck size={40} className="mx-auto mb-3 opacity-30" />
                                        Belum ada pengajuan KRS.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                    <td className="p-4">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{s.studentName}</p>
                                            <p className="text-xs text-slate-400 font-mono">{s.nim}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-medium">{s.prodi}</td>
                                    <td className="p-4 text-sm font-bold text-slate-700 dark:text-white text-center">{s.semester}</td>
                                    <td className="p-4 text-sm font-bold text-primary text-center">{s.totalSKS}</td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => setViewingStudent(s)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 rounded-lg transition-all active:scale-95 text-xs font-bold border border-blue-200 dark:border-blue-500/20"
                                        >
                                            <Eye size={12} />
                                            {s.courses} Matkul
                                        </button>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", statusStyle(s.status))}>
                                            {s.status === 'approved' ? 'Disetujui' : s.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {s.status === 'pending' ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleApprove(s.id)}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 rounded-xl transition-all active:scale-90 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Setujui
                                                </button>
                                                <button
                                                    onClick={() => handleReject(s.id)}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 rounded-xl transition-all active:scale-90 text-xs font-bold border border-rose-200 dark:border-rose-500/20"
                                                >
                                                    <XCircle size={14} />
                                                    Tolak
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Selesai</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
                                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <BookOpen size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewingStudent.studentName}</h3>
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
                                    <span className="text-xs font-bold text-slate-500">{viewingStudent.courseList?.length || viewingStudent.courses} Mata Kuliah</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-primary" />
                                    <span className="text-xs font-bold text-slate-500">Total {viewingStudent.totalSKS} SKS</span>
                                </div>
                                <div>
                                    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", statusStyle(viewingStudent.status))}>
                                        {viewingStudent.status === 'approved' ? 'Disetujui' : viewingStudent.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                    </span>
                                </div>
                            </div>

                            {/* Course List */}
                            <div className="overflow-y-auto max-h-[50vh]">
                                {(viewingStudent.courseList && viewingStudent.courseList.length > 0) ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-white dark:bg-slate-900">
                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mata Kuliah</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SKS</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Jenis</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jadwal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {viewingStudent.courseList.map((c, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                                    <td className="px-6 py-3 text-xs font-mono font-bold text-primary">{c.code}</td>
                                                    <td className="px-6 py-3 text-sm font-bold text-slate-800 dark:text-white">{c.name}</td>
                                                    <td className="px-6 py-3 text-sm font-bold text-slate-700 dark:text-white text-center">{c.sks}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                                                            c.type === 'Wajib' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                                        )}>
                                                            {c.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-xs text-slate-500 font-medium">{c.schedule}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        Belum ada daftar mata kuliah.
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            {viewingStudent.status === 'pending' && (
                                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => { handleApprove(viewingStudent.id); setViewingStudent(null); }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all active:scale-95 text-sm font-bold shadow-lg shadow-emerald-500/20"
                                    >
                                        <CheckCircle2 size={16} />
                                        Setujui KRS
                                    </button>
                                    <button
                                        onClick={() => { handleReject(viewingStudent.id); setViewingStudent(null); }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all active:scale-95 text-sm font-bold shadow-lg shadow-rose-500/20"
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
