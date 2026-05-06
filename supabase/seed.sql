-- Saathi CRM — Demo seed data
-- Run after schema.sql + policies.sql.
-- Single shop, eight demo customers spanning all three languages with
-- visit dates that populate Today / Repeat / Lapsed filters.

-- Idempotent: clear existing pilot data before reseed.
truncate follow_ups, messages, visits, cars, customers, shops restart identity cascade;

insert into shops (id, name, whatsapp_phone, default_language) values
  ('11111111-1111-1111-1111-111111111111',
   'Dust Defender Lab',
   '+919999999999',
   'te');

with c as (
  insert into customers (shop_id, name, phone, preferred_language, first_visit_at, last_visit_at, visit_count, notes)
  values
    ('11111111-1111-1111-1111-111111111111', 'Ramesh',  '+919876543210', 'te', now() - interval '75 days', now() - interval '75 days', 1, 'wax smell complaint'),
    ('11111111-1111-1111-1111-111111111111', 'Anitha',  '+919876543211', 'te', now() - interval '120 days', now() - interval '92 days',  2, null),
    ('11111111-1111-1111-1111-111111111111', 'Suresh',  '+919876543212', 'hi', now() - interval '40 days',  now() - interval '12 days',  3, 'prefers Sunday slots'),
    ('11111111-1111-1111-1111-111111111111', 'Kavitha', '+919876543213', 'te', now() - interval '5 days',   now() - interval '5 days',   1, null),
    ('11111111-1111-1111-1111-111111111111', 'Imran',   '+919876543214', 'en', now() - interval '200 days', now() - interval '180 days', 1, 'PPF inquiry'),
    ('11111111-1111-1111-1111-111111111111', 'Praveen', '+919876543215', 'te', now() - interval '15 days',  now() - interval '15 days',  1, null),
    ('11111111-1111-1111-1111-111111111111', 'Lakshmi', '+919876543216', 'hi', now() - interval '80 days',  now() - interval '80 days',  1, null),
    ('11111111-1111-1111-1111-111111111111', 'Rahul',   '+919876543217', 'en', now() - interval '2 days',   now() - interval '2 days',   1, 'first visit, new car')
  returning id, name
)
select 'seeded' as status, count(*) from c;
