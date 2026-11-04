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
| Sign in (`/login`) | Built; calls EdgePanel `POST /sign-in` |
| Dashboard | Built |
| Devices (list, detail, enrollment drawer) | Built |
| Remote Terminal, Remote Desktop, Remote Files, Remote Service | Planned; the UI shows "isn't available yet" |
| Command & Jobs, Audit & Alerts | Planned |
| Security & Certificates, Users & Access, System Settings | Planned |

Every screen calls the real EdgePanel API. EdgePanel serves only sign-in so far, so the other screens show an error until it has their endpoints (see [API contract](#api-contract)).

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

Start EdgePanel first (its `http` profile, on port 8080); the portal has no offline mode.

`npm run dev` proxies `/api` to EdgePanel on `http://localhost:8080`, its default `http` launch profile, and strips the `/api` prefix because EdgePanel serves its routes from the root.

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` (also generates the service worker) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |
| `npm test` | Run the unit tests with Vitest |

## Configuration

Vite bakes this into the bundle **at build time**. Copy `.env.example` to `.env.local` to override them locally.

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_URL` | `/api` | Base URL of the EdgePanel REST API: `/api` behind a shared reverse proxy, or EdgePanel's own origin such as `https://panel.company.com` (no `/api`; EdgePanel serves its routes from the root). See [Deployment](#deployment). |

## Project structure

```text
src/
  main.tsx, App.tsx    entry point and routes
  layouts/             app shell (sider + header)
  pages/<feature>/     one folder per screen, with its private components
  components/          shared components
  services/            axios client, API calls, TanStack Query keys
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
| POST | `/api/sign-in` → EdgePanel `/sign-in` (`{ email, password }` → `{ id, email }`, JWTs set as HttpOnly cookies) |
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

Pass `--build-arg VITE_API_URL=...` to point at another API base.

What nginx does:
- Serves the single-page app, falling back to `index.html` for client-side routes.
- Caches hashed assets for a year.
- Always revalidates `sw.js`, `registerSW.js` and the manifest, so clients pick up new releases.

### Deployment

Pick one way to reach EdgePanel:

- **Same origin (default).** Keep `VITE_API_URL=/api` and put EdgePortal behind the same reverse proxy as EdgePanel. Route `/api` (stripping the `/api` prefix), `/ws` and `/web` to EdgePanel and everything else to this container. No CORS needed.
- **EdgePanel on its own domain.** Build with `VITE_API_URL=https://panel.company.com`. The portal sends requests with credentials so EdgePanel's HttpOnly JWT cookies cross origins, which needs on EdgePanel's side:
  - a CORS policy that allows the portal's exact origin **with credentials** (`AllowCredentials`; a `*` origin is refused by browsers);
  - the portal and EdgePanel on the **same site** (same registrable domain, e.g. `portal.company.com` and `panel.company.com`), because the cookies are `SameSite=Strict`. Different domains need `SameSite=None` on EdgePanel.
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

To change the API base the image is built with, set this in **Settings → Secrets and variables → Actions → Variables**:

| Variable | Workflow default |
|---|---|
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

The build-time variable `VITE_API_URL` comes from the Vercel project's **Environment Variables**; without it the deploy calls `/api` on its own domain.

To use the real API from Vercel:
- Set `VITE_API_URL` to EdgePanel's public URL, for example `https://panel.company.com`.
- Meet the "EdgePanel on its own domain" requirements in [Deployment](#deployment). A `*.vercel.app` address is a different site from EdgePanel's domain, so give the portal a custom domain on the same site (or switch EdgePanel's cookies to `SameSite=None`).

## License

To be determined.
