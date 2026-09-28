# shop_admin_front

React 19 + Vite 7 + TypeScript admin panel (Tailwind v4, shadcn/ui, Redux Toolkit).

## Workflow

- The default branch is `master` (there is no `main`).
- Merge completed PRs into `master` once `npm run build` passes. The owner
  does not need to be asked first.

## Commands

- `npm run dev`: dev server. API calls go to `${VITE_API_BASE_URL}/api`.
- `npm run build`: runs `tsc -b`, then `vite build`. Both must pass before merging.
- `npm run lint`: ESLint. The codebase has existing warnings, so don't add new ones.

## TypeScript

- `noUnusedLocals` and `noUnusedParameters` are on. Unused imports or variables fail the build.
- Type libraries are explicit: `tsconfig.app.json` uses `vite/client`, and
  `tsconfig.node.json` (for `vite.config.ts`) uses `node`. Don't use Node
  globals such as `NodeJS.Timeout` in `src`; use `ReturnType<typeof setTimeout>`.

## Styling

- Colors, radii and shadows are CSS variables in `src/index.css` (`:root` and
  `.dark`). Use token classes (`bg-card`, `text-muted-foreground`,
  `border-border`, `bg-primary`, `text-success`/`warning`/`info`/`destructive`)
  instead of raw palette classes like `text-gray-500` or `bg-blue-500`.
- Keep motion short and subtle (fades or small slides, about 150–300 ms,
  ease-out). No springs, bounces or hover scaling.
- Exception: the public pages (login, forgot/reset password, verify email,
  403 and 404) are intentionally richer, at the owner's request. They all
  render inside `AuthShell` (`src/modules/auth/components/AuthShell.tsx`), a
  layout route, so the scene persists while moving between them. Build new
  public pages from `AuthKit.tsx` (card, fields, status, error code) rather
  than restyling from scratch. The shell has a full-screen Three.js
  neural-network sphere (`NeuralScene`), progressive frosted glass behind the
  form, a GSAP headline reveal and Aceternity-style effects
  (`src/components/aceternity/`). Three.js must stay lazy-loaded (desktop only,
  `NeuralScene` chunk), and every effect must respect `prefers-reduced-motion`.
  The glass drops its backdrop blur on mobile, on low-power devices, and when
  the measured frame rate falls below 40 fps. Keep that fallback. (A detailed
  brain was tried and rejected by the owner in favour of the sphere.)
- The dashboard (`src/modules/dashboard`) shows live data only, from one call
  to `GET /Dashboard/summary` (shop_back `DashboardController`). The browser's
  time zone is sent so activity days split at local midnight. The API returns
  null for sections the user can't read, and the page hides them. Don't put
  sample numbers back. Its hero reuses the login navy in
  both themes; charts are hand-rolled SVG in the `--primary` hue (no chart
  library). The hero shows at-a-glance chips (unread, actions today) and a
  Refresh button with "Updated …"; a refresh keeps the current numbers on
  screen, and only the newest reply is used. Stat tiles take an `aside`
  (`Ring` / `Sparkline` from `MiniCharts.tsx`, coloured by the tile tone).
  The activity chart has a 7/14-day toggle and total / average / busiest
  day. Recent activity is grouped by day and reads its icons, colours and
  verbs from User Logs' `logMeta.ts`.
- App chrome (`src/components/module/admin/layout`): the sidebar column and
  the header's brand block use the brand navy in both themes (`.app-sidebar`,
  scoped with `.dark`). The menu lives in `menu.ts` and feeds the sidebar, the
  collapsed icon rail (72px, flyouts for groups) and the Ctrl/⌘+K command
  palette. Add new pages to `menu.ts`, not to `Nav.tsx`. The collapsed state
  is kept in localStorage (`sidebar-collapsed`).
- `useTranslations().t` is memoized. Keep it stable: effects list `t` as a
  dependency, and a new function each render caused an infinite fetch loop
  on the docs pages.
- Keep `framer-motion` at 12.43 or later. 12.23 dropped every fade back to
  opacity 0 for one frame as it finished, so pages blinked once or twice
  after loading.
- Table pages use `useTable`. It treats a reply without a list as a failed
  load, and only the newest request updates the table. Show failures with
  `ErrorState` (message plus "Try again") from `components/custom/Table`.
- Dark mode splits blue in two: `--primary` is the fill (buttons, badges;
  white `--primary-foreground`) and `--primary-text` is blue text and icons.
  `text-primary` maps to `--primary-text` in dark mode automatically. Use
  `bg-primary text-primary-foreground` for filled buttons, never dark text on
  blue.
- Mobile: dialogs size themselves as `calc(100% - 2rem)`. Pass `sm:max-w-*`,
  not `max-w-*`, or the mobile margin is lost. Rows of header buttons must be
  allowed to wrap (`flex-wrap`), and side-by-side panels stack below `md`.
  Check new pages at 360px wide.
- The Mailbox is one card: a folder rail (chips on phones), a message list
  (`MailList` rows with sender, subject, preview and date) and `MailReader`.
  From 1280px wide the reader sits beside the list (split view, the folder
  rail shrinks to icons below 2xl; the "Split view" toggle is saved as
  `mail-split`). Narrower, the open message replaces the list, which stays
  mounted so its page and scroll survive. The reader updates list rows through
  `MailListHandle` (`patch`, `remove`) instead of reloading the list.
  Shortcuts: j / k for older / newer, Esc to close.
- Mail Templates is a card gallery (search plus All / Global / Personal
  filter, done in the browser). Each card previews the email; "Use" opens
  `ComposeMail` with its `template` prop. Turn HTML bodies into preview text
  with `htmlToText` (`mail/components/mailFormat.ts`).
- Backup (`src/modules/settings/backup`): a status panel (success ring,
  last/next backup, counts, storage used per location), then the backup list
  with schedules beside it from `xl`. Storage and status colours come from
  `backupMeta.ts` (tokens only). Filters apply as soon as they change; the
  grid/list choice is saved as `backup-view`. Give grids `grid-cols-1` below
  their breakpoint, or long names stretch the implicit column past the card.
- User Logs (`src/modules/settings/user-logs`) defaults to a day-grouped
  timeline (`LogTimeline`); the table is a toggle (`user-logs-view`) and stays
  in the DOM, hidden, so Print still finds `#printable-user-table`. Action
  icons, colours and verbs, quick filters and the before→after diff come from
  `logMeta.ts`, matching the action types shop_back writes. Changes are stored
  as `{"before": {...}, "after": {...changed fields}}`.
- Translations defaults to an editor view (`TranslationEditorList`): key and
  module, then English and Bangla side by side, each edited in place (Enter
  saves via `PUT /translations/{id}`, Esc cancels, a failed save keeps the
  text). Empty values show "Missing". Module chips set `filters.modules`. The
  table is a toggle (`translations-view`) and stays mounted for Print.
  `useTable` exposes `setData` so an inline edit patches its row without
  reloading.
- Roles defaults to cards (`RoleCards`): status, permission count and
  permissions grouped by module (`permissionMeta.ts` reads names as
  `<action>-<scope>-<module>`). The table is a toggle (`roles-view`) and
  stays mounted for Print. `useTable` already loads the first page on mount,
  so pages must not call `fetchData()` again from their own mount effect (the
  duplicate request re-armed the loader). Give the table all columns until the
  saved column choice arrives, so the header never renders empty.
- Users, Permissions and Options follow the same pattern: cards by default
  (`UserCards`, `PermissionCards`, `OptionCards`), built from the shared
  pieces in `components/custom/CardView.tsx` (`EntityCard`, `ListBar`,
  `CardsState`, `CardGridSkeleton`), with the choice stored per page by
  `useStoredView` (`users-view`, `permissions-view`, `options-view`). Users
  with the developer role can't be deleted or selected, in cards as in the
  table.
- App Settings (`src/modules/settings/app-settings`): a category list
  (chips on phones) and panels built from `SettingsLayout.tsx`
  (`SettingsSection`, `SettingRow`, `Toggle`) and `ImageDrop`. Theme shows a
  live mini preview, General previews the date/time/currency formats, and
  Branding previews the header, tab and footer. Edits collect in a sticky
  "unsaved changes" bar (Save / Discard). `SettingsContent` is keyed by
  category and the page asks before switching with unsaved edits, so one
  category's edits are never sent to another's endpoint. `useSettings`
  already shows the save/reset toasts; don't add a second one.
- Saved App Settings colours and dark mode apply app-wide through
  `UserThemeSync` (mounted in `AdminLayout`). `lib/themeColors.ts` turns the
  picked hex into `--primary` / `--primary-text` / `--ring` / sidebar and
  `.nav-active` overrides (and a quiet `--secondary` tint), in an injected
  `<style id="user-theme-colors">`. The hex only sets hue and chroma:
  lightness is searched until white button text measures at least 4.5:1, so
  any colour stays readable. The server defaults (#3B82F6 / #10B981) add no
  CSS, so the designed palette stays. `lib/userTheme.ts` caches the CSS and
  the dark default in localStorage (`theme-colors-css`, `theme-default`) for
  `index.html` to paint before the app loads; logout clears them. A header
  sun/moon choice (`theme`) wins over the saved default; saving dark mode in
  App Settings sets that choice.
- The same sync applies the sidebar background image and the person's custom
  CSS (`lib/userCss.ts`, cached with the colours for first paint). Custom CSS
  is sanitized: no `@import`, and `url()` only for data images, this site or
  the API asset host. Theme images are paths from shop_back (`/uploads/...`
  locally, absolute URLs on remote storage); resolve them with
  `lib/assetUrl.ts`. The sign-in background is cached as `theme-login-bg`,
  which logout deliberately keeps, since the sign-in page is only seen
  signed out; AuthShell draws it under the scene with a navy overlay.
  Removing an image sends `remove_sidebar_bg` / `remove_login_bg`.
- Profile (`settings/users/components/ProfileEdit.tsx`): a sticky profile card
  (photo with a camera button, roles, completeness meter), QR, access grouped
  by module and a change-password link on the left, and the form in section
  cards on the right. A sticky Save/Discard bar appears when the form or the
  photo changed; Discard restores the last loaded or saved values. Reusing
  `.dash-hero`? Give it `relative`: its `::after` overlay is absolutely
  positioned.
- Change Password (`settings/users/components/ChangePassword.tsx`): a step
  indicator (enter → confirm by email → changed), a strength meter and a live
  rule checklist read from `PASSWORD_RULES` (keep it matching the zod schema),
  and a guidance column. The change only happens through the emailed link;
  `VerifyPasswordChange` sends each token once (a ref guard, since a second
  call would report a used link as invalid) and counts down to sign in.
- `components/custom/Modal` renders through a portal into `<body>`. Inside
  `<main>` it shared main's stacking context and the sidebar covered it. It
  closes on Esc and on a backdrop click.
- Theme before first paint: `index.html` applies the saved theme class,
  `color-scheme` and page background in an inline script, so reloading in
  dark mode doesn't flash white. `themeSlice` (`applyTheme`) keeps them in
  sync afterwards; keep the colors there matching `--background`.
- Docs pages (`src/modules/documentation`) never blank what's on screen.
  First load shows skeletons, and switching pages keeps the old one (dimmed,
  with a top loading bar) until the next is ready. Mermaid is imported
  lazily and diagrams are cached (`mermaid.ts`). Pages call
  `prepareDiagrams` before showing content, so diagrams don't pop in and
  push the text down. Loaders read `t` and the theme through refs, so a
  translation update doesn't refetch.
- The font is Inter, bundled through `@fontsource-variable/inter` (imported in `src/main.tsx`).
  Bangla falls back to Noto Sans Bengali (`@fontsource-variable/noto-sans-bengali`,
  second in `--font-sans`). It is split by unicode-range, so browsers download
  it only when Bengali characters are on the page.

## Security notes

- Mail attachments are checked against an extension allow-list in
  `src/modules/mail/components/ComposeMail.tsx`. The API (`shop_back`) enforces
  the same list in `FileValidationPresets.MailAttachment`. Keep the two lists in sync.
