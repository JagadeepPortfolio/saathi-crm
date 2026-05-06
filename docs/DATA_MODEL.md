# Data Model — Saathi CRM

## TypeScript types

```ts
// lib/types.ts

export type Language = 'te' | 'hi' | 'en';

export type Shop = {
  id: string;
  name: string;
  whatsapp_phone: string;
  default_language: Language;
  created_at: string;
};

export type Customer = {
  id: string;
  shop_id: string;
  name: string;
  phone: string | null;
  preferred_language: Language;
  primary_car_id: string | null;
  first_visit_at: string;
  last_visit_at: string;
  visit_count: number;
  status: 'active' | 'lapsed';     // derived; lapsed if last_visit_at > 60d
  notes: string | null;
  created_at: string;
};

export type Car = {
  id: string;
  customer_id: string;
  license_plate: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  photo_url: string | null;
};

export type Visit = {
  id: string;
  customer_id: string;
  car_id: string | null;
  services: string[];
  amount_inr: number;
  notes: string | null;
  next_visit_hint: string | null;
  intake_audio_url: string | null;   // 7d TTL
  intake_photo_url: string | null;
  raw_transcript: string | null;     // for audit / demo
  ai_tool_call_meta: Record<string, unknown>; // model, ms, tokens
  created_at: string;
};

export type Message = {
  id: string;
  customer_id: string;
  direction: 'outbound' | 'inbound';
  channel: 'whatsapp';
  language: Language;
  text: string;
  status: 'drafted' | 'sent' | 'delivered' | 'read' | 'failed';
  whatsapp_message_id: string | null;
  ai_tool_call_meta: Record<string, unknown>;
  created_at: string;
};

export type FollowUp = {
  id: string;
  customer_id: string;
  scheduled_for: string;
  occasion: 'lapsed' | 'thankyou' | 'reminder';
  status: 'pending' | 'sent' | 'cancelled';
  created_at: string;
};
```

## Supabase schema (DDL)

```sql
-- supabase/schema.sql

create extension if not exists "pgcrypto";

create table shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp_phone text not null,
  default_language text not null check (default_language in ('te','hi','en')),
  created_at timestamptz default now()
);

create table customers (
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

create index customers_shop_phone_idx on customers (shop_id, phone);

create table cars (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  license_plate text,
  make text,
  model text,
  color text,
  photo_url text,
  created_at timestamptz default now()
);

create unique index cars_plate_idx on cars (license_plate)
  where license_plate is not null;

alter table customers
  add constraint customers_primary_car_fk
  foreign key (primary_car_id) references cars(id) on delete set null
  deferrable initially deferred;

create table visits (
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

create index visits_customer_idx on visits (customer_id, created_at desc);

create table messages (
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

create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  scheduled_for timestamptz not null,
  occasion text not null check (occasion in ('lapsed','thankyou','reminder')),
  status text not null default 'pending'
    check (status in ('pending','sent','cancelled')),
  created_at timestamptz default now()
);
```

## Row-level security

Single-tenant for the pilot, but RLS is on so V2 doesn't have to retrofit.

```sql
-- supabase/policies.sql

alter table shops enable row level security;
alter table customers enable row level security;
alter table cars enable row level security;
alter table visits enable row level security;
alter table messages enable row level security;
alter table follow_ups enable row level security;

-- For the pilot: a single service-role key in the Next.js server is the
-- only writer. Public/anon role gets no access. Owner identity is enforced
-- at the Next.js layer (passcode-gated route group), not at Postgres.

create policy "service role full access"
  on shops for all using (auth.role() = 'service_role');
-- repeat for customers / cars / visits / messages / follow_ups
```

## Storage buckets

```
intake-photos    private    cleanup: never (visit history)
intake-audio     private    cleanup: 7 days (audit only, not user-visible)
```

## Seed data

`supabase/seed.sql` inserts:
- 1 shop ("Dust Defender Lab", LB Nagar, Hyderabad — placeholder; update with the real pilot shop)
- 8 demo customers spanning all three languages, with visits 5 / 30 / 75 days ago to populate the Lapsed filter
- A few drafted-but-not-sent messages for the empty-state and history visuals
