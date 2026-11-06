# cwtext: notes for developers and coding assistants

"Selected Texts of C.G. Jung": a reading site for paragraphs from Jung's Collected Works, live at https://cwtext.github.io/home/. `README.md` explains each feature and how it is set up in Supabase; read it first.

## How it fits together

- **Website**: React 19 + TypeScript, built with Vite, styled with Tailwind 4 and shadcn/ui components. It runs entirely in the browser and is served by GitHub Pages under the base path `/home/`.
- **Database and sign-in**: Supabase (project "CGJ"). The browser talks to it directly with the publishable key in `src/lib/supabase.ts`. Who may read or write what is decided by row-level security in `supabase/*.sql`, not by the key.
- **Ask**: the Supabase Edge Function `supabase/functions/ask/index.ts` (Deno). It holds the Anthropic API key as a Supabase secret.
- **GitHub Actions**: `deploy.yml` runs `npm test` and publishes on every push to `main`. `backup-notes.yml` runs `scripts/backup-notes.mjs` nightly, saving notes and works to `public/notes.json` and `public/works.json`; the site falls back to those files if the database is unreachable.

## Where things are

- `src/AppRouter.tsx`: the pages. Add routes above the catch-all `*` route.
- `src/pages/`: one file per page. `Index.tsx` is the main reading page.
- `src/components/notes/`: reading-page pieces (pickers, note cards, margin notes, Ask, the curator's edit form and Import panel).
- `src/components/auth/AccountMenu.tsx`: sign in and the Account dialog.
- `src/components/ui/`: shadcn/ui building blocks. Only the ones in use are kept; add more with the shadcn CLI (`components.json`) when needed.
- `src/hooks/`: loading and saving data with TanStack Query.
- `src/lib/`: logic with no UI: Supabase access, Word/PDF import parsing, highlighting, margin-note anchoring.
- `supabase/`: SQL files, pasted by hand into the Supabase SQL editor. `schema.sql` comes first, and `works.sql` before `note-works.sql`. Changes to the live database must also be written back here.

## Working on it

- Node.js 22. `npm ci`, then `npm run dev` for a local copy.
- A local copy uses the live database unless `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` point elsewhere (see `.env.example`). Use a separate Supabase project for anything that writes.
- `npm test` runs the type check, ESLint, Vitest and a build. It must pass before merging; the deploy runs it too.
- Tests live beside the code (`*.test.ts(x)`); `src/test/TestApp.tsx` wraps components with the app's providers.
- Never use the `any` type.
- Old Nostr links (`/naddr1…`) are redirected by `src/pages/LegacyNoteRedirect.tsx`, which is the only reason `nostr-tools` is still a dependency.
