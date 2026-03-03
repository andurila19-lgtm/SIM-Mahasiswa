import express, { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, restrictTo, checkSubscription, requireFeature } from '../middlewares/auth.js';
import crypto from 'crypto';

const router: Router = express.Router();

router.use(verifyToken);

// ===========================
// 1. DASHBOARD REKTOR (Statistik Kampus)
// ===========================
router.get('/dashboard', restrictTo('superadmin', 'platform_admin'), async (req: Request, res: Response) => {
    const campusId = req.profile?.campus_id;
    try {
        // Grafik IPK rata-rata per prodi
        const { data: grades } = await supabase
            .from('student_grades')
            .select('final_score, student_id, classes(courses(study_program_id, study_programs(name)))')
            .eq('campus_id', campusId);

        const ipkByProdi: Record<string, { total: number; count: number }> = {};
        (grades || []).forEach((g: any) => {
            const prodi = g.classes?.courses?.study_programs?.name || 'Lainnya';
            if (!ipkByProdi[prodi]) ipkByProdi[prodi] = { total: 0, count: 0 };
            ipkByProdi[prodi].total += (g.final_score || 0);
            ipkByProdi[prodi].count++;
        });

        const ipkChart = Object.entries(ipkByProdi).map(([name, data]) => ({
            prodi: name,
            averageGPA: data.count > 0 ? (data.total / data.count / 25).toFixed(2) : '0.00', // Normalize to 4.0
            totalStudents: data.count
        }));

        // Grafik pemasukan UKT per bulan
        const { data: payments } = await supabase
            .from('student_bills')
            .select('amount, status, paid_at, category')
            .eq('campus_id', campusId)
            .eq('status', 'paid')
            .eq('category', 'UKT');

        const revenueByMonth: Record<string, number> = {};
        (payments || []).forEach((p: any) => {
            const month = p.paid_at ? new Date(p.paid_at).toISOString().substring(0, 7) : 'unknown';
            revenueByMonth[month] = (revenueByMonth[month] || 0) + (p.amount || 0);
        });

        const revenueChart = Object.entries(revenueByMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, amount]) => ({ month, amount }));

        // Statistik umum
        const [
            { count: totalStudents },
            { count: totalLecturers },
            { count: totalCourses },
            { count: activeKRS },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('campus_id', campusId).eq('role', 'mahasiswa').is('deleted_at', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('campus_id', campusId).eq('role', 'dosen').is('deleted_at', null),
            supabase.from('courses').select('*', { count: 'exact', head: true }).eq('campus_id', campusId),
            supabase.from('student_krs').select('*', { count: 'exact', head: true }).eq('campus_id', campusId).eq('status', 'approved'),
        ]);

        // Distribusi status mahasiswa
        const { data: statusData } = await supabase
            .from('profiles')
            .select('status')
            .eq('campus_id', campusId)
            .eq('role', 'mahasiswa')
            .is('deleted_at', null);

        const statusDist: Record<string, number> = {};
        (statusData || []).forEach((s: any) => {
            statusDist[s.status || 'unknown'] = (statusDist[s.status || 'unknown'] || 0) + 1;
        });

        const totalPaidUKT = (payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);

        res.json({
            summary: {
                totalStudents: totalStudents || 0,
                totalLecturers: totalLecturers || 0,
                totalCourses: totalCourses || 0,
                activeKRS: activeKRS || 0,
                totalRevenueUKT: totalPaidUKT,
                studentStatusDistribution: statusDist,
            },
            charts: {
                ipkPerProdi: ipkChart,
                revenuePerMonth: revenueChart,
            }
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================
// 2. QR ATTENDANCE (Generate & Scan)
// ===========================
router.post('/qr-attendance/generate', restrictTo('dosen', 'superadmin'), async (req: Request, res: Response) => {
    const { class_id, valid_minutes = 15, latitude, longitude, radius_meters } = req.body;
    if (!class_id) return res.status(400).json({ error: 'class_id wajib diisi' });

    const qrToken = crypto.randomBytes(32).toString('hex');
    const validUntil = new Date(Date.now() + valid_minutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('qr_attendance_sessions')
        .insert([{
            class_id,
            lecturer_id: req.profile!.id,
            qr_token: qrToken,
            valid_until: validUntil,
            latitude: latitude || null,
            longitude: longitude || null,
            radius_meters: radius_meters || 100,
            campus_id: req.profile?.campus_id
        }])
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({
        qr_token: qrToken,
        qr_data: JSON.stringify({ token: qrToken, class_id, expires: validUntil }),
        valid_until: validUntil,
        session: data
    });
});

router.post('/qr-attendance/scan', restrictTo('mahasiswa'), async (req: Request, res: Response) => {
    const { qr_token, latitude, longitude } = req.body;
    if (!qr_token) return res.status(400).json({ error: 'QR token wajib diisi' });

    // Validasi QR session
    const { data: session, error } = await supabase
        .from('qr_attendance_sessions')
        .select('*')
        .eq('qr_token', qr_token)
        .single();

    if (error || !session) return res.status(404).json({ error: 'QR code tidak valid atau sudah kadaluarsa' });

    if (new Date(session.valid_until) < new Date()) {
        return res.status(400).json({ error: 'QR code sudah kadaluarsa', code: 'QR_EXPIRED' });
    }

    // Cek radius lokasi jika ada GPS
    if (session.latitude && session.longitude && latitude && longitude) {
        const distance = calculateDistance(session.latitude, session.longitude, latitude, longitude);
        if (distance > (session.radius_meters || 100)) {
            return res.status(400).json({
                error: `Anda berada di luar radius ${session.radius_meters}m dari lokasi kelas`,
                code: 'OUT_OF_RANGE',
                distance: Math.round(distance)
            });
        }
    }

    // Insert attendance
    const { data: att, error: attError } = await supabase
        .from('attendance')
        .upsert({
            class_id: session.class_id,
            student_id: req.profile!.id,
            session_date: session.session_date,
            status: 'hadir',
            notes: 'QR Scan'
        }, { onConflict: 'class_id,student_id,session_date' })
        .select()
        .single();

    if (attError) return res.status(400).json({ error: attError.message });
    res.json({ message: 'Kehadiran berhasil dicatat!', attendance: att });
});

// Haversine formula untuk jarak GPS
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ===========================
// 3. PAYMENT GATEWAY (Midtrans/Xendit)
// ===========================
router.post('/payment/create', restrictTo('mahasiswa', 'keuangan', 'superadmin'), async (req: Request, res: Response) => {
    const { bill_id, gateway = 'midtrans', payment_method } = req.body;
    if (!bill_id) return res.status(400).json({ error: 'bill_id wajib diisi' });

    // Ambil data tagihan
    const { data: bill, error: billError } = await supabase
        .from('student_bills')
        .select('*')
        .eq('id', bill_id)
        .single();

    if (billError || !bill) return res.status(404).json({ error: 'Tagihan tidak ditemukan' });
    if (bill.status === 'paid') return res.status(400).json({ error: 'Tagihan sudah lunas' });

    const externalId = `SIM-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Simpan transaksi
    const { data: tx, error: txError } = await supabase
        .from('payment_transactions')
        .insert([{
            bill_id,
            student_id: bill.student_id,
            gateway,
            external_id: externalId,
            amount: bill.amount,
            status: 'pending',
            payment_method,
            expired_at: expiredAt,
            campus_id: req.profile?.campus_id
        }])
        .select()
        .single();

    if (txError) return res.status(400).json({ error: txError.message });

    // Contoh integrasi Midtrans (Sandbox):
    // const midtransResponse = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': 'Basic ' + Buffer.from(SERVER_KEY + ':').toString('base64')
    //     },
    //     body: JSON.stringify({
    //         transaction_details: { order_id: externalId, gross_amount: bill.amount },
    //         customer_details: { email: req.profile?.email, first_name: req.profile?.full_name }
    //     })
    // });

    res.json({
        transaction: tx,
        external_id: externalId,
        payment_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${externalId}`, // Demo URL
        expires_at: expiredAt
    });
});

// Callback dari payment gateway
router.post('/payment/callback', async (req: Request, res: Response) => {
    const { order_id, transaction_status, payment_type, fraud_status } = req.body;

    let status: string;
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
        status = fraud_status === 'deny' ? 'failed' : 'success';
    } else if (transaction_status === 'expire') {
        status = 'expired';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
        status = 'failed';
    } else {
        status = 'pending';
    }

    const { data: tx } = await supabase
        .from('payment_transactions')
        .update({
            status,
            payment_method: payment_type,
            callback_data: req.body,
            paid_at: status === 'success' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        })
        .eq('external_id', order_id)
        .select('*, student_bills(id)')
        .single();

    // Update bill status jika berhasil
    if (status === 'success' && tx?.bill_id) {
        await supabase
            .from('student_bills')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', tx.bill_id);
    }

    res.json({ status: 'ok' });
});

// ===========================
// 4. NOTIFICATIONS (Email & WhatsApp)
// ===========================
router.post('/notifications/send', restrictTo('superadmin', 'akademik', 'keuangan'), async (req: Request, res: Response) => {
    const { user_id, title, message, type = 'info', channel = 'in_app' } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'title dan message wajib diisi' });

    const { data, error } = await supabase
        .from('notifications')
        .insert([{
            user_id: user_id || null,
            campus_id: req.profile?.campus_id,
            title,
            message,
            type,
            channel,
            sent_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });

    // Contoh integrasi Email (Nodemailer):
    // if (channel === 'email' || channel === 'all') {
    //     const transporter = nodemailer.createTransport({ host: 'smtp.gmail.com', ... });
    //     await transporter.sendMail({ to: userEmail, subject: title, html: message });
    // }

    // Contoh integrasi WhatsApp (Fonnte/WA-Gateway):
    // if (channel === 'whatsapp' || channel === 'all') {
    //     await fetch('https://api.fonnte.com/send', {
    //         method: 'POST',
    //         headers: { Authorization: WA_API_KEY },
    //         body: JSON.stringify({ target: userPhone, message: `${title}\n\n${message}` })
    //     });
    // }

    res.json({ message: 'Notifikasi berhasil dikirim', notification: data });
});

// Broadcast ke seluruh kampus
router.post('/notifications/broadcast', restrictTo('superadmin'), async (req: Request, res: Response) => {
    const { title, message, type = 'announcement', target_role } = req.body;
    const campusId = req.profile?.campus_id;

    let query = supabase.from('profiles').select('id').eq('campus_id', campusId).is('deleted_at', null);
    if (target_role) query = query.eq('role', target_role);
    const { data: users } = await query;

    const notifications = (users || []).map((u: any) => ({
        user_id: u.id,
        campus_id: campusId,
        title,
        message,
        type,
        channel: 'in_app',
        sent_at: new Date().toISOString()
    }));

    if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
    }

    res.json({ message: `Broadcast dikirim ke ${notifications.length} user` });
});

// Get my notifications
router.get('/notifications', async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${req.profile!.id},and(user_id.is.null,campus_id.eq.${req.profile?.campus_id})`)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id);
    res.json({ message: 'Marked as read' });
});

// ===========================
// 5. BULK IMPORT MAHASISWA (Excel)
// ===========================
router.post('/bulk-import/students', restrictTo('superadmin', 'akademik'), async (req: Request, res: Response) => {
    const { students, file_name = 'upload.xlsx' } = req.body;
    // students: Array dari data mahasiswa hasil parsing Excel di frontend

    if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ error: 'Data mahasiswa kosong. Kirim array of objects.' });
    }

    const campusId = req.profile?.campus_id;
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // Buat log entry
    const { data: importLog } = await supabase
        .from('bulk_import_logs')
        .insert([{
            imported_by: req.profile!.id,
            campus_id: campusId,
            file_name,
            import_type: 'students',
            total_rows: students.length,
            status: 'processing'
        }])
        .select()
        .single();

    for (let i = 0; i < students.length; i++) {
        const s = students[i];
        try {
            if (!s.full_name || !s.email || !s.nim_nip) {
                throw new Error(`Baris ${i + 1}: full_name, email, dan nim_nip wajib diisi`);
            }

            // Insert langsung ke profiles (tanpa Firebase auth untuk bulk)
            const { error } = await supabase.from('profiles').insert([{
                id: s.id || crypto.randomUUID(),
                full_name: s.full_name,
                email: s.email,
                nim_nip: s.nim_nip,
                role: 'mahasiswa',
                status: 'active',
                study_program: s.study_program || null,
                faculty: s.faculty || null,
                semester: s.semester || 1,
                campus_id: campusId
            }]);

            if (error) throw new Error(`Baris ${i + 1}: ${error.message}`);
            successCount++;
        } catch (err: any) {
            errorCount++;
            errors.push({ row: i + 1, data: s, error: err.message });
        }
    }

    // Update log
    if (importLog) {
        await supabase.from('bulk_import_logs').update({
            success_count: successCount,
            error_count: errorCount,
            error_details: errors,
            status: errorCount === students.length ? 'failed' : 'completed'
        }).eq('id', importLog.id);
    }

    res.json({
        message: `Import selesai: ${successCount} berhasil, ${errorCount} gagal`,
        success_count: successCount,
        error_count: errorCount,
        errors: errors.slice(0, 20) // Max 20 error details
    });
});

// ===========================
// 6. EXPORT LAPORAN AKREDITASI BAN-PT
// ===========================
router.get('/accreditation/report', restrictTo('superadmin'), async (req: Request, res: Response) => {
    const campusId = req.profile?.campus_id;
    const { academic_year_id } = req.query;

    try {
        // Standar 1: Visi, Misi, Tujuan (dari campus config)
        const { data: campus } = await supabase.from('campuses').select('*').eq('id', campusId).single();

        // Standar 3: Mahasiswa & Lulusan
        const { data: studentsByProdi } = await supabase
            .from('profiles')
            .select('study_program, status, semester')
            .eq('campus_id', campusId)
            .eq('role', 'mahasiswa')
            .is('deleted_at', null);

        const prodiStats: Record<string, { active: number; cuti: number; total: number }> = {};
        (studentsByProdi || []).forEach((s: any) => {
            const p = s.study_program || 'Lainnya';
            if (!prodiStats[p]) prodiStats[p] = { active: 0, cuti: 0, total: 0 };
            prodiStats[p].total++;
            if (s.status === 'active') prodiStats[p].active++;
            if (s.status === 'cuti') prodiStats[p].cuti++;
        });

        // Standar 4: SDM (Dosen)
        const { data: lecturers } = await supabase
            .from('profiles')
            .select('full_name, nim_nip, study_program, status')
            .eq('campus_id', campusId)
            .eq('role', 'dosen')
            .is('deleted_at', null);

        // Standar 5: Kurikulum
        const { data: courses } = await supabase
            .from('courses')
            .select('*, study_programs(name)')
            .eq('campus_id', campusId);

        // Standar 6: Pembiayaan
        const { data: financeSummary } = await supabase
            .from('student_bills')
            .select('amount, status, category')
            .eq('campus_id', campusId);

        const financeStats = {
            totalBilled: (financeSummary || []).reduce((s: number, b: any) => s + (b.amount || 0), 0),
            totalPaid: (financeSummary || []).filter((b: any) => b.status === 'paid').reduce((s: number, b: any) => s + (b.amount || 0), 0),
            totalUnpaid: (financeSummary || []).filter((b: any) => b.status !== 'paid').reduce((s: number, b: any) => s + (b.amount || 0), 0),
        };

        const report = {
            campus: campus?.name,
            generated_at: new Date().toISOString(),
            standar: {
                standar_3_mahasiswa: {
                    title: 'Standar 3 – Mahasiswa dan Lulusan',
                    total_mahasiswa: (studentsByProdi || []).length,
                    distribusi_per_prodi: prodiStats,
                },
                standar_4_sdm: {
                    title: 'Standar 4 – Sumber Daya Manusia',
                    total_dosen: (lecturers || []).length,
                    rasio_dosen_mahasiswa: `1:${Math.round(((studentsByProdi || []).length / Math.max((lecturers || []).length, 1)))}`,
                    daftar_dosen: (lecturers || []).map((l: any) => ({ nama: l.full_name, nidn: l.nim_nip, prodi: l.study_program })),
                },
                standar_5_kurikulum: {
                    title: 'Standar 5 – Kurikulum, Pembelajaran, dan Suasana Akademik',
                    total_mata_kuliah: (courses || []).length,
                },
                standar_6_pembiayaan: {
                    title: 'Standar 6 – Pembiayaan, Sarana, dan Prasarana',
                    keuangan: financeStats,
                },
            }
        };

        // Cache report
        await supabase.from('accreditation_reports').insert({
            campus_id: campusId,
            report_type: 'ban_pt_full',
            academic_year_id: academic_year_id || null,
            data: report,
            generated_by: req.profile!.id
        });

        res.json(report);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
