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
- The font is Inter, bundled through `@fontsource-variable/inter` (imported in `src/main.tsx`).

## Security notes

- Mail attachments are checked against an extension allow-list in
  `src/modules/mail/components/ComposeMail.tsx`. That check runs only in the
  browser, and the backend must enforce its own allow-list.
