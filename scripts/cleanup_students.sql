-- ═══════════════════════════════════════════════════
-- CLEANUP: Hapus data mahasiswa corrupt
-- Jalankan di Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. Hapus profiles
DELETE FROM profiles WHERE email LIKE '%@mhs.cepat.ac.id';

-- 2. Hapus sessions
DELETE FROM auth.sessions WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@mhs.cepat.ac.id'
);

-- 3. Hapus refresh tokens (user_id is varchar, needs cast)
DELETE FROM auth.refresh_tokens WHERE user_id::uuid IN (
    SELECT id FROM auth.users WHERE email LIKE '%@mhs.cepat.ac.id'
);

-- 4. Hapus MFA
DELETE FROM auth.mfa_factors WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@mhs.cepat.ac.id'
);

-- 5. Hapus identities
DELETE FROM auth.identities WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@mhs.cepat.ac.id'
);

-- 6. Hapus users
DELETE FROM auth.users WHERE email LIKE '%@mhs.cepat.ac.id';

-- Verifikasi
SELECT COUNT(*) as remaining FROM auth.users WHERE email LIKE '%@mhs.cepat.ac.id';
