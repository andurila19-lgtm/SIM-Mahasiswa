-- =========================================================
-- DOSEN FEATURES - DATABASE SETUP
-- Jalankan di Supabase SQL Editor
-- =========================================================

-- 1. Tambah Permissions Khusus Dosen (Bahasa Indonesia)
INSERT INTO permissions (name, display_name, description, module) VALUES
    ('lecturer.schedule', 'Lihat Jadwal Mengajar', 'Melihat jadwal mengajar dosen', 'lecturers'),
    ('lecturer.classes', 'Kelola Kelas', 'Melihat daftar mahasiswa per kelas', 'lecturers'),
    ('lecturer.grades.input', 'Input Nilai', 'Memasukkan nilai mahasiswa', 'lecturers'),
    ('lecturer.grades.edit', 'Edit Nilai', 'Mengubah nilai sebelum finalisasi', 'lecturers'),
    ('lecturer.grades.lock', 'Kunci Nilai', 'Mengunci nilai agar tidak bisa diubah', 'lecturers'),
    ('lecturer.krs.approve', 'Approve KRS', 'Menyetujui KRS mahasiswa bimbingan', 'lecturers'),
    ('lecturer.attendance', 'Input Presensi', 'Mencatat kehadiran mahasiswa', 'lecturers'),
    ('lecturer.materials', 'Upload Materi', 'Menggah materi perkuliahan', 'lecturers'),
    ('lecturer.history', 'Riwayat Pengajaran', 'Melihat riwayat mengajar', 'lecturers')
ON CONFLICT (name) DO UPDATE SET 
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description;

-- 2. Update Role Permissions untuk Dosen
INSERT INTO role_permissions (role, permission_id)
SELECT 'dosen', id FROM permissions WHERE name LIKE 'lecturer.%'
ON CONFLICT (role, permission_id) DO NOTHING;

-- 3. Tabel MATA KULIAH (Courses)
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    sks INTEGER NOT NULL DEFAULT 2,
    study_program_id UUID REFERENCES study_programs(id) ON DELETE CASCADE,
    semester INTEGER DEFAULT 1,
    type VARCHAR(20) DEFAULT 'Wajib' CHECK (type IN ('Wajib', 'Pilihan')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4. Tabel KELAS (Sections/Classes)
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lecturer_id TEXT NOT NULL REFERENCES profiles(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    name VARCHAR(50) NOT NULL, -- Contoh: TI-A, TI-B
    day VARCHAR(20) NOT NULL, -- Senin, Selasa, dst
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100),
    capacity INTEGER DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 5. Tabel JADWAL (Schedules) - Optional jika ingin multiple jadwal per kelas
-- Untuk sekarang kita gunakan kolom di 'classes' agar kompatibel dengan FE yang ada


-- 6. Tabel NILAI (Grades)
-- Catatan: Kita bisa menghubungkan ini ke krs_items atau student_id + class_id
CREATE TABLE IF NOT EXISTS student_grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES profiles(id),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    tasks_score NUMERIC(5,2) DEFAULT 0 CHECK (tasks_score BETWEEN 0 AND 100),
    uts_score NUMERIC(5,2) DEFAULT 0 CHECK (uts_score BETWEEN 0 AND 100),
    uas_score NUMERIC(5,2) DEFAULT 0 CHECK (uas_score BETWEEN 0 AND 100),
    final_score NUMERIC(5,2) DEFAULT 0,
    grade_letter VARCHAR(2), -- A, B+, B, C, D, E
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, class_id)
);

-- 7. Tabel PRESENSI (Attendance)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES profiles(id),
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'hadir' CHECK (status IN ('hadir', 'sakit', 'izin', 'alpha')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, student_id, session_date)
);

-- 8. Tabel MATERI (Materials)
CREATE TABLE IF NOT EXISTS materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_url TEXT,
    file_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tambah Indexes untuk Performa
CREATE INDEX IF NOT EXISTS idx_classes_lecturer ON classes(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_student ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_date);

-- 10. Tambah RLS Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users
CREATE POLICY "Allow read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Allow read classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Allow read student_grades" ON student_grades FOR SELECT USING (true);
CREATE POLICY "Allow read attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow read materials" ON materials FOR SELECT USING (true);

-- Allow lecturer to manage their own classes data
CREATE POLICY "Lecturer can update grades" ON student_grades FOR UPDATE 
USING (EXISTS (SELECT 1 FROM classes WHERE id = class_id AND lecturer_id = auth.uid()::text))
WITH CHECK (is_locked = false); -- Validasi: Nilai tidak bisa diubah setelah lock

CREATE POLICY "Lecturer can manage attendance" ON attendance FOR ALL
USING (EXISTS (SELECT 1 FROM classes WHERE id = class_id AND lecturer_id = auth.uid()::text));

CREATE POLICY "Lecturer can manage materials" ON materials FOR ALL
USING (EXISTS (SELECT 1 FROM classes WHERE id = class_id AND lecturer_id = auth.uid()::text));

-- 11. Tabel PENGAJUAN KRS (KRS Submissions)
CREATE TABLE IF NOT EXISTS student_krs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES profiles(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    semester INTEGER NOT NULL,
    total_sks INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    courses JSONB DEFAULT '[]', -- Menyimpan daftar matkul yang diambil (ID, Nama, SKS)
    approved_by TEXT REFERENCES profiles(id), -- Dosen Pembimbing / Wali
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id, semester)
);

ALTER TABLE student_krs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read student_krs" ON student_krs FOR SELECT USING (true);
CREATE POLICY "Allow update student_krs" ON student_krs FOR UPDATE USING (true);

SELECT 'Lecturer features database setup complete!' AS status;
