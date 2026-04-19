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
2. Run SQL migrations:
   - `supabase/migrations/0001_init_homehelper.sql`
   - `supabase/migrations/0002_auth_rls.sql`
   - `supabase/migrations/0003_fix_owner_fk_and_rls.sql`
   - `supabase/migrations/0004_release1_fields_and_policies.sql`
3. Create storage bucket: `task-proofs`.
4. Configure auth providers (email/password + magic link).

## 3) Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## MVP screens (routes)

- `/auth`: sign in / sign up
- `/onboarding`: create or join family (invite code)
- `/dashboard`: home + task of the day + leaderboard
- `/tasks`: quest board (create tasks, submit proof, approve/reject)
- `/shop`: inventory + shopping list (add products/items, toggle purchased)
- `/stats`: achievements + monthly XP chart
- `/profile`: account + family invite code
- `/notifications`: in-app notifications (expiry + tasks)
