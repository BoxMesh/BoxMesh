import { Button, Result } from 'antd'
import { useNavigate } from 'react-router'
import type { NavItem } from '../types/nav'
import { Icon } from './Icon'

// The page for a module that isn't built yet. Inside a device tab, `onBack` keeps the user on that device.
export default function NotSupported({ feature, onBack }: { feature: NavItem; onBack?: () => void }) {
  const navigate = useNavigate()
  return (
    <Result
      icon={
        <span className="soon-icon">
          <Icon name={feature.icon} size={36} />
        </span>
      }
      title={`${feature.label} isn't available yet`}
      subTitle={feature.summary}
      extra={
        onBack ? (
          <Button type="primary" onClick={onBack}>
            Back to overview
          </Button>
        ) : (
          [
            <Button key="devices" type="primary" onClick={() => navigate('/devices')}>
              Go to Devices
            </Button>,
            <Button key="dashboard" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>,
          ]
        )
      }
    />
  )
}
