-- If you already applied 0001_init.sql before username-from-metadata existed, run this once.
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $body$
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
$body$;
