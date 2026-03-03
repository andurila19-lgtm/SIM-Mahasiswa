import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';
import { supabase } from '../config/supabase.js';
import { Profile, Subscription, Campus, PLAN_FEATURES } from '../types.js';
import { logError } from './security.js';

// ─── 1. VERIFY TOKEN & ATTACH PROFILE ─────────────────────────────
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Token tidak ditemukan', code: 'NO_TOKEN' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await auth.verifyIdToken(token);

        // ─── Token Expiration Check ──────────────────────────
        const now = Math.floor(Date.now() / 1000);
        const tokenAge = now - (decodedToken.iat || 0);
        const MAX_TOKEN_AGE = 3600; // 1 jam

        if (tokenAge > MAX_TOKEN_AGE) {
            return res.status(401).json({
                message: 'Sesi Anda telah berakhir. Silakan login kembali.',
                code: 'TOKEN_EXPIRED',
                expired: true
            });
        }

        req.user = decodedToken;

        // Fetch user profile from Supabase to attach role & campus
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', decodedToken.uid)
            .single();

        if (error || !profile) {
            logError('auth_error', `Profile not found for UID: ${decodedToken.uid}`, req);
            return res.status(403).json({ message: 'Forbidden: Profil user tidak ditemukan', code: 'NO_PROFILE' });
        }

        // Cek apakah user di-suspend
        if (profile.status === 'suspended') {
            return res.status(403).json({
                message: 'Akun Anda telah di-suspend. Hubungi administrator.',
                code: 'USER_SUSPENDED'
            });
        }

        // Cek apakah user dihapus (soft delete)
        if (profile.deleted_at) {
            return res.status(403).json({
                message: 'Akun Anda tidak lagi aktif.',
                code: 'USER_DELETED'
            });
        }

        req.profile = profile as Profile;
        next();
    } catch (error: any) {
        // Firebase specific error codes
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                message: 'Token telah kedaluwarsa. Silakan login kembali.',
                code: 'TOKEN_EXPIRED',
                expired: true
            });
        }
        if (error.code === 'auth/id-token-revoked') {
            return res.status(401).json({
                message: 'Sesi telah dicabut. Silakan login kembali.',
                code: 'TOKEN_REVOKED',
                expired: true
            });
        }

        logError('auth_error', `Token verification failed: ${error.message}`, req, error.stack);
        res.status(401).json({ message: 'Unauthorized: Token tidak valid', code: 'INVALID_TOKEN' });
    }
};

// ─── 2. RESTRICT BY ROLE ──────────────────────────────────────────
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.profile || !roles.includes(req.profile.role)) {
            logError('auth_error', `Unauthorized access attempt: ${req.profile?.role} tried ${req.originalUrl}`, req, undefined, 'warning');
            return res.status(403).json({
                message: 'Forbidden: Anda tidak memiliki akses untuk fitur ini',
                code: 'INSUFFICIENT_ROLE'
            });
        }
        next();
    };
};

// ─── 3. 2FA VERIFICATION ─────────────────────────────────────────
export const verify2FA = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.profile?.id;
    if (!userId) return next();

    try {
        // Cek apakah user mengaktifkan 2FA
        const { data: twoFA } = await supabase
            .from('two_factor_auth')
            .select('is_enabled')
            .eq('user_id', userId)
            .maybeSingle();

        // Jika 2FA tidak aktif, lanjutkan
        if (!twoFA || !twoFA.is_enabled) return next();

        // Jika 2FA aktif, cek header x-2fa-token
        const otpToken = req.headers['x-2fa-token'] as string;

        if (!otpToken) {
            return res.status(403).json({
                message: 'Verifikasi 2FA diperlukan. Masukkan kode OTP.',
                code: '2FA_REQUIRED',
                requires2FA: true
            });
        }

        // Verifikasi OTP (TOTP basic validation)
        // Dalam implementasi production gunakan library 'otpauth' / 'speakeasy'
        const { data: fullTwoFA } = await supabase
            .from('two_factor_auth')
            .select('secret_key, backup_codes')
            .eq('user_id', userId)
            .single();

        if (!fullTwoFA) return next();

        // Cek backup codes terlebih dahulu
        const backupCodes: string[] = fullTwoFA.backup_codes || [];
        if (backupCodes.includes(otpToken)) {
            // Gunakan dan hapus backup code
            const remaining = backupCodes.filter((c: string) => c !== otpToken);
            await supabase
                .from('two_factor_auth')
                .update({ backup_codes: remaining })
                .eq('user_id', userId);

            return next();
        }

        // TOTP Validation placeholder
        // Production: gunakan speakeasy.totp.verify({ secret, token: otpToken })
        // Untuk saat ini, kita terima jika format 6 digit
        if (/^\d{6}$/.test(otpToken)) {
            return next();
        }

        return res.status(403).json({
            message: 'Kode 2FA tidak valid.',
            code: '2FA_INVALID'
        });

    } catch (err: any) {
        logError('auth_error', `2FA check failed: ${err.message}`, req, err.stack);
        next(); // Jangan block jika ada error pada 2FA check
    }
};

// ─── 4. CHECK SUBSCRIPTION STATUS ─────────────────────────────────
export const checkSubscription = async (req: Request, res: Response, next: NextFunction) => {
    // Platform admin bypass subscription check
    if (req.profile?.role === 'platform_admin') return next();

    const campusId = req.profile?.campus_id;

    if (!campusId) {
        return res.status(403).json({
            message: 'Akses ditolak: User tidak terdaftar pada kampus manapun.',
            code: 'NO_CAMPUS'
        });
    }

    try {
        // Fetch campus info
        const { data: campus, error: campusError } = await supabase
            .from('campuses')
            .select('*')
            .eq('id', campusId)
            .single();

        if (campusError || !campus) {
            return res.status(403).json({
                message: 'Kampus tidak ditemukan dalam sistem.',
                code: 'CAMPUS_NOT_FOUND'
            });
        }

        if (campus.status === 'suspended') {
            return res.status(403).json({
                message: `Kampus ${campus.name} telah di-suspend. Hubungi admin platform.`,
                code: 'CAMPUS_SUSPENDED'
            });
        }

        req.campus = campus as Campus;

        // Fetch active subscription
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('campus_id', campusId)
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!subscription) {
            return res.status(402).json({
                message: `Langganan kampus ${campus.name} telah berakhir atau belum aktif. Silakan perpanjang paket.`,
                code: 'SUBSCRIPTION_EXPIRED'
            });
        }

        req.subscription = subscription as Subscription;
        next();
    } catch (err: any) {
        logError('subscription_error', `Subscription check failed: ${err.message}`, req, err.stack);
        res.status(500).json({ message: 'Gagal verifikasi langganan: ' + err.message });
    }
};

// ─── 5. CHECK FEATURE ACCESS BY PLAN ──────────────────────────────
export const requireFeature = (featureName: keyof typeof PLAN_FEATURES['Basic']) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Platform admin can access all features
        if (req.profile?.role === 'platform_admin') return next();

        const planName = req.subscription?.plan_name || 'Basic';
        const planConfig = PLAN_FEATURES[planName];

        if (!planConfig) {
            return res.status(403).json({
                message: 'Paket langganan tidak dikenali.',
                code: 'UNKNOWN_PLAN'
            });
        }

        const hasAccess = planConfig[featureName];

        if (!hasAccess) {
            return res.status(403).json({
                message: `Fitur "${featureName}" tidak tersedia pada paket ${planName}. Silakan upgrade ke paket yang lebih tinggi.`,
                code: 'FEATURE_LOCKED',
                current_plan: planName,
                required_plans: Object.entries(PLAN_FEATURES)
                    .filter(([_, features]) => features[featureName])
                    .map(([name]) => name)
            });
        }

        next();
    };
};
