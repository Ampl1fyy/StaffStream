-- ─────────────────────────────────────────
-- TrabaHost Initial Schema
-- ─────────────────────────────────────────

-- Enable PostGIS for geolocation queries
create extension if not exists postgis;

-- ─────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────
create type user_role as enum ('worker', 'business', 'admin');
create type shift_status as enum ('open', 'filled', 'active', 'completed', 'cancelled');
create type application_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create type transaction_status as enum ('pending', 'processing', 'completed', 'failed', 'refunded');
create type payment_method as enum ('maya', 'gcash');
create type dispute_status as enum ('open', 'under_review', 'resolved', 'dismissed');
create type kyc_status as enum ('unverified', 'pending', 'verified', 'rejected');

-- ─────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'worker',
  full_name text not null,
  phone text,
  avatar_url text,
  bio text,
  location geography(point, 4326),   -- lat/lng for geo-matching
  city text,
  kyc_status kyc_status not null default 'unverified',
  kyc_document_url text,
  reliability_score numeric(3,2) default 5.00 check (reliability_score between 0 and 5),
  average_rating numeric(3,2) default 0.00 check (average_rating between 0 and 5),
  total_ratings int default 0,
  e_wallet_number text,             -- GCash/Maya number for payouts
  e_wallet_provider payment_method,
  fcm_token text,                   -- Firebase push token
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- BUSINESSES
-- ─────────────────────────────────────────
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  industry text,
  logo_url text,
  address text not null,
  location geography(point, 4326) not null,
  city text not null,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- SKILLS
-- ─────────────────────────────────────────
create table public.skills (
  id serial primary key,
  name text unique not null,
  category text
);

create table public.worker_skills (
  worker_id uuid references public.profiles(id) on delete cascade,
  skill_id int references public.skills(id) on delete cascade,
  primary key (worker_id, skill_id)
);

-- Seed common skills
insert into public.skills (name, category) values
  ('Cashiering', 'Retail'),
  ('Customer Service', 'General'),
  ('Food Service', 'F&B'),
  ('Barista', 'F&B'),
  ('Inventory Management', 'Retail'),
  ('Cooking', 'F&B'),
  ('Bartending', 'F&B'),
  ('Cleaning', 'Facilities'),
  ('Security', 'Facilities'),
  ('Event Staff', 'Events'),
  ('Promotions', 'Marketing'),
  ('Data Entry', 'Admin'),
  ('Delivery', 'Logistics'),
  ('Driving', 'Logistics'),
  ('Warehousing', 'Logistics');

-- ─────────────────────────────────────────
-- SHIFTS
-- ─────────────────────────────────────────
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  description text,
  role_required text not null,
  skill_id int references public.skills(id),
  slots int not null default 1 check (slots >= 1),
  slots_filled int default 0,
  hourly_rate numeric(10,2) not null,
  time_start timestamptz not null,
  time_end timestamptz not null,
  status shift_status not null default 'open',
  location geography(point, 4326) not null,  -- copied from business for quick querying
  address text not null,
  qr_code text unique,                        -- unique token for QR check-in
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint valid_time check (time_end > time_start)
);

-- ─────────────────────────────────────────
-- APPLICATIONS
-- ─────────────────────────────────────────
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  status application_status not null default 'pending',
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  hours_worked numeric(5,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shift_id, worker_id)
);

-- ─────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id),
  worker_id uuid not null references public.profiles(id),
  business_id uuid not null references public.businesses(id),
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) default 0,       -- 5% platform cut
  net_amount numeric(10,2) not null,           -- amount - platform_fee
  payment_method payment_method not null,
  status transaction_status not null default 'pending',
  payment_intent_id text,                     -- Maya/PayMongo intent ID
  payment_reference text,                     -- final reference number
  initiated_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- RATINGS
-- ─────────────────────────────────────────
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id),
  rater_id uuid not null references public.profiles(id),
  rated_id uuid not null references public.profiles(id),
  score int not null check (score between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (application_id, rater_id)
);

-- ─────────────────────────────────────────
-- DISPUTES
-- ─────────────────────────────────────────
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id),
  raised_by uuid not null references public.profiles(id),
  reason text not null,
  description text,
  status dispute_status not null default 'open',
  resolved_by uuid references public.profiles(id),
  resolution_note text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS LOG
-- ─────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
create index on public.shifts using gist (location);
create index on public.businesses using gist (location);
create index on public.profiles using gist (location);
create index on public.shifts (status, time_start);
create index on public.applications (worker_id, status);
create index on public.applications (shift_id, status);
create index on public.transactions (worker_id, status);
create index on public.notifications (user_id, is_read);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger trg_businesses_updated_at before update on public.businesses
  for each row execute function public.handle_updated_at();
create trigger trg_shifts_updated_at before update on public.shifts
  for each row execute function public.handle_updated_at();
create trigger trg_applications_updated_at before update on public.applications
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'worker')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.shifts enable row level security;
alter table public.applications enable row level security;
alter table public.transactions enable row level security;
alter table public.ratings enable row level security;
alter table public.disputes enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users can read all, only update own
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Businesses: public read, owner write
create policy "businesses_read_all" on public.businesses for select using (true);
create policy "businesses_insert_own" on public.businesses for insert with check (auth.uid() = owner_id);
create policy "businesses_update_own" on public.businesses for update using (auth.uid() = owner_id);

-- Shifts: public read, business owner write
create policy "shifts_read_all" on public.shifts for select using (true);
create policy "shifts_insert_business" on public.shifts for insert with check (
  exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
);
create policy "shifts_update_business" on public.shifts for update using (
  exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
);

-- Applications: worker sees own, business sees their shift applications
create policy "applications_worker_own" on public.applications for select using (worker_id = auth.uid());
create policy "applications_business_see" on public.applications for select using (
  exists (
    select 1 from public.shifts s
    join public.businesses b on b.id = s.business_id
    where s.id = shift_id and b.owner_id = auth.uid()
  )
);
create policy "applications_insert_worker" on public.applications for insert with check (auth.uid() = worker_id);
create policy "applications_update_worker" on public.applications for update using (auth.uid() = worker_id);
create policy "applications_update_business" on public.applications for update using (
  exists (
    select 1 from public.shifts s
    join public.businesses b on b.id = s.business_id
    where s.id = shift_id and b.owner_id = auth.uid()
  )
);

-- Transactions: worker and business see own
create policy "transactions_worker" on public.transactions for select using (worker_id = auth.uid());
create policy "transactions_business" on public.transactions for select using (
  exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
);

-- Ratings: public read, rater insert own
create policy "ratings_read_all" on public.ratings for select using (true);
create policy "ratings_insert_own" on public.ratings for insert with check (auth.uid() = rater_id);

-- Disputes: only involved parties
create policy "disputes_own" on public.disputes for select using (raised_by = auth.uid());
create policy "disputes_insert_own" on public.disputes for insert with check (auth.uid() = raised_by);

-- Notifications: only own
create policy "notifications_own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update using (user_id = auth.uid());

-- ─────────────────────────────────────────
-- HELPER: nearby shifts (within X meters)
-- ─────────────────────────────────────────
create or replace function public.get_nearby_shifts(
  lat double precision,
  lng double precision,
  radius_meters int default 5000
)
returns setof public.shifts language sql stable as $$
  select * from public.shifts
  where status = 'open'
    and time_start > now()
    and st_dwithin(
      location,
      st_point(lng, lat)::geography,
      radius_meters
    )
  order by st_distance(location, st_point(lng, lat)::geography) asc;
$$;
