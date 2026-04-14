-- ─────────────────────────────────────────
-- StaffStream — Business Seed Data
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────
-- Creates:
--   • 1 business owner account  (email: business@staffstream.ph / password: Password123!)
--   • 1 business profile (SM Supermarket QC)
--   • 6 shifts in various states
--   • 3 worker accounts with applications
--   • Transactions for completed shifts
--   • 1 business in Malis, Guiguinto, Bulacan with 3 shifts
-- ─────────────────────────────────────────

DO $$
DECLARE
  -- Business owner
  biz_owner_id      uuid := '11111111-0000-0000-0000-000000000001';
  biz_id            uuid := '22222222-0000-0000-0000-000000000001';

  -- Workers
  worker1_id        uuid := '33333333-0000-0000-0000-000000000001';
  worker2_id        uuid := '33333333-0000-0000-0000-000000000002';
  worker3_id        uuid := '33333333-0000-0000-0000-000000000003';

  -- Bulacan business owner + business
  bul_owner_id      uuid := '11111111-0000-0000-0000-000000000002';
  bul_biz_id        uuid := '22222222-0000-0000-0000-000000000002';

  -- Bulacan shifts
  bul_shift1_id     uuid := '44444444-0000-0000-0000-000000000007';
  bul_shift2_id     uuid := '44444444-0000-0000-0000-000000000008';
  bul_shift3_id     uuid := '44444444-0000-0000-0000-000000000009';

  -- Shifts
  shift_open1_id    uuid := '44444444-0000-0000-0000-000000000001';
  shift_open2_id    uuid := '44444444-0000-0000-0000-000000000002';
  shift_filled_id   uuid := '44444444-0000-0000-0000-000000000003';
  shift_active_id   uuid := '44444444-0000-0000-0000-000000000004';
  shift_done1_id    uuid := '44444444-0000-0000-0000-000000000005';
  shift_done2_id    uuid := '44444444-0000-0000-0000-000000000006';

  -- Applications
  app1_id           uuid := '55555555-0000-0000-0000-000000000001';
  app2_id           uuid := '55555555-0000-0000-0000-000000000002';
  app3_id           uuid := '55555555-0000-0000-0000-000000000003';
  app4_id           uuid := '55555555-0000-0000-0000-000000000004';
  app5_id           uuid := '55555555-0000-0000-0000-000000000005';

  -- Skill IDs (from seeded skills in 001_initial_schema.sql)
  skill_cashier     int;
  skill_customer    int;
  skill_food        int;
BEGIN

  -- ── Resolve skill IDs ───────────────────
  SELECT id INTO skill_cashier  FROM public.skills WHERE name = 'Cashiering';
  SELECT id INTO skill_customer FROM public.skills WHERE name = 'Customer Service';
  SELECT id INTO skill_food     FROM public.skills WHERE name = 'Food Service';


  -- ─────────────────────────────────────────
  -- AUTH USERS
  -- ─────────────────────────────────────────

  -- Business owner
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES (
    biz_owner_id,
    '00000000-0000-0000-0000-000000000000',
    'business@staffstream.ph',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Maria Santos","role":"business","phone":"+639171234567"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Worker 1
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES (
    worker1_id,
    '00000000-0000-0000-0000-000000000000',
    'juan@staffstream.ph',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Juan dela Cruz","role":"worker","phone":"+639181234567"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Worker 2
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES (
    worker2_id,
    '00000000-0000-0000-0000-000000000000',
    'ana@staffstream.ph',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ana Reyes","role":"worker","phone":"+639191234567"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Worker 3
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES (
    worker3_id,
    '00000000-0000-0000-0000-000000000000',
    'pedro@staffstream.ph',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Pedro Garcia","role":"worker","phone":"+639201234567"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT (id) DO NOTHING;


  -- ─────────────────────────────────────────
  -- PROFILES  (trigger creates them; we update details)
  -- ─────────────────────────────────────────

  UPDATE public.profiles SET
    role          = 'business',
    phone         = '+639171234567',
    city          = 'Quezon City',
    location      = ST_Point(121.0437, 14.6760)::geography,
    kyc_status    = 'verified',
    is_active     = true
  WHERE id = biz_owner_id;

  UPDATE public.profiles SET
    phone              = '+639181234567',
    city               = 'Quezon City',
    location           = ST_Point(121.0500, 14.6800)::geography,
    kyc_status         = 'verified',
    reliability_score  = 4.80,
    average_rating     = 4.75,
    total_ratings      = 8,
    e_wallet_number    = '09181234567',
    e_wallet_provider  = 'gcash',
    is_active          = true
  WHERE id = worker1_id;

  UPDATE public.profiles SET
    phone              = '+639191234567',
    city               = 'Quezon City',
    location           = ST_Point(121.0400, 14.6700)::geography,
    kyc_status         = 'verified',
    reliability_score  = 4.50,
    average_rating     = 4.60,
    total_ratings      = 5,
    e_wallet_number    = '09191234567',
    e_wallet_provider  = 'maya',
    is_active          = true
  WHERE id = worker2_id;

  UPDATE public.profiles SET
    phone              = '+639201234567',
    city               = 'Quezon City',
    location           = ST_Point(121.0350, 14.6650)::geography,
    kyc_status         = 'pending',
    reliability_score  = 5.00,
    average_rating     = 0.00,
    total_ratings      = 0,
    is_active          = true
  WHERE id = worker3_id;

  -- Worker skills
  INSERT INTO public.worker_skills (worker_id, skill_id) VALUES
    (worker1_id, skill_cashier),
    (worker1_id, skill_customer),
    (worker2_id, skill_food),
    (worker2_id, skill_customer),
    (worker3_id, skill_cashier)
  ON CONFLICT DO NOTHING;


  -- ─────────────────────────────────────────
  -- BUSINESS
  -- ─────────────────────────────────────────

  INSERT INTO public.businesses (id, owner_id, name, description, industry, address, location, city, is_verified)
  VALUES (
    biz_id,
    biz_owner_id,
    'SM Supermarket North EDSA',
    'One of the largest supermarket chains in the Philippines, serving thousands of customers daily.',
    'Retail',
    'SM City North EDSA, Quezon City, Metro Manila',
    ST_Point(121.0322, 14.6563)::geography,
    'Quezon City',
    true
  ) ON CONFLICT (id) DO NOTHING;


  -- ─────────────────────────────────────────
  -- SHIFTS
  -- ─────────────────────────────────────────

  -- Open shift 1 — upcoming cashier role
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, qr_code)
  VALUES (
    shift_open1_id, biz_id,
    'Cashier – Weekend Sale',
    'Help manage the express checkout lanes during our weekend sale event. Fast-paced environment, uniform provided.',
    'Cashier', skill_cashier, 3, 1,
    120.00,
    now() + interval '2 days',
    now() + interval '2 days' + interval '8 hours',
    'open',
    ST_Point(121.0322, 14.6563)::geography,
    'SM City North EDSA, Quezon City',
    gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Open shift 2 — customer service
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, qr_code)
  VALUES (
    shift_open2_id, biz_id,
    'Customer Service Rep',
    'Assist customers on the floor, answer inquiries, and help locate products.',
    'Customer Service Rep', skill_customer, 2, 0,
    110.00,
    now() + interval '3 days',
    now() + interval '3 days' + interval '6 hours',
    'open',
    ST_Point(121.0322, 14.6563)::geography,
    'SM City North EDSA, Quezon City',
    gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Filled shift — all slots taken
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, qr_code)
  VALUES (
    shift_filled_id, biz_id,
    'Food Court Crew',
    'Assist in the SM Food Court with food preparation and serving.',
    'Food Crew', skill_food, 2, 2,
    115.00,
    now() + interval '1 day',
    now() + interval '1 day' + interval '7 hours',
    'filled',
    ST_Point(121.0322, 14.6563)::geography,
    'SM City North EDSA, Quezon City',
    gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Active shift — currently ongoing
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, qr_code)
  VALUES (
    shift_active_id, biz_id,
    'Inventory Stockroom Staff',
    'Assist in receiving and organizing new stock deliveries in the stockroom.',
    'Stockroom Staff', null, 1, 1,
    125.00,
    now() - interval '2 hours',
    now() + interval '6 hours',
    'active',
    ST_Point(121.0322, 14.6563)::geography,
    'SM City North EDSA, Quezon City',
    gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Completed shift 1
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, qr_code)
  VALUES (
    shift_done1_id, biz_id,
    'Cashier – Regular Day',
    'Standard cashiering shift on a regular weekday.',
    'Cashier', skill_cashier, 2, 2,
    120.00,
    now() - interval '3 days',
    now() - interval '3 days' + interval '8 hours',
    'completed',
    ST_Point(121.0322, 14.6563)::geography,
    'SM City North EDSA, Quezon City',
    gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Completed shift 2
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, qr_code)
  VALUES (
    shift_done2_id, biz_id,
    'Promotions Staff',
    'Distribute flyers and assist with in-store promotions.',
    'Promo Staff', null, 1, 1,
    105.00,
    now() - interval '5 days',
    now() - interval '5 days' + interval '5 hours',
    'completed',
    ST_Point(121.0322, 14.6563)::geography,
    'SM City North EDSA, Quezon City',
    gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;


  -- ─────────────────────────────────────────
  -- APPLICATIONS
  -- ─────────────────────────────────────────

  -- Open shift 1: one approved application (worker1)
  INSERT INTO public.applications (id, shift_id, worker_id, status)
  VALUES (app1_id, shift_open1_id, worker1_id, 'approved')
  ON CONFLICT DO NOTHING;

  -- Filled shift: two approved applications
  INSERT INTO public.applications (id, shift_id, worker_id, status)
  VALUES (app2_id, shift_filled_id, worker1_id, 'approved')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.applications (id, shift_id, worker_id, status)
  VALUES (app3_id, shift_filled_id, worker2_id, 'approved')
  ON CONFLICT DO NOTHING;

  -- Completed shift 1: two approved + checked in/out applications
  INSERT INTO public.applications (id, shift_id, worker_id, status, checked_in_at, checked_out_at, hours_worked)
  VALUES (
    app4_id, shift_done1_id, worker1_id, 'approved',
    now() - interval '3 days',
    now() - interval '3 days' + interval '8 hours',
    8.00
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.applications (id, shift_id, worker_id, status, checked_in_at, checked_out_at, hours_worked)
  VALUES (
    app5_id, shift_done1_id, worker2_id, 'approved',
    now() - interval '3 days',
    now() - interval '3 days' + interval '8 hours',
    8.00
  ) ON CONFLICT DO NOTHING;


  -- ─────────────────────────────────────────
  -- TRANSACTIONS (for completed shifts)
  -- ─────────────────────────────────────────

  INSERT INTO public.transactions (
    application_id, worker_id, business_id,
    amount, platform_fee, net_amount,
    payment_method, status, payment_reference, completed_at
  ) VALUES (
    app4_id, worker1_id, biz_id,
    960.00, 48.00, 912.00,   -- 120/hr × 8hrs, 5% fee
    'gcash', 'completed',
    'REF-' || to_char(now() - interval '2 days', 'YYYYMMDD') || '-001',
    now() - interval '2 days'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.transactions (
    application_id, worker_id, business_id,
    amount, platform_fee, net_amount,
    payment_method, status, payment_reference, completed_at
  ) VALUES (
    app5_id, worker2_id, biz_id,
    960.00, 48.00, 912.00,
    'maya', 'completed',
    'REF-' || to_char(now() - interval '2 days', 'YYYYMMDD') || '-002',
    now() - interval '2 days'
  ) ON CONFLICT DO NOTHING;


  -- ─────────────────────────────────────────
  -- RATINGS (workers rated after completed shift)
  -- ─────────────────────────────────────────

  INSERT INTO public.ratings (application_id, rater_id, rated_id, score, comment)
  VALUES (app4_id, biz_owner_id, worker1_id, 5, 'Very reliable and hardworking. Will hire again!')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.ratings (application_id, rater_id, rated_id, score, comment)
  VALUES (app5_id, biz_owner_id, worker2_id, 4, 'Good attitude, punctual. Recommended.')
  ON CONFLICT DO NOTHING;


  -- ─────────────────────────────────────────
  -- BULACAN BUSINESS (Malis, Guiguinto)
  -- ─────────────────────────────────────────

  -- Auth user
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES (
    bul_owner_id,
    '00000000-0000-0000-0000-000000000000',
    'bulacan@staffstream.ph',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Carlo Mendoza","role":"business","phone":"+639221234567"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Profile
  UPDATE public.profiles SET
    role       = 'business',
    phone      = '+639221234567',
    city       = 'Guiguinto',
    location   = ST_Point(120.8812, 14.8348)::geography,
    kyc_status = 'verified',
    is_active  = true
  WHERE id = bul_owner_id;

  -- Business
  INSERT INTO public.businesses (id, owner_id, name, description, industry, address, location, city, is_verified)
  VALUES (
    bul_biz_id,
    bul_owner_id,
    'Mendoza Rice Trading',
    'Family-owned rice trading and distribution business serving Bulacan and nearby provinces.',
    'Agriculture / Logistics',
    'Purok 3, Malis, Guiguinto, Bulacan',
    ST_Point(120.8812, 14.8348)::geography,
    'Guiguinto',
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Shift 1: open — warehouse sorting
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, qr_code)
  VALUES (
    bul_shift1_id, bul_biz_id,
    'Rice Sack Sorter',
    'Sort and stack 50kg rice sacks in our warehouse. Physical work — must be able to lift heavy loads. Meals provided.',
    'Warehouse Staff', null, 4, 0,
    100.00,
    now() + interval '1 day',
    now() + interval '1 day' + interval '8 hours',
    'open',
    ST_Point(120.8812, 14.8348)::geography,
    'Purok 3, Malis, Guiguinto, Bulacan',
    gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Shift 2: open — delivery assist
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, qr_code)
  VALUES (
    bul_shift2_id, bul_biz_id,
    'Delivery Assistant',
    'Assist our driver in unloading and delivering rice sacks to sari-sari stores and market vendors in Bulacan.',
    'Delivery Helper', null, 2, 0,
    110.00,
    now() + interval '2 days',
    now() + interval '2 days' + interval '9 hours',
    'open',
    ST_Point(120.8812, 14.8348)::geography,
    'Purok 3, Malis, Guiguinto, Bulacan',
    gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Shift 3: completed — inventory count
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, qr_code)
  VALUES (
    bul_shift3_id, bul_biz_id,
    'Inventory Counter',
    'End-of-month stock count. Count and record all rice varieties in the bodega. Attention to detail required.',
    'Inventory Staff', null, 2, 2,
    105.00,
    now() - interval '4 days',
    now() - interval '4 days' + interval '6 hours',
    'completed',
    ST_Point(120.8812, 14.8348)::geography,
    'Purok 3, Malis, Guiguinto, Bulacan',
    gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;


  RAISE NOTICE '─────────────────────────────────────────';
  RAISE NOTICE 'Seed complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Business login:';
  RAISE NOTICE '  Email:    business@staffstream.ph';
  RAISE NOTICE '  Password: Password123!';
  RAISE NOTICE '';
  RAISE NOTICE 'Worker logins (all use Password123!):';
  RAISE NOTICE '  juan@staffstream.ph';
  RAISE NOTICE '  ana@staffstream.ph';
  RAISE NOTICE '  pedro@staffstream.ph';
  RAISE NOTICE '';
  RAISE NOTICE 'Bulacan business login:';
  RAISE NOTICE '  Email:    bulacan@staffstream.ph';
  RAISE NOTICE '  Password: Password123!';
  RAISE NOTICE '  Location: Malis, Guiguinto, Bulacan';
  RAISE NOTICE '─────────────────────────────────────────';

END $$;
