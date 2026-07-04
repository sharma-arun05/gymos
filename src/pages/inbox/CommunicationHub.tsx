// ============================================================================
// Unified Communication Hub UI (/inbox)
// Two-column layout: Thread list & Real-time multi-channel chat composer.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mail, Phone, Send, Search, Sparkles, Check, CheckCheck, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { CommunicationService } from '../../domains/automation/communications';
import type { MessageThread, CommunicationLog } from '../../domains/automation/communications';
import { Button, Input, Card, Badge, Avatar, Skeleton, EmptyState } from '../../components/ui';

export const CommunicationHub: React.FC = () => {
  const { gymId } = useGym();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [history, setHistory] = useState<CommunicationLog[]>([]);
  const [loadingThreads, setLoadingThreads] = useState<boolean>(true);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [filterChannel, setFilterChannel] = useState<'all' | 'whatsapp' | 'email' | 'sms'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [composerText, setComposerText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');

  useEffect(() => {
    if (gymId) loadThreads();
  }, [gymId]);

  useEffect(() => {
    if (gymId && selectedThread) {
      loadHistory(selectedThread.leadId);
      setActiveChannel((selectedThread.channel === 'both' ? 'whatsapp' : selectedThread.channel) as any);
    }
  }, [gymId, selectedThread]);

  const loadThreads = async () => {
    setLoadingThreads(true);
    try {
      const data = await CommunicationService.getThreads(gymId || 'demo-gym');
      setThreads(data);
      if (data.length > 0 && !selectedThread) {
        setSelectedThread(data[0]);
      }
    } catch (err) {
      console.error('Failed to load inbox threads:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadHistory = async (leadId: string) => {
    setLoadingHistory(true);
    try {
      const logs = await CommunicationService.getThreadHistory(gymId || 'demo-gym', leadId);
      setHistory(logs);
    } catch (err) {
      console.error('Failed to load thread history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    if (!composerText.trim() || !selectedThread) return;
    setSending(true);
    try {
      const recipient = activeChannel === 'whatsapp' ? selectedThread.leadPhone || '' : selectedThread.leadEmail || '';
      await CommunicationService.sendMessage(gymId || 'demo-gym', selectedThread.leadId, activeChannel, composerText, recipient);
      
      // Optimistic UI update
      setHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          gym_id: gymId || 'demo-gym',
          lead_id: selectedThread.leadId,
          channel: activeChannel,
          direction: 'outbound',
          status: 'Queued',
          message_content: composerText,
          created_at: new Date().toISOString(),
        },
      ]);
      setComposerText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleAiDraft = () => {
    if (!selectedThread) return;
    const aiDrafts: Record<string, string> = {
      whatsapp: `Hi ${selectedThread.leadName.split(' ')[0]}! Checking in from GymOS. We have a special trial spot open for you this weekend. Would you like to book? 💪`,
      email: `Hello ${selectedThread.leadName},\n\nWe noticed you were interested in starting your fitness journey with us. Let's schedule your complimentary VIP pass today!\n\nBest regards,\nThe Team`,
      sms: `Hi ${selectedThread.leadName.split(' ')[0]}, claim your 3-day guest pass today! Reply YES to book.`,
    };
    setComposerText(aiDrafts[activeChannel] || aiDrafts['whatsapp']);
  };

  const filteredThreads = threads.filter((t) => {
    const matchesChannel = filterChannel === 'all' || t.channel === filterChannel || t.channel === 'both';
    const matchesSearch = t.leadName.toLowerCase().includes(searchQuery.toLowerCase()) || t.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const getStatusIcon = (status: CommunicationLog['status']) => {
    switch (status) {
      case 'Queued': return <Clock className="w-3.5 h-3.5 text-gray-400" />;
      case 'Sent': return <Check className="w-3.5 h-3.5 text-gray-400" />;
      case 'Delivered': return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
      case 'Opened':
      case 'Clicked': return <CheckCheck className="w-3.5 h-3.5 text-[#22C55E]" />;
      case 'Failed': return <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />;
      default: return null;
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#8B5CF6]" />
            Unified Communication Hub
          </h1>
          <p className="text-sm text-gray-400">Manage real-time WhatsApp, Email, and SMS conversations across all leads.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadThreads} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Sync Inbox
        </Button>
      </div>

      {/* Main Inbox Container */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 bg-[#111113] border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Left Column: Thread List (4 Cols) */}
        <div className="col-span-4 border-r border-[#27272A] flex flex-col bg-[#18181B]/50">
          {/* Search & Channel Filters */}
          <div className="p-3.5 border-b border-[#27272A] space-y-3">
            <Input
              placeholder="Search leads or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            <div className="flex gap-1 bg-[#111113] p-1 rounded-xl border border-[#27272A]">
              {(['all', 'whatsapp', 'email', 'sms'] as const).map((chan) => (
                <button
                  key={chan}
                  onClick={() => setFilterChannel(chan)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                    filterChannel === chan
                      ? 'bg-[#8B5CF6] text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {chan}
                </button>
              ))}
            </div>
          </div>

          {/* Thread List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#27272A]/50">
            {loadingThreads ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No active conversations found.</div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.leadId}
                  onClick={() => setSelectedThread(thread)}
                  className={`p-4 cursor-pointer transition-colors flex items-start gap-3 ${
                    selectedThread?.leadId === thread.leadId
                      ? 'bg-[#8B5CF6]/15 border-l-4 border-[#8B5CF6]'
                      : 'hover:bg-[#18181B]'
                  }`}
                >
                  <Avatar name={thread.leadName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-100 truncate">{thread.leadName}</span>
                      <Badge variant="primary" size="sm">
                        {thread.channel}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{thread.lastMessageText}</p>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      {new Date(thread.lastMessageAt).toLocaleDateString()} {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Active Thread Chat (8 Cols) */}
        <div className="col-span-8 flex flex-col bg-[#111113]">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-[#27272A] bg-[#18181B] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedThread.leadName} size="md" />
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedThread.leadName}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {selectedThread.leadPhone && <span>📞 {selectedThread.leadPhone}</span>}
                      {selectedThread.leadEmail && <span>✉️ {selectedThread.leadEmail}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(['whatsapp', 'email', 'sms'] as const).map((chan) => (
                    <button
                      key={chan}
                      onClick={() => setActiveChannel(chan)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all capitalize flex items-center gap-1.5 ${
                        activeChannel === chan
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-white shadow-sm'
                          : 'bg-[#18181B] border-[#27272A] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {chan === 'whatsapp' ? <MessageSquare className="w-3.5 h-3.5 text-[#22C55E]" /> : chan === 'email' ? <Mail className="w-3.5 h-3.5 text-[#3B82F6]" /> : <Phone className="w-3.5 h-3.5 text-[#F59E0B]" />}
                      {chan}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message History Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-[#111113] to-[#18181B]/30">
                {loadingHistory ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-2/3 ml-auto" />
                    <Skeleton className="h-12 w-2/3 mr-auto" />
                  </div>
                ) : history.length === 0 ? (
                  <EmptyState
                    title="No messages yet"
                    description="Send your first message or generate an AI followup draft below!"
                  />
                ) : (
                  history.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col max-w-[75%] ${msg.direction === 'outbound' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed shadow-md ${
                          msg.direction === 'outbound'
                            ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-br-none'
                            : 'bg-[#18181B] border border-[#27272A] text-gray-200 rounded-bl-none'
                        }`}
                      >
                        {msg.message_content}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1">
                        <span className="capitalize">{msg.channel}</span> •
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.direction === 'outbound' && (
                          <span className="inline-flex items-center gap-1 ml-1" title={msg.status}>
                            {getStatusIcon(msg.status)}
                            <span>{msg.status}</span>
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Message Composer Area */}
              <div className="p-4 border-t border-[#27272A] bg-[#18181B]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Replying via <span className="text-[#8B5CF6] font-bold capitalize">{activeChannel}</span>
                  </span>
                  <button
                    onClick={handleAiDraft}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] transition-colors bg-[#8B5CF6]/10 px-2.5 py-1 rounded-lg border border-[#8B5CF6]/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Followup Draft
                  </button>
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder={`Type a message or use AI to generate a high-converting ${activeChannel} follow-up...`}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    className="flex-1 bg-[#111113] text-gray-100 placeholder-gray-500 border border-[#27272A] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 resize-none"
                  />
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSendMessage}
                    isLoading={sending}
                    disabled={!composerText.trim()}
                    className="self-end"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Select a Thread" description="Choose a lead conversation from the left sidebar to start messaging." />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
