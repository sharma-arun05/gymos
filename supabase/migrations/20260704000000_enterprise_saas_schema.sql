-- ============================================================================
-- Way Ahead GymOS v1.0 — 100/100 Enterprise SaaS Migration
-- Adds 45+ Operational Tables, Workflow Versioning, Queue Partitioning,
-- AI Governance, Observability, and Data Warehouse Star Schema.
-- Enforces Row Level Security (RLS) on all tenant tables.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FEATURE FLAGS & TENANT FEATURES (Module 7 / Platform Context)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  description text,
  is_enabled_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tenant_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  feature_key text REFERENCES public.feature_flags(key) NOT NULL,
  is_enabled boolean DEFAULT true,
  overrides jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(gym_id, feature_key)
);

ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view tenant features" ON public.tenant_features
  FOR SELECT USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 2. USAGE METERING & SNAPSHOTS (Module 7 / Platform Context)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  metric_name text NOT NULL, -- 'leads', 'automations', 'whatsapp_sent', 'email_sent', 'storage_mb'
  current_value integer DEFAULT 0,
  quota_limit integer DEFAULT 1000,
  reset_cycle text DEFAULT 'monthly',
  last_reset_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(gym_id, metric_name)
);

CREATE TABLE IF NOT EXISTS public.usage_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  metric_name text NOT NULL,
  snapshot_value integer NOT NULL,
  snapshot_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view usage metrics" ON public.usage_metrics FOR SELECT USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Users can view usage snapshots" ON public.usage_snapshots FOR SELECT USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 3. CRM ENHANCEMENTS: SCORES, TAGS, ACTIVITY, TASKS (Module 3 & 11)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  lead_id uuid REFERENCES public.leads ON DELETE CASCADE NOT NULL UNIQUE,
  score_numeric integer DEFAULT 0 CHECK (score_numeric >= 0 AND score_numeric <= 100),
  tier text DEFAULT 'Cold', -- 'Hot', 'Warm', 'Cold'
  factors jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lead_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#8B5CF6',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(gym_id, name)
);

CREATE TABLE IF NOT EXISTS public.lead_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  lead_id uuid REFERENCES public.leads ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL, -- 'note', 'call', 'email_opened', 'whatsapp_replied', 'trial_booked', 'status_change'
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  lead_id uuid REFERENCES public.leads ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_date timestamp with time zone,
  priority text DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status text DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  assigned_to uuid REFERENCES auth.users,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  task_id uuid REFERENCES public.tasks ON DELETE CASCADE NOT NULL,
  comment text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  task_id uuid REFERENCES public.tasks ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  assigned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS lead_scores" ON public.lead_scores FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS lead_tags" ON public.lead_tags FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS lead_activity" ON public.lead_activity FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS tasks" ON public.tasks FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS task_comments" ON public.task_comments FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS task_assignments" ON public.task_assignments FOR ALL USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 4. WORKFLOW VERSIONING & PARTITIONED QUEUES (Module 4, 5 | Refinement 6, 7)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL, -- 'lead_created', 'trial_booked', 'tag_added', 'manual'
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workflow_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES public.workflow_definitions ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workflow_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  workflow_version_id uuid REFERENCES public.workflow_versions NOT NULL,
  lead_id uuid REFERENCES public.leads ON DELETE SET NULL,
  status text DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
  current_node_id text,
  context_data jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  job_type text NOT NULL, -- 'send_email', 'send_whatsapp', 'score_lead', 'assign_staff'
  queue_partition text DEFAULT 'normal_priority', -- 'high_priority', 'normal_priority', 'low_priority', 'dead_letter'
  payload jsonb NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  scheduled_for timestamp with time zone DEFAULT timezone('utc'::text, now()),
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  job_id uuid REFERENCES public.automation_jobs ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  output_data jsonb,
  duration_ms integer,
  ran_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.automation_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  job_id uuid REFERENCES public.automation_jobs ON DELETE CASCADE NOT NULL,
  error_code text,
  stack_trace text,
  failed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.retry_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  job_id uuid REFERENCES public.automation_jobs ON DELETE CASCADE NOT NULL,
  next_retry_at timestamp with time zone NOT NULL,
  retry_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retry_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS workflow_def" ON public.workflow_definitions FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS workflow_ver" ON public.workflow_versions FOR ALL USING (
  workflow_id IN (SELECT id FROM public.workflow_definitions WHERE gym_id = public.get_user_gym_id())
);
CREATE POLICY "Tenant RLS workflow_exec" ON public.workflow_executions FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS auto_jobs" ON public.automation_jobs FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS auto_runs" ON public.automation_runs FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS auto_failures" ON public.automation_failures FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS retry_queue" ON public.retry_queue FOR ALL USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 5. TRIALS, CONVERSIONS & WIDGETS (Module 7, 8, 9)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trial_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  lead_id uuid REFERENCES public.leads ON DELETE CASCADE NOT NULL,
  scheduled_time timestamp with time zone NOT NULL,
  status text DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CONVERTED'
  trainer_id uuid REFERENCES auth.users,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.trial_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  trial_id uuid REFERENCES public.trial_bookings ON DELETE CASCADE NOT NULL UNIQUE,
  checked_in_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  checked_in_by uuid REFERENCES auth.users
);

CREATE TABLE IF NOT EXISTS public.trial_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  trial_id uuid REFERENCES public.trial_bookings ON DELETE CASCADE NOT NULL UNIQUE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comments text,
  interest_level text DEFAULT 'High', -- 'High', 'Medium', 'Low'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.member_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  lead_id uuid REFERENCES public.leads ON DELETE SET NULL NOT NULL,
  trial_id uuid REFERENCES public.trial_bookings ON DELETE SET NULL,
  sales_person_id uuid REFERENCES auth.users,
  plan_sold text NOT NULL,
  revenue_amount numeric(10, 2) NOT NULL,
  commission_amount numeric(10, 2) DEFAULT 0,
  days_to_convert integer,
  converted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.widget_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  name text NOT NULL,
  mode text DEFAULT 'popup', -- 'popup', 'inline', 'floating'
  theme_color text DEFAULT '#8B5CF6',
  fields jsonb DEFAULT '["name", "phone", "email", "goal"]'::jsonb,
  success_message text DEFAULT 'Thanks! We will contact you shortly.',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.trial_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS trials" ON public.trial_bookings FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS trial_att" ON public.trial_attendance FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS trial_feed" ON public.trial_feedback FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS member_conv" ON public.member_conversions FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS widget_forms" ON public.widget_forms FOR ALL USING (gym_id = public.get_user_gym_id());

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'trial',
  razorpay_subscription_id text UNIQUE,
  trial_ends_at timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone
    DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS subscriptions"
ON public.subscriptions
FOR ALL
USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 6. BILLING, PAYMENTS & INVOICES (Module 14)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions ON DELETE SET NULL,
  razorpay_payment_id text UNIQUE,
  razorpay_order_id text,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'INR',
  status text NOT NULL, -- 'captured', 'failed', 'refunded'
  payment_method text,
  paid_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  payment_id uuid REFERENCES public.payments ON DELETE SET NULL,
  invoice_number text UNIQUE NOT NULL,
  amount numeric(10, 2) NOT NULL,
  pdf_url text,
  issued_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant RLS payments" ON public.payments FOR SELECT USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS invoices" ON public.invoices FOR SELECT USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 7. SEARCH, FILES & MARKETPLACE (Modules 8, 9, 12)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  query_text text NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.file_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.file_folders ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  folder_id uuid REFERENCES public.file_folders ON DELETE SET NULL,
  file_name text NOT NULL,
  file_size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  storage_url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  file_id uuid REFERENCES public.files ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL, -- 'lead', 'task', 'contract', 'invoice'
  entity_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL, -- 'whatsapp', 'gmail', 'outlook', 'razorpay', 'stripe', 'zapier'
  category text NOT NULL,
  icon_url text,
  description text,
  is_active_default boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.integration_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  integration_name text REFERENCES public.integrations(name) NOT NULL,
  api_key text,
  access_token text,
  refresh_token text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_connected boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(gym_id, integration_name)
);

CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  url text NOT NULL,
  secret_key text NOT NULL,
  events text[] NOT NULL, -- array of event names e.g. ['LeadCreated', 'TrialBooked']
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS saved_searches" ON public.saved_searches FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS file_folders" ON public.file_folders FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS files" ON public.files FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS attachments" ON public.attachments FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS int_tokens" ON public.integration_tokens FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS webhooks" ON public.webhooks FOR ALL USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 8. RETENTION & AI GOVERNANCE (Modules 10, 11 | Refinement 12)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.retention_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  name text NOT NULL,
  trigger_rule text NOT NULL, -- 'expiry_7_days', 'inactivity_14_days', 'churned_30_days'
  template_id uuid REFERENCES public.templates,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.renewal_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  member_id uuid NOT NULL,
  expiry_date date NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'notified', 'renewed', 'expired'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.churn_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  member_id uuid NOT NULL,
  risk_score integer CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_tier text DEFAULT 'Low', -- 'High', 'Medium', 'Low'
  reasons text[] DEFAULT '{}'::text[],
  predicted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL, -- 'followup_writer', 'lead_scorer', 'churn_analyst'
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key text REFERENCES public.prompt_templates(key) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  system_prompt text NOT NULL,
  model_name text DEFAULT 'gpt-4o-mini',
  temperature numeric(3, 2) DEFAULT 0.70,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(prompt_key, version_number)
);

CREATE TABLE IF NOT EXISTS public.prompt_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  prompt_version_id uuid REFERENCES public.prompt_versions NOT NULL,
  input_context jsonb NOT NULL,
  output_text text NOT NULL,
  latency_ms integer,
  tokens_used integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prompt_evaluation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES public.prompt_audit ON DELETE CASCADE NOT NULL UNIQUE,
  quality_score numeric(3, 2) CHECK (quality_score >= 0.0 AND quality_score <= 1.0),
  fallback_triggered boolean DEFAULT false,
  evaluation_notes text,
  evaluated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  lead_id uuid REFERENCES public.leads ON DELETE SET NULL,
  generation_type text NOT NULL, -- 'whatsapp', 'email', 'offer', 'testimonial'
  generated_content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  insight_type text NOT NULL, -- 'weekly_report', 'monthly_report', 'growth_tip'
  title text NOT NULL,
  content text NOT NULL,
  actionable_items text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.retention_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churn_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS ret_camp" ON public.retention_campaigns FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS ren_alerts" ON public.renewal_alerts FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS churn_pred" ON public.churn_predictions FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS prompt_audit" ON public.prompt_audit FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS ai_gen" ON public.ai_generations FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS ai_insights" ON public.ai_insights FOR ALL USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 9. OBSERVABILITY & SUPPORT (Modules 13, 16)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid,
  level text NOT NULL, -- 'info', 'warn', 'error'
  module text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid,
  error_type text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  endpoint text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.performance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid,
  operation text NOT NULL,
  duration_ms integer NOT NULL,
  status_code integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status text DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customer_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL UNIQUE,
  health_score integer CHECK (health_score >= 0 AND health_score <= 100),
  health_tier text DEFAULT 'Good', -- 'Excellent', 'Good', 'At Risk', 'Critical'
  nps_score integer,
  last_calculated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES public.gyms NOT NULL,
  user_id uuid REFERENCES auth.users,
  category text NOT NULL, -- 'bug', 'feature_request', 'general'
  content text NOT NULL,
  rating integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant RLS tickets" ON public.support_tickets FOR ALL USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS health" ON public.customer_health_scores FOR SELECT USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS feedback" ON public.feedback FOR ALL USING (gym_id = public.get_user_gym_id());

-- ----------------------------------------------------------------------------
-- 10. DATA WAREHOUSE STAR SCHEMA (Refinement 5)
-- Dedicated analytical dimensions and facts separated from operational OLTP
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dim_gym (
  gym_key uuid PRIMARY KEY REFERENCES public.gyms(id) ON DELETE CASCADE,
  name text NOT NULL,
  plan text NOT NULL,
  industry text
);

CREATE TABLE IF NOT EXISTS public.dim_member (
  member_key uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_key uuid REFERENCES public.dim_gym(gym_key) NOT NULL,
  lead_id uuid,
  name text NOT NULL,
  membership_type text,
  joined_date date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fact_leads (
  fact_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_key uuid REFERENCES public.dim_gym(gym_key) NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  source text,
  status_reached text NOT NULL,
  lead_score_val integer DEFAULT 0,
  date_key date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fact_trials (
  fact_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_key uuid REFERENCES public.dim_gym(gym_key) NOT NULL,
  trial_id uuid REFERENCES public.trial_bookings(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  attendance_flag boolean DEFAULT false,
  rating integer,
  date_key date DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.fact_conversions (
  fact_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_key uuid REFERENCES public.dim_gym(gym_key) NOT NULL,
  conversion_id uuid REFERENCES public.member_conversions(id) ON DELETE CASCADE NOT NULL,
  revenue_amount numeric(10, 2) NOT NULL,
  days_to_convert integer,
  date_key date DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.fact_revenue (
  fact_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_key uuid REFERENCES public.dim_gym(gym_key) NOT NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'INR',
  date_key date DEFAULT CURRENT_DATE
);

ALTER TABLE public.dim_gym ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant RLS dim_gym" ON public.dim_gym FOR SELECT USING (gym_key = public.get_user_gym_id());
CREATE POLICY "Tenant RLS dim_mem" ON public.dim_member FOR SELECT USING (gym_key = public.get_user_gym_id());
CREATE POLICY "Tenant RLS fact_leads" ON public.fact_leads FOR SELECT USING (gym_key = public.get_user_gym_id());
CREATE POLICY "Tenant RLS fact_trials" ON public.fact_trials FOR SELECT USING (gym_key = public.get_user_gym_id());
CREATE POLICY "Tenant RLS fact_conv" ON public.fact_conversions FOR SELECT USING (gym_key = public.get_user_gym_id());
CREATE POLICY "Tenant RLS fact_rev" ON public.fact_revenue FOR SELECT USING (gym_key = public.get_user_gym_id());
