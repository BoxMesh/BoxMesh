# CLAUDE.md

BoxMesh is the web console of EdgeTunnel: a company's IT team uses it to monitor and remotely operate its own
machines. Each machine runs BoxAgent, which dials out over gRPC + mTLS to the company's self-hosted EdgePanel.
BoxMesh talks only to EdgePanel. See [README.md](README.md) for setup, configuration and the API table.

## Read before any UI or design work

**Always read [Design.md](Design.md) and [PRODUCT.md](PRODUCT.md) before you design, build or restyle anything
users see.** Do this even for a small change such as a button, a colour or a spacing value.

- **PRODUCT.md**: who the users are, what the product is for, what works end to end, and the product principles.
  Use it to decide *what* a screen should show and what matters most on it.
- **Design.md**: tokens (both themes), typography, spacing, motion, components and screens as they are built now.
  Use it to decide *how* it looks. Reuse what it describes before inventing anything.

When a change alters something either file records (a token, a component rule, a screen, a product fact), update
that file in the same change. Don't edit the product principles in PRODUCT.md unless the user asks.

## Stack

Vite + React 19 + TypeScript · Ant Design 6 · React Router · axios + TanStack Query · xterm.js · vite-plugin-pwa ·
Vitest · oxlint. Node 24.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server; proxies `/api` to EdgePanel on `localhost:8080` |
| `npm run build` | Type-check (`tsc -b`) and build |
| `npm run lint` | oxlint |
| `npm test` | Vitest |

Before calling a change done, run `npx tsc -b`, `npm run lint` and `npm test`.

## Where things live

```text
src/
  App.tsx              routes
  layouts/             app shell (sider + header)
  pages/<feature>/     one folder per screen, with its private components
  components/          shared components (Logo, Icon, CertExpiry, PageHeader, ThemeProvider…)
  services/            axios client, API calls, query keys, demo mode (demo.ts, demoData.ts)
  config/              theme.ts (both palettes, antd theme, tone.*) and nav.ts
  styles/index.css     CSS variables per theme and everything antd has no token for
  i18n/                t() and the Japanese dictionaries (ja/<area>.ts)
  utils/               pure helpers, each with its tests
```

## Conventions

- Use Ant Design components and the tokens in `theme.ts` / CSS variables in `index.css`. No hex values in
  components: inline status colours come from `tone.*`.
- Icons come from `src/components/Icon.tsx` (24 viewBox, stroke 2). Don't mix in antd's icon set.
- Every change must work in both dark and light themes, and at 375 px wide.
- Text needs 4.5:1 contrast; status is never shown by colour alone; hit areas are at least 24 px.
- Data goes page → `services/queries.ts` → `services/*Service.ts` → EdgePanel. No demo-only branches in screens:
  demo mode swaps the axios adapter.
- Actions EdgePanel can't do yet use `useNotSupported()` and never fake success.
- UI copy is written in English and wrapped in `t()` from `src/i18n` (`t('{n} devices', { n })`); the English text
  is the key. Add the Japanese for every new key to the area's file in `src/i18n/ja/`. `src/i18n/i18n.test.ts` fails
  on a key with no translation, a dropped `{placeholder}` or a key built at run time. Data (host names, user input,
  demo data) is never translated.
- The language switches in place, without a reload, so call `t()` only while rendering or handling an event. A label
  table or column list outside a component is a function (`const STATUS = () => ({ … })`, used as `STATUS()[s]`);
  `src/i18n/moduleLoad.test.ts` fails if any file translates something as it loads.
