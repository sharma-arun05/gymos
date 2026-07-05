// ============================================================================
// Way Ahead GymOS v2.1 — AI Sales Assistant Settings UI (/settings/ai-assistant)
// Configure Greeting, Personality, Offers, Memberships, Trainers, FAQs, & Rules.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Bot, Save, Plus, Trash2, Sliders, ShieldAlert, Sparkles, MessageSquare, Award, Users } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { Button, Card, Input, Select, Badge } from '../../components/ui';
import { aiSalesService, AIAssistantSettings } from '../../domains/ai-sales';

export const AiAssistantSettings: React.FC = () => {
  const { gymId } = useGym();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [settings, setSettings] = useState<AIAssistantSettings>({
    gym_id: gymId || 'demo',
    greeting: 'Hi! I am your Way Ahead AI Fitness Advisor. How can I help you transform your fitness today?',
    personality: 'professional_consultant',
    offers: ['Free VIP Guest Pass', '10% Off Annual Plan'],
    memberships: [
      { name: 'Starter Plan', price: 1999, benefits: ['Full Gym Access', 'Locker Room'], duration: '1 Month' },
      { name: 'Growth Pro Plan', price: 2999, benefits: ['Gym Access', 'Group HIIT Classes', 'Sauna'], duration: '1 Month', popular: true },
    ],
    trainers: [
      { name: 'Arjun Verma', specialization: 'Crossfit & HIIT', experience: '8 Years', rating: '4.9' },
    ],
    faqs: [
      { q: 'What are your operating hours?', a: '5:00 AM to 11:00 PM Mon-Sat.' },
    ],
    languages: ['English', 'Hindi', 'Punjabi'],
    escalation_rules: { confidence_threshold: 70, handoff_role: 'Sales Executive', notify_channel: 'whatsapp' },
    is_active: true,
  });

  useEffect(() => {
    if (gymId) {
      aiSalesService.getSettings(gymId).then((res) => {
        setSettings(res);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [gymId]);

  const handleSave = async () => {
    if (!gymId) return;
    setSaving(true);
    try {
      const updated = await aiSalesService.updateSettings(gymId, settings);
      setSettings(updated);
      alert('AI Assistant settings saved successfully!');
    } catch (err) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const addOffer = () => {
    setSettings({ ...settings, offers: [...settings.offers, 'New Offer Promotion'] });
  };

  const removeOffer = (idx: number) => {
    setSettings({ ...settings, offers: settings.offers.filter((_, i) => i !== idx) });
  };

  const addFaq = () => {
    setSettings({ ...settings, faqs: [...settings.faqs, { q: 'New FAQ Question?', a: 'Clear answer here.' }] });
  };

  const removeFaq = (idx: number) => {
    setSettings({ ...settings, faqs: settings.faqs.filter((_, i) => i !== idx) });
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-400">Loading AI Assistant Configuration...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-[#8B5CF6]" />
            AI Sales Employee Configuration
          </h1>
          <p className="text-sm text-gray-400 mt-1">Configure personality, RAG knowledge base, pricing packages, and human handoff rules.</p>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving} leftIcon={<Save className="w-4 h-4" />}>
          {saving ? 'Saving...' : 'Save AI Configuration'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personality & Greeting (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card variant="default" className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                Personality & Greeting
              </h3>
              <Badge variant="primary" size="sm">Active 24x7</Badge>
            </div>

            <Select
              label="AI Consultant Personality Profile"
              value={settings.personality}
              onChange={(e) => setSettings({ ...settings, personality: e.target.value as any })}
              options={[
                { value: 'professional_consultant', label: 'Professional Consultant (Authoritative, Knowledgeable)' },
                { value: 'energetic_coach', label: 'Energetic Coach (Motivating, High Energy, Emoji-Rich)' },
                { value: 'empathetic_guide', label: 'Empathetic Guide (Supportive, Understanding, Gentle)' },
              ]}
            />

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Welcome Greeting (Default English)
              </label>
              <textarea
                rows={3}
                value={settings.greeting}
                onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
                className="w-full bg-[#111113] border border-[#27272A] rounded-xl p-3 text-sm text-white focus:border-[#8B5CF6] outline-none"
              />
            </div>

            <div className="p-4 bg-[#111113] border border-[#27272A] rounded-xl space-y-2">
              <span className="text-xs font-bold text-gray-300 uppercase block">Supported Languages (Auto-Detected)</span>
              <div className="flex gap-2 flex-wrap">
                {settings.languages.map((lang) => (
                  <Badge key={lang} variant="success" size="md">{lang}</Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* Offers Section */}
          <Card variant="default" className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#22C55E]" />
                Active Sales Promos & Offers
              </h3>
              <Button variant="secondary" size="sm" onClick={addOffer} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Offer
              </Button>
            </div>
            <div className="space-y-2">
              {settings.offers.map((off, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    value={off}
                    onChange={(e) => {
                      const copy = [...settings.offers];
                      copy[idx] = e.target.value;
                      setSettings({ ...settings, offers: copy });
                    }}
                  />
                  <button onClick={() => removeOffer(idx)} className="p-2 text-gray-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: FAQs & Escalation Rules (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card variant="default" className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                Human Handoff & Escalation Rules
              </h3>
              <Badge variant="warning" size="sm">Safety Guardrails</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Confidence Threshold (%)
                </label>
                <input
                  type="number"
                  value={settings.escalation_rules.confidence_threshold}
                  onChange={(e) => setSettings({
                    ...settings,
                    escalation_rules: { ...settings.escalation_rules, confidence_threshold: Number(e.target.value) },
                  })}
                  className="w-full bg-[#111113] border border-[#27272A] rounded-xl p-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Handoff Role
                </label>
                <input
                  type="text"
                  value={settings.escalation_rules.handoff_role}
                  onChange={(e) => setSettings({
                    ...settings,
                    escalation_rules: { ...settings.escalation_rules, handoff_role: e.target.value },
                  })}
                  className="w-full bg-[#111113] border border-[#27272A] rounded-xl p-2.5 text-sm text-white"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              When AI confidence drops below {settings.escalation_rules.confidence_threshold}% or the visitor reports complex medical issues, the conversation is escalated to a {settings.escalation_rules.handoff_role} via {settings.escalation_rules.notify_channel}.
            </p>
          </Card>

          {/* RAG FAQs */}
          <Card variant="default" className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#3B82F6]" />
                RAG Knowledge Base (FAQs)
              </h3>
              <Button variant="secondary" size="sm" onClick={addFaq} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add FAQ
              </Button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {settings.faqs.map((faq, idx) => (
                <div key={idx} className="p-3.5 bg-[#111113] rounded-xl border border-[#27272A] space-y-2 relative">
                  <button onClick={() => removeFaq(idx)} className="absolute top-3 right-3 text-gray-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Input
                    label="Question"
                    value={faq.q}
                    onChange={(e) => {
                      const copy = [...settings.faqs];
                      copy[idx].q = e.target.value;
                      setSettings({ ...settings, faqs: copy });
                    }}
                  />
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">Answer</label>
                    <textarea
                      rows={2}
                      value={faq.a}
                      onChange={(e) => {
                        const copy = [...settings.faqs];
                        copy[idx].a = e.target.value;
                        setSettings({ ...settings, faqs: copy });
                      }}
                      className="w-full bg-[#18181B] border border-[#27272A] rounded-lg p-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
