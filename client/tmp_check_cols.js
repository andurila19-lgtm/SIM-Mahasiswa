import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU2NjksImV4cCI6MjA4Nzk2MTY2OX0.22Sx7rEi5KThH04rlX53sAUu-_XxdtmrM0eb5K_6o1M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const columns = ['faculty', 'study_program', 'semester', 'class_name'];
    console.log('Checking columns existence in profiles...');
    for (const col of columns) {
        const { error } = await supabase.from('profiles').select(col).limit(1);
        if (error) {
            console.log(`Column ${col}: MISSING (${error.message})`);
        } else {
            console.log(`Column ${col}: EXISTS`);
        }
    }
}

check().catch(console.error);
