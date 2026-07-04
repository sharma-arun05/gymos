import { supabase } from '../lib/supabase';
import type { Lead } from '../types/database';

export const leadService = {
  async getLeads(gymId: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getLeadById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createLead(gymId: string, lead: Omit<Lead, 'id' | 'created_at' | 'gym_id'>): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert([{ ...lead, gym_id: gymId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLead(id: string, updates: Partial<Omit<Lead, 'id' | 'created_at' | 'gym_id'>>): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateLeadStatus(id: string, status: Lead['status']): Promise<Lead> {
    return this.updateLead(id, { status });
  }
};
