-- =========================================================
-- PLATFORM ADMIN - ROLE & RLS BYPASS
-- =========================================================

-- 1. Tambahkan role platform_admin ke sistem
-- platform_admin TIDAK memiliki campus_id (null)
-- Ini membedakannya dari superadmin kampus yang PUNYA campus_id

-- 2. Update RLS agar platform_admin bisa bypass semua isolasi tenant
-- Kita perlu update semua policy yang sudah ada

-- Helper: Cek apakah user adalah platform_admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid()::text 
        AND role = 'platform_admin'
        AND campus_id IS NULL
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Update RLS Policy - Profiles: Platform admin bisa lihat semua
DROP POLICY IF EXISTS "Tenant Isolation Profile" ON profiles;
CREATE POLICY "Tenant Isolation Profile" ON profiles FOR ALL USING (
    campus_id = get_current_campus_id() 
    OR is_platform_admin() 
    OR campus_id IS NULL -- platform_admin tidak punya campus_id
);

-- 4. Update RLS Policy - KRS
DROP POLICY IF EXISTS "Tenant Isolation KRS" ON student_krs;
CREATE POLICY "Tenant Isolation KRS" ON student_krs FOR ALL USING (
    campus_id = get_current_campus_id() OR is_platform_admin()
);

-- 5. Update RLS Policy - Grades
DROP POLICY IF EXISTS "Tenant Isolation Grades" ON student_grades;
CREATE POLICY "Tenant Isolation Grades" ON student_grades FOR ALL USING (
    campus_id = get_current_campus_id() OR is_platform_admin()
);

-- 6. Update RLS Policy - Bills
DROP POLICY IF EXISTS "Tenant Isolation Bills" ON student_bills;
CREATE POLICY "Tenant Isolation Bills" ON student_bills FOR ALL USING (
    campus_id = get_current_campus_id() OR is_platform_admin()
);

-- 7. Campuses & Subscriptions: Hanya platform_admin yang bisa kelola
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform Admin Campuses" ON campuses;
CREATE POLICY "Platform Admin Campuses" ON campuses FOR ALL USING (
    is_platform_admin() OR id = get_current_campus_id()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform Admin Subscriptions" ON subscriptions;
CREATE POLICY "Platform Admin Subscriptions" ON subscriptions FOR ALL USING (
    is_platform_admin() OR campus_id = get_current_campus_id()
);

SELECT 'Platform Admin role and RLS bypass configured!' AS status;
