-- Saathi CRM — Postgres schema (Supabase)
-- See docs/DATA_MODEL.md for the source of truth.

create extension if not exists "pgcrypto";

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp_phone text not null,
  default_language text not null check (default_language in ('te','hi','en')),
  created_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  phone text,
  preferred_language text not null check (preferred_language in ('te','hi','en')),
  primary_car_id uuid,
  first_visit_at timestamptz not null default now(),
  last_visit_at timestamptz not null default now(),
  visit_count int not null default 0,
  notes text,
  created_at timestamptz default now()
);

create index if not exists customers_shop_phone_idx on customers (shop_id, phone);
create index if not exists customers_last_visit_idx on customers (shop_id, last_visit_at desc);

create table if not exists cars (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  license_plate text,
  make text,
  model text,
  color text,
  photo_url text,
  created_at timestamptz default now()
);

create unique index if not exists cars_plate_idx on cars (license_plate)
  where license_plate is not null;

alter table customers
  drop constraint if exists customers_primary_car_fk;
alter table customers
  add constraint customers_primary_car_fk
  foreign key (primary_car_id) references cars(id) on delete set null
  deferrable initially deferred;

create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  car_id uuid references cars(id) on delete set null,
  services text[] not null default '{}',
  amount_inr numeric(10,2) not null default 0,
  notes text,
  next_visit_hint text,
  intake_audio_url text,
  intake_photo_url text,
  raw_transcript text,
  ai_tool_call_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists visits_customer_idx on visits (customer_id, created_at desc);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  direction text not null check (direction in ('outbound','inbound')),
  channel text not null default 'whatsapp',
  language text not null check (language in ('te','hi','en')),
  text text not null,
  status text not null default 'drafted'
    check (status in ('drafted','sent','delivered','read','failed')),
  whatsapp_message_id text,
  ai_tool_call_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists messages_customer_idx on messages (customer_id, created_at desc);

create table if not exists follow_ups (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  scheduled_for timestamptz not null,
  occasion text not null check (occasion in ('lapsed','thankyou','reminder')),
  status text not null default 'pending'
    check (status in ('pending','sent','cancelled')),
  created_at timestamptz default now()
);

create index if not exists follow_ups_due_idx on follow_ups (scheduled_for) where status = 'pending';
