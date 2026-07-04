import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  X,
  GitBranch,
  Mail,
  Smartphone,
  MessageSquare,
  Zap,
  ChevronDown,
  Clock,
  Hash,
  ArrowDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sequenceService } from '../../services/sequenceService';
import { templateService } from '../../services/templateService';
import { useGym } from '../../context/GymContext';
import type { FollowUpSequence, FollowUpStep, Template } from '../../types/database';

/* ──────────────────────────────────────────────────────────────────────
   Channel helpers (re-used from Templates page style)
   ────────────────────────────────────────────────────────────────── */

const channelBadge = (channel: string) => {
  const cfg: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    email:    { icon: <Mail className="w-3.5 h-3.5" />,       label: 'Email',    cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    whatsapp: { icon: <Smartphone className="w-3.5 h-3.5" />, label: 'WhatsApp', cls: 'bg-green-500/15 text-green-400 border-green-500/20' },
    both:     { icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Both', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  };
  const c = cfg[channel] ?? cfg.both;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
};

const delayLabel = (days: number) => {
  if (days === 0) return 'Immediately';
  if (days === 1) return 'Day 1';
  return `Day ${days}`;
};

/* ──────────────────────────────────────────────────────────────────────
   Step Timeline – renders the visual pipeline for one sequence
   ────────────────────────────────────────────────────────────────── */

const StepTimeline: React.FC<{
  sequenceId: string;
  onAddStep: () => void;
}> = ({ sequenceId, onAddStep }) => {
  const queryClient = useQueryClient();

  const {
    data: steps = [],
    isLoading,
    error,
  } = useQuery<FollowUpStep[]>({
    queryKey: ['sequence-steps', sequenceId],
    queryFn: () => sequenceService.getSteps(sequenceId),
  });

  const removeMutation = useMutation({
    mutationFn: sequenceService.removeStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence-steps', sequenceId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-lg">
        Failed to load steps: {(error as Error).message}
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Zap className="w-7 h-7 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-white font-medium mb-1">No steps yet</p>
          <p className="text-text-muted text-sm max-w-xs">
            Add your first step to start building this follow-up sequence.
          </p>
        </div>
        <button onClick={onAddStep} className="btn-primary text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Add First Step
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Timeline */}
      <div className="relative pl-8">
        {/* Vertical connector line */}
        <div
          className="absolute left-[15px] top-4 bottom-16 w-px"
          style={{
            background: 'linear-gradient(180deg, #4f46e5 0%, #4f46e520 100%)',
          }}
        />

        {steps.map((step, idx) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
            className="relative mb-4 last:mb-0"
          >
            {/* Dot on the timeline */}
            <div className="absolute -left-8 top-5 w-[11px] h-[11px] rounded-full border-2 border-primary bg-background z-10" />

            {/* Arrow between steps */}
            {idx < steps.length - 1 && (
              <div className="absolute -left-[26px] bottom-[-12px] z-10 text-primary/40">
                <ArrowDown className="w-3 h-3" />
              </div>
            )}

            {/* Step Card */}
            <div className="glass-panel p-4 hover:border-primary/30 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Step number badge */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{idx + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h4 className="font-semibold text-white text-sm truncate">
                        {step.templates?.name ?? 'Unknown Template'}
                      </h4>
                      {channelBadge(step.templates?.channel ?? 'email')}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {delayLabel(step.delay_days)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Order {step.order_number}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete step */}
                <button
                  onClick={() => removeMutation.mutate(step.id)}
                  disabled={removeMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400"
                  title="Remove step"
                >
                  {removeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Step button at end of timeline */}
      <div className="pl-8 mt-4">
        <button
          onClick={onAddStep}
          className="btn-secondary text-sm gap-1.5 w-full justify-center border-dashed hover:border-primary/40 hover:text-primary"
        >
          <Plus className="w-4 h-4" /> Add Step
        </button>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────
   Add Step Modal
   ────────────────────────────────────────────────────────────────── */

const AddStepModal: React.FC<{
  sequenceId: string;
  nextOrder: number;
  onClose: () => void;
  gymId: string;
}> = ({ sequenceId, nextOrder, onClose, gymId }) => {
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState('');
  const [delayDays, setDelayDays] = useState(0);

  const { data: templates = [], isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ['active-templates', gymId],
    queryFn: () => templateService.getActiveTemplates(gymId),
    enabled: !!gymId
  });

  const addMutation = useMutation({
    mutationFn: () =>
      sequenceService.addStep(sequenceId, templateId, delayDays, nextOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence-steps', sequenceId] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) return;
    addMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.03] rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-white">Add Step</h2>
            <p className="text-xs text-text-muted mt-0.5">Step #{nextOrder} in sequence</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {addMutation.isError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
              {(addMutation.error as Error).message}
            </div>
          )}

          {/* Template selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-muted">Template *</label>
            {templatesLoading ? (
              <div className="input-field flex items-center gap-2 text-text-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading templates…
              </div>
            ) : templates.length === 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm p-3 rounded-lg">
                No active templates found. Create one in the Templates page first.
              </div>
            ) : (
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
                className="input-field bg-surface text-text"
              >
                <option value="" disabled>
                  Select a template…
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.channel})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Delay days */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-muted">Delay (days)</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={365}
                value={delayDays}
                onChange={(e) => setDelayDays(Math.max(0, parseInt(e.target.value) || 0))}
                className="input-field pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                {delayLabel(delayDays)}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              0 = send immediately, 1 = send after 1 day, etc.
            </p>
          </div>

          {/* Order display */}
          <div className="bg-background rounded-lg border border-white/5 p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Hash className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Step #{nextOrder}</p>
              <p className="text-xs text-text-muted">Auto-assigned based on current steps</p>
            </div>
          </div>

          <div className="pt-3 flex gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending || !templateId}
              className="btn-primary flex-1"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Add Step'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────
   Create Sequence Modal
   ────────────────────────────────────────────────────────────────── */

const CreateSequenceModal: React.FC<{ onClose: () => void, gymId: string }> = ({ onClose, gymId }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: () => sequenceService.createSequence(gymId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.03] rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-white">Create Sequence</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Build an automated follow-up pipeline
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {createMutation.isError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
              {(createMutation.error as Error).message}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-muted">Sequence Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. New Lead Follow-Up"
              className="input-field"
              autoFocus
            />
            <p className="text-xs text-text-muted">
              Give it a descriptive name like "Trial Signup Nurture" or "Lost Lead Win-Back"
            </p>
          </div>

          <div className="pt-3 flex gap-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Create Sequence'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────
   Main Page – SequenceBuilder
   ────────────────────────────────────────────────────────────────── */

export const SequenceBuilder: React.FC = () => {
  const { gymId } = useGym();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addStepForId, setAddStepForId] = useState<string | null>(null);
  const [addStepNextOrder, setAddStepNextOrder] = useState(1);

  /* ---- Queries ---- */
  const {
    data: sequences = [],
    isLoading,
    error,
  } = useQuery<FollowUpSequence[]>({
    queryKey: ['sequences', gymId],
    queryFn: () => sequenceService.getSequences(gymId!),
    enabled: !!gymId
  });

  /* ---- Mutations ---- */
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      sequenceService.updateSequence(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: sequenceService.deleteSequence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    },
  });

  /* ---- Steps count helper (uses cached query data if available) ---- */
  const getStepsCountFromCache = (seqId: string): number | null => {
    const cached = queryClient.getQueryData<FollowUpStep[]>(['sequence-steps', seqId]);
    return cached ? cached.length : null;
  };

  /* ---- Handlers ---- */
  const handleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openAddStep = (sequenceId: string) => {
    const cached = queryClient.getQueryData<FollowUpStep[]>([
      'sequence-steps',
      sequenceId,
    ]);
    setAddStepNextOrder((cached?.length ?? 0) + 1);
    setAddStepForId(sequenceId);
  };

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
        Failed to load sequences: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-primary" />
            Follow-Up Sequences
          </h1>
          <p className="text-text-muted mt-1">
            Build automated multi-step follow-up pipelines that convert leads on autopilot.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" /> New Sequence
        </button>
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : sequences.length === 0 ? (
        /* ---- Empty state ---- */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-12 text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <GitBranch className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No sequences yet
          </h3>
          <p className="text-text-muted max-w-md mb-6 leading-relaxed">
            Follow-up sequences let you automate a series of messages over time.
            Create your first sequence to start converting leads while you sleep.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" /> Create Your First Sequence
          </button>
        </motion.div>
      ) : (
        /* ---- Sequence cards ---- */
        <div className="space-y-4">
          {sequences.map((seq, i) => {
            const isExpanded = expandedId === seq.id;
            const cachedCount = getStepsCountFromCache(seq.id);

            return (
              <motion.div
                key={seq.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.06, 0.3) }}
                layout
              >
                <div
                  className={`glass-panel overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'ring-1 ring-primary/30' : ''
                  } ${!seq.is_active ? 'opacity-60' : ''}`}
                >
                  {/* Card header – click to expand */}
                  <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => handleExpand(seq.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-white truncate">{seq.name}</h3>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
                          {cachedCount !== null && (
                            <span>{cachedCount} step{cachedCount !== 1 ? 's' : ''}</span>
                          )}
                          <span>
                            Created {new Date(seq.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Active toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActiveMutation.mutate({
                            id: seq.id,
                            is_active: !seq.is_active,
                          });
                        }}
                        className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${
                          seq.is_active
                            ? 'bg-primary'
                            : 'bg-surface border border-white/10'
                        }`}
                        title={seq.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full shadow-sm"
                          animate={{ x: seq.is_active ? 16 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete sequence "${seq.name}" and all its steps?`)) {
                            deleteMutation.mutate(seq.id);
                            if (expandedId === seq.id) setExpandedId(null);
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                        title="Delete sequence"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Chevron */}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <ChevronDown className="w-5 h-5 text-text-muted" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded – Step Timeline */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-2 border-t border-white/5">
                          <StepTimeline
                            sequenceId={seq.id}
                            onAddStep={() => openAddStep(seq.id)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateSequenceModal gymId={gymId!} onClose={() => setIsCreateModalOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addStepForId && (
          <AddStepModal
            gymId={gymId!}
            sequenceId={addStepForId}
            nextOrder={addStepNextOrder}
            onClose={() => setAddStepForId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
