const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU2NjksImV4cCI6MjA4Nzk2MTY2OX0.22Sx7rEi5KThH04rlX53sAUu-_XxdtmrM0eb5K_6o1M';
const supabase = createClient(supabaseUrl, supabaseKey);

const students = [
    // Fakultas Teknik
    { email: 'ahmad.rizki@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Ahmad Rizki Pratama', nim_nip: '2024010001', faculty: 'Fakultas Teknik', study_program: 'Teknik Informatika', phone: '081234567001' },
    { email: 'siti.nurhaliza@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Siti Nurhaliza Putri', nim_nip: '2024010002', faculty: 'Fakultas Teknik', study_program: 'Teknik Informatika', phone: '081234567002' },
    { email: 'budi.santoso@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Budi Santoso', nim_nip: '2024010003', faculty: 'Fakultas Teknik', study_program: 'Teknik Sipil', phone: '081234567003' },
    { email: 'dewi.lestari@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Dewi Lestari', nim_nip: '2024010004', faculty: 'Fakultas Teknik', study_program: 'Teknik Sipil', phone: '081234567004' },

    // Fakultas Ekonomi & Bisnis
    { email: 'rina.wulandari@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Rina Wulandari', nim_nip: '2024020001', faculty: 'Fakultas Ekonomi & Bisnis', study_program: 'Manajemen', phone: '081234567005' },
    { email: 'fajar.nugroho@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Fajar Nugroho', nim_nip: '2024020002', faculty: 'Fakultas Ekonomi & Bisnis', study_program: 'Manajemen', phone: '081234567006' },
    { email: 'maya.sari@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Maya Anggraeni Sari', nim_nip: '2024020003', faculty: 'Fakultas Ekonomi & Bisnis', study_program: 'Akuntansi', phone: '081234567007' },
    { email: 'rendi.hidayat@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Rendi Hidayat', nim_nip: '2024020004', faculty: 'Fakultas Ekonomi & Bisnis', study_program: 'Akuntansi', phone: '081234567008' },

    // Fakultas Hukum
    { email: 'nadia.permata@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Nadia Permata Sari', nim_nip: '2024030001', faculty: 'Fakultas Hukum', study_program: 'Ilmu Hukum', phone: '081234567009' },
    { email: 'dimas.prasetyo@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Dimas Prasetyo', nim_nip: '2024030002', faculty: 'Fakultas Hukum', study_program: 'Ilmu Hukum', phone: '081234567010' },

    // Fakultas Kedokteran
    { email: 'laras.kusumaningrum@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Laras Kusumaningrum', nim_nip: '2024040001', faculty: 'Fakultas Kedokteran', study_program: 'Pendidikan Dokter', phone: '081234567011' },
    { email: 'galih.ramadhan@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Galih Ramadhan', nim_nip: '2024040002', faculty: 'Fakultas Kedokteran', study_program: 'Pendidikan Dokter', phone: '081234567012' },
    { email: 'anisa.fitri@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Anisa Fitri Handayani', nim_nip: '2024040003', faculty: 'Fakultas Kedokteran', study_program: 'Farmasi', phone: '081234567013' },

    // Fakultas Ilmu Sosial & Politik
    { email: 'yoga.aditya@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Yoga Aditya Putra', nim_nip: '2024050001', faculty: 'Fakultas Ilmu Sosial & Politik', study_program: 'Ilmu Komunikasi', phone: '081234567014' },
    { email: 'putri.rahayu@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Putri Rahayu', nim_nip: '2024050002', faculty: 'Fakultas Ilmu Sosial & Politik', study_program: 'Ilmu Komunikasi', phone: '081234567015' },
    { email: 'hendra.wijaya@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Hendra Wijaya', nim_nip: '2024050003', faculty: 'Fakultas Ilmu Sosial & Politik', study_program: 'Administrasi Publik', phone: '081234567016' },

    // Fakultas Keguruan & Ilmu Pendidikan
    { email: 'indah.permatasari@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Indah Permatasari', nim_nip: '2024060001', faculty: 'Fakultas Keguruan & Ilmu Pendidikan', study_program: 'Pendidikan Matematika', phone: '081234567017' },
    { email: 'rizal.fahmi@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Rizal Fahmi', nim_nip: '2024060002', faculty: 'Fakultas Keguruan & Ilmu Pendidikan', study_program: 'Pendidikan Matematika', phone: '081234567018' },
    { email: 'tania.adriani@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Tania Adriani', nim_nip: '2024060003', faculty: 'Fakultas Keguruan & Ilmu Pendidikan', study_program: 'Pendidikan Bahasa Inggris', phone: '081234567019' },
    { email: 'arif.budiman@mhs.cepat.ac.id', password: 'Mhs@12345', full_name: 'Arif Budiman', nim_nip: '2024060004', faculty: 'Fakultas Keguruan & Ilmu Pendidikan', study_program: 'Pendidikan Bahasa Inggris', phone: '081234567020' },
];

async function seedStudents() {
    console.log('🚀 Mulai memasukkan 20 data mahasiswa...\n');

    let success = 0;
    let failed = 0;

    for (const student of students) {
        try {
            // 1. Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: student.email,
                password: student.password,
                options: {
                    data: {
                        full_name: student.full_name,
                        role: 'mahasiswa',
                    }
                }
            });

            if (authError) {
                // If user already exists, try to get their ID
                if (authError.message.includes('already registered')) {
                    console.log(`⚠️  ${student.full_name} (${student.email}) - sudah terdaftar, skip...`);
                    failed++;
                    continue;
                }
                throw authError;
            }

            const userId = authData.user?.id;
            if (!userId) {
                console.log(`⚠️  ${student.full_name} - no user ID returned, skip...`);
                failed++;
                continue;
            }

            // 2. Upsert profile 
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: student.email,
                    full_name: student.full_name,
                    nim_nip: student.nim_nip,
                    role: 'mahasiswa',
                    faculty: student.faculty,
                    study_program: student.study_program,
                    phone: student.phone,
                    status: 'active',
                }, { onConflict: 'id' });

            if (profileError) throw profileError;

            console.log(`✅ ${student.full_name} (${student.nim_nip}) - ${student.faculty} / ${student.study_program}`);
            success++;

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 1500));

        } catch (err) {
            console.log(`❌ ${student.full_name}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📊 Hasil: ${success} berhasil, ${failed} gagal`);
    console.log(`${'═'.repeat(60)}\n`);

    // Sign out after seeding
    await supabase.auth.signOut();
}

seedStudents();
