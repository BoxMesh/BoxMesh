import { Badge } from 'antd'
import { tone } from '../config/theme'
import { t } from '../i18n'

export default function Status({ online }: { online: boolean }) {
  return online ? (
    <Badge color={tone.positive} text={t('Online')} />
  ) : (
    <Badge color={tone.disabled} text={<span className="muted">{t('Offline')}</span>} />
  )
}
