import type { NavGroup } from '../types/nav'

// Menu groups from the design's Sider.
export const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ icon: 'dashboard', label: 'Dashboard', path: '/dashboard' }],
  },
  {
    title: 'Device',
    items: [
      { icon: 'devices', label: 'Devices', path: '/devices' },
      { icon: 'tag', label: 'Groups', path: '/groups' },
    ],
  },
  {
    title: 'Remote',
    items: [
      { icon: 'terminal', label: 'Remote Terminal', path: '/remote-terminal' },
      { icon: 'desktop', label: 'Remote Desktop', path: '/remote-desktop' },
      { icon: 'files', label: 'Remote Files', path: '/remote-files' },
      { icon: 'web', label: 'Remote Service', path: '/remote-services' },
    ],
  },
  {
    title: 'Alert',
    items: [
      { icon: 'bell', label: 'Alerts', path: '/alerts' },
      { icon: 'warning', label: 'Rules', path: '/alert-rules' },
      { icon: 'mail', label: 'Channels', path: '/alert-channels' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { icon: 'users', label: 'Users & Access', path: '/users' },
      { icon: 'lock', label: 'Command rules', path: '/commands' },
      { icon: 'security', label: 'Enrollment tokens', path: '/enrollment-tokens' },
    ],
  },
]

export const navItems = navGroups.flatMap((g) => g.items)

export const navItem = (path: string) => navItems.find((i) => i.path === path)!
