import { supabase } from '../lib/supabase';
import type { Template } from '../types/database';

export const templateService = {
  async getTemplates(gymId: string): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getActiveTemplates(gymId: string): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTemplate(gymId: string, template: Omit<Template, 'id' | 'created_at' | 'gym_id'>): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .insert([{ ...template, gym_id: gymId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTemplate(id: string, updates: Partial<Omit<Template, 'id' | 'created_at' | 'gym_id'>>): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleTemplateActive(id: string, is_active: boolean): Promise<Template> {
    return this.updateTemplate(id, { is_active });
  }
};
