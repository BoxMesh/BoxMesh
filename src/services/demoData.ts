import type { Alert, AlertChannel, AlertRule } from '../types/alert'
import type { Account, CommandRule, EnrollmentToken } from '../types/admin'
import type { RemoteSessions, TimeRange } from '../types/dashboard'
import type { Device, DeviceGroup, DeviceProcess, DiskForecast, MetricPoint, OsFamily, PendingEnrollment, ProcessStatus } from '../types/device'
import type { DesktopSession, FileEntry, FileListing, RemoteService, Shell } from '../types/remote'
import { DAY, MINUTE, SECOND, fromNow } from '../utils/time'

// A believable fleet for the demo: a mix of office desktops, two servers and a workshop, with a few
// machines deliberately in trouble so the alerting and certificate screens have something to show.
type Seed = [host: string, alias: string, group: string, tag: string, cpu: number, ram: number, disk: number, agent: string]

// Only what stays put is seeded. The OS, whether the agent is up, what it answers in and when it was
// last heard from are rolled per load, so the seed cannot disagree with them.
const SEEDS: Seed[] = [
  ['ACC-PC-01', 'Accounting 1', 'Accounting', 'desktop', 23, 54, 61, '1.4.2'],
  ['ACC-PC-02', 'Accounting 2', 'Accounting', 'desktop', 94, 71, 44, '1.4.2'],
  ['ACC-PC-03', 'Accounting 3', 'Accounting', 'desktop', 35, 61, 72, '1.3.9'],
  ['CAD-WS-01', 'CAD Workshop 1', 'CAD Workshop', 'workstation', 67, 92, 88, '1.4.2'],
  ['CAD-WS-02', 'CAD Workshop 2', 'CAD Workshop', 'workstation', 41, 63, 91, '1.4.0'],
  ['HR-PC-01', 'HR Desk', 'HR', 'desktop', 12, 38, 52, '1.4.2'],
  ['SRV-DB-01', 'Database', 'Server', 'database', 58, 77, 73, '1.4.2'],
  ['SRV-WEB-01', 'Internal web', 'Server', 'web', 31, 49, 36, '1.4.2'],
  ['SRV-BAK-01', 'Backup', 'Server', 'backup', 8, 22, 94, '1.4.1'],
  ['SRV-MON-01', 'Monitoring', 'Server', 'monitoring', 44, 58, 40, '1.3.9'],
  ['WH-PC-01', 'Warehouse terminal', 'Warehouse', 'kiosk', 28, 47, 66, '1.3.9'],
  ['WH-PC-02', 'Warehouse office', 'Warehouse', 'desktop', 19, 44, 57, '1.4.2'],
]

// Groups by id; a seed's department becomes its first group. "Critical systems" overlaps the others, so the
// demo shows a device in more than one group.
export const groups: DeviceGroup[] = [
  { id: 'g-accounting', name: 'Accounting' },
  { id: 'g-cad-workshop', name: 'CAD Workshop' },
  { id: 'g-hr', name: 'HR' },
  { id: 'g-server', name: 'Server' },
  { id: 'g-warehouse', name: 'Warehouse' },
  { id: 'g-critical', name: 'Critical systems' },
]
const CRITICAL = ['SRV-DB-01', 'SRV-WEB-01', 'ACC-PC-01']
const groupIdOf = (name: string) => groups.find((g) => g.name === name)!.id

const LATEST_AGENT = '1.4.2'

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
const pick = <T>(list: T[]) => list[rand(0, list.length - 1)]

// A server room and a desk do not run the same things, so they draw from different pools.
type OsPick = [family: OsFamily, name: string, version: string, arch: string]

const CLIENT_OS: OsPick[] = [
  ['Windows', 'Windows 11 Pro', '24H2', 'x64'],
  ['Windows', 'Windows 11 Pro', '23H2', 'x64'],
  ['Windows', 'Windows 10 Pro', '22H2', 'x64'],
  ['macOS', 'macOS', '15 Sequoia', 'arm64'],
  ['macOS', 'macOS', '14 Sonoma', 'arm64'],
  ['Linux', 'Ubuntu', '24.04 LTS', 'x64'],
  ['Linux', 'Fedora', '41', 'x64'],
]

const SERVER_OS: OsPick[] = [
  ['Linux', 'Ubuntu', '24.04 LTS', 'x64'],
  ['Linux', 'Ubuntu', '22.04 LTS', 'x64'],
  ['Linux', 'Debian', '12', 'x64'],
  ['Linux', 'Debian', '12', 'arm64'],
  ['Windows', 'Windows Server', '2022', 'x64'],
]

const hardwareFor = (family: OsFamily, i: number) =>
  family === 'Windows'
    ? { cpu: 'Intel Core i5-12400 · 6C/12T', ram: '16 GB DDR4', disk: '512 GB NVMe', uptime: `${2 + (i % 9)} days` }
    : family === 'macOS'
      ? { cpu: 'Apple M3 · 8C', ram: '16 GB unified', disk: '512 GB SSD', uptime: `${3 + (i % 12)} days` }
      : { cpu: 'AMD EPYC 7313P · 16C/32T', ram: '64 GB DDR4 ECC', disk: '2 TB NVMe RAID1', uptime: `${40 + i * 7} days` }

// Being up decides what else can be true of an agent: a live one answers in milliseconds and was heard
// from moments ago, a lost one does not answer at all and was last heard minutes to hours back. Keeping
// the three together is what stops "Online, last seen 23 h ago".
const asOnline = (online: boolean) => ({
  online,
  latencyMs: online ? rand(8, 48) : 0,
  lastSeen: fromNow(online ? -rand(0, 120) * SECOND : -rand(7, 240) * MINUTE),
})

const UP = 0.78

export const devices: Device[] = SEEDS.map(([host, alias, group, tag, cpu, ram, disk, agentVersion], i) => {
  const [osFamily, os, osVersion, osArchitecture] = pick(group === 'Server' ? SERVER_OS : CLIENT_OS)
  return {
    host,
    alias,
    os,
    osVersion,
    osArchitecture,
    osFamily,
    ip: `192.168.${rand(1, 20)}.${rand(2, 254)}`,
    mac: `AA:BB:CC:${(16 + i).toString(16).toUpperCase().padStart(2, '0')}:0${i % 10}:${(32 + i).toString(16).toUpperCase()}`,
    agentVersion,
    agentOutdated: agentVersion !== LATEST_AGENT,
    groups: [groupIdOf(group), ...(CRITICAL.includes(host) ? ['g-critical'] : [])],
    tag,
    enrolledAt: fromNow(-(90 + i * 11) * DAY),
    cpu,
    ram,
    disk,
    hardware: hardwareFor(osFamily, i),
    ...asOnline(Math.random() < UP),
  }
})

const CHURN = 0.15

/**
 * The fleet as of this read. Each read re-rolls a few agents, so between two reads some come back and
 * some drop: that is what makes pinging one worth doing. The array is rebuilt so React sees the change,
 * and `devices` is updated in place so every other endpoint answers from the same state.
 */
export function fleet(): Device[] {
  devices.forEach((d, i) => {
    if (Math.random() < CHURN) devices[i] = { ...d, ...asOnline(!d.online) }
  })
  return [...devices]
}

const SAMPLES: Record<TimeRange, [count: number, stepMs: number]> = {
  '1h': [60, MINUTE],
  '24h': [96, 15 * MINUTE],
  '7d': [168, 60 * MINUTE],
}

export function deviceMetrics(host: string, range: TimeRange): MetricPoint[] {
  const device = devices.find((d) => d.host === host)
  if (!device) return []
  const [count, step] = SAMPLES[range]
  let state = [...`${host}${range}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 2147483647, 7)
  const random = () => (state = (state * 48271) % 2147483647) / 2147483647
  const walkBack = (now: number, swing: number, drift = 0, max = 100, pull = 0.08) => {
    const out = [now]
    for (let i = 1; i < count; i++)
      out.push(Math.max(0.1, Math.min(max, out[i - 1] + (random() - 0.5) * swing + (now - out[i - 1]) * pull - drift)))
    return out.reverse()
  }
  const cpu = walkBack(device.cpu, 16)
  const ram = walkBack(device.ram, 6)
  const disk = walkBack(device.disk, 0.8, range === '7d' ? 0.04 : range === '24h' ? 0.02 : 0, 100, 0)
  const end = Date.parse(device.lastSeen)
  // Traffic follows the working day: busy from about 8 to 18, quiet at night, never zero. Servers stay busier overnight.
  const server = device.osFamily === 'Linux'
  const peak = server ? 60 : 9
  const floor = server ? 0.35 : 0.08
  let wobble = 1
  const traffic = cpu.map((_, i) => {
    const hour = new Date(end - (count - 1 - i) * step).getHours() + new Date(end - (count - 1 - i) * step).getMinutes() / 60
    const day = Math.exp(-(((hour - 13) / 4.5) ** 2))
    wobble = wobble * 0.7 + (0.75 + random() * 0.5) * 0.3
    return peak * (floor + (1 - floor) * day) * wobble
  })
  const netIn = traffic
  const netOut = traffic.map((v) => v * (server ? 0.45 : 0.25) * (0.9 + random() * 0.2))
  const pct = (v: number) => Math.max(1, Math.round(v))
  const mbps = (v: number) => Math.round(v * 10) / 10
  return cpu.map((_, i) => ({
    at: new Date(end - (count - 1 - i) * step).toISOString(),
    cpu: pct(cpu[i]),
    ram: pct(ram[i]),
    disk: pct(disk[i]),
    netIn: mbps(netIn[i]),
    netOut: mbps(netOut[i]),
  }))
}

/** Fits a line through each online device's 7 days of disk use and keeps the five that fill up soonest. */
export function diskForecast(): DiskForecast[] {
  return devices
    .filter((d) => d.online)
    .flatMap((d) => {
      const points = deviceMetrics(d.host, '7d')
      const xs = points.map((p) => Date.parse(p.at) / DAY)
      const ys = points.map((p) => p.disk)
      const mx = xs.reduce((a, b) => a + b, 0) / xs.length
      const my = ys.reduce((a, b) => a + b, 0) / ys.length
      const perDay = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0) / xs.reduce((sum, x) => sum + (x - mx) ** 2, 0)
      if (!(perDay > 0.05)) return []
      return [{ host: d.host, disk: d.disk, perDay: Math.round(perDay * 10) / 10, daysLeft: (100 - d.disk) / perDay }]
    })
    .toSorted((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5)
}

type ProcessSeed = [name: string, user: string, cpu: number, memoryMb: number, status?: ProcessStatus]

const PROCESSES: Record<OsFamily, ProcessSeed[]> = {
  Windows: [
    ['System', 'SYSTEM', 0.4, 0.1],
    ['svchost.exe', 'SYSTEM', 0.8, 42],
    ['svchost.exe', 'NETWORK SERVICE', 0.3, 18],
    ['svchost.exe', 'LOCAL SERVICE', 0.2, 12],
    ['lsass.exe', 'SYSTEM', 0.2, 22],
    ['csrss.exe', 'SYSTEM', 0.1, 6],
    ['dwm.exe', 'DWM-1', 1.1, 64],
    ['explorer.exe', 'operator', 1.2, 96],
    ['BoxAgent.exe', 'SYSTEM', 0.6, 38],
    ['MsMpEng.exe', 'SYSTEM', 2.4, 210],
    ['SearchIndexer.exe', 'SYSTEM', 0.5, 48],
    ['chrome.exe', 'operator', 6.5, 420],
    ['chrome.exe', 'operator', 2.1, 180],
    ['OUTLOOK.EXE', 'operator', 1.5, 260],
    ['EXCEL.EXE', 'operator', 0.9, 140, 'not-responding'],
    ['Teams.exe', 'operator', 3.2, 350],
    ['PhoneExperienceHost.exe', 'operator', 0, 24, 'suspended'],
  ],
  Linux: [
    ['systemd', 'root', 0.1, 12],
    ['systemd-journald', 'root', 0.2, 40],
    ['sshd', 'root', 0, 6],
    ['cron', 'root', 0, 3],
    ['rsyslogd', 'syslog', 0.1, 8],
    ['boxagent', 'root', 0.5, 34],
    ['dockerd', 'root', 0.7, 96],
    ['containerd', 'root', 0.4, 48],
    ['postgres', 'postgres', 8.2, 820],
    ['postgres', 'postgres', 3.1, 240],
    ['postgres', 'postgres', 1.4, 120],
    ['nginx', 'www-data', 1.2, 28],
    ['nginx', 'www-data', 0.9, 26],
    ['node', 'app', 4.6, 310],
  ],
  macOS: [
    ['kernel_task', 'root', 3, 1200],
    ['launchd', 'root', 0.1, 18],
    ['WindowServer', '_windowserver', 4.2, 380],
    ['mds_stores', 'root', 1.1, 160],
    ['boxagent', 'root', 0.5, 34],
    ['Finder', 'operator', 0.3, 120],
    ['Dock', 'operator', 0.2, 60],
    ['Safari', 'operator', 2.4, 640],
    ['Slack', 'operator', 1.8, 420],
    ['Final Cut Pro', 'operator', 12.5, 2400],
  ],
}

/** A fresh sample per call, so the table moves like Task Manager while it polls. */
export function processes(host: string): DeviceProcess[] {
  const device = devices.find((d) => d.host === host)
  if (!device?.online) return []
  const load = device.cpu / 40
  return PROCESSES[device.osFamily].map(([name, user, cpu, memoryMb, status = 'running'], i) => ({
    pid: i === 0 ? (device.osFamily === 'Windows' ? 4 : 1) : 400 + i * 389,
    name,
    user,
    status,
    cpu: status === 'suspended' ? 0 : Math.round(cpu * load * (0.6 + Math.random() * 0.8) * 10) / 10,
    memoryMb: Math.round(memoryMb * (0.95 + Math.random() * 0.1) * 10) / 10,
  }))
}

export const remoteSessions: RemoteSessions = {
  reconnects24h: 7,
  summary: '2 terminals · 1 desktop',
}

export const pendingEnrollments: PendingEnrollment[] = [
  { host: 'ACC-PC-04', os: 'Windows 11 Pro 24H2 · x64', ip: '192.168.11.24' },
  { host: 'SRV-APP-02', os: 'Ubuntu 24.04 LTS · arm64', ip: '192.168.20.31' },
]

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

export const rootFor = (host: string) => (devices.find((d) => d.host === host)?.osFamily === 'Windows' ? 'C:\\' : '/')

export function listFiles(host: string, path: string): FileListing {
  const windows = devices.find((d) => d.host === host)?.osFamily === 'Windows'
  const tree = windows ? WINDOWS_TREE : LINUX_TREE
  // Machines of one OS share a tree; a per-host twist (older copy, or missing) gives "Compare folders" something to find.
  const entries = (tree[path] ?? []).flatMap((entry) => {
    if (entry.kind === 'folder') return [entry]
    const twist = [...host + entry.name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 3
    if (twist === 2) return []
    return [twist === 1 ? { ...entry, modified: new Date(Date.parse(entry.modified) - 2 * DAY).toISOString() } : entry]
  })
  return { path, entries }
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
  resolution: devices.find((d) => d.host === host)?.osFamily === 'Windows' ? '1920 × 1080' : '1280 × 1024',
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
      return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>\n        inet ${d?.ip ?? '192.168.10.1'}  netmask 255.255.255.0\n        ether ${d?.mac ?? 'AA:BB:CC:00:00:00'}`
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

// ---------- Admin ----------

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
  { id: 'u-1', email: 'admin@company.com', name: 'Mai Anh', role: 'Admin', lastSignIn: fromNow(-40 * MINUTE), disabled: false, access: { groupIds: [], hosts: [] } },
  { id: 'u-2', email: 'ops@company.com', name: 'Quang Huy', role: 'Operator', lastSignIn: fromNow(-4 * MINUTE), disabled: false, access: { groupIds: ['g-accounting', 'g-hr'], hosts: [] } },
  { id: 'u-3', email: 'srv@company.com', name: 'Thu Trang', role: 'Operator', lastSignIn: fromNow(-3 * 60 * MINUTE), disabled: false, access: { groupIds: ['g-server'], hosts: ['CAD-WS-01'] } },
  { id: 'u-4', email: 'viewer@company.com', name: 'Đức Minh', role: 'Operator', lastSignIn: fromNow(-2 * DAY), disabled: false, access: { groupIds: [], hosts: ['WH-PC-01', 'WH-PC-02'] } },
  { id: 'u-5', email: 'intern@company.com', name: 'Bảo Ngọc', role: 'Operator', lastSignIn: fromNow(-21 * DAY), disabled: true, access: { groupIds: [], hosts: [] } },
]

// ---------- Blocked commands ----------

export const commandRules: CommandRule[] = [
  { id: 'cr-1', pattern: 'shutdown', match: 'starts', shells: [], reason: 'Restarts or powers off the machine. Ask IT to schedule it.', groupIds: [], hosts: [] },
  { id: 'cr-2', pattern: 'format', match: 'starts', shells: ['CMD', 'PowerShell'], reason: 'Erases a whole drive.', groupIds: [], hosts: [] },
  { id: 'cr-3', pattern: 'diskpart', match: 'starts', shells: ['CMD', 'PowerShell'], reason: 'Changes disk partitions.', groupIds: [], hosts: [] },
  { id: 'cr-4', pattern: String.raw`rm\s+-(rf|fr)\s+/(\s|$)`, match: 'regex', shells: ['Bash'], reason: 'Deletes the whole file system.', groupIds: [], hosts: [] },
  { id: 'cr-5', pattern: 'reg delete hklm', match: 'contains', shells: ['CMD'], reason: 'Removes system registry keys.', groupIds: [], hosts: [] },
  { id: 'cr-6', pattern: 'systemctl stop', match: 'starts', shells: ['Bash'], reason: 'Stops a service on a critical system. Plan it with IT.', groupIds: ['g-critical'], hosts: [] },
  { id: 'cr-7', pattern: 'dropdb', match: 'starts', shells: ['Bash'], reason: 'Deletes a production database.', groupIds: [], hosts: ['SRV-DB-01'] },
]

export const alertChannels: AlertChannel[] = [
  { id: 'ch-1', kind: 'telegram', name: 'IT on-call', chatId: '-1002233445566' },
  { id: 'ch-2', kind: 'email', name: 'IT mailbox', smtpHost: 'smtp.gmail.com', smtpPort: 587, username: 'alerts.company@gmail.com', to: ['it@company.com'] },
  { id: 'ch-3', kind: 'discord', name: '#server-alerts', webhookTail: 'k9Qz' },
]

export const alertRules: AlertRule[] = [
  { id: 'ar-1', name: 'CPU running hot', metric: 'cpu', threshold: 90, minutes: 5 },
  { id: 'ar-2', name: 'RAM almost full', metric: 'ram', threshold: 90, minutes: 10 },
  { id: 'ar-3', name: 'Disk almost full', metric: 'disk', threshold: 85, minutes: 15 },
  { id: 'ar-4', name: 'Agent offline', metric: 'offline', threshold: 0, minutes: 5 },
]

export const alerts: Alert[] = [
  {
    id: 'al-1',
    name: 'Servers',
    ruleIds: ['ar-1', 'ar-3', 'ar-4'],
    groupIds: ['g-server'],
    hosts: [],
    channelIds: ['ch-1', 'ch-3'],
    message: '⚠️ {rule} on {device} ({alias})\n{condition}. Now: {value}.\n{time}',
  },
  {
    id: 'al-2',
    name: 'Critical systems down',
    ruleIds: ['ar-4'],
    groupIds: ['g-critical'],
    hosts: [],
    channelIds: ['ch-1', 'ch-2'],
    message: '🚨 {device} is offline. Groups: {groups}. Since {time}.',
  },
  {
    id: 'al-3',
    name: 'Database memory',
    ruleIds: ['ar-2'],
    groupIds: [],
    hosts: ['SRV-DB-01'],
    channelIds: ['ch-3'],
    message: '{device}: {condition} ({value})',
  },
]
