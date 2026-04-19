-- PostgREST uses the `authenticated` role (JWT). RLS alone is not enough:
-- the role must have table privileges or you get "permission denied for table …".

grant usage on schema public to authenticated;
grant usage on schema public to service_role;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.goals to authenticated;
grant select, insert, update, delete on table public.goal_participants to authenticated;
grant select, insert, update, delete on table public.goal_entries to authenticated;
grant select, insert, update, delete on table public.friendships to authenticated;
grant select, insert, update, delete on table public.groups to authenticated;
grant select, insert, update, delete on table public.group_members to authenticated;
grant select, insert, update, delete on table public.group_goals to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.goals to service_role;
grant all on table public.goal_participants to service_role;
grant all on table public.goal_entries to service_role;
grant all on table public.friendships to service_role;
grant all on table public.groups to service_role;
grant all on table public.group_members to service_role;
grant all on table public.group_goals to service_role;
