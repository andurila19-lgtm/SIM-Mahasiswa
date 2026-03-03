import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM4NTY2OSwiZXhwIjoyMDg3OTYxNjY5fQ.tbJUvZntRrcDZZAQspcqlU_lse2cA0Jymql6Ey-bNDE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
    console.log('🚀 Seeding classes for courses...');

    const { data: courses, error: courseError } = await supabase.from('courses').select('id, name');
    const { data: lecturers, error: lectError } = await supabase.from('profiles').select('id').eq('role', 'dosen');

    if (courseError || lectError) {
        console.error('Error fetching data:', courseError?.message || lectError?.message);
        return;
    }

    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const rooms = ['A.101', 'B.202', 'C.303', 'D.404', 'E.505'];
    const times = [
        { start: '08:00', end: '10:30' },
        { start: '10:45', end: '13:15' },
        { start: '13:30', end: '16:00' }
    ];

    const allClasses = [];

    // Seed classes for first 50 courses to avoid explosion
    courses.slice(0, 50).forEach((c, index) => {
        const day = days[index % days.length];
        const room = rooms[index % rooms.length];
        const time = times[index % times.length];
        const lecturerId = lecturers[index % lecturers.length]?.id;

        allClasses.push({
            name: 'A',
            course_id: c.id,
            lecturer_id: lecturerId,
            day: day,
            start_time: time.start,
            end_time: time.end,
            room: room,
            capacity: 40
        });
    });

    console.log(`Inserting ${allClasses.length} classes...`);
    const { error: insertError } = await supabase.from('classes').insert(allClasses);

    if (insertError) {
        console.error('Error seeding classes:', insertError.message);
    } else {
        console.log('✅ Successfully seeded classes.');
    }
}

seed();
