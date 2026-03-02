import express, { Router, Request, Response } from 'express';
import { verifyToken, restrictTo } from '../middlewares/auth.js';
import { generateKHS } from '../utils/pdfGenerator.js';

const router: Router = express.Router();

// Protected Routes
router.use(verifyToken);

// Generate KHS PDF (Self)
router.get('/khs/:semester_id', restrictTo('student', 'super_admin'), async (req: Request, res: Response) => {
    const profile = (req as any).profile;
    const semesterId = req.params.semester_id;

    // Real usage will fetch from DB, for now we mock it to demonstrate the flow
    const mockData = {
        profile: profile,
        nim: profile.nim_nip || '2105001',
        study_program: { name: 'Teknik Informatika' },
        semester_current: 6,
        grades: [
            { course: { code: 'TI601', name: 'Pemrograman Web II', sks: 3 }, grade_letter: 'A', grade_point: 4.0 },
            { course: { code: 'TI602', name: 'Kecerdasan Buatan', sks: 3 }, grade_letter: 'B+', grade_point: 3.5 }
        ],
        total_sks: 6,
        ips: 3.75,
        ipk: 3.82
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=khs-${profile.nim_nip || 'student'}.pdf`);

    generateKHS(mockData, res);
});

export default router;
