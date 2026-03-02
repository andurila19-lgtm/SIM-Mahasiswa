import React from 'react';
import { motion } from 'framer-motion';
import { School } from 'lucide-react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center z-[9999]">
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [1, 0.8, 1]
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 border border-primary/20 shadow-xl shadow-primary/10"
            >
                <School size={40} />
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">SIM Mahasiswa</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">Menyiapkan portal akademik...</p>
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
