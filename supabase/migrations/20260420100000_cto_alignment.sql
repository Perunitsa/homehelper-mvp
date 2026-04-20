-- CTO alignment migration for HomeHelper MVP.
-- Adds ERD compatibility fields, tightens RLS, enables realtime tables,
-- and configures storage bucket policies for task photo proofs.

-- 1) Profiles compatibility fields (ERD: age, points).
alter table public.profiles
  add column if not exists age integer check (age is null or age >= 0),
  add column if not exists points integer not null default 0;

update public.profiles
set points = coalesce(current_xp, 0)
where points is distinct from coalesce(current_xp, 0);

create or replace function public.sync_profile_points()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.current_xp := coalesce(new.current_xp, new.points, 0);
    new.points := coalesce(new.points, new.current_xp, 0);
    return new;
  end if;

  if new.points is distinct from old.points then
    new.current_xp := new.points;
  elsif new.current_xp is distinct from old.current_xp then
    new.points := new.current_xp;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_profile_points on public.profiles;
create trigger trg_sync_profile_points
before insert or update on public.profiles
for each row
execute function public.sync_profile_points();

-- 2) Products compatibility field (ERD: status).
alter table public.products
  add column if not exists status text;

alter table public.products
  drop constraint if exists products_status_check;

alter table public.products
  add constraint products_status_check
  check (status in ('fresh', 'expiring', 'expired'));

create or replace function public.compute_product_status(expiry_date date)
returns text
language sql
stable
as $$
  select case
    when expiry_date < current_date then 'expired'
    when expiry_date <= current_date + 3 then 'expiring'
    else 'fresh'
  end
$$;

update public.products
set status = public.compute_product_status(expiry_date)
where status is null
   or status is distinct from public.compute_product_status(expiry_date);

create or replace function public.set_product_status()
returns trigger
language plpgsql
as $$
begin
  new.status := public.compute_product_status(new.expiry_date);
  return new;
end;
$$;

drop trigger if exists trg_set_product_status on public.products;
create trigger trg_set_product_status
before insert or update of expiry_date on public.products
for each row
execute function public.set_product_status();

-- 3) Shopping list item ERD compatibility fields.
alter table public.shopping_items
  add column if not exists shopping_list_id uuid,
  add column if not exists name text;

update public.shopping_items
set shopping_list_id = list_id
where shopping_list_id is null;

update public.shopping_items
set name = product_name
where name is null;

alter table public.shopping_items
  alter column shopping_list_id set not null;

alter table public.shopping_items
  alter column name set not null;

alter table public.shopping_items
  drop constraint if exists shopping_items_shopping_list_id_fkey;

alter table public.shopping_items
  add constraint shopping_items_shopping_list_id_fkey
  foreign key (shopping_list_id) references public.shopping_lists(id) on delete cascade;

create or replace function public.sync_shopping_item_alias_columns()
returns trigger
language plpgsql
as $$
begin
  if new.shopping_list_id is null then
    new.shopping_list_id := new.list_id;
  end if;
  if new.list_id is null then
    new.list_id := new.shopping_list_id;
  end if;

  if new.name is null then
    new.name := new.product_name;
  end if;
  if new.product_name is null then
    new.product_name := new.name;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_shopping_item_alias_columns on public.shopping_items;
create trigger trg_sync_shopping_item_alias_columns
before insert or update on public.shopping_items
for each row
execute function public.sync_shopping_item_alias_columns();

-- 4) Achievement events table (ERD-compatible shape).
create table if not exists public.achievement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  icon text not null,
  earned_at timestamptz not null default now()
);

create index if not exists idx_achievement_events_user_id
  on public.achievement_events(user_id);

alter table public.achievement_events enable row level security;

drop policy if exists "AchievementEvents: select own family" on public.achievement_events;
create policy "AchievementEvents: select own family"
on public.achievement_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles me
    join public.profiles owner on owner.id = achievement_events.user_id
    where me.id = auth.uid()
      and me.family_id = owner.family_id
  )
);

drop policy if exists "AchievementEvents: insert parent family" on public.achievement_events;
create policy "AchievementEvents: insert parent family"
on public.achievement_events
for insert
to authenticated
with check (
  (select role from public.profiles where id = auth.uid()) = 'parent'
  and exists (
    select 1
    from public.profiles me
    join public.profiles owner on owner.id = achievement_events.user_id
    where me.id = auth.uid()
      and me.family_id = owner.family_id
  )
);

-- 5) Tighten Products RLS: children cannot modify products.
drop policy if exists "Products: insert family" on public.products;
drop policy if exists "Products: update family" on public.products;
drop policy if exists "Products: delete family" on public.products;

create policy "Products: insert parent family"
on public.products
for insert
to authenticated
with check (
  family_id = (select family_id from public.profiles where id = auth.uid())
  and (select role from public.profiles where id = auth.uid()) = 'parent'
);

create policy "Products: update parent family"
on public.products
for update
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
  and (select role from public.profiles where id = auth.uid()) = 'parent'
)
with check (
  family_id = (select family_id from public.profiles where id = auth.uid())
);

create policy "Products: delete parent family"
on public.products
for delete
to authenticated
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
  and (select role from public.profiles where id = auth.uid()) = 'parent'
);

-- 6) Realtime support.
alter table public.shopping_items replica identity full;
alter table public.tasks replica identity full;
alter table public.products replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.shopping_items;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.tasks;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.products;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end $$;

-- 7) Storage bucket and RLS policies for task proofs.
insert into storage.buckets (id, name, public)
values ('task-proofs', 'task-proofs', false)
on conflict (id) do nothing;

drop policy if exists "Task proofs read by family" on storage.objects;
create policy "Task proofs read by family"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'task-proofs'
  and exists (
    select 1
    from public.tasks t
    join public.profiles me on me.id = auth.uid()
    where t.photo_proof_url = storage.objects.name
      and t.family_id = me.family_id
  )
);

drop policy if exists "Task proofs upload by assigned child" on storage.objects;
create policy "Task proofs upload by assigned child"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'task-proofs'
  and exists (
    select 1
    from public.tasks t
    where split_part(storage.objects.name, '/', 1) = t.id::text
      and t.assigned_to = auth.uid()
  )
);
