# EdgePortal

[![CI/CD](https://github.com/EdgeDock/EdgePortal/actions/workflows/ci.yml/badge.svg)](https://github.com/EdgeDock/EdgePortal/actions/workflows/ci.yml)

**EdgePortal** is the web console of EdgeTunnel, used by a company's IT team to monitor and remotely operate its Windows and Linux machines.

Each machine runs **EdgeAgent**, which dials out to the company's self-hosted **EdgePanel** over gRPC + mTLS, so machines need no public IP, inbound ports or VPN. EdgePortal talks only to EdgePanel.

```text
Browser ── EdgePortal ──HTTPS / WebSocket──► EdgePanel (VPS) ◄──gRPC + mTLS── EdgeAgent (each machine)
```

## Status

| Module | State |
|---|---|
| Sign in (`/login`) | Built; until EdgePanel has sign-in, the mock accepts any email and password |
| Dashboard | Built |
| Devices (list, detail, enrollment drawer) | Built |
| Remote Terminal, Remote Desktop, Remote Files, Remote Service | Planned; the UI shows "isn't available yet" |
| Command & Jobs, Audit & Alerts | Planned |
| Security & Certificates, Users & Access, System Settings | Planned |

EdgePanel does not serve the API yet, so the app runs on **mock data** by default (see [Configuration](#configuration)).

## Tech stack

- React 19 + TypeScript, built with Vite
- Ant Design 6, with dark and light themes (follows the OS setting; switch in the header)
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
| POST | `/api/auth/login` (`{ email, password }` → `{ email, name }`) |
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

Every push to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml). It has three jobs:

| Job | What it does |
|---|---|
| `check` | Install dependencies, then lint and test. The other two jobs run only if this one passes. |
| `docker` | Build the image and push it to GitHub Container Registry as `ghcr.io/edgedock/edgeportal:latest` and `:sha-<short commit>`. |
| `vercel` | Build and deploy to Vercel production. |

To start a run by hand, use **Actions → CI/CD → Run workflow**.

### Docker image

The image builds with mock data until told otherwise. Change this in **Settings → Secrets and variables → Actions → Variables**:

| Variable | Workflow default |
|---|---|
| `VITE_USE_MOCK` | `true` (set it to `false` once EdgePanel serves `/api`) |
| `VITE_API_URL` | `/api` |

To pull the image:

```bash
docker pull ghcr.io/edgedock/edgeportal:latest
```

The first push creates the package as **private**. To make it public, change its visibility in the package settings on GitHub.

### Vercel

The deploy uses the Vercel CLI (`vercel pull` → `vercel build` → `vercel deploy --prebuilt --prod`). [`vercel.json`](vercel.json) sends every app route to `index.html` and keeps the service worker uncached.

It also sets `git.deploymentEnabled: false`, so Vercel's own Git integration never deploys a second time; only this workflow deploys.

One-time setup:

1. **Create the project.** Create a Vercel project for this repo (import it in the dashboard, or run `npx vercel link` locally).
2. **Find the IDs.** Note the **Project ID** (Project → Settings → General) and the **Team ID** (Team → Settings → General). For a personal account, use your user ID. After `vercel link`, both IDs are also in `.vercel/project.json` as `projectId` and `orgId`.
3. **Create a token.** Create one under **Account Settings → Tokens**.
4. **Add the secrets.** In GitHub **Settings → Secrets and variables → Actions → Secrets**, add:

   | Secret | Value |
   |---|---|
   | `VERCEL_TOKEN` | the token |
   | `VERCEL_ORG_ID` | the Team ID or user ID |
   | `VERCEL_PROJECT_ID` | the Project ID |

Until those secrets exist, the `vercel` job fails with a message naming them; the Docker job is unaffected.

Build-time variables (`VITE_USE_MOCK`, `VITE_API_URL`) come from the Vercel project's **Environment Variables**. Without them, the deploy runs on mock data.

To use the real API from Vercel:
- Set `VITE_API_URL` to EdgePanel's public URL, for example `https://panel.example.com/api`.
- Allow the Vercel domain in EdgePanel's CORS policy, because the portal and the API are then on different origins.

## License

To be determined.
