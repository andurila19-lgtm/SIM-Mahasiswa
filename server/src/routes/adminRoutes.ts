import express, { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, restrictTo } from '../middlewares/auth.js';

const router: Router = express.Router();

// Protected Routes
router.use(verifyToken);
router.use(restrictTo('superadmin', 'dosen'));

// Get Students (Admin/Lecturer access)
router.get('/students', async (req: Request, res: Response) => {
    const { study_program_id, status, search } = req.query;

    let query = supabase
        .from('profiles')
        .select('*, students(*, study_programs(*))')
        .eq('role', 'student');

    if (study_program_id) query = query.eq('students.study_program_id', study_program_id as string);
    if (status) query = query.eq('status', status as string);
    if (search) query = query.ilike('full_name', `%${search}%`);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Update Student Status (Admin only)
router.patch('/students/:id/status', restrictTo('superadmin'), async (req: Request, res: Response) => {
    const { status } = req.body;
    const { data, error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', req.params.id)
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data ? data[0] : null);
});

// Course Management (Admin only)
router.post('/courses', restrictTo('superadmin'), async (req: Request, res: Response) => {
    const { name, code, sks, study_program_id, semester_recommended } = req.body;
    const { data, error } = await supabase
        .from('courses')
        .insert([{ name, code, sks, study_program_id, semester_recommended }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data ? data[0] : null);
});

// Reset User Password (Admin only)
router.post('/reset-password', restrictTo('superadmin'), async (req: Request, res: Response) => {
    const { uid, newPassword } = req.body;

    if (!uid || !newPassword) {
        return res.status(400).json({ error: 'UID and newPassword are required' });
    }

    try {
        const { auth } = await import('../config/firebase.js');
        await auth.updateUser(uid, { password: newPassword });
        res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Reset Password Error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Create New User (Admin only)
router.post('/create-user', restrictTo('superadmin'), async (req: Request, res: Response) => {
    const { email, password, fullName, role, nimNip } = req.body;

    if (!email || !password || !fullName || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { auth } = await import('../config/firebase.js');

        // 1. Create User in Firebase
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: fullName,
        });

        // 2. Create Profile in Supabase
        const { error: supabaseError } = await supabase
            .from('profiles')
            .upsert({
                id: userRecord.uid,
                full_name: fullName,
                email: email,
                role: role,
                nim_nip: nimNip,
                status: 'active',
                created_at: new Date().toISOString()
            });

        if (supabaseError) {
            // Cleanup Firebase user if Supabase fails
            await auth.deleteUser(userRecord.uid);
            throw supabaseError;
        }

        res.json({
            message: 'User created successfully',
            uid: userRecord.uid
        });
    } catch (error: any) {
        console.error('Create User Error:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
