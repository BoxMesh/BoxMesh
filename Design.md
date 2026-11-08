# BoxMesh — Design System

Origin: the **BoxMesh – System Design (Ant Design)** canvas
(https://claude.ai/artifact/5TYshytP6kBopBmewcPMv5), 15 artboards designed at 1440 px wide.
The app has since moved away from the canvas in places: a light theme, a more compact spacing scale, a new
sign-in page and logo. **This file records what the app does now.** Where the canvas and this file disagree,
this file wins; where the code and this file disagree, fix one of them.

Look in one line: **near-black (or warm off-white) UI with a single lime accent**, Geist type, soft 12–16 px
corners, deep shadows and a lime glow on primary actions in dark. Built on **Ant Design 6** with plain antd
`Layout` + `Menu` (the canvas names Ant Design 5 / ProLayout; v6 is used because it supports React 19 without a patch).

Where things live:
- `src/config/theme.ts`: both palettes and `buildTheme(mode)`, the antd theme. `tone.*` gives inline status colours.
- `src/styles/index.css`: the same palette as CSS variables (`:root` dark, `:root[data-theme='light']`), plus
  everything antd has no token for.

---

## 1. Color

One accent only (lime), and lime means **action**: buttons, links, the current selection. "Good" status (online,
trusted, healthy) is a separate green, so a status never reads as a button. Status is never told by hue alone:
always with a word, a number or an icon.

### Base palette

| Token | Dark | Light | Used for |
|---|---|---|---|
| `brand` | `#c7f36b` | `#c7f36b` | Lime fills: primary buttons, selected segment, checkbox, avatar, step numbers |
| `brand-hover` | `#d8ff8a` | `#b8e65a` | Primary button hover |
| `on-brand` | `#090b0c` | `#090b0c` | Text and icons on lime |
| `accent` | `#c7f36b` | `#3f5a0a` | Lime as **text or line**: links, active tab, pagination, focus ring, active menu icon, card-title dot. antd `colorPrimary` |
| `bg-page` | `#000000` | `#f4f5f0` | Page background |
| `bg-surface` | `#101416` | `#ffffff` | Cards, sider, header |
| `bg-raised` | `#151a1d` | `#f4f5f0` | Table header, row hover, input fill, icon buttons |
| `bg-button` | `#1b2124` | `#eef0ec` | Default button fill (dark; light buttons are white) |
| `bg-hover` | `#1b2124` | `#eceee8` | Menu item hover |
| `bg-strong` | `#232b2f` | `#e2e6da` | Selected menu item; hover on buttons that sit on an already-hovered row; account button hover |
| `bg-track` | `#151a1d` | `#eceee9` | Segmented track, progress track |
| `border` | `#2a3135` | `#d6dad0` | Card borders, table dividers, header and sider rules |
| `border-hover` | `#3a4247` | `#c3c8bd` | Card and stat-card border on hover |
| `border-control` | `#5f676b` | `#8a9188` | Inputs, selects, default buttons |
| `text` | `#f1efe7` | `#101416` | Primary text |
| `text-secondary` | `#a7adb0` | `#4a5256` | Labels, captions, breadcrumbs, idle menu items, offline rows |
| `text-disabled` | `#7a8287` | `#6b7377` | Menu group titles, offline dot |

Why two lime roles: `#c7f36b` text on white is about 1.3:1, so in light the lime stays a **fill** and the
darker `#3f5a0a` does every job where lime is text or a thin line. For the same reason, light-theme primary
buttons get a `#6f9420` edge (3.5:1 on white), or their shape disappears on a white card.

### Semantic (status) sets: background / border / text

| Status | Dark | Light | Examples |
|---|---|---|---|
| Success | `#12261a` / `#2e5a3a` / `#7fd88f` | `#e6f4ea` / `#a8d5b5` / `#1f7a3a` | Online, trusted cert, exit 0, healthy resource meters (`tone.positive`) |
| Warning | `#2a2010` / `#5c4520` / `#f5b84a` | `#fff4e0` / `#f0cf8f` / `#965a00` | Disk almost full, outdated agent, cert expiring within 30 days |
| Error | `#2a1412` / `#5c2a24` / `#ff7a6b` | `#fdecea` / `#f2b8ae` / `#c4321f` | Revoked, High CPU/RAM, offline status, exit 1, cert expiring within 7 days |
| Info | `#142028` / `#2c4250` / `#7ea2b8` | `#e8f2f8` / `#b3d3e6` / `#2f5f7a` | Group tag, running job |
| Neutral | `bg-raised` / `border-control` / `text-secondary` | same roles | Free-form tag, "Heartbeat lost", "Every group" |

Light warning was `#b26b00` until it failed contrast (3.9:1 on its own tag background); `#965a00` clears 5:1.
Every text colour above clears 4.5:1 on the surface it sits on, in both themes. Check a new one before using it.

### Theme switching
- The default follows the OS (`prefers-color-scheme`). The sun/moon button in the header overrides it; the choice is
  saved in `localStorage` as `boxmesh-theme`.
- An inline script in `index.html` sets `<html data-theme>` before the first paint, so a light visit never flashes black.
- Switching animates: the new theme spreads as a circle from the toggle (View Transitions API, 550 ms,
  `cubic-bezier(0.2, 0, 0, 1)`). Browsers without the API, and reduced-motion users, switch instantly.
- `ThemeProvider` also sets `<meta name="theme-color">` (`#101416` dark, `#ffffff` light) for the window title bar.

**Other differences in light**: shadows are soft with no glows; code blocks stay dark (`#101416`); tooltips are dark with white text.

---

## 2. Typography

- UI font: **Geist** (400/500/600/700) → `'Geist Fallback', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif`
- Mono font: **Geist Mono** (400/500) → `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`
- Loaded from Google Fonts. Tables use `font-variant-numeric: tabular-nums`, so dates, IPs and counts line up.

| Role | Size / line-height | Weight | Notes |
|---|---|---|---|
| Page title (h1) | 20 / 28 | 600 | letter-spacing −0.01em |
| Card title | 14 | 600 | prefixed by the 8 px card-title dot |
| Body, table cells, page subtitle | 14 / 22 | 400 | default for everything |
| Buttons | 14 | 500 (primary 600) | |
| Statistic value | 26 | 600 | coloured by meaning |
| Table header | 12 | 600 | uppercase, letter-spacing 0.06em, `text-secondary`, with a 14 px icon |
| Caption, tag, sub-line | 12 | 400 | `text-secondary` |
| Sider item | 13 / 32 | 400 | 14 would clip "Security & Certificates" in the 216 px sider |
| Sider group title | 12 / 16 | 400 | uppercase, letter-spacing 0.04em, `text-disabled` |
| Inline code (MAC, serial) | 13 | 400 | Geist Mono |
| Logo word on sign-in | 30 / 36 (24 under 576 px) | 600 | letter-spacing −0.02em |

Nothing is smaller than 12 px.

---

## 3. Shape, spacing, size, elevation

**Radius**: 12 px base (buttons, inputs, menu items, icon buttons, code) · 16 px large (cards, alerts, sign-in card)
· 10 px small (tags, segmented items) · 8 px row icon buttons · 50 % avatar and dots · 3 px card-title dot.

**Spacing**: one compact 4 px scale for the whole app, sign-in included.
- Content padding 20 (16 under 576 px); gap between blocks 12.
- Card header 44 tall, padding 16; card body 16. Tables inside cards run edge to edge (body padding 0).
- Table cells `8px 12px`; pagination and filter bars `12px 16px`.
- Page header: title, 2 px, subtitle; actions on the right.

**Control sizes**
- Control height **32** (buttons, inputs, selects, pagination, icon buttons 32×32; row icon buttons 28×28).
- Menu item 32; header 56; sider logo row 56.
- Hit area at least 24 px. Smaller antd controls (switch, table filter icon, password eye, link buttons, breadcrumb
  links) keep their drawn size and get an invisible `::before` that extends the hit area by 6 px on each side.

**Elevation and effects** (not antd defaults; they live in `theme.ts` and `index.css`)
- Card (dark): `inset 0 1px 0 rgba(241,239,231,.06), 0 24px 48px -16px rgba(0,0,0,.9)`;
  light: `0 1px 0 rgba(16,20,22,.04), 0 24px 48px -16px rgba(16,20,22,.18)`.
- Header (dark): `0 1px 0 rgba(241,239,231,.04), 0 12px 24px -12px rgba(0,0,0,.8)`.
- Primary button glow (dark): `0 0 0 1px rgba(199,243,107,.4), 0 8px 24px -8px rgba(199,243,107,.55)`.
- Focus: `outline: 2px solid` accent, `outline-offset: 2px`, on `:focus-visible`.

**Motion** (everything is switched off under `prefers-reduced-motion`)
- Transitions 150 ms on background, colour and border colour.
- Page enter: on every navigation the page's top-level blocks rise 8 px and fade in, 320 ms
  `cubic-bezier(0.2, 0.8, 0.2, 1)`, 40 ms apart (capped at 160 ms). Filter and paging changes don't replay it.
- The page spinner shows only if loading lasts longer than 150 ms.
- Overlays (drawer, dropdown, modal) use antd's own motion.

---

## 4. Ant Design theme mapping

`buildTheme(mode)` uses `darkAlgorithm` or `defaultAlgorithm` with the palette of §1.

| Token | Value |
|---|---|
| `colorPrimary` / `colorLink` | `accent` |
| `colorSuccess` / `Warning` / `Error` / `Info` (+ `Bg`, `Border`) | the semantic sets of §1 |
| `colorTextLightSolid` | `#090b0c` dark, `#ffffff` light |
| `colorBgLayout` / `colorBgContainer` | `bg-page` / `bg-surface` |
| `colorBgElevated` | `bg-raised` dark, `bg-surface` light |
| `colorBorder` / `colorBorderSecondary` | `border-control` / `border` |
| `borderRadius` / `LG` / `SM` | 12 / 16 / 10 |
| `controlHeight` / `fontSize` | 32 / 14 |
| `Layout` | sider and header `bg-surface`, header 56, padding `0 24px` |
| `Menu` | 13 px, item 32, radius 12, margin `2px 8px`, padding 12, hover `bg-hover`, selected `bg-strong` |
| `Button` | primary = `brand` fill with `on-brand` text; default hover turns border and text `accent` |
| `Card` | header 44 / 14 px / padding 16, body 16 |
| `Table` | header and row hover `bg-raised`, cells 14 px `8px 12px`, selected rows `success-bg` |
| `Segmented` | track `bg-track`, padding 2, selected `brand` with `on-brand` text |
| `Statistic` | 26 px |
| `Alert` | `8px 12px`, with description `12px 16px` |
| `Tag` | default `bg-raised` / `text-secondary`, 12 px; `variant="outlined"` set once on `ConfigProvider` |

Gotchas:
- `colorTextLightSolid` is dark in dark mode (text on lime), so `Tooltip.colorTextLightSolid` and
  `Layout.triggerColor` are reset.
- The checkbox tick uses `colorWhite` (reset to `#090b0c`), and `Checkbox.borderRadiusSM` is 4, or the
  global 10 px turns the box into a circle.
- antd fades a loading button to 65 % opacity; the devices status button resets that, or its word fails contrast.

---

## 5. Layout

**App shell**
- Sider 216 px, `bg-surface`, right `border`. Below 992 px it collapses to zero width; antd's trigger opens it,
  parked in the header's left corner.
- Header 56, `bg-surface`, bottom border: breadcrumb on the left (`BoxMesh / Page`, current page in `text`); on the right a
  240 px search (hidden under 576 px), the theme toggle and the account button (28 px lime avatar + name; the menu holds
  the email and "Sign out").
- The breadcrumb never wraps: the last crumb is cut with an ellipsis, and under 700 px the "BoxMesh" root is dropped.
- Page body: padding 20, vertical stack, gap 12.

**Page header**: h1 + one-line subtitle on the left, actions on the right; wraps on narrow screens.

**Responsive** (pages are fluid)
- Card grids: `repeat(auto-fit, minmax(min(100%, 420px), 1fr))`; statistic grid `minmax(220px, 1fr)`.
- Tables scroll horizontally inside their card.
- Button rows wrap.

---

## 6. Components

### Logo (`src/components/Logo.tsx`)
- `LogoMark`: a hexagonal cage drawn in strokes, 6 node rings at the corners, a lime core. Node fills use
  `--logo-ground` (default `bg-surface`; the sign-in page sets it to `bg-page`), so the rings read as holes on any ground.
- `Logo`: mark + "Box**Mesh**" (Mesh in `accent`). Sider uses 24 px, sign-in 40 px.

### Favicon and app icons
- `public/favicon.svg`: transparent, drawn for 16 px (solid nodes and heavier strokes than the logo). Its colours follow
  the **browser's** colour scheme through a `prefers-color-scheme` rule inside the SVG, not the app's theme toggle:
  dark mark `#101416` with core `#8fb83a` on light tab bars, cream `#f1efe7` with core `#c7f36b` on dark ones.
- `public/pwa-192.png`, `pwa-512.png`: full-bleed `#101416` tile with the mark at 72 %, so one file serves "any" and
  "maskable". Manifest `background_color` is `#101416`.

### Sider menu
- Logo row 56 tall with a bottom `border`, padding `0 20px`, so it lines up with the header.
- Group title: uppercase, `text-disabled`, padding `12px 20px 4px`, aligned with the item icons.
- Item: 13 px, height 32, radius 12, 16 px icon.
  - Idle `text-secondary`. Hover `bg-hover`, `text`.
  - Active: `bg-strong` fill, `text`, `accent` icon, 1 px inset highlight, `aria-current="page"`.
  - No weight change on select, so labels don't shift or clip.

### Buttons
| Variant | Look | Hover |
|---|---|---|
| Primary | `brand` fill, `on-brand` text, 600; lime glow in dark, `#6f9420` edge in light | `brand-hover` |
| Default | dark: `bg-button` fill; light: white; `border-control` border | border and text turn `accent` |
| Danger | antd danger, for destructive actions only; always confirmed (Popconfirm) | |
| Icon (row actions) | 28×28, transparent, `text-secondary`, `aria-label` required | `bg-strong`, `text` |
| Icon (header, back) | 32×32, `bg-raised`, `border` | |

One primary per screen area. A row of the same destructive action (e.g. "Revoke" on every certificate) uses the
default button; red appears only on the confirm.

### Inputs
Height 32, radius 12, `border-control`; placeholder `text-secondary`. No leading icon, except the header search.
Form labels sit above fields.

### Segmented control (time range, shell)
Track `bg-track`, padding 2. Selected: `brand` fill, `on-brand`, 600.

### Card
`bg-surface`, 1 px `border`, radius 16, card shadow. Header 44 with bottom border; title 14/600 prefixed by an
8×8 `accent` square (radius 3, lime glow in dark); optional link on the right ("All devices").
A table that ends a card is clipped to the card's bottom corners.

### Statistic card (Dashboard)
The whole card is a link. Label (`text-secondary`) → value 26/600 → 12 px footnote.
Value colour by meaning: success green = online, `text-secondary` = offline, error = alerts.
Hover: border `border-hover` and a soft shadow. No lift.

### Table
- Header `bg-raised`, 12 px uppercase with an icon per column; rows hover `bg-raised`.
- First column: bold link to detail, or name + 12 px secondary sub-line (Users). MAC and serial in mono `<code>`.
- Filters live in the column headers (antd filter dropdowns), not in a bar above.
- Devices: an offline row drops to `text-secondary`. The Status column is a small outlined button with the word
  (Online green, Offline red); clicking pings the agent, and it spins while waiting. The last column is three icon
  links (terminal, desktop, files), `aria-disabled` with a tooltip when the device is offline.
- Users: an account that can't sign in drops to `text-secondary` (no opacity).
- Pagination: page size 10, range text `1–10 / 12`, hidden on a single page.

### Certificate expiry (`src/components/CertExpiry.tsx`)
The date in `dd Mon yyyy`, coloured by `certTone` (`src/utils/devices.ts`): red within 7 days, amber within 30, plain
otherwise or when revoked. No "N days left" text in the cell; the count is in the tooltip and `aria-label`.
Used on Security & Certificates and on Device detail. The Dashboard alert lists certificates within 30 days and turns
red when any is within 7.

### Tag
12 px, radius 10, outlined, colours from the semantic sets. "+ Tag" is a dashed default-size tag button.

### Tabs
Underline tabs (Device detail: Overview · Connection): active = `accent` text + 2 px underline.

### Alert
Radius 16, padding `8px 12px`, warning or error set, 16 px icon, message with links.

### Progress (Average resources)
Track `bg-track`; fill success green, warning above the threshold. Label row above: name left, value right.

### Timeline (Recent activity)
Ring per event: success green = normal, error = failure or offline. Time 12 px secondary below.

### Drawer
Forms open in a drawer from the right (Enroll agent, New job, Create token, Invite person). An issued secret stays on
screen in the drawer with a "Copy" button until the drawer closes.

### Code block and terminal
Code block: bg `#090b0c` dark / `#101416` light, Geist Mono, radius 12. Terminal: xterm.js on the same background.

### Date formats
`dd Mon yyyy` (e.g. `06 Dec 2026`) and `dd Mon yyyy, HH:mm`, always two-digit days, so a column lines up.
Relative times ("4 min ago") for last seen and activity.

### Not-yet-available actions
Actions EdgePanel has no endpoint for (update agent, disable device, edit tags, save thresholds) stay visible and
toast "<Doing something> isn't available yet." They never fake success.

### Sign-in page (`/login`)
`/login` is public; every other route sends a signed-out visitor there and returns them to the page they asked for.
- Full-window artwork (`src/assets/boxmesh.svg`, the canvas's sign-in art, inlined by `LoginBackground.tsx`): a mesh
  lattice, lime hubs, OS tiles with status dots, and packets travelling along routes to the panel (SMIL, hidden under
  reduced motion). It paints with `--bm-*` variables defined on `.login-bg`, mapped to theme tokens, so one file
  serves both themes.
- Theme toggle top-right. Centred: the 40 px logo lockup, then a 400 px card (padding 16, gap 12) on the same scale as
  the rest of the app: 32 px controls, 14 px text.
- Card: "Sign in" + "Manage all your devices in one place.", Email, Password with "Forgot password?" on its label row,
  primary "Sign in" ("Signing in…" while sending), a divider "or", and a default "Explore the demo" button.
- "Forgot password?" turns the same card into "Reset password": the password row and the demo block fold away
  (250 ms height and fade), the heading fades in, the button reads "Send reset link", and "Back to sign in" folds in.
  Folded blocks are `inert`. Success shows "Check your inbox" without saying whether the account exists.
- The session lives in `sessionStorage`, so it ends with the browser tab.

### Already open (`src/components/AlreadyOpen.tsx`)
A second tab or window shows a full-page notice with the logo mark instead of the app, until the first one closes
(Web Lock in `src/utils/singleInstance.ts`).

### Icons
Inline stroke icons in `src/components/Icon.tsx`: 24 viewBox, stroke 2, round caps and joins, `currentColor`.
Add new ones there in the same style; don't mix in antd's icon set. No emoji.

---

## 7. Accessibility rules

- Real `<button>`, `<a href>`, `<input>` + `<label>`; no clickable divs.
- Every icon-only control has an `aria-label` (e.g. "Open a terminal on ACC-PC-01").
- `aria-current="page"` on the active menu item; decorative SVG `aria-hidden="true"`.
- Visible focus ring on `:focus-visible`.
- Text at least 4.5:1 in both themes; status never by colour alone; hit areas at least 24 px.
- Disabled-looking controls that must still explain themselves use `aria-disabled` + tooltip, not `disabled`.

---

## 8. Navigation and screens

**Roles**: Admin · Operator · Viewer (plus per-device permissions for terminal and desktop).

**Sider groups**
- Overview: Dashboard, Devices
- Remote: Remote Terminal, Remote Desktop, Remote Files, Remote Service
- Operations: Command & Jobs, Audit
- Admin: Security & Certificates, Users & Access, System Settings

| Screen | Route | What is on it |
|---|---|---|
| Sign in | `/login` | Sign-in card, password reset, demo entry |
| Dashboard | `/dashboard` | Time range; cert alert; Total / Online / Offline stat cards; Average resources; Connection status; Devices needing attention; Recent activity |
| Devices | `/devices` | Table with header filters, ping status, row remote actions; Export CSV; Enroll agent drawer |
| Device detail | `/devices/:id` | Back, name, alias, status, group; Terminal (primary), Desktop, Files, Service, "⋯" (Update agent, Disable); tabs Overview (device information, connection card, alert thresholds) and Connection |
| Remote Terminal | `/remote-terminal?host=` | Device picker, shell, xterm.js |
| Remote Desktop | `/remote-desktop?host=` | Device picker, frame (no stream yet) |
| Remote Files | `/remote-files?host=` | Device picker, file table, upload |
| Remote Service | `/remote-services?host=` | Device picker, web apps through the proxy |
| Command & Jobs | `/jobs` | Job table (click a row for per-host results), New job drawer |
| Audit | `/audit` | Searchable log |
| Security & Certificates | `/security/certificates` | Agent certificates (expiry, revoke), Enrollment tokens, Create token drawer |
| Users & Access | `/users` | Role cards; people table with role select, reach, last sign-in, active switch; Invite drawer |
| System Settings | `/settings` | Agents and retention, Panel health, Backup and restore |

---

## 9. Backend contract

EdgePanel wraps responses as `{ "data": ... }` on success and `{ "error": ... }` on failure. The app calls these today
(all under `VITE_API_URL`, default `/api`): `/log-in`, `/log-out`, `/forgot-password` (placeholder name), `/devices`
and `/devices/{host}` with `/connections`, `/revoke`, `/shell`, `/files`, `/desktop`, `/services`, `/enrollments`,
`/enrollment-tokens`, `/certificates`, `/metrics/summary`, `/sessions/summary`, `/jobs`, `/audit`, `/users`,
`/settings`, `/health`. EdgePanel serves only `/log-in` and `/log-out` so far; README has the full table.

Realtime is planned over WebSocket (`/ws/events`, `/ws/terminal/{id}`, `/ws/desktop/{id}`); internal web apps go
through EdgePanel's reverse proxy at `/web/{agent}/{app}/*`.

---

## 10. Frontend stack

Vite + React 19 + TypeScript · Ant Design 6 · React Router · axios + TanStack Query · xterm.js · vite-plugin-pwa ·
Vitest · oxlint.

Data flow: page → `services/queries.ts` (query keys) → `services/*Service.ts` (axios) → EdgePanel.
Demo mode (`services/demo.ts`) swaps the axios adapter for one that answers every endpoint from `demoData.ts`, so
no screen has a demo-only branch.

PWA: installable (manifest in `vite.config.ts`), one window at a time: `launch_handler: focus-existing` for the
installed app, plus the Web Lock for browser tabs.

---

## 11. Open points

1. Architecture artboard says "EdgeAgent (Go)"; the repo's EdgeAgent is C# / .NET.
2. Charts (a Metrics tab) are named in the canvas but not drawn or built; series colours are still to define.
3. No translation layer yet (PRODUCT.md, Language).
4. The canvas's selected menu item is a solid lime block; the app keeps a raised row with a lime icon.
