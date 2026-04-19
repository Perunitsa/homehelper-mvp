-- HomeHelper MVP initial schema
-- Run in Supabase SQL editor or via Supabase CLI migrations.

create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  owner_id uuid,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text not null,
  last_name text,
  avatar_url text,
  role text default 'parent' check (role in ('parent', 'child')),
  current_xp integer default 0,
  level integer default 1,
  family_id uuid references public.families(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.families
  add constraint families_owner_id_fkey
  foreign key (owner_id) references public.profiles(id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  barcode text,
  category text,
  expiry_date date not null,
  purchase_date date default current_date,
  quantity integer default 1,
  unit text default 'pcs',
  price decimal(10,2),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  created_by uuid references public.profiles(id),
  is_shared boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references public.shopping_lists(id) on delete cascade not null,
  product_name text not null,
  quantity integer default 1,
  unit text default 'pcs',
  is_purchased boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade not null,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) not null,
  created_by uuid references public.profiles(id) not null,
  points integer not null check (points > 0),
  deadline timestamptz,
  status text default 'pending' check (status in ('pending', 'in_review', 'completed', 'rejected')),
  photo_proof_url text,
  icon text default 'quest',
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text not null,
  required_points integer not null,
  level integer default 1
);

create table if not exists public.user_achievements (
  user_id uuid references public.profiles(id) on delete cascade,
  achievement_id uuid references public.achievements(id) on delete cascade,
  earned_at timestamptz default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('expiry', 'task', 'system')),
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_products_family on public.products(family_id);
create index if not exists idx_products_expiry on public.products(expiry_date);
create index if not exists idx_tasks_family on public.tasks(family_id);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to);
create index if not exists idx_tasks_status on public.tasks(status);

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;
alter table public.tasks enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.notifications enable row level security;

create policy "Family isolation products select"
on public.products
for select
using (
  family_id = (select family_id from public.profiles where id = auth.uid())
);
