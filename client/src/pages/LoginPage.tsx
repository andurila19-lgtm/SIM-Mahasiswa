import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import { User, Lock, ArrowRight, Loader, Shield, GraduationCap, BookOpen, ClipboardCheck, CreditCard } from 'lucide-react';

interface DemoAccount {
    email: string;
    password: string;
    label: string;
    role: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
}

const demoAccounts: DemoAccount[] = [
    { email: 'superadmin@sim.ac.id', password: 'superadmin123', label: 'Super Admin', role: 'superadmin', icon: <Shield size={16} />, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-900/30' },
    { email: 'mahasiswa@sim.ac.id', password: 'mhs123', label: 'Mahasiswa', role: 'mahasiswa', icon: <GraduationCap size={16} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' },
    { email: 'dosen@sim.ac.id', password: 'dosen123', label: 'Dosen', role: 'dosen', icon: <BookOpen size={16} />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-900/30' },
    { email: 'akademik@sim.ac.id', password: 'akademik123', label: 'Staff Akademik', role: 'akademik', icon: <ClipboardCheck size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' },
    { email: 'keuangan@sim.ac.id', password: 'keuangan123', label: 'Keuangan', role: 'keuangan', icon: <CreditCard size={16} />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-900/30' },
];

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginAs, setLoginAs] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const savedEmail = Cookies.get('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e?: React.FormEvent, demoEmail?: string, demoPassword?: string) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        const loginEmail = demoEmail || email;
        const loginPassword = demoPassword || password;

        try {
            // Set persistence based on rememberMe
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

            await signInWithEmailAndPassword(auth, loginEmail, loginPassword);

            // Save or remove email from cookie
            if (rememberMe) {
                Cookies.set('rememberedEmail', loginEmail, { expires: 30 }); // 30 days
            } else {
                Cookies.remove('rememberedEmail');
            }

            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('Akun belum terdaftar. Jalankan script pembuatan demo user terlebih dahulu.');
            } else {
                setError('Email atau password salah. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
            setLoginAs('');
        }
    };

    const handleDemoLogin = (account: DemoAccount) => {
        setLoginAs(account.role);
        setEmail(account.email);
        setPassword(account.password);
        handleLogin(undefined, account.email, account.password);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full"></div>
                <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl p-8 md:p-10 overflow-hidden relative"
            >
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 10-10-5L2 10l10 5 10-5Z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /><path d="M11 21v-4a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v4" /></svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">SIM CEPAT</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Sistem Informasi Manajemen Akademik Terpadu</p>
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, height: 0 }}
                            animate={{ opacity: 1, scale: 1, height: 'auto' }}
                            exit={{ opacity: 0, scale: 0.95, height: 0 }}
                            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm rounded-xl text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                <User size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl py-3.5 pl-12 pr-4 outline-none transition-all dark:text-white text-sm"
                                placeholder="nama@kampus.ac.id"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                            <a href="#" className="text-xs font-semibold text-primary hover:underline">Lupa password?</a>
                        </div>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl py-3.5 pl-12 pr-4 outline-none transition-all dark:text-white text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-md transition-all peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/50"></div>
                                <svg
                                    className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity left-[3px] pointer-events-none"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Ingat Saya</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 mt-2"
                    >
                        {loading && !loginAs ? (
                            <Loader className="animate-spin" size={20} />
                        ) : (
                            <>
                                <span>Masuk Sekarang</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>


                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400">
                        Butuh bantuan akses? <a href="#" className="text-primary font-bold hover:underline">Kontak Admin</a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
