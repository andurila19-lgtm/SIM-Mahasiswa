import React, { useState } from 'react';
import { GraduationCap, Search, Save, Users, BookOpen, CheckCircle2, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import Toast, { ToastType } from '../components/Toast';

interface StudentGrade {
    id: string;
    nim: string;
    name: string;
    tugas: number | '';
    uts: number | '';
    uas: number | '';
    final?: number;
    grade?: string;
}

const InputGradesPage: React.FC = () => {
    const [selectedClass, setSelectedClass] = useState('TI501-A');
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({ isOpen: false, message: '', type: 'success' });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    const mockClasses: { id: string, label: string }[] = [];

    const [students, setStudents] = useState<StudentGrade[]>([]);

    const calculateGrade = (tugas: number, uts: number, uas: number) => {
        const final = tugas * 0.3 + uts * 0.3 + uas * 0.4;
        let grade = 'E';
        if (final >= 85) grade = 'A';
        else if (final >= 75) grade = 'B+';
        else if (final >= 70) grade = 'B';
        else if (final >= 60) grade = 'C+';
        else if (final >= 55) grade = 'C';
        else if (final >= 40) grade = 'D';
        return { final: Math.round(final * 100) / 100, grade };
    };

    const gradeColor = (g: string) => {
        if (g === 'A') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
        if (g === 'B+' || g === 'B') return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
        if (g === 'C+' || g === 'C') return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
    };

    const handleSave = () => {
        showToast('Nilai berhasil disimpan!');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                        <GraduationCap size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Input Nilai</h1>
                    <p className="text-slate-500 dark:text-slate-400">Masukkan nilai Tugas, UTS, dan UAS untuk setiap mahasiswa.</p>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border-none outline-none py-3 px-4 rounded-xl text-sm font-bold cursor-pointer"
                    >
                        {mockClasses.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <Save size={18} /> Simpan Nilai
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center">No</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">NIM</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tugas (30%)</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">UTS (30%)</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">UAS (40%)</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nilai Akhir</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {students.map((s, i) => {
                                const calc = (typeof s.tugas === 'number' && typeof s.uts === 'number' && typeof s.uas === 'number')
                                    ? calculateGrade(s.tugas, s.uts, s.uas)
                                    : { final: 0, grade: '-' };

                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                        <td className="p-4 text-sm font-bold text-slate-400 text-center">{i + 1}</td>
                                        <td className="p-4 text-sm font-bold text-primary font-mono">{s.nim}</td>
                                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">{s.name}</td>
                                        <td className="p-4 text-center">
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                value={s.tugas}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                                    setStudents(prev => prev.map(st => st.id === s.id ? { ...st, tugas: val } : st));
                                                }}
                                                className="w-16 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm font-bold outline-none focus:border-primary/50"
                                            />
                                        </td>
                                        <td className="p-4 text-center">
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                value={s.uts}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                                    setStudents(prev => prev.map(st => st.id === s.id ? { ...st, uts: val } : st));
                                                }}
                                                className="w-16 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm font-bold outline-none focus:border-primary/50"
                                            />
                                        </td>
                                        <td className="p-4 text-center">
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                value={s.uas}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                                    setStudents(prev => prev.map(st => st.id === s.id ? { ...st, uas: val } : st));
                                                }}
                                                className="w-16 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm font-bold outline-none focus:border-primary/50"
                                            />
                                        </td>
                                        <td className="p-4 text-center text-sm font-black text-slate-700 dark:text-white">{calc.final}</td>
                                        <td className="p-4 text-center">
                                            <span className={cn("px-3 py-1 rounded-lg text-xs font-black", gradeColor(calc.grade))}>
                                                {calc.grade}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default InputGradesPage;
