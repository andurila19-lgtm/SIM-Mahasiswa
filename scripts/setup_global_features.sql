-- =========================================================
-- GLOBAL SYSTEM FEATURES - DATABASE SETUP
-- Jalankan di Supabase SQL Editor
-- =========================================================

-- 1. Tabel ROLES & PERMISSIONS Dasar
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Roles
INSERT INTO roles (name, display_name) VALUES
    ('superadmin', 'Super Administrator'),
    ('mahasiswa', 'Mahasiswa'),
    ('dosen', 'Dosen'),
    ('akademik', 'Staff Akademik'),
    ('keuangan', 'Staff Keuangan')
ON CONFLICT (name) DO NOTHING;

-- 2. Audit Log System
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT, -- ID dari profiles/auth.users
    user_role VARCHAR(50),
    action VARCHAR(255) NOT NULL, -- e.g., 'INSERT_KRS', 'UPDATE_GRADE'
    module VARCHAR(100), -- e.g., 'KRS', 'Nilai', 'Pembayaran'
    entity_id TEXT, -- ID dari record yang diubah
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for log searching
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);

-- 3. Soft Delete Implementation
-- Tambahkan deleted_at ke tabel utama
DO $$ 
BEGIN 
    -- Profiles already has it in some implementations, but let's ensure
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    -- student_bills
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_bills' AND column_name = 'deleted_at') THEN
        ALTER TABLE student_bills ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    -- student_krs
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_krs' AND column_name = 'deleted_at') THEN
        ALTER TABLE student_krs ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    -- announcements
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'deleted_at') THEN
        ALTER TABLE announcements ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- 4. Academic Data Structure Enhancement
-- Tabels mata_kuliah, jadwal, krs, nilai, pembayaran sudah ada di migration sebelumnya
-- Namun kita pastikan relasi foreign key sinkron

-- 5. Dashboard Charts Support Function
-- View for Financial Summary
CREATE OR REPLACE VIEW v_finance_overview AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    status,
    COUNT(*) as bill_count,
    SUM(amount) as total_amount
FROM student_bills
WHERE deleted_at IS NULL
GROUP BY month, status
ORDER BY month DESC;

-- View for Student Distribution by Study Program
CREATE OR REPLACE VIEW v_student_distribution AS
SELECT 
    study_program,
    faculty,
    COUNT(*) as student_count
FROM profiles
WHERE role = 'mahasiswa' AND deleted_at IS NULL
GROUP BY study_program, faculty;

-- 6. Trigger for Audit Logging (Example)
-- Function to log profile updates
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (user_id, user_role, action, module, entity_id, old_data, new_data)
        VALUES (
            COALESCE(NEW.id, OLD.id),
            NEW.role,
            'UPDATE_PROFILE',
            'User Management',
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only enable if needed to avoid overhead, but this is for proof of concept
-- CREATE TRIGGER trg_log_profile_updates
-- AFTER UPDATE ON profiles
-- FOR EACH ROW EXECUTE FUNCTION log_profile_changes();

-- 7. Add Pagination Support if not already on the client side
-- Note: Supabase naturally supports pagination via range()

SELECT 'Global system features database setup complete!' AS status;
