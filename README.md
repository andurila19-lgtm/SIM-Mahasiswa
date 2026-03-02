# SIM Mahasiswa - Student Management Information System

A modern, scalable, and secure Academic Information System built with React, Express, Supabase, and Firebase.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Supabase Account (PostgreSQL)
- Firebase Account (Auth & Storage)

### 2. Environment Setup
Copy `.env.example` in both `server/` and `client/` folders to `.env` and fill in your credentials.

**Server (.env):**
- `PORT` (default 5000)
- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`
- `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

**Client (.env):**
- `VITE_API_URL` (http://localhost:5000/api)
- `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN` etc.

### 3. Database Schema
Run the SQL script provided in `artifacts/schema.sql.md` (or similar) in your Supabase SQL Editor.

### 4. Installation
```bash
npm run install:all
```

### 5. Running the Project
```bash
npm run start
```
This will launch both the Express backend (Port 5000) and the Vite frontend (Port 5173).

## 🛡️ Role Management
The system supports 3 roles:
1. `super_admin`: Full system control.
2. `lecturer`: Grade management & student monitoring.
3. `student`: Academic records & KRS enrollment.

## ✨ Key Features
- **Authentication**: Role-based access with Firebase.
- **Academic Ops**: Course registration (KRS), Grade Results (KHS), Attendance.
- **Payments**: Tuition tracking & proof upload.
- **Dynamic Dashboard**: Personalized stats and schedules per role.
- **Export**: PDF Export for transcripts (Ready to implement).
