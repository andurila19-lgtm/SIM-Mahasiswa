import React, { useState } from 'react';
import {
    Bell,
    Search,
    Filter,
    Megaphone,
    Calendar,
    User,
    ChevronRight,
    MoreVertical,
    Pin,
    Tag,
    Clock,
    ExternalLink,
    Zap,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Post {
    id: number;
    title: string;
    category: string;
    date: string;
    author: string;
    content: string;
    isPinned?: boolean;
    image?: string;
}

const AnnouncementsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const mockAnnouncements: Post[] = [
        {
            id: 1,
            title: 'Pembayaran UKT Semester Genap 2023/2024',
            category: 'Keuangan',
            date: '2 Mar 2026',
            author: 'Bagian Keuangan',
            content: 'Informasi perpanjangan batas akhir pembayaran UKT mahasiswa reguler hingga 15 Maret 2026. Harap segera melakukan validasi di bank terkait.',
            isPinned: true,
            image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400'
        },
        {
            id: 2,
            title: 'Sosialisasi Program MBKM Angkatan 5 Tahap II',
            category: 'Akademik',
            date: '28 Feb 2026',
            author: 'Kemahasiswaan',
            content: 'Pendaftaran program Magang Merdeka dan Studi Independen bersertifikat telah dibuka. Segera lengkapi berkas administrasi Anda.',
            isPinned: true
        },
        {
            id: 3,
            title: 'Workshop Cyber Security & Penetration Testing',
            category: 'Hima',
            date: '25 Feb 2026',
            author: 'Hima IF',
            content: 'Himpunan Mahasiswa Informatika mengundang seluruh mahasiswa untuk hadir dalam workshop keamanan siber tingkat lanjut.'
        },
        {
            id: 4,
            title: 'Pemeliharaan Sistem Portal Akademik (Maintenance)',
            category: 'Sistem',
            date: '22 Feb 2026',
            author: 'Unit IT',
            content: 'Portal akan mengalami gangguan akses pada pukul 22:00 - 02:00 WIB untuk pemeliharaan rutin server database.'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                        <Megaphone size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Pusat Informasi</h1>
                    <p className="text-slate-500 dark:text-slate-400">Dapatkan pengumuman terbaru mengenai kegiatan akademik dan kampus.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        Tandai Selesai Baca
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filter Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 overflow-hidden">
                        <div className="flex items-center gap-3 mb-8 px-1">
                            <Filter size={18} className="text-slate-400" />
                            <h3 className="font-bold text-slate-800 dark:text-white">Filter Konten</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="relative">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari kata kunci..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none py-3 pl-10 pr-4 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary/20 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Kategori</label>
                                <div className="space-y-2">
                                    {['Semua', 'Akademik', 'Keuangan', 'Event', 'Sistem'].map((cat) => (
                                        <button key={cat} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                            {cat}
                                            <Tag size={12} className="opacity-40" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-400/10 to-amber-500/10 rounded-3xl p-8 border border-amber-500/10 flex items-start gap-4">
                        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shrink-0 shadow-sm border border-amber-500/10">
                            <Zap size={22} className="fill-amber-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-amber-700 dark:text-amber-500 mb-2">Urgent Informasi</h4>
                            <p className="text-xs text-amber-600/80 dark:text-amber-500/60 leading-relaxed font-medium italic tracking-tight">Cek email @kampus.ac.id secara berkala untuk pemberitahuan yang memerlukan tindakan cepat.</p>
                        </div>
                    </div>
                </div>

                {/* Board Area */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mockAnnouncements.map((post) => (
                            <motion.div
                                key={post.id}
                                whileHover={{ y: -5 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group cursor-pointer"
                            >
                                {post.image && (
                                    <div className="h-40 w-full relative overflow-hidden">
                                        <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-lg text-[10px] font-black text-primary shadow-lg uppercase tracking-widest">{post.category}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="p-8 flex flex-col flex-1">
                                    {!post.image && (
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">{post.category}</span>
                                            {post.isPinned && <Pin size={14} className="text-amber-500 fill-amber-500 rotate-45" />}
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors leading-snug mb-4">{post.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1 mb-8 opacity-80">{post.content}</p>

                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all text-xs font-bold">
                                                {post.author.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{post.author}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{post.date}</p>
                                            </div>
                                        </div>
                                        <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
                        <button className="text-sm font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2 group">
                            Muat Lebih Banyak Info
                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsPage;
