// Stroke icons copied from the design canvas (24 viewBox, stroke 2, round caps).
const paths = {
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  devices: 'M3 4h18v12H3zM8 20h8M12 16v4',
  terminal: 'M4 17l6-5-6-5M12 19h8',
  desktop: 'M4 4l7 17 2-7 7-2z',
  files: 'M3 6h6l2 2h10v11H3z',
  web: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  jobs: 'M10 6h10M10 12h10M10 18h10M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  security: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  users: 'M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8M2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 0 0 0-6M19 15c2 .6 3 2.6 3 6',
  audit: 'M6 3h9l4 4v14H6zM9 12h7M9 16h7M9 8h3',
  settings: 'M12 15a3 3 0 1 0 0-6a3 3 0 1 0 0 6M19 12h2M3 12h2M12 3v2M12 19v2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4',
  search: 'M11 18a7 7 0 1 0 0-14a7 7 0 1 0 0 14M21 21l-5-5',
  mail: 'M3 5h18v14H3zM3 5l9 7 9-7',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  plus: 'M12 5v14M5 12h14',
  warning: 'M12 3l10 18H2zM12 10v5M12 18v.5',
  back: 'M15 18l-6-6 6-6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  'arrow-left': 'M19 12H5M11 6l-6 6 6 6',
  swap: 'M7 4L3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7',
  close: 'M6 6l12 12M18 6L6 18',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  columns: 'M4 5h16v14H4zM12 5v14',
  more: 'M5 11a1 1 0 1 0 0 2a1 1 0 1 0 0-2M12 11a1 1 0 1 0 0 2a1 1 0 1 0 0-2M19 11a1 1 0 1 0 0 2a1 1 0 1 0 0-2',
  sun: 'M12 16a4 4 0 1 0 0-8a4 4 0 1 0 0 8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  clock: 'M12 21a9 9 0 1 0 0-18a9 9 0 1 0 0 18M12 7v5l4 2',
  chip: 'M7 7h10v10H7zM4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3',
  box: 'M3 8h18v11H3zM3 8l2-4h14l2 4M12 8v11',
  pulse: 'M3 12h4l2-5 3.5 10 2.5-5h6',
  tag: 'M19 13l-6 6-9-9V4h7zM7.5 7.5h.01',
  check: 'M4 12.5l5 5L20 6.5',
  hash: 'M9 3L7 21M17 3l-2 18M4 9h17M3 15h17',
}

export type IconName = keyof typeof paths

/** A table column heading. Every data table uses it, so the header row reads as a header everywhere. */
export function Th({ icon, label }: { icon: IconName; label: string }) {
  return (
    <span className="th">
      <Icon name={icon} size={13} />
      {label}
    </span>
  )
}

// className lets antd (Menu, Button) attach its icon classes for spacing.
export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  )
}
