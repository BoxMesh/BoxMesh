# EdgePortal — Design System

Source of truth: the **EdgePortal – System Design (Ant Design)** canvas
(https://claude.ai/artifact/5TYshytP6kBopBmewcPMv5), 15 artboards designed at 1440 px wide.
This file records its tokens, components and screens so the UI can be built without reopening the canvas.
If the two disagree, the canvas wins; update this file.

Look in one line: **dark, near-black UI with a single lime accent**, Geist type, soft 12–16 px corners,
deep shadows and a lime glow on primary actions. Built on **Ant Design 6** (dark algorithm) with plain antd
`Layout` + `Menu` (the canvas names Ant Design 5 / ProLayout; v6 is used because it supports React 19 without a patch).

---

## 1. Color

### Base palette

| Token | Hex | Used for |
|---|---|---|
| `primary` | `#c7f36b` | Primary buttons, active menu item's icon, links, focus ring, "online", selected segment |
| `primary-hover` | `#d8ff8a` | Primary button hover |
| `on-primary` | `#090b0c` | Text/icons on lime; code & terminal background |
| `bg-page` | `#000000` | Page background (layout) |
| `bg-surface` | `#101416` | Cards, Sider, Header, inputs' parent surfaces |
| `bg-raised` | `#151a1d` | Table header, row hover, input fill, segmented track, progress track, upload area |
| `bg-button` | `#1b2124` | Default (secondary) button fill |
| `border` | `#2a3135` | Card borders, table dividers, header/sider dividers |
| `border-hover` | `#3a4247` | Card border on hover, desktop frame |
| `border-control` | `#5f676b` | Inputs, selects, default buttons, default tags |
| `text` | `#f1efe7` | Primary text (warm off-white) |
| `text-secondary` | `#a7adb0` | Labels, captions, breadcrumbs, idle menu items |
| `text-disabled` | `#7a8287` | Offline dot, dashed placeholders |

### Semantic (status) sets — each has background / border / text

| Status | Background | Border | Text / solid | Examples in design |
|---|---|---|---|---|
| Success | `#1a2210` | `#4a5c22` | `#c7f36b` | Valid cert, running, exit 0, bulk-selection bar bg |
| Warning | `#2a2010` | `#5c4520` | `#f5b84a` | Disk full, outdated agent, "N days left", disk > 70 % |
| Error | `#2a1412` | `#5c2a24` (hover `#8a3e34`) | text `#ff8a7a`, solid `#ff7a6b` | Revoked, high CPU, exit 1, timeout, alert count |
| Info / processing | `#142028` | `#2c4250` | `#7ea2b8` | Group tag, Running job, WebSocket, terminal prompt |
| Neutral | `#151a1d` | `#5f676b` | `#a7adb0` | Free-form tag, Heartbeat lost, View only, HTTP |

Rules: one accent only (lime). Status is never told by hue alone — always with a word, a number or an icon.

### Light theme (added in the app, not on the canvas)

**How it switches**
- The default follows the OS setting (`prefers-color-scheme`). The sun/moon button in the header overrides it, and the choice is saved in `localStorage` as `edgeportal-theme`.
- An inline script in `index.html` sets `<html data-theme>` before the first paint, so a light visit never flashes black.
- `src/config/theme.ts` `buildTheme(mode)` builds the antd theme; `src/styles/index.css` has the CSS variables under `:root[data-theme='light']`.

**Two roles for lime**
- **Fills keep the brand lime `#c7f36b` with `#090b0c` text** in both themes: primary buttons, the selected segment, checkboxes, the avatar and step numbers.
- **Text and lines use a darker lime `#4d7c0f`** in light (5:1 on white), because `#c7f36b` text on white is about 1.3:1. This covers links, the active tab, pagination, focus rings, the active menu icon, the card-title dot and positive values. It is antd's `colorPrimary` in light mode.

| Token | Light value |
|---|---|
| `bg-page` / `bg-surface` / `bg-raised` | `#f3f4f1` / `#ffffff` / `#f6f7f4` |
| `border` / `border-hover` / `border-control` | `#e2e5e0` / `#c9cec7` / `#a9b0ac` |
| `text` / `text-secondary` / `text-disabled` | `#15191b` / `#545c60` / `#6b7377` |
| Success (bg / border / text) | `#eef6dc` / `#c5df94` / `#4d7c0f` |
| Warning | `#fff4e0` / `#f0cf8f` / `#b26b00` |
| Error | `#fdecea` / `#f2b8ae` / `#c4321f` |
| Info | `#e8f2f8` / `#b3d3e6` / `#2b6c8f` |

**Other differences in light**
- Shadows are soft and offset, with no glows.
- Code blocks stay dark (`#15191b`).
- Tooltips are dark with white text.
- Inline status colours in components use `tone.*` from `theme.ts` (CSS variables), never hex values.

---

## 2. Typography

- UI font: **Geist** (400/500/600/700) → fallback `'Geist Fallback', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif`
- Mono font: **Geist Mono** (400/500) → fallback `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`
- Loaded from Google Fonts.

| Role | Size / line-height | Weight | Notes |
|---|---|---|---|
| Page title (h1) | 20 / 28 | 600 | letter-spacing −0.01em |
| Card title (h2) | 16 / 24 | 600 | prefixed by lime square dot (see Card) |
| Body | 14 / 22 | 400 | default for everything |
| Buttons, links | 14 | 500 (primary 600) | |
| Statistic value | 30 / 38 | 600 | colored by meaning |
| Secondary metric | 20 / 28 | 600 | |
| Caption, tag, table sub-line | 12 / 16–20 | 400 | `text-secondary` |
| Sider item | 13 / 32 | 400 | |
| Sider group title | 12 / 16 | 500 | sentence case, `text-disabled` |
| Inline code | 13 | 400 | Geist Mono |
| Code block / terminal | 12 / 20 | 400 | Geist Mono |
| Badge count | 11 / 16 | 400 | |

---

## 3. Shape, spacing, size, elevation

**Radius**
- 12 px — buttons, inputs, selects, menu items, icon buttons, code blocks (base radius)
- 16 px — cards/sections, alerts, statistic cards, upload area, desktop frame (large)
- 10 px — tags, segmented items (small)
- pill (100px) — progress bars, badges; 50 % — avatar, status dots
- 3–4 px — card-title dot, inline code

**Spacing**
- Content padding 24; gap between blocks 16; card header `16px 24px`; card body `20px 24px`
- Table cell `12px 16px` (compact tables, e.g. Files: `10px 16px`)
- Grid gaps 16 (blocks) / `16px 24px` (descriptions)

**Control sizes**
- Control height **32** (buttons, inputs, selects, pagination, table icon buttons 32×32)
- Segmented item 28; add-tag button 22; menu item 32; header 56; sider logo row 56
- Icons: 14 in inputs, 16 in menu/tables/buttons, 18 in header, 28 logo

**Elevation & effects** (these are not Ant Design defaults — add them in theme/CSS)
- Card: `inset 0 1px 0 rgba(241,239,231,.06), 0 24px 48px -16px rgba(0,0,0,.9)`; border → `#3a4247` on hover (200 ms)
- Header: `0 1px 0 rgba(241,239,231,.04), 0 12px 24px -12px rgba(0,0,0,.8)`
- Primary button glow: `0 0 0 1px rgba(199,243,107,.4), 0 8px 24px -8px rgba(199,243,107,.55)`
- Danger solid glow: `0 8px 24px -8px rgba(255,122,107,.55)`
- Default button: `inset 0 1px 0 rgba(241,239,231,.1), 0 4px 12px -4px rgba(0,0,0,.9)`
- Transitions: 150 ms on background, color, border-color, opacity
- Focus: `outline: 2px solid #c7f36b; outline-offset: 2px` on `:focus-visible`

---

## 4. Ant Design theme mapping

Implemented in `src/config/theme.ts` (`theme.darkAlgorithm` + the tokens below); `src/styles/index.css` mirrors the palette as
CSS variables and adds the effects antd has no token for (card shadow and title dot, active menu icon).

Gotchas found while building:
- `colorTextLightSolid` is set dark (text on lime), so anything that draws it on a dark surface must be reset:
  `Tooltip.colorTextLightSolid`, `Layout.triggerColor`.
- The checkbox tick uses `colorWhite` (reset to `#090b0c`), and `Checkbox.borderRadiusSM` is 4, or the
  global 10 px turns the box into a circle.
- antd 6 `Tag` defaults to `variant="filled"` (no border); the app sets `outlined` once on `ConfigProvider`.

| Ant Design token | Value |
|---|---|
| `colorPrimary` / `colorSuccess` / `colorLink` | `#c7f36b` |
| `colorTextLightSolid` (text on primary) | `#090b0c` |
| `colorWarning` | `#f5b84a` |
| `colorError` | `#ff7a6b` |
| `colorInfo` | `#7ea2b8` |
| `colorBgLayout` | `#000000` |
| `colorBgContainer` | `#101416` |
| `colorBgElevated` (popups — not drawn in canvas, assumed) | `#151a1d` |
| `colorFillSecondary` | `#151a1d` |
| `colorBorder` | `#5f676b` |
| `colorBorderSecondary` | `#2a3135` |
| `colorText` / `colorTextSecondary` | `#f1efe7` / `#a7adb0` |
| `borderRadius` / `borderRadiusLG` / `borderRadiusSM` | 12 / 16 / 10 |
| `controlHeight` / `fontSize` | 32 / 14 |
| `fontFamily` / `fontFamilyCode` | Geist stack / Geist Mono stack |
| `Layout`: `siderBg`, `headerBg`, `headerHeight` | `#101416`, `#101416`, 56 |
| `Menu`: `fontSize`, `itemHeight`, `itemSelectedBg`, `itemSelectedColor` | 13, 32, `#1b2124`, `#f1efe7` (icon lime via CSS) |
| `Table`: `headerBg`, `rowHoverBg` | `#151a1d`, `#151a1d` |
| `Segmented`: `itemSelectedBg`, `itemSelectedColor`, `trackBg` | `#c7f36b`, `#090b0c`, `#151a1d` |

---

## 5. Layout

**App shell** (ProLayout, side menu)
- Sider 216 px, `bg-surface`, right border `border`. Content area takes the rest.
- Header min-height 56, `bg-surface`, bottom border, padding `8px 24px`:
  breadcrumb left (`EdgePortal / Page`, current page in `text`), right side: search (240 px, leading icon),
  notification bell (36×36, red count badge `#ff7a6b` / `#090b0c`), avatar (28 px lime circle with initial) + username.
- Page body: padding 24, vertical stack with gap 16.

**Page header**: h1 + one-line subtitle (`text-secondary`) on the left, actions on the right (wrap on narrow screens).

**Responsive** (pages are fluid, not fixed 1440)
- Shell wraps: Sider stacks above content on narrow widths.
- Card grids: `repeat(auto-fit, minmax(min(100%, 420px), 1fr))`; statistic grid `minmax(220px, 1fr)`; descriptions `minmax(240px, 1fr)`.
- Tables scroll horizontally inside their card (`overflow-x: auto`), cells `nowrap`.
- Toolbars and button rows wrap.

---

## 6. Components

### Sider menu (compact — redesigned in the app, replaces the canvas's lime-pill version)
- Logo row: 56 px tall with a bottom `border`, so it lines up with the header and the top band reads as one line.
  Hexagon stroke icon (lime, 22 px) + "EdgePortal" 15/600, padding `0 20px`.
- Group title: 12/16, weight 500, sentence case, `text-disabled`, padding `16px 20px 4px`. It is aligned with the item icons.
- Item: 13 px text, height 32, margin `1px 8px`, padding `0 12px`, radius 8, gap 10, 16 px icon.
  - Idle: `text-secondary`, no fill. Hover: `bg-raised` fill, `text`.
  - Active: `bg-button` `#1b2124` fill, `text` colour, lime icon, a 1 px inset top highlight, and `aria-current="page"`.
  - No weight change on select, so labels don't shift or clip.
  - Unbuilt modules use `text-disabled`.

### Buttons (height 32, padding `0 15px`, radius 12)
| Variant | Look | Hover |
|---|---|---|
| Primary | lime fill, `#090b0c` text, 600, lime glow | `#d8ff8a` |
| Default | `#1b2124` fill, `#5f676b` border, `text` | border + text turn lime |
| Danger (outline) | `#2a1412` fill, `#8a3e34` border, `#ff8a7a` text | `#3a1a16` fill, `#ff8a7a` border |
| Danger (solid) | `#ff7a6b` fill, `#090b0c` text, 600, red glow — only for "Disconnect"-type actions | |
| Icon (in tables) | 32×32, `#151a1d` fill, `#2a3135` border, `aria-label` required | border + icon turn lime |
| Text link | lime text, 500 | `text` color |

Danger actions (delete, disable, revoke, restore) are confirmed with Popconfirm.

### Inputs
- Height 32, padding `0 11px` (select `0 8px`), border `#5f676b`, radius 12, fill `#151a1d`, text `text`, placeholder `text-secondary`.
- Search inputs have a 14 px leading magnifier icon.
- Filter labels sit inline to the left of selects (`OS`, `Group`, `Status`) in `text-secondary`; form labels sit above fields with gap 4.

### Segmented control (time range, shell, OS)
Track `#151a1d`, padding 2, gap 2, radius 12. Items height 28, padding `0 12px`, radius 10, idle `text-secondary`.
Selected: lime fill, `#090b0c`, 600, `aria-pressed="true"`.

### Card / section
`bg-surface`, 1 px `border`, radius 16, card shadow, hover border `#3a4247`.
Header `16px 24px` with bottom border; title 16/600 prefixed by an 8×8 lime square (radius 3, glow `0 0 10px rgba(199,243,107,.6)`);
optional right-side link ("All", "Audit log"). Body padding `20px 24px`.

### Statistic card (Dashboard KPI)
Whole card is a link. Padding `20px 24px`. Label (`text-secondary`) → value 30/38/600 → footnote 12 px.
Value color by meaning: lime = good/online, `text-secondary` = offline/neutral, `#ff7a6b` = alerts.

### Table (ProTable)
- Header cells `#151a1d`, 600, `12px 16px`, bottom border; rows hover `#151a1d`.
- First column: bold link to detail + 12 px secondary sub-line (alias, etc.). Technical values (MAC, serial) in mono `<code>`.
- Status column: 6 px dot + word — Online `#c7f36b`; Offline `#7a8287` with secondary text.
- Last column: row of 32×32 icon buttons (Terminal, Desktop, Files, `⋯` more).
- **Bulk bar** when rows are selected: strip under the filters, bg `#1a2210`, padding `10px 24px`, "**N** devices selected" + link actions.
- **Pagination**: right-aligned, range text `1–8 / 48` in secondary; items min 32×32 radius 12; current page has lime border + lime text.

### Tag
Padding `0 7px`, 12/20, radius 10, 1 px border, colors from the semantic sets (§1).
"Add tag" = 22 px dashed-border button (`#5f676b`), text `+ Tag`.

### Tabs
- **Underline tabs** (device detail, security): gap 28, item padding `10px 0`; active = lime text + 2 px lime bottom border; idle = `text`.
- **Vertical section nav** (settings): card container padding 8, items padding `9px 16px`, radius 12; active = `#1a2210` fill + lime text.

### Alert (banner)
`role="alert"`, warning set: bg `#2a2010`, border `#5c4520`, radius 16, padding `9px 16px`, 16 px warning icon, message, action link right.

### Progress
Track 8 px pill `#151a1d`; fill lime; switches to `#f5b84a` above a threshold (design: disk > 70 %). Label row above: name left, value right.
Use `role="progressbar"` with `aria-valuenow`.

### Timeline (recent activity)
10 px ring (2 px border): lime = normal event, `#ff7a6b` = failure/offline. Text with bold entity names, time 12 px secondary below.

### Descriptions
`<dl>` grid (`minmax(240px, 1fr)`, gap `16px 24px`), `dt` in `text-secondary`, `dd` margin 0.

### Drawer / Modal
Same surface as cards (`bg-surface`, border, radius 16). Multi-step content uses numbered steps:
24 px lime circle with 12 px `#090b0c` number + 600 title.
Specimens: "Drawer · Enroll new agent" (Devices), "Modal · Register web application" (Remote Service).

### Code block & terminal
- Code block: bg `#090b0c`, Geist Mono 12/20, radius 12, padding `12px 14px`, horizontal scroll, "Copy" default button below.
- Terminal: xterm.js area on `#090b0c`, min-height 460; prompt in `#7ea2b8` mono; input transparent.
- Command history list: mono command, then `user · time` left and result right — lime for `running` / `exit 0`, `#ff8a7a` for `exit 1` / `timeout`.
- Inline code (docs): 13 px, bg `#151a1d`, border `#2a3135`, radius 4, padding `1px 5px`.

### Remote desktop frame
bg `#090b0c`, border `#3a4247`, radius 16, `aspect-ratio: 16 / 9`, max-height 640,
shadow `0 0 0 4px #101416, 0 30px 60px -20px rgba(0,0,0,.9)`.

### Upload (dragger)
Label-wrapped area, column centered, padding `24px 16px`, 1 px dashed `#5f676b`, radius 16, bg `#151a1d`.

### Not-yet-available features (added in the app, not on the canvas)
Entry points to unbuilt modules stay visible but muted. There is no "Soon" badge; the owner rejected it.
- **Menu:** items use `text-disabled` `#7a8287` (4.7:1 on the sider) and still open the module's page.
- **Device tabs and buttons:** tabs get a muted label. Buttons are disabled with a tooltip "<Module> isn't available yet".
- **Row icon buttons:** `aria-disabled="true"`, not `disabled`, so they stay focusable and keep their tooltip.
- **Module page** (`src/components/NotSupported.tsx`):
  - Shows the module's own icon in a 72 px raised circle, the title "<Module> isn't available yet", and the module's one-line summary from `src/config/nav.ts`.
  - Its primary button is "Go to Devices"; inside a device tab it is "Back to overview" instead.
- **Stubbed actions:** they toast "<Doing something> isn't available yet." and never fake success.

### Icons
Inline stroke icons: 24 viewBox, stroke 2, round caps and joins, `currentColor`. No emoji.
Set used by the menu: dashboard, devices (monitor), terminal (prompt), desktop (pointer), files (folder),
web (globe), jobs (checklist), security (shield-check), users, audit (document), settings (gear).

---

## 7. Accessibility rules (as drawn)

- Real `<button>`, `<a href>`, `<input>` + `<label>`; no clickable divs.
- Every icon-only control has `aria-label` (e.g. "Terminal PC-001", "Notifications, 3 new").
- `aria-current="page"` on active menu item, tab and pagination page; `aria-pressed` on segmented items.
- Decorative SVG `aria-hidden="true"`.
- Visible lime focus ring on `:focus-visible`.

---

## 8. Navigation & screens

**Roles**: Admin · Operator · Viewer (plus per-device permissions: `terminal`, `desktop`; per-app access for web apps).

**Sider groups**
- Overview — Dashboard, Devices
- Remote — Remote Terminal, Remote Desktop, Remote Files, Remote Service
- Operations — Command & Jobs, Audit & Alerts
- Admin — Security & Certificates, Users & Access, System Settings

| # | Module | Route | Key Ant Design components | Minimum access |
|---|---|---|---|---|
| 1 | Dashboard | `/dashboard` | Statistic, Card, Progress, Table, Timeline, Alert | Viewer |
| 2 | Devices | `/devices`, `/devices/:id` | Table + filters, Tag, Badge, Drawer (enroll), Descriptions, Tabs | Viewer reads · Operator tags/groups · Admin deletes/disables/updates agents |
| 3 | Remote Terminal | `/remote-terminal`, per device `/devices/:id?tab=terminal` | Segmented (PowerShell/CMD/Bash), xterm.js in Card, timeout InputNumber, cancel Button, history List | `terminal` on device |
| 4 | Remote Desktop | `/remote-desktop`, per device `/devices/:id?tab=desktop` | Canvas stream, resolution Select, clipboard Switch, disconnect Popconfirm, session Table | `desktop` on device |
| 5 | Remote Files | `/remote-files`, per device `/devices/:id?tab=files` | Breadcrumb, Table, Upload.Dragger, Progress, rename Modal, delete Popconfirm | Viewer browses · Operator writes |
| 6 | Remote Service | `/remote-services`, per device `/devices/:id?tab=web`; EdgePanel proxy `/web/:agent/:app/*` | App Table, register Modal, copyable URL, session Table, revoke Popconfirm | Per-app access |
| 7 | Metrics | `/devices/:id?tab=metrics` | Card + charts, time-range Segmented, threshold InputNumber | Viewer |
| 8 | Command & Jobs | `/jobs`, `/jobs/:id` | Table, status Badge, Form, agent/group Select, DatePicker + cron, Progress | Operator |
| 9 | Agent tunnel | `/devices/:id?tab=connection` | Latency/session Descriptions, connection history Table | Viewer |
| 10 | Security & Certificates | `/security/certificates`, `/security/tokens` | Tabs, Table, expiry Tag, token Modal, revoke Popconfirm | Admin |
| 11 | Users & Access | `/users`, `/roles` | Table, Checkbox matrix (Admin/Operator/Viewer), device/group Transfer | Admin |
| 12 | Audit & Notifications | `/audit`, `/notifications` | Tabs, Table + RangePicker, notification List, Badge | Admin (Operator sees own) |
| 13 | System Settings | `/settings` | Section nav, Form, InputNumber, Switch, health-check Table, backup Button | Admin |

Device detail tabs (as drawn): Overview · Terminal · Desktop · Files · Web Apps · Connection.
The sitemap also lists a Metrics tab (`?tab=metrics`) that is not in the drawn tab bar.

Security tabs: Agent certificates · Enrollment tokens · Certificate Authority · Sign-in sessions.

---

## 9. Backend contract the UI expects (proposed in the canvas — owned by EdgePanel, not implemented yet)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/devices` | List, filter by OS / group / tag / status |
| PATCH | `/api/devices/{id}` | Rename, tag, group, disable |
| POST | `/api/devices/{id}/agent-update` | Remote agent update |
| POST | `/api/enrollment-tokens` | Create enrollment token |
| GET | `/api/devices/{id}/metrics?range=1h` | CPU / RAM / Disk / Network history |
| GET · PUT · DELETE | `/api/devices/{id}/fs?path=` | Browse, rename, delete |
| POST | `/api/jobs`, `/api/jobs/{id}/cancel`, `/retry` | Jobs |
| CRUD | `/api/web-apps` | Web apps on agents |
| POST | `/api/certificates/{serial}/revoke` | Revoke certificate |
| GET | `/api/audit` | Paginated audit log |

Realtime: `/ws/events` (online/offline, alerts, job status), `/ws/terminal/{sessionId}`, `/ws/desktop/{sessionId}`,
`/ws/metrics/{deviceId}`; chunked upload `/api/devices/{id}/fs/upload`; reverse proxy `/web/{agent}/{app}/*`.

EdgePanel wraps responses as `{ "data": ... }` on success and `{ "error": ... }` on failure.

---

## 10. Frontend stack

Canvas suggestion: React + TypeScript · Ant Design 5 · @ant-design/pro-components (ProLayout, ProTable) ·
React Router · TanStack Query · xterm.js · @ant-design/charts.

In use now: Vite + React 19 + TypeScript · Ant Design 6 · React Router · axios + TanStack Query · vite-plugin-pwa ·
Vitest. Add xterm.js with the terminal, charts with the metrics tab.

Data flow: page → `services/queries.ts` (TanStack Query keys) → `services/*Service.ts` (axios) → EdgePanel `/api`.
Until EdgePanel has the endpoints, an axios adapter in `src/mocks/adapter.ts` answers with mock data;
`VITE_USE_MOCK=false` switches to the real API (see `.env.example`).

PWA: installable (`manifest` in `vite.config.ts`), one window at a time — `launch_handler: focus-existing` for the
installed app, plus a Web Lock (`src/utils/singleInstance.ts`) that blocks a second browser tab until the first closes.

---

## 11. Open points

1. Architecture artboard says "EdgeAgent (Go)"; the repo's EdgeAgent is C# / .NET.
2. Storage is marked "PostgreSQL? – TBD"; the repo uses PostgreSQL + Redis.
3. Some UI copy mixes Vietnamese into English ("Reconnect trong 24h", "CPU cao", "multiplex qua tunnel") — pick one language.
4. Popup surfaces (dropdown, popconfirm, tooltip) are not drawn; `colorBgElevated #151a1d` is an assumption.
5. Charts (Metrics tab) are named but not drawn — colors for series still to define.
6. Icons: the canvas's stroke paths live in `src/components/Icon.tsx`; add new ones there in the same style
   (24 viewBox, stroke 2, round caps) rather than mixing in Ant Design's icon set.
