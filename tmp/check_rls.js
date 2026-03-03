
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase
        .from('student_krs')
        .insert([{ student_id: '00000000-0000-0000-0000-000000000000', courses: [], status: 'draft' }]);

    console.log('Error:', error?.message || 'None');
    console.log('Data:', data);
}
check();
