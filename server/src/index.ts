import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Security Middleware
import { checkSubscription } from './middlewares/auth.js';
import {
    rateLimiter,
    sanitizeRequest,
    securityHeaders,
    globalErrorHandler,
    activityMonitor
} from './middlewares/security.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// ─── Core Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Security Middleware (Global) ────────────────────────────────
app.use(securityHeaders);
app.use(sanitizeRequest);
app.use(rateLimiter(100, 60000, 60000)); // 100 req/min global

// ─── Routes ──────────────────────────────────────────────────────
import studentRoutes from './routes/studentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import superadminRoutes from './routes/superadminRoutes.js';
import akademikRoutes from './routes/akademikRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import premiumRoutes from './routes/premiumRoutes.js';

// Platform Admin Routes (TIDAK terkena RLS campus, terpisah sepenuhnya)
app.use('/api/platform', platformRoutes);

// Premium Features (Dashboard Rektor, QR, Payment, Notifications)
app.use('/api/premium', premiumRoutes);

// Campus-Level Routes (terkena subscription check & RLS campus)
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/akademik', akademikRoutes);

// ─── Health Check ────────────────────────────────────────────────
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        message: 'SIM Mahasiswa API is running.',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    });
});

// ─── Global Error Handler (HARUS di akhir) ───────────────────────
app.use(globalErrorHandler);

// ─── Uncaught Exception / Rejection Handler ──────────────────────
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT_EXCEPTION]', err.message, err.stack);
    // Dalam production, log ke DB lalu graceful shutdown
});

process.on('unhandledRejection', (reason: any) => {
    console.error('[UNHANDLED_REJECTION]', reason?.message || reason);
});

// ─── Start Server ────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🛡️  Security middleware: Active`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
