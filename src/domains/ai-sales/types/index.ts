// ============================================================================
// Way Ahead GymOS v2.1 — AI Sales Assistant Bounded Context Types
// ============================================================================

export type ConversationStage = 'greeting' | 'qualification' | 'recommendation' | 'booking' | 'converted' | 'handoff';

export interface ConversationSession {
  id: string;
  gym_id: string;
  session_token: string;
  visitor_name?: string;
  visitor_phone?: string;
  visitor_email?: string;
  current_stage: ConversationStage;
  source: string;
  started_at: string;
  ended_at?: string;
  metadata?: Record<string, any>;
}

export interface ConversationMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface QualificationAnswers {
  id?: string;
  session_id?: string;
  age?: number;
  gender?: string;
  fitness_goal?: string;
  target_weight?: number;
  experience_level?: string;
  training_days?: number;
  budget?: number;
  preferred_time?: string;
  medical_issues?: string;
}

export interface AIProgramRecommendation {
  program: string;
  confidence: number;
  duration: string;
  trainer: string;
  nutrition: boolean;
  price: string;
  reasoning?: string;
}

export interface TrialSlot {
  id: string;
  gym_id: string;
  trainer_id?: string;
  slot_start: string;
  slot_end: string;
  capacity: number;
  booked: number;
}

export interface AIAssistantSettings {
  id?: string;
  gym_id: string;
  greeting: string;
  personality: 'professional_consultant' | 'energetic_coach' | 'empathetic_guide';
  offers: string[];
  memberships: {
    name: string;
    price: number;
    benefits: string[];
    duration?: string;
    popular?: boolean;
  }[];
  trainers: {
    name: string;
    specialization: string;
    experience: string;
    rating: string;
    photo?: string;
  }[];
  faqs: {
    q: string;
    a: string;
  }[];
  languages: string[];
  escalation_rules: {
    confidence_threshold: number;
    handoff_role: string;
    notify_channel: string;
  };
  is_active?: boolean;
}

export interface AIAnalyticsSummary {
  total_chats: number;
  qualified: number;
  trials_booked: number;
  conversions: number;
  avg_duration: number;
  total_revenue: number;
  conversion_rate: number;
}
