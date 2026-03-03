-- =========================================================
-- SAAS MULTI-TENANT MIGRATION SCRIPT
-- =========================================================

-- 1. Create Campuses Table
CREATE TABLE IF NOT EXISTS campuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    domain VARCHAR(100) UNIQUE, -- e.g., 'itb.sim.id'
    subscription_plan VARCHAR(50) DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add campus_id to All Core Tables (Idempotent)
DO $$ 
BEGIN 
    -- profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='campus_id') THEN
        ALTER TABLE profiles ADD COLUMN campus_id UUID REFERENCES campuses(id);
    END IF;

    -- academic_years
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='academic_years' AND column_name='campus_id') THEN
        ALTER TABLE academic_years ADD COLUMN campus_id UUID REFERENCES campuses(id);
    END IF;

    -- study_programs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_programs' AND column_name='campus_id') THEN
        ALTER TABLE study_programs ADD COLUMN campus_id UUID REFERENCES campuses(id);
    END IF;

    -- courses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='campus_id') THEN
        ALTER TABLE courses ADD COLUMN campus_id UUID REFERENCES campuses(id);
    END IF;

    -- classes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='campus_id') THEN
        ALTER TABLE classes ADD COLUMN campus_id UUID REFERENCES campuses(id);
    END IF;

    -- rooms
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='campus_id') THEN
        ALTER TABLE rooms ADD COLUMN campus_id UUID REFERENCES campuses(id);
    END IF;

    -- student_krs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_krs' AND column_name='campus_id') THEN
        ALTER TABLE student_krs ADD COLUMN campus_id UUID REFERENCES campuses(id);
    END IF;

    -- student_grades
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_grades' AND column_name='campus_id') THEN
        ALTER TABLE student_grades ADD COLUMN campus_id UUID REFERENCES campuses(id);
    END IF;

    -- student_bills
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_bills' AND column_name='campus_id') THEN
        ALTER TABLE student_bills ADD COLUMN campus_id UUID REFERENCES campuses(id);
    END IF;

    -- audit_logs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='campus_id') THEN
        ALTER TABLE audit_logs ADD COLUMN campus_id UUID REFERENCES campuses(id);
    END IF;
END $$;

-- 3. Helper Function to get current Campus Context from JWT
CREATE OR REPLACE FUNCTION get_current_campus_id()
RETURNS UUID AS $$
BEGIN
  -- Mengambil campus_id dari JWT claim 'campus_id' yang di-inject Firebase/Supabase
  RETURN (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'campus_id')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. IMPLEMENTASI RLS POLICY (Batas Suci Data Kampus)
-- Aktifkan RLS dan buat policy untuk isolasi tenant

-- Profiles Isolation
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Profile" ON profiles;
CREATE POLICY "Tenant Isolation Profile" ON profiles FOR ALL USING (campus_id = get_current_campus_id());

-- KRS Isolation
ALTER TABLE student_krs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation KRS" ON student_krs;
CREATE POLICY "Tenant Isolation KRS" ON student_krs FOR ALL USING (campus_id = get_current_campus_id());

-- Grades Isolation
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Grades" ON student_grades;
CREATE POLICY "Tenant Isolation Grades" ON student_grades FOR ALL USING (campus_id = get_current_campus_id());

-- Bills Isolation
ALTER TABLE student_bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Bills" ON student_bills;
CREATE POLICY "Tenant Isolation Bills" ON student_bills FOR ALL USING (campus_id = get_current_campus_id());

-- 5. Global Trigger: Auto-inject Campus ID on Insert
CREATE OR REPLACE FUNCTION set_campus_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.campus_id IS NULL THEN
        NEW.campus_id := get_current_campus_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang Trigger ke tabel pendukung
DO $$
BEGIN
    -- profiles
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_set_campus_profiles') THEN
        CREATE TRIGGER trg_set_campus_profiles BEFORE INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION set_campus_id();
    END IF;
    -- student_krs
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_set_campus_krs') THEN
        CREATE TRIGGER trg_set_campus_krs BEFORE INSERT ON student_krs FOR EACH ROW EXECUTE FUNCTION set_campus_id();
    END IF;
    -- student_bills
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_set_campus_bills') THEN
        CREATE TRIGGER trg_set_campus_bills BEFORE INSERT ON student_bills FOR EACH ROW EXECUTE FUNCTION set_campus_id();
    END IF;
END $$;

SELECT 'SaaS Multi-Tenant Migration Script saved!' AS status;
