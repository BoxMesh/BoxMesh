import { useQuery, useQueryClient, useQueryErrorResetBoundary } from '@tanstack/react-query'
import { Avatar, Breadcrumb, Dropdown, Input, Layout, Menu, Spin, type MenuProps } from 'antd'
import { Suspense } from 'react'
import { Link, Outlet, useLocation, useMatch, useNavigate } from 'react-router'
import ErrorBoundary from '../components/ErrorBoundary'
import { Icon } from '../components/Icon'
import Logo from '../components/Logo'
import LanguageSelect from '../components/LanguageSelect'
import ThemeToggle from '../components/ThemeToggle'
import { navGroups, navItems } from '../config/nav'
import { t } from '../i18n'
import { getSession, logOut } from '../services/authService'
import { isDemo } from '../services/demo'
import { usersQuery } from '../services/queries'

const menuItems = (): MenuProps['items'] =>
  navGroups().map((g) => ({
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
  const userMatch = useMatch('/users/:id')
  // A user's crumb is their name; the page loads the same list, so this adds no request.
  const { data: accounts } = useQuery({ ...usersQuery, enabled: Boolean(userMatch) })
  const detail = deviceMatch?.params.id ?? (userMatch && (accounts?.find((a) => a.id === userMatch.params.id)?.name ?? userMatch.params.id))
  const { reset } = useQueryErrorResetBoundary()
  const active = navItems().find((i) => pathname === i.path || pathname.startsWith(`${i.path}/`))
  const queryClient = useQueryClient()
  const user = getSession()

  const accountMenu: MenuProps = {
    items: [{ type: 'group', key: 'account', label: user?.email, children: [{ key: 'sign-out', label: t('Sign out') }] }],
    onClick: async () => {
      const wasDemo = isDemo()
      await logOut()
      // Drop cached fleet data so the next person to sign in never sees it.
      queryClient.clear()
      // The demo swaps the HTTP adapter for the whole page, so leaving it needs a fresh load.
      if (wasDemo) location.assign('/login')
      else navigate('/login', { replace: true })
    },
  }

  const crumbs = [
    { title: 'BoxMesh' },
    ...(active ? [{ title: detail ? <Link to={active.path}>{active.label}</Link> : active.label }] : []),
    ...(detail ? [{ title: detail }] : []),
  ]

  return (
    <Layout className="app">
      <Layout.Sider className="app-sider" width={216} breakpoint="lg" collapsedWidth={0}>
        <Link to="/dashboard" className="brand">
          <Logo size={24} />
        </Link>
        <Menu mode="inline" selectedKeys={active ? [active.path] : []} items={menuItems()} />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="app-header">
          <Breadcrumb items={crumbs} />
          <div className="header-tools">
            <Input
              className="header-search"
              prefix={<Icon name="search" size={14} />}
              placeholder={t('Search hostname, IP…')}
              aria-label={t('Search devices')}
              onPressEnter={(e) => navigate(`/devices?q=${encodeURIComponent(e.currentTarget.value.trim())}`)}
            />
            <LanguageSelect />
            <ThemeToggle />
            <Dropdown menu={accountMenu} trigger={['click']} placement="bottomRight">
              <button type="button" className="user" aria-label={t('Account: {email}', { email: user?.email ?? '' })}>
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
