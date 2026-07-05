-- ============================================================================
-- Way Ahead GymOS v2.1 — AI Gym Sales Assistant Widget Migration
-- Creates bounded context tables for AI conversational sales, lead qualification,
-- program recommendations, trial scheduling, analytics, and admin configuration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CONVERSATION SESSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
    session_token text NOT NULL,
    visitor_name text,
    visitor_phone text,
    visitor_email text,
    current_stage text DEFAULT 'greeting', -- 'greeting', 'qualification', 'recommendation', 'booking', 'converted', 'handoff'
    source text DEFAULT 'AI Sales Widget',
    started_at timestamptz DEFAULT now(),
    ended_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_conv_sessions_gym_id ON public.conversation_sessions(gym_id);
CREATE INDEX IF NOT EXISTS idx_conv_sessions_token ON public.conversation_sessions(session_token);

ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant RLS conversation_sessions select" ON public.conversation_sessions FOR SELECT USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS conversation_sessions all" ON public.conversation_sessions FOR ALL USING (gym_id = public.get_user_gym_id());
GRANT ALL ON public.conversation_sessions TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 2. CONVERSATION MESSAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.conversation_sessions(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL, -- 'user', 'assistant', 'system'
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_messages_session_id ON public.conversation_messages(session_id);

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant RLS conversation_messages select" ON public.conversation_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_sessions s WHERE s.id = conversation_messages.session_id AND s.gym_id = public.get_user_gym_id())
);
CREATE POLICY "Tenant RLS conversation_messages all" ON public.conversation_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.conversation_sessions s WHERE s.id = conversation_messages.session_id AND s.gym_id = public.get_user_gym_id())
);
GRANT ALL ON public.conversation_messages TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 3. QUALIFICATION ANSWERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.qualification_answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.conversation_sessions(id) ON DELETE CASCADE NOT NULL,
    age integer,
    gender text,
    fitness_goal text,
    target_weight numeric,
    experience_level text,
    training_days integer,
    budget integer,
    preferred_time text,
    medical_issues text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qual_answers_session_id ON public.qualification_answers(session_id);

ALTER TABLE public.qualification_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant RLS qualification_answers select" ON public.qualification_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_sessions s WHERE s.id = qualification_answers.session_id AND s.gym_id = public.get_user_gym_id())
);
CREATE POLICY "Tenant RLS qualification_answers all" ON public.qualification_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.conversation_sessions s WHERE s.id = qualification_answers.session_id AND s.gym_id = public.get_user_gym_id())
);
GRANT ALL ON public.qualification_answers TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 4. AI RECOMMENDATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.conversation_sessions(id) ON DELETE CASCADE NOT NULL,
    recommended_plan text NOT NULL,
    confidence numeric NOT NULL,
    reasoning text,
    program_details jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_recs_session_id ON public.ai_recommendations(session_id);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant RLS ai_recommendations select" ON public.ai_recommendations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_sessions s WHERE s.id = ai_recommendations.session_id AND s.gym_id = public.get_user_gym_id())
);
CREATE POLICY "Tenant RLS ai_recommendations all" ON public.ai_recommendations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.conversation_sessions s WHERE s.id = ai_recommendations.session_id AND s.gym_id = public.get_user_gym_id())
);
GRANT ALL ON public.ai_recommendations TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 5. TRIAL SLOTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trial_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
    trainer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    slot_start timestamptz NOT NULL,
    slot_end timestamptz NOT NULL,
    capacity integer DEFAULT 5,
    booked integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_slots_gym_id ON public.trial_slots(gym_id);
CREATE INDEX IF NOT EXISTS idx_trial_slots_start ON public.trial_slots(slot_start);

ALTER TABLE public.trial_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant RLS trial_slots select" ON public.trial_slots FOR SELECT USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS trial_slots all" ON public.trial_slots FOR ALL USING (gym_id = public.get_user_gym_id());
GRANT ALL ON public.trial_slots TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 6. AI CONVERSATIONS ANALYTICS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
    date_key date NOT NULL DEFAULT CURRENT_DATE,
    total_chats integer DEFAULT 0,
    qualified integer DEFAULT 0,
    trials_booked integer DEFAULT 0,
    conversions integer DEFAULT 0,
    avg_duration integer DEFAULT 0,
    total_revenue numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(gym_id, date_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_analytics_gym_date ON public.ai_conversations_analytics(gym_id, date_key);

ALTER TABLE public.ai_conversations_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant RLS ai_analytics select" ON public.ai_conversations_analytics FOR SELECT USING (gym_id = public.get_user_gym_id());
CREATE POLICY "Tenant RLS ai_analytics all" ON public.ai_conversations_analytics FOR ALL USING (gym_id = public.get_user_gym_id());
GRANT ALL ON public.ai_conversations_analytics TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 7. AI ASSISTANT SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_assistant_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL UNIQUE,
    greeting text DEFAULT 'Hi! I am your Way Ahead AI Fitness Advisor. How can I help you transform your fitness today?',
    personality text DEFAULT 'professional_consultant', -- 'professional_consultant', 'energetic_coach', 'empathetic_guide'
    offers jsonb DEFAULT '["Free VIP Guest Pass", "10% Off Annual Plan"]'::jsonb,
    memberships jsonb DEFAULT '[{"name": "Starter Plan", "price": 1999, "benefits": ["Full Gym Access", "Locker Room", "Free Wi-Fi"], "duration": "1 Month"}, {"name": "Growth Pro Plan", "price": 2999, "benefits": ["Gym Access", "Group HIIT Classes", "Sauna Access", "1 Fitness Assessment"], "duration": "1 Month", "popular": true}, {"name": "Premium Plan", "price": 4999, "benefits": ["All Classes & Facilities", "Sauna & Steam", "2 Personal Training Sessions", "Guest Privileges"], "duration": "1 Month"}, {"name": "Elite VIP Transformation", "price": 7999, "benefits": ["Unlimited VIP Access", "Dedicated PT Coach", "Customized Nutrition Plan", "Monthly InBody Analysis"], "duration": "1 Month"}]'::jsonb,
    trainers jsonb default '[{"name": "Arjun Verma", "specialization": "Crossfit & HIIT", "experience": "8 Years", "rating": "4.9", "photo": "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop&q=80"}, {"name": "Priya Singh", "specialization": "Yoga & Flexibility", "experience": "6 Years", "rating": "4.8", "photo": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&auto=format&fit=crop&q=80"}, {"name": "Rahul Sharma", "specialization": "Strength & Hypertrophy", "experience": "10 Years", "rating": "5.0", "photo": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}]'::jsonb,
    faqs jsonb default '[{"q": "What are your operating hours?", "a": "We are open Monday to Saturday from 5:00 AM to 11:00 PM, and Sundays from 6:00 AM to 8:00 PM."}, {"q": "Is personal training included?", "a": "Personal training sessions are included in our Premium (2 sessions) and Elite VIP plans. Additional sessions are available for ₹500 per session."}, {"q": "Can I freeze or pause my membership?", "a": "Yes! You can pause your membership for up to 30 days per year for medical or travel reasons with prior notice."}]'::jsonb,
    languages jsonb default '["English", "Hindi", "Punjabi"]'::jsonb,
    escalation_rules jsonb default '{"confidence_threshold": 70, "handoff_role": "Sales Executive", "notify_channel": "whatsapp"}'::jsonb,
    is_active boolean default true,
    updated_at timestamptz default now()
);

ALTER TABLE public.ai_assistant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant RLS ai_settings select" ON public.ai_assistant_settings FOR SELECT USING (gym_id = public.get_user_gym_id() OR true);
CREATE POLICY "Tenant RLS ai_settings all" ON public.ai_assistant_settings FOR ALL USING (gym_id = public.get_user_gym_id());
GRANT ALL ON public.ai_assistant_settings TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 8. RPC: AI SALES WIDGET INGESTION & INTERACTION ENGINE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_ai_sales_interaction(
  p_gym_id uuid,
  p_session_token text,
  p_visitor_name text DEFAULT NULL,
  p_visitor_phone text DEFAULT NULL,
  p_visitor_email text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_age integer DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_weight numeric DEFAULT NULL,
  p_target_weight numeric DEFAULT NULL,
  p_experience text DEFAULT NULL,
  p_training_days integer DEFAULT 3,
  p_budget integer DEFAULT 3000,
  p_pref_time text DEFAULT 'Evening (5PM - 9PM)',
  p_recommended_plan text DEFAULT 'Growth Pro Plan',
  p_confidence numeric DEFAULT 92.5,
  p_book_trial boolean DEFAULT false,
  p_trial_time timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_lead_id uuid;
  v_trial_id uuid;
  v_score integer := 40;
  v_tier text := 'Warm';
  v_reason text;
BEGIN
  -- 1. Get or Create Session
  SELECT id INTO v_session_id FROM public.conversation_sessions
  WHERE gym_id = p_gym_id AND session_token = p_session_token LIMIT 1;

  IF v_session_id IS NULL THEN
    INSERT INTO public.conversation_sessions (id, gym_id, session_token, visitor_name, visitor_phone, visitor_email, current_stage, source, started_at)
    VALUES (gen_random_uuid(), p_gym_id, p_session_token, p_visitor_name, p_visitor_phone, p_visitor_email, 'qualification', 'AI Sales Employee Widget', now())
    RETURNING id INTO v_session_id;

    -- Increment Analytics total_chats
    INSERT INTO public.ai_conversations_analytics (id, gym_id, date_key, total_chats, qualified)
    VALUES (gen_random_uuid(), p_gym_id, CURRENT_DATE, 1, 0)
    ON CONFLICT (gym_id, date_key) DO UPDATE SET total_chats = ai_conversations_analytics.total_chats + 1;
  ELSE
    UPDATE public.conversation_sessions
    SET visitor_name = COALESCE(p_visitor_name, visitor_name),
        visitor_phone = COALESCE(p_visitor_phone, visitor_phone),
        visitor_email = COALESCE(p_visitor_email, visitor_email),
        current_stage = CASE WHEN p_book_trial THEN 'booking' ELSE 'recommendation' END
    WHERE id = v_session_id;
  END IF;

  -- 2. Save Qualification Answers if provided
  IF p_goal IS NOT NULL OR p_age IS NOT NULL THEN
    INSERT INTO public.qualification_answers (id, session_id, age, gender, fitness_goal, target_weight, experience_level, training_days, budget, preferred_time)
    VALUES (gen_random_uuid(), v_session_id, p_age, p_gender, p_goal, p_target_weight, p_experience, p_training_days, p_budget, p_pref_time);

    -- Mark qualified in analytics
    UPDATE public.ai_conversations_analytics SET qualified = qualified + 1 WHERE gym_id = p_gym_id AND date_key = CURRENT_DATE;
  END IF;

  -- 3. Algorithmic Lead Scoring Calculation (Weight: Budget 25, Goal urgency 20, Age 10, Training days 20, Trial booked 25)
  v_score := 0;
  IF COALESCE(p_budget, 0) >= 4000 THEN v_score := v_score + 25;
  ELSIF COALESCE(p_budget, 0) >= 2500 THEN v_score := v_score + 18;
  ELSE v_score := v_score + 10; END IF;

  IF p_goal IS NOT NULL THEN v_score := v_score + 20; END IF;
  IF COALESCE(p_age, 25) BETWEEN 18 AND 45 THEN v_score := v_score + 10; ELSE v_score := v_score + 5; END IF;
  IF COALESCE(p_training_days, 3) >= 4 THEN v_score := v_score + 20; ELSE v_score := v_score + 12; END IF;
  IF p_book_trial THEN v_score := v_score + 25; END IF;

  IF v_score >= 70 THEN v_tier := 'Hot';
  ELSIF v_score >= 40 THEN v_tier := 'Warm';
  ELSE v_tier := 'Cold'; END IF;

  -- 4. Save AI Recommendation
  v_reason := 'Matched goal [' || COALESCE(p_goal, 'General Fitness') || '] with training frequency ' || COALESCE(p_training_days, 3) || ' days/week and budget ₹' || COALESCE(p_budget, 3000) || '/mo.';
  INSERT INTO public.ai_recommendations (id, session_id, recommended_plan, confidence, reasoning, program_details)
  VALUES (gen_random_uuid(), v_session_id, p_recommended_plan, p_confidence, v_reason, jsonb_build_object('duration', '6 Months', 'nutrition', true, 'price', '₹' || COALESCE(p_budget, 2999) || '/mo'));

  -- 5. Create or Update CRM Lead
  IF p_visitor_phone IS NOT NULL THEN
    INSERT INTO public.leads (id, gym_id, name, phone, email, goal, source, status, created_at)
    VALUES (gen_random_uuid(), p_gym_id, COALESCE(p_visitor_name, 'AI Qualified Visitor'), p_visitor_phone, p_visitor_email, p_goal, 'AI Sales Employee Widget', CASE WHEN p_book_trial THEN 'Trial Booked' ELSE 'Qualified' END, now())
    RETURNING id INTO v_lead_id;

    -- Update Lead Score with algorithmic formula
    UPDATE public.lead_scores SET score_numeric = v_score, tier = v_tier WHERE lead_id = v_lead_id;

    -- 6. Book Trial if requested
    IF p_book_trial THEN
      INSERT INTO public.trial_bookings (id, gym_id, lead_id, scheduled_time, status, created_at)
      VALUES (gen_random_uuid(), p_gym_id, v_lead_id, COALESCE(p_trial_time, now() + interval '1 day'), 'SCHEDULED', now())
      RETURNING id INTO v_trial_id;

      UPDATE public.ai_conversations_analytics SET trials_booked = trials_booked + 1 WHERE gym_id = p_gym_id AND date_key = CURRENT_DATE;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'lead_id', v_lead_id,
    'trial_id', v_trial_id,
    'score', v_score,
    'tier', v_tier,
    'recommendation', jsonb_build_object(
      'program', p_recommended_plan,
      'confidence', p_confidence,
      'duration', '6 Months Transformation',
      'trainer', 'Recommended Specialist',
      'nutrition', true,
      'price', '₹' || COALESCE(p_budget, 2999) || '/month'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_ai_sales_interaction(uuid, text, text, text, text, text, integer, text, numeric, numeric, text, integer, integer, text, text, numeric, boolean, timestamptz) TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 9. SEED DEFAULT SETTINGS & TRIAL SLOTS FOR WAY AHEAD FITNESS
-- ----------------------------------------------------------------------------
INSERT INTO public.ai_assistant_settings (gym_id)
VALUES ('11111111-1111-1111-1111-111111111111')
ON CONFLICT (gym_id) DO NOTHING;

INSERT INTO public.trial_slots (id, gym_id, slot_start, slot_end, capacity, booked)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', now() + interval '1 day' + interval '18 hours', now() + interval '1 day' + interval '19 hours', 5, 1),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', now() + interval '2 days' + interval '19 hours', now() + interval '2 days' + interval '20 hours', 5, 0),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', now() + interval '3 days' + interval '17 hours', now() + interval '3 days' + interval '18 hours', 5, 2)
ON CONFLICT DO NOTHING;
