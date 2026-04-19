-- Release 1 support: shopping categories, notifications inserts, and parent ability
-- to update family members' XP/level after approving tasks.
-- Safe to run multiple times.

-- 1) Shopping list item category (for US-L1 categories).
alter table public.shopping_items
  add column if not exists category text;

create index if not exists idx_shopping_items_category
  on public.shopping_items(category);

-- 2) Profiles: allow parent to update XP/level for members in the same family.
drop policy if exists "Profiles: update family by parent" on public.profiles;
create policy "Profiles: update family by parent"
on public.profiles
for update
to authenticated
using (
  (select role from public.profiles where id = auth.uid()) = 'parent'
  and family_id = (select family_id from public.profiles where id = auth.uid())
)
with check (
  family_id = (select family_id from public.profiles where id = auth.uid())
);

-- 3) Notifications: allow parent to create notifications for own family members.
drop policy if exists "Notifications: insert parent for family" on public.notifications;
create policy "Notifications: insert parent for family"
on public.notifications
for insert
to authenticated
with check (
  (select role from public.profiles where id = auth.uid()) = 'parent'
  and exists (
    select 1
    from public.profiles child
    where child.id = public.notifications.user_id
      and child.family_id = (select family_id from public.profiles where id = auth.uid())
  )
);

