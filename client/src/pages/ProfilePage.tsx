import React, { useState } from 'react';
import {
    User,
    Settings,
    MapPin,
    Mail,
    Phone,
    Shield,
    BookOpen,
    Clock,
    Camera,
    Save,
    ChevronRight,
    ShieldCheck,
    Zap,
    Star,
    ExternalLink,
    Lock,
    GraduationCap,
    Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('personal');

    const studentInfo = [
        { label: 'NIM', value: profile?.nim_nip || '2105001' },
        { label: 'Fakultas', value: 'Teknik' },
        { label: 'Program Studi', value: 'Teknik Informatika' },
        { label: 'Jenjang', value: 'S1 Reguler' },
        { label: 'Semester', value: '6' },
        { label: 'Tahun Masuk', value: '2021' },
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
                        <button className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                            <Settings size={20} />
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                            <Save size={18} />
                            Simpan Perubahan
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
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nama Lengkap</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                            <input type="text" value={profile?.full_name || ''} disabled className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none py-3 pl-12 pr-4 rounded-xl text-sm font-medium opacity-70" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Kampus</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                            <input type="email" value={profile?.email || ''} readOnly className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary/20 outline-none py-3 pl-12 pr-4 rounded-xl text-sm font-medium" />
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
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
