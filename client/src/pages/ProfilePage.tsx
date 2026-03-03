import React, { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Shield,
    ShieldCheck,
    Settings,
    Save,
    ChevronRight,
    BookOpen,
    Lock,
    GraduationCap,
    Zap,
    ExternalLink,
    Layers,
    Star,
    Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Toast, { ToastType } from '../components/Toast';
import { Phone } from 'lucide-react';

const ProfilePage: React.FC = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('personal');
    const [stats, setStats] = useState({ ipk: '0.00', totalSks: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        avatar_url: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                avatar_url: profile.avatar_url || ''
            });
        }
    }, [profile]);

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const handleSave = async () => {
        if (!profile?.id) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    avatar_url: formData.avatar_url
                })
                .eq('id', profile.id);

            if (error) throw error;
            showToast('Profil berhasil diperbarui!');
        } catch (err: any) {
            console.error('Save Profile Error:', err);
            showToast('Gagal memperbarui profil: ' + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            if (!profile?.id || profile.role !== 'mahasiswa') return;
            try {
                // Assuming 'supabase' is imported or globally available
                // Fetch Approved KRS
                const { data: krsData } = await supabase
                    .from('student_krs')
                    .select('courses')
                    .eq('student_id', profile.id)
                    .eq('status', 'approved');

                const krsCourses = krsData?.[0]?.courses || [];
                const totalSks = krsCourses.reduce((s: number, c: any) => s + (c.sks || 0), 0);

                // Fetch Locked Grades
                const { data: grades } = await supabase
                    .from('student_grades')
                    .select('grade_letter, course_id')
                    .eq('student_id', profile.id)
                    .eq('is_locked', true);

                let ipk = '0.00';
                if (grades && grades.length > 0) {
                    const letterToPoint: Record<string, number> = {
                        'A': 4, 'A-': 3.75, 'B+': 3.5, 'B': 3, 'B-': 2.75,
                        'C+': 2.5, 'C': 2, 'D': 1, 'E': 0
                    };
                    let totalGradePoints = 0;
                    let totalGradedSks = 0;
                    grades.forEach(g => {
                        const course = krsCourses.find((c: any) => c.id === g.course_id);
                        if (course) {
                            const pts = letterToPoint[g.grade_letter] || 0;
                            totalGradePoints += pts * (course.sks || 0);
                            totalGradedSks += (course.sks || 0);
                        }
                    });
                    if (totalGradedSks > 0) ipk = (totalGradePoints / totalGradedSks).toFixed(2);
                }
                setStats({ ipk, totalSks });
            } catch (err) {
                console.error('Profile Stats Fetch Error:', err);
            }
        };
        fetchStats();
    }, [profile]);

    const studentInfo = [
        { label: 'NIM', value: profile?.nim_nip || '-' },
        { label: 'Fakultas', value: profile?.faculty || '-' },
        { label: 'Program Studi', value: profile?.study_program || '-' },
        { label: 'IP Kumulatif', value: stats.ipk },
        { label: 'SKS Lulus', value: stats.totalSks.toString() },
        { label: 'Semester', value: profile?.semester || '-' },
        { label: 'Tahun Masuk', value: profile?.batch_year || '-' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 font-sans">
            {/* Profil Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                {/* Banner Area */}
                <div className="h-48 bg-gradient-to-br from-primary to-blue-600 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-black/10 transition-colors group-hover:bg-black/20"></div>
                    {/* Abstract Header Shapes */}
                    <div className="absolute -top-1/4 -right-1/4 w-96 h-96 bg-white/10 blur-[80px] rounded-full rotate-45 transform transition-transform duration-1000 group-hover:scale-110"></div>
                    <div className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-blue-400/20 blur-[60px] rounded-full transform transition-transform duration-1000 group-hover:scale-125"></div>
                </div>

                {/* User Info & Avatar Section */}
                <div className="px-8 pb-8 flex flex-col md:flex-row items-end gap-8 -mt-16 md:mt-[-4rem] relative z-10">
                    <div className="relative group/avatar">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-2xl overflow-hidden relative border-4 border-white dark:border-slate-900 group-hover/avatar:scale-105 transition-transform duration-500">
                            <div className="w-full h-full rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-primary text-4xl font-bold">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profil" className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                    profile?.full_name?.charAt(0) || 'U'
                                )}
                            </div>
                            <button className="absolute inset-2 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-2xl">
                                <Camera size={24} />
                            </button>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 border-4 border-white dark:border-slate-900 rounded-2xl shadow-lg flex items-center justify-center text-white scale-0 group-hover/avatar:scale-100 transition-transform delay-150">
                            <ShieldCheck size={20} />
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 pt-10 md:pt-0">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{profile?.full_name || 'Memuat...'}</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
                                <GraduationCap size={16} className="text-primary/60" />
                                Mahasiswa Teknik Informatika • Semester 6
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:border-primary/20 transition-colors cursor-pointer group/pill shadow-sm">
                                <Shield size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                                {profile?.role?.replace('_', ' ').toUpperCase() || 'PENGGUNA'}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:border-primary/20 transition-colors cursor-pointer group/pill shadow-sm">
                                <Star size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                REGULER PAGI
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-xl text-xs font-bold shadow-sm transition-transform hover:scale-105 border border-emerald-500/20">
                                <ShieldCheck size={14} />
                                STATUS: AKTIF
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group/settings"
                        >
                            <Settings size={20} className="group-hover/settings:rotate-90 transition-transform duration-500" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bagian Pengaturan */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 overflow-hidden relative group">
                        <div className="space-y-1 relative z-10 px-2 py-4">
                            <button onClick={() => setActiveTab('personal')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'personal' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                <div className="flex items-center gap-3">
                                    <User size={18} />
                                    <span className="text-sm font-bold">Informasi Pribadi</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'personal' ? "translate-x-1" : "opacity-0")} />
                            </button>
                            <button onClick={() => setActiveTab('academic')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'academic' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                <div className="flex items-center gap-3">
                                    <BookOpen size={18} />
                                    <span className="text-sm font-bold">Detail Akademik</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'academic' ? "translate-x-1" : "opacity-0")} />
                            </button>
                            <button onClick={() => setActiveTab('security')} className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group", activeTab === 'security' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                <div className="flex items-center gap-3">
                                    <Lock size={18} />
                                    <span className="text-sm font-bold">Keamanan Akun</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform", activeTab === 'security' ? "translate-x-1" : "opacity-0")} />
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 -z-0"></div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/10 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Zap size={20} className="text-amber-500 fill-amber-500" />
                                Akun Tervalidasi
                            </h3>
                            <p className="text-slate-400 text-xs mb-8 leading-relaxed italic opacity-80 font-bold tracking-tight">Akun Anda telah terintegrasi dengan PDDIKTI dan Layanan Kemahasiswaan Nasional.</p>
                            <button className="text-blue-400 font-bold text-xs flex items-center gap-2 group/link">
                                Lihat Sertifikat Digital
                                <ExternalLink size={14} className="group-hover/link:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-all duration-700"></div>
                    </div>
                </div>

                {/* Bagian Konten Informasi */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'personal' && (
                            <motion.div
                                key="personal"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-10"
                            >
                                <div className="flex items-center gap-4 text-slate-800 dark:text-white">
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <User size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold">Data Pribadi Dasar</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nama Lengkap (Verifikasi)</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                value={formData.full_name}
                                                readOnly
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent outline-none py-3 pl-12 pr-4 rounded-xl text-sm font-medium opacity-70 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nomor Telepon</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                value={formData.phone || '-'}
                                                readOnly
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent outline-none py-3 pl-12 pr-4 rounded-xl text-sm font-medium opacity-70 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Kampus (Fixed)</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                            <input type="email" value={profile?.email || ''} readOnly className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent outline-none py-3 pl-12 pr-4 rounded-xl text-sm font-medium opacity-60 cursor-not-allowed" title="Email cannot be changed" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'academic' && (
                            <motion.div
                                key="academic"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-10"
                            >
                                <div className="flex items-center gap-4 text-slate-800 dark:text-white">
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <GraduationCap size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold">Detail Profil Akademik</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    {studentInfo.map((info) => (
                                        <div key={info.label} className="relative group">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{info.label}</p>
                                                <Layers size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 transition-all group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                <p className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{info.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-10"
                            >
                                <div className="flex items-center gap-4 text-slate-800 dark:text-white">
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <Lock size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold">Keamanan & Password</h3>
                                </div>

                                <div className="space-y-6 max-w-md">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Password Saat Ini</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary/20 outline-none py-3 pl-12 pr-4 rounded-xl text-sm font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Password Baru</label>
                                        <div className="relative group">
                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input type="password" placeholder="Minimal 8 karakter" className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary/20 outline-none py-3 pl-12 pr-4 rounded-xl text-sm font-medium" />
                                        </div>
                                    </div>
                                    <button className="px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-xl hover:opacity-90 transition-all text-sm">
                                        Update Password
                                    </button>
                                </div>

                                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold leading-relaxed">
                                        Perhatian: Mengganti password akan menyebabkan sesi login di perangkat lain terputus. Pastikan Anda mengingat password baru Anda.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSettingsOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                                        <Settings size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black">Pengaturan Akun</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">General Preferences</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
                                >
                                    <Layers size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:border-primary/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center"><Zap size={20} /></div>
                                        <div><p className="text-sm font-bold">Notifikasi Email</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Aktifkan update akademik</p></div>
                                    </div>
                                    <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                                        <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm"></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:border-primary/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center"><ShieldCheck size={20} /></div>
                                        <div><p className="text-sm font-bold">Dua Faktor Auth</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Keamanan tambahan</p></div>
                                    </div>
                                    <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative p-1 cursor-pointer">
                                        <div className="w-4 h-4 bg-white rounded-full absolute left-1 shadow-sm"></div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setIsSettingsOpen(false); setActiveTab('security'); }}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-slate-900/10"
                                >
                                    <Lock size={18} />
                                    Lanjut ke Keamanan Akun
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
        </div >
    );
};

export default ProfilePage;
