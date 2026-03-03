-- =========================================================
-- PRODUCTION SECURITY - DATABASE MIGRATION
-- =========================================================

-- 1. Login Attempts Table (Brute Force Protection)
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(200) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    failure_reason VARCHAR(100),
    campus_id UUID REFERENCES campuses(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at DESC);

-- 2. Two-Factor Auth Secrets
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    secret_key TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    backup_codes JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Active Sessions Table (Activity Monitoring)
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_info JSONB,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON active_sessions(is_active, expires_at);

-- 4. Error Logs Table (System Error Logging)
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_type VARCHAR(50) NOT NULL, -- 'api_error', 'db_error', 'auth_error', 'system_error'
    message TEXT NOT NULL,
    stack_trace TEXT,
    endpoint VARCHAR(200),
    method VARCHAR(10),
    user_id TEXT,
    ip_address VARCHAR(50),
    request_body JSONB,
    severity VARCHAR(20) DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);

-- 5. Rate Limiting Config Table
CREATE TABLE IF NOT EXISTS rate_limit_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint VARCHAR(200) NOT NULL,
    max_requests INTEGER DEFAULT 60,
    window_seconds INTEGER DEFAULT 60,
    block_duration_seconds INTEGER DEFAULT 300,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default rate limit configs
INSERT INTO rate_limit_config (endpoint, max_requests, window_seconds, block_duration_seconds) VALUES
    ('/api/auth/login', 5, 300, 900),      -- 5 attempts per 5 min, block 15 min
    ('/api/auth/register', 3, 3600, 3600),  -- 3 per hour, block 1 hour
    ('/api/*', 100, 60, 60)                 -- 100 requests per minute general
ON CONFLICT DO NOTHING;

-- 6. Function: Check Brute Force
CREATE OR REPLACE FUNCTION check_brute_force(p_email VARCHAR, p_ip VARCHAR, p_window_minutes INTEGER DEFAULT 15, p_max_attempts INTEGER DEFAULT 5)
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO attempt_count
    FROM login_attempts
    WHERE (email = p_email OR ip_address = p_ip)
    AND success = false
    AND created_at > NOW() - (p_window_minutes || ' minutes')::interval;

    RETURN attempt_count >= p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- 7. Function: Cleanup old data (for cron job)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete login attempts older than 30 days
    DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL '30 days';
    -- Delete expired sessions
    DELETE FROM active_sessions WHERE expires_at < NOW() - INTERVAL '7 days';
    -- Delete resolved errors older than 90 days
    DELETE FROM error_logs WHERE resolved = true AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 8. RLS on security tables
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Platform admin can see everything, normal users only their own
CREATE POLICY "Login Attempts Access" ON login_attempts FOR ALL USING (is_platform_admin());
CREATE POLICY "2FA Access" ON two_factor_auth FOR ALL USING (user_id = auth.uid()::text OR is_platform_admin());
CREATE POLICY "Sessions Access" ON active_sessions FOR ALL USING (user_id = auth.uid()::text OR is_platform_admin());
CREATE POLICY "Error Logs Access" ON error_logs FOR ALL USING (is_platform_admin());

SELECT 'Production Security Database Setup Complete!' AS status;
