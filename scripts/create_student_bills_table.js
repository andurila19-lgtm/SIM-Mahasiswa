/**
 * Script untuk membuat tabel student_bills di Supabase
 * Jalankan: node scripts/create_student_bills_table.js
 */
const path = require('path');

require(path.join(__dirname, '..', 'server', 'node_modules', 'dotenv')).config({
    path: path.join(__dirname, '..', 'server', '.env')
});

const { createClient } = require(path.join(__dirname, '..', 'server', 'node_modules', '@supabase', 'supabase-js'));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
    console.log('\n🔧 Creating student_bills table via Supabase RPC...\n');

    // Since we can't run raw SQL through anon key, let's test if table already exists
    const { data: testData, error: testError } = await supabase
        .from('student_bills')
        .select('id')
        .limit(1);

    if (!testError) {
        console.log('✅ Tabel student_bills sudah ada!');
        console.log('   Data rows:', testData?.length || 0);

        // Try inserting a test bill to see which columns exist
        // Get a student first
        const { data: student } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('role', 'mahasiswa')
            .limit(1)
            .single();

        if (student) {
            console.log('\n🧪 Testing insert with all columns...');
            const { data: insertData, error: insertError } = await supabase
                .from('student_bills')
                .insert({
                    student_id: student.id,
                    description: 'TEST - UKT Semester Genap 2025/2026',
                    amount: 5000000,
                    status: 'unpaid',
                    category: 'UKT',
                    semester: 'Genap 2025/2026',
                    due_date: '2026-04-01',
                })
                .select()
                .single();

            if (insertError) {
                console.log('❌ Insert error:', insertError.message);
                console.log('   Detail:', insertError.details);
                console.log('   Hint:', insertError.hint);

                if (insertError.message.includes('category') || insertError.message.includes('semester') || insertError.message.includes('due_date')) {
                    console.log('\n⚠️  Beberapa kolom belum ada. Silakan jalankan SQL berikut di Supabase SQL Editor:');
                    console.log('   ALTER TABLE student_bills ADD COLUMN IF NOT EXISTS category TEXT;');
                    console.log('   ALTER TABLE student_bills ADD COLUMN IF NOT EXISTS semester TEXT;');
                    console.log('   ALTER TABLE student_bills ADD COLUMN IF NOT EXISTS due_date DATE;');
                }
            } else {
                console.log('✅ Test insert berhasil! ID:', insertData.id);
                console.log('   Columns:', Object.keys(insertData).join(', '));

                // Cleanup test data
                await supabase.from('student_bills').delete().eq('id', insertData.id);
                console.log('🧹 Test data dihapus.');
            }
        }
    } else {
        console.log('❌ Tabel student_bills BELUM ada.');
        console.log('   Error:', testError.message);
        console.log('\n📝 Silakan buat tabel di Supabase Dashboard → SQL Editor.');
        console.log('   Buka: https://supabase.com/dashboard/project/wiqiymucboqrmrwnusxh/sql/new');
        console.log('\n   Paste SQL berikut:\n');
        console.log(`-- ============================================
-- BUAT TABEL STUDENT_BILLS
-- ============================================

CREATE TABLE IF NOT EXISTS student_bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unpaid',
    category TEXT,
    semester TEXT,
    due_date DATE,
    payment_method TEXT,
    proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS agar lebih mudah (atau sesuaikan policy)
ALTER TABLE student_bills ENABLE ROW LEVEL SECURITY;

-- Policy: semua user authenticated bisa akses
CREATE POLICY "Allow all access for authenticated users"
ON student_bills FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy tambahan: public juga bisa akses (untuk anon key)
CREATE POLICY "Allow all access for anon"
ON student_bills FOR ALL  
TO anon
USING (true)
WITH CHECK (true);
`);
    }

    console.log('\n✅ Done!\n');
}

createTable().catch(console.error);
