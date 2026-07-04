import { supabase } from '../lib/supabase';
import type { FollowUpSequence, FollowUpStep } from '../types/database';

export const sequenceService = {
  async getSequences(gymId: string): Promise<FollowUpSequence[]> {
    const { data, error } = await supabase
      .from('follow_up_sequences')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createSequence(gymId: string, name: string): Promise<FollowUpSequence> {
    const { data, error } = await supabase
      .from('follow_up_sequences')
      .insert([{ name, gym_id: gymId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSequence(
    id: string,
    updates: { name?: string; is_active?: boolean }
  ): Promise<FollowUpSequence> {
    const { data, error } = await supabase
      .from('follow_up_sequences')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSequence(id: string): Promise<void> {
    const { error } = await supabase
      .from('follow_up_sequences')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getSteps(sequenceId: string): Promise<FollowUpStep[]> {
    const { data, error } = await supabase
      .from('follow_up_steps')
      .select('*, templates(name, channel)')
      .eq('sequence_id', sequenceId)
      .order('order_number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addStep(
    sequenceId: string,
    templateId: string,
    delayDays: number,
    orderNumber: number
  ): Promise<FollowUpStep> {
    const { data, error } = await supabase
      .from('follow_up_steps')
      .insert([{
        sequence_id: sequenceId,
        template_id: templateId,
        delay_days: delayDays,
        order_number: orderNumber,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStep(
    id: string,
    updates: { template_id?: string; delay_days?: number; order_number?: number }
  ): Promise<FollowUpStep> {
    const { data, error } = await supabase
      .from('follow_up_steps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeStep(id: string): Promise<void> {
    const { error } = await supabase
      .from('follow_up_steps')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
