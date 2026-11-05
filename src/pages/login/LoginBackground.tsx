import type { MouseEvent } from 'react'
// The owner's artwork; index.css (.login-bg) maps its palette colours to theme tokens for light mode.
import svg from '../../assets/boxmesh.svg?raw'

const PING_SPEED = 600 // viewBox units per second

/** Click a machine: it sends one extra packet now, along the route its own ambient ping takes to the panel. */
function sendPing(event: MouseEvent<HTMLDivElement>) {
  const node = (event.target as Element).closest('#os-nodes use')
  if (!node || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // Every route in #pings starts at the centre of its machine's icon.
  const x = Number(node.getAttribute('x')) + Number(node.getAttribute('width')) / 2
  const y = Number(node.getAttribute('y')) + Number(node.getAttribute('height')) / 2
  const route = event.currentTarget.querySelector<SVGPathElement>(`#pings path[d^="M${x} ${y}L"]`)
  if (!route) return
  const ping = route.cloneNode() as SVGPathElement
  ping.setAttribute('class', 'ping-burst')
  ping.style.cssText = `animation-duration:${route.getTotalLength() / PING_SPEED}s`
  ping.addEventListener('animationend', () => ping.remove())
  route.after(ping)
}

/** Full-window mesh of Windows and Linux machines behind the sign-in card.
 *  Inlined (not an <img>) so page CSS can theme it. */
export default function LoginBackground() {
  // Safe: a bundled local asset, never user input.
  return <div className="login-bg" aria-hidden="true" onClick={sendPing} dangerouslySetInnerHTML={{ __html: svg }} />
}
