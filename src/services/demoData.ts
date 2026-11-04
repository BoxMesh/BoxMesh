import type { Account, Certificate, EnrollmentToken, Health, Settings } from '../types/admin'
import type { ActivityEvent, RemoteSessions, ResourceUsage, TimeRange } from '../types/dashboard'
import type { ConnectionEvent, Device, OsFamily, PendingEnrollment } from '../types/device'
import type { AuditEntry, Job } from '../types/ops'
import type { DesktopSession, FileEntry, FileListing, RemoteService, Shell } from '../types/remote'
import { DAY, MINUTE, SECOND, fromNow } from '../utils/time'

// A believable fleet for the demo: a mix of office desktops, two servers and a workshop, with a few
// machines deliberately in trouble so the alerting and certificate screens have something to show.
type Seed = [
  host: string,
  alias: string,
  os: string,
  family: OsFamily,
  group: string,
  tag: string,
  online: boolean,
  cpu: number,
  ram: number,
  disk: number,
  agent: string,
  latency: number,
  certDays: number,
  seenMinutes: number,
]

const SEEDS: Seed[] = [
  ['ACC-PC-01', 'Accounting 1', 'Windows 11 Pro 24H2', 'Windows', 'Accounting', 'desktop', true, 23, 54, 61, '1.4.2', 18, 240, 0],
  ['ACC-PC-02', 'Accounting 2', 'Windows 11 Pro 24H2', 'Windows', 'Accounting', 'desktop', true, 94, 71, 44, '1.4.2', 21, 180, 0],
  ['ACC-PC-03', 'Accounting 3', 'Windows 10 Pro 22H2', 'Windows', 'Accounting', 'desktop', false, 0, 0, 0, '1.3.9', 0, 9, 46],
  ['CAD-WS-01', 'CAD Workshop 1', 'Windows 11 Pro 24H2', 'Windows', 'CAD Workshop', 'workstation', true, 67, 92, 88, '1.4.2', 27, 311, 0],
  ['CAD-WS-02', 'CAD Workshop 2', 'Windows 11 Pro 24H2', 'Windows', 'CAD Workshop', 'workstation', true, 41, 63, 91, '1.4.0', 24, 275, 1],
  ['HR-PC-01', 'HR Desk', 'Windows 11 Pro 24H2', 'Windows', 'HR', 'desktop', true, 12, 38, 52, '1.4.2', 16, 198, 0],
  ['SRV-DB-01', 'Database', 'Ubuntu 24.04 LTS', 'Linux', 'Server', 'database', true, 58, 77, 73, '1.4.2', 4, 402, 0],
  ['SRV-WEB-01', 'Internal web', 'Ubuntu 24.04 LTS', 'Linux', 'Server', 'web', true, 31, 49, 36, '1.4.2', 5, 402, 0],
  ['SRV-BAK-01', 'Backup', 'Debian 12', 'Linux', 'Server', 'backup', true, 8, 22, 94, '1.4.1', 7, 12, 0],
  ['SRV-MON-01', 'Monitoring', 'Ubuntu 22.04 LTS', 'Linux', 'Server', 'monitoring', true, 44, 58, 40, '1.3.9', 6, 355, 2],
  ['WH-PC-01', 'Warehouse terminal', 'Windows 10 Pro 22H2', 'Windows', 'Warehouse', 'kiosk', false, 0, 0, 0, '1.3.9', 0, 120, 1380],
  ['WH-PC-02', 'Warehouse office', 'Windows 11 Pro 24H2', 'Windows', 'Warehouse', 'desktop', true, 19, 44, 57, '1.4.2', 33, 220, 0],
]

const LATEST_AGENT = '1.4.2'

const hardwareFor = (family: OsFamily, i: number) =>
  family === 'Windows'
    ? { cpu: 'Intel Core i5-12400 · 6C/12T', ram: '16 GB DDR4', disk: '512 GB NVMe', uptime: `${2 + (i % 9)} days` }
    : { cpu: 'AMD EPYC 7313P · 16C/32T', ram: '64 GB DDR4 ECC', disk: '2 TB NVMe RAID1', uptime: `${40 + i * 7} days` }

export const devices: Device[] = SEEDS.map(
  ([host, alias, os, osFamily, group, tag, online, cpu, ram, disk, agentVersion, latencyMs, certDays, seenMin], i) => ({
    host,
    alias,
    os,
    osFamily,
    ip: `10.0.${osFamily === 'Linux' ? 20 : 10 + (i % 3)}.${11 + i}`,
    mac: `AA:BB:CC:${(16 + i).toString(16).toUpperCase().padStart(2, '0')}:0${i % 10}:${(32 + i).toString(16).toUpperCase()}`,
    online,
    agentVersion,
    agentOutdated: agentVersion !== LATEST_AGENT,
    group,
    tag,
    lastSeen: fromNow(-seenMin * MINUTE),
    enrolledAt: fromNow(-(90 + i * 11) * DAY),
    certExpires: fromNow(certDays * DAY),
    cpu,
    ram,
    disk,
    latencyMs,
    hardware: hardwareFor(osFamily, i),
  }),
)

const byRange: Record<TimeRange, ResourceUsage> = {
  '1h': { cpu: 38, ram: 57, disk: 63 },
  '24h': { cpu: 44, ram: 61, disk: 64 },
  '7d': { cpu: 51, ram: 66, disk: 65 },
}

export const resourceUsage = (range: TimeRange): ResourceUsage => byRange[range]

export const remoteSessions: RemoteSessions = {
  reconnects24h: 7,
  summary: '2 terminals · 1 desktop',
}

export const activity: ActivityEvent[] = [
  { text: 'ops@company.com ran "Get-Service" on 3 devices', at: fromNow(-4 * MINUTE), failed: false },
  { text: 'CAD-WS-01 crossed the 90% RAM threshold', at: fromNow(-26 * MINUTE), failed: true },
  { text: 'admin@company.com approved enrollment for WH-PC-02', at: fromNow(-2 * 60 * MINUTE), failed: false },
  { text: 'ACC-PC-03 lost its heartbeat', at: fromNow(-46 * MINUTE), failed: true },
  { text: 'Nightly backup job finished on SRV-BAK-01', at: fromNow(-7 * 60 * MINUTE), failed: false },
]

export const pendingEnrollments: PendingEnrollment[] = [
  { host: 'ACC-PC-04', os: 'Windows 11 Pro 24H2', ip: '10.0.11.24' },
  { host: 'SRV-APP-02', os: 'Ubuntu 24.04 LTS', ip: '10.0.20.31' },
]

export const connectionHistory = (host: string): ConnectionEvent[] => {
  const device = devices.find((d) => d.host === host)
  const publicIp = device?.osFamily === 'Linux' ? '203.0.113.17' : '203.0.113.42'
  const base: ConnectionEvent[] = [
    { event: 'Tunnel established', at: fromNow(-6 * 60 * MINUTE), publicIp, duration: '6 h 02 m' },
    { event: 'Reconnected after network drop', at: fromNow(-14 * 60 * MINUTE), publicIp, duration: '7 h 48 m' },
    { event: 'Certificate renewed', at: fromNow(-3 * DAY), publicIp, duration: '—' },
    { event: 'Tunnel established', at: fromNow(-5 * DAY), publicIp, duration: '2 d 04 h' },
  ]
  return device?.online ? base : [{ event: 'Tunnel closed', at: device?.lastSeen ?? fromNow(-DAY), publicIp, duration: '—' }, ...base]
}

// ---------- Remote ----------

const WINDOWS_TREE: Record<string, FileEntry[]> = {
  'C:\\': [
    { name: 'Program Files', kind: 'folder', size: 0, modified: fromNow(-30 * DAY) },
    { name: 'Users', kind: 'folder', size: 0, modified: fromNow(-2 * DAY) },
    { name: 'Windows', kind: 'folder', size: 0, modified: fromNow(-9 * DAY) },
    { name: 'agent.log', kind: 'file', size: 184_320, modified: fromNow(-12 * MINUTE) },
  ],
  'C:\\Users': [
    { name: 'Public', kind: 'folder', size: 0, modified: fromNow(-120 * DAY) },
    { name: 'operator', kind: 'folder', size: 0, modified: fromNow(-DAY) },
  ],
  'C:\\Users\\operator': [
    { name: 'Desktop', kind: 'folder', size: 0, modified: fromNow(-DAY) },
    { name: 'Documents', kind: 'folder', size: 0, modified: fromNow(-4 * DAY) },
    { name: 'inventory.xlsx', kind: 'file', size: 48_219, modified: fromNow(-3 * 60 * MINUTE) },
    { name: 'notes.txt', kind: 'file', size: 1_204, modified: fromNow(-50 * MINUTE) },
  ],
}

const LINUX_TREE: Record<string, FileEntry[]> = {
  '/': [
    { name: 'etc', kind: 'folder', size: 0, modified: fromNow(-14 * DAY) },
    { name: 'home', kind: 'folder', size: 0, modified: fromNow(-2 * DAY) },
    { name: 'var', kind: 'folder', size: 0, modified: fromNow(-6 * 60 * MINUTE) },
  ],
  '/var': [
    { name: 'log', kind: 'folder', size: 0, modified: fromNow(-8 * MINUTE) },
    { name: 'lib', kind: 'folder', size: 0, modified: fromNow(-21 * DAY) },
  ],
  '/var/log': [
    { name: 'syslog', kind: 'file', size: 2_310_144, modified: fromNow(-2 * MINUTE) },
    { name: 'boxagent.log', kind: 'file', size: 612_352, modified: fromNow(-MINUTE) },
    { name: 'dpkg.log', kind: 'file', size: 91_240, modified: fromNow(-5 * DAY) },
  ],
  '/home': [{ name: 'deploy', kind: 'folder', size: 0, modified: fromNow(-2 * DAY) }],
  '/etc': [
    { name: 'hosts', kind: 'file', size: 221, modified: fromNow(-60 * DAY) },
    { name: 'fstab', kind: 'file', size: 518, modified: fromNow(-90 * DAY) },
  ],
}

export const rootFor = (host: string) => (devices.find((d) => d.host === host)?.osFamily === 'Linux' ? '/' : 'C:\\')

export function listFiles(host: string, path: string): FileListing {
  const linux = devices.find((d) => d.host === host)?.osFamily === 'Linux'
  const tree = linux ? LINUX_TREE : WINDOWS_TREE
  return { path, entries: tree[path] ?? [] }
}

const SERVICES: Record<string, RemoteService[]> = {
  'SRV-MON-01': [
    { name: 'Grafana', port: 3000, path: 'grafana', status: 'running', kind: 'Dashboards' },
    { name: 'Prometheus', port: 9090, path: 'prometheus', status: 'running', kind: 'Metrics' },
  ],
  'SRV-WEB-01': [
    { name: 'Intranet', port: 8080, path: 'intranet', status: 'running', kind: 'Web app' },
    { name: 'Wiki', port: 8081, path: 'wiki', status: 'stopped', kind: 'Web app' },
  ],
  'SRV-DB-01': [{ name: 'pgAdmin', port: 5050, path: 'pgadmin', status: 'running', kind: 'Database' }],
}

export const servicesOn = (host: string): RemoteService[] => SERVICES[host] ?? []

export const desktopSession = (host: string): DesktopSession => ({
  id: `vd-${host.toLowerCase()}`,
  resolution: devices.find((d) => d.host === host)?.osFamily === 'Linux' ? '1280 × 1024' : '1920 × 1080',
  startedAt: fromNow(-12 * SECOND),
  fps: 24,
  quality: 'auto',
})

// Canned replies, so the demo terminal answers the commands an operator would actually try first.
const REPLIES: { match: RegExp; output: (host: string) => string }[] = [
  { match: /^(whoami|id)$/i, output: (h) => (rootFor(h) === '/' ? 'uid=0(root) gid=0(root) groups=0(root)' : `${h}\\operator`) },
  { match: /^(hostname)$/i, output: (h) => h },
  { match: /^(pwd|cd)$/i, output: (h) => rootFor(h) },
  {
    match: /^(get-service|systemctl status|service --status-all)/i,
    output: () => 'Status   Name               DisplayName\n------   ----               -----------\nRunning  BoxAgent           BoxMesh Agent\nRunning  Spooler            Print Spooler\nStopped  WSearch            Windows Search',
  },
  {
    match: /^(df|get-psdrive|get-volume)/i,
    output: () => 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme0n1p2  1.8T  1.2T  520G  71% /\ntmpfs            32G  1.1M   32G   1% /dev/shm',
  },
  {
    match: /^(uptime|get-uptime)/i,
    output: () => ' 14:22:51 up 41 days,  3:12,  1 user,  load average: 0.42, 0.51, 0.48',
  },
  {
    match: /^(ipconfig|ip a|ifconfig)/i,
    output: (h) => {
      const d = devices.find((x) => x.host === h)
      return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>\n        inet ${d?.ip ?? '10.0.0.1'}  netmask 255.255.255.0\n        ether ${d?.mac ?? 'AA:BB:CC:00:00:00'}`
    },
  },
  { match: /^(ls|dir|get-childitem)/i, output: (h) => listFiles(h, rootFor(h)).entries.map((e) => e.name).join('\n') },
]

export function runShell(host: string, shell: Shell, command: string) {
  const trimmed = command.trim()
  if (!trimmed) return { command, output: '', exitCode: 0, at: new Date().toISOString() }
  const hit = REPLIES.find((r) => r.match.test(trimmed))
  return {
    command,
    output: hit
      ? hit.output(host)
      : `${shell}: '${trimmed.split(' ')[0]}' is not one of the commands this demo answers.\nTry whoami, hostname, uptime, df, ipconfig, ls or get-service.`,
    exitCode: hit ? 0 : 1,
    at: new Date().toISOString(),
  }
}

// ---------- Operations ----------

export const jobs: Job[] = [
  {
    id: 'job-1041',
    name: 'Collect agent logs',
    command: 'Get-Content C:\\agent.log -Tail 200',
    shell: 'PowerShell',
    targets: ['Accounting'],
    state: 'done',
    startedAt: fromNow(-35 * MINUTE),
    results: [
      { host: 'ACC-PC-01', state: 'done', exitCode: 0, output: '200 lines collected' },
      { host: 'ACC-PC-02', state: 'done', exitCode: 0, output: '200 lines collected' },
      { host: 'ACC-PC-03', state: 'failed', exitCode: 1, output: 'Agent offline' },
    ],
  },
  {
    id: 'job-1040',
    name: 'Disk cleanup',
    command: 'cleanmgr /sagerun:1',
    shell: 'CMD',
    targets: ['CAD Workshop'],
    state: 'running',
    startedAt: fromNow(-3 * MINUTE),
    results: [
      { host: 'CAD-WS-01', state: 'running', exitCode: 0, output: 'Working…' },
      { host: 'CAD-WS-02', state: 'done', exitCode: 0, output: 'Freed 14.2 GB' },
    ],
  },
  {
    id: 'job-1039',
    name: 'Nightly package update',
    command: 'apt-get update && apt-get -y upgrade',
    shell: 'Bash',
    targets: ['Server'],
    state: 'queued',
    startedAt: fromNow(9 * 60 * MINUTE),
    schedule: 'Every day at 02:00',
    results: [],
  },
]

export const auditLog: AuditEntry[] = [
  { id: 'a-9001', at: fromNow(-4 * MINUTE), actor: 'ops@company.com', action: 'Ran command', target: 'ACC-PC-01', outcome: 'ok', ip: '10.0.0.5' },
  { id: 'a-9000', at: fromNow(-26 * MINUTE), actor: 'system', action: 'Threshold crossed', target: 'CAD-WS-01', outcome: 'failed', ip: '—' },
  { id: 'a-8999', at: fromNow(-52 * MINUTE), actor: 'ops@company.com', action: 'Opened terminal', target: 'SRV-DB-01', outcome: 'ok', ip: '10.0.0.5' },
  { id: 'a-8998', at: fromNow(-2 * 60 * MINUTE), actor: 'admin@company.com', action: 'Approved enrollment', target: 'WH-PC-02', outcome: 'ok', ip: '10.0.0.2' },
  { id: 'a-8997', at: fromNow(-3 * 60 * MINUTE), actor: 'viewer@company.com', action: 'Opened remote desktop', target: 'ACC-PC-02', outcome: 'failed', ip: '10.0.0.9' },
  { id: 'a-8996', at: fromNow(-6 * 60 * MINUTE), actor: 'admin@company.com', action: 'Created enrollment token', target: 'Accounting', outcome: 'ok', ip: '10.0.0.2' },
  { id: 'a-8995', at: fromNow(-DAY), actor: 'ops@company.com', action: 'Downloaded file', target: 'SRV-BAK-01:/var/log/syslog', outcome: 'ok', ip: '10.0.0.5' },
  { id: 'a-8994', at: fromNow(-DAY - 60 * MINUTE), actor: 'system', action: 'Certificate renewed', target: 'SRV-MON-01', outcome: 'ok', ip: '—' },
]

// ---------- Admin ----------

export const certificates: Certificate[] = devices.map((d, i) => ({
  host: d.host,
  serial: `3F:${(10 + i).toString(16).toUpperCase()}:A9:${(0x5c + i).toString(16).toUpperCase()}`,
  issuedAt: d.enrolledAt,
  expiresAt: d.certExpires,
  revoked: false,
}))

export const enrollmentTokens: EnrollmentToken[] = [
  {
    id: 'tok-7',
    token: '••••••••••••••••••••4f2a',
    group: 'Accounting',
    expiresAt: fromNow(18 * 60 * MINUTE),
    requiresApproval: true,
    usedBy: ['ACC-PC-04'],
  },
  {
    id: 'tok-6',
    token: '••••••••••••••••••••b113',
    group: 'Server',
    expiresAt: fromNow(-2 * DAY),
    requiresApproval: true,
    usedBy: ['SRV-MON-01'],
  },
]

export const accounts: Account[] = [
  { id: 'u-1', email: 'admin@company.com', name: 'Mai Anh', role: 'Admin', scope: [], lastSignIn: fromNow(-40 * MINUTE), disabled: false },
  { id: 'u-2', email: 'ops@company.com', name: 'Quang Huy', role: 'Operator', scope: ['Accounting', 'HR'], lastSignIn: fromNow(-4 * MINUTE), disabled: false },
  { id: 'u-3', email: 'srv@company.com', name: 'Thu Trang', role: 'Operator', scope: ['Server'], lastSignIn: fromNow(-3 * 60 * MINUTE), disabled: false },
  { id: 'u-4', email: 'viewer@company.com', name: 'Đức Minh', role: 'Viewer', scope: [], lastSignIn: fromNow(-2 * DAY), disabled: false },
  { id: 'u-5', email: 'intern@company.com', name: 'Bảo Ngọc', role: 'Viewer', scope: ['Warehouse'], lastSignIn: fromNow(-21 * DAY), disabled: true },
]

export const settings: Settings = {
  heartbeatSeconds: 30,
  offlineAfterMinutes: 10,
  logRetentionDays: 90,
  metricRetentionDays: 30,
  autoApproveEnrollment: false,
}

export const health: Health = {
  version: '0.9.4',
  uptime: '41 days 3 h',
  dbSizeMb: 742,
  agentsConnected: devices.filter((d) => d.online).length,
  lastBackup: fromNow(-9 * 60 * MINUTE),
}
