import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Eagerly loaded (critical path)
import { Login } from '../pages/Login';
import { Redirect } from '../pages/Redirect';

// Lazy-loaded dashboard pages
const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const MyPage = lazy(() => import('../pages/MyPage').then(m => ({ default: m.MyPage })));
const Design = lazy(() => import('../pages/Design').then(m => ({ default: m.Design })));
const Analytics = lazy(() => import('../pages/Analytics').then(m => ({ default: m.Analytics })));
const Audience = lazy(() => import('../pages/Audience').then(m => ({ default: m.Audience })));
const Settings = lazy(() => import('../pages/Settings').then(m => ({ default: m.Settings })));
const ProfileEdit = lazy(() => import('../pages/ProfileEdit').then(m => ({ default: m.ProfileEdit })));
const PublicProfile = lazy(() => import('../pages/PublicProfile').then(m => ({ default: m.PublicProfile })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-paper)]">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-accent)] border-t-transparent" />
        <p className="text-sm text-[var(--color-muted)] animate-pulse">Carregando...</p>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }
  return user ? children : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/r/:linkId" element={<Redirect />} />
        <Route path="/profile/edit" element={
          <PrivateRoute>
            <ProfileEdit />
          </PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/dashboard/my-page" element={
          <PrivateRoute>
            <MyPage />
          </PrivateRoute>
        } />
        <Route path="/dashboard/design" element={
          <PrivateRoute>
            <Design />
          </PrivateRoute>
        } />
        <Route path="/dashboard/analytics" element={
          <PrivateRoute>
            <Analytics />
          </PrivateRoute>
        } />
        <Route path="/dashboard/audience" element={
          <PrivateRoute>
            <Audience />
          </PrivateRoute>
        } />
        <Route path="/dashboard/settings" element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/:username" element={<PublicProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
