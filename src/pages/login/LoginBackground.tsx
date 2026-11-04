// The owner's artwork; index.css (.login-bg) maps its palette colours to theme tokens for light mode.
import artwork from '../../assets/edgeportal.svg?raw'

// The C2PA manifest is provenance data for the file, not for the page; keep it out of the DOM.
// shortcut: it still ships in the bundle (~30 KB of base64); strip it at build time if bundle size matters.
const svg = artwork.replace(/<metadata>[\s\S]*?<\/metadata>/, '')

/** Full-window network mesh behind the sign-in card. Inlined (not an <img>) so page CSS can theme it. */
export default function LoginBackground() {
  // Safe: a bundled local asset, never user input.
  return <div className="login-bg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
}
