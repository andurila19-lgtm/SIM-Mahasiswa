import React, { useState } from 'react';
import {
    ClipboardCheck,
    Calendar,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Clock,
    MapPin,
    User,
    ChevronRight,
    TrendingUp,
    Download,
    QrCode,
    Scan,
    ShieldCheck,
    Zap,
    ZapOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface AttendanceRecord {
    id: number;
    subject: string;
    lecturer: string;
    date: string;
    time: string;
    status: 'present' | 'absent' | 'late';
    meeting: number;
}

const AttendancePage: React.FC = () => {
    const [activeView, setActiveView] = useState('list');

    const mockAttendance: AttendanceRecord[] = [];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <ClipboardCheck size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Presensi Perkuliahan</h1>
                    <p className="text-slate-500 dark:text-slate-400">Pantau kehadiran Anda di setiap mata kuliah dan sesi pertemuan.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 group active:scale-95">
                        <QrCode size={18} className="group-hover:rotate-12 transition-transform" />
                        Scan QR Presensi
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kehadiran (IP)</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">0%</p>
                    </div>
                    <div className="absolute top-2 right-2 text-green-500 opacity-5 group-hover:opacity-10 transition-all duration-700">
                        <TrendingUp size={64} />
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hadir (Sesi)</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">0 Sesi</p>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Terlambat</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">0 Sesi</p>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alpa/Absen</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">0 Sesi</p>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filter Column */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 overflow-hidden">
                        <div className="flex items-center gap-3 mb-8 px-1">
                            <Filter size={18} className="text-slate-400" />
                            <h3 className="font-bold text-slate-800 dark:text-white">Filter Periode</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Mata Kuliah</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none py-3.5 px-4 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                    <option>Semua Mata Kuliah</option>
                                    <option>Pemrograman Web II</option>
                                    <option>Kecerdasan Buatan</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Tipe Pertemuan</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none py-3.5 px-4 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                    <option>Semua Sesi</option>
                                    <option>Luring (Offline)</option>
                                    <option>Daring (Online)</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-12 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-4 group cursor-pointer hover:bg-primary/10 transition-all active:scale-95 shadow-sm shadow-primary/5">
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                <Download size={20} />
                            </div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Unduh Laporan Absensi</p>
                        </div>
                    </div>
                </div>

                {/* History Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/10">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Riwayat Kehadiran Semester Ini</h3>
                                <p className="text-xs text-slate-500 font-medium">Rekap log presensi harian secara real-time.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari Mata Kuliah..."
                                        className="bg-slate-100 dark:bg-slate-800 border-none outline-none py-2.5 pl-10 pr-4 rounded-xl text-xs w-48 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {mockAttendance.map((item) => (
                                <div key={item.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                    <div className="flex items-center gap-8">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-sm",
                                            item.status === 'present' ? "bg-green-50 text-green-500 dark:bg-green-900/10" :
                                                item.status === 'late' ? "bg-amber-50 text-amber-500 dark:bg-amber-900/10" :
                                                    "bg-red-50 text-red-500 dark:bg-red-900/10"
                                        )}>
                                            {item.status === 'present' ? <CheckCircle2 size={24} /> :
                                                item.status === 'late' ? <Clock size={24} /> :
                                                    <XCircle size={24} />}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors text-base">{item.subject}</h4>
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black text-slate-400 transition-colors group-hover:bg-primary group-hover:text-white">Mtg {item.meeting}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                <span className="flex items-center gap-1.5"><User size={12} className="opacity-60" /> {item.lecturer}</span>
                                                <span className="flex items-center gap-1.5"><MapPin size={12} className="opacity-60" /> Lab Komp 02</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{item.date}</p>
                                            <p className="text-xs text-slate-400 font-medium italic opacity-60 tracking-tight">{item.time}</p>
                                        </div>
                                        <div className={cn(
                                            "px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest text-center shadow-sm w-32 border transition-all",
                                            item.status === 'present' ? "bg-green-500 text-white border-transparent" :
                                                item.status === 'late' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                    "bg-red-50 text-red-600 border-red-100"
                                        )}>
                                            {item.status === 'present' ? 'HADIR' : item.status === 'late' ? 'TERLAMBAT' : 'ALPA / ABSEN'}
                                        </div>
                                        <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/10">
                            <p className="text-slate-500 font-medium italic">Menampilkan riwayat 30 hari terakhir. <span className="not-italic font-bold text-primary cursor-pointer hover:underline uppercase tracking-tighter">Lihat Semua Kunjungan</span></p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">LEGEND:</span>
                                <span className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-600 rounded-lg scale-90 opacity-60 border border-green-100"><Zap size={10} /> Hadir</span>
                                <span className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg scale-90 opacity-60 border border-red-100"><ZapOff size={10} /> Ghoib</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
