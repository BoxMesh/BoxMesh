import { Result } from 'antd'
import { lazy } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import AppLayout from './layouts/AppLayout'
import AlertRulesPage from './pages/alerts/AlertRulesPage'
import AlertsPage from './pages/alerts/AlertsPage'
import ChannelsPage from './pages/alerts/ChannelsPage'
import CommandsPage from './pages/commands/CommandsPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import DeviceDetailPage from './pages/device-detail/DeviceDetailPage'
import DevicesPage from './pages/devices/DevicesPage'
import GroupsPage from './pages/groups/GroupsPage'
import LoginPage from './pages/login/LoginPage'
import DesktopPage from './pages/remote-desktop/DesktopPage'
import FilesPage from './pages/remote-files/FilesPage'
import ServicesPage from './pages/remote-services/ServicesPage'
import TokensPage from './pages/tokens/TokensPage'
import UserPage from './pages/users/UserPage'
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
        <Route path="groups" element={<GroupsPage />} />
        <Route path="remote-terminal" element={<TerminalPage />} />
        <Route path="remote-desktop" element={<DesktopPage />} />
        <Route path="remote-files" element={<FilesPage />} />
        <Route path="remote-services" element={<ServicesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="alert-rules" element={<AlertRulesPage />} />
        <Route path="alert-channels" element={<ChannelsPage />} />
        <Route path="commands" element={<CommandsPage />} />
        <Route path="enrollment-tokens" element={<TokensPage />} />
        <Route
          path="*"
          element={<Result status="404" title="Page not found" subTitle="Check the address, or pick a page from the menu." />}
        />
      </Route>
    </Routes>
  )
}
