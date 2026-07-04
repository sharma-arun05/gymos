import { supabase } from '../lib/supabase';
import type { Gym } from '../types/database';

export const gymService = {
  async getGyms(): Promise<Gym[]> {
    const { data, error } = await supabase.from('gyms').select('*');
    if (error) throw error;
    return data || [];
  },

  async getGymById(id: string): Promise<Gym | null> {
    const { data, error } = await supabase.from('gyms').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createGym(gym: Partial<Omit<Gym, 'id' | 'created_at'>>): Promise<Gym> {
    const { data, error } = await supabase.from('gyms').insert([gym]).select().single();
    if (error) throw error;
    return data;
  },

  async updateGym(id: string, updates: Partial<Omit<Gym, 'id' | 'created_at'>>): Promise<Gym> {
    const { data, error } = await supabase.from('gyms').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async linkUserToGym(authUserId: string, gymId: string, _email?: string): Promise<void> {
    // This assumes public.users is already created via trigger on auth.users creation.
    // We just need to update it with the gym_id.
    const { error } = await supabase
      .from('users')
      .update({ gym_id: gymId })
      .eq('auth_user_id', authUserId);

    if (error) throw error;
  }
};
