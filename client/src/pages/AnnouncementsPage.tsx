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
    Star,
    X,
    Plus,
    Edit2,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Toast, { ToastType } from '../components/Toast';

interface Post {
    id: string;
    title: string;
    category: string;
    created_at: string;
    author: string;
    content: string;
    is_pinned?: boolean;
    image_url?: string;
}

const AnnouncementsPage: React.FC = () => {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'superadmin' || profile?.role === 'akademik';

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [announcements, setAnnouncements] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'Akademik',
        image_url: '',
        is_pinned: false
    });

    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (err: any) {
            console.error('Error fetching announcements:', err);
            showToast('Gagal memuat pengumuman', 'error');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleOpenModal = (post: Post | null = null) => {
        if (post) {
            setEditingPost(post);
            setFormData({
                title: post.title,
                content: post.content,
                category: post.category,
                image_url: post.image_url || '',
                is_pinned: post.is_pinned || false
            });
        } else {
            setEditingPost(null);
            setFormData({
                title: '',
                content: '',
                category: 'Akademik',
                image_url: '',
                is_pinned: false
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Hapus pengumuman ini?')) return;
        try {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) throw error;
            showToast('Pengumuman berhasil dihapus');
            fetchAnnouncements();
        } catch (err: any) {
            showToast(err.message, 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPost) {
                const { error } = await supabase
                    .from('announcements')
                    .update({ ...formData })
                    .eq('id', editingPost.id);
                if (error) throw error;
                showToast('Pengumuman diperbarui');
            } else {
                const { error } = await supabase
                    .from('announcements')
                    .insert([{ ...formData, author: profile?.full_name || 'Admin' }]);
                if (error) throw error;
                showToast('Pengumuman baru ditambahkan');
            }
            setIsModalOpen(false);
            fetchAnnouncements();
        } catch (err: any) {
            showToast(err.message, 'error');
        }
    };

    const filteredAnnouncements = announcements.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Semua' || post.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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
                    {isAdmin && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus size={18} />
                            Buat Pengumuman
                        </button>
                    )}
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
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none py-3 pl-10 pr-4 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary/20 transition-all font-sans"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Kategori</label>
                                <div className="space-y-2">
                                    {['Semua', 'Akademik', 'Keuangan', 'Event', 'Sistem'].map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                                                selectedCategory === cat
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {cat}
                                            <Tag size={12} className={cn("transition-opacity", selectedCategory === cat ? "opacity-100" : "opacity-40")} />
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
                        {filteredAnnouncements.map((post) => (
                            <motion.div
                                key={post.id}
                                layoutId={`post-${post.id}`}
                                whileHover={{ y: -5 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group relative"
                            >
                                {post.image_url && (
                                    <div className="h-40 w-full relative overflow-hidden" onClick={() => setSelectedPost(post)}>
                                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-lg text-[10px] font-black text-primary shadow-lg uppercase tracking-widest">{post.category}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="p-8 flex flex-col flex-1 font-sans">
                                    <div className="flex items-center justify-between mb-4">
                                        {!post.image_url && (
                                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">{post.category}</span>
                                        )}
                                        <div className="flex items-center gap-1">
                                            {post.is_pinned && <Pin size={14} className="text-amber-500 fill-amber-500 rotate-45 mr-2" />}
                                            {isAdmin && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(post)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-primary">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(post.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <h3
                                        onClick={() => setSelectedPost(post)}
                                        className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors cursor-pointer leading-snug mb-4"
                                    >
                                        {post.title}
                                    </h3>
                                    <p onClick={() => setSelectedPost(post)} className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1 mb-8 opacity-80 cursor-pointer">{post.content}</p>

                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all text-xs font-bold">
                                                {post.author?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{post.author}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">
                                                    {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedPost(post)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {filteredAnnouncements.length === 0 && (
                            <div className="md:col-span-2 py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                    <Search size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hasil tidak ditemukan</h3>
                                <p className="text-slate-500 text-sm max-w-xs">Tidak ada pengumuman yang sesuai dengan kata kunci atau kategori yang Anda pilih.</p>
                            </div>
                        )}
                    </div>

                    {filteredAnnouncements.length > 0 && (
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
                            <button className="text-sm font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2 group">
                                Muat Lebih Banyak Info
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] custom-scrollbar">
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-black uppercase tracking-tight">{editingPost ? 'Edit Pengumuman' : 'Buat Pengumuman'}</h2>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><X size={20} /></button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Judul Pengumuman</label>
                                        <input
                                            type="text" required value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold"
                                            placeholder="Masukkan judul..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kategori</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold"
                                            >
                                                {['Akademik', 'Keuangan', 'Event', 'Sistem'].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pin Konten?</label>
                                            <div className="flex h-[56px] items-center px-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                                <input
                                                    type="checkbox" checked={formData.is_pinned}
                                                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                                                    className="w-5 h-5 rounded-lg border-none bg-white dark:bg-slate-700 text-primary focus:ring-0"
                                                />
                                                <span className="ml-3 text-xs font-bold text-slate-600">Sematkan di atas</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">URL Gambar (Opsional)</label>
                                        <input
                                            type="text" value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Konten / Isi Pengumuman</label>
                                        <textarea
                                            rows={8} required value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-medium leading-relaxed"
                                            placeholder="Tuliskan detail pengumuman di sini..."
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95">
                                    {editingPost ? 'Update Informasi' : 'Terbitkan Pengumuman'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Post Detail Modal */}
            <AnimatePresence>
                {selectedPost && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPost(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            layoutId={`post-${selectedPost.id}`}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden font-sans"
                        >
                            {selectedPost.image_url && (
                                <div className="h-64 w-full">
                                    <img src={selectedPost.image_url} alt={selectedPost.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-8 md:p-12">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">{selectedPost.category}</span>
                                    <button
                                        onClick={() => setSelectedPost(null)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">{selectedPost.title}</h2>
                                <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white text-sm font-bold">
                                        {selectedPost.author?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{selectedPost.author}</p>
                                        <p className="text-xs text-slate-400 font-bold flex items-center gap-2">
                                            <Calendar size={12} /> {new Date(selectedPost.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedPost.content.split('\n').map((para, i) => (
                                        <p key={i}>{para}</p>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default AnnouncementsPage;
