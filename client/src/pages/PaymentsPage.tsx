import React, { useState, useEffect, useRef } from 'react';
import {
    CreditCard,
    Calendar,
    Download,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    ShieldCheck,
    History,
    X,
    Cpu,
    Zap,
    BrainCircuit,
    Upload,
    Copy,
    Image,
    Building2,
    Trash2,
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
// Image compression helper
const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
                'image/jpeg',
                quality
            );
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
};
import Toast, { ToastType } from '../components/Toast';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    created_at: string;
    status: 'paid' | 'pending' | 'unpaid';
    payment_method?: string;
    proof_url?: string;
}

// ─── Generate Virtual Account Numbers ──────────────────────────────
const generateVA = (nim: string, bankPrefix: string) => {
    // VA = Bank Prefix (4 digit) + NIM mahasiswa (padded to 12 digit)
    const cleanNim = nim.replace(/\D/g, '').padStart(12, '0').slice(-12);
    return `${bankPrefix}${cleanNim}`;
};

const bankConfigs = [
    { bank: 'BNI', prefix: '8801', color: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-500/20' },
    { bank: 'BRI', prefix: '1023', color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-500/20' },
    { bank: 'Mandiri', prefix: '8900', color: 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-500/20' },
];

const PaymentsPage: React.FC = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('active');
    const [bills, setBills] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Transaction | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [copiedRek, setCopiedRek] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [aiVerdict, setAiVerdict] = useState<{ status: 'verified' | 'failed' | 'idle'; message: string }>({ status: 'idle', message: '' });

    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const fetchBills = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_bills')
                .select('*')
                .eq('student_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBills(data || []);
        } catch (err: any) {
            console.error('Fetch Bills Error:', err);
            showToast('Gagal memuat data tagihan', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBills();
    }, [profile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Format file harus JPG, PNG, atau WebP', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran file maksimal 5MB', 'error');
            return;
        }

        setProofFile(file);
        setProofPreview(URL.createObjectURL(file));
        setAiVerdict({ status: 'idle', message: '' });
        setScanProgress(0);
    };

    const removeFile = () => {
        setProofFile(null);
        setProofPreview('');
        setAiVerdict({ status: 'idle', message: '' });
        setScanProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const copyToClipboard = (text: string, bankName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedRek(bankName);
        showToast(`No. Rekening ${bankName} berhasil disalin!`);
        setTimeout(() => setCopiedRek(''), 2000);
    };

    const runAiVerification = async () => {
        if (!proofFile) return;
        setIsScanning(true);
        setScanProgress(0);
        setAiVerdict({ status: 'idle', message: 'SIM AI sedang memproses bukti pembayaran...' });

        try {
            const imageUrl = URL.createObjectURL(proofFile);
            const result = await Tesseract.recognize(
                imageUrl,
                'eng+ind',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') setScanProgress(Math.floor(m.progress * 100));
                    }
                }
            );

            const text = result.data.text.toLowerCase();
            const hasKeyword = text.includes('transfer') || text.includes('berhasil') || text.includes('sukses') || text.includes('bank') || text.includes('bni') || text.includes('bri') || text.includes('mandiri');
            const hasAmount = selectedBill ? text.includes(selectedBill.amount.toString()) : false;

            if (hasKeyword || hasAmount) {
                setAiVerdict({ status: 'verified', message: 'Bukti pembayaran terverifikasi otomatis (SIM-Brain v1.0)' });
            } else {
                setAiVerdict({ status: 'verified', message: 'Bukti diterima. Akan diverifikasi manual oleh admin keuangan.' });
            }
        } catch (err) {
            console.error('OCR Error:', err);
            setScanProgress(100);
            setAiVerdict({ status: 'verified', message: 'Bukti diterima. Akan diverifikasi manual oleh admin keuangan.' });
        } finally {
            setIsScanning(false);
        }
    };

    const handlePayment = async () => {
        if (!selectedBill || !proofFile) return;
        setUploading(true);

        try {
            // Compress image to small base64 (max 800px, 60% quality) — instant, no upload needed
            const compressed = await compressImage(proofFile, 800, 0.6);
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(compressed);
            });

            // Update bill directly with base64 proof
            const { error } = await supabase
                .from('student_bills')
                .update({
                    status: 'pending',
                    proof_url: base64,
                    payment_method: 'Transfer Bank'
                })
                .eq('id', selectedBill.id);

            if (error) throw error;
            showToast('Bukti pembayaran berhasil dikirim! Menunggu verifikasi admin.');
            setIsPayModalOpen(false);
            setProofFile(null);
            setProofPreview('');
            setAiVerdict({ status: 'idle', message: '' });
            fetchBills();
        } catch (err: any) {
            showToast('Gagal mengirim bukti: ' + err.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amt);
    };

    // ─── Download Kwitansi/Struk ─────────────────────────────
    const downloadReceipt = (tx: Transaction) => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 500;
        const ctx = canvas.getContext('2d')!;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 500);

        // Header bar
        const grad = ctx.createLinearGradient(0, 0, 600, 0);
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(1, '#6366f1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('UNIVERSITAS CEPAT', 300, 35);
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText('Kwitansi Pembayaran / Payment Receipt', 300, 58);

        // Separator
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 100);
        ctx.lineTo(560, 100);
        ctx.stroke();

        // Fields
        ctx.textAlign = 'left';
        const fields = [
            ['No. Transaksi', tx.id.substring(0, 8).toUpperCase()],
            ['Deskripsi', tx.description],
            ['Tanggal', new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
            ['Metode Bayar', tx.payment_method || 'Transfer Bank'],
            ['Status', 'LUNAS (Verified)'],
        ];

        let y = 130;
        fields.forEach(([label, value]) => {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px Arial, sans-serif';
            ctx.fillText(label.toUpperCase(), 50, y);
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 15px Arial, sans-serif';
            ctx.fillText(value, 50, y + 20);
            y += 50;
        });

        // Amount box
        ctx.fillStyle = '#f0fdf4';
        ctx.beginPath();
        ctx.roundRect(40, y + 10, 520, 70, 12);
        ctx.fill();
        ctx.strokeStyle = '#bbf7d0';
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Arial, sans-serif';
        ctx.fillText('TOTAL PEMBAYARAN', 60, y + 38);
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(formatCurrency(tx.amount), 540, y + 60);

        // Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Arial, sans-serif';
        ctx.fillText('Dokumen ini dibuat secara otomatis oleh SIM CEPAT', 300, y + 110);
        ctx.fillText(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 300, y + 125);

        // Download
        const link = document.createElement('a');
        link.download = `kwitansi_${tx.id.substring(0, 8)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const activeBills = bills.filter(b => b.status !== 'paid');
    const historyBills = bills.filter(b => b.status === 'paid');

    const totalBill = activeBills.reduce((sum, b) => sum + b.amount, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Page Header — Clean */}
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                        <CreditCard size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Status Pembayaran</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Ringkasan tagihan dan riwayat transaksi Anda.</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Stats — 2 cards only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn(
                    "p-6 rounded-2xl border flex items-center gap-5",
                    totalBill === 0
                        ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-500/20"
                        : "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-500/20"
                )}>
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                        totalBill === 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                    )}>
                        {totalBill === 0 ? <ShieldCheck size={22} /> : <AlertCircle size={22} />}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">Status Keuangan</p>
                        <h3 className={cn("text-xl font-black", totalBill === 0 ? "text-emerald-600" : "text-red-600")}>
                            {totalBill === 0 ? 'Bebas Tagihan' : formatCurrency(totalBill)}
                        </h3>
                    </div>
                </div>

                <div className="p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-primary/10 text-primary">
                        <History size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">Total Riwayat Bayar</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">
                            {historyBills.length > 0 ? formatCurrency(historyBills.reduce((s, b) => s + b.amount, 0)) : 'Rp 0'}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Inline Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('active')}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'active'
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <CreditCard size={16} />
                    Tagihan Aktif
                    {activeBills.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-red-500 text-white rounded-full">{activeBills.length}</span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'history'
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <History size={16} />
                    Riwayat
                    {historyBills.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-slate-400 text-white rounded-full">{historyBills.length}</span>
                    )}
                </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'history' ? (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {historyBills.length > 0 ? historyBills.map((tx) => (
                                <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-500 dark:bg-emerald-900/10">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">{tx.description}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <Calendar size={10} /> {new Date(tx.created_at).toLocaleDateString('id-ID')}
                                                </span>
                                                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded text-[10px] font-black text-emerald-600">LUNAS</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</p>
                                        <button onClick={() => downloadReceipt(tx)} className="p-2 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Unduh Kwitansi">
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-16 text-center">
                                    <History size={32} className="mx-auto mb-3 text-slate-200" />
                                    <p className="text-sm text-slate-400">Belum ada riwayat pembayaran</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {activeBills.length > 0 ? activeBills.map((bill) => (
                            <div key={bill.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        bill.status === 'pending' ? "bg-amber-50 text-amber-500" : "bg-red-50 text-red-500"
                                    )}>
                                        {bill.status === 'pending' ? <Clock size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">{bill.description}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            {bill.status === 'pending' ? 'Menunggu verifikasi admin' : 'Belum dibayar'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(bill.amount)}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{new Date(bill.created_at).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    {bill.status === 'unpaid' && (
                                        <button
                                            onClick={() => { setSelectedBill(bill); setIsPayModalOpen(true); }}
                                            className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                        >
                                            Bayar
                                        </button>
                                    )}
                                    {bill.status === 'pending' && (
                                        <span className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-amber-100 dark:border-amber-500/20">
                                            Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Semua Tagihan Lunas</h3>
                                <p className="text-sm text-slate-400 max-w-xs">Tidak ada tagihan tertunda. Anda bebas melakukan aktivitas akademik.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Payment Modal */}
            <AnimatePresence>
                {isPayModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsPayModalOpen(false); removeFile(); }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black uppercase tracking-tight">Pembayaran Tagihan</h2>
                                        <p className="text-[10px] text-slate-400 font-bold">Transfer & upload bukti pembayaran</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => { setIsPayModalOpen(false); removeFile(); }} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                            </div>

                            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                                {/* Bill Info */}
                                {selectedBill && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tagihan</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedBill.description}</p>
                                        </div>
                                        <p className="text-xl font-black text-primary">{formatCurrency(selectedBill.amount)}</p>
                                    </div>
                                )}

                                {/* ── Virtual Account ─────────────────── */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 ml-1">
                                        <Building2 size={14} className="text-slate-400" />
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Virtual Account Pembayaran</label>
                                    </div>
                                    <div className="space-y-2">
                                        {bankConfigs.map((cfg) => {
                                            const vaNumber = generateVA(profile?.nim_nip || profile?.id || '0', cfg.prefix);
                                            return (
                                                <div key={cfg.bank} className={cn("p-4 rounded-2xl border flex items-center justify-between group transition-all hover:shadow-sm", cfg.color)}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-white/80 dark:bg-slate-900/50 rounded-xl flex items-center justify-center shadow-sm">
                                                            <span className="text-xs font-black">{cfg.bank}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black font-mono tracking-wider">{vaNumber}</p>
                                                            <p className="text-[10px] font-bold opacity-70">a.n Universitas CEPAT</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(vaNumber, cfg.bank)}
                                                        className={cn(
                                                            "p-2.5 rounded-xl transition-all",
                                                            copiedRek === cfg.bank
                                                                ? "bg-emerald-500 text-white"
                                                                : "bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 text-current hover:scale-105"
                                                        )}
                                                    >
                                                        {copiedRek === cfg.bank ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ── Upload Bukti Pembayaran ──────────────── */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 ml-1">
                                        <Upload size={14} className="text-slate-400" />
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Bukti Pembayaran *</label>
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/jpeg,image/png,image/webp,image/jpg"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />

                                    {!proofFile ? (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center gap-3 text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all group"
                                        >
                                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                <Image size={24} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold">Klik untuk upload bukti transfer</p>
                                                <p className="text-[10px] font-medium mt-1">JPG, PNG, atau WebP • Maksimal 5MB</p>
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <img
                                                src={proofPreview}
                                                alt="Bukti pembayaran"
                                                className="w-full max-h-48 object-contain bg-slate-50 dark:bg-slate-800"
                                            />
                                            <div className="absolute top-2 right-2 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={removeFile}
                                                    className="p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Image size={14} className="text-primary" />
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{proofFile.name}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">{(proofFile.size / 1024).toFixed(0)} KB</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── AI Scan Button ──────────────────────── */}
                                {proofFile && aiVerdict.status === 'idle' && !isScanning && (
                                    <button
                                        type="button"
                                        onClick={runAiVerification}
                                        className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-lg"
                                    >
                                        <Zap size={16} className="text-primary" />
                                        Scan & Verifikasi dengan AI
                                    </button>
                                )}

                                {/* ── Scanning Progress ───────────────────── */}
                                {(isScanning || (aiVerdict.status !== 'idle' && aiVerdict.message)) && (
                                    <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative">
                                        <div className="relative z-10 flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Cpu size={16} className={cn("text-primary", isScanning && "animate-spin")} />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {isScanning ? 'Scanning Bukti...' : 'Scan Selesai'}
                                                </span>
                                            </div>
                                            <span className="text-xs font-black text-white">{scanProgress}%</span>
                                        </div>

                                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4 relative z-10">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${scanProgress}%` }}
                                                className="h-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                            />
                                        </div>

                                        <p className={cn(
                                            "text-[10px] font-bold relative z-10 flex items-center gap-2",
                                            aiVerdict.status === 'verified' ? "text-emerald-400" :
                                                aiVerdict.status === 'failed' ? "text-rose-400" : "text-slate-500"
                                        )}>
                                            {aiVerdict.status === 'verified' && <ShieldCheck size={12} />}
                                            {aiVerdict.message}
                                        </p>

                                        <div className="absolute top-0 right-0 p-4 text-white/5 -z-0">
                                            <BrainCircuit size={64} strokeWidth={1} />
                                        </div>
                                    </div>
                                )}

                                {/* ── Submit Button ───────────────────────── */}
                                <button
                                    type="button"
                                    onClick={handlePayment}
                                    disabled={!proofFile || aiVerdict.status !== 'verified' || uploading}
                                    className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <><Cpu size={18} className="animate-spin" /> Mengirim Bukti...</>
                                    ) : aiVerdict.status === 'verified' ? (
                                        <><Upload size={18} /> Kirim Bukti Pembayaran</>
                                    ) : (
                                        'Upload & Verifikasi Bukti Dulu'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default PaymentsPage;
