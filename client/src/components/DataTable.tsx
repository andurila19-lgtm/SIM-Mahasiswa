import React, { useState, useMemo } from 'react';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    X,
    FileText,
    ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Column<T> {
    header: string;
    accessorKey: keyof T | ((item: T) => React.ReactNode);
    className?: string;
    searchable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pageSize?: number;
    searchPlaceholder?: string;
    onRowClick?: (item: T) => void;
    title?: string;
    description?: string;
    icon?: any;
    actions?: React.ReactNode;
    exportFileName?: string;
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    pageSize = 10,
    searchPlaceholder = "Cari data...",
    onRowClick,
    title,
    description,
    icon: Icon,
    actions,
    exportFileName = "Export_Data"
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    // Filter Logic
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lowTerm = searchTerm.toLowerCase();
        return data.filter(item => {
            return columns.some(col => {
                if (col.searchable === false) return false;
                const val = typeof col.accessorKey === 'function'
                    ? '' // We don't search in custom renderers easily, but could be improved
                    : String(item[col.accessorKey as keyof T] || '').toLowerCase();
                return val.includes(lowTerm);
            });
        });
    }, [data, searchTerm, columns]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    // Reset to page 1 on search
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleExportExcel = () => {
        const excelData = filteredData.map(item => {
            const row: any = {};
            columns.forEach(col => {
                if (typeof col.accessorKey === 'string') {
                    row[col.header] = item[col.accessorKey as keyof T];
                }
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(blob, `${exportFileName}_${new Date().getTime()}.xlsx`);
        setIsExportMenuOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            {(title || actions) && (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative group no-print">
                    {title && (
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-2">
                                {Icon && (
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        <Icon size={28} />
                                    </div>
                                )}
                                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
                            </div>
                            {description && <p className="text-slate-500 dark:text-slate-400">{description}</p>}
                        </div>
                    )}
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="relative">
                            <button
                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all flex items-center gap-2"
                            >
                                <Download size={18} /> Export
                            </button>
                            <AnimatePresence>
                                {isExportMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsExportMenuOpen(false)}></div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-30"
                                        >
                                            <button onClick={() => { window.print(); setIsExportMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                                                <FileText size={16} className="text-red-500" /> Print / PDF
                                            </button>
                                            <button onClick={handleExportExcel} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                                                <ClipboardCheck size={16} className="text-emerald-500" /> Excel
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                        {actions}
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none py-4 pl-14 pr-12 rounded-2xl text-slate-700 dark:text-slate-200 focus:border-primary/50 transition-all text-sm font-medium"
                />
            </div>

            {/* Table Area */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                                {columns.map((col, idx) => (
                                    <th key={idx} className={cn("px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest", col.className)}>
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((item, rowIdx) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => onRowClick?.(item)}
                                        className={cn(
                                            "group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors",
                                            onRowClick && "cursor-pointer"
                                        )}
                                    >
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className={cn("px-8 py-6", col.className)}>
                                                {typeof col.accessorKey === 'function'
                                                    ? col.accessorKey(item)
                                                    : (item[col.accessorKey as keyof T] as React.ReactNode)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Halaman {currentPage} dari {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-500 disabled:opacity-50 transition-all border border-slate-100 dark:border-slate-700"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-500 disabled:opacity-50 transition-all border border-slate-100 dark:border-slate-700"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
