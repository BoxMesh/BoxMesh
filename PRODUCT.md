# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The internal IT team of a single company. They self-host EdgePanel on the company's own VPS and use BoxMesh to look after the company's office PCs and servers (Windows, Linux and macOS), which sit behind NAT and firewalls across departments and sites.

Roles:
- **Admin**: everything, plus users and access, certificates, enrollment and system settings.
- **Operator**: runs commands and jobs, groups and tags devices, opens remote sessions where permitted.
- **Viewer**: read-only.

Their job: know which machines are healthy, find the ones that need attention, reach any machine without a VPN or inbound ports, and keep every agent's certificate trusted and current.

## Product Purpose

EdgeTunnel lets a company's IT team monitor and remotely operate its own fleet of machines from one web portal. BoxMesh is that portal, and it talks only to EdgePanel.

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
4. An admin approves the request (or the token approves automatically).
5. EdgePanel signs the certificate and the mTLS tunnel opens.

**Certificates**
- Expiry is flagged the same way on every screen: amber within 30 days, red within 7. A revoked certificate is never flagged.

**Remote access and usage**
- Internal web apps on agent machines (e.g. Grafana, in-house dashboards) are reached through EdgePanel's reverse proxy at `/web/{agent}/{app}/*`.
- BoxMesh is used mainly in desktop browsers. It can be installed as a PWA, and only one window may be open at a time.

## Capabilities and Constraints

**Built in BoxMesh**
- Every module has a screen: Dashboard, Devices (list, detail, enrollment), Remote Terminal, Remote Desktop, Remote Files, Remote Service, Command & Jobs, Audit, Security & Certificates, Users & Access, System Settings.
- Sign-in with email and password, and a "Forgot password?" form that requests a reset email.
- Dark and light themes: the OS setting by default, switchable in the header.

**What works end to end**
- EdgePanel serves only sign-in and sign-out (`POST /log-in`, `POST /log-out`) so far. Every other screen calls its real endpoint and shows that screen's error state until EdgePanel has it.
- The password-reset request posts to `/forgot-password`, a route EdgePanel does not have yet; the name is a placeholder.
- Remote Files can open a second device and copy or one-way sync files between the two. It calls `/file-transfers`, another placeholder name EdgePanel does not have yet; only the demo runs it.
- Remote Desktop has no video stream yet; the frame says so.
- A few actions are stubbed (updating or disabling a device, editing tags, saving thresholds): they say "<action> isn't available yet." and never fake success.

**Demo mode**
- "Explore the demo" on the sign-in page runs the whole console against a sample fleet of 12 machines, with no backend. It swaps the shared HTTP adapter, so the demo runs the same screens and services as the real panel.
- Changes made in the demo live in memory and are gone on reload. The demo ends with the browser tab or on sign-out.

**EdgePanel API**
- REST under `/api`. Responses are wrapped as `{ data }` on success and `{ error }` on failure.
- Realtime is planned over WebSocket (`/ws/events`, `/ws/terminal/{id}`, …).
- The product owner builds EdgeAgent and EdgePanel. BoxMesh work must not change them.

**Language**
- The goal: the UI ships in English and Vietnamese, switchable by the user, with English as the default.
- Today it is English only, with copy written straight into the components; there is no translation layer yet.
- Technical terms (agent, heartbeat, mTLS, CSR, token) may stay in English in both languages.

**Undecided**
- Where metrics history is stored.
- Licensing and distribution.

## Brand Commitments

- Names: EdgeTunnel (the platform), EdgeAgent, EdgePanel, BoxMesh.
- The owner's design canvas set the visual direction; `Design.md` records it and every change made since.

## Evidence on Hand

- Design canvas, 15 artboards: https://claude.ai/artifact/5TYshytP6kBopBmewcPMv5
- `../EdgeAgent/README.md`: the agent's purpose and architecture.
- There are no customers, testimonials, benchmarks or production metrics.

## Product Principles

1. **Health and trust come first.** What is online, what needs attention, and whether certificates are valid outrank everything else on screen.
2. **Every remote action goes through the agent tunnel and respects roles and per-device permissions.** Trust decisions (approving an agent, revoking a certificate) show enough identity to decide on, and ask for confirmation.
3. **Show the true state.** Unbuilt features, offline machines and stale data are labelled as such, and success is never faked.
4. **Built for fleets of hundreds.** Finding, filtering and acting on many machines at once is the normal case, not the exception.
5. **Every string is translatable.** English and Vietnamese ship together, with no hard-coded copy. (Not met yet: see Language above.)
