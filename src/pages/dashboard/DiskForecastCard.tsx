import { useQuery } from '@tanstack/react-query'
import { Card, Progress, Skeleton } from 'antd'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { tone } from '../../config/theme'
import { t } from '../../i18n'
import { userMessage } from '../../services/http'
import { diskForecastQuery } from '../../services/queries'
import { THRESHOLDS } from '../../utils/devices'

// Full within two weeks is close enough to plan a clean-up now.
const SOON_DAYS = 14

const fullIn = (days: number) => {
  const n = Math.round(days)
  return days < 1 ? t('under a day') : n === 1 ? t('~{n} day', { n }) : t('~{n} days', { n })
}

/** Disks filling up, soonest full first, as EdgePanel projects them from the last 7 days. */
export default function DiskForecastCard() {
  const forecast = useQuery(diskForecastQuery)

  return (
    <Card title={t('Disk filling up')} extra={<span className="sub">{t('Full in')}</span>} styles={{ body: { padding: 0 } }}>
      {forecast.isPending ? (
        <Skeleton active title={false} paragraph={{ rows: 4 }} className="card-note" />
      ) : forecast.isError ? (
        <p className="muted card-note">{t("The disk forecast didn't load.")} {userMessage(forecast.error)}</p>
      ) : !forecast.data.length ? (
        <p className="muted card-note">{t('No disk is filling up.')}</p>
      ) : (
        <ul className="rank-list">
          {forecast.data.map((f) => {
            const soon = f.daysLeft <= SOON_DAYS
            return (
              <li key={f.host} className="rank-row">
                <span className="rank-name">
                  <Link to={`/devices/${encodeURIComponent(f.host)}?tab=performance`} className="strong">
                    {f.host}
                  </Link>
                  <span className="sub">
                    {f.disk}% · {t('+{n}% a day', { n: f.perDay })}
                  </span>
                </span>
                <Progress
                  percent={f.disk}
                  showInfo={false}
                  size="small"
                  strokeColor={f.disk >= THRESHOLDS.disk ? tone.error : tone.disabled}
                  aria-label={t('{host} disk', { host: f.host })}
                />
                <span className={soon ? 'rank-value hot' : 'rank-value'}>
                  {soon && <Icon name="warning" size={12} />}
                  {fullIn(f.daysLeft)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
