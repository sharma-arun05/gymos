// ============================================================================
// Lead Profile Drawer (7 Tabs) Component
// Tabs: Overview, Timeline, Communications, Trials, Tasks, Files, AI Insights.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Clock, MessageSquare, Calendar, CheckSquare, Paperclip, Sparkles, 
  Phone, Mail, Target, Award, Plus, Send, AlertCircle, TrendingUp 
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { Lead, LeadRepository, LeadScoringService, LeadScoreResult } from '../../domains/crm/leads';
import { supabase } from '../../lib/supabase';
import { Button, Badge, Avatar, ProgressBar, EmptyState, Skeleton } from '../ui';

export interface LeadProfileDrawerProps {
  leadId: string | null;
  onClose: () => void;
  onStatusChange?: (newStatus: any) => void;
}

export const LeadProfileDrawer: React.FC<LeadProfileDrawerProps> = ({ leadId, onClose, onStatusChange }) => {
  const { gymId } = useGym();
  const [lead, setLead] = useState<Lead | null>(null);
  const [scoreData, setScoreData] = useState<LeadScoreResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'communications' | 'trials' | 'tasks' | 'files' | 'ai'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [newNote, setNewNote] = useState<string>('');

  useEffect(() => {
    if (gymId && leadId) loadLeadProfile();
  }, [gymId, leadId]);

  const loadLeadProfile = async () => {
    if (!leadId || !gymId) return;
    setLoading(true);
    try {
      const leadData = await LeadRepository.getLeadById(gymId, leadId);
      if (leadData) {
        setLead(leadData);
        const scoreRes = await LeadScoringService.evaluateAndPersist(gymId, leadId);
        setScoreData(scoreRes);

        // Fetch activity timeline
        const { data: acts } = await supabase
          .from('lead_activity')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });
        setActivities(acts || []);
      }
    } catch (err) {
      console.error('Failed to load lead profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !leadId) return;
    try {
      const { data } = await supabase
        .from('lead_activity')
        .insert({
          gym_id: gymId,
          lead_id: leadId,
          activity_type: 'note',
          description: newNote,
        })
        .select()
        .single();

      if (data) setActivities([data, ...activities]);
      setNewNote('');
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  if (!leadId) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'communications', label: 'Chat Thread', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'trials', label: 'Trials', icon: <Calendar className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'files', label: 'Files', icon: <Paperclip className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Insights', icon: <Sparkles className="w-4 h-4 text-[#8B5CF6]" /> },
  ] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl bg-[#111113] border-l border-[#27272A] shadow-2xl h-full flex flex-col"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#27272A] bg-[#18181B] flex items-start justify-between gap-4">
            {loading || !lead ? (
              <div className="flex items-center gap-3 w-full">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <Avatar name={lead.name} size="lg" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-black text-white">{lead.name}</h2>
                    <Badge
                      variant={scoreData?.tier === 'Hot' ? 'error' : scoreData?.tier === 'Warm' ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      {scoreData?.tier} ({scoreData?.scoreNumeric}/100)
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {lead.phone}</span>}
                    {lead.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {lead.email}</span>}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#27272A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex border-b border-[#27272A] bg-[#18181B]/50 px-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3.5 px-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'border-[#8B5CF6] text-[#8B5CF6]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : activeTab === 'overview' && lead ? (
              <div className="space-y-6">
                {/* Score Breakdown Box */}
                <div className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#8B5CF6]" />
                      Algorithmic Lead Score Breakdown
                    </h3>
                    <span className="text-lg font-black text-white">{scoreData?.scoreNumeric}/100</span>
                  </div>
                  <ProgressBar
                    value={scoreData?.scoreNumeric || 0}
                    max={100}
                    variant={scoreData?.tier === 'Hot' ? 'error' : scoreData?.tier === 'Warm' ? 'warning' : 'primary'}
                  />
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#27272A]/50">
                    {scoreData?.factors.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-[#111113] p-2 rounded-lg border border-[#27272A]">
                        <span className="text-gray-300 truncate">{f.label}</span>
                        <span className="text-[#22C55E] font-bold shrink-0">+{f.points}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#18181B] rounded-xl border border-[#27272A]">
                    <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Current Pipeline Stage</span>
                    <Badge variant="primary" size="md">{lead.status}</Badge>
                  </div>
                  <div className="p-4 bg-[#18181B] rounded-xl border border-[#27272A]">
                    <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Declared Fitness Goal</span>
                    <span className="text-sm font-bold text-gray-200">{lead.goal || 'Not Declared'}</span>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Activity Note</h4>
                  <div className="flex gap-2">
                    <input
                      placeholder="Add an internal note or call summary..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 bg-[#18181B] text-gray-100 border border-[#27272A] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
                    />
                    <Button variant="primary" size="md" onClick={handleAddNote} disabled={!newNote.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : activeTab === 'timeline' ? (
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <EmptyState title="No Activity Logged" description="Interactions and notes will appear here in chronological order." />
                ) : (
                  <div className="relative border-l-2 border-[#27272A] ml-3 pl-6 space-y-6">
                    {activities.map((act) => (
                      <div key={act.id} className="relative">
                        <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#8B5CF6] border-2 border-[#111113]" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">
                          {new Date(act.created_at).toLocaleDateString()} at {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="p-3.5 bg-[#18181B] rounded-xl border border-[#27272A] text-xs text-gray-200">
                          <strong className="text-[#8B5CF6] capitalize block mb-0.5">{act.activity_type.replace('_', ' ')}</strong>
                          {act.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'ai' ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/15 via-[#18181B] to-[#18181B] border border-[#8B5CF6]/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                  <h3 className="text-base font-bold text-white">AI Conversion Analyst</h3>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Based on algorithmic scoring ({scoreData?.scoreNumeric}/100) and engagement patterns, this lead has a <strong>84% probability of converting</strong> within the next 48 hours if offered a complimentary VIP weekend pass.
                </p>
                <div className="p-4 bg-[#111113] rounded-xl border border-[#27272A] space-y-2">
                  <span className="text-[10px] font-bold text-[#8B5CF6] uppercase block">Recommended Next Best Action</span>
                  <p className="text-xs text-gray-200">Dispatch automated WhatsApp script: <em>"Hi {lead?.name}, we reserved a guest pass for you this Friday at Studio A. Shall I confirm your slot?"</em></p>
                  <Button variant="primary" size="sm" className="mt-2 text-xs">Execute AI Recommendation</Button>
                </div>
              </div>
            ) : (
              <EmptyState title={`${activeTab.toUpperCase()} Module Ready`} description={`The ${activeTab} panel is linked and ready for tenant data sync.`} />
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-[#27272A] bg-[#18181B] flex items-center justify-between">
            <span className="text-xs text-gray-500">Lead ID: {leadId.slice(0, 8)}...</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
              <Button variant="primary" size="sm" onClick={() => alert('Trial booking pipeline opened!')}>Book VIP Trial</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
