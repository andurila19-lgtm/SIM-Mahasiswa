const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU2NjksImV4cCI6MjA4Nzk2MTY2OX0.22Sx7rEi5KThH04rlX53sAUu-_XxdtmrM0eb5K_6o1M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });

    console.log('--- DB Check ---');

    console.log('Fetching profiles...');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) {
        console.log('Error profiles:', pError.message, pError.details, pError.hint);
    } else if (profiles && profiles.length > 0) {
        console.log('Profiles columns:', Object.keys(profiles[0]).join(', '));
    } else {
        console.log('Profiles - no rows');
    }

    console.log('\nFetching students...');
    const { data: students, error: sError } = await supabase.from('students').select('*').limit(1);
    if (sError) {
        console.log('Error students:', sError.message, sError.details, sError.hint);
    } else if (students && students.length > 0) {
        console.log('Students columns:', Object.keys(students[0]).join(', '));
    } else {
        console.log('Students - no rows');
    }

    process.exit(0);
}

checkSchema().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
