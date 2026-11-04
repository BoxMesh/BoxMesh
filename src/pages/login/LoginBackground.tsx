// The owner's artwork; index.css (.login-bg) maps its palette colours to theme tokens for light mode.
import svg from '../../assets/boxmesh.svg?raw'

/** Full-window mesh of Windows and Linux machines behind the sign-in card.
 *  Inlined (not an <img>) so page CSS can theme it. */
export default function LoginBackground() {
  // Safe: a bundled local asset, never user input.
  return <div className="login-bg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
}
