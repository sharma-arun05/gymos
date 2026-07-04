import { supabase } from '../lib/supabase';

export const dashboardService = {
  async getMetrics(gymId: string) {

    const { data: leads, error } = await supabase
      .from('leads')
      .select('status, created_at')
      .eq('gym_id', gymId);

    if (error) throw error;

    const totalLeads = leads?.length || 0;
    const newLeads = leads?.filter(l => l.status === 'New').length || 0;
    const contacted = leads?.filter(l => l.status === 'Contacted').length || 0;
    const trialBooked = leads?.filter(l => l.status === 'Trial Booked').length || 0;
    const joined = leads?.filter(l => l.status === 'Joined').length || 0;
    const lost = leads?.filter(l => l.status === 'Lost').length || 0;

    // Today's leads
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLeads = leads?.filter(l => new Date(l.created_at) >= today).length || 0;
    
    const conversionRate = totalLeads > 0 ? ((joined / totalLeads) * 100).toFixed(1) : '0.0';

    return {
      totalLeads,
      newLeads,
      contacted,
      trialBooked,
      joined,
      lost,
      todayLeads,
      conversionRate
    };
  }
};
