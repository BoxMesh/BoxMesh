# EdgePortal

[![Docker image](https://github.com/EdgeDock/EdgePortal/actions/workflows/docker.yml/badge.svg)](https://github.com/EdgeDock/EdgePortal/actions/workflows/docker.yml)

**EdgePortal** is the web console of EdgeTunnel, used by a company's IT team to monitor and remotely operate its Windows and Linux machines.

Each machine runs **EdgeAgent**, which dials out to the company's self-hosted **EdgePanel** over gRPC + mTLS, so machines need no public IP, inbound ports or VPN. EdgePortal talks only to EdgePanel.

```text
Browser ── EdgePortal ──HTTPS / WebSocket──► EdgePanel (VPS) ◄──gRPC + mTLS── EdgeAgent (each machine)
```

## Status

| Module | State |
|---|---|
| Dashboard | Built |
| Devices (list, detail, enrollment drawer) | Built |
| Remote Terminal, Remote Desktop, Remote Files, Remote Service | Planned; the UI shows "isn't available yet" |
| Command & Jobs, Audit & Alerts | Planned |
| Security & Certificates, Users & Access, System Settings | Planned |

EdgePanel does not serve the API yet, so the app runs on **mock data** by default (see [Configuration](#configuration)).

## Tech stack

- React 19 + TypeScript, built with Vite
- Ant Design 6 (dark theme)
- React Router
- axios + TanStack Query
- vite-plugin-pwa (installable; one window at a time)
- Vitest for tests, oxlint for linting

## Getting started

You need Node.js 24 and npm.

```bash
npm install
npm run dev          # http://localhost:5173
```

The app opens with mock data. To work against a running EdgePanel instead:

```bash
# .env.local
VITE_USE_MOCK=false
```

`npm run dev` proxies `/api` to EdgePanel on `http://localhost:8080`, its default `http` launch profile.

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` (also generates the service worker) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |
| `npm test` | Run the unit tests with Vitest |

## Configuration

Vite bakes these into the bundle **at build time**. Copy `.env.example` to `.env.local` to override them locally.

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_URL` | `/api` | Base URL of the EdgePanel REST API |
| `VITE_USE_MOCK` | on (anything but `false`) | `false` calls EdgePanel; otherwise `src/mocks` answers every request |

With mocks off, mock data is left out of the bundle entirely.

## Project structure

```text
src/
  main.tsx, App.tsx    entry point and routes
  layouts/             app shell (sider + header)
  pages/<feature>/     one folder per screen, with its private components
  components/          shared components
  services/            axios client, API calls, TanStack Query keys
  mocks/               mock data and the axios mock adapter
  types/               shared interfaces
  utils/               pure helpers, each with its tests
  config/              theme tokens and the navigation
  styles/              global CSS
```

Further reading:
- [`Design.md`](Design.md): the design system (tokens, components, screens).
- [`PRODUCT.md`](PRODUCT.md): users, purpose and product principles.

## API contract

Every request goes through `src/services`. EdgePanel wraps responses as `{ "data": ... }` on success and `{ "error": ... }` on failure.

These are the endpoints the app calls today:

| Method | Endpoint |
|---|---|
| GET | `/api/devices` |
| GET | `/api/devices/{host}` |
| GET | `/api/devices/{host}/connections` |
| GET | `/api/enrollments?status=pending` |
| GET | `/api/metrics/summary?range=1h\|24h\|7d` |
| GET | `/api/sessions/summary` |
| GET | `/api/audit?limit=` |

## Docker

The image is a static build served by unprivileged nginx on port **8080**.

```bash
docker build -t edgeportal .
docker run --rm -p 8080:8080 edgeportal
```

Pass `--build-arg VITE_USE_MOCK=true` to build with mock data, or `--build-arg VITE_API_URL=...` to point at another API base.

What nginx does:
- Serves the single-page app, falling back to `index.html` for client-side routes.
- Caches hashed assets for a year.
- Always revalidates `sw.js`, `registerSW.js` and the manifest, so clients pick up new releases.

### Deployment

- **Same origin as EdgePanel.** The bundle calls `/api` on its own origin, so put EdgePortal behind the same reverse proxy as EdgePanel. Route `/api`, `/ws` and `/web` to EdgePanel and everything else to this container.
- **HTTPS is required.** Without it the app can't be installed as a PWA, and the one-window rule (it uses a Web Lock) is not enforced.

## CI/CD

Every push to `main` runs [`.github/workflows/docker.yml`](.github/workflows/docker.yml):

1. Install dependencies, then run lint and tests. A failure stops the run.
2. Build the image and push it to GitHub Container Registry:
   - `ghcr.io/edgedock/edgeportal:latest`
   - `ghcr.io/edgedock/edgeportal:sha-<short commit>`

To start a run by hand, use **Actions → Docker image → Run workflow**.

The workflow builds with mock data until told otherwise. Change this in **Settings → Secrets and variables → Actions → Variables**:

| Variable | Workflow default |
|---|---|
| `VITE_USE_MOCK` | `true` (set it to `false` once EdgePanel serves `/api`) |
| `VITE_API_URL` | `/api` |

To pull the image:

```bash
docker pull ghcr.io/edgedock/edgeportal:latest
```

The first push creates the package as **private**. To make it public, change its visibility in the package settings on GitHub.

## License

To be determined.
