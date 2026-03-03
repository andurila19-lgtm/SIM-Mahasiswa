
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: roles, error } = await supabase.from('profiles').select('role').limit(100);
    if (error) console.log(error);
    const uniqueRoles = [...new Set(roles.map(r => r.role))];
    console.log('Unique Roles:', uniqueRoles);
}
check();
