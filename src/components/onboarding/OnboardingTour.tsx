// ============================================================================
// Interactive Onboarding Tour Component (components/onboarding)
// Step-by-step walkthrough for new gym owners.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Check, X, Shield, Zap, Users, BarChart2 } from 'lucide-react';
import { Button } from '../ui';

export const OnboardingTour: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    const seen = localStorage.getItem('gymos_onboarding_completed');
    if (!seen) {
      // Auto open after 1.5s for new sessions
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('gymos_onboarding_completed', 'true');
    setIsOpen(false);
  };

  const steps = [
    {
      title: 'Welcome to GymOS Enterprise SaaS! 🚀',
      desc: 'You are now running a startup-grade growth operating system for your training studio. Let’s take a 30-second tour of your new power tools.',
      icon: <Sparkles className="w-8 h-8 text-[#8B5CF6]" />,
      badge: 'Step 1 of 4 • Executive Overview',
    },
    {
      title: 'Algorithmic Lead CRM & VIP Trials 🎯',
      desc: 'Our neural lead scoring (0–100) automatically prioritizes hot prospects. Schedule VIP guest workouts and track attendance with 1-click QR check-ins.',
      icon: <Users className="w-8 h-8 text-[#22C55E]" />,
      badge: 'Step 2 of 4 • Conversion Pipeline',
    },
    {
      title: 'Meta WhatsApp & Email Automations ⚡',
      desc: 'Never manually follow up again. Build multi-channel sequences with visual step connectors that trigger instantly on lead inquiries and renewals.',
      icon: <Zap className="w-8 h-8 text-[#F59E0B]" />,
      badge: 'Step 3 of 4 • Automated Growth',
    },
    {
      title: 'Star Schema Data Warehouse & RBAC 🛡️',
      desc: 'Your metrics are powered by a real-time Star Schema ETL engine. Invite staff with granular role permissions (Owner, Manager, Trainer, Front Desk).',
      icon: <BarChart2 className="w-8 h-8 text-[#3B82F6]" />,
      badge: 'Step 4 of 4 • Enterprise Grade',
    },
  ];

  if (!isOpen) return null;

  const current = steps[step];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg bg-gradient-to-b from-[#18181B] to-[#111113] border border-[#27272A] rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top glow decoration */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#8B5CF6]/20 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={handleComplete}
            className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8B5CF6] bg-[#8B5CF6]/10 px-3 py-1 rounded-full border border-[#8B5CF6]/20">
                {current.badge}
              </span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-[#111113] border border-[#27272A] flex items-center justify-center shadow-inner">
              {current.icon}
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight leading-snug">
                {current.title}
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {current.desc}
              </p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-1.5 pt-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === step ? 'w-8 bg-[#8B5CF6]' : 'w-2 bg-[#27272A]'
                  }`}
                />
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#27272A]">
              <button
                onClick={handleComplete}
                className="text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors"
              >
                Skip Walkthrough
              </button>

              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="secondary" size="md" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                )}
                {step < steps.length - 1 ? (
                  <Button variant="primary" size="md" onClick={() => setStep(step + 1)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Next Step
                  </Button>
                ) : (
                  <Button variant="primary" size="md" onClick={handleComplete} leftIcon={<Check className="w-4 h-4" />}>
                    Launch GymOS Command Center
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
