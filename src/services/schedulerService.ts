import { supabase } from '../lib/supabase';
import type { ScheduledMessage } from '../types/database';

export const schedulerService = {
  async getScheduledMessages(gymId: string): Promise<ScheduledMessage[]> {
    const { data, error } = await supabase
      .from('scheduled_messages')
      .select('*, leads(name), templates(name)')
      .eq('gym_id', gymId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async scheduleMessage(
    gymId: string,
    leadId: string,
    templateId: string,
    channel: string,
    scheduledAt: Date
  ): Promise<ScheduledMessage> {
    const { data, error } = await supabase
      .from('scheduled_messages')
      .insert([{
        gym_id: gymId,
        lead_id: leadId,
        template_id: templateId,
        channel,
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async cancelScheduledMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('scheduled_messages')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;
  },

  async getPendingMessages(): Promise<ScheduledMessage[]> {
    const { data, error } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;
    return data || [];
  }
};
