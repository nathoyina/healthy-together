-- Healthy Together — initial schema, RLS, helpers, templates
-- Apply via Supabase SQL editor or: supabase db push

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.goal_type as enum ('daily_binary', 'weekly_count', 'daily_count');

create type public.friendship_status as enum (
  'pending',
  'accepted',
  'declined',
  'blocked'
);

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  onboarding_completed_at timestamptz
);

create table public.goals (
  id uuid primary key default gen_random_uuid (),
  owner_id uuid references auth.users (id) on delete cascade,
  title text not null,
  description text,
  type public.goal_type not null,
  target_per_period int,
  icon text,
  color text,
  is_template boolean not null default false,
  is_public boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint goals_template_owner check (
    (is_template and owner_id is null)
    or (not is_template and owner_id is not null)
  )
);

create table public.goal_participants (
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now (),
  primary key (goal_id, user_id)
);

create table public.goal_entries (
  id uuid primary key default gen_random_uuid (),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  value int not null default 1,
  note text,
  created_at timestamptz not null default now (),
  unique (goal_id, user_id, entry_date)
);

create table public.friendships (
  id uuid primary key default gen_random_uuid (),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now (),
  unique (requester_id, addressee_id),
  constraint friendships_no_self check (requester_id <> addressee_id)
);

create table public.groups (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  slug text not null unique,
  invite_code text not null unique,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now ()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  primary key (group_id, user_id)
);

create table public.group_goals (
  group_id uuid not null references public.groups (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  primary key (group_id, goal_id)
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index goals_owner_id_idx on public.goals (owner_id);
create index goals_is_template_idx on public.goals (is_template) where is_template;
create index goal_entries_goal_user_date_idx on public.goal_entries (goal_id, user_id, entry_date);
create index friendships_requester_idx on public.friendships (requester_id);
create index friendships_addressee_idx on public.friendships (addressee_id);
create index group_members_user_idx on public.group_members (user_id);
create index profiles_username_lower_idx on public.profiles (lower(username));

-- -----------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER — keep search_path fixed)
-- -----------------------------------------------------------------------------
create or replace function public.are_friends (a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships f
    where
      f.status = 'accepted'
      and (
        (f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a)
      )
  );
$$;

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

grant execute on function public.are_friends (uuid, uuid) to authenticated;

grant execute on function public.user_can_view_goal (uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Triggers: profile on signup; goal owner as participant
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    nullif(lower(trim(new.raw_user_meta_data ->> 'username')), ''),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user ();

create or replace function public.add_goal_owner_participant ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id is not null then
    insert into public.goal_participants (goal_id, user_id)
    values (new.id, new.owner_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_goal_created_add_owner
after insert on public.goals for each row
execute function public.add_goal_owner_participant ();

-- When someone becomes a participant, they can log entries (handled by RLS).

-- -----------------------------------------------------------------------------
-- Join group by invite code
-- -----------------------------------------------------------------------------
-- No PL variables: each inner statement is valid standalone SQL if a tool
-- mistakenly executes only part of the body (bare names like grp_uuid were
-- interpreted as relation names).
create or replace function public.join_group_by_code (p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $body$
begin
  if
    not exists (
      select 1
      from public.groups g
      where
        g.invite_code = upper(trim(p_code))
    )
  then
    raise exception 'Invalid invite code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  select g.id, auth.uid (), 'member'
  from public.groups g
  where
    g.invite_code = upper(trim(p_code))
  on conflict do nothing;

  return (
    select g.id
    from public.groups g
    where
      g.invite_code = upper(trim(p_code))
    limit 1
  );
end;
$body$;

grant execute on function public.join_group_by_code (text) to authenticated;

-- group_members policies must not use EXISTS (SELECT … FROM group_members …):
-- that re-enters RLS on the same table and causes "infinite recursion" (e.g. when
-- goals_select_visible joins group_members for template rows).

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

grant execute on function public.auth_in_group (uuid) to authenticated;

grant execute on function public.auth_is_group_owner_member (uuid) to authenticated;

grant execute on function public.auth_owns_goal (uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

alter table public.goals enable row level security;

alter table public.goal_participants enable row level security;

alter table public.goal_entries enable row level security;

alter table public.friendships enable row level security;

alter table public.groups enable row level security;

alter table public.group_members enable row level security;

alter table public.group_goals enable row level security;

-- profiles
create policy profiles_select_authenticated
on public.profiles for select to authenticated using (true);

create policy profiles_update_own
on public.profiles for update to authenticated using (id = auth.uid ())
with check (id = auth.uid ());

-- goals
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

create policy goals_insert_own
on public.goals for insert to authenticated
with check (
  owner_id = auth.uid ()
  and coalesce(is_template, false) = false
);

create policy goals_update_own
on public.goals for update to authenticated using (owner_id = auth.uid ())
with check (owner_id = auth.uid () and coalesce(is_template, false) = false);

create policy goals_delete_own
on public.goals for delete to authenticated using (owner_id = auth.uid ());

-- goal_participants
create policy goal_participants_select
on public.goal_participants for select to authenticated using (
  public.user_can_view_goal (goal_id)
);

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
        or
        g.owner_id = auth.uid ()
        or (
          g.owner_id is not null
          and g.owner_id <> auth.uid ()
          and public.are_friends (g.owner_id, auth.uid ())
        )
      )
  )
);

create policy goal_participants_delete
on public.goal_participants for delete to authenticated using (
  user_id = auth.uid ()
  or exists (
    select 1
    from public.goals g
    where
      g.id = goal_id
      and g.owner_id = auth.uid ()
  )
);

-- goal_entries
create policy goal_entries_select
on public.goal_entries for select to authenticated using (
  public.user_can_view_goal (goal_id)
);

create policy goal_entries_insert
on public.goal_entries for insert to authenticated
with check (
  user_id = auth.uid ()
  and exists (
    select 1
    from public.goal_participants gp
    where
      gp.goal_id = goal_entries.goal_id
      and gp.user_id = auth.uid ()
  )
);

create policy goal_entries_update_own
on public.goal_entries for update to authenticated using (user_id = auth.uid ())
with check (user_id = auth.uid ());

create policy goal_entries_delete_own
on public.goal_entries for delete to authenticated using (user_id = auth.uid ());

-- friendships
create policy friendships_select_involved
on public.friendships for select to authenticated using (
  requester_id = auth.uid ()
  or addressee_id = auth.uid ()
);

create policy friendships_insert_requester
on public.friendships for insert to authenticated
with check (requester_id = auth.uid ());

create policy friendships_update_involved
on public.friendships for update to authenticated using (
  requester_id = auth.uid ()
  or addressee_id = auth.uid ()
);

-- groups
create policy groups_select_authenticated
on public.groups for select to authenticated using (true);

create policy groups_insert_authenticated
on public.groups for insert to authenticated
with check (created_by = auth.uid ());

create policy groups_update_creator
on public.groups for update to authenticated using (created_by = auth.uid ());

-- group_members
create policy group_members_select_same_group
on public.group_members for select to authenticated using (
  user_id = auth.uid ()
  or public.auth_in_group (group_id)
);

-- Creator adds self as owner after inserting `groups`. Others join only via
-- `join_group_by_code` (SECURITY DEFINER), not direct inserts.
create policy group_members_insert_creator_owner
on public.group_members for insert to authenticated
with check (
  user_id = auth.uid ()
  and role = 'owner'
  and exists (
    select 1
    from public.groups g
    where
      g.id = group_id
      and g.created_by = auth.uid ()
  )
);

create policy group_members_delete_self_or_owner
on public.group_members for delete to authenticated using (
  user_id = auth.uid ()
  or public.auth_is_group_owner_member (group_id)
);

-- group_goals
create policy group_goals_select_member
on public.group_goals for select to authenticated using (
  exists (
    select 1
    from public.group_members gm
    where
      gm.group_id = group_goals.group_id
      and gm.user_id = auth.uid ()
  )
);

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

-- -----------------------------------------------------------------------------
-- Realtime (Supabase hosted — skip if publication missing locally)
-- -----------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.goal_entries;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

-- -----------------------------------------------------------------------------
-- Seed template goals (system rows; not user-owned)
-- Shipped defaults for onboarding + /goals “Templates”. Edit here or UPDATE rows
-- with is_template = true in the dashboard / a follow-up migration.
-- -----------------------------------------------------------------------------
insert into public.goals (
  owner_id,
  title,
  description,
  type,
  target_per_period,
  icon,
  color,
  is_template,
  is_public
)
values
  (
    null,
    'Core & mobility',
    'Daily check-in when you finish core, mobility, or planned rehab work — builds a streak.',
    'daily_binary',
    null,
    'flame',
    'orange',
    true,
    true
  ),
  (
    null,
    'Strength sessions',
    'Log each strength, Pilates, or studio workout; week resets Monday.',
    'weekly_count',
    3,
    'dumbbell',
    'teal',
    true,
    true
  ),
  (
    null,
    'Runs this week',
    'Count each run Mon–Sun — easy to share with a running group or coach.',
    'weekly_count',
    3,
    'footprints',
    'sky',
    true,
    true
  );

-- -----------------------------------------------------------------------------
-- API privileges (PostgREST uses `authenticated`; RLS is not enough without GRANT)
-- -----------------------------------------------------------------------------
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
