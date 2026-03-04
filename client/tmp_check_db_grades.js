import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU2NjksImV4cCI6MjA4Nzk2MTY2OX0.22Sx7rEi5KThH04rlX53sAUu-_XxdtmrM0eb5K_6o1M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- DB column Check for student_grades ---');
    const { data: gradesData, error: gradesError } = await supabase.from('student_grades').select('*').limit(1);

    if (gradesError) {
        console.error('Grades Error:', gradesError);
    } else if (gradesData && gradesData.length > 0) {
        console.log('Grades Columns:', Object.keys(gradesData[0]).join(', '));
    } else {
        console.log('Grades is empty or no columns found.');
    }

    console.log('--- DB column Check for announcements ---');
    const { data: aData, error: aError } = await supabase.from('announcements').select('*').limit(1);

    if (aError) {
        console.error('Announcements Error:', aError);
    } else if (aData && aData.length > 0) {
        console.log('Announcements Columns:', Object.keys(aData[0]).join(', '));
    } else {
        console.log('Announcements is empty or no columns found.');
    }
}

checkSchema();
