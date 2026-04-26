-- Allow authenticated users to create/read their own company code safely.

grant select, insert on table public.companies to authenticated;
grant all on table public.companies to service_role;

alter table public.companies enable row level security;

drop policy if exists companies_select_own on public.companies;
create policy companies_select_own
on public.companies for select to authenticated using (
  id = public.auth_company_id ()
);

drop policy if exists companies_insert_authenticated on public.companies;
create policy companies_insert_authenticated
on public.companies for insert to authenticated
with check (true);
