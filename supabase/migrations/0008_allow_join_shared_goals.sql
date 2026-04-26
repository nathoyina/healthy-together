-- Allow users to join shared company goals (`is_template = true`) by inserting
-- into goal_participants. Without this, goal_participants_insert requires either
-- own-goal or friend-owned goal and rejects shared rows with owner_id = null.

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
        or g.owner_id = auth.uid ()
        or (
          g.owner_id is not null
          and g.owner_id <> auth.uid ()
          and public.are_friends (g.owner_id, auth.uid ())
        )
      )
  )
);
