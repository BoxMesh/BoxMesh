import { Result } from 'antd'
import { Icon } from './Icon'

export default function AlreadyOpen() {
  return (
    <main className="fullscreen-center">
      <Result
        icon={
          <span className="brand-mark">
            <Icon name="logo" size={64} />
          </span>
        }
        title="EdgePortal is already open in another window"
        subTitle="Switch to that window to keep working. This one takes over automatically when the other window closes."
      />
    </main>
  )
}
