-- =========================================================
-- WILDCARD SUBDOMAIN ARCHITECTURE - DATABASE MIGRATION
-- =========================================================

-- 1. Tambahkan kolom subdomain ke tabel campuses jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campuses' AND column_name = 'subdomain') THEN
        ALTER TABLE campuses ADD COLUMN subdomain VARCHAR(100) UNIQUE;
    END IF;
END $$;

-- 2. Buat index untuk pencarian subdomain agar sangat cepat di middleware
CREATE INDEX IF NOT EXISTS idx_campuses_subdomain ON campuses(subdomain);

-- 3. Populate existing campuses dengan subdomain dummy (slug dari nama)
UPDATE campuses 
SET subdomain = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '', 'g'))
WHERE subdomain IS NULL;

-- 4. Constraint tidak boleh null
ALTER TABLE campuses ALTER COLUMN subdomain SET NOT NULL;

-- 5. Reserved subdomains (tidak boleh dipakai kampus)
-- app, admin, api, www, mail
ALTER TABLE campuses ADD CONSTRAINT check_reserved_subdomains 
CHECK (subdomain NOT IN ('app', 'admin', 'api', 'www', 'mail', 'ftp', 'cpanel'));

SELECT 'Wildcard Subdomain Setup Complete!' AS status;
