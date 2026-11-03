import { Result } from 'antd'
import { Navigate, Route, Routes } from 'react-router'
import NotSupported from './components/NotSupported'
import { navItems } from './config/nav'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/dashboard/DashboardPage'
import DeviceDetailPage from './pages/device-detail/DeviceDetailPage'
import DevicesPage from './pages/devices/DevicesPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="devices/:id" element={<DeviceDetailPage />} />
        {navItems
          .filter((i) => !i.ready)
          .map((i) => (
            <Route key={i.path} path={i.path} element={<NotSupported feature={i} />} />
          ))}
        <Route
          path="*"
          element={<Result status="404" title="Page not found" subTitle="Check the address, or pick a page from the menu." />}
        />
      </Route>
    </Routes>
  )
}
