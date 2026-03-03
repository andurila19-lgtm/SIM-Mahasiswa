import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initGA, trackPageView } from './lib/analytics';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import StudentManagement from './pages/StudentManagement';
import KRSPage from './pages/KRSPage';
import AcademicSystem from './pages/AcademicSystem';
import GradesPage from './pages/GradesPage';
import AttendancePage from './pages/AttendancePage';
import PaymentsPage from './pages/PaymentsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import MainLayout from './layouts/MainLayout';
import LoadingScreen from './components/LoadingScreen';
import LecturerManagement from './pages/LecturerManagement';
import ForbiddenPage from './pages/ForbiddenPage';
import MyClassesPage from './pages/MyClassesPage';
import InputGradesPage from './pages/InputGradesPage';
import KRSVerificationPage from './pages/KRSVerificationPage';
import PaymentVerificationPage from './pages/PaymentVerificationPage';
import CurriculumPage from './pages/CurriculumPage';
import UserManagement from './pages/UserManagement';
import SchedulePage from './pages/SchedulePage';
import MaterialsPage from './pages/MaterialsPage';
import StudentBillsPage from './pages/StudentBillsPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import FinanceReportPage from './pages/FinanceReportPage';
import AcademicReportPage from './pages/AcademicReportPage';
import SuperAdminPage from './pages/SuperAdminPage';
import ErrorBoundary from './components/ErrorBoundary';
import PlatformAdminDashboard from './pages/PlatformAdminDashboard';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
    const { user, profile, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
        return <Navigate to="/403" replace />;
    }

    return <>{children}</>;
};

// Analytics Tracker Component
const AnalyticsTracker: React.FC = () => {
    const location = useLocation();

    useEffect(() => {
        initGA();
    }, []);

    useEffect(() => {
        trackPageView(location.pathname + location.search);
    }, [location]);

    return null;
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AnalyticsTracker />
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/403" element={<ForbiddenPage />} />

                        <Route path="/" element={
                            <ProtectedRoute><MainLayout /></ProtectedRoute>
                        }>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<DashboardPage />} />
                            <Route path="profile" element={<ProfilePage />} />

                            {/* Superadmin & Akademik */}
                            <Route path="students" element={
                                <ProtectedRoute allowedRoles={['superadmin', 'akademik']}><StudentManagement /></ProtectedRoute>
                            } />
                            <Route path="lecturers" element={
                                <ProtectedRoute allowedRoles={['superadmin']}><LecturerManagement /></ProtectedRoute>
                            } />
                            <Route path="academic" element={
                                <ProtectedRoute allowedRoles={['superadmin', 'akademik']}><AcademicSystem /></ProtectedRoute>
                            } />
                            <Route path="krs-verification" element={
                                <ProtectedRoute allowedRoles={['superadmin', 'akademik']}><KRSVerificationPage /></ProtectedRoute>
                            } />

                            {/* Dosen */}
                            <Route path="my-classes" element={
                                <ProtectedRoute allowedRoles={['dosen']}><MyClassesPage /></ProtectedRoute>
                            } />
                            <Route path="input-grades" element={
                                <ProtectedRoute allowedRoles={['dosen']}><InputGradesPage /></ProtectedRoute>
                            } />

                            {/* Mahasiswa */}
                            <Route path="krs" element={
                                <ProtectedRoute allowedRoles={['mahasiswa', 'superadmin', 'akademik']}><KRSPage /></ProtectedRoute>
                            } />
                            <Route path="curriculum" element={
                                <ProtectedRoute allowedRoles={['superadmin', 'akademik']}><CurriculumPage /></ProtectedRoute>
                            } />
                            <Route path="grades" element={
                                <ProtectedRoute allowedRoles={['mahasiswa', 'dosen', 'superadmin']}><GradesPage /></ProtectedRoute>
                            } />
                            <Route path="attendance" element={
                                <ProtectedRoute allowedRoles={['mahasiswa', 'dosen', 'superadmin']}><AttendancePage /></ProtectedRoute>
                            } />

                            {/* Keuangan */}
                            <Route path="payments" element={
                                <ProtectedRoute allowedRoles={['mahasiswa', 'keuangan', 'superadmin']}><PaymentsPage /></ProtectedRoute>
                            } />
                            <Route path="payment-verification" element={
                                <ProtectedRoute allowedRoles={['superadmin', 'keuangan']}><PaymentVerificationPage /></ProtectedRoute>
                            } />
                            <Route path="users" element={
                                <ProtectedRoute allowedRoles={['superadmin']}><UserManagement /></ProtectedRoute>
                            } />
                            <Route path="super-admin" element={
                                <ProtectedRoute allowedRoles={['superadmin']}><SuperAdminPage /></ProtectedRoute>
                            } />

                            {/* Platform Admin (SaaS) */}
                            <Route path="platform-admin" element={
                                <ProtectedRoute allowedRoles={['platform_admin']}><PlatformAdminDashboard /></ProtectedRoute>
                            } />

                            {/* Extra Routes */}
                            <Route path="schedule" element={
                                <ProtectedRoute allowedRoles={['mahasiswa', 'akademik']}><SchedulePage /></ProtectedRoute>
                            } />
                            <Route path="materials" element={
                                <ProtectedRoute allowedRoles={['dosen']}><MaterialsPage /></ProtectedRoute>
                            } />
                            <Route path="student-bills" element={
                                <ProtectedRoute allowedRoles={['keuangan']}><StudentBillsPage /></ProtectedRoute>
                            } />
                            <Route path="payment-history" element={
                                <ProtectedRoute allowedRoles={['keuangan']}><PaymentHistoryPage /></ProtectedRoute>
                            } />
                            <Route path="finance-report" element={
                                <ProtectedRoute allowedRoles={['keuangan']}><FinanceReportPage /></ProtectedRoute>
                            } />
                            <Route path="academic-report" element={
                                <ProtectedRoute allowedRoles={['akademik']}><AcademicReportPage /></ProtectedRoute>
                            } />
                            <Route path="announcements" element={
                                <ProtectedRoute allowedRoles={['superadmin', 'mahasiswa', 'dosen', 'akademik', 'keuangan']}><AnnouncementsPage /></ProtectedRoute>
                            } />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
};

export default App;
