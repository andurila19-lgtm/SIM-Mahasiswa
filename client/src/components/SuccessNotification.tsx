import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessNotificationProps {
    isOpen: boolean;
    message: string;
    onClose: () => void;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({ isOpen, message, onClose }) => {
    React.useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-[10000]"
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{
                            scale: [0.5, 1.2, 1],
                            opacity: 1
                        }}
                        transition={{
                            duration: 0.5,
                            times: [0, 0.7, 1],
                            ease: "easeOut"
                        }}
                        className="w-28 h-28 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-green-500/40 relative"
                    >
                        <motion.div
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.3, duration: 0.5, ease: "easeInOut" }}
                        >
                            <svg
                                className="w-16 h-16 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={4}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <motion.path
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </motion.div>

                        {/* Ripples */}
                        <motion.div
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 rounded-full border-2 border-green-500"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-center mt-10"
                    >
                        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Berhasil!</h2>
                        <p className="text-green-400 font-bold text-lg max-w-xs">{message}</p>
                    </motion.div>

                    {/* Background particle-like effects */}
                    <div className="absolute inset-0 -z-10 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px]" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SuccessNotification;
