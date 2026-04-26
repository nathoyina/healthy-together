-- Public/private company goals
-- - Public goals: colleagues can discover and join
-- - Private goals: visible by existing friend/group rules

alter table public.goals
add column if not exists is_public boolean not null default false;

create or replace function public.user_can_view_goal (p_goal_id uuid)
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
      and (
        g.is_template
        or g.is_public
        or g.owner_id = auth.uid ()
        or (
          g.owner_id is not null
          and public.are_friends (g.owner_id, auth.uid ())
        )
        or exists (
          select 1
          from public.group_goals gg
          join public.group_members gm on gm.group_id = gg.group_id
          where
            gg.goal_id = g.id
            and gm.user_id = auth.uid ()
        )
      )
  );
$$;

-- Existing seed template rows are shared company goals.
update public.goals
set is_public = true
where is_template = true;

-- Ensure visibility policy includes public goals.
drop policy if exists goals_select_visible on public.goals;

create policy goals_select_visible
on public.goals for select to authenticated using (
  is_template
  or is_public
  or owner_id = auth.uid ()
  or (
    owner_id is not null
    and public.are_friends (owner_id, auth.uid ())
  )
  or exists (
    select 1
    from public.group_goals gg
    join public.group_members gm on gm.group_id = gg.group_id
    where
      gg.goal_id = goals.id
      and gm.user_id = auth.uid ()
  )
);

-- Let users join public goals as participants.
drop policy if exists goal_participants_insert on public.goal_participants;

create policy goal_participants_insert
on public.goal_participants for insert to authenticated
with check (
  user_id = auth.uid ()
  and public.user_can_view_goal (goal_id)
  and exists (
    select 1
    from public.goals g
    where
      g.id = goal_id
      and (
        g.is_template
        or g.is_public
        or g.owner_id = auth.uid ()
        or (
          g.owner_id is not null
          and g.owner_id <> auth.uid ()
          and public.are_friends (g.owner_id, auth.uid ())
        )
      )
  )
);
