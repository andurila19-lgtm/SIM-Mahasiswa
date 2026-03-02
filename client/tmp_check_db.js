import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU2NjksImV4cCI6MjA4Nzk2MTY2OX0.22Sx7rEi5KThH04rlX53sAUu-_XxdtmrM0eb5K_6o1M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- DB Schema Check ---');

    // Check Profiles
    console.log('Fetching 1 row from profiles...');
    const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) {
        console.error('Profiles Error:', pError.message);
    } else if (pData && pData.length > 0) {
        console.log('Profiles Columns:', Object.keys(pData[0]).join(', '));
    } else {
        console.log('Profiles table is empty.');
    }

    // Check Students
    console.log('\nFetching 1 row from students...');
    const { data: sData, error: sError } = await supabase.from('students').select('*').limit(1);
    if (sError) {
        console.error('Students Error:', sError.message);
    } else if (sData && sData.length > 0) {
        console.log('Students Columns:', Object.keys(sData[0]).join(', '));
    } else {
        console.log('Students table is empty.');
    }
}

checkSchema().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
