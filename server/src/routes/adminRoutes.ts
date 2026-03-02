import express, { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, restrictTo } from '../middlewares/auth.js';

const router: Router = express.Router();

// Protected Routes
router.use(verifyToken);
router.use(restrictTo('super_admin', 'lecturer'));

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
router.patch('/students/:id/status', restrictTo('super_admin'), async (req: Request, res: Response) => {
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
router.post('/courses', restrictTo('super_admin'), async (req: Request, res: Response) => {
    const { name, code, sks, study_program_id, semester_recommended } = req.body;
    const { data, error } = await supabase
        .from('courses')
        .insert([{ name, code, sks, study_program_id, semester_recommended }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data ? data[0] : null);
});

export default router;
