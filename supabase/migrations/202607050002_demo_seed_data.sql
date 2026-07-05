-- ============================================================================
-- Way Ahead GymOS v2.0 — Enterprise Sales-Demo Dataset Seeding
-- Migration / Seed File: 202607050002_demo_seed_data.sql
-- Creates a realistic, high-value enterprise sales demo environment for:
-- Way Ahead Fitness (Growth Tier, ₹4,85,000 MRR, 347 Members, 12 Trainers, 2 Branches)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. SCHEMA SAFETY CHECKS (Ensure remote db has all required columns)
-- ----------------------------------------------------------------------------
ALTER TABLE public.gyms 
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'Starter';

ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS preferred_time text,
  ADD COLUMN IF NOT EXISTS lead_score text DEFAULT 'Cold',
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'Manual',
  ADD COLUMN IF NOT EXISTS goal text;

ALTER TABLE public.member_conversions 
  ADD COLUMN IF NOT EXISTS commission_amount numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS days_to_convert integer;

ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS current_period_start timestamp with time zone,
  ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone;

-- ----------------------------------------------------------------------------
-- 0.1 SAFE AUTH USER SEEDING (Demo Account: demo@wayaheadgym.com / password)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES 
    ('22222222-2222-2222-2222-222222222201', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo@wayaheadgym.com', '$2a$10$4r8P.6W.L/3Z1.t9/5xY..8r1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Arun Kumar (Owner)"}'::jsonb, now(), now()),
    ('22222222-2222-2222-2222-222222222202', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manager@wayaheadgym.com', '$2a$10$4r8P.6W.L/3Z1.t9/5xY..8r1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Rajesh Rao (Manager)"}'::jsonb, now(), now()),
    ('22222222-2222-2222-2222-222222222203', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sales1@wayaheadgym.com', '$2a$10$4r8P.6W.L/3Z1.t9/5xY..8r1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Neha Malhotra (Sales)"}'::jsonb, now(), now()),
    ('22222222-2222-2222-2222-222222222204', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sales2@wayaheadgym.com', '$2a$10$4r8P.6W.L/3Z1.t9/5xY..8r1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Karan Singhania (Sales)"}'::jsonb, now(), now()),
    ('22222222-2222-2222-2222-222222222205', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'trainer1@wayaheadgym.com', '$2a$10$4r8P.6W.L/3Z1.t9/5xY..8r1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Vikram Singh (Trainer)"}'::jsonb, now(), now()),
    ('22222222-2222-2222-2222-222222222206', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'trainer2@wayaheadgym.com', '$2a$10$4r8P.6W.L/3Z1.t9/5xY..8r1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Anjali Sharma (Trainer)"}'::jsonb, now(), now()),
    ('22222222-2222-2222-2222-222222222207', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'trainer3@wayaheadgym.com', '$2a$10$4r8P.6W.L/3Z1.t9/5xY..8r1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"David Miller (Trainer)"}'::jsonb, now(), now()),
    ('22222222-2222-2222-2222-222222222208', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'frontdesk@wayaheadgym.com', '$2a$10$4r8P.6W.L/3Z1.t9/5xY..8r1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Simran Kaur (Front Desk)"}'::jsonb, now(), now())
  ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping direct auth.users insert: %', SQLERRM;
END
$$;

-- ----------------------------------------------------------------------------
-- 1. DEMO GYM (Way Ahead Fitness)
-- ----------------------------------------------------------------------------
INSERT INTO public.gyms (id, name, phone, website, email, industry, plan, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Way Ahead Fitness',
  '+91 98765 43210',
  'https://wayaheadfitness.com',
  'contact@wayaheadfitness.com',
  'Fitness Center',
  'Growth',
  now() - interval '90 days'
) ON CONFLICT (id) DO UPDATE SET name = 'Way Ahead Fitness', plan = 'Growth';

-- ----------------------------------------------------------------------------
-- 2. STAFF TEAM (8 Members: Owner, Manager, 2 Sales, 3 Trainers, Front Desk)
-- ----------------------------------------------------------------------------
INSERT INTO public.users (id, auth_user_id, gym_id, email, name, role, created_at)
VALUES
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'demo@wayaheadgym.com', 'Arun Kumar (Owner)', 'owner', now() - interval '90 days'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'manager@wayaheadgym.com', 'Rajesh Rao (Manager)', 'manager', now() - interval '85 days'),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'sales1@wayaheadgym.com', 'Neha Malhotra (Sales)', 'manager', now() - interval '80 days'),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 'sales2@wayaheadgym.com', 'Karan Singhania (Sales)', 'manager', now() - interval '75 days'),
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111', 'trainer1@wayaheadgym.com', 'Vikram Singh (Head Trainer)', 'trainer', now() - interval '70 days'),
  ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111111', 'trainer2@wayaheadgym.com', 'Anjali Sharma (Trainer)', 'trainer', now() - interval '65 days'),
  ('33333333-3333-3333-3333-333333333307', '22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111111', 'trainer3@wayaheadgym.com', 'David Miller (Trainer)', 'trainer', now() - interval '60 days'),
  ('33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111111', 'frontdesk@wayaheadgym.com', 'Simran Kaur (Front Desk)', 'frontdesk', now() - interval '50 days')
ON CONFLICT DO NOTHING;

UPDATE public.users SET name = 'Arun Kumar (Owner)', role = 'owner', gym_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'demo@wayaheadgym.com' OR auth_user_id = '22222222-2222-2222-2222-222222222201';
UPDATE public.users SET name = 'Rajesh Rao (Manager)', role = 'manager', gym_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'manager@wayaheadgym.com' OR auth_user_id = '22222222-2222-2222-2222-222222222202';
UPDATE public.users SET name = 'Neha Malhotra (Sales)', role = 'manager', gym_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'sales1@wayaheadgym.com' OR auth_user_id = '22222222-2222-2222-2222-222222222203';
UPDATE public.users SET name = 'Karan Singhania (Sales)', role = 'manager', gym_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'sales2@wayaheadgym.com' OR auth_user_id = '22222222-2222-2222-2222-222222222204';
UPDATE public.users SET name = 'Vikram Singh (Head Trainer)', role = 'trainer', gym_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'trainer1@wayaheadgym.com' OR auth_user_id = '22222222-2222-2222-2222-222222222205';
UPDATE public.users SET name = 'Anjali Sharma (Trainer)', role = 'trainer', gym_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'trainer2@wayaheadgym.com' OR auth_user_id = '22222222-2222-2222-2222-222222222206';
UPDATE public.users SET name = 'David Miller (Trainer)', role = 'trainer', gym_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'trainer3@wayaheadgym.com' OR auth_user_id = '22222222-2222-2222-2222-222222222207';
UPDATE public.users SET name = 'Simran Kaur (Front Desk)', role = 'frontdesk', gym_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'frontdesk@wayaheadgym.com' OR auth_user_id = '22222222-2222-2222-2222-222222222208';

INSERT INTO public.team_members (id, gym_id, user_id, title, department, status, joined_at)
SELECT
  gen_random_uuid(), '11111111-1111-1111-1111-111111111111', u.id, t.title, t.dept, 'active', now() - interval '50 days'
FROM (VALUES
  ('22222222-2222-2222-2222-222222222201', 'Founder & Owner', 'Management'),
  ('22222222-2222-2222-2222-222222222202', 'General Manager', 'Operations'),
  ('22222222-2222-2222-2222-222222222203', 'Senior Sales Executive', 'Sales & Marketing'),
  ('22222222-2222-2222-2222-222222222204', 'Sales Executive', 'Sales & Marketing'),
  ('22222222-2222-2222-2222-222222222205', 'Head Fitness Coach', 'Training'),
  ('22222222-2222-2222-2222-222222222206', 'CrossFit & HIIT Specialist', 'Training'),
  ('22222222-2222-2222-2222-222222222207', 'Personal Trainer', 'Training'),
  ('22222222-2222-2222-2222-222222222208', 'Front Desk Executive', 'Administration')
) AS t(auth_id, title, dept)
JOIN public.users u ON u.auth_user_id::text = t.auth_id
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. LEADS (20 Leads distributed across all stages)
-- ----------------------------------------------------------------------------
INSERT INTO public.leads (id, gym_id, name, phone, email, goal, budget, preferred_time, status, lead_score, source, created_at)
VALUES
  -- 4 New Leads
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111111', 'Rahul Sharma', '+91 98111 11101', 'rahul.s@gmail.com', 'Weight Loss', '₹20,000/yr', 'Morning (6-8 AM)', 'New', 'Hot', 'Instagram', now() - interval '2 hours'),
  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111111', 'Priya Singh', '+91 98111 11102', 'priya.singh@yahoo.com', 'Muscle Gain', '₹25,000/yr', 'Evening (6-8 PM)', 'New', 'Warm', 'Google', now() - interval '5 hours'),
  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111111', 'Arjun Verma', '+91 98111 11103', 'arjun.v@outlook.com', 'CrossFit & Endurance', '₹30,000/yr', 'Morning (6-8 AM)', 'New', 'Hot', 'Referral', now() - interval '1 day'),
  ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111111', 'Sneha Gupta', '+91 98111 11104', 'sneha.g@gmail.com', 'General Fitness', '₹18,000/yr', 'Afternoon (12-4 PM)', 'New', 'Cold', 'Walk-in', now() - interval '1 day'),
  -- 3 Contacted
  ('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111111', 'Vikram Rathore', '+91 98111 11105', 'vikram.r@gmail.com', 'Bodybuilding', '₹35,000/yr', 'Evening (6-8 PM)', 'Contacted', 'Hot', 'Instagram', now() - interval '2 days'),
  ('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111111', 'Ananya Iyer', '+91 98111 11106', 'ananya.i@gmail.com', 'Weight Loss & HIIT', '₹22,000/yr', 'Morning (6-8 AM)', 'Contacted', 'Warm', 'Google', now() - interval '3 days'),
  ('44444444-4444-4444-4444-444444444407', '11111111-1111-1111-1111-111111111111', 'Rohit Mehta', '+91 98111 11107', 'rohit.mehta@gmail.com', 'Cardio & Flexibility', '₹20,000/yr', 'Evening (8-10 PM)', 'Contacted', 'Cold', 'Instagram', now() - interval '4 days'),
  -- 3 Qualified
  ('44444444-4444-4444-4444-444444444408', '11111111-1111-1111-1111-111111111111', 'Pooja Nair', '+91 98111 11108', 'pooja.n@gmail.com', 'Personal Training', '₹45,000/yr', 'Morning (6-8 AM)', 'Qualified', 'Hot', 'Referral', now() - interval '5 days'),
  ('44444444-4444-4444-4444-444444444409', '11111111-1111-1111-1111-111111111111', 'Kabir Bedi', '+91 98111 11109', 'kabir.b@gmail.com', 'Strength Training', '₹25,000/yr', 'Evening (6-8 PM)', 'Qualified', 'Warm', 'Google', now() - interval '6 days'),
  ('44444444-4444-4444-4444-444444444410', '11111111-1111-1111-1111-111111111111', 'Simran Kaur', '+91 98111 11110', 'simran.k@gmail.com', 'Weight Loss', '₹20,000/yr', 'Morning (8-10 AM)', 'Qualified', 'Hot', 'Instagram', now() - interval '7 days'),
  -- 2 Interested
  ('44444444-4444-4444-4444-444444444411', '11111111-1111-1111-1111-111111111111', 'Karan Johar', '+91 98111 11111', 'karan.j@gmail.com', 'VIP Studio Training', '₹50,000/yr', 'Morning (10-12 AM)', 'Interested', 'Hot', 'Referral', now() - interval '8 days'),
  ('44444444-4444-4444-4444-444444444412', '11111111-1111-1111-1111-111111111111', 'Neha Dhupia', '+91 98111 11112', 'neha.d@gmail.com', 'Post-Natal Fitness', '₹30,000/yr', 'Afternoon (12-4 PM)', 'Interested', 'Warm', 'Google', now() - interval '9 days'),
  -- 3 Trial Booked
  ('44444444-4444-4444-4444-444444444413', '11111111-1111-1111-1111-111111111111', 'Amit Patel', '+91 98111 11113', 'amit.patel@gmail.com', 'Muscle Gain', '₹25,000/yr', 'Evening (6-8 PM)', 'Trial Booked', 'Hot', 'Instagram', now() - interval '10 days'),
  ('44444444-4444-4444-4444-444444444414', '11111111-1111-1111-1111-111111111111', 'Ritu Sharma', '+91 98111 11114', 'ritu.s@gmail.com', 'Zumba & Aerobics', '₹18,000/yr', 'Morning (8-10 AM)', 'Trial Booked', 'Hot', 'Walk-in', now() - interval '11 days'),
  ('44444444-4444-4444-4444-444444444415', '11111111-1111-1111-1111-111111111111', 'Vikas Khanna', '+91 98111 11115', 'vikas.k@gmail.com', 'Weight Loss', '₹22,000/yr', 'Evening (6-8 PM)', 'Trial Booked', 'Warm', 'Google', now() - interval '12 days'),
  -- 2 Trial Completed
  ('44444444-4444-4444-4444-444444444416', '11111111-1111-1111-1111-111111111111', 'Deepak Chopra', '+91 98111 11116', 'deepak.c@gmail.com', 'Yoga & Flexibility', '₹20,000/yr', 'Morning (6-8 AM)', 'Trial Completed', 'Hot', 'Referral', now() - interval '14 days'),
  ('44444444-4444-4444-4444-444444444417', '11111111-1111-1111-1111-111111111111', 'Meera Bai', '+91 98111 11117', 'meera.b@gmail.com', 'General Fitness', '₹15,000/yr', 'Evening (4-6 PM)', 'Trial Completed', 'Warm', 'Instagram', now() - interval '15 days'),
  -- 1 Negotiation
  ('44444444-4444-4444-4444-444444444418', '11111111-1111-1111-1111-111111111111', 'Sanjay Dutt', '+91 98111 11118', 'sanjay.d@gmail.com', 'Heavy Weightlifting', '₹40,000/yr', 'Evening (6-8 PM)', 'Negotiation', 'Hot', 'Walk-in', now() - interval '16 days'),
  -- 1 Joined
  ('44444444-4444-4444-4444-444444444419', '11111111-1111-1111-1111-111111111111', 'Suresh Raina', '+91 98111 11119', 'suresh.r@gmail.com', 'Athletic Conditioning', '₹35,000/yr', 'Morning (6-8 AM)', 'Joined', 'Hot', 'Referral', now() - interval '18 days'),
  -- 1 Lost
  ('44444444-4444-4444-4444-444444444420', '11111111-1111-1111-1111-111111111111', 'Anita Desai', '+91 98111 11120', 'anita.d@gmail.com', 'General Fitness', '₹15,000/yr', 'Evening (6-8 PM)', 'Lost', 'Cold', 'Google', now() - interval '20 days')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, lead_score = EXCLUDED.lead_score;

-- ----------------------------------------------------------------------------
-- 4. TRIAL BOOKINGS (10 Bookings: 7 Attended, 2 Scheduled, 1 No-Show)
-- ----------------------------------------------------------------------------
INSERT INTO public.trial_bookings (id, gym_id, lead_id, scheduled_time, status, trainer_id, notes, created_at)
VALUES
  -- 7 Attended
  ('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444416', now() - interval '3 days', 'ATTENDED', '22222222-2222-2222-2222-222222222205', 'Loved the Yoga session. Rating: 5/5. High chance of closing.', now() - interval '5 days'),
  ('66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444417', now() - interval '4 days', 'ATTENDED', '22222222-2222-2222-2222-222222222206', 'Good endurance. Interested in semi-annual plan. Rating: 4/5.', now() - interval '6 days'),
  ('66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444418', now() - interval '5 days', 'ATTENDED', '22222222-2222-2222-2222-222222222205', 'Beast mode workout. Negotiating VIP package. Rating: 5/5.', now() - interval '7 days'),
  ('66666666-6666-6666-6666-666666666604', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444419', now() - interval '6 days', 'ATTENDED', '22222222-2222-2222-2222-222222222207', 'Super fit athlete. Converted immediately! Rating: 5/5.', now() - interval '8 days'),
  ('66666666-6666-6666-6666-666666666605', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444408', now() - interval '7 days', 'ATTENDED', '22222222-2222-2222-2222-222222222205', 'Personal training trial completed. Rating: 5/5.', now() - interval '9 days'),
  ('66666666-6666-6666-6666-666666666606', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444409', now() - interval '8 days', 'ATTENDED', '22222222-2222-2222-2222-222222222206', 'Good session. Rating: 4/5.', now() - interval '10 days'),
  ('66666666-6666-6666-6666-666666666607', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444410', now() - interval '9 days', 'ATTENDED', '22222222-2222-2222-2222-222222222207', 'Enthusiastic about weight loss. Rating: 5/5.', now() - interval '11 days'),
  -- 2 Scheduled (Future)
  ('66666666-6666-6666-6666-666666666608', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444413', now() + interval '1 day', 'SCHEDULED', '22222222-2222-2222-2222-222222222205', 'Studio A - CrossFit Introduction.', now() - interval '1 day'),
  ('66666666-6666-6666-6666-666666666609', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444414', now() + interval '2 days', 'SCHEDULED', '22222222-2222-2222-2222-222222222206', 'Studio B - Zumba trial session.', now() - interval '2 days'),
  -- 1 No-Show
  ('66666666-6666-6666-6666-666666666610', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444415', now() - interval '1 day', 'NO_SHOW', '22222222-2222-2222-2222-222222222207', 'Candidate did not pick up call.', now() - interval '3 days')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes;

-- ----------------------------------------------------------------------------
-- 5. MEMBER CONVERSIONS (5 High-Value Conversions)
-- ----------------------------------------------------------------------------
INSERT INTO public.member_conversions (id, gym_id, lead_id, trial_id, sales_person_id, plan_sold, revenue_amount, commission_amount, days_to_convert, converted_at)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444419', '66666666-6666-6666-6666-666666666604', '22222222-2222-2222-2222-222222222203', 'Gold Annual Membership', 24999.00, 2500.00, 12, now() - interval '5 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444408', '66666666-6666-6666-6666-666666666605', '22222222-2222-2222-2222-222222222203', 'VIP Platinum Annual + PT', 49999.00, 5000.00, 8, now() - interval '10 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444409', '66666666-6666-6666-6666-666666666606', '22222222-2222-2222-2222-222222222204', 'Silver Semi-Annual', 14999.00, 1500.00, 15, now() - interval '15 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444410', '66666666-6666-6666-6666-666666666607', '22222222-2222-2222-2222-222222222204', 'Personal Training 24-Pack', 19999.00, 2000.00, 5, now() - interval '20 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444416', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222203', 'Couples Platinum Annual', 34999.00, 3500.00, 10, now() - interval '25 days')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. TASKS (25 Tasks across Pending, In Progress, Completed)
-- ----------------------------------------------------------------------------
INSERT INTO public.tasks (id, gym_id, lead_id, title, description, due_date, priority, status, assigned_to, created_at)
VALUES
  -- Pending
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444401', 'Call Rahul Sharma', 'Initial qualification call for Weight Loss program.', now() + interval '2 hours', 'urgent', 'pending', '22222222-2222-2222-2222-222222222203', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444402', 'Follow up trial member Priya', 'Discuss evening batch timings and membership offer.', now() + interval '4 hours', 'high', 'pending', '22222222-2222-2222-2222-222222222204', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444403', 'Assign trainer for Arjun', 'Connect with Trainer Vikram for endurance screening.', now() + interval '1 day', 'medium', 'pending', '22222222-2222-2222-2222-222222222202', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444418', 'Close negotiation with Sanjay', 'Offer 10% annual discount if closed by Friday.', now() + interval '1 day', 'urgent', 'pending', '22222222-2222-2222-2222-222222222203', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444413', 'Confirm trial slot for Amit', 'Send Studio A location guide and parking instructions.', now() + interval '12 hours', 'high', 'pending', '22222222-2222-2222-2222-222222222208', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', NULL, 'Renew maintenance contract', 'Treadmill servicing schedule for Branch 1.', now() + interval '3 days', 'medium', 'pending', '22222222-2222-2222-2222-222222222202', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', NULL, 'Order protein supplement stock', 'Restock Whey Protein isolate for nutrition bar.', now() + interval '2 days', 'low', 'pending', '22222222-2222-2222-2222-222222222208', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444411', 'Send VIP brochure to Karan', 'WhatsApp corporate wellness proposal PDF.', now() + interval '6 hours', 'high', 'pending', '22222222-2222-2222-2222-222222222204', now()),
  -- In Progress
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444405', 'Draft nutrition plan for Vikram R.', 'Custom bodybuilding diet chart preparation.', now() + interval '1 day', 'high', 'in_progress', '22222222-2222-2222-2222-222222222205', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444406', 'Schedule fitness assessment for Ananya', 'Coordinate morning slot with Trainer Anjali.', now() + interval '12 hours', 'medium', 'in_progress', '22222222-2222-2222-2222-222222222206', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', NULL, 'Update Instagram transformations feed', 'Post monthly member success stories.', now() + interval '2 days', 'low', 'in_progress', '22222222-2222-2222-2222-222222222203', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444414', 'Prepare Zumba trial welcome kit', 'Keep t-shirt and shaker bottle ready at reception.', now() + interval '1 day', 'medium', 'in_progress', '22222222-2222-2222-2222-222222222208', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', NULL, 'Review quarterly sales commissions', 'Verify payouts for Neha and Karan.', now() + interval '4 days', 'urgent', 'in_progress', '22222222-2222-2222-2222-222222222201', now()),
  -- Completed
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444419', 'Onboard new member Suresh Raina', 'Issue RFID keycard and complete biometrics setup.', now() - interval '1 day', 'urgent', 'completed', '22222222-2222-2222-2222-222222222208', now() - interval '3 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444416', 'Conduct trial for Deepak Chopra', 'Yoga flexibility assessment.', now() - interval '3 days', 'high', 'completed', '22222222-2222-2222-2222-222222222205', now() - interval '5 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444408', 'Send payment receipt to Pooja', 'Email GST invoice for Platinum membership.', now() - interval '4 days', 'medium', 'completed', '22222222-2222-2222-2222-222222222208', now() - interval '6 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', NULL, 'Monthly fire safety audit', 'Check extinguishers across both branches.', now() - interval '5 days', 'medium', 'completed', '22222222-2222-2222-2222-222222222202', now() - interval '7 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444409', 'PT Session 1: Kabir Bedi', 'Upper body hypertrophy initiation.', now() - interval '6 days', 'high', 'completed', '22222222-2222-2222-2222-222222222206', now() - interval '8 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444410', 'Diet consultation: Simran Kaur', 'Calorie deficit planning.', now() - interval '7 days', 'medium', 'completed', '22222222-2222-2222-2222-222222222207', now() - interval '9 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', NULL, 'Staff weekly training meeting', 'Discuss sales objections and closing techniques.', now() - interval '8 days', 'low', 'completed', '22222222-2222-2222-2222-222222222201', now() - interval '10 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444415', 'Follow up missed trial: Vikas', 'Call to reschedule HIIT session.', now() - interval '9 days', 'high', 'completed', '22222222-2222-2222-2222-222222222203', now() - interval '11 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', NULL, 'Bio-impedance scale calibration', 'Studio A body fat analyzer maintenance.', now() - interval '10 days', 'low', 'completed', '22222222-2222-2222-2222-222222222205', now() - interval '12 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444412', 'Initial inquiry response: Neha', 'Send post-natal fitness class schedule.', now() - interval '11 days', 'medium', 'completed', '22222222-2222-2222-2222-222222222204', now() - interval '13 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', NULL, 'Vendor payment processing', 'Clear laundry service invoice for towels.', now() - interval '12 days', 'urgent', 'completed', '22222222-2222-2222-2222-222222222202', now() - interval '14 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444420', 'Final re-engagement attempt: Anita', 'Send special 48-hour discount voucher.', now() - interval '15 days', 'low', 'completed', '22222222-2222-2222-2222-222222222203', now() - interval '17 days')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. WORKFLOWS (3 Active Automated Workflows)
-- ----------------------------------------------------------------------------
INSERT INTO public.workflow_definitions (id, gym_id, name, description, trigger_type, is_active, created_at)
VALUES
  ('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111111', 'New Lead Followup Sequence', 'Instant WhatsApp greeting, 2-hour delay email, and task creation for sales team.', 'lead_created', true, now() - interval '60 days'),
  ('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111111', 'VIP Trial Reminder Pipeline', 'Automated WhatsApp confirmation 24h before trial and SMS alert 2 hours before session.', 'trial_booked', true, now() - interval '50 days'),
  ('55555555-5555-5555-5555-555555555503', '11111111-1111-1111-1111-111111111111', 'Membership Renewal & Retention', 'Sends automated renewal invoice 7 days prior to expiry and alerts account manager.', 'manual', true, now() - interval '40 days')
ON CONFLICT (id) DO UPDATE SET is_active = true;

-- ----------------------------------------------------------------------------
-- 8. NOTIFICATIONS (10 System Notifications)
-- ----------------------------------------------------------------------------
INSERT INTO public.notifications (id, gym_id, recipient_id, title, message, type, is_read, created_at)
SELECT
  gen_random_uuid(), '11111111-1111-1111-1111-111111111111', u.id, n.title, n.message, n.type, n.is_read, now() - interval '1 hour'
FROM (VALUES
  ('22222222-2222-2222-2222-222222222201', 'High-Value Lead Captured', 'New lead Rahul Sharma (₹20k/yr budget) generated via Instagram campaign.', 'lead_assigned', false),
  ('22222222-2222-2222-2222-222222222201', 'VIP Trial Confirmed', 'Amit Patel scheduled for CrossFit intro session tomorrow at 6:00 PM.', 'trial_reminder', false),
  ('22222222-2222-2222-2222-222222222201', 'Payment Received: ₹24,999', 'Suresh Raina completed Gold Annual Membership payment via Razorpay UPI.', 'system_alert', true),
  ('22222222-2222-2222-2222-222222222203', 'Task Overdue Warning', 'Call Rahul Sharma task has passed initial response SLA.', 'system_alert', false),
  ('22222222-2222-2222-2222-222222222201', 'Workflow Execution Success', 'New Lead Followup triggered 14 automated messages today.', 'system_alert', true),
  ('22222222-2222-2222-2222-222222222202', 'Membership Renewal Due', '5 member contracts are up for renewal within the next 7 days.', 'renewal_due', false),
  ('22222222-2222-2222-2222-222222222205', 'New Trial Roster Assigned', 'You have 3 VIP trial workouts assigned for this week.', 'trial_reminder', true),
  ('22222222-2222-2222-2222-222222222201', 'Monthly Revenue Milestone', 'Way Ahead Fitness crossed ₹4,85,000 MRR for this billing cycle!', 'system_alert', true),
  ('22222222-2222-2222-2222-222222222204', 'Lead Re-assigned', 'Lead Karan Johar transferred to your sales pipeline.', 'lead_assigned', true),
  ('22222222-2222-2222-2222-222222222201', 'System ETL Sync Completed', 'Data warehouse star schema synced 428 records with zero anomalies.', 'system_alert', true)
) AS n(auth_id, title, message, type, is_read)
JOIN public.users u ON u.auth_user_id::text = n.auth_id
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. ANALYTICS DATA (30d, 90d, 12m Snapshots & Fact Revenue)
-- ----------------------------------------------------------------------------
INSERT INTO public.analytics_snapshots (gym_id, snapshot_type, snapshot_date, data, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'funnel_daily', CURRENT_DATE, '{"New": 4, "Contacted": 3, "Qualified": 3, "Interested": 2, "Trial Booked": 3, "Trial Completed": 2, "Negotiation": 1, "Joined": 1, "Lost": 1}'::jsonb, now()),
  ('11111111-1111-1111-1111-111111111111', 'revenue_monthly', CURRENT_DATE, '{"mrr": 485000, "arr": 5820000, "cac": 1850, "ltv": 48500, "roas": 4.2, "growth_rate": 14.5}'::jsonb, now()),
  ('11111111-1111-1111-1111-111111111111', 'retention_cohort', CURRENT_DATE, '{"active_members": 347, "at_risk_members": 12, "churn_rate": 2.1, "retention_30d": 96.5, "retention_90d": 91.2, "retention_12m": 84.0}'::jsonb, now()),
  -- 30 days ago
  ('11111111-1111-1111-1111-111111111111', 'revenue_monthly', CURRENT_DATE - interval '30 days', '{"mrr": 442000, "arr": 5304000, "cac": 1920, "ltv": 46000, "roas": 3.9, "growth_rate": 12.1}'::jsonb, now() - interval '30 days'),
  -- 90 days ago
  ('11111111-1111-1111-1111-111111111111', 'revenue_monthly', CURRENT_DATE - interval '90 days', '{"mrr": 385000, "arr": 4620000, "cac": 2100, "ltv": 42500, "roas": 3.5, "growth_rate": 10.8}'::jsonb, now() - interval '90 days')
ON CONFLICT (gym_id, snapshot_type, snapshot_date) DO UPDATE SET data = EXCLUDED.data;

-- ----------------------------------------------------------------------------
-- 10. BILLING (Demo Subscription: Plan Growth, ₹4,999 MRR, Renewal Aug 2026)
-- ----------------------------------------------------------------------------
INSERT INTO public.subscriptions (id, gym_id, plan, status, current_period_start, current_period_end, created_at)
VALUES (
  '66666666-6666-6666-6666-666666666601',
  '11111111-1111-1111-1111-111111111111',
  'Growth',
  'active',
  now() - interval '15 days',
  '2026-08-15 00:00:00+00',
  now() - interval '15 days'
) ON CONFLICT (id) DO UPDATE SET plan = 'Growth', status = 'active', current_period_end = '2026-08-15 00:00:00+00';
