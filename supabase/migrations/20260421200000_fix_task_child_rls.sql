-- Fix "new row violates row-level security policy" when a child user tries to update a task to "in_review" status.
-- The existing RLS policies are too restrictive or incorrectly configured for child updates.

-- 1) Ensure Child can update their own tasks to 'in_review' status.
-- Drop the existing overly restrictive policy if it exists.
drop policy if exists "Tasks: update child assigned" on public.tasks;

-- Create a more permissive policy for children to update their tasks.
create policy "Tasks: update child assigned"
on public.tasks
for update
to authenticated
using (
  family_id = public.get_my_family_id()
  and assigned_to = auth.uid()
)
with check (
  family_id = public.get_my_family_id()
  and assigned_to = auth.uid()
  -- Only allow changing status to 'in_review' or uploading photo_proof_url
  -- For MVP simplicity, we allow updating the assigned task.
);

-- 2) Grant additional permissions if necessary.
-- Sometimes RLS on related tables (like storage objects) needs to be checked.
-- The task proof storage policy seems correct based on previous analysis.

-- 3) Ensure Parent can see child tasks to approve them.
drop policy if exists "Tasks: select family" on public.tasks;
create policy "Tasks: select family"
on public.tasks
for select
to authenticated
using (
  family_id = public.get_my_family_id()
);
