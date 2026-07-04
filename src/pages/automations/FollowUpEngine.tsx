import React, { useState, useMemo } from 'react';
import { Send, CheckCircle2, XCircle, Clock, Zap, Loader2, MailOpen, MousePointerClick } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService } from '../../services/leadService';
import { templateService } from '../../services/templateService';
import { automationService } from '../../services/automationService';
import { useGym } from '../../context/GymContext';

export const FollowUpEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'engine' | 'logs'>('engine');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const queryClient = useQueryClient();
  const { gym, gymId } = useGym();

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['leads', gymId],
    queryFn: () => leadService.getLeads(gymId!),
    enabled: !!gymId
  });

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['active-templates', gymId],
    queryFn: () => templateService.getActiveTemplates(gymId!),
    enabled: !!gymId
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['automation-logs', gymId],
    queryFn: () => automationService.getLogs(gymId!),
    enabled: !!gymId
  });

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Live preview with real gym name
  const messagePreview = useMemo(() => {
    if (!selectedTemplate || !selectedLead) return '';
    let body = selectedTemplate.content;
    body = body.replace(/\{\{name\}\}/g, selectedLead.name);
    body = body.replace(/\{\{phone\}\}/g, selectedLead.phone || '');
    body = body.replace(/\{\{email\}\}/g, selectedLead.email || '');
    body = body.replace(/\{\{goal\}\}/g, selectedLead.goal || 'your fitness goals');
    body = body.replace(/\{\{gym_name\}\}/g, gym?.name || 'Our Gym');
    return body;
  }, [selectedLead, selectedTemplate, gym]);

  const sendMutation = useMutation({
    mutationFn: () => {
      if (!selectedLead || !selectedTemplate) throw new Error("Select both a lead and template.");
      return automationService.triggerManualFollowUp(gymId!, selectedLead, selectedTemplate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-logs'] });
      setSelectedLeadId('');
      setSelectedTemplateId('');
      setActiveTab('logs');
    },
    onError: (err: Error) => {
      alert("Failed to send: " + err.message);
    }
  });

  const handleSend = () => {
    if (!selectedLeadId || !selectedTemplateId) {
      alert("Please select both a lead and a template.");
      return;
    }
    sendMutation.mutate();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'Sent': return <Send className="w-4 h-4 text-blue-400" />;
      case 'Opened': return <MailOpen className="w-4 h-4 text-indigo-400" />;
      case 'Clicked': return <MousePointerClick className="w-4 h-4 text-purple-400" />;
      case 'Failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'Queued': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Failed': return 'text-red-400';
      case 'Queued': return 'text-yellow-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Automations</h1>
        <p className="text-text-muted mt-1">Trigger follow-ups and monitor the pipeline.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('engine')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'engine' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
        >
          Follow-Up Engine
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'logs' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
        >
          Automation Logs
          {logs.length > 0 && <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{logs.length}</span>}
        </button>
      </div>

      {activeTab === 'engine' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manual Trigger Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-6"
          >
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Manual Trigger</h2>
                <p className="text-sm text-text-muted">Send an immediate customized follow-up</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-text-muted mb-1.5 block">1. Select Target Lead</label>
                <select 
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="input-field bg-surface text-text"
                  disabled={loadingLeads}
                >
                  <option value="">— Choose a lead —</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.goal ? `(${l.goal})` : ''} [{l.status}]
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-text-muted mb-1.5 block">2. Select Message Template</label>
                <select 
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="input-field bg-surface text-text"
                  disabled={loadingTemplates}
                >
                  <option value="">— Choose a template —</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} [{t.channel}]</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-text-muted">3. Message Preview</label>
                  {selectedTemplate?.channel && (
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-text-muted font-medium">
                      Via {selectedTemplate.channel}
                    </span>
                  )}
                </div>
                
                <div className="bg-background rounded-lg p-4 border border-white/10 min-h-[120px] shadow-inner relative">
                  {messagePreview ? (
                    <div className="font-mono text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                      {messagePreview}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm italic">
                      Select a lead and template to see preview
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                onClick={handleSend}
                disabled={sendMutation.isPending || !selectedLeadId || !selectedTemplateId}
                className="btn-primary w-full py-3 mt-4 text-base"
              >
                {sendMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Send className="w-5 h-5" /> Execute Follow-Up
                  </>
                )}
              </button>
            </div>
          </motion.div>
          
          {/* Scheduler Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="w-20 h-20 bg-surface rounded-2xl shadow-xl flex items-center justify-center mb-6 border border-white/10 relative z-10">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">Automation Scheduler</h3>
            <p className="text-text-muted text-sm max-w-sm mb-4 relative z-10">
              Set up sequences to automatically send follow-ups on Day 0, Day 1, Day 3, and Day 7 based on lead status.
            </p>
            <div className="flex gap-2 flex-wrap justify-center relative z-10 mb-6">
              {['Day 0', 'Day 1', 'Day 3', 'Day 7'].map(day => (
                <span key={day} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-text-muted font-medium">{day}</span>
              ))}
            </div>
            
            <button className="bg-white/5 border border-white/10 text-white font-medium py-2 px-6 rounded-lg hover:bg-white/10 transition-colors relative z-10">
              Configure Sequences (Coming Soon)
            </button>
          </motion.div>
        </div>
      ) : (
        /* Automation Logs */
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel overflow-hidden"
        >
          <div className="overflow-x-auto min-h-[400px]">
            {loadingLogs ? (
               <div className="flex justify-center items-center h-48">
                 <Loader2 className="w-8 h-8 text-primary animate-spin" />
               </div>
            ) : logs.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-text-muted">
                 <Clock className="w-8 h-8 mb-3 opacity-50" />
                 <p>No automations triggered yet.</p>
                 <button onClick={() => setActiveTab('engine')} className="text-primary hover:underline text-sm mt-2">
                   Send your first follow-up
                 </button>
               </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-surface/50">
                    <th className="p-4 text-sm font-medium text-text-muted">Date & Time</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Lead</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Template</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Channel</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Status</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-text-muted font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium text-white">
                        {log.leads?.name || 'Unknown'}
                      </td>
                      <td className="p-4 text-sm text-text-muted">
                        {log.templates?.name || 'Unknown'}
                      </td>
                      <td className="p-4 text-sm text-text-muted">
                        <span className="bg-white/5 px-2 py-1 rounded border border-white/10">
                          {log.channel}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {getStatusIcon(log.status)}
                          <span className={getStatusColor(log.status)}>
                            {log.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-text-muted max-w-xs truncate" title={log.message_preview || ''}>
                        {log.message_preview || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
