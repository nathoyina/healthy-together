-- Company-level isolation via join code.
-- One company is created first; everyone signs up with that company code.

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  join_code text not null unique,
  created_at timestamptz not null default now ()
);

create unique index if not exists companies_join_code_upper_idx
on public.companies (upper(join_code));

alter table public.profiles
add column if not exists company_id uuid references public.companies (id);

alter table public.goals
add column if not exists company_id uuid references public.companies (id);

-- Seed a default company only for backfill safety in existing environments.
insert into public.companies (name, join_code)
select 'Default Company', 'DEFAULT'
where not exists (select 1 from public.companies);

-- Backfill existing users/goals into one company so current data keeps working.
with d as (
  select id as company_id from public.companies order by created_at asc limit 1
)
update public.profiles p
set company_id = d.company_id
from d
where p.company_id is null;

with d as (
  select id as company_id from public.companies order by created_at asc limit 1
)
update public.goals g
set company_id = coalesce(
  (select p.company_id from public.profiles p where p.id = g.owner_id),
  d.company_id
)
from d
where g.company_id is null;

create or replace function public.auth_company_id ()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.company_id
  from public.profiles p
  where p.id = auth.uid ()
  limit 1
$$;

create or replace function public.auth_same_company (p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where
      p.id = p_user_id
      and p.company_id = public.auth_company_id ()
  )
$$;

create or replace function public.company_code_exists (p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.companies c
    where upper(c.join_code) = upper(trim(p_code))
  )
$$;

grant execute on function public.auth_company_id () to authenticated;
grant execute on function public.auth_same_company (uuid) to authenticated;
grant execute on function public.company_code_exists (text) to anon, authenticated;

-- Update signup trigger to attach profile to company from signup metadata.
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  select c.id
  into v_company_id
  from public.companies c
  where c.join_code = upper(trim(coalesce(new.raw_user_meta_data ->> 'company_code', '')))
  limit 1;

  insert into public.profiles (id, username, display_name, company_id)
  values (
    new.id,
    nullif(lower(trim(new.raw_user_meta_data ->> 'username')), ''),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    v_company_id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Company-aware goal visibility helper.
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
      and g.company_id = public.auth_company_id ()
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

-- Recreate policies that need company scoping.
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
on public.profiles for select to authenticated using (company_id = public.auth_company_id ());

drop policy if exists goals_select_visible on public.goals;
create policy goals_select_visible
on public.goals for select to authenticated using (
  company_id = public.auth_company_id ()
  and (
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
  )
);

drop policy if exists goals_insert_own on public.goals;
create policy goals_insert_own
on public.goals for insert to authenticated
with check (
  owner_id = auth.uid ()
  and company_id = public.auth_company_id ()
  and coalesce(is_template, false) = false
);

drop policy if exists goals_update_own on public.goals;
create policy goals_update_own
on public.goals for update to authenticated using (
  owner_id = auth.uid ()
  and company_id = public.auth_company_id ()
)
with check (
  owner_id = auth.uid ()
  and company_id = public.auth_company_id ()
  and coalesce(is_template, false) = false
);

drop policy if exists goals_delete_own on public.goals;
create policy goals_delete_own
on public.goals for delete to authenticated using (
  owner_id = auth.uid ()
  and company_id = public.auth_company_id ()
);

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
      and g.company_id = public.auth_company_id ()
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

drop policy if exists friendships_select_involved on public.friendships;
create policy friendships_select_involved
on public.friendships for select to authenticated using (
  (requester_id = auth.uid () or addressee_id = auth.uid ())
  and public.auth_same_company (requester_id)
  and public.auth_same_company (addressee_id)
);

drop policy if exists friendships_insert_requester on public.friendships;
create policy friendships_insert_requester
on public.friendships for insert to authenticated
with check (
  requester_id = auth.uid ()
  and public.auth_same_company (requester_id)
  and public.auth_same_company (addressee_id)
);

drop policy if exists friendships_update_involved on public.friendships;
create policy friendships_update_involved
on public.friendships for update to authenticated using (
  (requester_id = auth.uid () or addressee_id = auth.uid ())
  and public.auth_same_company (requester_id)
  and public.auth_same_company (addressee_id)
);
