# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router routes and UI (`auth/`, `dashboard/`, `onboarding/`), plus `layout.tsx`, `page.tsx`, and global styles in `globals.css`.
- `lib/`: Shared code. Supabase helpers live in `lib/supabase/` and environment validation in `lib/env.ts`.
- `public/`: Static assets served as-is.
- `supabase/`: Supabase CLI config (`config.toml`) and SQL migrations in `supabase/migrations/`.

## Build, Test, and Development Commands

- `npm install`: Install dependencies.
- `npm run dev`: Start the Next.js dev server on `http://localhost:3000`.
- `npm run lint`: Run ESLint (`next/core-web-vitals` + TypeScript rules).
- `npm run build`: Create a production build.
- `npm run start`: Run the production server from the build output.

If you use the Supabase CLI locally (optional), common flows are `supabase start` and `supabase db reset` to apply migrations to a local stack.

## Coding Style & Naming Conventions

- TypeScript is `strict`; prefer the `@/` path alias (points to the repo root).
- Keep diffs consistent with existing files (2-space JSON, typical TS/TSX formatting). No Prettier config is present, so avoid drive-by reformatting.
- Routes/folders: lowercase. Components: `PascalCase.tsx`. Hooks: `useThing.ts`.
- Tailwind-first styling; keep app-wide CSS in `app/globals.css` and avoid introducing new global selectors unless necessary.

## Testing Guidelines

No automated test runner is configured yet. For changes, do a quick manual smoke check: sign-in/sign-out, onboarding flow, and main dashboard navigation. If you add a test framework, document the chosen commands in `README.md`.

## Commit & Pull Request Guidelines

- Commit messages are short and descriptive; a lightweight `type: summary` style is used in history (for example, `add: supabase`).
- PRs should include: a brief description, screenshots for UI changes, and explicit notes for any DB/auth/storage changes.
- Never commit secrets. `.env.local` is local-only; `SUPABASE_SERVICE_ROLE_KEY` must remain server-side only.

## Supabase Migration Notes

- Treat `supabase/migrations/*.sql` as the source of truth for schema changes.
- Add a new migration file for changes; avoid editing an old migration after it has been applied to a shared/remote database.
