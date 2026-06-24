import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts (Không lazy load Layouts vì chúng là bộ khung hiển thị liên tục)
import MainLayout      from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages - Dùng Lazy Loading để giảm tải
const Home          = lazy(() => import('./pages/Home'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const PublicTeams   = lazy(() => import('./pages/PublicTeams'));
const PublicNews    = lazy(() => import('./pages/PublicNews'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));

// Dashboard Pages - Cán bộ mới cần tải đống JS này
const Overview     = lazy(() => import('./pages/dashboard/Overview'));
const TeamsList    = lazy(() => import('./pages/dashboard/TeamsList'));
const AddTeam      = lazy(() => import('./pages/dashboard/AddTeam'));
const NewsAdmin    = lazy(() => import('./pages/dashboard/NewsAdmin'));
const UsersList    = lazy(() => import('./pages/dashboard/UsersList'));
const Profile      = lazy(() => import('./pages/dashboard/Profile'));

// eOffice Pages - Tính năng nâng cao, chỉ tải khi vào eOffice
const EofficeDashboard  = lazy(() => import('./pages/dashboard/eoffice/EofficeDashboard'));
const DocumentsIncoming = lazy(() => import('./pages/dashboard/eoffice/DocumentsIncoming'));
const DocumentsOutgoing = lazy(() => import('./pages/dashboard/eoffice/DocumentsOutgoing'));
const TasksManager      = lazy(() => import('./pages/dashboard/eoffice/TasksManager'));
const ActivityLog       = lazy(() => import('./pages/dashboard/eoffice/ActivityLog'));
const AiReport          = lazy(() => import('./pages/dashboard/eoffice/AiReport'));

import ChatbotWidget from './components/ChatbotWidget';

const ADMIN_ROLES = ['COMMUNE_ADMIN', 'PROVINCE_ADMIN', 'ADMIN', 'SENIOR_ADMIN'];

// Route guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  if (!allowedRoles && !ADMIN_ROLES.includes(role)) return <Navigate to="/" replace />;

  return children;
};

// Component loading cực nhẹ hiển thị trong lúc chờ tải Chunk JavaScript
const PageLoader = () => (
  <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
    <span style={{ marginTop: 16, color: 'var(--tx-3)', fontSize: '0.9rem', fontWeight: 500 }}>Đang tải màn hình...</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Pages */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/teams" element={<PublicTeams />} />
            <Route path="/doi-hinh" element={<PublicTeams />} />
            <Route path="/news" element={<PublicNews />} />
            <Route path="/tin-tuc" element={<PublicNews />} />
            <Route path="/profile" element={<PublicProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Dashboard (staff/admin only) */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="map" element={<TeamsList />} />
            <Route path="map/add" element={<AddTeam />} />
            <Route path="map/edit/:id" element={<AddTeam />} />
            <Route path="news" element={<NewsAdmin />} />
            <Route path="users" element={<ProtectedRoute allowedRoles={['SENIOR_ADMIN']}><UsersList /></ProtectedRoute>} />
            <Route path="profile" element={<Profile />} />

            {/* AI eOffice */}
            <Route path="eoffice" element={<EofficeDashboard />} />
            <Route path="eoffice/incoming" element={<DocumentsIncoming />} />
            <Route path="eoffice/outgoing" element={<DocumentsOutgoing />} />
            <Route path="eoffice/tasks" element={<TasksManager />} />
            <Route path="eoffice/report" element={<ProtectedRoute allowedRoles={['COMMUNE_ADMIN', 'PROVINCE_ADMIN', 'ADMIN', 'SENIOR_ADMIN']}><AiReport /></ProtectedRoute>} />
            <Route path="eoffice/activity" element={<ProtectedRoute allowedRoles={['ADMIN', 'SENIOR_ADMIN']}><ActivityLog /></ProtectedRoute>} />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ChatbotWidget />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} pauseOnHover theme="light" />
    </>
  );
}

export default App;
