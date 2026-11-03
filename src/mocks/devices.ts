import type { ConnectionEvent, Device, PendingEnrollment } from '../types/device'
import { DAY, fromNow, MINUTE, SECOND } from '../utils/time'

const LATEST_AGENT = 'v1.4.2'

const rawDevices: Omit<Device, 'agentOutdated'>[] = [
  {
    host: 'PC-001', alias: 'Accounting PC 1', os: 'Windows 11 Pro 23H2', osFamily: 'Windows',
    ip: '10.0.12.11', mac: '3C:52:82:1A:0F:11', online: true, agentVersion: 'v1.4.2',
    group: 'Accounting', tag: 'floor 2', lastSeen: fromNow(-2 * SECOND), enrolledAt: fromNow(-20 * DAY), certExpires: fromNow(70 * DAY),
    cpu: 23, ram: 61, disk: 54, latencyMs: 24,
    hardware: { cpu: 'Intel Core i5-12400 · 6C/12T', ram: '16 GB', disk: 'C: 476 GB (SSD)', uptime: '3 d 4 h' },
  },
  {
    host: 'PC-002', alias: 'Grafana host', os: 'Ubuntu 22.04', osFamily: 'Linux',
    ip: '10.0.12.20', mac: '00:15:5D:0A:21:02', online: true, agentVersion: 'v1.4.2',
    group: 'Server', tag: 'monitoring', lastSeen: fromNow(-4 * SECOND), enrolledAt: fromNow(-64 * DAY), certExpires: fromNow(120 * DAY),
    cpu: 31, ram: 58, disk: 62, latencyMs: 31,
    hardware: { cpu: 'AMD EPYC 7302 · 4 vCPU', ram: '8 GB', disk: '/ 120 GB (SSD)', uptime: '41 d 2 h' },
  },
  {
    host: 'PC-003', alias: 'Internal dashboard', os: 'Windows Server 2022', osFamily: 'Windows',
    ip: '10.0.12.30', mac: '00:15:5D:0A:21:03', online: true, agentVersion: 'v1.4.2',
    group: 'Server', tag: 'web', lastSeen: fromNow(-15 * SECOND), enrolledAt: fromNow(-64 * DAY), certExpires: fromNow(118 * DAY),
    cpu: 44, ram: 72, disk: 66, latencyMs: 38,
    hardware: { cpu: 'Intel Xeon E-2336 · 6C/12T', ram: '32 GB', disk: 'C: 960 GB (SSD)', uptime: '12 d 7 h' },
  },
  {
    host: 'PC-014', alias: 'CAD PC 4', os: 'Windows 10 Pro', osFamily: 'Windows',
    ip: '10.0.13.14', mac: '3C:52:82:2B:11:14', online: true, agentVersion: 'v1.3.9',
    group: 'CAD Workshop', tag: 'GPU', lastSeen: fromNow(-8 * SECOND), enrolledAt: fromNow(-150 * DAY), certExpires: fromNow(215 * DAY),
    cpu: 96, ram: 81, disk: 70, latencyMs: 52,
    hardware: { cpu: 'Intel Core i7-12700 · 12C/20T', ram: '64 GB', disk: 'C: 1 TB (NVMe)', uptime: '6 d 1 h' },
  },
  {
    host: 'PC-027', alias: 'CAD PC 9', os: 'Windows 10 Pro', osFamily: 'Windows',
    ip: '10.0.13.27', mac: '3C:52:82:2B:11:27', online: true, agentVersion: 'v1.4.2',
    group: 'CAD Workshop', tag: 'GPU', lastSeen: fromNow(-3 * SECOND), enrolledAt: fromNow(-150 * DAY), certExpires: fromNow(215 * DAY),
    cpu: 35, ram: 64, disk: 88, latencyMs: 41,
    hardware: { cpu: 'Intel Core i7-12700 · 12C/20T', ram: '64 GB', disk: 'C: 512 GB (NVMe)', uptime: '2 d 9 h' },
  },
  {
    host: 'PC-031', alias: 'Reception', os: 'Windows 11 Pro', osFamily: 'Windows',
    ip: '10.0.12.31', mac: '3C:52:82:1A:0F:31', online: false, agentVersion: 'v1.4.1',
    group: 'Office', tag: 'floor 1', lastSeen: fromNow(-18 * MINUTE), enrolledAt: fromNow(-361 * DAY), certExpires: fromNow(4 * DAY),
    cpu: 12, ram: 40, disk: 51, latencyMs: 0,
    hardware: { cpu: 'Intel Core i3-10100 · 4C/8T', ram: '8 GB', disk: 'C: 256 GB (SSD)', uptime: '—' },
  },
  {
    host: 'SRV-LNX-02', alias: 'File server', os: 'Debian 12', osFamily: 'Linux',
    ip: '10.0.10.2', mac: '00:15:5D:0A:10:02', online: true, agentVersion: 'v1.4.2',
    group: 'Server', tag: 'storage', lastSeen: fromNow(-1 * SECOND), enrolledAt: fromNow(-200 * DAY), certExpires: fromNow(165 * DAY),
    cpu: 28, ram: 47, disk: 92, latencyMs: 27,
    hardware: { cpu: 'Intel Xeon Silver 4210 · 10C/20T', ram: '64 GB', disk: '/srv 8 TB (RAID 6)', uptime: '88 d 3 h' },
  },
  {
    host: 'PC-040', alias: 'Sales laptop', os: 'Windows 11 Pro', osFamily: 'Windows',
    ip: '192.168.1.40', mac: '3C:52:82:1A:0F:40', online: false, agentVersion: 'v1.4.0',
    group: 'Sales', tag: 'remote', lastSeen: fromNow(-2 * DAY), enrolledAt: fromNow(-354 * DAY), certExpires: fromNow(11 * DAY),
    cpu: 5, ram: 30, disk: 40, latencyMs: 0,
    hardware: { cpu: 'Intel Core i5-1235U · 10C/12T', ram: '16 GB', disk: 'C: 512 GB (NVMe)', uptime: '—' },
  },
]

export const devices: Device[] = rawDevices.map((d) => ({ ...d, agentOutdated: d.agentVersion !== LATEST_AGENT }))

export const connectionHistory: ConnectionEvent[] = [
  { event: 'Connected', at: fromNow(-120 * MINUTE), publicIp: '203.0.113.24', duration: 'open' },
  { event: 'Disconnected · reconnected', at: fromNow(-123 * MINUTE), publicIp: '203.0.113.24', duration: '3 min' },
  { event: 'Connected', at: fromNow(-26 * 60 * MINUTE), publicIp: '203.0.113.24', duration: '23 h 55 min' },
]

export const pendingEnrollments: PendingEnrollment[] = [{ host: 'PC-049', os: 'Windows 11', ip: '10.0.12.49' }]
