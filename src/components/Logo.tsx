// The brand mark and lockup: Zin's octopus, the same drawing as public/favicon.svg. The body takes the brand
// orange; the eyes are fixed cream and ink so the face reads on the sider, the sign-in page and the one-window
// notice in both themes.

const ARMS = [
  'M13 27C11 34 6 34 5.5 39.5C5.2 42.5 8.5 43.5 10 41.5',
  'M19.5 29C18.5 36 15 38 16.5 43',
  'M28.5 29C29.5 36 33 38 31.5 43',
  'M35 27C37 34 42 34 42.5 39.5C42.8 42.5 39.5 43.5 38 41.5',
]

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g fill="none" stroke="var(--brand)" strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round">
        {ARMS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path fill="var(--brand)" d="M9 26C6.5 12 14.5 2.5 24 2.5S41.5 12 39 26C37 30 11 30 9 26Z" />
      <circle cx={18} cy={21} r={4.2} fill="#fff7ed" />
      <circle cx={30} cy={21} r={4.2} fill="#fff7ed" />
      <circle cx={18.8} cy={21.6} r={2} fill="#101416" />
      <circle cx={30.8} cy={21.6} r={2} fill="#101416" />
    </svg>
  )
}

/** Mark and wordmark together. The parent sets the font size; "in" carries the accent. */
export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-word">
        Z<span>in</span>
      </span>
    </span>
  )
}
