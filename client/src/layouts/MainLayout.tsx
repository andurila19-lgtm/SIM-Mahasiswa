import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    GraduationCap,
    ClipboardCheck,
    CreditCard,
    Bell,
    LogOut,
    Menu,
    X,
    School
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout: React.FC = () => {
    const { profile, signOut } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed for mobile
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['superadmin', 'mahasiswa', 'dosen', 'akademik', 'keuangan'] },

        // Superadmin & Akademik
        { name: 'Manajemen Mahasiswa', icon: Users, path: '/students', roles: ['superadmin', 'akademik'] },
        { name: 'Manajemen Dosen', icon: Users, path: '/lecturers', roles: ['superadmin'] },
        { name: 'Sistem Akademik', icon: School, path: '/academic', roles: ['superadmin', 'akademik'] },
        { name: 'Verifikasi KRS', icon: ClipboardCheck, path: '/krs-verification', roles: ['superadmin', 'akademik'] },

        // Dosen
        { name: 'Kelas Saya', icon: BookOpen, path: '/my-classes', roles: ['dosen'] },
        { name: 'Input Nilai', icon: GraduationCap, path: '/input-grades', roles: ['dosen'] },

        // Mahasiswa
        { name: 'KRS Online', icon: BookOpen, path: '/krs', roles: ['mahasiswa', 'superadmin'] },
        { name: 'Kurikulum', icon: School, path: '/curriculum', roles: ['superadmin', 'akademik'] },

        // Keuangan
        { name: 'Tagihan & SPP', icon: CreditCard, path: '/payments', roles: ['mahasiswa', 'keuangan'] },
        { name: 'Verifikasi Bayar', icon: ClipboardCheck, path: '/payment-verification', roles: ['superadmin', 'keuangan'] },

        // Universal
        { name: 'Pengumuman', icon: Bell, path: '/announcements', roles: ['superadmin', 'dosen', 'akademik', 'keuangan'] },
    ];

    const filteredNavItems = navItems.filter(item =>
        !profile || item.roles.includes(profile.role)
    );

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Desktop & Mobile Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isDesktopSidebarOpen ? 260 : 80,
                }}
                className={cn(
                    "fixed md:relative inset-y-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-[70] shadow-2xl md:shadow-none transition-transform duration-300 no-print overflow-hidden",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center justify-between gap-3 min-h-[80px]">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                            <School size={24} />
                        </div>
                        <AnimatePresence>
                            {isDesktopSidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="font-bold text-lg dark:text-white truncate"
                                >
                                    SIM CEPAT
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Desktop Toggle Button - Moved to Top */}
                    <button
                        onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                        className="hidden lg:flex items-center justify-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all hover:text-primary"
                    >
                        {isDesktopSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)} // Close on click for mobile
                            className={({ isActive }) => cn(
                                "flex items-center gap-4 px-3 py-3 rounded-lg transition-all group",
                                isActive
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
                            )}
                        >
                            <item.icon size={22} className="shrink-0" />
                            <AnimatePresence>
                                {(isDesktopSidebarOpen || isSidebarOpen) && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="font-medium whitespace-nowrap"
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </NavLink>
                    ))}
                </nav>

                {/* User Info & Toggle */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold bg-slate-100 dark:bg-slate-800">
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        <AnimatePresence>
                            {(isDesktopSidebarOpen || isSidebarOpen) && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{profile?.full_name || 'Memuat...'}</p>
                                    <p className="text-xs text-slate-500 truncate capitalize">{
                                        profile?.role === 'superadmin' ? 'Super Admin' :
                                            profile?.role === 'mahasiswa' ? 'Mahasiswa' :
                                                profile?.role === 'dosen' ? 'Dosen' :
                                                    profile?.role === 'akademik' ? 'Staff Akademik' :
                                                        profile?.role === 'keuangan' ? 'Staff Keuangan' :
                                                            profile?.role || 'User'
                                    }</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-16 md:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 z-40 no-print">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-lg md:text-xl font-bold dark:text-white truncate max-w-[150px] md:max-w-none">SIM CEPAT</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="text-sm font-medium">Keluar</span>
                        </button>
                    </div>
                </header>

                {/* Main Content scrollable */}
                <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
