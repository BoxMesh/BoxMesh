# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The internal IT team of a single company. They self-host EdgePanel on the company's own VPS and use EdgePortal to look after the company's office PCs and servers (Windows and Linux), which sit behind NAT and firewalls across departments and sites.

Roles:
- **Admin**: everything, plus users and access, certificates, enrollment and system settings.
- **Operator**: runs commands and jobs, groups and tags devices, opens remote sessions where permitted.
- **Viewer**: read-only.

Their job: know which machines are healthy, find the ones that need attention, reach any machine without a VPN or inbound ports, and keep every agent's certificate trusted and current.

## Product Purpose

EdgeTunnel lets a company's IT team monitor and remotely operate its own fleet of Windows and Linux machines from one web portal. EdgePortal is that portal, and it talks only to EdgePanel.

Success means an operator can:
- see the fleet's health at a glance;
- act on problem machines quickly;
- reach any enrolled machine securely, without leaving the portal.

## Positioning

Agents only dial out. Each machine runs one EdgeAgent, which opens a persistent, two-way gRPC stream over mTLS to the company's own EdgePanel. Machines therefore need no public IP, no inbound ports and no VPN.

The control plane is self-hosted on the company's VPS, not in a vendor's cloud. Every remote action (terminal, desktop, files, internal web apps) travels through that agent tunnel.

## Operating Context

**Fleet**
- A deployment manages 100 to 1,000 machines. Lists need sorting, filtering by OS, group, tag and status, real bulk actions, and summaries by group; at the upper end, paging has to happen on the server.
- Machines are organised into groups (departments or sites, e.g. Accounting, Server, CAD Workshop) and free-form tags.

**Enrollment**
1. An admin creates an enrollment token.
2. EdgeAgent is installed on the machine with that token.
3. The agent generates its private key and a CSR.
4. An admin approves the request.
5. EdgePanel signs the certificate and the mTLS tunnel opens.

**Remote access and usage**
- Internal web apps on agent machines (e.g. Grafana, in-house dashboards) are reached through EdgePanel's reverse proxy at `/web/{agent}/{app}/*`.
- EdgePortal is used mainly in desktop browsers. It can be installed as a PWA, and only one window may be open at a time.

## Capabilities and Constraints

**Built in EdgePortal**
- Dashboard, the Devices list, and Device detail (overview and connection history).
- Data comes from mock responses until EdgePanel exposes the endpoints (`src/mocks`, switched off with `VITE_USE_MOCK=false`).

**Planned modules** (shown in the UI as not yet available)
- Remote Terminal (PowerShell, CMD, Bash), Remote Desktop, Remote Files, Remote Service (web apps).
- Metrics, Command & Jobs, Security & Certificates, Users & Access (RBAC), Audit & Notifications, System Settings.

**EdgePanel API**
- REST under `/api`. Responses are wrapped as `{ data }` on success and `{ error }` on failure.
- Realtime runs over WebSocket (`/ws/events`, `/ws/terminal/{id}`, …).
- The product owner builds EdgeAgent and EdgePanel. EdgePortal work must not change them.

**Language**
- The UI ships in English and Vietnamese, switchable by the user, with English as the default.
- Technical terms (agent, heartbeat, mTLS, CSR, token) may stay in English in both languages.

**Undecided**
- How users sign in.
- Where metrics history is stored.
- Licensing and distribution.

## Brand Commitments

- Names: EdgeTunnel (the platform), EdgeAgent, EdgePanel, EdgePortal.
- The owner's design canvas pins the visual direction, and `Design.md` records it.

## Evidence on Hand

- Design canvas, 15 artboards: https://claude.ai/artifact/5TYshytP6kBopBmewcPMv5
- `../EdgeAgent/README.md`: the agent's purpose and architecture.
- There are no customers, testimonials, benchmarks or production metrics. The data in `src/mocks` is illustrative only and must never be presented as real.

## Product Principles

1. **Health and trust come first.** What is online, what needs attention, and whether certificates are valid outrank everything else on screen.
2. **Every remote action goes through the agent tunnel and respects roles and per-device permissions.** Trust decisions (approving an agent, revoking a certificate) show enough identity to decide on, and ask for confirmation.
3. **Show the true state.** Unbuilt features, offline machines and stale data are labelled as such, and success is never faked.
4. **Built for fleets of hundreds.** Finding, filtering and acting on many machines at once is the normal case, not the exception.
5. **Every string is translatable.** English and Vietnamese ship together, with no hard-coded copy.
