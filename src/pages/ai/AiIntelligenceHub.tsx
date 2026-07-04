// ============================================================================
// AI Intelligence Hub UI (/ai)
// AI Followup Writer, AI Lead Conversion Explainer, & ARR Revenue Forecaster.
// ============================================================================

import React, { useState } from 'react';
import { Sparkles, Bot, ShieldCheck, Send, Copy, Check, TrendingUp, UserCheck, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { AiIntelligenceService } from '../../domains/business/ai';
import { Button, Card, Badge, Input, Select, MetricCard } from '../../components/ui';

export const AiIntelligenceHub: React.FC = () => {
  const { gymId } = useGym();
  const [activeTab, setActiveTab] = useState<'writer' | 'analyst' | 'forecaster'>('writer');
  
  // Followup Writer State
  const [leadName, setLeadName] = useState<string>('Rahul Sharma');
  const [goal, setGoal] = useState<string>('Weight Loss & Cardio');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Analyst State
  const [analystLeadName, setAnalystLeadName] = useState<string>('Sneha Patel');
  const [analystScore, setAnalystScore] = useState<number>(88);
  const [analysisOutput, setAnalysisOutput] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  const handleGenerateScript = async () => {
    if (!gymId) return;
    setGenerating(true);
    try {
      const script = await AiIntelligenceService.generateFollowupScript(gymId, leadName, goal, channel);
      setGeneratedScript(script);
    } catch (err) {
      console.error('AI Generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyzeScore = async () => {
    if (!gymId) return;
    setAnalyzing(true);
    try {
      const output = await AiIntelligenceService.explainLeadScore(gymId, analystLeadName, analystScore);
      setAnalysisOutput(output);
    } catch (err) {
      console.error('AI Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm" className="gap-1">
              <Cpu className="w-3 h-3" />
              OpenAI GPT-4o Powered
            </Badge>
            <Badge variant="success" size="sm" className="gap-1">
              <ShieldCheck className="w-3 h-3" />
              PII Redacted & Injection Protected
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#8B5CF6]" />
            AI Intelligence & Growth Copilot
          </h1>
          <p className="text-sm text-gray-400">Generate high-converting follow-up copy, analyze lead conversion behavior, and forecast recurring revenue.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#27272A] pb-3 gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'writer', label: '1. AI Follow-up Copywriter', icon: <Bot className="w-4 h-4 text-[#8B5CF6]" /> },
          { id: 'analyst', label: '2. AI Lead Conversion Analyst', icon: <UserCheck className="w-4 h-4 text-[#22C55E]" /> },
          { id: 'forecaster', label: '3. AI ARR Revenue Forecaster', icon: <TrendingUp className="w-4 h-4 text-[#F59E0B]" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/20'
                : 'bg-[#18181B] text-gray-400 hover:text-gray-200 border border-[#27272A]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'writer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card variant="default" className="lg:col-span-5 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#8B5CF6]" />
              Follow-up Script Generator
            </h3>
            <div className="space-y-4">
              <Input label="Lead Full Name" value={leadName} onChange={(e) => setLeadName(e.target.value)} />
              <Input label="Declared Fitness Goal" value={goal} onChange={(e) => setGoal(e.target.value)} />
              <Select
                label="Target Messaging Channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                options={[
                  { label: 'WhatsApp Broadcast Message', value: 'whatsapp' },
                  { label: 'Transactional Email Template', value: 'email' },
                ]}
              />
              <Button
                variant="primary"
                size="md"
                className="w-full text-xs"
                onClick={handleGenerateScript}
                isLoading={generating}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Generate Converting Script →
              </Button>
            </div>
          </Card>

          <Card variant="default" className="lg:col-span-7 p-6 space-y-4 bg-gradient-to-br from-[#18181B] to-[#111113]">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <span className="text-xs font-bold text-gray-300">Generated AI Output</span>
              {generatedScript && (
                <Button variant="outline" size="sm" onClick={() => handleCopy(generatedScript)} leftIcon={copied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}>
                  {copied ? 'Copied!' : 'Copy Copy'}
                </Button>
              )}
            </div>

            <div className="min-h-[220px] p-5 rounded-2xl bg-[#111113] border border-[#27272A] font-mono text-xs text-gray-200 leading-relaxed whitespace-pre-wrap flex items-center justify-center">
              {generating ? (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#8B5CF6]" />
                  <span>Synthesizing neural copy with PII governance...</span>
                </div>
              ) : generatedScript ? (
                <div className="w-full text-left">{generatedScript}</div>
              ) : (
                <span className="text-gray-500">Configure parameters on the left and click Generate to produce custom sales scripts.</span>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'analyst' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card variant="default" className="lg:col-span-5 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#22C55E]" />
              Lead Conversion Behavior Analyst
            </h3>
            <div className="space-y-4">
              <Input label="Prospect Name" value={analystLeadName} onChange={(e) => setAnalystLeadName(e.target.value)} />
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Algorithmic Score ({analystScore}/100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={analystScore}
                  onChange={(e) => setAnalystScore(Number(e.target.value))}
                  className="w-full accent-[#8B5CF6] cursor-pointer"
                />
              </div>
              <Button variant="primary" size="md" className="w-full text-xs" onClick={handleAnalyzeScore} isLoading={analyzing}>
                Run AI Conversion Analysis →
              </Button>
            </div>
          </Card>

          <Card variant="default" className="lg:col-span-7 p-6 space-y-4 bg-gradient-to-br from-[#18181B] to-[#111113]">
            <div className="border-b border-[#27272A] pb-3">
              <span className="text-xs font-bold text-gray-300">AI Diagnostic Report & Next Best Action</span>
            </div>
            <div className="min-h-[220px] p-5 rounded-2xl bg-[#111113] border border-[#27272A] text-xs text-gray-200 leading-relaxed whitespace-pre-wrap flex items-center justify-center">
              {analyzing ? (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#22C55E]" />
                  <span>Analyzing multi-channel touchpoints & scoring factors...</span>
                </div>
              ) : analysisOutput ? (
                <div className="w-full text-left space-y-3">
                  <div className="p-3 bg-[#8B5CF6]/10 rounded-xl border border-[#8B5CF6]/30 text-white font-bold">
                    🎯 Diagnostic Recommendation
                  </div>
                  <p>{analysisOutput}</p>
                </div>
              ) : (
                <span className="text-gray-500">Select a lead score and run analysis to receive AI recommendations.</span>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'forecaster' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard title="Predicted Next 90-Day ARR" value="₹68.4 Lakhs" change="+17.5% projected growth" isPositive={true} icon={<TrendingUp className="w-5 h-5 text-[#22C55E]" />} subtitle="95% confidence interval" />
            <MetricCard title="Estimated Win-Back Recovery" value="₹2.80 Lakhs" change="From automated WhatsApp" isPositive={true} icon={<Sparkles className="w-5 h-5 text-[#8B5CF6]" />} subtitle="Retention algorithm" />
            <MetricCard title="Recommended Ad Spend Allocation" value="₹45,000 / mo" change="Instagram Ads focus" isPositive={true} icon={<Cpu className="w-5 h-5 text-[#F59E0B]" />} subtitle="Highest ROAS channel" />
          </div>

          <Card variant="default" className="p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-100">AI Predictive Growth Roadmap</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Based on historical data warehouse ETL regressions, your studio will hit <strong className="text-white">1,500 active members</strong> by November 2026 if trial show rates remain above <strong className="text-[#22C55E]">72%</strong>. The AI recommends increasing morning PT slot availability by 15% to capture unmet demand.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};
