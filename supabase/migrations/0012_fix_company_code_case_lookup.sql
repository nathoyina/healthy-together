-- Fix company code matching to be case-insensitive.
-- Existing rows may contain mixed/lower case (e.g. "$h0pBACK"), while signup
-- normalizes user input to uppercase.

update public.companies
set join_code = upper(join_code)
where join_code <> upper(join_code);

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

