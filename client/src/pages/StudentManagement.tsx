import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Plus,
    Mail,
    Edit2,
    Trash2,
    CheckCircle2,
    Clock,
    XCircle,
    FileText
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ACADEMIC_DATA } from '../config/academicData';
import Toast, { ToastType } from '../components/Toast';
import { DataTable } from '../components/DataTable';
import { logAction } from '../lib/auditLogger';
import { useAuth } from '../context/AuthContext';

interface Student {
    id: string;
    full_name: string;
    nim_nip: string;
    email: string;
    role: string;
    status: 'active' | 'inactive' | 'pending' | 'cuti';
    faculty: string;
    study_program: string;
    semester: number;
    class_name: string;
    avatar_url?: string;
}

const StudentManagement: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'mahasiswa')
                .is('deleted_at', null) // Soft delete check
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setStudents(data as Student[]);
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedStudent || !profile) return;

        try {
            // Soft delete instead of hard delete
            const { error } = await supabase
                .from('profiles')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', selectedStudent.id);

            if (error) throw error;

            await logAction(
                profile.id,
                profile.role,
                'DELETE_USER',
                'Mahasiswa',
                selectedStudent.id,
                selectedStudent,
                { deleted: true }
            );

            setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
            setIsDeleteModalOpen(false);
            showToast('Data mahasiswa berhasil dihapus (Soft Delete)');
        } catch (err: any) {
            console.error('Error deleting student:', err);
            showToast(`Gagal menghapus: ${err.message}`, 'error');
        } finally {
            setSelectedStudent(null);
        }
    };

    const [formData, setFormData] = useState({
        full_name: '',
        nim_nip: '',
        email: '',
        status: 'active' as any,
        faculty: '',
        study_program: '',
        semester: 1,
        class_name: 'A'
    });

    useEffect(() => {
        if (selectedStudent) {
            setFormData({
                full_name: selectedStudent.full_name || '',
                nim_nip: selectedStudent.nim_nip || '',
                email: selectedStudent.email || '',
                status: selectedStudent.status || 'active',
                faculty: selectedStudent.faculty || '',
                study_program: selectedStudent.study_program || '',
                semester: selectedStudent.semester || 1,
                class_name: selectedStudent.class_name || 'A'
            });
        } else {
            setFormData({
                full_name: '',
                nim_nip: '',
                email: '',
                status: 'active',
                faculty: '',
                study_program: '',
                semester: 1,
                class_name: 'A'
            });
        }
    }, [selectedStudent, isAddModalOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.full_name || !formData.nim_nip || !profile) return;

        setLoading(true);
        try {
            if (selectedStudent) {
                const { error } = await supabase
                    .from('profiles')
                    .update(formData)
                    .eq('id', selectedStudent.id);

                if (error) throw error;

                await logAction(profile.id, profile.role, 'UPDATE_USER', 'Mahasiswa', selectedStudent.id, selectedStudent, formData);
                showToast('Data mahasiswa diperbarui!');
            } else {
                const newId = crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9);
                const newData = { ...formData, id: newId, role: 'mahasiswa' };
                const { error } = await supabase.from('profiles').insert([newData]);
                if (error) throw error;

                await logAction(profile.id, profile.role, 'CREATE_USER', 'Mahasiswa', newId, null, newData);
                showToast('Mahasiswa baru ditambahkan!');
            }
            setIsAddModalOpen(false);
            fetchStudents();
        } catch (err: any) {
            showToast('Terjadi kesalahan: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: 'Mahasiswa',
            accessorKey: (s: Student) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {s.full_name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 dark:text-white">{s.full_name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">NIM: {s.nim_nip}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Fakultas / Prodi',
            accessorKey: (s: Student) => (
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.faculty}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{s.study_program}</span>
                </div>
            )
        },
        {
            header: 'Smt / Kelas',
            accessorKey: (s: Student) => (
                <div className="flex flex-col">
                    <span className="text-sm font-bold">Sem {s.semester}</span>
                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg w-fit mt-1">Kelas {s.class_name}</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessorKey: (s: Student) => (
                <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
                    s.status === 'active' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" :
                        s.status === 'cuti' ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10" :
                            "bg-red-50 text-red-600 dark:bg-red-500/10"
                )}>
                    {s.status === 'active' ? <CheckCircle2 size={12} /> : s.status === 'cuti' ? <Clock size={12} /> : <XCircle size={12} />}
                    {s.status}
                </div>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right no-print',
            accessorKey: (s: Student) => (
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => navigate('/krs', { state: { student: s } })} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all" title="Kelola KRS">
                        <FileText size={18} />
                    </button>
                    <button onClick={() => { setSelectedStudent(s); setIsAddModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                        <Edit2 size={18} />
                    </button>
                    <button onClick={() => { setSelectedStudent(s); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <DataTable
                title="Manajemen Mahasiswa"
                description={`Total ${students.length} Mahasiswa terdaftar dalam sistem.`}
                icon={Users}
                data={students}
                columns={columns as any}
                pageSize={10}
                searchPlaceholder="Cari mahasiswa by nama atau NIM..."
                exportFileName="Data_Mahasiswa"
                actions={
                    <button
                        onClick={() => { setSelectedStudent(null); setIsAddModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all transform active:scale-95"
                    >
                        <Plus size={18} /> Tambah
                    </button>
                }
            />

            {/* Modal: Add/Edit */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-xl font-bold dark:text-white">{selectedStudent ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                    <XCircle size={20} className="text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nama Lengkap</label>
                                    <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">NIM</label>
                                        <input type="text" value={formData.nim_nip} onChange={e => setFormData({ ...formData, nim_nip: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Fakultas</label>
                                        <select value={formData.faculty} onChange={e => setFormData({ ...formData, faculty: e.target.value, study_program: ACADEMIC_DATA[e.target.value as keyof typeof ACADEMIC_DATA]?.[0] || '' })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm">
                                            <option value="">Pilih Fakultas</option>
                                            {Object.keys(ACADEMIC_DATA).map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Prodi</label>
                                        <select value={formData.study_program} onChange={e => setFormData({ ...formData, study_program: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm">
                                            {formData.faculty && ACADEMIC_DATA[formData.faculty as keyof typeof ACADEMIC_DATA]?.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Semester</label>
                                        <input type="number" value={formData.semester} onChange={e => setFormData({ ...formData, semester: parseInt(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Kelas</label>
                                        <input type="text" value={formData.class_name} onChange={e => setFormData({ ...formData, class_name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-bold text-sm" />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
                                    {loading ? 'Memproses...' : 'Simpan Perubahan'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Delete Confirm */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative z-10 text-center">
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-xl font-bold dark:text-white mb-2">Hapus Mahasiswa?</h3>
                            <p className="text-slate-500 text-sm mb-8">Data <b>{selectedStudent?.full_name}</b> akan dihapus menggunakan sistem Soft Delete.</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all">Batal</button>
                                <button onClick={handleDelete} className="py-3.5 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all">Ya, Hapus</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default StudentManagement;
