import { useQuery } from '@tanstack/react-query'
import { Card, Descriptions, Segmented, Skeleton, Tag, type DescriptionsProps } from 'antd'
import { useState } from 'react'
import DeviceGroups from '../../components/DeviceGroups'
import { userMessage } from '../../services/http'
import { deviceMetricsQuery } from '../../services/queries'
import type { TimeRange } from '../../types/dashboard'
import type { Device, DeviceGroup } from '../../types/device'
import { THRESHOLDS } from '../../utils/devices'
import { formatDateTime } from '../../utils/time'
import UsageChart from './UsageChart'

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
]

const RESOURCES = [
  { key: 'cpu', label: 'CPU' },
  { key: 'ram', label: 'RAM' },
  { key: 'disk', label: 'Disk' },
] as const

const percent = (v: number) => `${Math.round(v)}%`
const mbps = (v: number) => `${v < 10 ? v.toFixed(1) : Math.round(v)} Mbps`
const niceMax = (v: number) => {
  const p = 10 ** Math.floor(Math.log10(v || 1))
  return [1, 2, 5, 10].map((m) => m * p).find((n) => n >= v)!
}

export default function DeviceOverview({ device: d, groups }: { device: Device; groups: DeviceGroup[] }) {
  const [range, setRange] = useState<TimeRange>('24h')
  const metrics = useQuery(deviceMetricsQuery(d.host, range))
  const points = metrics.data ?? []
  const times = points.map((p) => p.at)
  const latest = points.at(-1)
  const network = [
    { label: 'Received', values: points.map((p) => p.netIn) },
    { label: 'Sent', values: points.map((p) => p.netOut) },
  ]

  const info: DescriptionsProps['items'] = [
    { key: 'host', label: 'Hostname', children: d.host },
    { key: 'os', label: 'Operating system', children: `${d.os} ${d.osVersion} · ${d.osArchitecture}` },
    { key: 'ip', label: 'IP', children: d.ip },
    { key: 'mac', label: 'MAC', children: <code>{d.mac}</code> },
    {
      key: 'agent',
      label: 'Agent version',
      children: (
        <>
          {d.agentVersion} {d.agentOutdated ? <Tag color="warning">outdated</Tag> : null}
        </>
      ),
    },
    { key: 'uptime', label: 'Uptime', children: d.hardware.uptime },
    { key: 'enrolled', label: 'Enrolled at', children: formatDateTime(d.enrolledAt) },
    { key: 'groups', label: 'Groups', children: <DeviceGroups device={d} groups={groups} /> },
  ]

  return (
    <div className="stack">
      <Card title="Device information">
        <Descriptions layout="vertical" colon={false} column={{ xs: 1, sm: 2, lg: 3, xl: 4 }} items={info} />
      </Card>
      <Card
        title="Resource information"
        extra={<Segmented<TimeRange> size="small" aria-label="Time range" options={RANGES} value={range} onChange={setRange} />}
      >
        {metrics.isPending ? (
          <Skeleton active paragraph={{ rows: 8 }} title={false} />
        ) : metrics.isError ? (
          <span className="muted">Usage history didn't load. {userMessage(metrics.error)}</span>
        ) : (
          <>
            {RESOURCES.map(({ key, label }) => {
              const now = latest?.[key] ?? d[key]
              const high = now >= THRESHOLDS[key]
              return (
                <div key={key} className="usage">
                  <div className="meter-label">
                    <span>
                      {label} <span className="muted">· {d.hardware[key]}</span>
                    </span>
                    <span>
                      {now}%{high ? ` · above ${THRESHOLDS[key]}%` : ''}
                    </span>
                  </div>
                  <UsageChart
                    label={label}
                    times={times}
                    series={[{ label, values: points.map((p) => p[key]) }]}
                    max={100}
                    format={percent}
                    threshold={THRESHOLDS[key]}
                    range={range}
                  />
                </div>
              )
            })}
            <div className="usage">
              <div className="meter-label">
                <span>Network</span>
                <span className="usage-legend">
                  {network.map((s, i) => (
                    <span key={s.label}>
                      <span className={`usage-swatch s${i + 1}`} />
                      {s.label} {latest ? mbps(s.values.at(-1)!) : '—'}
                    </span>
                  ))}
                </span>
              </div>
              <UsageChart
                label="Network"
                times={times}
                series={network}
                max={niceMax(Math.max(...network.flatMap((s) => s.values)) * 1.1)}
                format={mbps}
                range={range}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
