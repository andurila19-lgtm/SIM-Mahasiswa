# SIM CEPAT - Sistem Informasi Manajemen Terpadu

**SIM CEPAT** (Cepat | Efisien | Praktis | Akurat | Terintegrasi) adalah platform manajemen mahasiswa modern yang dirancang untuk kecepatan dan kemudahan akses di berbagai perangkat.

![Dashboard Preview](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)

## 🌐 Akses Aplikasi
Aplikasi dapat diakses secara langsung melalui:
- **URL**: [https://sim.anduril.web.id](https://sim.anduril.web.id)

### 🔑 Akun Login Staff

| Role | Email | Password |
|------|-------|----------|
| 👑 Super Admin | `superadmin@sim.ac.id` | `superadmin123` |
| 👨‍🏫 Dosen | `dosen@sim.ac.id` | `dosen123` |
| 🏫 Staff Akademik | `akademik@sim.ac.id` | `akademik123` |
| 💰 Keuangan | `keuangan@sim.ac.id` | `keuangan123` |

### 🎓 Akun Login Mahasiswa (20 Akun Demo)

Daftar lengkap 20 akun mahasiswa dari 6 fakultas dan 10 prodi tersedia dalam file Excel:

📎 **[Daftar_Akun_Login_SIM_CEPAT.xlsx](docs/Daftar_Akun_Login_SIM_CEPAT.xlsx)**

> **Password semua mahasiswa:** `Mhs@12345`

| Fakultas | Prodi | Jumlah |
|----------|-------|--------|
| Fakultas Teknik | Teknik Informatika, Teknik Sipil | 4 |
| Fakultas Ekonomi & Bisnis | Manajemen, Akuntansi | 4 |
| Fakultas Hukum | Ilmu Hukum | 2 |
| Fakultas Kedokteran | Pendidikan Dokter, Farmasi | 3 |
| Fakultas Ilmu Sosial & Politik | Ilmu Komunikasi, Administrasi Publik | 3 |
| Fakultas Keguruan & Ilmu Pendidikan | Pendidikan Matematika, Pendidikan Bahasa Inggris | 4 |

## ✨ Fitur Utama
- **Manajemen User & Role**: Pengaturan akses terpusat untuk Admin, Dosen, Mahasiswa, dan Staff.
- **Sistem Pengumuman (CRUD)**: Admin dapat membuat, mengedit, dan mengelola pengumuman kampus secara *real-time*.
- **KRS Online Real-time**: Pendaftaran mata kuliah langsung tersinkronisasi dengan database untuk verifikasi cepat oleh akademik.
- **Jadwal Kuliah Dinamis**: Tampilan jadwal mingguan otomatis berdasarkan pengambilan KRS mahasiswa.
- **Tagihan & Pembayaran**: Integrasi sistem keuangan untuk pelacakan UKT dan upload bukti pembayaran mahasiswa.
- **Laporan & Analytics**: Visualisasi data pendaftaran, keuangan, dan statistik akademik dalam Dashboard yang informatif.
- **🤖 SIM AI Intelligence**: Terintegrasi dengan module pembelajaran mesin (Machine Learning) untuk:
    - **Smart Insights**: Prediksi IPK dan rekomendasi jalur karir mahasiswa.
    - **AI Assistant**: Chatbot asisten akademik yang siap menjawab pertanyaan operasional kampus 24/7.
    - **OCR Verification**: Pemindaian bukti bayar otomatis menggunakan visi komputer (Tesseract.js).
- **Tampilan Premium**: UI modern dengan Dark Mode support, animasi halus (Framer Motion), dan responsivitas tinggi.

## 🛠️ Tech Stack
- **Frontend**: React.js 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide React.
- **AI/ML**: Tesseract.js (Optical Character Recognition), SIM-Brain v1.0 (Heuristic Intelligence).
- **Backend/Database**: Supabase (PostgreSQL, Real-time Engine).
- **Authentication**: Firebase Authentication.
- **State Management**: React Context API & Hooks.
- **Deployment**: Vercel.

##  Upload ke GitHub

Untuk mengunggah proyek ini ke repositori Anda sendiri:

1. Buat repositori baru di GitHub.
2. Inisialisasi dan push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit SIM Mahasiswa"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA_REPO.git
   git push -u origin main
   ```

## �🚀 Deployment ke Vercel

Aplikasi ini dapat di-deploy dengan mudah ke **Vercel**:

### 1. Persiapan
- Pastikan semua perubahan sudah di-push ke GitHub.
- Buat akun di [Vercel](https://vercel.com).

### 2. Langkah Deploy
- Pilih **"Add New"** > **"Project"** di dashboard Vercel.
- Hubungkan dengan akun GitHub Anda dan pilih repositori `SIM-Mahasiswa`.
- Pada **Framework Preset**, pilih **Vite**.
- Pada **Root Directory**, masukkan `client` (karena struktur project ini memiliki folder client yang terpisah).

### 3. Konfigurasi Environment Variables
Di dashboard Vercel, masuk ke menu **Settings** > **Environment Variables** dan tambahkan semua variabel yang ada di file `.env` lokal:
- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 4. Deploy
Klik tombol **Deploy**. Vercel akan otomatis melakukan proses *build* dan aplikasi Anda akan *live* dalam beberapa menit.

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
   Salin `.env.example` menjadi `.env` dan isi dengan kredensial Anda.
4. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

---
© 2026 Admin Kampus - SIM CEPAT Development Team.
