export interface Gym {
  id: string;
  name: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  industry: string | null;
  plan: string;
  created_at: string;
}

export interface User {
  id: string;
  auth_user_id: string;
  gym_id: string | null;
  email: string;
  role: string;
  created_at: string;
}

export interface Lead {
  id: string;
  gym_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  goal: string | null;
  budget: string | null;
  preferred_time: string | null;
  status: 'New' | 'Contacted' | 'Trial Scheduled' | 'Trial Attended' | 'Joined' | 'Lost';
  lead_score: 'Hot' | 'Warm' | 'Cold';
  source: string;
  created_at: string;
}

export interface Template {
  id: string;
  gym_id: string;
  template_type: string;
  name: string;
  channel: 'email' | 'whatsapp' | 'both';
  subject: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
}

export interface AutomationLog {
  id: string;
  gym_id: string;
  lead_id: string;
  template_id: string | null;
  channel: string;
  status: 'Queued' | 'Sent' | 'Delivered' | 'Failed' | 'Opened' | 'Clicked';
  message_preview: string | null;
  delivery_response: string | null;
  error_message: string | null;
  created_at: string;
}

// Joined types for UI
export interface AutomationLogWithDetails extends AutomationLog {
  leads: { name: string } | null;
  templates: { name: string } | null;
}

export interface FollowUpSequence {
  id: string;
  gym_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface FollowUpStep {
  id: string;
  sequence_id: string;
  template_id: string;
  delay_days: number;
  order_number: number;
  // Joined
  templates?: { name: string; channel: string } | null;
}

export interface ScheduledMessage {
  id: string;
  gym_id: string;
  lead_id: string;
  template_id: string;
  channel: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  created_at: string;
  // Joined
  leads?: { name: string } | null;
  templates?: { name: string } | null;
}
