const XLSX = require('xlsx');
const path = require('path');

const students = [
    { No: 1, Nama: 'Ahmad Rizki Pratama', NIM: '2024010001', Email: 'ahmad.rizki@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Teknik', Prodi: 'Teknik Informatika' },
    { No: 2, Nama: 'Siti Nurhaliza Putri', NIM: '2024010002', Email: 'siti.nurhaliza@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Teknik', Prodi: 'Teknik Informatika' },
    { No: 3, Nama: 'Budi Santoso', NIM: '2024010003', Email: 'budi.santoso@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Teknik', Prodi: 'Teknik Sipil' },
    { No: 4, Nama: 'Dewi Lestari', NIM: '2024010004', Email: 'dewi.lestari@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Teknik', Prodi: 'Teknik Sipil' },
    { No: 5, Nama: 'Rina Wulandari', NIM: '2024020001', Email: 'rina.wulandari@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Ekonomi & Bisnis', Prodi: 'Manajemen' },
    { No: 6, Nama: 'Fajar Nugroho', NIM: '2024020002', Email: 'fajar.nugroho@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Ekonomi & Bisnis', Prodi: 'Manajemen' },
    { No: 7, Nama: 'Maya Anggraeni Sari', NIM: '2024020003', Email: 'maya.sari@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Ekonomi & Bisnis', Prodi: 'Akuntansi' },
    { No: 8, Nama: 'Rendi Hidayat', NIM: '2024020004', Email: 'rendi.hidayat@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Ekonomi & Bisnis', Prodi: 'Akuntansi' },
    { No: 9, Nama: 'Nadia Permata Sari', NIM: '2024030001', Email: 'nadia.permata@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Hukum', Prodi: 'Ilmu Hukum' },
    { No: 10, Nama: 'Dimas Prasetyo', NIM: '2024030002', Email: 'dimas.prasetyo@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Hukum', Prodi: 'Ilmu Hukum' },
    { No: 11, Nama: 'Laras Kusumaningrum', NIM: '2024040001', Email: 'laras.kusumaningrum@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Kedokteran', Prodi: 'Pendidikan Dokter' },
    { No: 12, Nama: 'Galih Ramadhan', NIM: '2024040002', Email: 'galih.ramadhan@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Kedokteran', Prodi: 'Pendidikan Dokter' },
    { No: 13, Nama: 'Anisa Fitri Handayani', NIM: '2024040003', Email: 'anisa.fitri@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Kedokteran', Prodi: 'Farmasi' },
    { No: 14, Nama: 'Yoga Aditya Putra', NIM: '2024050001', Email: 'yoga.aditya@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Ilmu Sosial & Politik', Prodi: 'Ilmu Komunikasi' },
    { No: 15, Nama: 'Putri Rahayu', NIM: '2024050002', Email: 'putri.rahayu@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Ilmu Sosial & Politik', Prodi: 'Ilmu Komunikasi' },
    { No: 16, Nama: 'Hendra Wijaya', NIM: '2024050003', Email: 'hendra.wijaya@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Ilmu Sosial & Politik', Prodi: 'Administrasi Publik' },
    { No: 17, Nama: 'Indah Permatasari', NIM: '2024060001', Email: 'indah.permatasari@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Keguruan & Ilmu Pendidikan', Prodi: 'Pendidikan Matematika' },
    { No: 18, Nama: 'Rizal Fahmi', NIM: '2024060002', Email: 'rizal.fahmi@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Keguruan & Ilmu Pendidikan', Prodi: 'Pendidikan Matematika' },
    { No: 19, Nama: 'Tania Adriani', NIM: '2024060003', Email: 'tania.adriani@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Keguruan & Ilmu Pendidikan', Prodi: 'Pendidikan Bahasa Inggris' },
    { No: 20, Nama: 'Arif Budiman', NIM: '2024060004', Email: 'arif.budiman@mhs.cepat.ac.id', Password: 'Mhs@12345', Fakultas: 'Fakultas Keguruan & Ilmu Pendidikan', Prodi: 'Pendidikan Bahasa Inggris' },
];

// Create workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Akun Mahasiswa
const ws = XLSX.utils.json_to_sheet(students);

// Set column widths
ws['!cols'] = [
    { wch: 4 },   // No
    { wch: 25 },  // Nama
    { wch: 14 },  // NIM
    { wch: 40 },  // Email
    { wch: 12 },  // Password
    { wch: 38 },  // Fakultas
    { wch: 28 },  // Prodi
];

XLSX.utils.book_append_sheet(wb, ws, 'Akun Mahasiswa');

// Sheet 2: Akun Staff
const staffAccounts = [
    { No: 1, Role: 'Super Admin', Email: 'superadmin@sim.ac.id', Password: 'superadmin123' },
    { No: 2, Role: 'Dosen', Email: 'dosen@sim.ac.id', Password: 'dosen123' },
    { No: 3, Role: 'Staff Akademik', Email: 'akademik@sim.ac.id', Password: 'akademik123' },
    { No: 4, Role: 'Keuangan', Email: 'keuangan@sim.ac.id', Password: 'keuangan123' },
];

const ws2 = XLSX.utils.json_to_sheet(staffAccounts);
ws2['!cols'] = [
    { wch: 4 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
];
XLSX.utils.book_append_sheet(wb, ws2, 'Akun Staff');

// Write file
const outputPath = path.join(__dirname, '..', 'docs', 'Daftar_Akun_Login_SIM_CEPAT.xlsx');
const fs = require('fs');
const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

XLSX.writeFile(wb, outputPath);
console.log(`✅ File Excel berhasil dibuat: ${outputPath}`);
