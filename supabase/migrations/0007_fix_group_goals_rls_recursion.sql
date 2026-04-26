-- Fix: group_goals insert/delete policies queried public.goals directly, while
-- goals_select_visible queries public.group_goals. That circular RLS dependency can
-- trigger "infinite recursion detected in policy for relation group_goals".

create or replace function public.auth_owns_goal (p_goal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.goals g
    where
      g.id = p_goal_id
      and g.owner_id = auth.uid ()
  );
$$;

grant execute on function public.auth_owns_goal (uuid) to authenticated;

drop policy if exists group_goals_insert_group_owner_or_member_goal_owner on public.group_goals;
drop policy if exists group_goals_delete_group_owner_or_member_goal_owner on public.group_goals;

create policy group_goals_insert_group_owner_or_member_goal_owner
on public.group_goals for insert to authenticated
with check (
  exists (
    select 1
    from public.group_members gm
    where
      gm.group_id = group_goals.group_id
      and gm.user_id = auth.uid ()
      and gm.role = 'owner'
  )
  or (
    public.auth_owns_goal (goal_id)
    and exists (
      select 1
      from public.group_members gm
      where
        gm.group_id = group_goals.group_id
        and gm.user_id = auth.uid ()
    )
  )
);

create policy group_goals_delete_group_owner_or_member_goal_owner
on public.group_goals for delete to authenticated using (
  exists (
    select 1
    from public.group_members gm
    where
      gm.group_id = group_goals.group_id
      and gm.user_id = auth.uid ()
      and gm.role = 'owner'
  )
  or (
    public.auth_owns_goal (goal_id)
    and exists (
      select 1
      from public.group_members gm
      where
        gm.group_id = group_goals.group_id
        and gm.user_id = auth.uid ()
    )
  )
);
