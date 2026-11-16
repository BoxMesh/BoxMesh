import type { NavGroup } from '../types/nav'
import { t } from '../i18n'
import { getSession } from '../services/authService'

// Menu groups from the design's Sider. Functions, so the labels follow the current language.
const groups = (): NavGroup[] => [
  {
    title: t('Overview'),
    items: [{ icon: 'dashboard', label: t('Dashboard'), path: '/dashboard' }],
  },
  {
    title: t('Device'),
    items: [
      { icon: 'devices', label: t('Devices'), path: '/devices' },
      { icon: 'tag', label: t('Groups'), path: '/groups' },
    ],
  },
  {
    title: t('Remote'),
    items: [
      { icon: 'terminal', label: t('Remote Terminal'), path: '/remote-terminal' },
      { icon: 'files', label: t('Remote Files'), path: '/remote-files' },
      { icon: 'web', label: t('Remote Service'), path: '/remote-services' },
    ],
  },
  {
    title: t('Alert'),
    items: [
      { icon: 'bell', label: t('Alerts'), path: '/alerts' },
      { icon: 'warning', label: t('Rules'), path: '/alert-rules' },
      { icon: 'mail', label: t('Channels'), path: '/alert-channels' },
    ],
  },
  {
    title: t('Admin'),
    admin: true,
    items: [
      { icon: 'users', label: t('Users & Access'), path: '/users' },
      { icon: 'lock', label: t('Command rules'), path: '/commands' },
      { icon: 'security', label: t('Enrollment tokens'), path: '/enrollment-tokens' },
    ],
  },
]

// An Operator never sees the Admin group; App.tsx keeps its routes out of reach too.
export const navGroups = () => groups().filter((g) => !g.admin || getSession()?.role === 'Admin')

export const navItems = () => navGroups().flatMap((g) => g.items)

export const navItem = (path: string) => navItems().find((i) => i.path === path)!
