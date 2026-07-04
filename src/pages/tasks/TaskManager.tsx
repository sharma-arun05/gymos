// ============================================================================
// Staff Task Management Board UI (/tasks)
// Kanban Board: Pending, In Progress, Completed with priority flags & lead links.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Plus } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { supabase } from '../../lib/supabase';
import { Button, Card, Badge, Avatar, Skeleton, Input, Select } from '../../components/ui';

export interface StaffTask {
  id: string;
  gym_id: string;
  lead_id?: string | null;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  created_at: string;
}

export const TaskManager: React.FC = () => {
  const { gymId } = useGym();
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  
  // New Task form state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPriority, setNewPriority] = useState<StaffTask['priority']>('medium');
  const [newStatus, setNewStatus] = useState<StaffTask['status']>('pending');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadTasks();
  }, [gymId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('gym_id', gymId || 'demo-gym')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTasks(data as unknown as StaffTask[]);
      } else {
        // Fallback demo tasks
        setTasks([
          {
            id: '1',
            gym_id: gymId || 'demo-gym',
            title: 'Call Rahul Sharma regarding Pro Annual Membership',
            description: 'Hot lead requested callback after submitting website inquiry.',
            priority: 'urgent',
            status: 'pending',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            gym_id: gymId || 'demo-gym',
            title: 'Verify Studio A equipment setup for VIP Trial sessions',
            description: 'Ensure QR check-in display is active.',
            priority: 'medium',
            status: 'in_progress',
            created_at: new Date().toISOString(),
          },
          {
            id: '3',
            gym_id: gymId || 'demo-gym',
            title: 'Configure automated WhatsApp win-back campaign',
            description: 'Target members inactive for over 14 days.',
            priority: 'high',
            status: 'completed',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !gymId) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          gym_id: gymId,
          title: newTitle,
          description: newDesc || null,
          priority: newPriority,
          status: newStatus,
        })
        .select()
        .single();

      if (!error && data) {
        setTasks([data as unknown as StaffTask, ...tasks]);
      } else {
        // Optimistic UI insert for demo
        setTasks([
          {
            id: crypto.randomUUID(),
            gym_id: gymId,
            title: newTitle,
            description: newDesc,
            priority: newPriority,
            status: newStatus,
            created_at: new Date().toISOString(),
          },
          ...tasks,
        ]);
      }
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStat: StaffTask['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStat } : t)));
    try {
      await supabase.from('tasks').update({ status: newStat }).eq('id', taskId).eq('gym_id', gymId);
    } catch (err) {
      console.error('Failed to persist task status change:', err);
    }
  };

  const getPriorityBadge = (prio: StaffTask['priority']) => {
    switch (prio) {
      case 'urgent': return <Badge variant="error" size="sm">🚨 Urgent</Badge>;
      case 'high': return <Badge variant="warning" size="sm">⚡ High</Badge>;
      case 'medium': return <Badge variant="primary" size="sm">Medium</Badge>;
      case 'low': return <Badge variant="neutral" size="sm">Low</Badge>;
    }
  };

  const columns: { id: StaffTask['status']; label: string; color: string }[] = [
    { id: 'pending', label: 'To Do / Pending', color: 'border-l-4 border-[#8B5CF6]' },
    { id: 'in_progress', label: 'In Progress', color: 'border-l-4 border-[#F59E0B]' },
    { id: 'completed', label: 'Completed', color: 'border-l-4 border-[#22C55E]' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#8B5CF6]" />
            Staff Task Management Board
          </h1>
          <p className="text-sm text-gray-400">Assign action items, track trial callbacks, and monitor team productivity.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add New Task
        </Button>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="space-y-3 bg-[#111113]/60 p-4 rounded-2xl border border-[#27272A] min-h-[500px] flex flex-col">
              {/* Column Header */}
              <div className={`flex items-center justify-between p-3 bg-[#18181B] rounded-xl border border-[#27272A] ${col.color}`}>
                <h3 className="text-sm font-bold text-gray-100">{col.label}</h3>
                <Badge variant="neutral" size="sm">{colTasks.length}</Badge>
              </div>

              {/* Column Cards Feed */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {loading ? (
                  <Skeleton className="h-28 w-full" />
                ) : colTasks.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-xs">No tasks in this column.</div>
                ) : (
                  colTasks.map((task) => (
                    <Card key={task.id} variant="default" className="p-4 space-y-3 shadow-md hover:border-[#8B5CF6]/50 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        {getPriorityBadge(task.priority)}
                        <span className="text-[10px] text-gray-500">
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white leading-snug">{task.title}</h4>
                        {task.description && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{task.description}</p>}
                      </div>

                      {/* Status Action Switcher */}
                      <div className="pt-2 border-t border-[#27272A]/50 flex items-center justify-between gap-2">
                        <Avatar name="Staff" size="sm" />
                        <div className="flex gap-1">
                          {col.id !== 'pending' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'pending')}
                              className="text-[10px] bg-[#111113] hover:bg-[#27272A] px-2 py-1 rounded text-gray-400 font-semibold transition-colors"
                            >
                              ← To Do
                            </button>
                          )}
                          {col.id !== 'in_progress' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'in_progress')}
                              className="text-[10px] bg-[#111113] hover:bg-[#27272A] px-2 py-1 rounded text-[#F59E0B] font-semibold transition-colors"
                            >
                              In Progress
                            </button>
                          )}
                          {col.id !== 'completed' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'completed')}
                              className="text-[10px] bg-[#111113] hover:bg-[#27272A] px-2 py-1 rounded text-[#22C55E] font-semibold transition-colors"
                            >
                              ✓ Done
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#8B5CF6]" />
                  Create Staff Action Task
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <Input
                  label="Task Title / Headline"
                  required
                  placeholder="e.g. Follow up on trial attendee rating"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Detailed Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide context or instructions for assigned trainer..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-[#111113] text-gray-100 border border-[#27272A] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Priority Level"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    options={[
                      { label: 'Medium Priority', value: 'medium' },
                      { label: '🚨 Urgent Priority', value: 'urgent' },
                      { label: '⚡ High Priority', value: 'high' },
                      { label: 'Low Priority', value: 'low' },
                    ]}
                  />
                  <Select
                    label="Initial Column"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    options={[
                      { label: 'To Do / Pending', value: 'pending' },
                      { label: 'In Progress', value: 'in_progress' },
                      { label: 'Completed', value: 'completed' },
                    ]}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#27272A]">
                  <Button type="button" variant="secondary" size="md" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="md" isLoading={submitting}>
                    Create Task
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
