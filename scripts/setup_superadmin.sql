-- =========================================================
-- SUPER ADMIN FEATURES - DATABASE SETUP
-- Run this in Supabase SQL Editor
-- =========================================================

-- 1. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    module VARCHAR(100) NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ROLE_PERMISSIONS TABLE (junction)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- 3. ACADEMIC_YEARS TABLE
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('ganjil', 'genap')),
    is_active BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4. STUDY_PROGRAMS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS study_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    faculty VARCHAR(200) NOT NULL,
    degree VARCHAR(20) NOT NULL DEFAULT 'S1',
    accreditation VARCHAR(10) DEFAULT 'B',
    head_of_program VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 5. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    building VARCHAR(100),
    floor INTEGER DEFAULT 1,
    capacity INTEGER DEFAULT 30,
    type VARCHAR(50) DEFAULT 'kelas' CHECK (type IN ('kelas', 'lab', 'auditorium', 'ruang_dosen', 'lainnya')),
    facilities TEXT,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'unavailable')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 6. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    user_email VARCHAR(200),
    user_role VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    target_id UUID,
    target_type VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ADD deleted_at columns to existing tables (soft delete)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='deleted_at') THEN
        ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END
$$;

-- 8. SEED DEFAULT PERMISSIONS
INSERT INTO permissions (name, display_name, description, module) VALUES
    -- Dashboard
    ('dashboard.view', 'View Dashboard', 'Melihat dashboard', 'dashboard'),
    ('dashboard.stats', 'View Statistics', 'Melihat statistik dashboard', 'dashboard'),
    
    -- User Management
    ('users.view', 'View Users', 'Melihat daftar user', 'users'),
    ('users.create', 'Create Users', 'Membuat user baru', 'users'),
    ('users.edit', 'Edit Users', 'Mengedit data user', 'users'),
    ('users.delete', 'Delete Users', 'Menghapus user', 'users'),
    ('users.reset_password', 'Reset Password', 'Mereset password user', 'users'),
    
    -- Student Management
    ('students.view', 'View Students', 'Melihat daftar mahasiswa', 'students'),
    ('students.create', 'Create Students', 'Mendaftarkan mahasiswa baru', 'students'),
    ('students.edit', 'Edit Students', 'Mengedit data mahasiswa', 'students'),
    ('students.delete', 'Delete Students', 'Menghapus mahasiswa', 'students'),
    
    -- Lecturer Management
    ('lecturers.view', 'View Lecturers', 'Melihat daftar dosen', 'lecturers'),
    ('lecturers.create', 'Create Lecturers', 'Mendaftarkan dosen baru', 'lecturers'),
    ('lecturers.edit', 'Edit Lecturers', 'Mengedit data dosen', 'lecturers'),
    ('lecturers.delete', 'Delete Lecturers', 'Menghapus dosen', 'lecturers'),
    
    -- Academic
    ('academic.view', 'View Academic', 'Melihat data akademik', 'academic'),
    ('academic.manage', 'Manage Academic', 'Mengelola akademik', 'academic'),
    ('academic.year_settings', 'Academic Year Settings', 'Mengatur tahun akademik', 'academic'),
    
    -- Courses
    ('courses.view', 'View Courses', 'Melihat mata kuliah', 'courses'),
    ('courses.create', 'Create Courses', 'Menambah mata kuliah', 'courses'),
    ('courses.edit', 'Edit Courses', 'Mengedit mata kuliah', 'courses'),
    ('courses.delete', 'Delete Courses', 'Menghapus mata kuliah', 'courses'),
    
    -- Study Programs
    ('prodi.view', 'View Study Programs', 'Melihat program studi', 'prodi'),
    ('prodi.create', 'Create Study Programs', 'Menambah program studi', 'prodi'),
    ('prodi.edit', 'Edit Study Programs', 'Mengedit program studi', 'prodi'),
    ('prodi.delete', 'Delete Study Programs', 'Menghapus program studi', 'prodi'),
    
    -- Rooms
    ('rooms.view', 'View Rooms', 'Melihat ruangan', 'rooms'),
    ('rooms.create', 'Create Rooms', 'Menambah ruangan', 'rooms'),
    ('rooms.edit', 'Edit Rooms', 'Mengedit ruangan', 'rooms'),
    ('rooms.delete', 'Delete Rooms', 'Menghapus ruangan', 'rooms'),
    
    -- Finance
    ('finance.view', 'View Finance', 'Melihat data keuangan', 'finance'),
    ('finance.manage', 'Manage Finance', 'Mengelola keuangan', 'finance'),
    ('finance.verify', 'Verify Payments', 'Memverifikasi pembayaran', 'finance'),
    
    -- KRS
    ('krs.view', 'View KRS', 'Melihat KRS', 'krs'),
    ('krs.manage', 'Manage KRS', 'Mengelola KRS mahasiswa', 'krs'),
    ('krs.verify', 'Verify KRS', 'Memverifikasi KRS', 'krs'),
    
    -- Announcements
    ('announcements.view', 'View Announcements', 'Melihat pengumuman', 'announcements'),
    ('announcements.create', 'Create Announcements', 'Membuat pengumuman', 'announcements'),
    ('announcements.edit', 'Edit Announcements', 'Mengedit pengumuman', 'announcements'),
    ('announcements.delete', 'Delete Announcements', 'Menghapus pengumuman', 'announcements'),
    
    -- Settings
    ('settings.view', 'View Settings', 'Melihat pengaturan', 'settings'),
    ('settings.manage', 'Manage Settings', 'Mengelola pengaturan', 'settings'),
    
    -- Audit & Reports
    ('audit.view', 'View Audit Logs', 'Melihat log audit', 'audit'),
    ('reports.view', 'View Reports', 'Melihat laporan', 'reports'),
    ('reports.export', 'Export Reports', 'Export data ke Excel/PDF', 'reports'),
    
    -- Backup
    ('backup.manage', 'Manage Backup', 'Backup & restore database', 'backup'),
    
    -- RBAC
    ('rbac.view', 'View RBAC', 'Melihat role & permissions', 'rbac'),
    ('rbac.manage', 'Manage RBAC', 'Mengelola role & permissions', 'rbac')
ON CONFLICT (name) DO NOTHING;

-- 9. SEED DEFAULT ROLE PERMISSIONS

-- Superadmin gets ALL permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'superadmin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Akademik permissions  
INSERT INTO role_permissions (role, permission_id)
SELECT 'akademik', id FROM permissions WHERE name IN (
    'dashboard.view', 'dashboard.stats',
    'students.view', 'students.edit',
    'lecturers.view',
    'academic.view', 'academic.manage',
    'courses.view', 'courses.create', 'courses.edit',
    'prodi.view',
    'rooms.view',
    'krs.view', 'krs.manage', 'krs.verify',
    'announcements.view', 'announcements.create',
    'reports.view', 'reports.export'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Keuangan permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'keuangan', id FROM permissions WHERE name IN (
    'dashboard.view', 'dashboard.stats',
    'students.view',
    'finance.view', 'finance.manage', 'finance.verify',
    'announcements.view',
    'reports.view', 'reports.export'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Dosen permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'dosen', id FROM permissions WHERE name IN (
    'dashboard.view',
    'students.view',
    'courses.view',
    'krs.view',
    'announcements.view'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Mahasiswa permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'mahasiswa', id FROM permissions WHERE name IN (
    'dashboard.view',
    'krs.view',
    'announcements.view',
    'finance.view'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- 10. INDEXES
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_academic_years_active ON academic_years(is_active);

-- 11. RLS POLICIES (basic, Supabase service role bypasses these)
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_programs ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated (drop first to be idempotent)
DROP POLICY IF EXISTS "Allow read permissions" ON permissions;
CREATE POLICY "Allow read permissions" ON permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read role_permissions" ON role_permissions;
CREATE POLICY "Allow read role_permissions" ON role_permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read academic_years" ON academic_years;
CREATE POLICY "Allow read academic_years" ON academic_years FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read rooms" ON rooms;
CREATE POLICY "Allow read rooms" ON rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read study_programs" ON study_programs;
CREATE POLICY "Allow read study_programs" ON study_programs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read audit_logs" ON audit_logs;
CREATE POLICY "Allow read audit_logs" ON audit_logs FOR SELECT USING (true);

-- Allow full access via service role (already default for service role key)
DROP POLICY IF EXISTS "Allow insert permissions" ON permissions;
CREATE POLICY "Allow insert permissions" ON permissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update permissions" ON permissions;
CREATE POLICY "Allow update permissions" ON permissions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete permissions" ON permissions;
CREATE POLICY "Allow delete permissions" ON permissions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow insert role_permissions" ON role_permissions;
CREATE POLICY "Allow insert role_permissions" ON role_permissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update role_permissions" ON role_permissions;
CREATE POLICY "Allow update role_permissions" ON role_permissions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete role_permissions" ON role_permissions;
CREATE POLICY "Allow delete role_permissions" ON role_permissions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow insert academic_years" ON academic_years;
CREATE POLICY "Allow insert academic_years" ON academic_years FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update academic_years" ON academic_years;
CREATE POLICY "Allow update academic_years" ON academic_years FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete academic_years" ON academic_years;
CREATE POLICY "Allow delete academic_years" ON academic_years FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow insert rooms" ON rooms;
CREATE POLICY "Allow insert rooms" ON rooms FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update rooms" ON rooms;
CREATE POLICY "Allow update rooms" ON rooms FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete rooms" ON rooms;
CREATE POLICY "Allow delete rooms" ON rooms FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow insert study_programs" ON study_programs;
CREATE POLICY "Allow insert study_programs" ON study_programs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update study_programs" ON study_programs;
CREATE POLICY "Allow update study_programs" ON study_programs FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete study_programs" ON study_programs;
CREATE POLICY "Allow delete study_programs" ON study_programs FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow insert audit_logs" ON audit_logs;
CREATE POLICY "Allow insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);

SELECT 'Super Admin database setup complete!' AS status;
