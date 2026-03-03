-- ═══════════════════════════════════════════════════════════════
-- SEED 20 MAHASISWA - Universitas CEPAT
-- ═══════════════════════════════════════════════════════════════
-- LANGKAH:
-- 1. Buka Supabase Dashboard → SQL Editor → New Query
-- 2. Paste SEMUA isi file ini
-- 3. Klik Run
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: Bersihkan data lama dari percobaan yang gagal
DELETE FROM profiles WHERE email LIKE '%@mhs.cepat.ac.id';
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@mhs.cepat.ac.id');
DELETE FROM auth.users WHERE email LIKE '%@mhs.cepat.ac.id';

-- STEP 2: Buat 20 mahasiswa
DO $$
DECLARE
  hashed_pw TEXT;
  uid UUID;
  rec RECORD;
BEGIN
  -- Hash password 'Mhs@12345'
  hashed_pw := crypt('Mhs@12345', gen_salt('bf'));

  FOR rec IN (
    SELECT * FROM (VALUES
      ('ahmad.rizki@mhs.cepat.ac.id',          'Ahmad Rizki Pratama',     '2024010001', 'Fakultas Teknik',                        'Teknik Informatika',         '081234567001'),
      ('siti.nurhaliza@mhs.cepat.ac.id',        'Siti Nurhaliza Putri',    '2024010002', 'Fakultas Teknik',                        'Teknik Informatika',         '081234567002'),
      ('budi.santoso@mhs.cepat.ac.id',          'Budi Santoso',            '2024010003', 'Fakultas Teknik',                        'Teknik Sipil',               '081234567003'),
      ('dewi.lestari@mhs.cepat.ac.id',          'Dewi Lestari',            '2024010004', 'Fakultas Teknik',                        'Teknik Sipil',               '081234567004'),
      ('rina.wulandari@mhs.cepat.ac.id',        'Rina Wulandari',          '2024020001', 'Fakultas Ekonomi & Bisnis',              'Manajemen',                  '081234567005'),
      ('fajar.nugroho@mhs.cepat.ac.id',         'Fajar Nugroho',           '2024020002', 'Fakultas Ekonomi & Bisnis',              'Manajemen',                  '081234567006'),
      ('maya.sari@mhs.cepat.ac.id',             'Maya Anggraeni Sari',     '2024020003', 'Fakultas Ekonomi & Bisnis',              'Akuntansi',                  '081234567007'),
      ('rendi.hidayat@mhs.cepat.ac.id',         'Rendi Hidayat',           '2024020004', 'Fakultas Ekonomi & Bisnis',              'Akuntansi',                  '081234567008'),
      ('nadia.permata@mhs.cepat.ac.id',         'Nadia Permata Sari',      '2024030001', 'Fakultas Hukum',                         'Ilmu Hukum',                 '081234567009'),
      ('dimas.prasetyo@mhs.cepat.ac.id',        'Dimas Prasetyo',          '2024030002', 'Fakultas Hukum',                         'Ilmu Hukum',                 '081234567010'),
      ('laras.kusumaningrum@mhs.cepat.ac.id',   'Laras Kusumaningrum',     '2024040001', 'Fakultas Kedokteran',                    'Pendidikan Dokter',          '081234567011'),
      ('galih.ramadhan@mhs.cepat.ac.id',        'Galih Ramadhan',          '2024040002', 'Fakultas Kedokteran',                    'Pendidikan Dokter',          '081234567012'),
      ('anisa.fitri@mhs.cepat.ac.id',           'Anisa Fitri Handayani',   '2024040003', 'Fakultas Kedokteran',                    'Farmasi',                    '081234567013'),
      ('yoga.aditya@mhs.cepat.ac.id',           'Yoga Aditya Putra',       '2024050001', 'Fakultas Ilmu Sosial & Politik',         'Ilmu Komunikasi',            '081234567014'),
      ('putri.rahayu@mhs.cepat.ac.id',          'Putri Rahayu',            '2024050002', 'Fakultas Ilmu Sosial & Politik',         'Ilmu Komunikasi',            '081234567015'),
      ('hendra.wijaya@mhs.cepat.ac.id',         'Hendra Wijaya',           '2024050003', 'Fakultas Ilmu Sosial & Politik',         'Administrasi Publik',        '081234567016'),
      ('indah.permatasari@mhs.cepat.ac.id',     'Indah Permatasari',       '2024060001', 'Fakultas Keguruan & Ilmu Pendidikan',    'Pendidikan Matematika',      '081234567017'),
      ('rizal.fahmi@mhs.cepat.ac.id',           'Rizal Fahmi',             '2024060002', 'Fakultas Keguruan & Ilmu Pendidikan',    'Pendidikan Matematika',      '081234567018'),
      ('tania.adriani@mhs.cepat.ac.id',         'Tania Adriani',           '2024060003', 'Fakultas Keguruan & Ilmu Pendidikan',    'Pendidikan Bahasa Inggris',  '081234567019'),
      ('arif.budiman@mhs.cepat.ac.id',          'Arif Budiman',            '2024060004', 'Fakultas Keguruan & Ilmu Pendidikan',    'Pendidikan Bahasa Inggris',  '081234567020')
    ) AS t(email, full_name, nim_nip, faculty, study_program, phone)
  )
  LOOP
    uid := gen_random_uuid();

    -- Insert auth user
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, aud, role,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token,
      is_super_admin, phone
    ) VALUES (
      uid,
      '00000000-0000-0000-0000-000000000000',
      rec.email,
      hashed_pw,
      NOW(),
      'authenticated',
      'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', rec.full_name, 'role', 'mahasiswa'),
      NOW(),
      NOW(),
      '',
      '',
      FALSE,
      ''
    );

    -- Insert auth identity (required for login)
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      uid,
      uid,
      jsonb_build_object('sub', uid::text, 'email', rec.email, 'email_verified', true, 'phone_verified', false),
      'email',
      uid::text,
      NOW(),
      NOW(),
      NOW()
    );

    -- Insert profile
    INSERT INTO profiles (id, email, full_name, nim_nip, role, faculty, study_program, phone, status)
    VALUES (uid, rec.email, rec.full_name, rec.nim_nip, 'mahasiswa', rec.faculty, rec.study_program, rec.phone, 'active')
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      nim_nip = EXCLUDED.nim_nip,
      faculty = EXCLUDED.faculty,
      study_program = EXCLUDED.study_program,
      phone = EXCLUDED.phone;

    RAISE NOTICE 'Created: % (%)', rec.full_name, rec.email;
  END LOOP;
END;
$$;

-- VERIFY: Check results
SELECT full_name, nim_nip, email, faculty, study_program FROM profiles WHERE email LIKE '%@mhs.cepat.ac.id' ORDER BY nim_nip;
