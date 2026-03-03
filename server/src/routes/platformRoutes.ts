import express, { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, restrictTo } from '../middlewares/auth.js';

const router: Router = express.Router();

// ─── ALL ROUTES: Platform Admin Only ──────────────────────────────
router.use(verifyToken);
router.use(restrictTo('platform_admin'));

// ─── Helper: Audit Log ────────────────────────────────────────────
const logAudit = async (req: Request, action: string, module: string, targetId?: any, targetType?: string, details?: any) => {
    try {
        await supabase.from('audit_logs').insert({
            user_id: req.profile?.id || req.user?.uid,
            user_email: req.profile?.email,
            user_role: 'platform_admin',
            action,
            module,
            target_id: targetId,
            target_type: targetType,
            details,
            ip_address: req.ip || 'unknown',
            user_agent: req.headers['user-agent']
        });
    } catch (e) {
        console.error('Platform Audit Log Error:', e);
    }
};

// ===========================
// DASHBOARD STATS (OVERVIEW)
// ===========================
router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        // Total campuses
        const { count: totalCampuses } = await supabase
            .from('campuses')
            .select('*', { count: 'exact', head: true });

        // Active campuses
        const { count: activeCampuses } = await supabase
            .from('campuses')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // Suspended campuses
        const { count: suspendedCampuses } = await supabase
            .from('campuses')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'suspended');

        // Total users across all campuses
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .is('deleted_at', null);

        // Total students across all campuses
        const { count: totalStudents } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'mahasiswa')
            .is('deleted_at', null);

        // Active subscriptions
        const { count: activeSubscriptions } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString());

        // Expiring soon (within 30 days)
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        const { count: expiringSoon } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .lte('end_date', thirtyDaysLater.toISOString())
            .gte('end_date', new Date().toISOString());

        // Revenue total (all active subscriptions)
        const { data: revenueData } = await supabase
            .from('subscriptions')
            .select('price')
            .eq('status', 'active');
        const totalRevenue = (revenueData || []).reduce((sum: number, s: any) => sum + (s.price || 0), 0);

        // Recent audit logs (platform-wide)
        const { data: recentLogs } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        res.json({
            stats: {
                totalCampuses: totalCampuses || 0,
                activeCampuses: activeCampuses || 0,
                suspendedCampuses: suspendedCampuses || 0,
                totalUsers: totalUsers || 0,
                totalStudents: totalStudents || 0,
                activeSubscriptions: activeSubscriptions || 0,
                expiringSoon: expiringSoon || 0,
                totalRevenue
            },
            recentLogs: recentLogs || []
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================
// CAMPUS MANAGEMENT (FULL CRUD)
// ===========================
router.get('/campuses', async (req: Request, res: Response) => {
    try {
        const { data: campuses, error } = await supabase
            .from('campuses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrich with usage stats
        const enriched = await Promise.all((campuses || []).map(async (campus: any) => {
            const [
                { count: studentCount },
                { count: dosenCount },
                { count: userTotal },
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('campus_id', campus.id).eq('role', 'mahasiswa').is('deleted_at', null),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('campus_id', campus.id).eq('role', 'dosen').is('deleted_at', null),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('campus_id', campus.id).is('deleted_at', null),
            ]);

            const { data: activeSub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('campus_id', campus.id)
                .eq('status', 'active')
                .gte('end_date', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            return {
                ...campus,
                students: studentCount || 0,
                lecturers: dosenCount || 0,
                totalUsers: userTotal || 0,
                subscription: activeSub || null,
            };
        }));

        res.json(enriched);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/campuses', async (req: Request, res: Response) => {
    const { name, domain } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama kampus wajib diisi' });

    const { data, error } = await supabase
        .from('campuses')
        .insert([{ name, domain, status: 'active' }])
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'CREATE_CAMPUS', 'platform', data.id, 'campus', { name, domain });
    res.json(data);
});

router.put('/campuses/:id', async (req: Request, res: Response) => {
    const { name, domain, status } = req.body;

    const { data, error } = await supabase
        .from('campuses')
        .update({ name, domain, status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'UPDATE_CAMPUS', 'platform', req.params.id, 'campus', { name, status });
    res.json(data);
});

// Suspend Campus
router.patch('/campuses/:id/suspend', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('campuses')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'SUSPEND_CAMPUS', 'platform', req.params.id, 'campus');
    res.json({ message: `Kampus berhasil di-suspend`, campus: data });
});

// Activate Campus
router.patch('/campuses/:id/activate', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('campuses')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'ACTIVATE_CAMPUS', 'platform', req.params.id, 'campus');
    res.json({ message: `Kampus berhasil diaktifkan`, campus: data });
});

// ===========================
// SUBSCRIPTION MANAGEMENT
// ===========================
router.get('/subscriptions', async (req: Request, res: Response) => {
    const { campus_id, status } = req.query;
    let query = supabase.from('subscriptions').select('*, campuses(name, domain)').order('created_at', { ascending: false });

    if (campus_id) query = query.eq('campus_id', campus_id as string);
    if (status) query = query.eq('status', status as string);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.post('/subscriptions', async (req: Request, res: Response) => {
    const { campus_id, plan_name, price, max_students, start_date, end_date } = req.body;
    if (!campus_id || !plan_name || !end_date) {
        return res.status(400).json({ error: 'campus_id, plan_name, dan end_date wajib diisi' });
    }

    // Expire previous active subscription
    await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('campus_id', campus_id)
        .eq('status', 'active');

    const defaults: Record<string, { maxStudents: number; price: number }> = {
        Basic: { maxStudents: 200, price: 500000 },
        Pro: { maxStudents: 2000, price: 2500000 },
        Enterprise: { maxStudents: 99999, price: 10000000 },
    };

    const planDefaults = defaults[plan_name] || defaults.Basic;

    const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
            campus_id,
            plan_name,
            price: price || planDefaults.price,
            max_students: max_students || planDefaults.maxStudents,
            start_date: start_date || new Date().toISOString(),
            end_date,
            status: 'active'
        }])
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'CREATE_SUBSCRIPTION', 'platform', data.id, 'subscription', { campus_id, plan_name });
    res.json(data);
});

// ===========================
// RESET PASSWORD ADMIN KAMPUS
// ===========================
router.post('/reset-campus-admin-password', async (req: Request, res: Response) => {
    const { uid, newPassword } = req.body;
    if (!uid || !newPassword) return res.status(400).json({ error: 'UID dan newPassword wajib diisi' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter' });

    try {
        const { auth } = await import('../config/firebase.js');
        await auth.updateUser(uid, { password: newPassword });
        await logAudit(req, 'RESET_CAMPUS_ADMIN_PASSWORD', 'platform', uid, 'user');
        res.json({ message: 'Password admin kampus berhasil direset' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// ===========================
// USAGE LOGS (Cross-Tenant Audit)
// ===========================
router.get('/usage-logs', async (req: Request, res: Response) => {
    const { limit = 100, offset = 0, campus_id, action, module: mod } = req.query;

    let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (campus_id) query = query.eq('campus_id', campus_id as string);
    if (action) query = query.eq('action', action as string);
    if (mod) query = query.eq('module', mod as string);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data, total: count });
});

// ===========================
// CAMPUS USER OVERVIEW
// ===========================
router.get('/campuses/:id/users', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, nim_nip, status, created_at')
        .eq('campus_id', req.params.id)
        .is('deleted_at', null)
        .order('role')
        .order('full_name');

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

export default router;
