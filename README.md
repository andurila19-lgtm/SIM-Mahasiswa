# SIM Akademik - Modern Student Information System

Sistem Informasi Manajemen (SIM) Akademik modern berstandar SaaS yang dirancang untuk efisiensi pengelolaan data mahasiswa, rencana studi, dan pemantauan akademik secara real-time.

## ✨ Fitur Utama (Terbaru)

### 👥 Manajemen Mahasiswa Tingkat Lanjut
*   **Data Komprehensif**: Mendukung struktur akademik lengkap (Fakultas, Prodi (D3/S1/S2/S3), Semester, Status).
*   **Smart Filter & Search**: Pencarian instan berdasarkan Nama/NIM dengan filter status dan tombol hapus pencarian otomatis.
*   **Data Persistence**: Menggunakan sistem hybrid (Supabase + LocalStorage) sehingga data tetap aman meski halaman di-refresh.
*   **Input Dinamis**: Formulir pendaftaran cerdas dengan dropdown Prodi yang berubah otomatis sesuai Fakultas yang dipilih.

### 📄 Ekspor Data Multi-Format
*   **Excel Export**: Unduh daftar mahasiswa lengkap dalam format `.xlsx` untuk keperluan laporan administratif.
*   **Premium PDF Print**: Layout cetak yang dioptimalkan (menyembunyikan sidebar/header) untuk hasil dokumen fisik yang profesional.

### 📚 Integrasi KRS (Kartu Rencana Studi)
*   **Manajemen Personal**: Admin/Dosen dapat mengelola KRS langsung dari profil spesifik mahasiswa.
*   **Filter Relevansi**: Daftar mata kuliah di halaman KRS otomatis terfilter berdasarkan Prodi dan Semester mahasiswa yang bersangkutan.
*   **Detail Penjadwalan**: Informasi lengkap mencakup Nama Dosen, Ruang Kelas, Kode Matkul, SKS, dan Jam Kuliah.

### 🎨 UI/UX Premium
*   **Rich Aesthetics**: Desain modern menggunakan Tailwind CSS dengan efek glassmorphism, animasi Framer Motion, dan dukungan Dark Mode.
*   **Responsive**: Pengalaman mulus di perangkat desktop maupun tablet.

---

## 🛠️ Arsitektur Teknologi
- **Frontend**: React.js 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Lucide React (Icons), Framer Motion (Animations)
- **Backend & Database**: Supabase (Postgres), Firebase (Auth & Storage)
- **Utilities**: XLSX (Excel processing), File-Saver, React Router 6

---

## 🚀 Cara Menjalankan Project

### 1. Prasyarat
- Node.js (v18 ke atas)
- Akun Supabase & Firebase

### 2. Setup Environment
Buat file `.env` di folder `client/` (cek `.env.example` untuk referensi):
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_FIREBASE_API_KEY=...
... (dan variabel firebase lainnya)
```

### 3. Instalasi & Eksekusi
```bash
# Instal dependencies
npm install

# Jalankan mode pengembangan
npm run start
```

---

## 🛡️ Manajemen Peran (Roles)
1. **Super Admin**: Kontrol penuh sistem dan manajemen data induk.
2. **Dosen (Lecturer)**: Pemantauan akademik, pengelolaan KRS mahasiswa, dan input nilai.
3. **Mahasiswa (Student)**: Pendaftaran KRS, melihat jadwal, dan riwayat pembayaran.

---

## 📈 Roadmap Pengembangan
- [x] Manajemen Mahasiswa & Struktur Fakultas Lengkap.
- [x] Ekspor PDF & Excel.
- [x] Integrasi KRS per Mahasiswa.
- [ ] Sistem Absensi Real-time.
- [ ] Modul Pembayaran Virtual Account.
- [ ] Grafik Statistik Akademik (Charts).

---
© 2026 - Dikembangkan untuk SIM Akademik Modern.
