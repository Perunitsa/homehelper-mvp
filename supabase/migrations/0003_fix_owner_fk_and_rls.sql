-- Fix families.owner_id foreign key + add missing RLS policies for MVP screens.
-- Safe to run multiple times.

-- 1) Fix FK: families.owner_id should reference auth.users (profiles may not exist yet).
alter table public.families
  drop constraint if exists families_owner_id_fkey;

alter table public.families
  add constraint families_owner_id_fkey
  foreign key (owner_id) references auth.users(id) on delete set null;

-- 2) Profiles: allow reading family members for leaderboard/assignment.
drop policy if exists "Profiles: select family" on public.profiles;
create policy "Profiles: select family"
on public.profiles
for select
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
);

-- 3) Products: CRUD in scope of family.
drop policy if exists "Products: select family" on public.products;
create policy "Products: select family"
on public.products
for select
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
);

drop policy if exists "Products: insert family" on public.products;
create policy "Products: insert family"
on public.products
for insert
to authenticated
with check (
  family_id = (select family_id from public.profiles where id = auth.uid())
);

drop policy if exists "Products: update family" on public.products;
create policy "Products: update family"
on public.products
for update
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
)
with check (
  family_id = (select family_id from public.profiles where id = auth.uid())
);

drop policy if exists "Products: delete family" on public.products;
create policy "Products: delete family"
on public.products
for delete
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
);

-- 4) Shopping lists/items.
drop policy if exists "ShoppingLists: select family" on public.shopping_lists;
create policy "ShoppingLists: select family"
on public.shopping_lists
for select
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
);

drop policy if exists "ShoppingLists: insert parent" on public.shopping_lists;
create policy "ShoppingLists: insert parent"
on public.shopping_lists
for insert
to authenticated
with check (
  family_id = (select family_id from public.profiles where id = auth.uid())
  and (select role from public.profiles where id = auth.uid()) = 'parent'
);

drop policy if exists "ShoppingLists: update parent" on public.shopping_lists;
create policy "ShoppingLists: update parent"
on public.shopping_lists
for update
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
  and (select role from public.profiles where id = auth.uid()) = 'parent'
)
with check (
  family_id = (select family_id from public.profiles where id = auth.uid())
);

drop policy if exists "ShoppingLists: delete parent" on public.shopping_lists;
create policy "ShoppingLists: delete parent"
on public.shopping_lists
for delete
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
  and (select role from public.profiles where id = auth.uid()) = 'parent'
);

drop policy if exists "ShoppingItems: select via family list" on public.shopping_items;
create policy "ShoppingItems: select via family list"
on public.shopping_items
for select
to authenticated
using (
  exists (
    select 1
    from public.shopping_lists l
    join public.profiles p on p.id = auth.uid()
    where l.id = public.shopping_items.list_id
      and l.family_id = p.family_id
  )
);

drop policy if exists "ShoppingItems: insert via family list" on public.shopping_items;
create policy "ShoppingItems: insert via family list"
on public.shopping_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.shopping_lists l
    join public.profiles p on p.id = auth.uid()
    where l.id = public.shopping_items.list_id
      and l.family_id = p.family_id
  )
);

drop policy if exists "ShoppingItems: update via family list" on public.shopping_items;
create policy "ShoppingItems: update via family list"
on public.shopping_items
for update
to authenticated
using (
  exists (
    select 1
    from public.shopping_lists l
    join public.profiles p on p.id = auth.uid()
    where l.id = public.shopping_items.list_id
      and l.family_id = p.family_id
  )
)
with check (true);

drop policy if exists "ShoppingItems: delete via family list" on public.shopping_items;
create policy "ShoppingItems: delete via family list"
on public.shopping_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.shopping_lists l
    join public.profiles p on p.id = auth.uid()
    where l.id = public.shopping_items.list_id
      and l.family_id = p.family_id
  )
);

-- 5) Tasks: family isolation + parent/child updates.
drop policy if exists "Tasks: select family" on public.tasks;
create policy "Tasks: select family"
on public.tasks
for select
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
);

drop policy if exists "Tasks: insert parent" on public.tasks;
create policy "Tasks: insert parent"
on public.tasks
for insert
to authenticated
with check (
  family_id = (select family_id from public.profiles where id = auth.uid())
  and created_by = auth.uid()
  and (select role from public.profiles where id = auth.uid()) = 'parent'
);

drop policy if exists "Tasks: update parent" on public.tasks;
create policy "Tasks: update parent"
on public.tasks
for update
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
  and (select role from public.profiles where id = auth.uid()) = 'parent'
)
with check (true);

drop policy if exists "Tasks: update child assigned" on public.tasks;
create policy "Tasks: update child assigned"
on public.tasks
for update
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
  and assigned_to = auth.uid()
)
with check (
  assigned_to = auth.uid()
);

drop policy if exists "Tasks: delete parent" on public.tasks;
create policy "Tasks: delete parent"
on public.tasks
for delete
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
  and (select role from public.profiles where id = auth.uid()) = 'parent'
);

-- 6) Achievements and notifications.
drop policy if exists "Achievements: select all" on public.achievements;
create policy "Achievements: select all"
on public.achievements
for select
to authenticated
using (true);

drop policy if exists "UserAchievements: select own" on public.user_achievements;
create policy "UserAchievements: select own"
on public.user_achievements
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Notifications: select own" on public.notifications;
create policy "Notifications: select own"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Notifications: update own" on public.notifications;
create policy "Notifications: update own"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 7) Seed achievements (6 badges for Stats screen).
insert into public.achievements (title, description, icon, required_points, level)
select * from (values
  ('Мастер порядка', 'Выполнить 5 задач по уборке', 'broom', 50, 1),
  ('Квест-марафонец', 'Выполнить 10 задач подряд', 'footsteps', 100, 2),
  ('Помощник кухни', 'Выполнить 5 кухонных задач', 'chef-hat', 80, 2),
  ('Супер-командa', 'Семья набрала 500 XP', 'sparkles', 500, 3),
  ('Покупки без стресса', 'Закрыть 20 пунктов в списках', 'shopping-cart', 120, 2),
  ('Хранитель запасов', 'Добавить 15 продуктов в инвентарь', 'package', 150, 2)
) as v(title, description, icon, required_points, level)
where not exists (select 1 from public.achievements);

