import React, { useState } from 'react';
import { Plus, MessageSquare, Mail, Smartphone, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from '../../services/templateService';
import { useGym } from '../../context/GymContext';
import type { Template } from '../../types/database';

export const Templates: React.FC = () => {
  const { gymId } = useGym();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['templates', gymId],
    queryFn: () => templateService.getTemplates(gymId!),
    enabled: !!gymId
  });

  const createMutation = useMutation({
    mutationFn: (templateData: Omit<Template, 'id' | 'created_at' | 'gym_id'>) => templateService.createTemplate(gymId!, templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['active-templates'] });
      setIsAddModalOpen(false);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string, is_active: boolean }) => 
      templateService.toggleTemplateActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['active-templates'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: templateService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['active-templates'] });
    }
  });

  const handleAddTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      template_type: formData.get('template_type') as string,
      channel: formData.get('channel') as 'email' | 'whatsapp' | 'both',
      subject: formData.get('subject') as string || null,
      content: formData.get('content') as string,
      is_active: true,
    });
  };

  const getChannelIcon = (channel: string) => {
    switch(channel) {
      case 'whatsapp': return <Smartphone className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getChannelStyle = (channel: string) => {
    switch(channel) {
      case 'whatsapp': return 'bg-green-500/10 text-green-500';
      case 'email': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-purple-500/10 text-purple-500';
    }
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
        Failed to load templates: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Message Templates</h1>
          <p className="text-text-muted mt-1">Design and manage your automated responses.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> New Template
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="glass-panel p-8 text-center flex flex-col items-center">
          <MessageSquare className="w-12 h-12 text-text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-white mb-2">No templates yet</h3>
          <p className="text-text-muted max-w-sm mb-6">Create your first template to start automating follow-ups with your leads.</p>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">Create Template</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.1, 0.5) }}
              className={`glass-panel p-6 flex flex-col ${!template.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getChannelStyle(template.channel)}`}>
                    {getChannelIcon(template.channel)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    <p className="text-xs text-text-muted">{template.template_type} • {template.channel}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleActiveMutation.mutate({ id: template.id, is_active: !template.is_active })}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${template.is_active ? 'bg-primary' : 'bg-surface border border-white/10'}`}
                >
                  <motion.div 
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: template.is_active ? 16 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
              
              <div className="bg-background rounded-lg p-3 text-sm text-text-muted font-mono whitespace-pre-wrap border border-white/5 flex-1 overflow-hidden relative min-h-[80px]">
                {template.subject && <div className="font-bold text-white mb-2 border-b border-white/10 pb-1">Subj: {template.subject}</div>}
                <div className="line-clamp-6">{template.content}</div>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                <button className="flex-1 btn-secondary text-sm py-1.5 hover:text-white">Edit</button>
                <button 
                  onClick={() => {
                    if(confirm(`Delete template "${template.name}"?`)) deleteMutation.mutate(template.id);
                  }}
                  className="flex-1 bg-surface hover:bg-red-500/20 text-text-muted hover:text-red-400 border border-white/10 rounded-lg text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Template Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg my-8"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 sticky top-0 rounded-t-2xl backdrop-blur-md">
                <h2 className="text-xl font-semibold text-white">Create Template</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddTemplate} className="p-6 space-y-5">
                {createMutation.isError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
                    {(createMutation.error as Error).message}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-muted">Template Name *</label>
                    <input name="name" type="text" required className="input-field" placeholder="e.g. Day 1 Follow Up" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-muted">Type</label>
                    <select name="template_type" className="input-field bg-surface text-text">
                      <option value="welcome">Welcome</option>
                      <option value="day1">Day 1</option>
                      <option value="day3">Day 3</option>
                      <option value="trial">Trial</option>
                      <option value="offer">Offer</option>
                      <option value="reactivation">Reactivation</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-muted">Channel *</label>
                  <select name="channel" className="input-field bg-surface text-text">
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-muted">Subject (Emails only)</label>
                  <input name="subject" type="text" className="input-field" placeholder="Welcome to {{gym_name}}" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-end mb-1">
                    <label className="text-sm font-medium text-text-muted">Message Content *</label>
                    <span className="text-xs text-text-muted">{'{{name}} {{goal}} {{gym_name}} {{phone}} {{email}}'}</span>
                  </div>
                  <textarea 
                    name="content" 
                    required 
                    rows={6} 
                    className="input-field font-mono text-sm resize-y" 
                    placeholder={"Hi {{name}},\n\nWelcome to {{gym_name}}..."}
                  />
                </div>

                <div className="pt-4 flex gap-3 border-t border-white/10 mt-6">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Template'}
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
