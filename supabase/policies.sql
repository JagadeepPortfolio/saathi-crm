-- Saathi CRM — Row-level security policies
-- Single-tenant for the pilot. RLS is enabled so V2 doesn't have to retrofit.
-- Server-side service-role key is the only writer; anon role gets nothing.

alter table shops      enable row level security;
alter table customers  enable row level security;
alter table cars       enable row level security;
alter table visits     enable row level security;
alter table messages   enable row level security;
alter table follow_ups enable row level security;

drop policy if exists "service role full access" on shops;
drop policy if exists "service role full access" on customers;
drop policy if exists "service role full access" on cars;
drop policy if exists "service role full access" on visits;
drop policy if exists "service role full access" on messages;
drop policy if exists "service role full access" on follow_ups;

create policy "service role full access"
  on shops      for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role full access"
  on customers  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role full access"
  on cars       for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role full access"
  on visits     for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role full access"
  on messages   for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role full access"
  on follow_ups for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
