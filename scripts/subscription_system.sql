-- =========================================================
-- SaaS SUBSCRIPTION SYSTEM MIGRATION
-- =========================================================

-- 1. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    plan_name VARCHAR(50) NOT NULL CHECK (plan_name IN ('Basic', 'Pro', 'Enterprise')),
    price NUMERIC(15, 2) DEFAULT 0,
    max_students INTEGER DEFAULT 100,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_subs_campus ON subscriptions(campus_id);

-- 2. Function to check if subscription is valid
CREATE OR REPLACE FUNCTION is_subscription_valid(p_campus_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM subscriptions 
        WHERE campus_id = p_campus_id 
        AND status = 'active' 
        AND end_date > NOW()
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. VALIDATION TRIGGER: Max Student Limit
CREATE OR REPLACE FUNCTION validate_student_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_max_students INTEGER;
    v_current_count INTEGER;
BEGIN
    -- Only check for student role
    IF NEW.role = 'mahasiswa' THEN
        -- Get limit from active subscription
        SELECT max_students INTO v_max_students 
        FROM subscriptions 
        WHERE campus_id = NEW.campus_id 
        AND status = 'active' 
        AND end_date > NOW()
        LIMIT 1;

        -- Get current count for this campus
        SELECT COUNT(*) INTO v_current_count 
        FROM profiles 
        WHERE campus_id = NEW.campus_id 
        AND role = 'mahasiswa' 
        AND deleted_at IS NULL;

        IF v_current_count >= v_max_students THEN
            RAISE EXCEPTION 'Kuota mahasiswa untuk paket ini telah penuh (% dari %). Silakan upgrade paket Anda.', v_current_count, v_max_students;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_limit_students ON profiles;
CREATE TRIGGER trg_limit_students
BEFORE INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION validate_student_limit();

-- 4. VIEW for Admin: Subscription Status
CREATE OR REPLACE VIEW v_campus_subscription_status AS
SELECT 
    c.id as campus_id,
    c.name as campus_name,
    s.plan_name,
    s.max_students,
    (SELECT COUNT(*) FROM profiles p WHERE p.campus_id = c.id AND p.role = 'mahasiswa') as current_students,
    s.end_date,
    CASE 
        WHEN s.end_date < NOW() OR s.status != 'active' THEN 'Locked'
        ELSE 'Active'
    END as access_status
FROM campuses c
LEFT JOIN subscriptions s ON c.id = s.campus_id
WHERE s.id IS NULL OR s.created_at = (SELECT MAX(created_at) FROM subscriptions WHERE campus_id = c.id);

SELECT 'Subscription system database setup complete!' AS status;
