# HomeHelper MVP

Next.js 14 + TypeScript + Tailwind CSS 3 + Supabase starter for the HomeHelper RPG family manager.

## 1) Project setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 2) Supabase setup

1. Create a Supabase project.
2. Run SQL migration from `supabase/migrations/0001_init_homehelper.sql`.
3. Create storage bucket: `task-proofs`.
4. Configure auth providers (email/password + magic link).

## 3) Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
