-- ============================================================================
-- Way Ahead GymOS v2.0 — Event Automation Engine Database Triggers
-- Automatically executes side-effects (scoring, audit logs, notifications, tasks, automation logs)
-- across all ingestion channels (UI, API, Webhooks, Bulk Imports).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRIGGER: ON LEAD CREATED
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_fn_on_lead_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calc_score integer := 30;
  calc_tier text := 'Cold';
  recipient uuid;
BEGIN
  -- 1. Calculate Algorithmic Score
  IF NEW.phone IS NOT NULL AND NEW.email IS NOT NULL THEN
    calc_score := 85;
    calc_tier := 'Hot';
  ELSIF NEW.phone IS NOT NULL OR NEW.email IS NOT NULL THEN
    calc_score := 60;
    calc_tier := 'Warm';
  END IF;

  -- 2. Upsert into lead_scores
  INSERT INTO public.lead_scores (id, gym_id, lead_id, score_numeric, tier, factors, updated_at)
  VALUES (
    gen_random_uuid(),
    NEW.gym_id,
    NEW.id,
    calc_score,
    calc_tier,
    '[{"label": "New Inbound Inquiry", "points": 30}, {"label": "Contact Info Provided", "points": 30}]'::jsonb,
    now()
  )
  ON CONFLICT (lead_id) DO UPDATE
  SET score_numeric = EXCLUDED.score_numeric, tier = EXCLUDED.tier;

  -- 3. Resolve recipient user (owner/staff for notification bell)
  SELECT id INTO recipient FROM public.users WHERE gym_id = NEW.gym_id LIMIT 1;

  -- 4. Append Immutable Audit Log
  INSERT INTO public.audit_logs (id, gym_id, actor_id, actor_name, action, target_type, target_id, new_data, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.gym_id,
    'SYSTEM_AUTOMATION',
    'Event Automation Engine',
    'LEAD_CREATED_AND_SCORED',
    'leads',
    NEW.id::text,
    jsonb_build_object('name', NEW.name, 'status', NEW.status, 'source', NEW.source, 'score', calc_score, 'tier', calc_tier),
    now()
  );

  -- 5. Dispatch In-App Notification
  INSERT INTO public.notifications (id, gym_id, recipient_id, title, message, type, is_read, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.gym_id,
    recipient,
    'New ' || calc_tier || ' Lead Acquired: ' || NEW.name,
    'Lead ' || NEW.name || ' was captured via ' || COALESCE(NEW.source, 'manual CRM intake') || ' and scored as ' || calc_tier || ' (' || calc_score || '/100).',
    'lead_assigned',
    false,
    now()
  );

  -- 6. Log Automation Delivery
  INSERT INTO public.automation_logs (id, gym_id, lead_id, channel, status, message_preview, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.gym_id,
    NEW.id,
    'whatsapp',
    'sent',
    'Welcome to Way Ahead Fitness, ' || NEW.name || '! We received your inquiry and our VIP team will connect with you shortly.',
    now()
  );

  -- 7. Dispatch Staff Task
  INSERT INTO public.tasks (id, gym_id, lead_id, title, description, due_date, priority, status, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.gym_id,
    NEW.id,
    'Immediate Pipeline Followup: ' || NEW.name,
    'New ' || calc_tier || ' lead acquired (' || calc_score || '/100). Initiate immediate outreach via WhatsApp or phone.',
    now() + interval '1 hour',
    CASE WHEN calc_tier = 'Hot' THEN 'urgent' ELSE 'high' END,
    'pending',
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_lead_insert ON public.leads;
CREATE TRIGGER trg_after_lead_insert
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_on_lead_created();


-- ----------------------------------------------------------------------------
-- 2. TRIGGER: ON TRIAL BOOKED
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_fn_on_trial_booked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recipient uuid;
  lead_name text := 'Lead';
BEGIN
  -- 1. Resolve Lead Name
  SELECT COALESCE(name, 'Lead') INTO lead_name FROM public.leads WHERE id = NEW.lead_id;

  -- 2. Update Lead Status to Trial Booked
  UPDATE public.leads SET status = 'Trial Booked' WHERE id = NEW.lead_id;

  -- 3. Upgrade Lead Score to Hot
  UPDATE public.lead_scores SET score_numeric = 95, tier = 'Hot' WHERE lead_id = NEW.lead_id;

  -- 4. Resolve recipient
  SELECT id INTO recipient FROM public.users WHERE gym_id = NEW.gym_id LIMIT 1;

  -- 5. Append Immutable Audit Log
  INSERT INTO public.audit_logs (id, gym_id, actor_id, actor_name, action, target_type, target_id, new_data, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.gym_id,
    'SYSTEM_AUTOMATION',
    'Event Automation Engine',
    'VIP_TRIAL_SCHEDULED',
    'trial_bookings',
    NEW.id::text,
    jsonb_build_object('lead_id', NEW.lead_id, 'lead_name', lead_name, 'scheduled_time', NEW.scheduled_time),
    now()
  );

  -- 6. Dispatch In-App Notification
  INSERT INTO public.notifications (id, gym_id, recipient_id, title, message, type, is_read, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.gym_id,
    recipient,
    'VIP Trial Booked: ' || lead_name,
    'VIP trial session scheduled for ' || lead_name || ' on ' || to_char(NEW.scheduled_time::timestamptz, 'DD Mon YYYY, HH24:MI') || '.',
    'trial_reminder',
    false,
    now()
  );

  -- 7. Dispatch Staff Task
  INSERT INTO public.tasks (id, gym_id, lead_id, title, description, due_date, priority, status, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.gym_id,
    NEW.lead_id,
    'Prepare VIP Trial Session: ' || lead_name,
    'Ensure trainer station and welcome kit are prepared before arrival.',
    NEW.scheduled_time::timestamptz - interval '2 hours',
    'high',
    'pending',
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_trial_insert ON public.trial_bookings;
CREATE TRIGGER trg_after_trial_insert
AFTER INSERT ON public.trial_bookings
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_on_trial_booked();


-- ----------------------------------------------------------------------------
-- 3. TRIGGER: ON MEMBER CONVERTED
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_fn_on_member_converted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recipient uuid;
  lead_name text := 'Member';
BEGIN
  -- 1. Resolve Lead Name
  SELECT COALESCE(name, 'Member') INTO lead_name FROM public.leads WHERE id = NEW.lead_id;

  -- 2. Update Lead Status to Joined
  UPDATE public.leads SET status = 'Joined' WHERE id = NEW.lead_id;

  -- 3. Update Trial Status to CONVERTED if trial_id exists
  IF NEW.trial_id IS NOT NULL THEN
    UPDATE public.trial_bookings SET status = 'CONVERTED' WHERE id = NEW.trial_id;
  END IF;

  -- 4. Resolve recipient
  SELECT id INTO recipient FROM public.users WHERE gym_id = NEW.gym_id LIMIT 1;

  -- 5. Append Immutable Audit Log
  INSERT INTO public.audit_logs (id, gym_id, actor_id, actor_name, action, target_type, target_id, new_data, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.gym_id,
    'SYSTEM_AUTOMATION',
    'Event Automation Engine',
    'MEMBER_CONVERTED_AND_WON',
    'member_conversions',
    NEW.id::text,
    jsonb_build_object('lead_id', NEW.lead_id, 'lead_name', lead_name, 'plan_sold', NEW.plan_sold, 'revenue_amount', NEW.revenue_amount),
    now()
  );

  -- 6. Dispatch In-App Notification
  INSERT INTO public.notifications (id, gym_id, recipient_id, title, message, type, is_read, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.gym_id,
    recipient,
    '🎉 New Member Converted: ' || lead_name || '!',
    'Congratulations! Membership plan sold: ' || COALESCE(NEW.plan_sold, 'Annual Membership') || ' for ₹' || COALESCE(NEW.revenue_amount, 0) || '.',
    'system_alert',
    false,
    now()
  );

  -- 7. Update Analytics Warehouse Snapshot
  INSERT INTO public.analytics_snapshots (id, gym_id, snapshot_type, snapshot_date, data, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.gym_id,
    'revenue_monthly',
    CURRENT_DATE,
    jsonb_build_object('total_revenue', COALESCE(NEW.revenue_amount, 0), 'new_conversions', 1, 'last_plan', COALESCE(NEW.plan_sold, 'Gold Plan')),
    now()
  )
  ON CONFLICT (gym_id, snapshot_type, snapshot_date)
  DO UPDATE SET data = jsonb_set(
    analytics_snapshots.data,
    '{total_revenue}',
    ((COALESCE((analytics_snapshots.data->>'total_revenue')::numeric, 0) + COALESCE(NEW.revenue_amount, 0))::text)::jsonb
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_conversion_insert ON public.member_conversions;
CREATE TRIGGER trg_after_conversion_insert
AFTER INSERT ON public.member_conversions
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_on_member_converted();
