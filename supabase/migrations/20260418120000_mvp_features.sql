-- MVP feature completion: notifications, XP/levels, and shopping categories.
-- Safe to run multiple times.

-- 1) Profile settings: expiry notifications threshold.
alter table public.profiles
  add column if not exists expiry_notify_days integer not null default 3;

-- 2) Shopping list categories (for shopping_items grouping).
alter table public.shopping_items
  add column if not exists category text;

create index if not exists idx_shopping_items_category
  on public.shopping_items(category);

-- 3) Notifications dedupe key (prevents duplicates on re-render).
alter table public.notifications
  add column if not exists dedupe_key text;

create unique index if not exists idx_notifications_user_dedupe_key
  on public.notifications(user_id, dedupe_key)
  where dedupe_key is not null;

-- 4) RLS: allow inserting own notifications (in-app).
drop policy if exists "Notifications: insert own" on public.notifications;
create policy "Notifications: insert own"
on public.notifications
for insert
to authenticated
with check (user_id = auth.uid());

-- 5) RLS: allow parent to update profiles inside the same family
-- (needed to award XP/levels to children on task approval).
drop policy if exists "Profiles: parent update family" on public.profiles;
create policy "Profiles: parent update family"
on public.profiles
for update
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
  and (select role from public.profiles where id = auth.uid()) = 'parent'
)
with check (
  family_id = (select family_id from public.profiles where id = auth.uid())
);

