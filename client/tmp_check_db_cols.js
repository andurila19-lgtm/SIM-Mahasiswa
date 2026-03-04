import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU2NjksImV4cCI6MjA4Nzk2MTY2OX0.22Sx7rEi5KThH04rlX53sAUu-_XxdtmrM0eb5K_6o1M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
    const { data: cols, error: colsErr } = await supabase.rpc('help_or_something') // won't work maybe
    // let's do an ugly insertion error
    const { data, error } = await supabase.from('student_grades').insert({ non_existent_col: 1, nonexistent2: 2 });
    console.log(error);
}
checkCols();
