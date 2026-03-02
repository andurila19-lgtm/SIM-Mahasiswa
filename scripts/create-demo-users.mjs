/**
 * Script untuk membuat akun demo tiap role
 * Jalankan: node scripts/create-demo-users.mjs
 */
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';

const firebaseConfig = {
    apiKey: 'AIzaSyBn6Z-QLXjvJj16l1PSvLgxeIWZp6KJqOs',
    authDomain: 'sim-1-11663.firebaseapp.com',
    projectId: 'sim-1-11663',
    storageBucket: 'sim-1-11663.firebasestorage.app',
    messagingSenderId: '203407888776',
    appId: '1:203407888776:web:cc5c2944ae4393a96eea3d',
};

const supabaseUrl = 'https://wiqiymucboqrmrwnusxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWl5bXVjYm9xcm1yd251c3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU2NjksImV4cCI6MjA4Nzk2MTY2OX0.22Sx7rEi5KThH04rlX53sAUu-_XxdtmrM0eb5K_6o1M';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const supabase = createClient(supabaseUrl, supabaseKey);

const demoUsers = [
    { email: 'admin@sim.ac.id', password: 'admin123', fullName: 'Admin SIM', role: 'admin', nidn: 'ADM001' },
    { email: 'mahasiswa@sim.ac.id', password: 'mhs123', fullName: 'Budi Raharjo', role: 'mahasiswa', nidn: '2105001' },
    { email: 'dosen@sim.ac.id', password: 'dosen123', fullName: 'Dr. Ahmad Subarjo', role: 'dosen', nidn: 'DSN001' },
    { email: 'akademik@sim.ac.id', password: 'akademik123', fullName: 'Staff Akademik', role: 'akademik', nidn: 'AKD001' },
    { email: 'keuangan@sim.ac.id', password: 'keuangan123', fullName: 'Staff Keuangan', role: 'keuangan', nidn: 'KEU001' },
];

async function createDemoUsers() {
    for (const user of demoUsers) {
        console.log(`\n🔄 Creating: ${user.email} (${user.role})`);
        try {
            // 1. Create Firebase Auth account
            const cred = await createUserWithEmailAndPassword(auth, user.email, user.password);
            console.log(`  ✅ Firebase UID: ${cred.user.uid}`);

            // 2. Create Supabase profile
            const { error } = await supabase.from('profiles').upsert({
                id: cred.user.uid,
                full_name: user.fullName,
                email: user.email,
                role: user.role,
                nim_nip: user.nidn,
                status: 'active',
            });

            if (error) {
                console.log(`  ⚠️ Supabase profile error: ${error.message}`);
            } else {
                console.log(`  ✅ Supabase profile created`);
            }
        } catch (e) {
            if (e.code === 'auth/email-already-in-use') {
                console.log(`  ⚠️ Account already exists, skipping...`);
            } else {
                console.log(`  ❌ Error: ${e.message}`);
            }
        }
    }

    console.log('\n\n📋 Demo Accounts:');
    console.log('──────────────────────────────────────────');
    for (const u of demoUsers) {
        console.log(`  ${u.role.padEnd(12)} → ${u.email} / ${u.password}`);
    }
    console.log('──────────────────────────────────────────');
    process.exit(0);
}

createDemoUsers();
