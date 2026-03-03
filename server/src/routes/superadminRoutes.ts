import express, { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, restrictTo } from '../middlewares/auth.js';

const router: Router = express.Router();

// All super admin routes require auth + superadmin role
router.use(verifyToken);
router.use(restrictTo('superadmin'));

// ===========================
// AUDIT LOG HELPER
// ===========================
const logAudit = async (req: Request, action: string, module: string, targetId?: any, targetType?: string, details?: any) => {
    try {
        await supabase.from('audit_logs').insert({
            user_id: req.profile?.id || req.user?.uid,
            user_email: req.profile?.email || req.user?.email,
            user_role: req.profile?.role,
            action,
            module,
            target_id: targetId,
            target_type: targetType,
            details,
            ip_address: req.ip || (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for']) || 'unknown',
            user_agent: req.headers['user-agent']
        });
    } catch (e) {
        console.error('Audit log error:', e);
    }
};

// ===========================
// PERMISSIONS MANAGEMENT
// ===========================
router.get('/permissions', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true })
        .order('name', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.post('/permissions', async (req: Request, res: Response) => {
    const { name, display_name, description, module } = req.body;
    if (!name || !display_name) return res.status(400).json({ error: 'Name and display_name required' });

    const { data, error } = await supabase.from('permissions').insert([{ name, display_name, description, module }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'create', 'permissions', data.id, 'permission', { name });
    res.json(data);
});

router.put('/permissions/:id', async (req: Request, res: Response) => {
    const { name, display_name, description, module } = req.body;
    const { data, error } = await supabase.from('permissions').update({ name, display_name, description, module, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'update', 'permissions', req.params.id, 'permission', { name });
    res.json(data);
});

router.delete('/permissions/:id', async (req: Request, res: Response) => {
    const { error } = await supabase.from('permissions').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'delete', 'permissions', req.params.id, 'permission');
    res.json({ message: 'Permission deleted' });
});

// ===========================
// ROLE PERMISSIONS (RBAC)
// ===========================
router.get('/role-permissions', async (req: Request, res: Response) => {
    const { role } = req.query;
    let query = supabase.from('role_permissions').select('*, permissions(*)');
    if (role) query = query.eq('role', role as string);
    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.post('/role-permissions', async (req: Request, res: Response) => {
    const { role, permission_ids } = req.body;
    if (!role || !permission_ids || !Array.isArray(permission_ids)) {
        return res.status(400).json({ error: 'Role and permission_ids array required' });
    }

    // Delete existing for this role
    await supabase.from('role_permissions').delete().eq('role', role);

    // Insert new
    const inserts = permission_ids.map((pid: string) => ({ role, permission_id: pid }));
    const { error } = await supabase.from('role_permissions').insert(inserts);
    if (error) return res.status(400).json({ error: error.message });

    await logAudit(req, 'update', 'rbac', undefined, 'role_permissions', { role, count: permission_ids.length });
    res.json({ message: `${permission_ids.length} permissions assigned to ${role}` });
});

// ===========================
// ACADEMIC YEAR SETTINGS
// ===========================
router.get('/academic-years', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .is('deleted_at', null)
        .order('year', { ascending: false })
        .order('semester', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.post('/academic-years', async (req: Request, res: Response) => {
    const { year, semester, start_date, end_date, is_active } = req.body;
    if (!year || !semester) return res.status(400).json({ error: 'Year and semester required' });

    // If setting as active, deactivate all others
    if (is_active) {
        await supabase.from('academic_years').update({ is_active: false }).eq('is_active', true);
    }

    const { data, error } = await supabase.from('academic_years').insert([{ year, semester, start_date, end_date, is_active: is_active || false }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'create', 'academic_years', data.id, 'academic_year', { year, semester });
    res.json(data);
});

router.put('/academic-years/:id', async (req: Request, res: Response) => {
    const { year, semester, start_date, end_date, is_active } = req.body;

    if (is_active) {
        await supabase.from('academic_years').update({ is_active: false }).eq('is_active', true);
    }

    const { data, error } = await supabase.from('academic_years')
        .update({ year, semester, start_date, end_date, is_active, updated_at: new Date().toISOString() })
        .eq('id', req.params.id).select().single();

    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'update', 'academic_years', req.params.id, 'academic_year', { year, semester });
    res.json(data);
});

router.delete('/academic-years/:id', async (req: Request, res: Response) => {
    // Soft delete
    const { error } = await supabase.from('academic_years')
        .update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'delete', 'academic_years', req.params.id, 'academic_year');
    res.json({ message: 'Academic year soft-deleted' });
});

// ===========================
// STUDY PROGRAMS (PRODI)
// ===========================
router.get('/study-programs', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('study_programs')
        .select('*')
        .is('deleted_at', null)
        .order('faculty', { ascending: true })
        .order('name', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.post('/study-programs', async (req: Request, res: Response) => {
    const { code, name, faculty, degree, accreditation, head_of_program } = req.body;
    if (!code || !name || !faculty) return res.status(400).json({ error: 'Code, name, and faculty required' });

    const { data, error } = await supabase.from('study_programs')
        .insert([{ code, name, faculty, degree, accreditation, head_of_program }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'create', 'study_programs', data.id, 'study_program', { code, name });
    res.json(data);
});

router.put('/study-programs/:id', async (req: Request, res: Response) => {
    const { code, name, faculty, degree, accreditation, head_of_program, status } = req.body;
    const { data, error } = await supabase.from('study_programs')
        .update({ code, name, faculty, degree, accreditation, head_of_program, status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'update', 'study_programs', req.params.id, 'study_program', { code, name });
    res.json(data);
});

router.delete('/study-programs/:id', async (req: Request, res: Response) => {
    const { error } = await supabase.from('study_programs')
        .update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'delete', 'study_programs', req.params.id, 'study_program');
    res.json({ message: 'Study program soft-deleted' });
});

// ===========================
// ROOMS MANAGEMENT
// ===========================
router.get('/rooms', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .is('deleted_at', null)
        .order('building', { ascending: true })
        .order('code', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.post('/rooms', async (req: Request, res: Response) => {
    const { code, name, building, floor, capacity, type, facilities, status } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Code and name required' });

    const { data, error } = await supabase.from('rooms')
        .insert([{ code, name, building, floor, capacity, type, facilities, status }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'create', 'rooms', data.id, 'room', { code, name });
    res.json(data);
});

router.put('/rooms/:id', async (req: Request, res: Response) => {
    const { code, name, building, floor, capacity, type, facilities, status } = req.body;
    const { data, error } = await supabase.from('rooms')
        .update({ code, name, building, floor, capacity, type, facilities, status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'update', 'rooms', req.params.id, 'room', { code, name });
    res.json(data);
});

router.delete('/rooms/:id', async (req: Request, res: Response) => {
    const { error } = await supabase.from('rooms')
        .update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'delete', 'rooms', req.params.id, 'room');
    res.json({ message: 'Room soft-deleted' });
});

// ===========================
// COURSES MANAGEMENT (MK)
// ===========================
router.get('/courses', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('code', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.post('/courses', async (req: Request, res: Response) => {
    const { code, name, sks, semester_recommended, study_program_id } = req.body;
    if (!code || !name || !sks) return res.status(400).json({ error: 'Code, name, and sks required' });

    const { data, error } = await supabase.from('courses')
        .insert([{ code, name, sks, semester_recommended, study_program_id }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'create', 'courses', data.id, 'course', { code, name });
    res.json(data);
});

router.put('/courses/:id', async (req: Request, res: Response) => {
    const { code, name, sks, semester_recommended, study_program_id } = req.body;
    const { data, error } = await supabase.from('courses')
        .update({ code, name, sks, semester_recommended, study_program_id })
        .eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'update', 'courses', req.params.id, 'course', { code, name });
    res.json(data);
});

router.delete('/courses/:id', async (req: Request, res: Response) => {
    const { error } = await supabase.from('courses').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'delete', 'courses', req.params.id, 'course');
    res.json({ message: 'Course deleted' });
});

// ===========================
// AUDIT LOGS
// ===========================
router.get('/audit-logs', async (req: Request, res: Response) => {
    const { limit = 100, offset = 0, action, module: mod, user_id } = req.query;

    let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (action) query = query.eq('action', action as string);
    if (mod) query = query.eq('module', mod as string);
    if (user_id) query = query.eq('user_id', user_id as string);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data, total: count });
});

// ===========================
// DASHBOARD STATS (SUPER ADMIN)
// ===========================
router.get('/dashboard-stats', async (req: Request, res: Response) => {
    try {
        const [
            { count: totalStudents },
            { count: totalLecturers },
            { count: totalCourses },
            { count: totalRooms },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mahasiswa'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'dosen'),
            supabase.from('courses').select('*', { count: 'exact', head: true }),
            supabase.from('rooms').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        ]);

        // Payment stats
        const { data: paymentData } = await supabase
            .from('student_bills')
            .select('amount, status');

        const paidTotal = (paymentData || []).filter((b: any) => b.status === 'paid').reduce((s: number, b: any) => s + (b.amount || 0), 0);
        const pendingPayments = (paymentData || []).filter((b: any) => b.status === 'pending').length;

        // KRS active
        const { count: activeKrs } = await supabase.from('student_krs').select('*', { count: 'exact', head: true }).eq('status', 'approved');

        // Recent audit logs
        const { data: recentLogs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10);

        res.json({
            totalStudents: totalStudents || 0,
            totalLecturers: totalLecturers || 0,
            totalCourses: totalCourses || 0,
            totalRooms: totalRooms || 0,
            paidTotal,
            pendingPayments,
            activeKrs: activeKrs || 0,
            recentLogs: recentLogs || []
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================
// EXPORT DATA
// ===========================
router.get('/export/students', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, nim_nip, role, status, created_at')
        .eq('role', 'mahasiswa')
        .order('full_name');

    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'export', 'students', undefined, 'export', { format: 'json', count: data?.length });
    res.json(data);
});

router.get('/export/lecturers', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, nim_nip, role, status, created_at')
        .eq('role', 'dosen')
        .order('full_name');

    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'export', 'lecturers', undefined, 'export', { format: 'json', count: data?.length });
    res.json(data);
});

router.get('/export/payments', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('student_bills')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'export', 'payments', undefined, 'export', { format: 'json', count: data?.length });
    res.json(data);
});

// ===========================
// RESET PASSWORD (ALL USERS)
// ===========================
router.post('/reset-password', async (req: Request, res: Response) => {
    const { uid, newPassword } = req.body;
    if (!uid || !newPassword) return res.status(400).json({ error: 'UID and newPassword required' });

    try {
        const { auth } = await import('../config/firebase.js');
        await auth.updateUser(uid, { password: newPassword });
        await logAudit(req, 'reset_password', 'users', uid, 'user');
        res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// ===========================
// SOFT DELETE / RESTORE USER
// ===========================
router.patch('/users/:id/soft-delete', async (req: Request, res: Response) => {
    const { data, error } = await supabase.from('profiles')
        .update({ deleted_at: new Date().toISOString(), status: 'suspended' })
        .eq('id', req.params.id).select().single();

    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'soft_delete', 'users', req.params.id, 'user');
    res.json(data);
});

router.patch('/users/:id/restore', async (req: Request, res: Response) => {
    const { data, error } = await supabase.from('profiles')
        .update({ deleted_at: null, status: 'active' })
        .eq('id', req.params.id).select().single();

    if (error) return res.status(400).json({ error: error.message });
    await logAudit(req, 'restore', 'users', req.params.id, 'user');
    res.json(data);
});

// ===========================
// BACKUP & RESTORE (SIMULATION)
// ===========================
router.post('/backup', async (req: Request, res: Response) => {
    try {
        // Simulated backup: export all important tables as JSON
        const [profiles, courses, rooms, studyPrograms, academicYears, permissions, rolePerms] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('courses').select('*'),
            supabase.from('rooms').select('*').is('deleted_at', null),
            supabase.from('study_programs').select('*').is('deleted_at', null),
            supabase.from('academic_years').select('*').is('deleted_at', null),
            supabase.from('permissions').select('*'),
            supabase.from('role_permissions').select('*'),
        ]);

        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                profiles: profiles.data || [],
                courses: courses.data || [],
                rooms: rooms.data || [],
                study_programs: studyPrograms.data || [],
                academic_years: academicYears.data || [],
                permissions: permissions.data || [],
                role_permissions: rolePerms.data || [],
            }
        };

        await logAudit(req, 'backup', 'system', undefined, 'backup', {
            tables: Object.keys(backup.data),
            totalRecords: Object.values(backup.data).reduce((s: number, arr: any) => s + arr.length, 0)
        });

        res.json(backup);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/restore', async (req: Request, res: Response) => {
    // Simulation only (no actual restore for safety)
    const { data: backupData } = req.body;
    if (!backupData) return res.status(400).json({ error: 'Backup data required' });

    await logAudit(req, 'restore_simulation', 'system', undefined, 'restore', {
        timestamp: backupData.timestamp,
        tables: Object.keys(backupData.data || {})
    });

    res.json({
        message: 'Restore simulation complete. In production, this would restore the database.',
        preview: {
            tables: Object.keys(backupData.data || {}),
            totalRecords: Object.values(backupData.data || {}).reduce((s: number, arr: any) => s + arr.length, 0)
        }
    });
});

export default router;
