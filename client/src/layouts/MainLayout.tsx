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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['super_admin', 'lecturer', 'student'] },
        { name: 'Mahasiswa', icon: Users, path: '/students', roles: ['super_admin', 'lecturer'] },
        { name: 'Dosen', icon: Users, path: '/lecturers', roles: ['super_admin'] },
        { name: 'Daftar Matkul', icon: BookOpen, path: '/courses', roles: ['lecturer'] },
        { name: 'KRS', icon: BookOpen, path: '/krs', roles: ['super_admin', 'lecturer', 'student'] },
        { name: 'Verifikasi KRS', icon: ClipboardCheck, path: '/krs-verification', roles: ['lecturer'] },
        { name: 'Akademik', icon: School, path: '/academic', roles: ['super_admin', 'lecturer', 'student'] },
        { name: 'Penilaian', icon: GraduationCap, path: '/grades', roles: ['super_admin', 'lecturer', 'student'] },
        { name: 'Presensi', icon: ClipboardCheck, path: '/attendance', roles: ['super_admin', 'lecturer', 'student'] },
        { name: 'Pembayaran', icon: CreditCard, path: '/payments', roles: ['super_admin', 'student'] },
        { name: 'Pengumuman', icon: Bell, path: '/announcements', roles: ['super_admin', 'lecturer', 'student'] },
    ];

    const filteredNavItems = navItems.filter(item =>
        !profile || item.roles.includes(profile.role)
    );

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 260 : 80 }}
                className="relative bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 shadow-sm no-print"
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <School size={24} />
                    </div>
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="font-bold text-lg dark:text-white truncate"
                            >
                                SIM Mahasiswa
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-4 px-3 py-3 rounded-lg transition-all group",
                                isActive
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
                            )}
                        >
                            <item.icon size={22} className="shrink-0" />
                            <AnimatePresence>
                                {isSidebarOpen && (
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
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{profile?.full_name || 'Loading...'}</p>
                                    <p className="text-xs text-slate-500 truncate capitalize">{profile?.role || 'User'}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-40 no-print">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold dark:text-white">Portal Akademik</h2>
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
                <div className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
