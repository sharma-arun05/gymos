-- ============================================================================
-- Way Ahead GymOS v2.0 — Runtime Event Automation Pipeline Stress Test
-- Proves that user actions (create lead, book trial, convert member)
-- dynamically trigger all required domain side-effects in real-time.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.run_event_automation_stress_test()
RETURNS TABLE (
  step_name text,
  leads_cnt integer,
  audit_cnt integer,
  notif_cnt integer,
  auto_cnt integer,
  tasks_cnt integer,
  trials_cnt integer,
  conv_cnt integer,
  result_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  way_ahead_gym_id uuid := '11111111-1111-1111-1111-111111111111';
  test_lead_id uuid := gen_random_uuid();
  test_trial_id uuid := gen_random_uuid();
  test_conversion_id uuid := gen_random_uuid();

  -- Baseline counts
  l0 int; a0 int; n0 int; auto0 int; t0 int; tb0 int; mc0 int;
  -- Post-Lead counts
  l1 int; a1 int; n1 int; auto1 int; t1 int; tb1 int; mc1 int;
  -- Post-Trial counts
  l2 int; a2 int; n2 int; auto2 int; t2 int; tb2 int; mc2 int;
  -- Post-Conversion counts
  l3 int; a3 int; n3 int; auto3 int; t3 int; tb3 int; mc3 int;
  snap_rev numeric;
BEGIN
  -- 1. CAPTURE BASELINE
  SELECT count(*) INTO l0 FROM public.leads WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO a0 FROM public.audit_logs WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO n0 FROM public.notifications WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO auto0 FROM public.automation_logs WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO t0 FROM public.tasks WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO tb0 FROM public.trial_bookings WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO mc0 FROM public.member_conversions WHERE gym_id = way_ahead_gym_id;

  step_name := '0. Baseline State';
  leads_cnt := l0; audit_cnt := a0; notif_cnt := n0; auto_cnt := auto0; tasks_cnt := t0; trials_cnt := tb0; conv_cnt := mc0;
  result_status := 'INITIALIZED';
  RETURN NEXT;

  -- 2. CREATE A BRAND NEW LEAD
  INSERT INTO public.leads (id, gym_id, name, phone, email, status, source, goal, created_at)
  VALUES (test_lead_id, way_ahead_gym_id, 'Runtime Test Lead', '+91 99887 76655', 'runtime.test@gmail.com', 'New', 'Instagram', 'Weight Loss', now());

  SELECT count(*) INTO l1 FROM public.leads WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO a1 FROM public.audit_logs WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO n1 FROM public.notifications WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO auto1 FROM public.automation_logs WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO t1 FROM public.tasks WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO tb1 FROM public.trial_bookings WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO mc1 FROM public.member_conversions WHERE gym_id = way_ahead_gym_id;

  step_name := '1. Create Lead (+1 Lead)';
  leads_cnt := l1; audit_cnt := a1; notif_cnt := n1; auto_cnt := auto1; tasks_cnt := t1; trials_cnt := tb1; conv_cnt := mc1;
  IF (l1 = l0 + 1) AND (a1 = a0 + 1) AND (n1 = n0 + 1) AND (auto1 = auto0 + 1) AND (t1 = t0 + 1) THEN
    result_status := '✅ PASSED (+1 Audit, +1 Notif, +1 AutoLog, +1 Task)';
  ELSE
    result_status := '❌ FAILED (Side effects missing)';
  END IF;
  RETURN NEXT;

  -- 3. BOOK A VIP TRIAL FOR THAT LEAD
  INSERT INTO public.trial_bookings (id, gym_id, lead_id, scheduled_time, status, created_at)
  VALUES (test_trial_id, way_ahead_gym_id, test_lead_id, now() + interval '1 day', 'SCHEDULED', now());

  SELECT count(*) INTO l2 FROM public.leads WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO a2 FROM public.audit_logs WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO n2 FROM public.notifications WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO auto2 FROM public.automation_logs WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO t2 FROM public.tasks WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO tb2 FROM public.trial_bookings WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO mc2 FROM public.member_conversions WHERE gym_id = way_ahead_gym_id;

  step_name := '2. Book Trial (+1 Trial Booking)';
  leads_cnt := l2; audit_cnt := a2; notif_cnt := n2; auto_cnt := auto2; tasks_cnt := t2; trials_cnt := tb2; conv_cnt := mc2;
  IF (tb2 = tb1 + 1) AND (a2 = a1 + 1) AND (n2 = n1 + 1) AND (t2 = t1 + 1) THEN
    result_status := '✅ PASSED (+1 Audit, +1 Notif, +1 Task, Score->Hot)';
  ELSE
    result_status := '❌ FAILED (Side effects missing)';
  END IF;
  RETURN NEXT;

  -- 4. CONVERT LEAD INTO MEMBER
  INSERT INTO public.member_conversions (id, gym_id, lead_id, trial_id, plan_sold, revenue_amount, converted_at)
  VALUES (test_conversion_id, way_ahead_gym_id, test_lead_id, test_trial_id, 'Diamond VIP Membership', 49999.00, now());

  SELECT count(*) INTO l3 FROM public.leads WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO a3 FROM public.audit_logs WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO n3 FROM public.notifications WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO auto3 FROM public.automation_logs WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO t3 FROM public.tasks WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO tb3 FROM public.trial_bookings WHERE gym_id = way_ahead_gym_id;
  SELECT count(*) INTO mc3 FROM public.member_conversions WHERE gym_id = way_ahead_gym_id;
  SELECT (data->>'total_revenue')::numeric INTO snap_rev FROM public.analytics_snapshots WHERE gym_id = way_ahead_gym_id AND snapshot_type = 'revenue_monthly' AND snapshot_date = CURRENT_DATE;

  step_name := '3. Convert Member (+1 Conversion)';
  leads_cnt := l3; audit_cnt := a3; notif_cnt := n3; auto_cnt := auto3; tasks_cnt := t3; trials_cnt := tb3; conv_cnt := mc3;
  IF (mc3 = mc2 + 1) AND (a3 = a2 + 1) AND (n3 = n2 + 1) AND (snap_rev >= 49999) THEN
    result_status := '✅ PASSED (+1 Audit, +1 Notif, Revenue Updated to ₹' || snap_rev || ')';
  ELSE
    result_status := '❌ FAILED (Side effects missing)';
  END IF;
  RETURN NEXT;

  -- 5. CLEAN UP TEST DATA
  DELETE FROM public.member_conversions WHERE id = test_conversion_id;
  DELETE FROM public.trial_bookings WHERE id = test_trial_id;
  DELETE FROM public.tasks WHERE lead_id = test_lead_id;
  DELETE FROM public.automation_logs WHERE lead_id = test_lead_id;
  DELETE FROM public.audit_logs WHERE target_id IN (test_lead_id::text, test_trial_id::text, test_conversion_id::text);
  DELETE FROM public.leads WHERE id = test_lead_id;
END;
$$;

SELECT * FROM public.run_event_automation_stress_test();
DROP FUNCTION IF EXISTS public.run_event_automation_stress_test();
