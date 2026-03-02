import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Star, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface Course {
    id: string;
    code: string;
    name: string;
    sks: number;
    semester_recommended: number;
    study_programs?: { name: string };
}

const CurriculumPage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('courses')
                .select('*, study_programs(name)')
                .order('semester_recommended', { ascending: true });
            if (!error && data) setCourses(data);
            setLoading(false);
        };
        fetchCourses();
    }, []);

    const filtered = courses.filter(c => {
        const matchSem = selectedSemester === 'all' || c.semester_recommended === selectedSemester;
        const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSem && matchSearch;
    });

    const semesters = [...new Set(courses.map(c => c.semester_recommended))].sort((a, b) => a - b);
    const totalSKS = filtered.reduce((a, c) => a + c.sks, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                        <BookOpen size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Kurikulum</h1>
                    <p className="text-slate-500 dark:text-slate-400">Daftar mata kuliah yang tersedia di program studi Anda.</p>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari mata kuliah..."
                            className="bg-slate-100 dark:bg-slate-800 border-none outline-none py-3 pl-10 pr-4 rounded-xl text-sm w-56 focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="bg-slate-100 dark:bg-slate-800 border-none outline-none py-3 px-4 rounded-xl text-sm font-bold cursor-pointer"
                    >
                        <option value="all">Semua Semester</option>
                        {semesters.map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                        ))}
                    </select>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 -z-0"></div>
            </div>

            {/* Summary */}
            <div className="flex items-center gap-6 px-2">
                <p className="text-sm text-slate-500">
                    <span className="font-bold text-slate-800 dark:text-white">{filtered.length}</span> Mata Kuliah
                </p>
                <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800"></div>
                <p className="text-sm text-slate-500">
                    Total <span className="font-bold text-primary">{totalSKS} SKS</span>
                </p>
            </div>

            {/* Course List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {loading ? (
                        <div className="p-20 text-center text-slate-400 font-bold">Memuat kurikulum...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-20 text-center text-slate-400 font-bold">Tidak ada mata kuliah ditemukan.</div>
                    ) : (
                        filtered.map((course) => (
                            <div key={course.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary/10 group-hover:text-primary transition-all border border-slate-100 dark:border-slate-700 shadow-sm uppercase">
                                        {course.code.slice(0, 2)}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{course.name}</h4>
                                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Star size={12} className="opacity-60" /> {course.code}</span>
                                            <span className="text-primary/80">{course.sks} SKS</span>
                                            <span className="opacity-60">Sem {course.semester_recommended}</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CurriculumPage;
