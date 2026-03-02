const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Missing env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAcademicTables() {
    console.log('Checking Academic Tables...');

    let { data: courses, error: cErr } = await supabase.from('courses').select('*').limit(1);
    if (cErr) console.log('Courses table error:', cErr.message);
    else console.log('Courses columns:', Object.keys(courses[0] || {}));

    let { data: classes, error: clErr } = await supabase.from('classes').select('*').limit(1);
    if (clErr) console.log('Classes table error:', clErr.message);
    else console.log('Classes columns:', Object.keys(classes[0] || {}));
}

checkAcademicTables();
