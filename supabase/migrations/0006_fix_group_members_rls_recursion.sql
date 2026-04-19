-- Fix: goals_select_visible joins group_members; group_members SELECT policy used
-- EXISTS (SELECT … FROM group_members …), which re-triggers the same policy →
-- "infinite recursion detected in policy for relation group_members".

create or replace function public.auth_in_group (p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members m
    where
      m.group_id = p_group_id
      and m.user_id = auth.uid ()
  );
$$;

create or replace function public.auth_is_group_owner_member (p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members m
    where
      m.group_id = p_group_id
      and m.user_id = auth.uid ()
      and m.role = 'owner'
  );
$$;

grant execute on function public.auth_in_group (uuid) to authenticated;

grant execute on function public.auth_is_group_owner_member (uuid) to authenticated;

drop policy if exists group_members_select_same_group on public.group_members;

drop policy if exists group_members_delete_self_or_owner on public.group_members;

create policy group_members_select_same_group
on public.group_members for select to authenticated using (
  user_id = auth.uid ()
  or public.auth_in_group (group_id)
);

create policy group_members_delete_self_or_owner
on public.group_members for delete to authenticated using (
  user_id = auth.uid ()
  or public.auth_is_group_owner_member (group_id)
);
