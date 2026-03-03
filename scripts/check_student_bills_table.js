/**
 * Script untuk memeriksa struktur tabel student_bills
 * Jalankan dari root: node scripts/check_student_bills_table.js
 */
const path = require('path');

// Load dotenv from server directory
require(path.join(__dirname, '..', 'server', 'node_modules', 'dotenv')).config({
    path: path.join(__dirname, '..', 'server', '.env')
});

const { createClient } = require(path.join(__dirname, '..', 'server', 'node_modules', '@supabase', 'supabase-js'));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in server/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('\n📋 Checking student_bills table...\n');

    // 1. Check if table exists
    const { data, error } = await supabase
        .from('student_bills')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error querying student_bills:', error.message);
        console.log('\n⚠️  Tabel mungkin belum ada. Buat di Supabase SQL Editor:\n');
        printCreateSQL();
    } else {
        console.log('✅ Table student_bills exists');

        if (data?.length > 0) {
            const cols = Object.keys(data[0]);
            console.log('   Columns:', cols.join(', '));

            const requiredCols = ['id', 'student_id', 'description', 'amount', 'status', 'category', 'semester', 'due_date'];
            const missingCols = requiredCols.filter(c => !cols.includes(c));

            if (missingCols.length > 0) {
                console.log('\n⚠️  Missing columns:', missingCols.join(', '));
                console.log('   Tambahkan di Supabase SQL Editor:\n');
                missingCols.forEach(col => {
                    if (col === 'category') console.log(`   ALTER TABLE student_bills ADD COLUMN category TEXT;`);
                    else if (col === 'semester') console.log(`   ALTER TABLE student_bills ADD COLUMN semester TEXT;`);
                    else if (col === 'due_date') console.log(`   ALTER TABLE student_bills ADD COLUMN due_date DATE;`);
                    else console.log(`   ALTER TABLE student_bills ADD COLUMN ${col} TEXT;`);
                });
            } else {
                console.log('✅ All required columns present');
            }
        } else {
            console.log('   ℹ️  Tabel kosong (belum ada data). Kolom tidak bisa diverifikasi dari query kosong.');
            console.log('   Pastikan kolom berikut ada: id, student_id, description, amount, status, category, semester, due_date, payment_method, proof_url, created_at');
        }
    }

    // 2. Check mahasiswa profiles
    const { data: studentData, error: studentErr } = await supabase
        .from('profiles')
        .select('id, full_name, nim_nip')
        .eq('role', 'mahasiswa')
        .limit(5);

    if (studentErr) {
        console.log('\n⚠️  Error checking profiles:', studentErr.message);
    } else {
        console.log(`\n👥 Found ${studentData?.length || 0} mahasiswa (max 5 shown):`);
        studentData?.forEach(s => console.log(`   - ${s.full_name} (${s.nim_nip})`));
    }

    console.log('\n✅ Check complete!\n');
}

function printCreateSQL() {
    console.log(`
CREATE TABLE IF NOT EXISTS student_bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'pending', 'paid')),
    category TEXT,
    semester TEXT,
    due_date DATE,
    payment_method TEXT,
    proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE student_bills ENABLE ROW LEVEL SECURITY;

-- Policy: mahasiswa bisa lihat tagihan sendiri
CREATE POLICY "Students view own bills" ON student_bills
    FOR SELECT USING (student_id = auth.uid());

-- Policy: keuangan & superadmin bisa kelola semua
CREATE POLICY "Staff manage all bills" ON student_bills
    FOR ALL USING (true);
    `);
}

checkTable().catch(console.error);
