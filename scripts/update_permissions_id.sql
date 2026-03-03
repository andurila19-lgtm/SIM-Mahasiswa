-- =========================================================
-- UPDATE PERMISSIONS KE BAHASA INDONESIA
-- Jalankan di Supabase SQL Editor setelah setup_superadmin.sql
-- =========================================================

UPDATE permissions SET display_name = 'Lihat Dashboard', description = 'Akses halaman dashboard' WHERE name = 'dashboard.view';
UPDATE permissions SET display_name = 'Lihat Statistik', description = 'Melihat statistik di dashboard' WHERE name = 'dashboard.stats';

UPDATE permissions SET display_name = 'Lihat Pengguna', description = 'Melihat daftar semua pengguna' WHERE name = 'users.view';
UPDATE permissions SET display_name = 'Tambah Pengguna', description = 'Membuat akun pengguna baru' WHERE name = 'users.create';
UPDATE permissions SET display_name = 'Edit Pengguna', description = 'Mengubah data pengguna' WHERE name = 'users.edit';
UPDATE permissions SET display_name = 'Hapus Pengguna', description = 'Menghapus akun pengguna' WHERE name = 'users.delete';
UPDATE permissions SET display_name = 'Reset Password', description = 'Mereset password pengguna' WHERE name = 'users.reset_password';

UPDATE permissions SET display_name = 'Lihat Mahasiswa', description = 'Melihat daftar mahasiswa' WHERE name = 'students.view';
UPDATE permissions SET display_name = 'Tambah Mahasiswa', description = 'Mendaftarkan mahasiswa baru' WHERE name = 'students.create';
UPDATE permissions SET display_name = 'Edit Mahasiswa', description = 'Mengubah data mahasiswa' WHERE name = 'students.edit';
UPDATE permissions SET display_name = 'Hapus Mahasiswa', description = 'Menghapus data mahasiswa' WHERE name = 'students.delete';

UPDATE permissions SET display_name = 'Lihat Dosen', description = 'Melihat daftar dosen' WHERE name = 'lecturers.view';
UPDATE permissions SET display_name = 'Tambah Dosen', description = 'Mendaftarkan dosen baru' WHERE name = 'lecturers.create';
UPDATE permissions SET display_name = 'Edit Dosen', description = 'Mengubah data dosen' WHERE name = 'lecturers.edit';
UPDATE permissions SET display_name = 'Hapus Dosen', description = 'Menghapus data dosen' WHERE name = 'lecturers.delete';

UPDATE permissions SET display_name = 'Lihat Akademik', description = 'Melihat data akademik' WHERE name = 'academic.view';
UPDATE permissions SET display_name = 'Kelola Akademik', description = 'Mengelola data akademik' WHERE name = 'academic.manage';
UPDATE permissions SET display_name = 'Pengaturan Tahun Akademik', description = 'Mengatur tahun akademik & semester' WHERE name = 'academic.year_settings';

UPDATE permissions SET display_name = 'Lihat Mata Kuliah', description = 'Melihat daftar mata kuliah' WHERE name = 'courses.view';
UPDATE permissions SET display_name = 'Tambah Mata Kuliah', description = 'Menambahkan mata kuliah baru' WHERE name = 'courses.create';
UPDATE permissions SET display_name = 'Edit Mata Kuliah', description = 'Mengubah data mata kuliah' WHERE name = 'courses.edit';
UPDATE permissions SET display_name = 'Hapus Mata Kuliah', description = 'Menghapus mata kuliah' WHERE name = 'courses.delete';

UPDATE permissions SET display_name = 'Lihat Program Studi', description = 'Melihat daftar program studi' WHERE name = 'prodi.view';
UPDATE permissions SET display_name = 'Tambah Program Studi', description = 'Menambahkan program studi baru' WHERE name = 'prodi.create';
UPDATE permissions SET display_name = 'Edit Program Studi', description = 'Mengubah data program studi' WHERE name = 'prodi.edit';
UPDATE permissions SET display_name = 'Hapus Program Studi', description = 'Menghapus program studi' WHERE name = 'prodi.delete';

UPDATE permissions SET display_name = 'Lihat Ruangan', description = 'Melihat daftar ruangan' WHERE name = 'rooms.view';
UPDATE permissions SET display_name = 'Tambah Ruangan', description = 'Menambahkan ruangan baru' WHERE name = 'rooms.create';
UPDATE permissions SET display_name = 'Edit Ruangan', description = 'Mengubah data ruangan' WHERE name = 'rooms.edit';
UPDATE permissions SET display_name = 'Hapus Ruangan', description = 'Menghapus ruangan' WHERE name = 'rooms.delete';

UPDATE permissions SET display_name = 'Lihat Keuangan', description = 'Melihat data keuangan' WHERE name = 'finance.view';
UPDATE permissions SET display_name = 'Kelola Keuangan', description = 'Mengelola data keuangan' WHERE name = 'finance.manage';
UPDATE permissions SET display_name = 'Verifikasi Pembayaran', description = 'Memverifikasi pembayaran mahasiswa' WHERE name = 'finance.verify';

UPDATE permissions SET display_name = 'Lihat KRS', description = 'Melihat data KRS' WHERE name = 'krs.view';
UPDATE permissions SET display_name = 'Kelola KRS', description = 'Mengelola KRS mahasiswa' WHERE name = 'krs.manage';
UPDATE permissions SET display_name = 'Verifikasi KRS', description = 'Memverifikasi KRS mahasiswa' WHERE name = 'krs.verify';

UPDATE permissions SET display_name = 'Lihat Pengumuman', description = 'Melihat daftar pengumuman' WHERE name = 'announcements.view';
UPDATE permissions SET display_name = 'Buat Pengumuman', description = 'Membuat pengumuman baru' WHERE name = 'announcements.create';
UPDATE permissions SET display_name = 'Edit Pengumuman', description = 'Mengubah pengumuman' WHERE name = 'announcements.edit';
UPDATE permissions SET display_name = 'Hapus Pengumuman', description = 'Menghapus pengumuman' WHERE name = 'announcements.delete';

UPDATE permissions SET display_name = 'Lihat Pengaturan', description = 'Melihat halaman pengaturan' WHERE name = 'settings.view';
UPDATE permissions SET display_name = 'Kelola Pengaturan', description = 'Mengubah pengaturan sistem' WHERE name = 'settings.manage';

UPDATE permissions SET display_name = 'Lihat Log Audit', description = 'Melihat riwayat aktivitas sistem' WHERE name = 'audit.view';
UPDATE permissions SET display_name = 'Lihat Laporan', description = 'Melihat laporan data' WHERE name = 'reports.view';
UPDATE permissions SET display_name = 'Export Laporan', description = 'Mengunduh data ke Excel/PDF' WHERE name = 'reports.export';

UPDATE permissions SET display_name = 'Kelola Backup', description = 'Backup & restore database' WHERE name = 'backup.manage';

UPDATE permissions SET display_name = 'Lihat Hak Akses', description = 'Melihat pengaturan role & permission' WHERE name = 'rbac.view';
UPDATE permissions SET display_name = 'Kelola Hak Akses', description = 'Mengubah role & permission' WHERE name = 'rbac.manage';

-- =========================================================
-- SEED DATA FAKULTAS & PROGRAM STUDI
-- =========================================================

-- Pastikan kolom-kolom yang dibutuhkan ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_programs' AND column_name='faculty') THEN
        ALTER TABLE study_programs ADD COLUMN faculty VARCHAR(200) NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_programs' AND column_name='degree') THEN
        ALTER TABLE study_programs ADD COLUMN degree VARCHAR(20) NOT NULL DEFAULT 'S1';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_programs' AND column_name='accreditation') THEN
        ALTER TABLE study_programs ADD COLUMN accreditation VARCHAR(10) DEFAULT 'B';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_programs' AND column_name='head_of_program') THEN
        ALTER TABLE study_programs ADD COLUMN head_of_program VARCHAR(200);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_programs' AND column_name='status') THEN
        ALTER TABLE study_programs ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_programs' AND column_name='deleted_at') THEN
        ALTER TABLE study_programs ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_programs' AND column_name='updated_at') THEN
        ALTER TABLE study_programs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Update Check Constraint untuk Jenjang (Degree)
    -- Hapus yang lama jika ada (biasanya bernama study_programs_degree_check)
    ALTER TABLE study_programs DROP CONSTRAINT IF EXISTS study_programs_degree_check;
    -- Tambahkan yang baru termasuk 'Profesi'
    ALTER TABLE study_programs ADD CONSTRAINT study_programs_degree_check 
        CHECK (degree IN ('D3', 'S1', 'S2', 'S3', 'Profesi', 'Lainnya'));
END
$$;

-- Hapus referensi FK dari courses dulu
UPDATE courses SET study_program_id = NULL WHERE study_program_id IS NOT NULL;
-- Hapus data prodi lama (seed sebelumnya)
DELETE FROM study_programs WHERE deleted_at IS NULL;

-- 1. Fakultas Keguruan dan Ilmu Pendidikan (FKIP)
INSERT INTO study_programs (code, name, faculty, degree, accreditation, status) VALUES
    ('BK', 'Bimbingan dan Konseling', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active'),
    ('PG-PAUD', 'Pendidikan Guru Pendidikan Anak Usia Dini', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active'),
    ('PGSD', 'Pendidikan Guru Sekolah Dasar', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active'),
    ('PBSI', 'Pendidikan Bahasa dan Sastra Indonesia', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active'),
    ('PBI', 'Pendidikan Bahasa Inggris', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active'),
    ('PMT', 'Pendidikan Matematika', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active'),
    ('PBIO', 'Pendidikan Biologi', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active'),
    ('PFIS', 'Pendidikan Fisika', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active'),
    ('PSEJ', 'Pendidikan Sejarah', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active'),
    ('PEKO', 'Pendidikan Ekonomi', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active'),
    ('PPKN', 'Pendidikan Pancasila dan Kewarganegaraan', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active'),
    ('PAKN', 'Pendidikan Akuntansi', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'S1', 'B', 'active')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, faculty = EXCLUDED.faculty, degree = EXCLUDED.degree, deleted_at = NULL;

-- 2. Fakultas Ekonomi dan Bisnis (FEB)
INSERT INTO study_programs (code, name, faculty, degree, accreditation, status) VALUES
    ('MN', 'Manajemen', 'Fakultas Ekonomi dan Bisnis (FEB)', 'S1', 'B', 'active'),
    ('AK', 'Akuntansi', 'Fakultas Ekonomi dan Bisnis (FEB)', 'S1', 'B', 'active'),
    ('D3MP', 'D3 Manajemen Pajak', 'Fakultas Ekonomi dan Bisnis (FEB)', 'D3', 'B', 'active')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, faculty = EXCLUDED.faculty, degree = EXCLUDED.degree, deleted_at = NULL;

-- 3. Fakultas Teknik (FT)
INSERT INTO study_programs (code, name, faculty, degree, accreditation, status) VALUES
    ('TI', 'Teknik Informatika', 'Fakultas Teknik (FT)', 'S1', 'B', 'active'),
    ('SI', 'Sistem Informasi', 'Fakultas Teknik (FT)', 'S1', 'B', 'active'),
    ('TE', 'Teknik Elektro', 'Fakultas Teknik (FT)', 'S1', 'B', 'active'),
    ('TID', 'Teknik Industri', 'Fakultas Teknik (FT)', 'S1', 'B', 'active'),
    ('TK', 'Teknik Kimia', 'Fakultas Teknik (FT)', 'S1', 'B', 'active')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, faculty = EXCLUDED.faculty, degree = EXCLUDED.degree, deleted_at = NULL;

-- 4. Fakultas Ilmu Kesehatan dan Sains (FIKS)
INSERT INTO study_programs (code, name, faculty, degree, accreditation, status) VALUES
    ('FRM', 'Farmasi', 'Fakultas Ilmu Kesehatan dan Sains (FIKS)', 'S1', 'B', 'active'),
    ('IKO', 'Ilmu Keolahragaan', 'Fakultas Ilmu Kesehatan dan Sains (FIKS)', 'S1', 'B', 'active')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, faculty = EXCLUDED.faculty, degree = EXCLUDED.degree, deleted_at = NULL;

-- 5. Fakultas Hukum (FH)
INSERT INTO study_programs (code, name, faculty, degree, accreditation, status) VALUES
    ('HK', 'Hukum', 'Fakultas Hukum (FH)', 'S1', 'B', 'active')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, faculty = EXCLUDED.faculty, degree = EXCLUDED.degree, deleted_at = NULL;

-- 6. Program Pascasarjana (S2)
INSERT INTO study_programs (code, name, faculty, degree, accreditation, status) VALUES
    ('MPBSI', 'Magister Pendidikan Bahasa dan Sastra Indonesia', 'Program Pascasarjana', 'S2', 'B', 'active'),
    ('MPIPS', 'Magister Pendidikan Ilmu Pengetahuan Sosial', 'Program Pascasarjana', 'S2', 'B', 'active'),
    ('MPD', 'Magister Pendidikan Dasar', 'Program Pascasarjana', 'S2', 'B', 'active')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, faculty = EXCLUDED.faculty, degree = EXCLUDED.degree, deleted_at = NULL;

-- 7. Program Profesi
INSERT INTO study_programs (code, name, faculty, degree, accreditation, status) VALUES
    ('PPG', 'Pendidikan Profesi Guru', 'Program Profesi', 'Profesi', 'B', 'active')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, faculty = EXCLUDED.faculty, degree = EXCLUDED.degree, deleted_at = NULL;

SELECT 'Permissions & data program studi berhasil diperbarui!' AS status;
