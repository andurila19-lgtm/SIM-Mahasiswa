const path = require('path');
require(path.join(__dirname, '..', 'server', 'node_modules', 'dotenv')).config({ path: path.join(__dirname, '..', 'server', '.env') });
const { createClient } = require(path.join(__dirname, '..', 'server', 'node_modules', '@supabase', 'supabase-js'));
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
s.from('profiles').select('*').eq('role', 'mahasiswa').limit(1).then(({ data, error }) => {
    if (error) console.log('ERR:', error.message);
    else { console.log('Columns:', Object.keys(data[0] || {}).join(', ')); console.log(JSON.stringify(data[0], null, 2)); }
});
