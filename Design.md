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
| Success | `#12261a` / `#2e5a3a` / `#7fd88f` | `#e6f4ea` / `#a8d5b5` / `#1f7a3a` | Online, exit 0, running process, Active token (`tone.positive`) |
| Warning | `#2a2410` / `#5c5020` / `#facc15` | `#fefce8` / `#fde68a` / `#854d0e` | Disk almost full, outdated agent |
| Error | `#2a1418` / `#5c2430` / `#ff6b81` | `#fff1f2` / `#fecdd3` / `#be123c` | High CPU/RAM, exit 1, a blocked command |
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
  240 px search (hidden under 576 px), the language select (128 px: a 20 × 14 flag from `src/assets/flags` + English / 日本語; switching reloads the page),
  the theme toggle and the account button (28 px orange avatar + name; the menu holds
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

One primary per screen area. A row of the same destructive action (e.g. "Revoke" on every token) uses the
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
  above 0, with how many are over the CPU or RAM threshold); Average latency (reconnects in 24 h); Agents (how many
  run an outdated agent, with a bar and legend of the fleet by OS: Windows `--series-1`, Linux `--series-2`, macOS
  `text-disabled`).
- **Alert** queue (full width): one table grouped Critical → Warning → Offline by `triage()` in
  `utils/devices.ts` (any red issue is critical: CPU or RAM over threshold; a full disk and an outdated agent are
  warnings). Certificates are not tracked. Each group opens with a header row; each device has a 4 px severity stripe, all its issue tags
  (they wrap), values, last seen and an Action column with Open, which goes to the device's page (as does its name).
- **Health by group** (full width): one row per group from `groupHealth()` in `utils/devices.ts`, groups in trouble
  first: Group (links to `/devices?group=`), Online ("3 of 4"), a 140 px health bar, issue tags (critical, warning,
  offline, or Healthy), Worst device with its first issue, and View devices. Pages at 10.
- **Top usage** and **Disk filling up** side by side (stacked below 992 px), one row per device: name, a bar, the
  value. Top usage ranks the five online devices by CPU, RAM or Disk (a small Segmented); over the alert threshold
  the bar and value turn `error` and gain a warning icon. Disk filling up shows `/disk-forecast` (used %, % a day,
  "~N days" to full; 14 days or fewer is `error` with the icon) and has its own loading, error and empty states. On
  phones the bar moves under the name.
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

### Tag
12 px, radius 10, outlined, colours from the semantic sets. "+ Tag" is a dashed default-size tag button.

### Charts (`pages/device-detail/UsageChart.tsx`)
Hand-drawn SVG lines, 88 px tall, 2 px stroke, a 12 % area under a single series. Series colours `--series-1`
(orange, dark `#e0702a`, light `#c2410c`) and `--series-2` (blue, dark `#3987e5`, light `#2a78d6`), checked with the
dataviz validator in both themes. Grid `border`; alert line dashed `text-secondary`; a mid-scale label and five time
marks under each chart. Hover or tap shows a crosshair, an 8 px dot per series and a tooltip with the time and values.

### Tabs
Underline tabs: active = `accent` text + 2 px underline. Used on Device detail (Processes · Performance), sitting on the card's top edge.

### Alert
Radius 16, padding `8px 12px`, warning or error set, 16 px icon, message with links.

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

### Device groups (`src/components/DeviceGroups.tsx`, `pages/groups/GroupsPage.tsx`)
- A device belongs to any number of groups (`device.groups`, a list of group ids; names come from `/groups`).
- Shown as info-coloured tags that wrap, then a 24 px edit button. With no group, a dashed "+ Add to group" button
  takes their place and opens the same picker.
- The picker is a popover with a multi-select; each change saves at once (no Save button). Used on the Devices table
  and the Device detail page (Groups row).
- Groups page (`/groups`, also "Manage groups" on Devices): a table like Devices, with search (group or device name),
  Group (links to Devices filtered by it; renamed in place, Enter saves, Esc cancels), Devices (count), Members (up
  to three device tags, then "+N" with the rest in a tooltip), Add (an "Add devices" button) and Actions (rename,
  delete with a confirm that says how many devices leave; devices are never deleted with it).
- "Add devices" opens an 880 px dialog with the two-list picker (Other devices / In <group>), "N to add · M to remove"
  and Save changes. Saving PUTs `/devices/{host}/groups` for each device that joins or leaves; a failed device is
  named and the rest still save. New group (name required, at most 40 characters, unique ignoring case) opens the
  same dialog right after.
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

### Command rules (`pages/commands/CommandsPage.tsx`, `utils/commands.ts`)
- Rules for commands nobody can run in Remote Terminal, the Admin included. A rule has a command, a match (Starts
  with: whole words, so "format" doesn't catch "Format-Table"; Contains: anywhere, catching chained commands; Regex:
  not case-sensitive), shells (none picked = all shells), where it applies (a Segmented: All devices, Groups or Devices, then a multi-select for the last two; one at a time, and the other list is dropped on save), and a reason. There is no on/off: every listed rule blocks, and deleting it allows the command again. Case and runs of spaces are
  ignored.
- "Test a command" card on top: a device picker (`DevicePicker`), a shell Segmented and a monospace input; below it an error tag "Blocked" with the rule
  and reason, or a success tag "Allowed". It runs the same `blockedBy()` the demo uses.
- The table only shows (command, match, shells, Applies to: "All devices" muted, or group tags in info colour, or device tags in neutral, then reason). Actions: Edit opens the 640 px rule dialog; Delete asks first. The dialog checks regexes compile and
  that the same command and match aren't already a rule.
- The terminal prints a refused command's reason in red: EdgePanel answers 403 with `{ error }`, and the terminal shows
  that text instead of the generic permission message.

### Drawer
Forms open in a drawer from the right (Enroll agent, New job, Create token, Invite person). An issued secret stays on
screen in the drawer with a "Copy" button until the drawer closes.

### Channel icons (`src/components/ChannelIcon.tsx`, `src/assets/channels/*.svg`)
Telegram, Discord and Email marks in their own colours, 16 px (12 px inside a tag). They sit beside the written type;
where only the channel name is written (Alerts' Send to tags) the icon carries the type as its alt text. Replace the
three SVG files to change the marks; no code changes.

### Dialogs with sections (Alerts, Rules, Channels, Command rules)
- 680 px modal, no antd footer: the form ends in its own row with Cancel / the primary on the right. Enter submits.
- A name field on top, then bordered sections (radius 16, padding 16, `border`): a 14/600 heading, a 13 px
  `text-secondary` hint under it, then the fields. The rule's Condition hint is a live sentence ("Sends a message when
  Disk stays above 85% for 5 min").
- One-of-few choices are choice cards (antd Radio, `.choice-card`): icon + 600 title + 12 px hint, `border` →
  `accent` border and `bg-raised` when chosen, the radio dot kept so the choice isn't colour alone. Grid
  `auto-fit, minmax(132px, 1fr)`. Pick-many lists (the rule's channels) are the same cards with checkboxes, one per row,
  with the destination in mono under the name.
- Number fields carry their unit as a suffix (%, min). Rare settings fold behind a summary line with a Change link
  (the SMTP server, defaulting to smtp.gmail.com:587; it opens by itself when it fails validation).
- Below 576 px, field pairs stack.

### Code block and terminal
Code block: bg `#090b0c` dark / `#101416` light, Geist Mono, radius 12. Terminal: xterm.js on the same background.

### Date formats
`dd Mon yyyy` (e.g. `06 Dec 2026`) and `dd Mon yyyy, HH:mm`, always two-digit days, so a column lines up.
Relative times ("4 min ago") for last seen and activity.

### Not-yet-available actions
Actions EdgePanel has no endpoint for (edit tags, end a process, upload, download,
rename or delete a file, desktop screenshot and Ctrl+Alt+Del) stay visible and toast "<Doing something> isn't available yet." They never fake success.

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
- Overview: Dashboard
- Device: Devices, Groups
- Remote: Remote Terminal, Remote Desktop, Remote Files, Remote Service
- Alert: Alerts, Rules, Channels
- Admin: Users & Access, Command rules, Enrollment tokens

| Screen | Route | What is on it |
|---|---|---|
| Sign in | `/login` | Sign-in card, password reset, demo entry |
| Dashboard | `/dashboard` | Health strip (fleet health bar, needs attention now, latency, agents by OS); Alert queue grouped Critical / Warning / Offline; Health by group; Top usage and Disk filling up |
| Devices | `/devices` | Table with header filters (incl. Groups), group tags with an edit picker, ping status, row remote actions; Manage groups (links to Groups); Enroll agent drawer |
| Groups | `/groups` | Table: group, devices, members, Add devices (two-list dialog), rename / delete; New group |
| Device detail | `/devices/:id` | Back, name, alias, the same Online / Offline status button as the Devices table (click to ping, offline included); Terminal (primary), Desktop, Files, Service. A "Device information" card (hostname, OS, IP, MAC, agent version shown as in the Devices table by `AgentVersion`, uptime, enrolled at, Groups with the edit picker). Below it one card with two tabs, like Task Manager (`?tab=performance` keeps the second): **Processes (N)** (default; search, Name, PID, Status, User, CPU sorted high first, Memory, End task not supported yet; polls every 5 s only while open; a note while offline) and **Performance** (1h / 24h / 7d switch; CPU, RAM and Disk over time, 0–100 %, dashed alert line, hardware beside each name; Network with Received `--series-1` filled and Sent `--series-2`, Mbps on its own scale; y labels in a 56 px gutter, time marks on round local times, crosshair tooltip) |
| Remote Terminal | `/remote-terminal?host=` | Device picker, shell, xterm.js |
| Remote Desktop | `/remote-desktop?host=` | Device picker, frame (no stream yet) |
| Remote Files | `/remote-files?host=` (`&with=` for a second device) | One device: picker, file table, upload (not available yet). Two devices: two panes, copy and sync between them, Transfers |
| Remote Service | `/remote-services?host=` | Device picker, web apps through the proxy |
| Alerts | `/alerts` | Table (alert, rules, applies to, send to with channel icons) with Edit and Delete; dialog sections: Rules (ticked cards), Devices (`ScopeFields`: all, groups or devices), Send to (channel cards), Message (template with insertable {device} {alias} {rule} {condition} {value} {groups} {time} and a live preview from a real device in scope). Add alert waits until a rule and a channel exist |
| Rules | `/alert-rules` | Table (rule, condition, used by which alerts) with Edit and Delete; dialog: name and a Condition section (CPU / RAM / Disk / Offline cards, limit %, for at least N min, live sentence) |
| Channels | `/alert-channels` | Table (channel, type with its brand icon, used by N alerts, Test with a Send test button, Actions with Edit and Delete); dialog: type (Telegram / Discord / Email, fixed once saved), name, then per type: bot token + chat ID; webhook URL; recipients, Gmail sender + app password, SMTP server and port (smtp.gmail.com:587). Secrets are write-only: on edit, an empty field keeps the saved one |
| Enrollment tokens | `/enrollment-tokens` | Create token (opens the Enroll new agent drawer); table: last four characters, Active / Expired, default group, expires, approval, used by (device links), Revoke with a confirm |
| Command rules | `/commands` | Test a command (shell + command, live Blocked / Allowed answer); read-only rules table (command, match, shells, applies to, reason) with Edit and Delete; Add rule / edit dialog |
| Users & Access | `/users` | Role cards (Admin, Operator); a read-only people table (name, email, role, Groups, Devices, Status, last sign-in) with one action, Edit, which opens the user page (`/users/:id`: account, sign-in switch, access picker, devices they reach, delete); Invite dialog (email, what they can reach; joins as Operator) |

---

## 9. Backend contract

EdgePanel wraps responses as `{ "data": ... }` on success and `{ "error": ... }` on failure. The app calls these today
(all under `VITE_API_URL`, default `/api`): `/log-in`, `/log-out`, `/forgot-password` (placeholder name), `/devices`
and `/devices/{host}` with `/revoke`, `/shell`, `/files`, `/desktop`, `/services`, `/enrollments`,
`/enrollment-tokens`, `/groups` (GET, POST, PATCH and DELETE `/groups/{id}`), `PUT /devices/{host}/groups`, `/devices/{host}/metrics?range=`, `/devices/{host}/processes`, `/sessions/summary`, `/disk-forecast`, `/users`, `/alerts`, `/alert-rules`, `/alert-channels`,
`/command-rules` (GET, POST, PATCH and DELETE `/command-rules/{id}`; placeholder name), `/file-transfers` (placeholder name; POST to start, GET to poll, DELETE to cancel). EdgePanel serves only `/log-in` and `/log-out` so far; README has the full table.

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
2. The canvas's Metrics tab became the Resource information card on Device detail (see Charts).
3. English and Japanese only (PRODUCT.md, Language). Japanese text falls back from Geist to Hiragino Sans, Yu Gothic UI
   or Meiryo, so it is set in the OS's Japanese face; dates read `2027/07/04` in Japanese.
4. The canvas's selected menu item is a solid lime block; the app keeps a raised row with an accent icon.
5. The canvas's Operations group (Command & Jobs, Audit), Security & Certificates and System Settings were removed
   in November 2026, along with their services, types and demo routes.
