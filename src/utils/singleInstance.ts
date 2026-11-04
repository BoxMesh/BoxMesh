const LOCK = 'boxmesh-instance'

// One BoxMesh window at a time, across tabs and the installed app. The active window holds a Web Lock
// until it closes; a later window shows `onBlocked` and takes over automatically once the lock is free.
export function singleInstance(onActive: () => void, onBlocked: () => void) {
  // Web Locks need a secure context (HTTPS or localhost); without them, don't block anyone.
  if (!navigator.locks) return onActive()

  const queued = new AbortController()
  let release = () => {}

  const hold = () => {
    onActive()
    return new Promise<void>((resolve) => (release = resolve))
  }

  // A page kept in the back/forward cache stays alive while hidden and would keep (or queue for) the lock,
  // so a new page in the same tab would be told another window is open. Let go on hide; start over on restore.
  addEventListener('pagehide', () => {
    release()
    queued.abort()
  })
  addEventListener('pageshow', (e) => {
    if (e.persisted) location.reload()
  })

  navigator.locks.request(LOCK, { ifAvailable: true }, (lock) => {
    if (lock) return hold()
    onBlocked()
    // Rejects with AbortError when the page is hidden first; nothing left to do then.
    navigator.locks.request(LOCK, { signal: queued.signal }, hold).catch(() => {})
  })
}
