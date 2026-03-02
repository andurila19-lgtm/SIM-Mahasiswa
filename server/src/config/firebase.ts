import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let app: admin.app.App;

const initializeFirebase = () => {
    if (admin.apps.length > 0) return admin.app();

    // 1. Try serviceAccount.json file
    const serviceAccountPath = path.resolve(__dirname, '../../serviceAccount.json');
    if (fs.existsSync(serviceAccountPath)) {
        try {
            console.log('📂 Loading Firebase from serviceAccount.json...');
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: `${serviceAccount.project_id}.appspot.com`
            });
        } catch (error: any) {
            console.error('❌ Error loading serviceAccount.json:', error.message);
        }
    }

    // 2. Fallback to Environment Variables
    const envConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (envConfig.projectId && envConfig.privateKey && envConfig.clientEmail) {
        try {
            console.log('🌐 Loading Firebase from Environment Variables...');
            return admin.initializeApp({
                credential: admin.credential.cert(envConfig as any),
                storageBucket: `${envConfig.projectId}.appspot.com`
            });
        } catch (error: any) {
            console.error('❌ Error initializing with Env Vars:', error.message);
        }
    }

    console.warn('⚠️ No valid Firebase credentials found. Auth features will be disabled.');
    return null as any;
};

app = initializeFirebase();

export const auth = app ? admin.auth(app) : ({} as any);
export const storage = app ? admin.storage(app) : ({} as any);
export { admin };
