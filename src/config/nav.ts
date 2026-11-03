import type { NavGroup } from '../types/nav'

// Menu groups from the design's Sider; summaries follow the canvas's sitemap.
export const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { icon: 'dashboard', label: 'Dashboard', path: '/dashboard', ready: true },
      { icon: 'devices', label: 'Devices', path: '/devices', ready: true },
    ],
  },
  {
    title: 'Remote',
    items: [
      {
        icon: 'terminal',
        label: 'Remote Terminal',
        path: '/terminal',
        summary: 'Run PowerShell, CMD or Bash on a device through its agent tunnel, with a history of every command.',
      },
      {
        icon: 'desktop',
        label: 'Remote Desktop',
        path: '/desktop',
        summary: "See and control a device's screen, with clipboard sync, through its agent tunnel.",
      },
      {
        icon: 'files',
        label: 'Remote Files',
        path: '/files',
        summary: 'Browse, upload, download and rename files on a device.',
      },
      {
        icon: 'web',
        label: 'Remote Service',
        path: '/web-apps',
        summary: "Open web apps running on a device, such as Grafana or an internal dashboard, through EdgePanel's proxy.",
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        icon: 'jobs',
        label: 'Command & Jobs',
        path: '/jobs',
        summary: 'Run a command on many devices or groups at once, now or on a schedule, and track each result.',
      },
      {
        icon: 'audit',
        label: 'Audit & Alerts',
        path: '/audit',
        summary: 'See who did what on which device, and get alerted when a device goes offline or crosses a threshold.',
      },
    ],
  },
  {
    title: 'Admin',
    items: [
      {
        icon: 'security',
        label: 'Security & Certificates',
        path: '/security/certificates',
        summary: "Manage agent certificates and enrollment tokens, and revoke a device's access.",
      },
      {
        icon: 'users',
        label: 'Users & Access',
        path: '/users',
        summary: 'Add people, give them the Admin, Operator or Viewer role, and choose which devices each can reach.',
      },
      {
        icon: 'settings',
        label: 'System Settings',
        path: '/settings',
        summary: "Set heartbeat and log retention, check EdgePanel's health, and back up or restore its data.",
      },
    ],
  },
]

export const navItems = navGroups.flatMap((g) => g.items)

export const navItem = (path: string) => navItems.find((i) => i.path === path)!
