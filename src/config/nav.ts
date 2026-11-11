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
    title: 'Admin',
    items: [
      { icon: 'users', label: 'Users & Access', path: '/users' },
    ],
  },
]

export const navItems = navGroups.flatMap((g) => g.items)

export const navItem = (path: string) => navItems.find((i) => i.path === path)!
