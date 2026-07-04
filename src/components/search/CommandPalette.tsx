// ============================================================================
// Global Fuzzy Search Command Palette (Cmd+K / Ctrl+K)
// Instant navigation across leads, automations, trials, invoices, & settings.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Calendar, Zap, CreditCard, Settings, ArrowRight, CornerDownLeft, Command } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { supabase } from '../../lib/supabase';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'lead' | 'trial' | 'automation' | 'billing' | 'setting';
  url: string;
}

export const CommandPalette: React.FC<{ isOpen: boolean; onClose: () => void; onNavigate: (path: string) => void }> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { gymId } = useGym();
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null; // Parent toggles usually
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (results.length || 1)) % (results.length || 1));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    if (isOpen && query.trim().length >= 1) {
      performSearch(query);
    } else {
      // Default quick actions
      setResults([
        { id: 'q-1', title: 'New CRM Lead Intake', subtitle: 'Open lead acquisition drawer', type: 'lead', url: '/leads' },
        { id: 'q-2', title: 'Book VIP Trial Workout', subtitle: 'Schedule appointment on studio calendar', type: 'trial', url: '/trials' },
        { id: 'q-3', title: 'Visual Workflow Builder', subtitle: 'Create automated WhatsApp sequence', type: 'automation', url: '/automations' },
        { id: 'q-4', title: 'Tax Invoices & Billing Tier', subtitle: 'Manage Starter/Growth/Pro plan', type: 'billing', url: '/billing' },
        { id: 'q-5', title: 'Team RBAC Permission Roster', subtitle: 'Invite staff & assign roles', type: 'setting', url: '/team' },
      ]);
      setSelectedIndex(0);
    }
  }, [query, isOpen]);

  const performSearch = async (q: string) => {
    if (!gymId) return;
    const lower = q.toLowerCase();
    const found: SearchResult[] = [];

    // Search Leads
    const { data: leads } = await supabase.from('leads').select('id, name, phone, status').eq('gym_id', gymId).ilike('name', `%${q}%`).limit(3);
    if (leads) {
      leads.forEach((l) => {
        found.push({ id: `lead-${l.id}`, title: l.name, subtitle: `${l.status} • Phone: ${l.phone || 'N/A'}`, type: 'lead', url: `/leads?id=${l.id}` });
      });
    }

    // Search Workflows
    const { data: wf } = await supabase.from('workflow_definitions').select('id, name, trigger_type').eq('gym_id', gymId).ilike('name', `%${q}%`).limit(2);
    if (wf) {
      wf.forEach((w) => {
        found.push({ id: `wf-${w.id}`, title: w.name, subtitle: `Trigger: ${w.trigger_type}`, type: 'automation', url: `/automations` });
      });
    }

    if (found.length === 0) {
      found.push({ id: 'empty', title: `No exact matches for "${q}"`, subtitle: 'Try searching by full name, phone number, or menu feature', type: 'setting', url: '#' });
    }

    setResults(found);
    setSelectedIndex(0);
  };

  const handleSelect = (item: SearchResult) => {
    if (item.id === 'empty') return;
    onNavigate(item.url);
    onClose();
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'lead': return <User className="w-4 h-4 text-[#8B5CF6]" />;
      case 'trial': return <Calendar className="w-4 h-4 text-[#22C55E]" />;
      case 'automation': return <Zap className="w-4 h-4 text-[#F59E0B]" />;
      case 'billing': return <CreditCard className="w-4 h-4 text-[#3B82F6]" />;
      case 'setting': return <Settings className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="w-full max-w-2xl bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Search Input Box */}
          <div className="p-4 border-b border-[#27272A] flex items-center gap-3 bg-[#111113]">
            <Search className="w-5 h-5 text-[#8B5CF6] shrink-0" />
            <input
              autoFocus
              placeholder="Search leads, VIP trials, automations, tax invoices, settings... (Cmd+K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
            />
            <span className="text-[10px] font-mono bg-[#27272A] text-gray-400 px-2 py-1 rounded border border-[#3F3F46]">
              ESC to close
            </span>
          </div>

          {/* Results Feed */}
          <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#27272A]/30">
            {results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/50 shadow-md' : 'hover:bg-[#111113]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#111113] border border-[#27272A] flex items-center justify-center shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  {isSelected && item.id !== 'empty' && (
                    <span className="text-[10px] font-bold text-[#8B5CF6] flex items-center gap-1 shrink-0 bg-[#8B5CF6]/10 px-2 py-1 rounded border border-[#8B5CF6]/20">
                      Jump <CornerDownLeft className="w-3 h-3" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="p-3 bg-[#111113] border-t border-[#27272A] flex items-center justify-between text-[11px] text-gray-500 font-mono">
            <div className="flex items-center gap-3">
              <span>↑↓ to navigate</span>
              <span>↵ to select</span>
            </div>
            <span className="flex items-center gap-1 text-[#8B5CF6]">
              <Command className="w-3 h-3" /> GymOS Command Engine
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
