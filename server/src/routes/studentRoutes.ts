import express, { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, restrictTo } from '../middlewares/auth.js';

const router: Router = express.Router();

// Protected Routes
router.use(verifyToken);

// Request profile detail
router.get('/profile', restrictTo('student', 'lecturer', 'super_admin'), async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('students')
        .select('*, profiles(*), study_programs(*)')
        .eq('id', (req as any).user.uid)
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.patch('/profile', restrictTo('student'), async (req: Request, res: Response) => {
    const { full_name, phone, avatar_url } = req.body;

    const { data, error } = await supabase
        .from('profiles')
        .update({ full_name, phone, avatar_url })
        .eq('id', (req as any).user.uid)
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data ? data[0] : null);
});

export default router;
