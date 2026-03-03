import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
                        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                            <AlertTriangle size={48} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Ups! Terjadi Kesalahan Terdeteksi</h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                            Sistem mengalami gangguan teknis yang tidak terduga. Kami telah mencatat kejadian ini untuk segera diperbaiki.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
                            >
                                <RefreshCcw size={20} /> Reload Halaman
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                <Home size={20} /> Kembali ke Home
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-left">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Error Debug Info</p>
                                <pre className="text-[10px] bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-rose-500 overflow-auto max-h-40">
                                    {this.state.error?.message}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
