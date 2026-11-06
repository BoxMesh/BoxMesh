import { Result } from 'antd'
import { LogoMark } from './Logo'

export default function AlreadyOpen() {
  return (
    <main className="fullscreen-center">
      <Result
        icon={
          <span className="brand-mark">
            <LogoMark size={64} />
          </span>
        }
        title="BoxMesh is already open in another window"
        subTitle="Switch to that window to keep working. This one takes over automatically when the other window closes."
      />
    </main>
  )
}
