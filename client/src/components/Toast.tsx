import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    isOpen: boolean;
    message: string;
    type?: ToastType;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ isOpen, message, type = 'success', onClose }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    const icons = {
        success: <CheckCircle2 className="text-emerald-500" size={20} />,
        error: <AlertCircle className="text-rose-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />
    };

    const backgrounds = {
        success: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
        error: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20',
        info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className={cn(
                        "fixed bottom-8 left-1/2 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-md min-w-[320px] max-w-md",
                        backgrounds[type]
                    )}
                >
                    <div className="flex-shrink-0">
                        {icons[type]}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X size={16} className="text-slate-400" />
                    </button>

                    {/* Progress Bar */}
                    <motion.div
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: 3, ease: "linear" }}
                        className={cn(
                            "absolute bottom-0 left-0 right-0 h-1 origin-left rounded-b-2xl",
                            type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                        )}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
