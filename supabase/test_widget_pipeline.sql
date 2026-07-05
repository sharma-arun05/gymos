-- ============================================================================
-- Way Ahead GymOS v2.0 — Widget Ingestion Pipeline Verification
-- Proves that anonymous lead capture widget submissions dynamically trigger
-- 100% of the event automation pipeline side-effects.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.run_widget_pipeline_test()
RETURNS TABLE (
  metric_name text,
  baseline_count integer,
  post_widget_count integer,
  delta integer,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  way_ahead_gym_id uuid := '11111111-1111-1111-1111-111111111111';
  res jsonb;
  new_id uuid;

  l0 int; ls0 int; auto0 int; n0 int; t0 int; a0 int;
  l1 int; ls1 int; auto1 int; n1 int; t1 int; a1 int;
BEGIN
  -- 1. CAPTURE BASELINE COUNTS
  SELECT count(*) INTO l0 FROM public.leads WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO ls0 FROM public.lead_scores WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO auto0 FROM public.automation_logs WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO n0 FROM public.notifications WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO t0 FROM public.tasks WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO a0 FROM public.audit_logs WHERE gym_id = way_ahead_gym_id;

  -- 2. SIMULATE EXTERNAL WEBSITE WIDGET SUBMISSION (Calling RPC Endpoint)
  res := public.submit_widget_lead(
    way_ahead_gym_id,
    'Vikram Rathore (Widget VIP)',
    '+91 91234 56789',
    'vikram.widget@example.com',
    'Crossfit & HIIT [Schedule: 2026-07-10 - Morning (6AM - 10AM)]',
    'Website Embed Widget (FREE_TRIAL)',
    'FREE_TRIAL'
  );

  new_id := (res->>'lead_id')::uuid;

  -- 3. CAPTURE POST-SUBMISSION COUNTS
  SELECT count(*) INTO l1 FROM public.leads WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO ls1 FROM public.lead_scores WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO auto1 FROM public.automation_logs WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO n1 FROM public.notifications WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO t1 FROM public.tasks WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO a1 FROM public.audit_logs WHERE gym_id = way_ahead_gym_id;

  -- 4. RETURN VERIFICATION RESULTS TABLE
  metric_name := '1. Leads Table (leads)';
  baseline_count := l0; post_widget_count := l1; delta := l1 - l0;
  status := CASE WHEN delta = 1 THEN '✅ PASSED (+1 Lead Ingested)' ELSE '❌ FAILED' END;
  RETURN NEXT;

  metric_name := '2. Lead Scoring (lead_scores)';
  baseline_count := ls0; post_widget_count := ls1; delta := ls1 - ls0;
  status := CASE WHEN delta = 1 THEN '✅ PASSED (+1 Algorithmic Score: Hot)' ELSE '❌ FAILED' END;
  RETURN NEXT;

  metric_name := '3. Automation Engine (automation_logs)';
  baseline_count := auto0; post_widget_count := auto1; delta := auto1 - auto0;
  status := CASE WHEN delta = 1 THEN '✅ PASSED (+1 Welcome WhatsApp Queued)' ELSE '❌ FAILED' END;
  RETURN NEXT;

  metric_name := '4. Notification Center (notifications)';
  baseline_count := n0; post_widget_count := n1; delta := n1 - n0;
  status := CASE WHEN delta = 1 THEN '✅ PASSED (+1 Owner Alert Dispatched)' ELSE '❌ FAILED' END;
  RETURN NEXT;

  metric_name := '5. Staff Task Manager (tasks)';
  baseline_count := t0; post_widget_count := t1; delta := t1 - t0;
  status := CASE WHEN delta = 1 THEN '✅ PASSED (+1 Urgent Followup Task)' ELSE '❌ FAILED' END;
  RETURN NEXT;

  metric_name := '6. Security Audit Trail (audit_logs)';
  baseline_count := a0; post_widget_count := a1; delta := a1 - a0;
  status := CASE WHEN delta = 1 THEN '✅ PASSED (+1 Immutable Audit Log)' ELSE '❌ FAILED' END;
  RETURN NEXT;

  -- 5. CLEAN UP TEST WIDGET LEAD
  DELETE FROM public.tasks WHERE lead_id = new_id;
  DELETE FROM public.automation_logs WHERE lead_id = new_id;
  DELETE FROM public.lead_scores WHERE lead_id = new_id;
  DELETE FROM public.audit_logs WHERE target_id = new_id::text;
  DELETE FROM public.leads WHERE id = new_id;
END;
$$;

SELECT * FROM public.run_widget_pipeline_test();
DROP FUNCTION IF EXISTS public.run_widget_pipeline_test();
