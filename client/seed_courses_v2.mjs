import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM4NTY2OSwiZXhwIjoyMDg3OTYxNjY5fQ.tbJUvZntRrcDZZAQspcqlU_lse2cA0Jymql6Ey-bNDE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
    console.log('🧹 Cleaning and Re-seeding courses...');

    const { data: prodis, error: prodiError } = await supabase.from('study_programs').select('id, name');
    if (prodiError) {
        console.error('Error fetching study programs:', prodiError.message);
        return;
    }

    const courseTemplates = [
        { name: 'Pengantar', suffix: 'I', sks: 3, semester: 1 },
        { name: 'Dasar-Dasar', suffix: '', sks: 3, semester: 1 },
        { name: 'Keterampilan Lanjut', suffix: '', sks: 3, semester: 2 },
        { name: 'Praktikum Utama', suffix: '', sks: 4, semester: 3 },
        { name: 'Manajemen Keahlian', suffix: '', sks: 3, semester: 4 },
        { name: 'Analisis & Strategi', suffix: '', sks: 3, semester: 5 },
        { name: 'Metodologi Khusus', suffix: '', sks: 3, semester: 6 },
        { name: 'Kapita Selekta', suffix: '', sks: 2, semester: 7 },
        { name: 'Tugas Akhir / Skripsi', suffix: '', sks: 6, semester: 8 }
    ];

    const allCourses = [];

    prodis.forEach((p, pIndex) => {
        courseTemplates.forEach((t, tIndex) => {
            const words = p.name.split(' ');
            const codePrefix = words.length > 1 ? words.map(w => w[0] || '').join('').toUpperCase().slice(0, 3) : p.name.slice(0, 3).toUpperCase();
            // Code format: PREFIX + PRODI_INDEX (2-digit) + tIndex (2-digit) + SEMESTER
            const code = `${codePrefix}${pIndex.toString().padStart(2, '0')}${tIndex.toString().padStart(2, '0')}${t.semester}`;

            allCourses.push({
                code: code,
                name: `${t.name} ${p.name} ${t.suffix}`.trim(),
                sks: t.sks,
                semester_recommended: t.semester,
                study_program_id: p.id
            });
        });
    });

    console.log(`Preparing to insert ${allCourses.length} courses...`);

    // Chunked upsert
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
