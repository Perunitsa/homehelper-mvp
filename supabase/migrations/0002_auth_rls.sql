-- Policies required for authenticated onboarding/auth flows.

create policy "Profiles: insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Profiles: select own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Profiles: update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Families: authenticated can create"
on public.families
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Families: view own family"
on public.families
for select
to authenticated
using (
  id = (
    select family_id from public.profiles where id = auth.uid()
  )
);

create policy "Families: allow invite lookup"
on public.families
for select
to authenticated
using (true);
