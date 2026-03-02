import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU2NjksImV4cCI6MjA4Nzk2MTY2OX0.22Sx7rEi5KThH04rlX53sAUu-_XxdtmrM0eb5K_6o1M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('--- Testing Insert to profiles ---');
    const dummyId = 'c7e4b600-0000-0000-0000-000000000000'; // A valid UUID format
    const dummy = {
        id: dummyId,
        full_name: 'Test Student',
        email: 'test@student.ac.id',
        nim_nip: 'TEST001',
        role: 'student'
    };

    const { error } = await supabase.from('profiles').insert([dummy]);
    if (error) {
        console.log('Insert Error:', error.message);
        console.log('Details:', error.details);
    } else {
        console.log('Insert Success! No foreign key constraint on auth.users?');
        // Clean up
        await supabase.from('profiles').delete().eq('id', dummyId);
    }
}

testInsert().catch(console.error);
