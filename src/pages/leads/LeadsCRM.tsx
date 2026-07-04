import React, { useState } from 'react';
import { Plus, Search, Filter, Loader2, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService } from '../../services/leadService';
import type { Lead } from '../../types/database';
import { useGym } from '../../context/GymContext';

export const LeadsCRM: React.FC = () => {
  const { gymId } = useGym();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads', gymId],
    queryFn: () => leadService.getLeads(gymId!),
    enabled: !!gymId
  });

  const createMutation = useMutation({
    mutationFn: (leadData: Omit<Lead, 'id' | 'created_at' | 'gym_id'>) => leadService.createLead(gymId!, leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      setIsAddModalOpen(false);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: Lead['status'] }) => 
      leadService.updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: leadService.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    }
  });

  const handleAddLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      goal: formData.get('goal') as string,
      status: 'New',
      lead_score: 'Warm',
      source: 'Manual',
      budget: null,
      preferred_time: null,
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'New': return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
      case 'Contacted': return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'Trial Scheduled': return 'bg-purple-400/10 text-purple-400 border-purple-400/20';
      case 'Trial Attended': return 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20';
      case 'Joined': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      case 'Lost': return 'bg-red-400/10 text-red-400 border-red-400/20';
      default: return 'bg-surface text-text-muted border-white/10';
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lead.phone && lead.phone.includes(searchTerm))
  );

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
        Failed to load leads: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trial Booking Pipeline</h1>
          <p className="text-text-muted mt-1">Manage prospects through the trial-to-member journey.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Add Lead
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-white/10 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search leads by name, email, or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-text focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <button className="btn-secondary">
            <Filter className="w-5 h-5" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-text-muted">
              <p>{searchTerm ? 'No leads match your search.' : 'No leads found.'}</p>
              {!searchTerm && (
                <button onClick={() => setIsAddModalOpen(true)} className="text-primary hover:underline mt-2 text-sm">
                  Add your first lead
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-surface/50">
                  <th className="p-4 text-sm font-medium text-text-muted">Name</th>
                  <th className="p-4 text-sm font-medium text-text-muted">Contact Info</th>
                  <th className="p-4 text-sm font-medium text-text-muted">Goal</th>
                  <th className="p-4 text-sm font-medium text-text-muted">Status</th>
                  <th className="p-4 text-sm font-medium text-text-muted">Score</th>
                  <th className="p-4 text-sm font-medium text-text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    key={lead.id} 
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-medium text-white">{lead.name}</td>
                    <td className="p-4 text-sm text-text-muted">
                      <div>{lead.email || '—'}</div>
                      <div className="mt-0.5">{lead.phone || '—'}</div>
                    </td>
                    <td className="p-4 text-sm text-text-muted">{lead.goal || '—'}</td>
                    <td className="p-4">
                      <select 
                        value={lead.status}
                        onChange={(e) => updateStatusMutation.mutate({ id: lead.id, status: e.target.value as Lead['status'] })}
                        className={`px-3 py-1 rounded-full text-xs font-medium border appearance-none cursor-pointer outline-none ${getStatusColor(lead.status)}`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Trial Scheduled">Trial Scheduled</option>
                        <option value="Trial Attended">Trial Attended</option>
                        <option value="Joined">Joined</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded-md text-xs font-semibold ${lead.lead_score === 'Hot' ? 'bg-red-500/20 text-red-400' : lead.lead_score === 'Warm' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                         {lead.lead_score}
                       </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => {
                          if (confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) {
                            deleteMutation.mutate(lead.id);
                          }
                        }}
                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors text-text-muted"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h2 className="text-xl font-semibold text-white">Add New Lead</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddLead} className="p-6 space-y-4">
                {createMutation.isError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
                    {(createMutation.error as Error).message}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-muted">Full Name *</label>
                  <input name="name" type="text" required className="input-field" placeholder="John Doe" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-muted">Email</label>
                  <input name="email" type="email" className="input-field" placeholder="john@example.com" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-muted">Phone Number</label>
                  <input name="phone" type="tel" className="input-field" placeholder="+91 98765 43210" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-muted">Goal</label>
                  <select name="goal" className="input-field bg-surface text-text">
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Endurance">Endurance</option>
                    <option value="Flexibility">Flexibility</option>
                    <option value="General Fitness">General Fitness</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Lead'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
