import express, { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, restrictTo } from '../middlewares/auth.js';

const router: Router = express.Router();

// All routes here require auth + (akademik or superadmin) role
router.use(verifyToken);
router.use(restrictTo('superadmin', 'akademik'));

// ===========================
// STUDENT MANAGEMENT (CRUD)
// ===========================
router.get('/students', async (req: Request, res: Response) => {
    const { search, status, study_program } = req.query;
    let query = supabase.from('profiles').select('*').eq('role', 'mahasiswa');

    if (search) query = query.or(`full_name.ilike.%${search}%,nim_nip.ilike.%${search}%`);
    if (status) query = query.eq('status', status as string);
    if (study_program) query = query.eq('study_program', study_program as string);

    const { data, error } = await query.order('full_name');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.patch('/students/:id/status', async (req: Request, res: Response) => {
    const { status } = req.body; // active, inactive, cuti
    const { data, error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// ===========================
// KRS MANAGEMENT
// ===========================
router.get('/krs-submissions', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('student_krs')
        .select('*, profiles(full_name, nim_nip, study_program)')
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.patch('/krs/:id/verify', async (req: Request, res: Response) => {
    const { status, is_override } = req.body;
    const { data, error } = await supabase
        .from('student_krs')
        .update({ status, is_override: is_override || false, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// ===========================
// SCHEDULE & ROOMS
// ===========================
router.get('/classes', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('classes')
        .select('*, courses(*), profiles(full_name)')
        .order('day');

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.post('/classes', async (req: Request, res: Response) => {
    const { name, course_id, lecturer_id, day, start_time, end_time, room, capacity } = req.body;

    // Simple conflict check (logic can be improved)
    const { data: conflicts, error: checkError } = await supabase
        .from('classes')
        .select('*')
        .eq('day', day)
        .eq('room', room)
        .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time})`);

    if (conflicts && conflicts.length > 0) {
        return res.status(400).json({ error: 'Jadwal bentrok di ruangan yang sama' });
    }

    const { data, error } = await supabase
        .from('classes')
        .insert([{ name, course_id, lecturer_id, day, start_time, end_time, room, capacity }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data ? data[0] : null);
});

// ===========================
// ACADEMIC CALENDAR
// ===========================
router.get('/calendar', async (req: Request, res: Response) => {
    const { data, error } = await supabase.from('academic_calendar').select('*').order('start_date');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.post('/calendar', async (req: Request, res: Response) => {
    const { title, description, event_type, start_date, end_date, academic_year_id } = req.body;
    const { data, error } = await supabase
        .from('academic_calendar')
        .insert([{ title, description, event_type, start_date, end_date, academic_year_id }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data ? data[0] : null);
});

// ===========================
// MONITORING IPK
// ===========================
router.get('/monitoring/gpa', async (req: Request, res: Response) => {
    // Logic to calculate/fetch GPA
    // Assuming we have a summary table or calculate on the fly
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, nim_nip, study_program, status')
        .eq('role', 'mahasiswa');

    if (error) return res.status(400).json({ error: error.message });

    // For demo, we add random GPA
    const students = data.map(s => ({
        ...s,
        gpa: (Math.random() * (4.0 - 2.0) + 2.0).toFixed(2),
        total_sks: Math.floor(Math.random() * 144)
    }));

    res.json(students);
});

export default router;
