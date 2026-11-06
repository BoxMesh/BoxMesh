// The brand mark and lockup from the design's Logo.html: a box seen from its corner, its vertices the
// mesh, the lime core the control plane every agent dials into. The cage takes the surrounding text
// colour, so the same mark works on the sider, the sign-in page and the one-window notice.

const CAGE = 'M24 5L40.5 14.5V33.5L24 43L7.5 33.5V14.5Z M24 24L7.5 14.5M24 24L40.5 14.5M24 24V43'
const NODES = [
  [24, 5],
  [40.5, 14.5],
  [40.5, 33.5],
  [24, 43],
  [7.5, 33.5],
  [7.5, 14.5],
] as const

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={CAGE} />
      {/* Filled with whatever is behind the mark, so the cage lines stop at each node instead of crossing it. */}
      {NODES.map(([cx, cy]) => (
        <circle key={`${cx},${cy}`} cx={cx} cy={cy} r={3.2} fill="var(--logo-ground, var(--bg-surface))" strokeWidth={2} />
      ))}
      <circle cx={24} cy={24} r={5.2} fill="var(--brand)" strokeWidth={2} />
    </svg>
  )
}

/** Mark and wordmark together. The parent sets the font size; "Mesh" carries the accent. */
export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-word">
        Box<span>Mesh</span>
      </span>
    </span>
  )
}
