import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM4NTY2OSwiZXhwIjoyMDg3OTYxNjY5fQ.tbJUvZntRrcDZZAQspcqlU_lse2cA0Jymql6Ey-bNDE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
    console.log('🚀 Seeding courses per study program...');

    const { data: prodis, error: prodiError } = await supabase.from('study_programs').select('id, name');
    if (prodiError) {
        console.error('Error fetching study programs:', prodiError.message);
        return;
    }

    console.log(`Found ${prodis.length} study programs.`);

    const courseTemplates = [
        { name: 'Pengantar', suffix: 'I', sks: 3 },
        { name: 'Dasar-Dasar', suffix: '', sks: 2 },
        { name: 'Manajemen', suffix: 'Dasar', sks: 3 },
        { name: 'Teknik', suffix: 'Lanjut', sks: 4 },
        { name: 'Etika Profesi', suffix: '', sks: 2 },
        { name: 'Metodologi Penelitian', suffix: '', sks: 3 },
        { name: 'Kapita Selekta', suffix: '', sks: 2 },
        { name: 'Tugas Akhir', suffix: '', sks: 6 }
    ];

    const allCourses = [];

    prodis.forEach((p, pIndex) => {
        courseTemplates.forEach((t, tIndex) => {
            const semester = Math.min(8, tIndex + 1);
            const words = p.name.split(' ');
            const codePrefix = words.length > 1 ? words.map(w => w[0] || '').join('').toUpperCase().slice(0, 3) : p.name.slice(0, 3).toUpperCase();
            // Code format: PREFIX + PRODI_INDEX (2-digit) + SEMESTER + TEMPLATE_INDEX
            const code = `${codePrefix}${pIndex.toString().padStart(2, '0')}${semester}${tIndex + 1}`;

            allCourses.push({
                code: code,
                name: `${t.name} ${p.name} ${t.suffix}`.trim(),
                sks: t.sks,
                semester_recommended: semester,
                study_program_id: p.id
            });
        });
    });

    console.log(`Prepared ${allCourses.length} courses. Inserting...`);

    // Bulk inserts
    for (let i = 0; i < allCourses.length; i += 50) {
        const chunk = allCourses.slice(i, i + 50);
        const { error: insertError } = await supabase.from('courses').upsert(chunk, { onConflict: 'code' });
        if (insertError) {
            console.error(`Error inserting chunk ${i}:`, insertError.message);
        } else {
            console.log(`✅ Seeded chunk index ${i}`);
        }
    }

    console.log('🏁 Seeding finished.');
}

seed();
