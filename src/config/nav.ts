import type { NavGroup } from '../types/nav'

// Menu groups from the design's Sider.
export const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
      { icon: 'devices', label: 'Devices', path: '/devices' },
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
    title: 'Operations',
    items: [
      { icon: 'jobs', label: 'Command & Jobs', path: '/jobs' },
      { icon: 'audit', label: 'Audit & Alerts', path: '/audit' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { icon: 'security', label: 'Security & Certificates', path: '/security/certificates' },
      { icon: 'users', label: 'Users & Access', path: '/users' },
      { icon: 'settings', label: 'System Settings', path: '/settings' },
    ],
  },
]

export const navItems = navGroups.flatMap((g) => g.items)

export const navItem = (path: string) => navItems.find((i) => i.path === path)!
