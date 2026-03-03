import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import crypto from 'crypto';

// ─── In-Memory Rate Limit Store ─────────────────────────────────
// Untuk produksi, gunakan Redis. Ini adalah implementasi ringan.
interface RateLimitEntry {
    count: number;
    firstRequest: number;
    blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Bersihkan store setiap 10 menit
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.firstRequest < now - 600000) {
            rateLimitStore.delete(key);
        }
    }
}, 600000);

// ─── 1. RATE LIMITER ────────────────────────────────────────────
export const rateLimiter = (maxRequests: number = 100, windowMs: number = 60000, blockMs: number = 300000) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
        const key = `${clientIp}:${req.path}`;
        const now = Date.now();

        let entry = rateLimitStore.get(key);

        // Jika masih diblokir
        if (entry?.blockedUntil && now < entry.blockedUntil) {
            const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
            res.set('Retry-After', String(retryAfter));
            return res.status(429).json({
                error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
                code: 'RATE_LIMITED',
                retryAfter
            });
        }

        if (!entry || now - entry.firstRequest > windowMs) {
            entry = { count: 1, firstRequest: now };
        } else {
            entry.count++;
        }

        if (entry.count > maxRequests) {
            entry.blockedUntil = now + blockMs;
            rateLimitStore.set(key, entry);
            return res.status(429).json({
                error: 'Batas permintaan terlampaui. Akun Anda sementara diblokir.',
                code: 'RATE_LIMITED',
                retryAfter: Math.ceil(blockMs / 1000)
            });
        }

        rateLimitStore.set(key, entry);
        res.set('X-RateLimit-Remaining', String(maxRequests - entry.count));
        next();
    };
};

// ─── 2. LOGIN RATE LIMITER (Strict) ──────────────────────────────
export const loginRateLimiter = rateLimiter(5, 300000, 900000); // 5 per 5min, block 15min

// ─── 3. BRUTE FORCE PROTECTION ──────────────────────────────────
export const bruteForceProtection = async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body?.email;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    if (!email) return next();

    try {
        // Cek jumlah percobaan gagal dalam 15 menit terakhir
        const { count } = await supabase
            .from('login_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('email', email)
            .eq('success', false)
            .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

        if ((count || 0) >= 5) {
            // Log blocked attempt
            await supabase.from('login_attempts').insert({
                email,
                ip_address: clientIp,
                user_agent: req.headers['user-agent'],
                success: false,
                failure_reason: 'BRUTE_FORCE_BLOCKED'
            });

            return res.status(423).json({
                error: 'Akun sementara terkunci karena terlalu banyak percobaan login gagal. Coba lagi dalam 15 menit.',
                code: 'ACCOUNT_LOCKED',
                lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString()
            });
        }

        next();
    } catch (err) {
        console.error('Brute Force Check Error:', err);
        next(); // Jangan block jika error pada pengecekkan
    }
};

// ─── 4. LOG LOGIN ATTEMPT ───────────────────────────────────────
export const logLoginAttempt = async (
    email: string,
    req: Request,
    success: boolean,
    failureReason?: string
) => {
    try {
        const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
        await supabase.from('login_attempts').insert({
            email,
            ip_address: clientIp,
            user_agent: req.headers['user-agent'],
            success,
            failure_reason: failureReason || null
        });
    } catch (err) {
        console.error('Log Login Attempt Error:', err);
    }
};

// ─── 5. ACTIVITY MONITOR ────────────────────────────────────────
export const activityMonitor = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.profile?.id;
    if (!userId) return next();

    try {
        const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
        const tokenHash = req.headers.authorization
            ? crypto.createHash('sha256').update(req.headers.authorization).digest('hex').substring(0, 16)
            : 'no-token';

        // Upsert last activity
        await supabase
            .from('active_sessions')
            .upsert({
                user_id: userId,
                token_hash: tokenHash,
                ip_address: clientIp,
                user_agent: req.headers['user-agent'],
                device_info: {
                    platform: req.headers['sec-ch-ua-platform'],
                    mobile: req.headers['sec-ch-ua-mobile'],
                },
                last_activity: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
                is_active: true
            }, { onConflict: 'user_id' })
            .select();

    } catch (err) {
        // Non-blocking
        console.error('Activity Monitor Error:', err);
    }

    next();
};

// ─── 6. ERROR LOGGER ────────────────────────────────────────────
export const logError = async (
    errorType: string,
    message: string,
    req?: Request,
    stackTrace?: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'error'
) => {
    try {
        await supabase.from('error_logs').insert({
            error_type: errorType,
            message,
            stack_trace: stackTrace,
            endpoint: req?.originalUrl,
            method: req?.method,
            user_id: (req as any)?.profile?.id,
            ip_address: req?.ip || req?.socket?.remoteAddress,
            request_body: req?.body ? JSON.parse(JSON.stringify(req.body, (key, value) => {
                // Sanitize: Jangan simpan password di log
                if (['password', 'token', 'secret', 'newPassword'].includes(key)) return '[REDACTED]';
                return value;
            })) : null,
            severity
        });
    } catch (err) {
        // Fallback: Console only
        console.error('[ERROR_LOGGER_FAILED]', { errorType, message, severity });
    }
};

// ─── 7. GLOBAL ERROR HANDLER ────────────────────────────────────
export const globalErrorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log to DB
    logError(
        err.name || 'UnhandledError',
        message,
        req,
        err.stack,
        statusCode >= 500 ? 'critical' : 'error'
    );

    // Log to console (development)
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);

    res.status(statusCode).json({
        error: message,
        code: err.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// ─── 8. REQUEST SANITIZER ───────────────────────────────────────
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
    // Block requests with suspicious headers
    const suspiciousPatterns = [
        /(<script|javascript:|on\w+=)/i,  // XSS
        /(union\s+select|drop\s+table|insert\s+into)/i, // SQL injection
        /(\.\.\/)/, // Path traversal
    ];

    const bodyStr = JSON.stringify(req.body || {});
    const queryStr = JSON.stringify(req.query || {});

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(bodyStr) || pattern.test(queryStr)) {
            logError('security', `Suspicious request blocked: ${req.method} ${req.originalUrl}`, req, undefined, 'warning');
            return res.status(400).json({
                error: 'Request mengandung karakter yang tidak diizinkan.',
                code: 'INVALID_INPUT'
            });
        }
    }

    next();
};

// ─── 9. SECURITY HEADERS ────────────────────────────────────────
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    next();
};
