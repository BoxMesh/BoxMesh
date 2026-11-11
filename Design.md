# BoxMesh — Design System

Origin: the **BoxMesh – System Design (Ant Design)** canvas
(https://claude.ai/artifact/5TYshytP6kBopBmewcPMv5), 15 artboards designed at 1440 px wide.
The app has since moved away from the canvas in places: a light theme, a more compact spacing scale, a new
sign-in page and logo. **This file records what the app does now.** Where the canvas and this file disagree,
this file wins; where the code and this file disagree, fix one of them.

Look in one line: **near-black (or warm off-white) UI with a single tangerine accent**, Geist type, soft 12–16 px
corners, deep shadows and an orange glow on primary actions in dark. Built on **Ant Design 6** with plain antd
`Layout` + `Menu` (the canvas names Ant Design 5 / ProLayout; v6 is used because it supports React 19 without a patch).

Where things live:
- `src/config/theme.ts`: both palettes and `buildTheme(mode)`, the antd theme. `tone.*` gives inline status colours.
- `src/styles/index.css`: the same palette as CSS variables (`:root` dark, `:root[data-theme='light']`), plus
  everything antd has no token for.

---

## 1. Color

One accent only (tangerine orange), and orange means **action**: buttons, links, the current selection. "Good" status (online,
trusted, healthy) is a separate green, so a status never reads as a button. Status is never told by hue alone:
always with a word, a number or an icon.

### Base palette

| Token | Dark | Light | Used for |
|---|---|---|---|
| `brand` | `#fb923c` | `#f97316` | Orange fills: primary buttons, selected segment, checkbox, avatar, step numbers |
| `brand-hover` | `#fdba74` | `#fb923c` | Primary button hover |
| `on-brand` | `#090b0c` | `#090b0c` | Text and icons on the orange fill (8.7:1 / 7.0:1) |
| `accent` | `#fb923c` | `#c2410c` | Orange as **text or line**: links, active tab, pagination, focus ring, active menu icon, card-title dot. antd `colorPrimary` |
| `bg-page` | `#000000` | `#f4f5f0` | Page background |
| `bg-surface` | `#101416` | `#ffffff` | Cards, sider, header |
| `bg-raised` | `#151a1d` | `#f4f5f0` | Table header, row hover, input fill, icon buttons |
| `bg-button` | `#1b2124` | `#eef0ec` | Default button fill (dark; light buttons are white) |
| `bg-hover` | `#1b2124` | `#eceee8` | Menu item hover |
| `bg-strong` | `#232b2f` | `#e2e6da` | Selected menu item; hover on buttons that sit on an already-hovered row; account button hover |
| `bg-track` | `#151a1d` | `#eceee9` | Segmented track, progress track |
| `border` | `#2a3135` | `#d6dad0` | Card borders, table dividers, header and sider rules |
| `border-hover` | `#3a4247` | `#c3c8bd` | Card border on hover |
| `border-control` | `#5f676b` | `#8a9188` | Inputs, selects, default buttons |
| `text` | `#f1efe7` | `#101416` | Primary text |
| `text-secondary` | `#a7adb0` | `#4a5256` | Labels, captions, breadcrumbs, idle menu items, offline rows |
| `text-disabled` | `#7a8287` | `#6b7377` | Menu group titles, offline dot |

On dark one orange does both jobs: `#fb923c` reads at 8.2:1 on the surface. On light the roles split: the fill is a
bright `#f97316` with dark text (a deep `#c2410c` fill with white text read as too heavy), and text and lines use
`#c2410c` (5.2:1 on white, 4.7:1 on the page grey), the lightest orange that still reads as text. Light primary
buttons get an `#ea580c` edge (3.6:1 on white), since the bright fill alone is 2.8:1 against a white card. The accent was lime (`#c7f36b`) until November 2026.

### Semantic (status) sets: background / border / text

| Status | Dark | Light | Examples |
|---|---|---|---|
| Success | `#12261a` / `#2e5a3a` / `#7fd88f` | `#e6f4ea` / `#a8d5b5` / `#1f7a3a` | Online, trusted cert, exit 0, healthy resource meters (`tone.positive`) |
| Warning | `#2a2410` / `#5c5020` / `#facc15` | `#fefce8` / `#fde68a` / `#854d0e` | Disk almost full, outdated agent, cert expiring within 30 days |
| Error | `#2a1418` / `#5c2430` / `#ff6b81` | `#fff1f2` / `#fecdd3` / `#be123c` | Revoked, High CPU/RAM, exit 1, cert expiring within 7 days |
| Info | `#142028` / `#2c4250` / `#7ea2b8` | `#e8f2f8` / `#b3d3e6` / `#2f5f7a` | Group tag, running job |
| Neutral | `bg-raised` / `border-control` / `text-secondary` | same roles | Offline status and offline notices, free-form tag, "Heartbeat lost" |

Warning is yellow and error rose-red so neither reads as the orange accent (amber and coral were too close to it).
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
| Sider item | 13 / 32 | 400 | |
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
- `colorTextLightSolid` is dark in dark mode (text on the bright orange), so `Tooltip.colorTextLightSolid` and
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
  240 px search (hidden under 576 px), the theme toggle and the account button (28 px orange avatar + name; the menu holds
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
- `LogoMark`: a hexagonal cage drawn in strokes, 6 node rings at the corners, an orange core (`brand`). Node fills use
  `--logo-ground` (default `bg-surface`; the sign-in page sets it to `bg-page`), so the rings read as holes on any ground.
- `Logo`: mark + "Box**Mesh**" (Mesh in `accent`). Sider uses 24 px, sign-in 40 px.

### Favicon and app icons
- `public/favicon.svg`: transparent, drawn for 16 px (solid nodes and heavier strokes than the logo). Its colours follow
  the **browser's** colour scheme through a `prefers-color-scheme` rule inside the SVG, not the app's theme toggle:
  dark mark `#101416` with core `#ea580c` on light tab bars, cream `#f1efe7` with core `#fb923c` on dark ones.
- `public/pwa-192.png`, `pwa-512.png` (purpose "any"): a rounded tile (22 % radius, transparent corners) with a dark
  `#1c2327`→`#0c0f11` gradient, a `#2a3135` hairline edge, a faint orange glow behind the mark (core `#fb923c`), and the mark at 62 %.
- `public/pwa-maskable-512.png`: the same art full-bleed, for Android's launcher masks and iOS (`apple-touch-icon`), which
  round the corners themselves and would fill transparent ones. The mark's outer nodes stay inside the 80 % safe circle.
  Manifest `background_color` is `#101416`.

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
| Primary | `brand` fill, `on-brand` text, 600; orange glow in dark, `#ea580c` edge in light | `brand-hover` |
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
8×8 `accent` square (radius 3, orange glow in dark); optional link on the right ("All devices").
A table that ends a card is clipped to the card's bottom corners.

### Dashboard (triage first)
- **Health strip** (one card, four cells split by `border` rules; 2 + 2 below 1200 px, one column on phones):
  Fleet health ("7 of 12 online", 28/34 600) with a stacked bar and a legend in words (healthy `positive`,
  warning `warning-fill`, critical `error`, offline `text-disabled`); Needs attention now (critical count, red when
  above 0); Certificates within 30 days (warning colour, soonest named); Average latency (tunnels and reconnects).
- **Needs attention** queue (left, about 63 %): one table grouped Critical → Warning → Offline by `triage()` in
  `utils/devices.ts` (any red issue is critical; a certificate within 7 days is red, within 30 a warning; an outdated
  agent is a warning). Each group opens with a header row; each device has a 4 px severity stripe, all its issue tags
  (they wrap), values, last seen and a next step: Terminal for a machine running hot, Open otherwise.
- **Right column**: Average resources (meters, warning fill above 70 %) and Recent activity.
- `--warning-fill` (`#facc15` dark, `#eab308` light) is the bright yellow for bars and stripes; `--warning` stays the
  text colour.

### Table
- Header `bg-raised`, 12 px uppercase with an icon per column; rows hover `bg-raised`.
- First column: bold link to detail, or name + 12 px secondary sub-line (Users). MAC and serial in mono `<code>`.
- Filters live in the column headers (antd filter dropdowns), not in a bar above.
- Devices: an offline row drops to `text-secondary`. The Status column is a small outlined button with the word
  (Online: green text and border on `success-bg` with a solid dot; Offline: grey text, `border-control` border, no fill, a hollow ring. They differ in shape, not only hue. Offline is grey because a switched-off machine is not an error); clicking pings the agent, and it spins while waiting. The last column is three icon
  links (terminal, desktop, files), `aria-disabled` with a tooltip when the device is offline.
- Users: an account that can't sign in drops to `text-secondary` (no opacity).
- Pagination: page size 10, range text `1–10 / 12`, hidden on a single page.

### Certificate expiry (`src/components/CertExpiry.tsx`)
The date in `dd Mon yyyy`, coloured by `certTone` (`src/utils/devices.ts`): red within 7 days, amber within 30, plain
otherwise or when revoked. No "N days left" text in the cell; the count is in the tooltip and `aria-label`.
Used on Device detail. On the Dashboard, certificates join the Needs attention queue (critical within 7 days, a
warning within 30).

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

### Remote Files: two devices
- "Add a second device" (default button beside the picker) opens a second pane; the URL keeps it in `?with=`.
  Each pane has its own device picker and path; the second pane has a close button.
- Files (not folders) get checkboxes. Ticking on one side clears the other, so only one arrow is primary.
- Two compact arrow buttons sit between the panes (→ and ←, with the ticked count). They carry no words, so the tooltip
  and `aria-label` say what a click does ("Copy 2 files to SRV-BAK-01"). Below 1200 px the panes stack and the arrows
  turn to point down and up.
- Drag and drop: a file row can be dragged to the other pane (a ticked row carries the whole ticked group). While dragging,
  the target pane shows a dashed `accent` frame with "Drop to copy N files to HOST · path"; dropping runs the same copy as
  the arrow. The arrows stay for keyboard, screen-reader and touch users.
- A name that already exists on the target never gets overwritten silently: a warning row in Transfers says which copy
  is newer, and offers Replace (primary) / Keep both / Skip, with "Apply to all" and "Cancel copy".
- "Compare folders" (pressed state: accent border and text) adds a Compared column to both panes: Newer here (warning),
  Only here (info), Older here / Same / Different size (neutral), and hides the per-row actions so the panes fit.
  The arrows then sync: they copy newer and missing files one way and delete nothing (said in their tooltip).
- Transfers card: one group per copy ("Copying 2 files to HOST" + target path, Cancel while running), one row per file
  with a progress bar (success green) and its state. The target folder reloads when a copy finishes.

### Device groups (`src/components/DeviceGroups.tsx`, `pages/devices/GroupsDrawer.tsx`)
- A device belongs to any number of groups (`device.groups`, a list of group ids; names come from `/groups`).
- Shown as info-coloured tags that wrap, then a 24 px edit button. With no group, a dashed "+ Add to group" button
  takes their place and opens the same picker.
- The picker is a popover with a multi-select; each change saves at once (no Save button). Used on the Devices table
  and the Device detail header.
- "Manage groups" (default button beside Enroll agent) opens a drawer: add a group (name required, at most 40
  characters, unique ignoring case), a table of groups with their device count, rename in place (Enter saves, Esc
  cancels) and delete with a confirm that says how many devices leave the group. Devices are never deleted with it.
- The Groups column header filters the table by one group (`?group=` in the URL).

### Users table and user page (`pages/users/UsersPage.tsx`, `UserPage.tsx`, `Access.tsx`)
- The table only shows; nothing is edited on a row. Groups (info tags) and Devices (neutral tags) show at most
  three then "+N" (the rest in a tooltip), "—" when empty; the Admin reads "All groups" / "All devices". Status is a
  tag: Active (success) or Disabled (neutral).
- The name links to the person's page, `/users/:id`; Actions holds one 28 px Edit button that opens the same page.
  The breadcrumb reads Users & Access / <name>.
- The user page, like device detail: back button, name, role tag and status tag in the title row, Delete user (danger,
  with a confirm) on the right. Then an Account card (email, role, last sign-in, devices reached, and the "Can sign
  in" switch), a "What they can reach" card with the access picker, and Discard changes / Save changes under them.
  Nothing saves until Save changes. Last, a "Devices they reach (N)" table from what is saved: device (links to its
  page), status, groups, and whether it is reached through a group or as a single device.
- The Admin's page and your own can't be turned off or deleted: the switch is disabled and the header explains why
  instead of offering Delete. The Admin's page has no Save row: they reach every device.
- Inviting is an 880 px dialog: email, the access picker, then Cancel and Send invitation in the footer.
- The access picker is a Segmented switch, Groups (n) | Single devices (n), over an antd `Transfer`: Available and
  Chosen lists 420 px tall, each with search and a select-all checkbox, moved with two 32 px arrow buttons (like
  Django's two-list picker). No drag and drop: on a phone it fights the scroll. Below 576 px the lists stack, 320 px
  each, and the arrows turn to point down and up.

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
  lattice, orange hubs (`--bm-lime`: `#fb923c` dark, `#ea580c` light), OS tiles with status dots, and packets travelling along routes to the panel (SMIL, hidden under
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

**Roles**: Admin (exactly one) · Operator (everyone invited).

**Sider groups**
- Overview: Dashboard, Devices
- Remote: Remote Terminal, Remote Desktop, Remote Files, Remote Service
- Admin: Users & Access

| Screen | Route | What is on it |
|---|---|---|
| Sign in | `/login` | Sign-in card, password reset, demo entry |
| Dashboard | `/dashboard` | Time range; health strip (fleet health bar, needs attention now, certificates within 30 days, latency); Needs attention queue grouped Critical / Warning / Offline; Average resources; Recent activity |
| Devices | `/devices` | Table with header filters (incl. Groups), group tags with an edit picker, ping status, row remote actions; Manage groups drawer; Enroll agent drawer |
| Device detail | `/devices/:id` | Back, name, alias, status, group tags with the edit picker; Terminal (primary), Desktop, Files, Service, "⋯" (Update agent, Disable); tabs Overview (device information, connection card, alert thresholds) and Connection |
| Remote Terminal | `/remote-terminal?host=` | Device picker, shell, xterm.js |
| Remote Desktop | `/remote-desktop?host=` | Device picker, frame (no stream yet) |
| Remote Files | `/remote-files?host=` (`&with=` for a second device) | One device: picker, file table, upload. Two devices: two panes, copy and sync between them, Transfers |
| Remote Service | `/remote-services?host=` | Device picker, web apps through the proxy |
| Users & Access | `/users` | Role cards (Admin, Operator); a read-only people table (name, email, role, Groups, Devices, Status, last sign-in) with one action, Edit, which opens the user page (`/users/:id`: account, sign-in switch, access picker, devices they reach, delete); Invite dialog (email, what they can reach; joins as Operator) |

---

## 9. Backend contract

EdgePanel wraps responses as `{ "data": ... }` on success and `{ "error": ... }` on failure. The app calls these today
(all under `VITE_API_URL`, default `/api`): `/log-in`, `/log-out`, `/forgot-password` (placeholder name), `/devices`
and `/devices/{host}` with `/connections`, `/revoke`, `/shell`, `/files`, `/desktop`, `/services`, `/enrollments`,
`/enrollment-tokens`, `/groups` (GET, POST, PATCH and DELETE `/groups/{id}`), `PUT /devices/{host}/groups`, `/certificates`, `/metrics/summary`, `/sessions/summary`, `/jobs`, `/audit`, `/users`,
`/settings`, `/health`, `/file-transfers` (placeholder name; POST to start, GET to poll, DELETE to cancel). EdgePanel serves only `/log-in` and `/log-out` so far; README has the full table.

Realtime is planned over WebSocket (`/ws/events`, `/ws/terminal/{id}`, `/ws/desktop/{id}`); internal web apps go
through EdgePanel's reverse proxy at `/web/{agent}/{app}/*`.

---

## 10. Frontend stack

Vite + React 19 + TypeScript · Ant Design 6 · React Router · axios + TanStack Query · xterm.js · vite-plugin-pwa ·
Vitest · oxlint.

Data flow: page → `services/queries.ts` (query keys) → `services/*Service.ts` (axios) → EdgePanel.
Demo mode (`services/demo.ts`) swaps the axios adapter for one that answers every endpoint from `demoData.ts`, so
no screen has a demo-only branch.

PWA: installable (manifest in `vite.config.ts`). Any number of tabs or windows may be open at once.

---

## 11. Open points

1. Architecture artboard says "BoxAgent (Go)"; the repo's BoxAgent is C# / .NET.
2. Charts (a Metrics tab) are named in the canvas but not drawn or built; series colours are still to define.
3. No translation layer yet (PRODUCT.md, Language).
4. The canvas's selected menu item is a solid lime block; the app keeps a raised row with an accent icon.
5. The canvas's Operations group (Command & Jobs, Audit), Security & Certificates and System Settings were removed
   in November 2026; their services and demo routes remain in `src/services`.
