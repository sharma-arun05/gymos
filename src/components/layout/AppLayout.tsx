// ============================================================================
// Enterprise App Layout Component (components/layout/AppLayout)
// Sidebar navigation for all 20 modules, Command Palette trigger, & Onboarding.
// ============================================================================

import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, MessageSquare, Zap, GitBranch, LogOut, Dumbbell, 
  CreditCard, Calendar, Trophy, CheckSquare, BarChart2, Sparkles, HeartPulse, 
  Plug, Folder, Shield, Settings, LifeBuoy, Activity, Database, Search, Command, Bell, Globe 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { CommandPalette } from '../search/CommandPalette';
import { OnboardingTour } from '../onboarding/OnboardingTour';

export const AppLayout: React.FC = () => {
  const { signOut } = useAuth();
  const { gym } = useGym();
  const location = useLocation();
  const navigate = useNavigate();
  const [cmdOpen, setCmdOpen] = useState<boolean>(false);

  const navigation = [
    { category: 'Core CRM & Operations', items: [
      { name: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Leads CRM & Scoring', href: '/leads', icon: Users },
      { name: 'VIP Trial Management', href: '/trials', icon: Calendar },
      { name: 'Member Conversions', href: '/conversions', icon: Trophy },
      { name: 'Staff Task Board', href: '/tasks', icon: CheckSquare },
    ]},
    { category: 'Automations & AI Hub', items: [
      { name: 'Workflow Engine', href: '/automations', icon: Zap },
      { name: 'AI Sales Widget', href: '/widgets', icon: Globe },
      { name: 'Communication Inbox', href: '/inbox', icon: MessageSquare },
      { name: 'AI Growth Copilot', href: '/ai', icon: Sparkles },
      { name: 'Retention & Win-Back', href: '/retention', icon: HeartPulse },
      { name: 'Message Templates', href: '/templates', icon: GitBranch },
    ]},
    { category: 'Data & Analytics', items: [
      { name: 'Executive Analytics', href: '/analytics', icon: BarChart2 },
      { name: 'Document Repository', href: '/files', icon: Folder },
      { name: 'App Marketplace', href: '/integrations', icon: Plug },
    ]},
    { category: 'Administration', items: [
      { name: 'Team RBAC Roster', href: '/team', icon: Shield },
      { name: 'Enterprise Billing', href: '/billing', icon: CreditCard },
      { name: 'Settings Suite', href: '/settings', icon: Settings },
      { name: 'Customer Support', href: '/support', icon: LifeBuoy },
    ]},
    { category: 'Platform & Hardening', items: [
      { name: 'Live Observability', href: '/observability', icon: Activity },
      { name: 'Backup & Recovery', href: '/backups', icon: Database },
      { name: 'SuperAdmin God Mode', href: '/admin', icon: Dumbbell, highlight: true },
    ]},
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col md:flex-row font-sans">
      {/* Global Command Palette & Onboarding Tour */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={(path) => navigate(path)} />
      <OnboardingTour />

      {/* Sidebar (Desktop) */}
      <div className="w-64 bg-[#111113] border-r border-[#27272A] flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#27272A] bg-[#18181B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/30">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-black text-white tracking-tight">GymOS Pro</span>
          </div>
          <span className="text-[10px] font-mono bg-[#22C55E]/10 text-[#22C55E] px-2 py-0.5 rounded-full border border-[#22C55E]/20">
            v2.0
          </span>
        </div>

        {/* Gym name & Search Bar Trigger */}
        <div className="p-3.5 space-y-3 border-b border-[#27272A]">
          {gym && (
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Active Workspace</p>
                <p className="text-sm text-white font-bold truncate">{gym.name}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#22C55E] shrink-0" />
            </div>
          )}

          <button
            onClick={() => setCmdOpen(true)}
            className="w-full bg-[#18181B] hover:bg-[#27272A] text-gray-400 hover:text-gray-200 border border-[#27272A] rounded-xl px-3 py-2 text-xs flex items-center justify-between transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Search command...
            </span>
            <kbd className="text-[10px] bg-[#111113] text-gray-400 px-1.5 py-0.5 rounded border border-[#3F3F46]">
              ⌘K
            </kbd>
          </button>
        </div>
        
        {/* Navigation Categories Menu */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5 no-scrollbar">
          {navigation.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] font-black text-gray-500 uppercase px-2.5 tracking-wider block">
                {section.category}
              </span>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/20 font-black'
                          : item.highlight
                          ? 'text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-[#EF4444]'
                          : 'text-gray-400 hover:bg-[#18181B] hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : item.highlight ? 'text-[#EF4444]' : 'text-[#8B5CF6]'}`} />
                        {item.name}
                      </span>
                      {item.highlight && <span className="text-[9px] bg-[#EF4444]/20 text-[#EF4444] px-1.5 py-0.2 rounded font-black">GOD</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#27272A] bg-[#18181B] flex items-center justify-between gap-2">
          <Link to="/notifications" className="p-2 bg-[#111113] hover:bg-[#27272A] text-gray-400 hover:text-white rounded-xl border border-[#27272A] relative transition-colors" title="Notifications">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444]" />
          </Link>
          <button
            onClick={signOut}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-gray-400 hover:text-[#EF4444] hover:bg-[#111113] rounded-xl border border-[#27272A] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090B]">
        {/* Mobile Header */}
        <header className="h-16 bg-[#111113] border-b border-[#27272A] flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-[#8B5CF6]" />
            <span className="text-lg font-black text-white">GymOS Pro</span>
          </div>
          <button onClick={() => setCmdOpen(true)} className="p-2 bg-[#18181B] text-gray-300 rounded-lg border border-[#27272A]">
            <Search className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
