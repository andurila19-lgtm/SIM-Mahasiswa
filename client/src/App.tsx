import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
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

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
    const { user, profile, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <Router
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
            }}
        >
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route path="/" element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="profile" element={<ProfilePage />} />

                    {/* Super Admin & Lecturer */}
                    <Route path="students" element={
                        <ProtectedRoute allowedRoles={['super_admin', 'lecturer']}>
                            <StudentManagement />
                        </ProtectedRoute>
                    } />
                    <Route path="lecturers" element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                            <LecturerManagement />
                        </ProtectedRoute>
                    } />

                    {/* Universal but role-filtered view */}
                    <Route path="academic" element={<AcademicSystem />} />
                    <Route path="krs" element={<KRSPage />} />
                    <Route path="grades" element={<GradesPage />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="payments" element={<PaymentsPage />} />
                    <Route path="announcements" element={<AnnouncementsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
};

export default App;
