import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ForbiddenPage: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const roleLabels: Record<string, string> = {
        superadmin: 'Super Admin',
        mahasiswa: 'Mahasiswa',
        dosen: 'Dosen',
        akademik: 'Staff Akademik',
        keuangan: 'Staff Keuangan',
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full text-center"
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="w-28 h-28 mx-auto mb-8 bg-rose-500/10 rounded-[2rem] flex items-center justify-center relative"
                >
                    <ShieldX size={48} className="text-rose-500" />
                    <motion.div
                        initial={{ scale: 1, opacity: 0.4 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-[2rem] border-2 border-rose-500/30"
                    />
                </motion.div>

                {/* Text */}
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3">403</h1>
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4">
                    Akses Ditolak
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                    Halaman ini tidak dapat diakses dengan role Anda saat ini.
                </p>

                {profile && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8">
                        <Lock size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">
                            Role Anda: <span className="text-primary">{roleLabels[profile.role] || profile.role}</span>
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm"
                    >
                        <ArrowLeft size={18} />
                        Kembali
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
                    >
                        Ke Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ForbiddenPage;
