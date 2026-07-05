// ============================================================================
// Website Widget Manager UI (/widgets)
// Live preview & 1-Click HTML snippet generator for embeddable lead capture.
// ============================================================================

import React, { useState } from 'react';
import { Code, Copy, Check, Layout, Globe, Palette } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { Button, Card, Input, Badge } from '../../components/ui';

export const WidgetManager: React.FC = () => {
  const { gymId } = useGym();
  const [themeColor, setThemeColor] = useState<string>('#8B5CF6');
  const [buttonText, setButtonText] = useState<string>('💪 Claim Free Guest Pass');
  const [titleText, setTitleText] = useState<string>('Get Started Today');
  const [copied, setCopied] = useState<boolean>(false);

  const snippetCode = `<script src="https://app.wayaheadgymos.com/widget.js" data-gym-id="${gymId || 'YOUR_GYM_ID'}" data-form-id="FREE_TRIAL" data-theme-color="${themeColor}"></script>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Globe className="w-6 h-6 text-[#8B5CF6]" />
          Website Lead Capture Widget
        </h1>
        <p className="text-sm text-gray-400">Embed our lightweight (4KB) lead conversion popup directly onto your gym's website or WordPress page.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Widget Configuration (6 Cols) */}
        <Card variant="default" className="lg:col-span-6 space-y-5 p-6">
          <div className="border-b border-[#27272A] pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#8B5CF6]" />
              Widget Customization
            </h3>
            <Badge variant="primary" size="sm">Live Sync</Badge>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Theme Color Accent
              </label>
              <div className="flex gap-2.5 items-center">
                {['#8B5CF6', '#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#EC4899'].map((col) => (
                  <button
                    key={col}
                    onClick={() => setThemeColor(col)}
                    style={{ backgroundColor: col }}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      themeColor === col ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-0"
                />
              </div>
            </div>

            <Input
              label="Floating Button CTA Text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="e.g. Claim Guest Pass"
            />

            <Input
              label="Modal Headline Title"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              placeholder="e.g. Start Your VIP Workout"
            />

            <div className="p-4 rounded-xl bg-[#111113] border border-[#27272A] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-200">
                <span>Included Intake Fields</span>
                <Badge variant="success" size="sm">Auto-Mapped to CRM</Badge>
              </div>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>✓ Full Name (Required)</li>
                <li>✓ WhatsApp / Phone Number (Required for AI automation)</li>
                <li>✓ Email Address (Optional)</li>
                <li>✓ Declared Fitness Goal Dropdown</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Right Column: Live Preview & Code Snippet (6 Cols) */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
          
          {/* Live Preview Card */}
          <Card variant="default" className="p-6 space-y-4 relative overflow-hidden flex-1 bg-gradient-to-br from-[#18181B] via-[#111113] to-[#18181B]">
            <div className="border-b border-[#27272A] pb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-[#8B5CF6]" />
                Live Website Preview
              </span>
              <span className="text-[10px] bg-[#27272A] px-2 py-0.5 rounded text-gray-300">gymos.app/preview</span>
            </div>

            <div className="py-8 flex flex-col items-center justify-center border border-dashed border-[#27272A] rounded-2xl bg-[#111113]/50 p-6">
              <p className="text-xs text-gray-500 mb-6">This is how the popup form appears when your website visitor clicks the CTA:</p>
              
              {/* Mock Popup Form Card */}
              <div className="w-full max-w-sm bg-[#18181B] border border-[#27272A] rounded-2xl p-5 shadow-2xl text-left space-y-3">
                <div>
                  <h4 className="text-base font-extrabold text-white">{titleText}</h4>
                  <p className="text-[11px] text-gray-400">Leave your details below and our team will book your complimentary VIP trial session.</p>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-[#111113] rounded-lg border border-[#27272A] flex items-center px-3 text-xs text-gray-500">Full Name</div>
                  <div className="h-8 bg-[#111113] rounded-lg border border-[#27272A] flex items-center px-3 text-xs text-gray-500">WhatsApp / Phone Number</div>
                  <div
                    style={{ backgroundColor: themeColor }}
                    className="h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md mt-2 cursor-pointer"
                  >
                    Confirm VIP Pass Request →
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Floating Button Preview */}
            <div className="absolute bottom-4 right-4">
              <div
                style={{ backgroundColor: themeColor }}
                className="px-4 py-2.5 rounded-full text-white font-bold text-xs shadow-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                {buttonText}
              </div>
            </div>
          </Card>

          {/* Snippet Card */}
          <Card variant="default" className="p-6 space-y-3 bg-[#111113]">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <Code className="w-4 h-4 text-[#8B5CF6]" />
                Embed HTML Snippet
              </h4>
              <Button
                variant={copied ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleCopySnippet}
                leftIcon={copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Script Snippet'}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Paste this tag inside the <code className="text-[#8B5CF6] bg-[#18181B] px-1 py-0.5 rounded">&lt;head&gt;</code> or just before the closing <code className="text-[#8B5CF6] bg-[#18181B] px-1 py-0.5 rounded">&lt;/body&gt;</code> tag of your website:
            </p>
            <div className="p-3.5 bg-[#18181B] rounded-xl border border-[#27272A] font-mono text-xs text-gray-300 overflow-x-auto select-all">
              {snippetCode}
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
};
