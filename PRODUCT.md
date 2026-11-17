# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The internal IT team of a single company. They run EdgePanel on a server inside the company and use BoxMesh to look after the company's office PCs and servers (Windows, Linux and macOS), which sit behind NAT and firewalls across departments and sites.

Roles:
- **System**: the service provider's own account (a developer or staff). Everything, plus managing users. There is exactly one System account.
- **User**: a customer who signed up for the service. Runs commands and opens remote sessions, but only on the devices the System account gives them: whole groups (including devices added to those groups later) and/or single devices. A User with nothing assigned reaches no device. Every account the System account creates is a User. Users never see the System account section of the menu (Users & Access, Enrollment tokens).

Their job: know which machines are healthy, find the ones that need attention, reach any machine without a VPN or inbound ports, and hear about trouble on Telegram, Discord or email.

## Product Purpose

EdgeTunnel lets a company's IT team monitor and remotely operate its own fleet of machines from one web portal. BoxMesh is that portal, and it talks only to EdgePanel.

Success means an operator can:
- see the fleet's health at a glance;
- act on problem machines quickly;
- reach any enrolled machine securely, without leaving the portal.

## Positioning

Agents only dial out. Each machine runs one BoxAgent, which opens a persistent, two-way gRPC stream over TLS to the company's own EdgePanel; only the server presents a certificate, agents hold none. Machines therefore need no public IP, no inbound ports and no VPN.

The control plane runs on the company's own server, inside its network; there is no hosted (SaaS) edition. Every remote action (terminal, files, internal web apps) travels through that agent tunnel.

## Operating Context

**Fleet**
- A deployment manages 100 to 1,000 machines. Lists need sorting, filtering by OS, group, tag and status, real bulk actions, and summaries by group; at the upper end, paging has to happen on the server.
- Machines are organised into groups (departments, sites or any set, e.g. Accounting, Server, Critical systems) and free-form tags. A machine can be in several groups, or none. Groups are created, renamed, filled and deleted on the Groups page; deleting a group never deletes its machines.

**Enrollment**
1. An admin creates an enrollment token.
2. BoxAgent is installed on the machine with that token.
3. The agent connects to EdgePanel over TLS and presents the token.
4. An admin approves the request (or the token approves automatically).
5. EdgePanel lets the agent in and the tunnel opens.

**Remote access and usage**
- Internal web apps on agent machines (e.g. Grafana, in-house dashboards) are reached through EdgePanel's reverse proxy at `/web/{agent}/{app}/*`.
- BoxMesh is used mainly in desktop browsers. It can be installed as a PWA, and can be open in several tabs or windows at once.

## Capabilities and Constraints

**Built in BoxMesh**
- Screens: Dashboard, Devices (list, detail, enrollment), Remote Terminal, Remote Files, Remote Service, Groups, Alerts, Rules, Channels, Users & Access, Enrollment tokens. Command & Jobs, Audit, Security & Certificates and System Settings were removed from the console, and Remote Desktop until a screen can be streamed.
- Sign-in with email and password, and a "Forgot password?" form that requests a reset email.
- Dark and light themes: the OS setting by default, switchable in the header.

**What works end to end**
- EdgePanel serves sign-in, sign-out, the device list, usage history, processes and enrollment tokens (`POST /log-in`, `POST /log-out`, `GET /devices`, `GET /devices/{host}`, `GET /devices/{host}/metrics`, `GET /devices/{id}/processes`, `/enrollment-tokens`, System only) so far. Every other screen calls its real endpoint; while EdgePanel answers 404 the screen shows empty tables and cards (`emptyIfMissing` in `services/queries.ts`), and any other failure shows its error state.
- The password-reset request posts to `/forgot-password`, a route EdgePanel does not have yet; the name is a placeholder.
- Remote Files can open a second device and copy or one-way sync files between the two. It calls `/file-transfers`, another placeholder name EdgePanel does not have yet; only the demo runs it.
- Alerts: a rule is a named condition (CPU, RAM or disk over a limit, or offline, for N minutes). An alert applies rules to all devices, groups or single devices and sends a message, from a template with fields such as {device} and {value}, to channels: Telegram (bot token + chat ID), Discord (webhook), email (Gmail app password or any SMTP server) or any webhook URL (with its own method, headers and JSON body). EdgePanel is expected to evaluate and send; BoxMesh only configures it through `/alerts`, `/alert-rules` and `/alert-channels`, placeholder names. Secrets are write-only. Only the demo answers today, and its Send test sends nothing.
- A few actions are stubbed (ending a process, uploading, downloading, renaming or deleting a file): they say "<action> isn't available yet." and never fake success.

**Demo mode**
- "Explore the demo" on the sign-in page runs the whole console against a sample fleet of 12 machines, with no backend. It swaps the shared HTTP adapter, so the demo runs the same screens and services as the real panel.
- Changes made in the demo live in memory and are gone on reload. The demo ends with the browser tab or on sign-out.

**EdgePanel API**
- REST under `/api`. Responses are wrapped as `{ data }` on success and `{ error }` on failure.
- Realtime is planned over WebSocket (`/ws/events`, `/ws/terminal/{id}`, …).
- The product owner builds BoxAgent and EdgePanel. BoxMesh work must not change them.

**Language**
- The UI ships in English, Vietnamese and Japanese, switchable from the header and the sign-in page. A saved choice
  wins; otherwise a Vietnamese or Japanese browser starts in its language and every other browser in English.
- Technical terms (agent, heartbeat, TLS, token) may stay in English in both languages.

**Metrics history**
- EdgePanel stores every agent report (about one every 10 s) in a Postgres table, `DeviceMetric`, and keeps 7 days.
  The Performance charts read averages: 60 one-minute points for 1 h, 96 fifteen-minute points for 24 h, 168 hourly
  points for 7 d.

**Undecided**
- Licensing and distribution.

## Brand Commitments

- Names: EdgeTunnel (the platform), BoxAgent, EdgePanel, BoxMesh.
- The owner's design canvas set the visual direction; `Design.md` records it and every change made since.

## Evidence on Hand

- Design canvas, 15 artboards: https://claude.ai/artifact/5TYshytP6kBopBmewcPMv5
- `../BoxAgent/README.md`: the agent's purpose and architecture.
- There are no customers, testimonials, benchmarks or production metrics.

## Product Principles

1. **Health comes first.** What is online and what needs attention outrank everything else on screen.
2. **Every remote action goes through the agent tunnel and respects roles and per-device permissions.** Trust decisions (approving an agent, revoking an enrollment token) show enough identity to decide on, and ask for confirmation.
3. **Show the true state.** Unbuilt features, offline machines and stale data are labelled as such, and success is never faked.
4. **Built for fleets of hundreds.** Finding, filtering and acting on many machines at once is the normal case, not the exception.
5. **Every string is translatable.** English and Vietnamese ship together, with no hard-coded copy.
