-- =========================================================
-- SECURITY & BUSINESS LOGIC FIXES (PRODUCTION LEVEL)
-- Jalankan di Supabase SQL Editor
-- =========================================================

-- 1. Perbaikan Tabel KRS - Menghapus JSONB dan menggunakan Relasional
CREATE TABLE IF NOT EXISTS krs_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    krs_id UUID REFERENCES student_krs(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(krs_id, course_id)
);

-- 2. Fungsi Helper untuk mendapatkan Role User di level DB
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid()::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. VALIDASI BUSINESS RULES: Trigger sebelum INSERT/UPDATE KRS
CREATE OR REPLACE FUNCTION validate_krs_submission()
RETURNS TRIGGER AS $$
DECLARE
    unpaid_bills INTEGER;
    current_sks INTEGER;
BEGIN
    -- Validasi 1: Cek Pembayaran UKT (Hanya jika role mahasiswa)
    -- Admin/Akademik boleh override jika diperlukan, tapi mahasiswa tidak bisa.
    IF get_user_role() = 'mahasiswa' THEN
        SELECT COUNT(*) INTO unpaid_bills
        FROM student_bills
        WHERE student_id = NEW.student_id
        AND category = 'UKT'
        AND status IN ('unpaid', 'pending', 'partial')
        AND deleted_at IS NULL;

        IF unpaid_bills > 0 THEN
            RAISE EXCEPTION 'Mahasiswa memiliki tunggakan UKT. Pembayaran diperlukan sebelum mengisi KRS.';
        END IF;
    END IF;

    -- Validasi 2: Limit 24 SKS (Hanya jika dihitung dari krs_items nantinya)
    -- Untuk sementara kita validasi total_sks di header jika diisi manual
    IF NEW.total_sks > 24 THEN
        RAISE EXCEPTION 'Maksimal pengambilan adalah 24 SKS.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_krs ON student_krs;
CREATE TRIGGER trg_validate_krs
BEFORE INSERT OR UPDATE ON student_krs
FOR EACH ROW EXECUTE FUNCTION validate_krs_submission();

-- 4. PERBAIKAN RLS (ROW LEVEL SECURITY) - SANGAT KRITIS
-- Menghapus policy lama yang longgar
DROP POLICY IF EXISTS "Allow read student_krs" ON student_krs;
DROP POLICY IF EXISTS "Allow update student_krs" ON student_krs;

-- Policy Seleksi: Mahasiswa baca miliknya sendiri, Staff baca semua
CREATE POLICY "KRS Select Access" ON student_krs
FOR SELECT USING (
    auth.uid()::text = student_id OR 
    get_user_role() IN ('superadmin', 'akademik', 'dosen')
);

-- Policy Insert: Mahasiswa insert miliknya sendiri, Staff bebas
CREATE POLICY "KRS Insert Access" ON student_krs
FOR INSERT WITH CHECK (
    auth.uid()::text = student_id OR 
    get_user_role() IN ('superadmin', 'akademik')
);

-- Policy Update: Mahasiswa hanya bisa update jika status masih 'draft' atau 'pending' (Gagal jika 'approved')
-- Dan Mahasiswa TIDAK BISA mengubah status menjadi 'approved' sendiri
CREATE POLICY "KRS Update Access" ON student_krs
FOR UPDATE USING (
    (auth.uid()::text = student_id AND status IN ('draft', 'pending')) OR
    get_user_role() IN ('superadmin', 'akademik', 'dosen')
)
WITH CHECK (
    (
        auth.uid()::text = student_id AND 
        status IN ('draft', 'pending') AND
        (NEW.status != 'approved' OR OLD.status = 'approved') -- Mahasiswa tidak bisa approve sendiri
    ) OR
    get_user_role() IN ('superadmin', 'akademik', 'dosen')
);

-- 5. Perbaikan RLS untuk Tabel Grades (Security Policy)
DROP POLICY IF EXISTS "Allow update student_grades" ON student_grades;
CREATE POLICY "Lecturer manage grades" ON student_grades
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM classes WHERE id = class_id AND lecturer_id = auth.uid()::text) OR
    get_user_role() = 'superadmin'
)
WITH CHECK (
    is_locked = false -- Database Level Lock
);

-- 6. Audit Log Trigger Otomatis untuk Perubahan Penting
CREATE OR REPLACE FUNCTION auto_log_critical_actions()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, user_role, action, module, entity_id, old_data, new_data)
    VALUES (
        COALESCE(auth.uid()::text, 'system'),
        get_user_role(),
        TG_OP || '_' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_krs ON student_krs;
CREATE TRIGGER trg_audit_krs AFTER INSERT OR UPDATE OR DELETE ON student_krs FOR EACH ROW EXECUTE FUNCTION auto_log_critical_actions();

DROP TRIGGER IF EXISTS trg_audit_grades ON student_grades;
CREATE TRIGGER trg_audit_grades AFTER INSERT OR UPDATE OR DELETE ON student_grades FOR EACH ROW EXECUTE FUNCTION auto_log_critical_actions();

SELECT 'System Hardening Complete! RLS, Triggers, and Constraints are now active.' AS status;
