import svg from '../../assets/boxmesh.svg?raw'

/** Full-window mesh behind the sign-in card: agents on the office network, each packet travelling its
 *  route to the panel at the centre. Inlined (not an <img>) so its --bm-* colours come from index.css. */
export default function LoginBackground() {
  // Safe: a bundled local asset, never user input.
  return <div className="login-bg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
}
