-- Add has_seen_onboarding column to profiles table.
alter table public.profiles
  add column if not exists has_seen_onboarding boolean not null default false;
