import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import PrayersPage from './pages/PrayersPage';
import UsersPage from './pages/UsersPage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import AttendancePage from './pages/AttendancePage';
import ToolsPage from './pages/ToolsPage';
import FullPageMessage from './components/FullPageMessage';
import { useAuth } from './auth/AuthContext';

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageMessage loading title="Loading session..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== 'admin')
    return (
      <FullPageMessage
        title="Admins only"
        message="This dashboard requires an admin role. Ask a team member to grant access."
      />
    );

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/prayers" element={<PrayersPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/tools" element={<ToolsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
