-- ============================================================================
-- Way Ahead GymOS v2.0 — Widget Ingestion Engine & RPC Endpoint
-- Enables anonymous external website visitors to submit lead intake forms
-- via embedded JavaScript widgets without compromising tenant RLS isolation.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.submit_widget_lead(
  p_gym_id uuid,
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_source text DEFAULT 'Website Embed Widget',
  p_form_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gym_exists boolean;
  v_new_lead_id uuid;
BEGIN
  -- 1. Validate Gym ID exists
  SELECT EXISTS(SELECT 1 FROM public.gyms WHERE id = p_gym_id) INTO v_gym_exists;
  IF NOT v_gym_exists THEN
    RAISE EXCEPTION 'Invalid target gym_id [%]. Tenant does not exist.', p_gym_id;
  END IF;

  -- 2. Validate required fields
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Name is required for widget lead intake.';
  END IF;

  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RAISE EXCEPTION 'Phone number is required for widget lead intake.';
  END IF;

  -- 3. Insert Lead into CRM (triggers trg_after_lead_insert for scoring, audit logs, tasks, notifications, automation logs)
  INSERT INTO public.leads (
    id,
    gym_id,
    name,
    phone,
    email,
    goal,
    source,
    status,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_gym_id,
    trim(p_name),
    trim(p_phone),
    NULLIF(trim(COALESCE(p_email, '')), ''),
    p_goal,
    COALESCE(p_source, 'Website Embed Widget'),
    'New',
    now()
  )
  RETURNING id INTO v_new_lead_id;

  -- 4. Return structured response
  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_new_lead_id,
    'gym_id', p_gym_id,
    'timestamp', now()
  );
END;
$$;

-- Grant access to anonymous web visitors for embeddable script usage
GRANT EXECUTE ON FUNCTION public.submit_widget_lead(uuid, text, text, text, text, text, text) TO anon, authenticated, service_role;
