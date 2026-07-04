-- =====================================================
-- GymOS Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. GYMS (Tenant Root)
CREATE TABLE IF NOT EXISTS public.gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  website text,
  email text,
  industry text,
  plan text DEFAULT 'Starter',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. USERS (Maps auth user to tenant)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  gym_id uuid REFERENCES public.gyms,
  email text NOT NULL,
  role text DEFAULT 'owner',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. LEADS
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  goal text,
  budget text,
  preferred_time text,
  status text DEFAULT 'New',
  lead_score text DEFAULT 'Cold',
  source text DEFAULT 'Manual',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TEMPLATES
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  template_type text NOT NULL,
  name text NOT NULL,
  channel text NOT NULL,  -- 'email', 'whatsapp', 'both'
  subject text,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. AUTOMATION LOGS
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  lead_id uuid REFERENCES public.leads NOT NULL,
  template_id uuid REFERENCES public.templates,
  channel text NOT NULL,
  status text NOT NULL,
  message_preview text,
  delivery_response text,
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. FOLLOW-UP SEQUENCES
CREATE TABLE IF NOT EXISTS public.follow_up_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FOLLOW-UP STEPS
CREATE TABLE IF NOT EXISTS public.follow_up_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES public.follow_up_sequences NOT NULL,
  template_id uuid REFERENCES public.templates NOT NULL,
  delay_days integer NOT NULL DEFAULT 0,
  order_number integer NOT NULL DEFAULT 1
);

-- =====================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Helper function: get the gym_id for the current auth user
CREATE OR REPLACE FUNCTION public.get_user_gym_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT gym_id FROM public.users WHERE auth_user_id = auth.uid();
$$;

-- Enable RLS on all tenant tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_steps ENABLE ROW LEVEL SECURITY;

-- LEADS policies
CREATE POLICY "Users can view their gym leads" ON public.leads
  FOR SELECT USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can insert leads for their gym" ON public.leads
  FOR INSERT WITH CHECK (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can update their gym leads" ON public.leads
  FOR UPDATE USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can delete their gym leads" ON public.leads
  FOR DELETE USING (gym_id = public.get_user_gym_id());

-- TEMPLATES policies
CREATE POLICY "Users can view their gym templates" ON public.templates
  FOR SELECT USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can insert templates for their gym" ON public.templates
  FOR INSERT WITH CHECK (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can update their gym templates" ON public.templates
  FOR UPDATE USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can delete their gym templates" ON public.templates
  FOR DELETE USING (gym_id = public.get_user_gym_id());

-- AUTOMATION LOGS policies
CREATE POLICY "Users can view their gym automation logs" ON public.automation_logs
  FOR SELECT USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can insert automation logs for their gym" ON public.automation_logs
  FOR INSERT WITH CHECK (gym_id = public.get_user_gym_id());

-- SEQUENCES policies
CREATE POLICY "Users can view their gym sequences" ON public.follow_up_sequences
  FOR SELECT USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can insert sequences for their gym" ON public.follow_up_sequences
  FOR INSERT WITH CHECK (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can update their gym sequences" ON public.follow_up_sequences
  FOR UPDATE USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can delete their gym sequences" ON public.follow_up_sequences
  FOR DELETE USING (gym_id = public.get_user_gym_id());

-- STEPS policies (join through sequence)
CREATE POLICY "Users can view steps of their sequences" ON public.follow_up_steps
  FOR SELECT USING (
    sequence_id IN (SELECT id FROM public.follow_up_sequences WHERE gym_id = public.get_user_gym_id())
  );
CREATE POLICY "Users can insert steps to their sequences" ON public.follow_up_steps
  FOR INSERT WITH CHECK (
    sequence_id IN (SELECT id FROM public.follow_up_sequences WHERE gym_id = public.get_user_gym_id())
  );
CREATE POLICY "Users can update steps of their sequences" ON public.follow_up_steps
  FOR UPDATE USING (
    sequence_id IN (SELECT id FROM public.follow_up_sequences WHERE gym_id = public.get_user_gym_id())
  );
CREATE POLICY "Users can delete steps of their sequences" ON public.follow_up_steps
  FOR DELETE USING (
    sequence_id IN (SELECT id FROM public.follow_up_sequences WHERE gym_id = public.get_user_gym_id())
  );

-- USERS table: users can read their own profile
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- GYMS table: users can read their own gym
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their gym" ON public.gyms
  FOR SELECT USING (id = public.get_user_gym_id());
CREATE POLICY "Authenticated users can create gyms" ON public.gyms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their gym" ON public.gyms
  FOR UPDATE USING (id = public.get_user_gym_id());

-- =====================================================
-- 8. SCHEDULED MESSAGES (Scheduler Queue)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  lead_id uuid REFERENCES public.leads NOT NULL,
  template_id uuid REFERENCES public.templates NOT NULL,
  channel text NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  status text DEFAULT 'pending', -- pending, sent, failed, cancelled
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their scheduled messages" ON public.scheduled_messages
  FOR SELECT USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can insert scheduled messages" ON public.scheduled_messages
  FOR INSERT WITH CHECK (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can update their scheduled messages" ON public.scheduled_messages
  FOR UPDATE USING (gym_id = public.get_user_gym_id());

-- =====================================================
-- 9. SUBSCRIPTIONS (Billing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'Starter', -- Starter, Growth, Pro
  status text NOT NULL DEFAULT 'active', -- active, past_due, cancelled, trialing
  razorpay_subscription_id text,
  razorpay_customer_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their subscription" ON public.subscriptions
  FOR SELECT USING (gym_id = public.get_user_gym_id());

-- =====================================================
-- SUPABASE CRON (Run after enabling pg_cron + pg_net extensions)
-- =====================================================
-- Enable required extensions (run in Supabase Dashboard > Database > Extensions):
--   pg_cron
--   pg_net
--
-- Then schedule the processor:
--
-- SELECT cron.schedule(
--   'process-followups',
--   '*/5 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'YOUR_SUPABASE_URL/functions/v1/process-scheduled',
--     headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- Note: See supabase/migrations/20260704000000_enterprise_saas_schema.sql
-- for all 45+ enterprise tables, RLS policies, and Star Schema definitions.
