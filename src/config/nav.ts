import type { NavGroup } from '../types/nav'
import { t } from '../i18n'

// Menu groups from the design's Sider.
export const navGroups: NavGroup[] = [
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
      { icon: 'desktop', label: t('Remote Desktop'), path: '/remote-desktop' },
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
    items: [
      { icon: 'users', label: t('Users & Access'), path: '/users' },
      { icon: 'lock', label: t('Command rules'), path: '/commands' },
      { icon: 'security', label: t('Enrollment tokens'), path: '/enrollment-tokens' },
    ],
  },
]

export const navItems = navGroups.flatMap((g) => g.items)

export const navItem = (path: string) => navItems.find((i) => i.path === path)!
