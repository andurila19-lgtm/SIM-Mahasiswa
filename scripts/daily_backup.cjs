#!/usr/bin/env node

/**
 * SIM Akademik - Daily Automated Backup Script
 * 
 * Jalankan via cron job / Windows Task Scheduler:
 * - Linux: crontab -e → 0 2 * * * node /path/to/backup.cjs
 * - Windows: schtasks /create /tn "SIM_Backup" /tr "node D:\Sim\scripts\daily_backup.cjs" /sc daily /st 02:00
 * 
 * Environment Variables yang diperlukan:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY (BUKAN anon key)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────
require('dotenv').config({ path: path.resolve(__dirname, '..', 'server', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BACKUP_DIR = path.resolve(__dirname, '..', 'backups');
const MAX_BACKUPS = 30; // Simpan maksimal 30 hari

// Daftar tabel yang harus di-backup
const TABLES = [
    'campuses',
    'subscriptions',
    'profiles',
    'roles',
    'permissions',
    'role_permissions',
    'academic_years',
    'study_programs',
    'courses',
    'classes',
    'rooms',
    'student_krs',
    'student_grades',
    'student_bills',
    'attendance',
    'materials',
    'audit_logs',
    'login_attempts',
    'error_logs',
];

// ─── Helpers ─────────────────────────────────────────────────────
const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-').split('T');
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

// ─── Main Backup Function ───────────────────────────────────────
async function runBackup() {
    const [date, time] = timestamp();
    const backupName = `backup_${date}_${time.substring(0, 8)}`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    log('🚀 Memulai backup harian...');

    // Buat direktori backup
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath, { recursive: true });

    const results = {
        success: [],
        failed: [],
        totalRecords: 0,
        startTime: Date.now()
    };

    for (const table of TABLES) {
        try {
            log(`  📋 Backup tabel: ${table}...`);

            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: true });

            if (error) {
                log(`  ⚠️  Gagal backup ${table}: ${error.message}`);
                results.failed.push({ table, error: error.message });
                continue;
            }

            const filePath = path.join(backupPath, `${table}.json`);
            fs.writeFileSync(filePath, JSON.stringify({
                table,
                count: data?.length || 0,
                exported_at: new Date().toISOString(),
                data: data || []
            }, null, 2));

            results.success.push({ table, records: data?.length || 0 });
            results.totalRecords += data?.length || 0;
            log(`  ✅ ${table}: ${data?.length || 0} records`);

        } catch (err) {
            log(`  ❌ Error backup ${table}: ${err.message}`);
            results.failed.push({ table, error: err.message });
        }
    }

    // Simpan summary
    const elapsed = ((Date.now() - results.startTime) / 1000).toFixed(2);
    const summary = {
        backup_name: backupName,
        timestamp: new Date().toISOString(),
        duration_seconds: elapsed,
        tables_success: results.success.length,
        tables_failed: results.failed.length,
        total_records: results.totalRecords,
        details: results
    };

    fs.writeFileSync(path.join(backupPath, '_summary.json'), JSON.stringify(summary, null, 2));

    // Log ke database
    try {
        await supabase.from('audit_logs').insert({
            user_role: 'system',
            action: 'AUTOMATED_BACKUP',
            module: 'backup',
            details: {
                backup_name: backupName,
                success: results.success.length,
                failed: results.failed.length,
                total_records: results.totalRecords,
                duration: elapsed
            }
        });
    } catch (e) { /* non-blocking */ }

    log(`\n📦 Backup selesai dalam ${elapsed} detik`);
    log(`   ✅ Berhasil: ${results.success.length} tabel`);
    log(`   ❌ Gagal: ${results.failed.length} tabel`);
    log(`   📊 Total Records: ${results.totalRecords}`);
    log(`   📁 Lokasi: ${backupPath}`);

    // Cleanup old backups
    cleanupOldBackups();
}

// ─── Cleanup Old Backups ────────────────────────────────────────
function cleanupOldBackups() {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup_'))
        .sort()
        .reverse();

    if (backups.length > MAX_BACKUPS) {
        const toDelete = backups.slice(MAX_BACKUPS);
        for (const dir of toDelete) {
            const fullPath = path.join(BACKUP_DIR, dir);
            fs.rmSync(fullPath, { recursive: true, force: true });
            log(`🗑️  Menghapus backup lama: ${dir}`);
        }
    }
}

// ─── Run ─────────────────────────────────────────────────────────
runBackup().catch(err => {
    console.error('❌ Backup failed:', err);
    process.exit(1);
});
