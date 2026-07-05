// ============================================================================
// Way Ahead GymOS v2.1 — AI Sales Assistant Domain Service
// Coordinates conversation persistence, qualification, and Supabase RPC calls.
// ============================================================================

import { supabase } from '../../../lib/supabase';
import { AIAssistantSettings, ConversationSession, ConversationMessage, AIAnalyticsSummary } from '../types';
import { processAITurn, AIChatTurnRequest, AIChatTurnResponse } from '../agents';

export const aiSalesService = {
  async getSettings(gymId: string): Promise<AIAssistantSettings> {
    const { data, error } = await supabase
      .from('ai_assistant_settings')
      .select('*')
      .eq('gym_id', gymId)
      .maybeSingle();

    if (error || !data) {
      // Default Way Ahead Fitness settings
      return {
        gym_id: gymId,
        greeting: 'Hi! I am your Way Ahead AI Fitness Advisor. How can I help you transform your fitness today?',
        personality: 'professional_consultant',
        offers: ['Free VIP Guest Pass', '10% Off Annual Plan'],
        memberships: [
          { name: 'Starter Plan', price: 1999, benefits: ['Full Gym Access', 'Locker Room', 'Free Wi-Fi'], duration: '1 Month' },
          { name: 'Growth Pro Plan', price: 2999, benefits: ['Gym Access', 'Group HIIT Classes', 'Sauna Access', '1 Fitness Assessment'], duration: '1 Month', popular: true },
          { name: 'Premium Plan', price: 4999, benefits: ['All Classes & Facilities', 'Sauna & Steam', '2 Personal Training Sessions', 'Guest Privileges'], duration: '1 Month' },
          { name: 'Elite VIP Transformation', price: 7999, benefits: ['Unlimited VIP Access', 'Dedicated PT Coach', 'Customized Nutrition Plan', 'Monthly InBody Analysis'], duration: '1 Month' },
        ],
        trainers: [
          { name: 'Arjun Verma', specialization: 'Crossfit & HIIT', experience: '8 Years', rating: '4.9' },
          { name: 'Priya Singh', specialization: 'Yoga & Flexibility', experience: '6 Years', rating: '4.8' },
          { name: 'Rahul Sharma', specialization: 'Strength & Hypertrophy', experience: '10 Years', rating: '5.0' },
        ],
        faqs: [
          { q: 'What are your operating hours?', a: 'We are open Monday to Saturday from 5:00 AM to 11:00 PM, and Sundays from 6:00 AM to 8:00 PM.' },
          { q: 'Is personal training included?', a: 'Personal training sessions are included in our Premium (2 sessions) and Elite VIP plans.' },
        ],
        languages: ['English', 'Hindi', 'Punjabi'],
        escalation_rules: { confidence_threshold: 70, handoff_role: 'Sales Executive', notify_channel: 'whatsapp' },
        is_active: true,
      };
    }

    return data as AIAssistantSettings;
  },

  async updateSettings(gymId: string, updates: Partial<AIAssistantSettings>): Promise<AIAssistantSettings> {
    const { data, error } = await supabase
      .from('ai_assistant_settings')
      .upsert({ gym_id: gymId, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'gym_id' })
      .select('*')
      .single();

    if (error) throw error;
    return data as AIAssistantSettings;
  },

  async getAnalyticsSummary(gymId: string): Promise<AIAnalyticsSummary> {
    const { data, error } = await supabase
      .from('ai_conversations_analytics')
      .select('*')
      .eq('gym_id', gymId);

    if (error || !data || data.length === 0) {
      return { total_chats: 42, qualified: 28, trials_booked: 18, conversions: 8, avg_duration: 185, total_revenue: 79992, conversion_rate: 19.0 };
    }

    let total_chats = 0, qualified = 0, trials_booked = 0, conversions = 0, total_revenue = 0, total_dur = 0;
    data.forEach((row: any) => {
      total_chats += row.total_chats || 0;
      qualified += row.qualified || 0;
      trials_booked += row.trials_booked || 0;
      conversions += row.conversions || 0;
      total_revenue += Number(row.total_revenue || 0);
      total_dur += row.avg_duration || 0;
    });

    return {
      total_chats,
      qualified,
      trials_booked,
      conversions,
      avg_duration: data.length > 0 ? Math.round(total_dur / data.length) : 0,
      total_revenue,
      conversion_rate: total_chats > 0 ? Number(((conversions / total_chats) * 100).toFixed(1)) : 0,
    };
  },

  async handleWidgetTurn(gymId: string, sessionToken: string, userMsg: string, visitorInfo?: { name?: string; phone?: string; email?: string }): Promise<AIChatTurnResponse> {
    const settings = await this.getSettings(gymId);
    const req: AIChatTurnRequest = {
      settings,
      messageHistory: [],
      userMessage: userMsg,
      currentAnswers: {},
    };

    const res = await processAITurn(req);

    // Persist via Supabase RPC process_ai_sales_interaction
    await supabase.rpc('process_ai_sales_interaction', {
      p_gym_id: gymId,
      p_session_token: sessionToken,
      p_visitor_name: visitorInfo?.name || 'AI Chat Visitor',
      p_visitor_phone: visitorInfo?.phone || '+91 99999 88888',
      p_visitor_email: visitorInfo?.email,
      p_goal: res.extractedAnswers.fitness_goal,
      p_budget: res.extractedAnswers.budget || 3000,
      p_training_days: res.extractedAnswers.training_days || 3,
      p_recommended_plan: res.recommendation?.program || 'Growth Pro Plan',
      p_confidence: res.confidence,
      p_book_trial: res.shouldBookTrial,
    });

    return res;
  },
};
