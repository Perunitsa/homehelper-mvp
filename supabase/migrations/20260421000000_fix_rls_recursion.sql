-- Fix infinite recursion in RLS policies by using security definer functions.
-- This is a common issue in Supabase when a policy on a table queries the same table.

-- 1) Create helper functions to get current user's profile data without triggering recursion.
create or replace function public.get_my_family_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 2) Update Profiles policies.
drop policy if exists "Profiles: select family" on public.profiles;
create policy "Profiles: select family"
on public.profiles
for select
to authenticated
using (
  id = auth.uid() or family_id = public.get_my_family_id()
);

drop policy if exists "Profiles: parent update family" on public.profiles;
drop policy if exists "Profiles: update family by parent" on public.profiles;
create policy "Profiles: parent update family"
on public.profiles
for update
to authenticated
using (
  family_id = public.get_my_family_id()
  and public.get_my_role() = 'parent'
)
with check (
  family_id = public.get_my_family_id()
);

-- 3) Update Families policies.
drop policy if exists "Families: view own family" on public.families;
create policy "Families: view own family"
on public.families
for select
to authenticated
using (
  id = public.get_my_family_id()
);

drop policy if exists "Families: view owned families" on public.families;
create policy "Families: view owned families"
on public.families
for select
to authenticated
using (
  owner_id = auth.uid()
);

-- 4) Update Products policies.
drop policy if exists "Products: select family" on public.products;
create policy "Products: select family"
on public.products
for select
to authenticated
using (
  family_id = public.get_my_family_id()
);

drop policy if exists "Products: insert family" on public.products;
drop policy if exists "Products: insert parent family" on public.products;
create policy "Products: insert parent family"
on public.products
for insert
to authenticated
with check (
  family_id = public.get_my_family_id()
  and public.get_my_role() = 'parent'
);

drop policy if exists "Products: update family" on public.products;
drop policy if exists "Products: update parent family" on public.products;
create policy "Products: update parent family"
on public.products
for update
to authenticated
using (
  family_id = public.get_my_family_id()
  and public.get_my_role() = 'parent'
)
with check (
  family_id = public.get_my_family_id()
);

drop policy if exists "Products: delete family" on public.products;
drop policy if exists "Products: delete parent family" on public.products;
create policy "Products: delete parent family"
on public.products
for delete
to authenticated
using (
  family_id = public.get_my_family_id()
  and public.get_my_role() = 'parent'
);

-- 5) Update Tasks policies.
drop policy if exists "Tasks: select family" on public.tasks;
create policy "Tasks: select family"
on public.tasks
for select
to authenticated
using (
  family_id = public.get_my_family_id()
);

drop policy if exists "Tasks: insert parent" on public.tasks;
create policy "Tasks: insert parent"
on public.tasks
for insert
to authenticated
with check (
  family_id = public.get_my_family_id()
  and public.get_my_role() = 'parent'
);

drop policy if exists "Tasks: update parent" on public.tasks;
create policy "Tasks: update parent"
on public.tasks
for update
to authenticated
using (
  family_id = public.get_my_family_id()
  and public.get_my_role() = 'parent'
)
with check (true);

drop policy if exists "Tasks: update child assigned" on public.tasks;
create policy "Tasks: update child assigned"
on public.tasks
for update
to authenticated
using (
  family_id = public.get_my_family_id()
  and assigned_to = auth.uid()
)
with check (
  assigned_to = auth.uid()
);

-- 6) Shopping Lists policies.
drop policy if exists "ShoppingLists: select family" on public.shopping_lists;
create policy "ShoppingLists: select family"
on public.shopping_lists
for select
to authenticated
using (
  family_id = public.get_my_family_id()
);

drop policy if exists "ShoppingLists: insert parent" on public.shopping_lists;
create policy "ShoppingLists: insert parent"
on public.shopping_lists
for insert
to authenticated
with check (
  family_id = public.get_my_family_id()
  and public.get_my_role() = 'parent'
);

drop policy if exists "ShoppingLists: update parent" on public.shopping_lists;
create policy "ShoppingLists: update parent"
on public.shopping_lists
for update
to authenticated
using (
  family_id = public.get_my_family_id()
  and public.get_my_role() = 'parent'
)
with check (
  family_id = public.get_my_family_id()
);

drop policy if exists "ShoppingLists: delete parent" on public.shopping_lists;
create policy "ShoppingLists: delete parent"
on public.shopping_lists
for delete
to authenticated
using (
  family_id = public.get_my_family_id()
  and public.get_my_role() = 'parent'
);

-- 7) Achievement Events policies.
drop policy if exists "AchievementEvents: select own family" on public.achievement_events;
create policy "AchievementEvents: select own family"
on public.achievement_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = public.achievement_events.user_id
      and p.family_id = public.get_my_family_id()
  )
);

drop policy if exists "AchievementEvents: insert parent family" on public.achievement_events;
create policy "AchievementEvents: insert parent family"
on public.achievement_events
for insert
to authenticated
with check (
  public.get_my_role() = 'parent'
  and exists (
    select 1
    from public.profiles p
    where p.id = public.achievement_events.user_id
      and p.family_id = public.get_my_family_id()
  )
);
