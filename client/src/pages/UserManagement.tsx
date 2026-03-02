import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserCog,
    Search,
    Filter,
    Mail,
    Shield,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Edit2,
    Trash2,
    X,
    UserPlus,
    Key,
    Lock,
    Eye,
    EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import Toast, { ToastType } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
    nim_nip: string;
    created_at: string;
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    // Toast state
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // Restored
    const [isDeleting, setIsDeleting] = useState(false); // Restored
    const [newPassword, setNewPassword] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isProcessingReset, setIsProcessingReset] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({}); // Added state for visibility
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'mahasiswa',
        status: 'active',
        nim_nip: ''
    });

    const { user: currentUserAuth } = useAuth(); // Get current logged in user for auth token

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setUsers(data as UserProfile[]);
        } catch (err: any) {
            console.error('Error:', err);
            showToast('Gagal memuat data user: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user: UserProfile | null = null) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                role: user.role || 'mahasiswa',
                status: user.status || 'active',
                nim_nip: user.nim_nip || ''
            });
        } else {
            setSelectedUser(null);
            setFormData({
                full_name: '',
                email: '',
                role: 'mahasiswa',
                status: 'active',
                nim_nip: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus user ini?')) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('User berhasil dihapus');
            fetchUsers();
        } catch (err: any) {
            showToast('Gagal menghapus user: ' + err.message, 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (selectedUser) {
                // Update
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.full_name,
                        role: formData.role,
                        status: formData.status,
                        nim_nip: formData.nim_nip
                    })
                    .eq('id', selectedUser.id);

                if (error) throw error;
                showToast('Profil user berhasil diperbarui');
            } else {
                // Insert (Mocking user creation in profiles)
                // In production, this would involve creating a Firebase Auth user first
                const { error } = await supabase
                    .from('profiles')
                    .insert([{
                        ...formData,
                        id: crypto.randomUUID(), // Temporarily random UUID for mock
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
                showToast('User baru berhasil ditambahkan ke database manual');
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            showToast('Gagal memproses data: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !newPassword) return;

        setIsProcessingReset(true);
        try {
            const token = await currentUserAuth?.getIdToken();
            const response = await fetch('http://localhost:5000/api/admin/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    uid: selectedUser.id,
                    newPassword: newPassword
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Gagal reset password');

            showToast('Password user berhasil diperbarui');
            setIsPasswordModalOpen(false);
            setNewPassword('');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsProcessingReset(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const togglePasswordVisibility = (userId: string) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const getPasswordPreview = (user: UserProfile) => {
        const demoPasswords: Record<string, string> = {
            'superadmin@sim.ac.id': 'superadmin123',
            'mahasiswa@sim.ac.id': 'mhs123',
            'dosen@sim.ac.id': 'dosen123',
            'akademik@sim.ac.id': 'akademik123',
            'keuangan@sim.ac.id': 'keuangan123'
        };
        return demoPasswords[user.email] || user.nim_nip || '••••••••';
    };

    const getRoleBadge = (role: string) => {
        const styles = {
            superadmin: 'bg-red-50 text-red-600 border-red-100',
            akademik: 'bg-blue-50 text-blue-600 border-blue-100',
            keuangan: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            dosen: 'bg-purple-50 text-purple-600 border-purple-100',
            mahasiswa: 'bg-slate-50 text-slate-600 border-slate-100',
        }[role] || 'bg-slate-50 text-slate-600 border-slate-100';

        return (
            <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", styles)}>
                {role}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                            <UserCog size={28} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manajemen User & Role</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Total {users.length} pengguna terdaftar dengan berbagai aksesibilitas.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => handleOpenModal()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all transform active:scale-95"
                    >
                        <UserPlus size={18} />
                        Tambah Admin/Staff
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-4 pl-14 pr-12 rounded-2xl text-slate-700 dark:text-slate-200 focus:border-primary/50 transition-all font-medium"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-4 pl-14 pr-10 rounded-2xl text-slate-700 dark:text-slate-200 focus:border-primary/50 transition-all font-bold cursor-pointer"
                    >
                        <option value="all">Semua Role</option>
                        <option value="superadmin">Super Admin</option>
                        <option value="akademik">Akademik</option>
                        <option value="keuangan">Keuangan</option>
                        <option value="dosen">Dosen</option>
                        <option value="mahasiswa">Mahasiswa</option>
                    </select>
                </div>
            </div>

            {/* User List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Pengguna</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Role & Akses</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Password</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Dibuat Pada</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading && !isModalOpen ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="p-6"><div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-bold text-lg">
                                                    {user.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white uppercase tracking-tight">{user.full_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                        <Mail size={12} /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <Shield size={16} className="text-slate-400" />
                                                {getRoleBadge(user.role)}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/50 w-fit">
                                                <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 min-w-[70px]">
                                                    {visiblePasswords[user.id] ? getPasswordPreview(user) : '••••••••'}
                                                </span>
                                                <button
                                                    onClick={() => togglePasswordVisibility(user.id)}
                                                    className="p-1 hover:text-primary transition-colors text-slate-400"
                                                    title={visiblePasswords[user.id] ? "Sembunyikan" : "Lihat Password"}
                                                >
                                                    {visiblePasswords[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
                                                user.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                            )}>
                                                {user.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {user.status || 'active'}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 lg:group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsPasswordModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                                    title="Reset Password"
                                                >
                                                    <Key size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(user)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Hapus User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                                            <UserCog size={32} />
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">User tidak ditemukan</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Reset Password */}
            <AnimatePresence>
                {isPasswordModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPasswordModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                                            <Lock size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Reset Password</h2>
                                            <p className="text-xs text-slate-500 font-medium">Reset password untuk: <span className="text-slate-900 dark:text-white font-bold">{selectedUser?.full_name}</span></p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsPasswordModalOpen(false)}
                                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"
                                    >
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleResetPassword} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password Baru</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none p-4 rounded-2xl text-slate-900 dark:text-white font-bold"
                                            placeholder="••••••••"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1 italic">*Minimal 6 karakter</p>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isProcessingReset}
                                            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isProcessingReset ? 'Mereset...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Add/Edit */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            {selectedUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
                                        </h2>
                                        <p className="text-sm text-slate-500 font-medium">Lengkapi informasi profile di bawah ini.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"
                                    >
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none p-4 rounded-2xl text-slate-900 dark:text-white font-bold placeholder:text-slate-300"
                                            placeholder="Ex: John Doe"
                                        />
                                    </div>

                                    {!selectedUser && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none p-4 rounded-2xl text-slate-900 dark:text-white font-bold placeholder:text-slate-300"
                                                placeholder="john@campus.id"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Role Akun</label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none p-4 rounded-2xl text-slate-900 dark:text-white font-bold"
                                            >
                                                <option value="superadmin">Super Admin</option>
                                                <option value="akademik">Akademik</option>
                                                <option value="keuangan">Keuangan</option>
                                                <option value="dosen">Dosen</option>
                                                <option value="mahasiswa">Mahasiswa</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none p-4 rounded-2xl text-slate-900 dark:text-white font-bold"
                                            >
                                                <option value="active">Aktif</option>
                                                <option value="inactive">Non-Aktif</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? 'Memproses...' : (selectedUser ? 'Simpan Perubahan' : 'Tambah User')}
                                        </button>
                                    </div>
                                </form>
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

export default UserManagement;

