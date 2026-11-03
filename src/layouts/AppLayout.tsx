import { useQuery, useQueryErrorResetBoundary } from '@tanstack/react-query'
import { Avatar, Badge, Breadcrumb, Input, Layout, Menu, Spin, Tooltip, type MenuProps } from 'antd'
import { Suspense } from 'react'
import { Link, Outlet, useLocation, useMatch, useNavigate } from 'react-router'
import ErrorBoundary from '../components/ErrorBoundary'
import { Icon } from '../components/Icon'
import { navGroups, navItems } from '../config/nav'
import { useThemeMode } from '../hooks/useThemeMode'
import { devicesQuery } from '../services/queries'
import { summarize } from '../utils/devices'

// Unbuilt modules stay reachable but muted.
const menuItems: MenuProps['items'] = navGroups.map((g) => ({
  type: 'group',
  key: g.title,
  label: g.title,
  children: g.items.map((i) => ({
    key: i.path,
    className: i.ready ? undefined : 'menu-soon',
    icon: <Icon name={i.icon} />,
    label: <Link to={i.path}>{i.label}</Link>,
  })),
}))

export default function AppLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const deviceMatch = useMatch('/devices/:id')
  const { reset } = useQueryErrorResetBoundary()
  const { mode, toggle } = useThemeMode()
  const nextTheme = mode === 'dark' ? 'light' : 'dark'
  const { data: devices } = useQuery(devicesQuery)
  const openAlerts = devices ? summarize(devices).alerts.length : 0
  const active = navItems.find((i) => pathname === i.path || pathname.startsWith(`${i.path}/`))

  const crumbs = [
    { title: 'EdgePortal' },
    ...(active ? [{ title: deviceMatch ? <Link to={active.path}>{active.label}</Link> : active.label }] : []),
    ...(deviceMatch ? [{ title: deviceMatch.params.id }] : []),
  ]

  return (
    <Layout className="app">
      <Layout.Sider className="app-sider" width={216} breakpoint="lg" collapsedWidth={0}>
        <Link to="/dashboard" className="brand">
          <Icon name="logo" size={22} />
          EdgePortal
        </Link>
        <Menu mode="inline" selectedKeys={active ? [active.path] : []} items={menuItems} />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="app-header">
          <Breadcrumb items={crumbs} />
          <div className="header-tools">
            <Input
              className="header-search"
              prefix={<Icon name="search" size={14} />}
              placeholder="Search hostname, IP…"
              aria-label="Search devices"
              onPressEnter={(e) => navigate(`/devices?q=${encodeURIComponent(e.currentTarget.value.trim())}`)}
            />
            <Tooltip title={`Switch to ${nextTheme} theme`}>
              <button type="button" className="icon-btn" onClick={toggle} aria-label={`Switch to ${nextTheme} theme`}>
                <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={18} />
              </button>
            </Tooltip>
            <Link to="/dashboard#attention" className="icon-btn" aria-label={`Open alerts: ${openAlerts}`}>
              <Badge count={openAlerts} size="small">
                <Icon name="bell" size={18} />
              </Badge>
            </Link>
            <span className="user">
              <Avatar size={28}>A</Avatar>
              admin
            </span>
          </div>
        </Layout.Header>
        <Layout.Content className="app-content">
          {/* Keyed by path so an error on one page clears when you navigate away. */}
          <ErrorBoundary key={pathname} onReset={reset}>
            <Suspense
              fallback={
                <div className="page-loading">
                  <Spin size="large" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
