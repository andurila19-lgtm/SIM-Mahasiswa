-- =========================================================
-- PREMIUM FEATURES - DATABASE MIGRATION
-- =========================================================

-- 1. QR Attendance Sessions
CREATE TABLE IF NOT EXISTS qr_attendance_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    lecturer_id TEXT NOT NULL REFERENCES profiles(id),
    qr_token VARCHAR(64) NOT NULL UNIQUE,
    session_date DATE DEFAULT CURRENT_DATE,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    radius_meters INTEGER DEFAULT 100,
    campus_id UUID REFERENCES campuses(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_session_token ON qr_attendance_sessions(qr_token);
CREATE INDEX IF NOT EXISTS idx_qr_session_class ON qr_attendance_sessions(class_id);

-- 2. Payment Transactions (Midtrans/Xendit)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL REFERENCES student_bills(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES profiles(id),
    gateway VARCHAR(20) NOT NULL CHECK (gateway IN ('midtrans', 'xendit', 'manual')),
    external_id VARCHAR(100), -- ID transaksi dari payment gateway
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'expired', 'refunded')),
    payment_method VARCHAR(50), -- va_bca, gopay, qris, dll
    payment_url TEXT, -- URL redirect dari gateway
    callback_data JSONB,
    paid_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    campus_id UUID REFERENCES campuses(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_bill ON payment_transactions(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_external ON payment_transactions(external_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_student ON payment_transactions(student_id);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'krs', 'payment', 'grade', 'announcement')),
    channel VARCHAR(20) DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'whatsapp', 'all')),
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_campus ON notifications(campus_id);

-- 4. Bulk Import Logs
CREATE TABLE IF NOT EXISTS bulk_import_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    imported_by TEXT NOT NULL REFERENCES profiles(id),
    campus_id UUID REFERENCES campuses(id),
    file_name VARCHAR(200) NOT NULL,
    import_type VARCHAR(50) NOT NULL CHECK (import_type IN ('students', 'lecturers', 'courses', 'grades', 'bills')),
    total_rows INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    error_details JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Payment Gateway Config per Campus
CREATE TABLE IF NOT EXISTS payment_gateway_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    gateway VARCHAR(20) NOT NULL CHECK (gateway IN ('midtrans', 'xendit')),
    server_key_encrypted TEXT, -- Encrypted server key
    client_key VARCHAR(200),
    is_production BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campus_id, gateway)
);

-- 6. Accreditation Report Cache (BAN-PT)
CREATE TABLE IF NOT EXISTS accreditation_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campus_id UUID NOT NULL REFERENCES campuses(id),
    report_type VARCHAR(50) NOT NULL, -- 'standar_1', 'standar_2', etc.
    academic_year_id UUID REFERENCES academic_years(id),
    data JSONB NOT NULL,
    generated_by TEXT REFERENCES profiles(id),
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS Policies
ALTER TABLE qr_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateway_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE accreditation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "QR Tenant Isolation" ON qr_attendance_sessions FOR ALL USING (campus_id = get_current_campus_id() OR is_platform_admin());
CREATE POLICY "Payment Tx Tenant" ON payment_transactions FOR ALL USING (campus_id = get_current_campus_id() OR is_platform_admin());
CREATE POLICY "Notif User Access" ON notifications FOR ALL USING (user_id = auth.uid()::text OR campus_id = get_current_campus_id() OR is_platform_admin());
CREATE POLICY "Import Log Tenant" ON bulk_import_logs FOR ALL USING (campus_id = get_current_campus_id() OR is_platform_admin());
CREATE POLICY "PG Config Tenant" ON payment_gateway_config FOR ALL USING (campus_id = get_current_campus_id() OR is_platform_admin());
CREATE POLICY "Accred Report Tenant" ON accreditation_reports FOR ALL USING (campus_id = get_current_campus_id() OR is_platform_admin());

SELECT 'Premium Features Database Setup Complete!' AS status;
