// ============================================================================
// Trial Management UI (/trials)
// VIP Trial Calendar, 1-Click QR/Button Attendance Check-In, & Rating Feedback.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, CheckCircle, Star, Plus, Phone } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { TrialRepository, ConfirmAttendanceUseCase } from '../../domains/crm/trials';
import type { TrialBooking } from '../../domains/crm/trials';
import { Button, Card, Badge, Avatar, Skeleton, EmptyState } from '../../components/ui';

export const TrialManager: React.FC = () => {
  const { gymId } = useGym();
  const [trials, setTrials] = useState<TrialBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  // Feedback check-in modal state
  const [checkingInTrial, setCheckingInTrial] = useState<TrialBooking | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadTrials();
  }, [gymId]);

  const loadTrials = async () => {
    setLoading(true);
    try {
      const data = await TrialRepository.getTrials(gymId || 'demo-gym');
      setTrials(data);
    } catch (err) {
      console.error('Failed to load trial appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!checkingInTrial || !gymId) return;
    setSubmitting(true);
    try {
      await ConfirmAttendanceUseCase.execute(
        gymId,
        checkingInTrial.id,
        checkingInTrial.lead_id,
        'user-demo',
        rating,
        comments
      );
      
      // Update local state
      setTrials((prev) =>
        prev.map((t) => (t.id === checkingInTrial.id ? { ...t, status: 'ATTENDED' as any } : t))
      );
      setCheckingInTrial(null);
      setComments('');
      setRating(5);
    } catch (err) {
      console.error('Failed to check-in trial:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoShow = async (trialId: string) => {
    try {
      await TrialRepository.updateStatus(gymId || 'demo-gym', trialId, 'NO_SHOW' as any);
      setTrials((prev) => prev.map((t) => (t.id === trialId ? { ...t, status: 'NO_SHOW' as any } : t)));
    } catch (err) {
      console.error('Failed to mark no-show:', err);
    }
  };

  const filteredTrials = trials.filter((t) => filterStatus === 'ALL' || t.status === filterStatus);

  const getStatusBadge = (status: TrialBooking['status']) => {
    switch (status) {
      case 'SCHEDULED': return <Badge variant="info">Scheduled</Badge>;
      case 'CONFIRMED': return <Badge variant="primary">Confirmed</Badge>;
      case 'ATTENDED': return <Badge variant="success">Attended</Badge>;
      case 'NO_SHOW': return <Badge variant="error">No-Show</Badge>;
      case 'CONVERTED': return <Badge variant="success">🎉 Converted</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#8B5CF6]" />
            VIP Trial Management
          </h1>
          <p className="text-sm text-gray-400">Schedule introductory workouts, verify attendance check-ins, and collect feedback ratings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadTrials}>Sync Calendar</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Book VIP Trial</Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#27272A] pb-3 overflow-x-auto no-scrollbar">
        {['ALL', 'SCHEDULED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CONVERTED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterStatus === status
                ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/20'
                : 'bg-[#18181B] text-gray-400 hover:text-gray-200 border border-[#27272A]'
            }`}
          >
            {status === 'ALL' ? 'All Appointments' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Trials Grid Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </>
        ) : filteredTrials.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No Trial Appointments Found"
              description="There are no trial bookings matching this status filter. Book a new session above!"
            />
          </div>
        ) : (
          filteredTrials.map((trial) => (
            <Card key={trial.id} variant="default" className="flex flex-col justify-between p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar name={trial.leads?.name || 'Lead'} size="md" />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">{trial.leads?.name || 'Unknown Lead'}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      {trial.leads?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#8B5CF6]" /> {trial.leads.phone}</span>}
                    </div>
                  </div>
                </div>
                {getStatusBadge(trial.status)}
              </div>

              <div className="p-3 bg-[#111113] rounded-xl border border-[#27272A] space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#8B5CF6]" /> Date:
                  </span>
                  <span className="font-semibold">{new Date(trial.scheduled_time).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" /> Time:
                  </span>
                  <span className="font-semibold">{new Date(trial.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#27272A] flex items-center justify-end gap-2">
                {(trial.status === 'SCHEDULED' || trial.status === 'CONFIRMED') && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNoShow(trial.id)}
                      className="text-[#EF4444] hover:bg-[#EF4444]/10 text-xs"
                    >
                      No-Show
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setCheckingInTrial(trial)}
                      leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Check-In
                    </Button>
                  </>
                )}
                {trial.status === 'ATTENDED' && (
                  <Button variant="secondary" size="sm" className="w-full text-xs" disabled>
                    ✓ Checked In & Rated
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Check-in & Rating Modal */}
      <AnimatePresence>
        {checkingInTrial && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#22C55E]" />
                  Verify Trial Check-In
                </h3>
                <button onClick={() => setCheckingInTrial(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <div>
                <p className="text-sm text-gray-300">
                  Checking in <strong className="text-white">{checkingInTrial.leads?.name}</strong> for their VIP workout session. How would you rate their engagement and conversion interest?
                </p>
              </div>

              {/* Star Rating Picker */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Trainer Engagement Rating</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-xl transition-all ${
                        rating >= star ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30' : 'text-gray-600 hover:text-gray-400'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Trainer Feedback Notes</span>
                <textarea
                  rows={3}
                  placeholder="e.g. Highly interested in Pro Annual plan. Needs follow-up on Friday..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full bg-[#111113] text-gray-100 border border-[#27272A] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#27272A]">
                <Button variant="secondary" size="md" onClick={() => setCheckingInTrial(null)}>Cancel</Button>
                <Button variant="primary" size="md" onClick={handleConfirmAttendance} isLoading={submitting}>
                  Confirm Check-In (+30 Lead Score)
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
