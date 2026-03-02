# SIM CEPAT - Sistem Informasi Manajemen Terpadu

**SIM CEPAT** (Cepat | Efisien | Praktis | Akurat | Terintegrasi) adalah platform manajemen mahasiswa modern yang dirancang untuk kecepatan dan kemudahan akses di berbagai perangkat.

![Dashboard Preview](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)

## ✨ Fitur Utama
- **Manajemen Mahasiswa (CRUD)**: Kelola data profil mahasiswa secara *real-time*.
- **Sinkronisasi Multi-Device**: Sinkronisasi data instan antar perangkat melalui Supabase.
- **Tampilan Responsif Ultra Compact**: Desain premium yang dioptimalkan untuk Desktop, Tablet, dan Smartphone.
- **KRS & Penilaian**: Manajemen Kartu Rencana Studi dan riwayat IPK per semester.
- **Export Data**: Ekspor laporan ke format PDF dan Excel dengan satu klik.

## 🛠️ Tech Stack
- **Frontend**: React.js, Vite, TypeScript, Tailwind CSS, Framer Motion.
- **Backend/Database**: Supabase (PostgreSQL & Row Level Security).
- **Authentication**: Firebase Auth.
- **Deployment**: Vercel.

## 🚀 Cara Instalasi Lokal
1. Clone repository:
   ```bash
   git clone https://github.com/andurila19-lgtm/SIM-Mahasiswa.git
   ```
2. Instalasi dependensi:
   ```bash
   cd client
   npm install
   ```
3. Setup Environment Variables (`.env`):
   Pastikan Anda memiliki kredensial Supabase dan Firebase yang valid.
4. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

## 🌐 Deployment
Aplikasi ini sudah di-deploy secara otomatis ke Vercel dan dapat diakses melalui:
**[sim-mahasiswa.vercel.app](https://sim-mahasiswa.vercel.app/)**

---
© 2026 Admin Kampus - SIM CEPAT Development Team.
