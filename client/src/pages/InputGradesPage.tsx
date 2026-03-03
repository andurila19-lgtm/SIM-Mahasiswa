import React, { useState, useEffect } from 'react';
import {
    GraduationCap,
    Search,
    Save,
    Users,
    BookOpen,
    CheckCircle2,
    Lock,
    Unlock,
    AlertCircle,
    RotateCcw,
    Send,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Toast, { ToastType } from '../components/Toast';

interface StudentGrade {
    id: string;
    nim: string;
    name: string;
    tugas: number | '';
    uts: number | '';
    uas: number | '';
    is_locked: boolean;
    final?: number;
    grade?: string;
}

const InputGradesPage: React.FC = () => {
    const { profile } = useAuth();
    const [selectedClass, setSelectedClass] = useState('');
    const [classes, setClasses] = useState<{ id: string, label: string, course_id: string }[]>([]);
    const [students, setStudents] = useState<StudentGrade[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);

    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({ isOpen: false, message: '', type: 'success' });
    const showToast = (message: string, type: ToastType = 'success') => setToast({ isOpen: true, message, type });

    useEffect(() => {
        const fetchClasses = async () => {
            if (!profile?.id) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('classes')
                    .select('id, name, courses(id, name, code)')
                    .eq('lecturer_id', profile?.id);

                if (error) throw error;

                if (data && data.length > 0) {
                    const mapped = data.map(m => {
                        const course = Array.isArray(m.courses) ? m.courses[0] : m.courses;
                        return {
                            id: m.id,
                            course_id: course?.id,
                            label: `${course?.code || 'N/A'} - ${m.name} (${course?.name || 'Unknown'})`
                        };
                    });
                    setClasses(mapped as any);
                    setSelectedClass(mapped[0].id);
                } else {
                    // Mock fallback if no real classes found or table empty
                    const mock = [
                        { id: '1', label: 'TIF201 - TI-A (Pemrograman Web II)', course_id: 'c1' },
                        { id: '2', label: 'TIF201 - TI-B (Pemrograman Web II)', course_id: 'c1' }
                    ];
                    setClasses(mock as any);
                    setSelectedClass(mock[0].id);
                }
            } catch (err) {
                console.error('Fetch Classes Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [profile]);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedClass || classes.length === 0) return;
            setLoading(true);
            try {
                const currentClass = classes.find(c => c.id === selectedClass);
                if (!currentClass) return;

                const courseId = currentClass.course_id;

                // 1. Fetch students who took this course in their KRS
                const { data: krsData, error: krsError } = await supabase
                    .from('student_krs')
                    .select('student_id, courses, profiles(full_name, nim_nip)')
                    .eq('status', 'approved');

                if (krsError) throw krsError;

                const classStudents = (krsData || []).filter(k =>
                    Array.isArray(k.courses) && k.courses.some((c: any) => c.id === courseId)
                );

                // 2. Fetch existing grades
                const { data: gradesData, error: gradesError } = await supabase
                    .from('student_grades')
                    .select('*')
                    .eq('course_id', courseId);

                const studentGradesMap: Record<string, any> = {};
                (gradesData || []).forEach(g => {
                    studentGradesMap[g.student_id] = g;
                });

                const mapped: StudentGrade[] = classStudents.map(k => {
                    const profileData: any = Array.isArray(k.profiles) ? k.profiles[0] : k.profiles;
                    return {
                        id: k.student_id,
                        nim: profileData?.nim_nip || 'N/A',
                        name: profileData?.full_name || 'Unknown',
                        tugas: studentGradesMap[k.student_id]?.tugas ?? '',
                        uts: studentGradesMap[k.student_id]?.uts ?? '',
                        uas: studentGradesMap[k.student_id]?.uas ?? '',
                        is_locked: studentGradesMap[k.student_id]?.is_locked || false,
                        final: studentGradesMap[k.student_id]?.final_score,
                        grade: studentGradesMap[k.student_id]?.grade_letter
                    };
                });

                if (mapped.length > 0) {
                    setStudents(mapped);
                } else {
                    // Mock fallback if no students found
                    const mock: StudentGrade[] = [
                        { id: 's1', nim: '2024010001', name: 'Budi Santoso (Demo)', tugas: 85, uts: 80, uas: 90, is_locked: false },
                        { id: 's2', nim: '2024010002', name: 'Siti Aminah (Demo)', tugas: 75, uts: 70, uas: 85, is_locked: false }
                    ];
                    setStudents(mock);
                }
            } catch (err) {
                console.error('Fetch Students Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selectedClass, classes]);

    const calculateGrade = (tugas: any, uts: any, uas: any) => {
        const t = Number(tugas) || 0;
        const u1 = Number(uts) || 0;
        const u2 = Number(uas) || 0;
        const final = t * 0.3 + u1 * 0.3 + u2 * 0.4;
        let grade = 'E';
        if (final >= 85) grade = 'A';
        else if (final >= 80) grade = 'A-';
        else if (final >= 75) grade = 'B+';
        else if (final >= 70) grade = 'B';
        else if (final >= 65) grade = 'B-';
        else if (final >= 60) grade = 'C+';
        else if (final >= 55) grade = 'C';
        else if (final >= 40) grade = 'D';
        return { final: Math.round(final * 100) / 100, grade };
    };

    const gradeColor = (g: string) => {
        if (g === 'A') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
        if (g === 'A-') return 'text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10';
        if (g === 'B+' || g === 'B' || g === 'B-') return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
        if (g === 'C+' || g === 'C') return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
    };

    const handleInputChange = (id: string, field: 'tugas' | 'uts' | 'uas', value: string) => {
        const student = students.find(s => s.id === id);
        if (student?.is_locked) {
            showToast('Nilai sudah dikunci dan tidak dapat diubah.', 'warning');
            return;
        }

        const val = value === '' ? '' : Math.min(100, Math.max(0, parseInt(value) || 0));
        setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const currentClass = classes.find(c => c.id === selectedClass);
            if (!currentClass) return;
            const courseId = currentClass.course_id;

            const upsertData = students.map(s => {
                const calc = calculateGrade(s.tugas, s.uts, s.uas);
                return {
                    student_id: s.id,
                    course_id: courseId,
                    tugas: s.tugas === '' ? null : s.tugas,
                    uts: s.uts === '' ? null : s.uts,
                    uas: s.uas === '' ? null : s.uas,
                    final_score: calc.final,
                    grade_letter: calc.grade,
                    is_locked: s.is_locked,
                    updated_at: new Date().toISOString()
                };
            });

            const { error } = await supabase
                .from('student_grades')
                .upsert(upsertData, { onConflict: 'student_id, course_id' });

            if (error) throw error;
            showToast('Draf nilai berhasil disimpan.');
        } catch (err: any) {
            showToast('Gagal menyimpan: ' + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinalize = async () => {
        if (!confirm('Apakah Anda yakin ingin memfinalisasi semua nilai? Nilai yang dikunci tidak dapat diubah.')) return;
        setIsFinalizing(true);
        try {
            const currentClass = classes.find(c => c.id === selectedClass);
            if (!currentClass) return;
            const courseId = currentClass.course_id;

            const upsertData = students.map(s => {
                const calc = calculateGrade(s.tugas, s.uts, s.uas);
                return {
                    student_id: s.id,
                    course_id: courseId,
                    tugas: s.tugas === '' ? null : s.tugas,
                    uts: s.uts === '' ? null : s.uts,
                    uas: s.uas === '' ? null : s.uas,
                    final_score: calc.final,
                    grade_letter: calc.grade,
                    is_locked: true,
                    updated_at: new Date().toISOString()
                };
            });

            const { error } = await supabase
                .from('student_grades')
                .upsert(upsertData, { onConflict: 'student_id, course_id' });

            if (error) throw error;

            setStudents(prev => prev.map(s => ({ ...s, is_locked: true })));
            showToast('Semua nilai berhasil dikunci (Finalize)!', 'success');
        } catch (err: any) {
            showToast('Gagal finalisasi: ' + err.message, 'error');
        } finally {
            setIsFinalizing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                        <GraduationCap size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Input Nilai Mahasiswa</h1>
                    <p className="text-slate-500 dark:text-slate-400">Pastikan nilai valid (0-100) sebelum melakukan finalisasi.</p>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Kelas</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 outline-none py-3 px-4 rounded-xl text-xs font-bold focus:border-primary/50 transition-all cursor-pointer min-w-[240px]"
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 mt-auto">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isFinalizing}
                            className="flex items-center gap-2 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 text-xs"
                        >
                            {isSaving ? 'Menyimpan...' : <><Save size={16} /> Simpan Draf</>}
                        </button>
                        <button
                            onClick={handleFinalize}
                            disabled={isSaving || isFinalizing}
                            className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50 text-xs"
                        >
                            {isFinalizing ? 'Memproses...' : <><Send size={16} /> Final Submit</>}
                        </button>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Alert Box */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-start gap-4">
                <div className="p-2 bg-amber-500/20 text-amber-600 rounded-xl">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-amber-700 dark:text-amber-500 text-sm">Informasi Penting</h4>
                    <p className="text-xs text-amber-600/80 font-bold tracking-tight mt-1 underline decoration-amber-500/30">
                        Nilai yang sudah difinalisasi (dikunci) tidak dapat diubah kembali kecuali melalui permohonan pembukaan kunci ke bagian Akademik.
                    </p>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center">Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">NIM & Mahasiswa</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tugas (30%)</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">UTS (30%)</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">UAS (40%)</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Skor Akhir</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Grade</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={8} className="p-20 text-center text-slate-400 font-bold">Memuat data mahasiswa...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={8} className="p-20 text-center text-slate-400 font-bold">Belum ada mahasiswa terdaftar di kelas ini.</td></tr>
                            ) : students.map((s) => {
                                const calc = calculateGrade(s.tugas, s.uts, s.uas);

                                return (
                                    <tr
                                        key={s.id}
                                        className={cn(
                                            "hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group",
                                            s.is_locked && "bg-slate-50/30 opacity-80"
                                        )}
                                    >
                                        <td className="p-6 text-center">
                                            {s.is_locked ? (
                                                <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto shadow-sm">
                                                    <Lock size={14} />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center mx-auto">
                                                    <Unlock size={14} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-primary font-mono select-all">NIM {s.nim}</span>
                                                <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 uppercase tracking-tight">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                disabled={s.is_locked}
                                                value={s.tugas}
                                                onChange={(e) => handleInputChange(s.id, 'tugas', e.target.value)}
                                                className={cn(
                                                    "w-16 text-center bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-xl p-2.5 text-sm font-black outline-none transition-all",
                                                    s.is_locked ? "opacity-50 cursor-not-allowed" : "focus:border-primary/20 hover:border-slate-200"
                                                )}
                                            />
                                        </td>
                                        <td className="p-6 text-center">
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                disabled={s.is_locked}
                                                value={s.uts}
                                                onChange={(e) => handleInputChange(s.id, 'uts', e.target.value)}
                                                className={cn(
                                                    "w-16 text-center bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-xl p-2.5 text-sm font-black outline-none transition-all",
                                                    s.is_locked ? "opacity-50 cursor-not-allowed" : "focus:border-primary/20 hover:border-slate-200"
                                                )}
                                            />
                                        </td>
                                        <td className="p-6 text-center">
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                disabled={s.is_locked}
                                                value={s.uas}
                                                onChange={(e) => handleInputChange(s.id, 'uas', e.target.value)}
                                                className={cn(
                                                    "w-16 text-center bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-xl p-2.5 text-sm font-black outline-none transition-all",
                                                    s.is_locked ? "opacity-50 cursor-not-allowed" : "focus:border-primary/20 hover:border-slate-200"
                                                )}
                                            />
                                        </td>
                                        <td className="p-6 text-center text-base font-black text-slate-800 dark:text-white">{calc.final}</td>
                                        <td className="p-6 text-center">
                                            <span className={cn("px-4 py-2 rounded-xl text-xs font-black border tracking-widest", gradeColor(calc.grade))}>
                                                {calc.grade}
                                            </span>
                                        </td>
                                        <td className="p-6 text-center">
                                            {!s.is_locked ? (
                                                <button
                                                    onClick={() => {
                                                        setStudents(prev => prev.map(st => st.id === s.id ? { ...st, is_locked: true } : st));
                                                        showToast(`Nilai ${s.name} berhasil dikunci.`);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-primary transition-colors"
                                                    title="Lock Grade"
                                                >
                                                    <Lock size={18} />
                                                </button>
                                            ) : (
                                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Locked</div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer Stats */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/10 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    <div className="flex gap-6">
                        <span>Total Mahasiswa: {students.length}</span>
                        <span className="text-primary">Sudah Diinput: {students.filter(s => s.tugas !== '' && s.uts !== '' && s.uas !== '').length}</span>
                        <span className="text-emerald-500">Telah Dikunci: {students.filter(s => s.is_locked).length}</span>
                    </div>
                </div>
            </div>

            <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
        </div>
    );
};

export default InputGradesPage;
