-- ============================================================================
-- Way Ahead GymOS v2.0 — Enterprise SaaS Infrastructure Completion
-- Migration: 202607050001_enterprise_completion.sql
-- Resolves get_user_gym_id() RLS function, users.name column, and creates
-- 14 enterprise infrastructure tables for RBAC, Notifications, Audit,
-- Analytics, Communications, and SaaS Billing Limits.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. CORE RLS HELPER FUNCTION & USER COLUMN FIX
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_gym_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT gym_id FROM public.users WHERE auth_user_id = auth.uid();
$$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name text;

-- ----------------------------------------------------------------------------
-- 1. RBAC (Roles, Permissions, Role_Permissions, Team_Members)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(gym_id, name)
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL, -- e.g. 'leads.view', 'billing.manage'
  description text,
  module text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
  title text,
  department text,
  status text DEFAULT 'active', -- 'active', 'invited', 'suspended'
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(gym_id, user_id)
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS roles" ON public.roles FOR ALL USING (gym_id = public.get_user_gym_id() OR is_system = true);
CREATE POLICY "Public read permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Tenant RLS role_permissions" ON public.role_permissions FOR ALL USING (role_id IN (SELECT id FROM public.roles WHERE gym_id = public.get_user_gym_id() OR is_system = true));
CREATE POLICY "Tenant RLS team_members" ON public.team_members FOR ALL USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 2. NOTIFICATIONS (Notifications, Notification_Preferences)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'system_alert', -- 'trial_reminder', 'lead_assigned', 'renewal_due', 'system_alert'
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL, -- 'in_app', 'email', 'sms', 'whatsapp'
  category text NOT NULL, -- 'leads', 'trials', 'billing', 'system'
  is_enabled boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, channel, category)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS notifications" ON public.notifications FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS notification_preferences" ON public.notification_preferences FOR ALL USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 3. AUDIT (Audit_Logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  actor_id text,
  actor_name text,
  action text NOT NULL, -- e.g. 'LEAD_STATUS_TRANSITION', 'TRIAL_ATTENDANCE_CHECKIN'
  target_type text NOT NULL, -- 'leads', 'trial_bookings', 'fact_leads'
  target_id text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant RLS audit_logs" ON public.audit_logs FOR ALL USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 4. ANALYTICS (Analytics_Snapshots, Campaign_Reports)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  snapshot_type text NOT NULL, -- 'funnel_daily', 'revenue_monthly', 'retention_cohort'
  snapshot_date date DEFAULT CURRENT_DATE NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(gym_id, snapshot_type, snapshot_date)
);

CREATE TABLE IF NOT EXISTS public.campaign_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  campaign_id text NOT NULL,
  campaign_name text NOT NULL,
  channel text NOT NULL, -- 'whatsapp', 'email', 'sms'
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  read_count integer DEFAULT 0,
  converted_count integer DEFAULT 0,
  spend_amount numeric(12, 2) DEFAULT 0.00,
  report_date date DEFAULT CURRENT_DATE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS analytics_snapshots" ON public.analytics_snapshots FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS campaign_reports" ON public.campaign_reports FOR ALL USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 5. COMMUNICATION (Communication_Logs, Message_Events)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  channel text NOT NULL, -- 'whatsapp', 'email', 'sms'
  direction text NOT NULL DEFAULT 'outbound', -- 'inbound', 'outbound'
  sender text NOT NULL,
  recipient text NOT NULL,
  subject text,
  content text NOT NULL,
  status text DEFAULT 'sent', -- 'queued', 'sent', 'delivered', 'read', 'failed'
  external_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.message_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  communication_log_id uuid REFERENCES public.communication_logs(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, -- 'queued', 'sent', 'delivered', 'read', 'failed', 'clicked'
  provider_response jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS communication_logs" ON public.communication_logs FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS message_events" ON public.message_events FOR ALL USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 6. SAAS (Subscription_Events, Plan_Limits)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'trial_started', 'upgraded', 'downgraded', 'renewed', 'cancelled', 'payment_succeeded', 'payment_failed'
  previous_plan text,
  new_plan text,
  amount numeric(12, 2) DEFAULT 0.00,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.plan_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text UNIQUE NOT NULL, -- 'starter', 'growth', 'pro', 'enterprise'
  max_leads integer NOT NULL,
  max_automations integer NOT NULL,
  max_team_members integer NOT NULL,
  max_locations integer NOT NULL,
  ai_tokens_quota integer NOT NULL,
  features_included jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS subscription_events" ON public.subscription_events FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Public read plan_limits" ON public.plan_limits FOR SELECT USING (true);

-- Insert default plan limits
INSERT INTO public.plan_limits (plan_name, max_leads, max_automations, max_team_members, max_locations, ai_tokens_quota, features_included)
VALUES 
  ('starter', 1000, 500, 3, 1, 10000, '["basic_crm", "email_templates", "dashboard"]'::jsonb),
  ('growth', 10000, 5000, 10, 3, 100000, '["basic_crm", "email_templates", "dashboard", "whatsapp_automations", "advanced_analytics", "lead_scoring"]'::jsonb),
  ('pro', 50000, 25000, 50, 10, 500000, '["all_features", "priority_support", "custom_branding", "api_access"]'::jsonb),
  ('enterprise', 999999, 999999, 999, 99, 5000000, '["all_features", "dedicated_manager", "custom_etl", "sla_guarantee"]'::jsonb)
ON CONFLICT (plan_name) DO NOTHING;
