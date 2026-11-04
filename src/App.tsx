import { Result } from 'antd'
import { lazy } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import AppLayout from './layouts/AppLayout'
import AuditPage from './pages/audit/AuditPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import DeviceDetailPage from './pages/device-detail/DeviceDetailPage'
import DevicesPage from './pages/devices/DevicesPage'
import JobsPage from './pages/jobs/JobsPage'
import LoginPage from './pages/login/LoginPage'
import DesktopPage from './pages/remote-desktop/DesktopPage'
import FilesPage from './pages/remote-files/FilesPage'
import ServicesPage from './pages/remote-services/ServicesPage'
import CertificatesPage from './pages/security/CertificatesPage'
import SettingsPage from './pages/settings/SettingsPage'
import UsersPage from './pages/users/UsersPage'
import { getSession } from './services/authService'

// xterm is a third of the bundle and only this screen needs it; AppLayout's Suspense covers the wait.
const TerminalPage = lazy(() => import('./pages/remote-terminal/TerminalPage'))

// Signed-out visitors go to /login, which sends them back here after signing in.
function RequireAuth() {
  const location = useLocation()
  return getSession() ? <AppLayout /> : <Navigate to="/login" state={{ from: location }} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="devices/:id" element={<DeviceDetailPage />} />
        <Route path="remote-terminal" element={<TerminalPage />} />
        <Route path="remote-desktop" element={<DesktopPage />} />
        <Route path="remote-files" element={<FilesPage />} />
        <Route path="remote-services" element={<ServicesPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="security/certificates" element={<CertificatesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="*"
          element={<Result status="404" title="Page not found" subTitle="Check the address, or pick a page from the menu." />}
        />
      </Route>
    </Routes>
  )
}
