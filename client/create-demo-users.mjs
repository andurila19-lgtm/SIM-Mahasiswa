import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
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
const authInstance = getAuth(app);
const supabase = createClient(supabaseUrl, supabaseKey);

const demoUsers = [
    { email: 'superadmin@sim.ac.id', password: 'superadmin123', fullName: 'Super Admin', role: 'superadmin', nidn: 'ADM001' },
    { email: 'mahasiswa@sim.ac.id', password: 'mhs123', fullName: 'Budi Raharjo', role: 'mahasiswa', nidn: '2105001' },
    { email: 'dosen@sim.ac.id', password: 'dosen123', fullName: 'Dr. Ahmad Subarjo', role: 'dosen', nidn: 'DSN001' },
    { email: 'akademik@sim.ac.id', password: 'akademik123', fullName: 'Staff Akademik', role: 'akademik', nidn: 'AKD001' },
    { email: 'keuangan@sim.ac.id', password: 'keuangan123', fullName: 'Staff Keuangan', role: 'keuangan', nidn: 'KEU001' },
];

const results = [];

async function run() {
    for (const user of demoUsers) {
        let uid = null;
        let firebaseStatus = '';
        let supabaseStatus = '';

        try {
            const cred = await createUserWithEmailAndPassword(authInstance, user.email, user.password);
            uid = cred.user.uid;
            firebaseStatus = 'CREATED uid=' + uid;
        } catch (e) {
            if (e.code === 'auth/email-already-in-use') {
                try {
                    const cred = await signInWithEmailAndPassword(authInstance, user.email, user.password);
                    uid = cred.user.uid;
                    firebaseStatus = 'EXISTS uid=' + uid;
                } catch (e2) {
                    firebaseStatus = 'SIGN_IN_FAIL: ' + e2.message;
                }
            } else {
                firebaseStatus = 'ERROR: ' + e.message;
            }
        }

        if (uid) {
            const { error } = await supabase.from('profiles').upsert({
                id: uid,
                full_name: user.fullName,
                email: user.email,
                role: user.role,
                nim_nip: user.nidn,
                status: 'active',
            });
            supabaseStatus = error ? 'ERROR: ' + error.message : 'OK';
        } else {
            supabaseStatus = 'SKIPPED';
        }

        results.push({ role: user.role, email: user.email, firebase: firebaseStatus, supabase: supabaseStatus });
    }

    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
}

run();
