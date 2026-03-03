const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const tables = ['student_grades', 'classes', 'courses', 'profiles', 'student_krs'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`${table} error:`, error.message);
        } else {
            console.log(`${table} exists, count:`, data.length);
        }
    }
}
check();
