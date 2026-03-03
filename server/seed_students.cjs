const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM4NTY2OSwiZXhwIjoyMDg3OTYxNjY5fQ.tbJUvZntRrcDZZAQspcqlU_lse2cA0Jymql6Ey-bNDE';

// Service role client — bypasses rate limits & RLS
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const students = [
    { email: 'ahmad.rizki@mhs.cepat.ac.id', full_name: 'Ahmad Rizki Pratama', nim_nip: '2024010001', faculty: 'Fakultas Teknik', study_program: 'Teknik Informatika', phone: '081234567001' },
    { email: 'siti.nurhaliza@mhs.cepat.ac.id', full_name: 'Siti Nurhaliza Putri', nim_nip: '2024010002', faculty: 'Fakultas Teknik', study_program: 'Teknik Informatika', phone: '081234567002' },
    { email: 'budi.santoso@mhs.cepat.ac.id', full_name: 'Budi Santoso', nim_nip: '2024010003', faculty: 'Fakultas Teknik', study_program: 'Teknik Sipil', phone: '081234567003' },
    { email: 'dewi.lestari@mhs.cepat.ac.id', full_name: 'Dewi Lestari', nim_nip: '2024010004', faculty: 'Fakultas Teknik', study_program: 'Teknik Sipil', phone: '081234567004' },
    { email: 'rina.wulandari@mhs.cepat.ac.id', full_name: 'Rina Wulandari', nim_nip: '2024020001', faculty: 'Fakultas Ekonomi & Bisnis', study_program: 'Manajemen', phone: '081234567005' },
    { email: 'fajar.nugroho@mhs.cepat.ac.id', full_name: 'Fajar Nugroho', nim_nip: '2024020002', faculty: 'Fakultas Ekonomi & Bisnis', study_program: 'Manajemen', phone: '081234567006' },
    { email: 'maya.sari@mhs.cepat.ac.id', full_name: 'Maya Anggraeni Sari', nim_nip: '2024020003', faculty: 'Fakultas Ekonomi & Bisnis', study_program: 'Akuntansi', phone: '081234567007' },
    { email: 'rendi.hidayat@mhs.cepat.ac.id', full_name: 'Rendi Hidayat', nim_nip: '2024020004', faculty: 'Fakultas Ekonomi & Bisnis', study_program: 'Akuntansi', phone: '081234567008' },
    { email: 'nadia.permata@mhs.cepat.ac.id', full_name: 'Nadia Permata Sari', nim_nip: '2024030001', faculty: 'Fakultas Hukum', study_program: 'Ilmu Hukum', phone: '081234567009' },
    { email: 'dimas.prasetyo@mhs.cepat.ac.id', full_name: 'Dimas Prasetyo', nim_nip: '2024030002', faculty: 'Fakultas Hukum', study_program: 'Ilmu Hukum', phone: '081234567010' },
    { email: 'laras.kusumaningrum@mhs.cepat.ac.id', full_name: 'Laras Kusumaningrum', nim_nip: '2024040001', faculty: 'Fakultas Kedokteran', study_program: 'Pendidikan Dokter', phone: '081234567011' },
    { email: 'galih.ramadhan@mhs.cepat.ac.id', full_name: 'Galih Ramadhan', nim_nip: '2024040002', faculty: 'Fakultas Kedokteran', study_program: 'Pendidikan Dokter', phone: '081234567012' },
    { email: 'anisa.fitri@mhs.cepat.ac.id', full_name: 'Anisa Fitri Handayani', nim_nip: '2024040003', faculty: 'Fakultas Kedokteran', study_program: 'Farmasi', phone: '081234567013' },
    { email: 'yoga.aditya@mhs.cepat.ac.id', full_name: 'Yoga Aditya Putra', nim_nip: '2024050001', faculty: 'Fakultas Ilmu Sosial & Politik', study_program: 'Ilmu Komunikasi', phone: '081234567014' },
    { email: 'putri.rahayu@mhs.cepat.ac.id', full_name: 'Putri Rahayu', nim_nip: '2024050002', faculty: 'Fakultas Ilmu Sosial & Politik', study_program: 'Ilmu Komunikasi', phone: '081234567015' },
    { email: 'hendra.wijaya@mhs.cepat.ac.id', full_name: 'Hendra Wijaya', nim_nip: '2024050003', faculty: 'Fakultas Ilmu Sosial & Politik', study_program: 'Administrasi Publik', phone: '081234567016' },
    { email: 'indah.permatasari@mhs.cepat.ac.id', full_name: 'Indah Permatasari', nim_nip: '2024060001', faculty: 'Fakultas Keguruan & Ilmu Pendidikan', study_program: 'Pendidikan Matematika', phone: '081234567017' },
    { email: 'rizal.fahmi@mhs.cepat.ac.id', full_name: 'Rizal Fahmi', nim_nip: '2024060002', faculty: 'Fakultas Keguruan & Ilmu Pendidikan', study_program: 'Pendidikan Matematika', phone: '081234567018' },
    { email: 'tania.adriani@mhs.cepat.ac.id', full_name: 'Tania Adriani', nim_nip: '2024060003', faculty: 'Fakultas Keguruan & Ilmu Pendidikan', study_program: 'Pendidikan Bahasa Inggris', phone: '081234567019' },
    { email: 'arif.budiman@mhs.cepat.ac.id', full_name: 'Arif Budiman', nim_nip: '2024060004', faculty: 'Fakultas Keguruan & Ilmu Pendidikan', study_program: 'Pendidikan Bahasa Inggris', phone: '081234567020' },
];

const PASSWORD = 'Mhs@12345';

async function cleanOldData() {
    console.log('🧹 Membersihkan data lama...');

    // List existing users with @mhs.cepat.ac.id
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 100 });
    if (error) {
        console.log('  Warning listing users:', error.message);
        return;
    }

    const oldUsers = users.filter(u => u.email?.includes('@mhs.cepat.ac.id'));
    if (oldUsers.length > 0) {
        console.log(`  Found ${oldUsers.length} old student users, deleting...`);
        for (const u of oldUsers) {
            // Delete profile first
            await supabase.from('profiles').delete().eq('id', u.id);
            // Delete auth user
            const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
            if (delErr) {
                console.log(`  Warning deleting ${u.email}: ${delErr.message}`);
            } else {
                console.log(`  Deleted: ${u.email}`);
            }
        }
    } else {
        console.log('  No old data found.');
    }
    console.log('');
}

async function seedStudents() {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  SEED 20 MAHASISWA — UNIVERSITAS CEPAT  ║');
    console.log('║  (Service Role — No Rate Limit)         ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    // Clean old data first
    await cleanOldData();

    console.log('🚀 Membuat 20 akun mahasiswa...\n');

    let success = 0;
    let failed = 0;

    for (let i = 0; i < students.length; i++) {
        const s = students[i];
        const tag = `[${String(i + 1).padStart(2, ' ')}/${students.length}]`;

        try {
            // Use admin.createUser — no rate limit, no email confirmation needed
            const { data, error } = await supabase.auth.admin.createUser({
                email: s.email,
                password: PASSWORD,
                email_confirm: true, // Auto-confirm email
                user_metadata: {
                    full_name: s.full_name,
                    role: 'mahasiswa',
                }
            });

            if (error) throw error;

            const userId = data.user.id;

            // Upsert profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: s.email,
                    full_name: s.full_name,
                    nim_nip: s.nim_nip,
                    role: 'mahasiswa',
                    faculty: s.faculty,
                    study_program: s.study_program,
                    phone: s.phone,
                    status: 'active',
                }, { onConflict: 'id' });

            if (profileError) throw profileError;

            console.log(`${tag} ✅ ${s.full_name.padEnd(25)} ${s.nim_nip}  ${s.study_program}`);
            success++;

        } catch (err) {
            console.log(`${tag} ❌ ${s.full_name}: ${err.message}`);
            failed++;
        }
    }

    console.log('');
    console.log('═'.repeat(55));
    console.log(`📊 Hasil: ${success} berhasil, ${failed} gagal`);
    console.log('═'.repeat(55));
    console.log('');

    if (success > 0) {
        console.log('🔑 PASSWORD SEMUA AKUN: Mhs@12345');
        console.log('');
    }
}

seedStudents();
