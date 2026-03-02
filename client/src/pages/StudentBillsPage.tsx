import React from 'react';
import { CreditCard } from 'lucide-react';

const StudentBillsPage: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <CreditCard size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tagihan Mahasiswa</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400">Monitoring status tagihan dan pembayaran mahasiswa.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-20 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                    <CreditCard size={32} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada tagihan baru</p>
            </div>
        </div>
    );
};

export default StudentBillsPage;
