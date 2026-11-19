// The brand mark and lockup: Zin's octopus knocked out of a hexagon (a network node), the same drawing as
// public/favicon.svg. The hexagon takes the brand orange; the octopus is fixed cream so it reads on the sider, the
// sign-in page and the one-window notice in both themes.

const ARMS = 'M16.5 28.5C16 33 14 33 14 36M22 29.5C21.8 33 21 34 21 37M26 29.5C26.2 33 27 34 27 37M31.5 28.5C32 33 34 33 34 36'

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="var(--brand)" d="M24 2.5L43 13.2V34.8L24 45.5L5 34.8V13.2Z" />
      <path fill="#fff7ed" d="M14 27C13 19 17 13 24 13S35 19 34 27C33 29.6 15 29.6 14 27Z" />
      <path d={ARMS} stroke="#fff7ed" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <circle cx={20.3} cy={21} r={2.1} fill="var(--brand)" />
      <circle cx={27.7} cy={21} r={2.1} fill="var(--brand)" />
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
