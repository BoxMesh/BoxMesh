import { useQueryClient, useQueryErrorResetBoundary } from '@tanstack/react-query'
import { Avatar, Breadcrumb, Dropdown, Input, Layout, Menu, Spin, type MenuProps } from 'antd'
import { Suspense } from 'react'
import { Link, Outlet, useLocation, useMatch, useNavigate } from 'react-router'
import ErrorBoundary from '../components/ErrorBoundary'
import { Icon } from '../components/Icon'
import ThemeToggle from '../components/ThemeToggle'
import { navGroups, navItems } from '../config/nav'
import { getSession, signOut } from '../services/authService'
import { isDemo } from '../services/demo'

const menuItems: MenuProps['items'] = navGroups.map((g) => ({
  type: 'group',
  key: g.title,
  label: g.title,
  children: g.items.map((i) => ({
    key: i.path,
    icon: <Icon name={i.icon} />,
    label: <Link to={i.path}>{i.label}</Link>,
  })),
}))

export default function AppLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const deviceMatch = useMatch('/devices/:id')
  const { reset } = useQueryErrorResetBoundary()
  const active = navItems.find((i) => pathname === i.path || pathname.startsWith(`${i.path}/`))
  const queryClient = useQueryClient()
  const user = getSession()

  const accountMenu: MenuProps = {
    items: [{ type: 'group', key: 'account', label: user?.email, children: [{ key: 'sign-out', label: 'Sign out' }] }],
    onClick: () => {
      const wasDemo = isDemo()
      signOut()
      // Drop cached fleet data so the next person to sign in never sees it.
      queryClient.clear()
      // The demo swaps the HTTP adapter for the whole page, so leaving it needs a fresh load.
      if (wasDemo) location.assign('/login')
      else navigate('/login', { replace: true })
    },
  }

  const crumbs = [
    { title: 'BoxMesh' },
    ...(active ? [{ title: deviceMatch ? <Link to={active.path}>{active.label}</Link> : active.label }] : []),
    ...(deviceMatch ? [{ title: deviceMatch.params.id }] : []),
  ]

  return (
    <Layout className="app">
      <Layout.Sider className="app-sider" width={216} breakpoint="lg" collapsedWidth={0}>
        <Link to="/dashboard" className="brand">
          <Icon name="logo" size={22} />
          BoxMesh
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
            <ThemeToggle />
            <Dropdown menu={accountMenu} trigger={['click']} placement="bottomRight">
              <button type="button" className="user" aria-label={`Account: ${user?.email}`}>
                <Avatar size={28}>{user?.name.charAt(0).toUpperCase()}</Avatar>
                <span className="user-name">{user?.name}</span>
              </button>
            </Dropdown>
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
