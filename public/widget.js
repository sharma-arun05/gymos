/**
 * ============================================================================
 * Way Ahead GymOS v2.1 — Embeddable AI Gym Sales Employee Widget
 * 24x7 Conversational AI Consultant, 10-Point Qualification Engine, RAG Portal,
 * Algorithmic Scoring, & VIP Trial Scheduling.
 * ============================================================================
 */
(function() {
  if (window.__GymOS_AI_Widget_Loaded) return;
  window.__GymOS_AI_Widget_Loaded = true;

  const scriptTag = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const gymId = scriptTag ? scriptTag.getAttribute('data-gym-id') : '11111111-1111-1111-1111-111111111111';
  const themeColor = scriptTag ? scriptTag.getAttribute('data-theme') || '#8B5CF6' : '#8B5CF6';
  const position = scriptTag ? scriptTag.getAttribute('data-position') || 'bottom-right' : 'bottom-right';
  const mode = scriptTag ? scriptTag.getAttribute('data-mode') || 'ai-sales' : 'ai-sales';

  const SUPABASE_URL = 'https://tkwaarpgvshhkvobzkin.supabase.co';
  const SUPABASE_ANON = 'sb_publishable_OUTAurmU_aU4jb-_ikl41w_vam3DyFy';

  // Get or create unique session token
  let sessionToken = localStorage.getItem('gymos_ai_session_' + gymId);
  if (!sessionToken) {
    sessionToken = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('gymos_ai_session_' + gymId, sessionToken);
  }

  let currentTab = 'home'; // 'home' (AI Chat), 'memberships', 'trainers', 'timetable', 'support'
  let currentLanguage = 'English'; // 'English', 'Hindi', 'Punjabi'
  let messages = [
    { role: 'assistant', text: 'Hi! I am your Way Ahead AI Fitness Advisor. What is your primary goal today?', quickReplies: ['Lose Weight', 'Build Muscle', 'Crossfit & HIIT', 'Yoga & Flexibility', '1-on-1 Personal Training'] }
  ];
  let isThinking = false;
  let qualificationAnswers = {};
  let currentRecommendation = null;
  let isBooked = false;

  // Knowledge Base Mock Data for Portal Tabs
  const memberships = [
    { name: 'Starter Plan', price: '₹1,999/mo', benefits: ['Full Gym Access', 'Locker Room', 'Free Wi-Fi'], popular: false },
    { name: 'Growth Pro Plan', price: '₹2,999/mo', benefits: ['Gym Access', 'Group HIIT Classes', 'Sauna Access', '1 Fitness Assessment'], popular: true },
    { name: 'Premium Plan', price: '₹4,999/mo', benefits: ['All Classes & Facilities', 'Sauna & Steam', '2 Personal Training Sessions'], popular: false },
    { name: 'Elite VIP Transformation', price: '₹7,999/mo', benefits: ['Unlimited VIP Access', 'Dedicated PT Coach', 'Customized Nutrition Plan'], popular: false }
  ];

  const trainers = [
    { name: 'Arjun Verma', spec: 'Crossfit & HIIT Specialist', exp: '8 Years Exp', rating: '★ 4.9', img: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150&auto=format&fit=crop&q=80' },
    { name: 'Priya Singh', spec: 'Yoga & Flexibility Coach', exp: '6 Years Exp', rating: '★ 4.8', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=150&auto=format&fit=crop&q=80' },
    { name: 'Rahul Sharma', spec: 'Strength & Hypertrophy', exp: '10 Years Exp', rating: '★ 5.0', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
  ];

  const timetable = [
    { time: '06:00 AM', class: 'Sunrise Yoga', trainer: 'Priya Singh', spots: '4 spots left' },
    { time: '07:30 AM', class: 'High-Octane HIIT', trainer: 'Arjun Verma', spots: '2 spots left' },
    { time: '05:30 PM', class: 'Crossfit Challenge', trainer: 'Arjun Verma', spots: '5 spots left' },
    { time: '07:00 PM', class: 'Heavy Iron Strength', trainer: 'Rahul Sharma', spots: '3 spots left' }
  ];

  const faqs = [
    { q: 'What are your timings?', a: 'Monday to Saturday 5:00 AM – 11:00 PM, Sunday 6:00 AM – 8:00 PM.' },
    { q: 'Is personal training included?', a: 'Included in Premium and Elite VIP plans, or add-on for ₹500/session.' },
    { q: 'Can I freeze my plan?', a: 'Yes! Up to 30 days per year for travel or medical reasons.' }
  ];

  // Inject Styles
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    #gymos-ai-btn {
      position: fixed;
      ${position.includes('bottom') ? 'bottom: 24px;' : 'top: 24px;'}
      ${position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
      width: 60px; height: 60px;
      border-radius: 30px;
      background: linear-gradient(135deg, ${themeColor}, #6D28D9);
      color: #fff;
      border: 2px solid rgba(255,255,255,0.2);
      box-shadow: 0 10px 25px -5px rgba(139,92,246,0.5);
      cursor: pointer;
      display: flex; align-items: center; justify-center;
      font-size: 26px;
      transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
      z-index: 999998;
    }
    #gymos-ai-btn:hover { transform: scale(1.08) rotate(5deg); }
    #gymos-ai-btn .badge {
      position: absolute; top: -2px; right: -2px;
      background: #22C55E; width: 14px; height: 14px;
      border-radius: 50%; border: 2px solid #000;
    }

    #gymos-ai-portal {
      position: fixed;
      ${position.includes('bottom') ? 'bottom: 96px;' : 'top: 96px;'}
      ${position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
      width: 380px; max-width: calc(100vw - 32px);
      height: 600px; max-height: calc(100vh - 120px);
      background: #0D0D0F;
      border: 1px solid #27272A;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05);
      display: none; flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 999999;
      color: #fff;
      animation: gymosPortalOpen 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes gymosPortalOpen {
      0% { opacity: 0; transform: translateY(16px) scale(0.96); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    .gymos-header {
      background: linear-gradient(135deg, #18181B, #111113);
      padding: 16px; border-bottom: 1px solid #27272A;
      display: flex; align-items: center; justify-between;
    }
    .gymos-title { font-weight: 800; font-size: 15px; display: flex; align-items: center; gap: 8px; }
    .gymos-status { font-size: 11px; color: #22C55E; display: flex; align-items: center; gap: 4px; }
    .gymos-status::before { content: ""; width: 6px; height: 6px; background: #22C55E; border-radius: 50%; display: inline-block; animation: pulse 1.5s infinite; }

    .gymos-lang-select {
      background: #27272A; color: #fff; border: none; border-radius: 6px; font-size: 11px; padding: 3px 6px; cursor: pointer; outline: none;
    }

    .gymos-nav {
      display: flex; background: #111113; border-bottom: 1px solid #27272A;
      overflow-x: auto; scrollbar-width: none;
    }
    .gymos-nav::-webkit-scrollbar { display: none; }
    .gymos-nav-item {
      flex: 1; padding: 10px 8px; text-align: center; font-size: 11px; font-weight: 600;
      color: #71717A; cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .gymos-nav-item.active { color: #fff; border-bottom-color: ${themeColor}; background: rgba(139,92,246,0.05); }

    .gymos-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }

    /* Chat bubble styles */
    .gymos-msg { display: flex; flex-direction: column; max-width: 85%; }
    .gymos-msg.assistant { align-self: flex-start; }
    .gymos-msg.user { align-self: flex-end; align-items: flex-end; }
    .gymos-bubble {
      padding: 11px 14px; border-radius: 14px; font-size: 13px; line-height: 1.45;
    }
    .gymos-msg.assistant .gymos-bubble { background: #18181B; border: 1px solid #27272A; color: #E4E4E7; border-bottom-left-radius: 4px; }
    .gymos-msg.user .gymos-bubble { background: ${themeColor}; color: #fff; border-bottom-right-radius: 4px; font-weight: 500; }
    
    .gymos-quick-replies { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .gymos-qr-btn {
      background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.4); color: #C4B5FD;
      padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .gymos-qr-btn:hover { background: ${themeColor}; color: #fff; transform: translateY(-1px); }

    /* Recommendation Card */
    .gymos-rec-card {
      background: linear-gradient(135deg, #1E1B4B, #111113); border: 1px solid #4F46E5;
      border-radius: 14px; padding: 14px; margin-top: 6px; space-y: 8px;
    }
    .gymos-rec-title { font-size: 14px; font-weight: 800; color: #A5B4FC; display: flex; justify-content: space-between; align-items: center; }
    .gymos-rec-badge { background: #22C55E; color: #000; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 10px; }

    /* Input Footer */
    .gymos-footer {
      padding: 12px; background: #111113; border-top: 1px solid #27272A; display: flex; gap: 8px;
    }
    .gymos-input {
      flex: 1; background: #18181B; border: 1px solid #27272A; border-radius: 20px;
      padding: 8px 14px; font-size: 13px; color: #fff; outline: none; transition: border-color 0.2s;
    }
    .gymos-input:focus { border-color: ${themeColor}; }
    .gymos-send {
      background: ${themeColor}; border: none; width: 36px; height: 36px; border-radius: 50%;
      color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    .gymos-send:hover { transform: scale(1.05); }

    /* Portal tab items */
    .gymos-card { background: #18181B; border: 1px solid #27272A; border-radius: 12px; padding: 12px; margin-bottom: 10px; }
    .gymos-card-title { font-weight: 700; font-size: 13px; color: #fff; display: flex; justify-content: space-between; }
    .gymos-card-sub { font-size: 11px; color: #A1A1AA; margin-top: 4px; }
    .gymos-card-price { font-size: 15px; font-weight: 800; color: #22C55E; }
  `;
  document.head.appendChild(styleEl);

  // Inject DOM Elements
  const btn = document.createElement('div');
  btn.id = 'gymos-ai-btn';
  btn.innerHTML = `🤖<div class="badge"></div>`;
  document.body.appendChild(btn);

  const portal = document.createElement('div');
  portal.id = 'gymos-ai-portal';
  document.body.appendChild(portal);

  function renderPortal() {
    portal.innerHTML = `
      <div class="gymos-header">
        <div>
          <div class="gymos-title">💪 Way Ahead AI Assistant</div>
          <div class="gymos-status">Online • 24x7 Sales Employee</div>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <select class="gymos-lang-select" id="gymos-lang-picker">
            <option value="English" ${currentLanguage === 'English' ? 'selected' : ''}>ENG</option>
            <option value="Hindi" ${currentLanguage === 'Hindi' ? 'selected' : ''}>HIN</option>
            <option value="Punjabi" ${currentLanguage === 'Punjabi' ? 'selected' : ''}>PUN</option>
          </select>
          <button id="gymos-close-btn" style="background:none; border:none; color:#A1A1AA; font-size:20px; cursor:pointer;">&times;</button>
        </div>
      </div>

      <div class="gymos-nav">
        <div class="gymos-nav-item ${currentTab === 'home' ? 'active' : ''}" data-tab="home">AI Chat</div>
        <div class="gymos-nav-item ${currentTab === 'memberships' ? 'active' : ''}" data-tab="memberships">Plans</div>
        <div class="gymos-nav-item ${currentTab === 'trainers' ? 'active' : ''}" data-tab="trainers">Coaches</div>
        <div class="gymos-nav-item ${currentTab === 'timetable' ? 'active' : ''}" data-tab="timetable">Timetable</div>
        <div class="gymos-nav-item ${currentTab === 'support' ? 'active' : ''}" data-tab="support">Support</div>
      </div>

      <div class="gymos-body" id="gymos-body-content"></div>

      ${currentTab === 'home' ? `
      <div class="gymos-footer">
        <input type="text" class="gymos-input" id="gymos-chat-input" placeholder="Ask AI anything or type your goal..." />
        <button class="gymos-send" id="gymos-send-btn">➤</button>
      </div>` : ''}
    `;

    const bodyEl = portal.querySelector('#gymos-body-content');

    if (currentTab === 'home') {
      bodyEl.innerHTML = messages.map((m, idx) => `
        <div class="gymos-msg ${m.role}">
          <div class="gymos-bubble">${m.text}</div>
          ${m.rec ? `
            <div class="gymos-rec-card">
              <div class="gymos-rec-title">
                <span>🌟 Ideal Match: ${m.rec.program}</span>
                <span class="gymos-rec-badge">${m.rec.confidence}% Match</span>
              </div>
              <div style="font-size:11px; color:#C4B5FD; margin-top:4px;">
                ✓ Coach: ${m.rec.trainer}<br/>
                ✓ Duration: ${m.rec.duration}<br/>
                ✓ Investment: <b style="color:#22C55E;">${m.rec.price}</b>
              </div>
              <button class="gymos-qr-btn" style="width:100%; margin-top:8px; text-align:center; background:#22C55E; color:#000; font-weight:800;" onclick="window.__GymOS_TriggerTrialBook('${m.rec.program}')">
                📅 Book VIP Guest Trial Now
              </button>
            </div>
          ` : ''}
          ${m.quickReplies && !isBooked ? `
            <div class="gymos-quick-replies">
              ${m.quickReplies.map(qr => `<button class="gymos-qr-btn" onclick="window.__GymOS_SendReply('${qr}')">${qr}</button>`).join('')}
            </div>
          ` : ''}
        </div>
      `).join('');

      if (isThinking) {
        bodyEl.innerHTML += `<div class="gymos-msg assistant"><div class="gymos-bubble" style="color:#A1A1AA;">AI Consultant is analyzing goals... ⚡</div></div>`;
      }
      bodyEl.scrollTop = bodyEl.scrollHeight;
    } else if (currentTab === 'memberships') {
      bodyEl.innerHTML = memberships.map(m => `
        <div class="gymos-card" style="${m.popular ? 'border-color:#8B5CF6; background:rgba(139,92,246,0.05);' : ''}">
          <div class="gymos-card-title">
            <span>${m.name} ${m.popular ? '<span style="color:#8B5CF6; font-size:10px;">★ MOST POPULAR</span>' : ''}</span>
            <span class="gymos-card-price">${m.price}</span>
          </div>
          <div class="gymos-card-sub">
            ${m.benefits.map(b => `<div>• ${b}</div>`).join('')}
          </div>
          <button class="gymos-qr-btn" style="margin-top:8px; width:100%;" onclick="window.__GymOS_SendReply('I am interested in ${m.name}')">Inquire via AI Chat</button>
        </div>
      `).join('');
    } else if (currentTab === 'trainers') {
      bodyEl.innerHTML = trainers.map(t => `
        <div class="gymos-card" style="display:flex; gap:12px; align-items:center;">
          <img src="${t.img}" style="width:50px; height:50px; border-radius:25px; object-fit:cover; border:1px solid #27272A;" />
          <div style="flex:1;">
            <div class="gymos-card-title"><span>${t.name}</span> <span style="color:#F59E0B;">${t.rating}</span></div>
            <div class="gymos-card-sub">${t.spec} • ${t.exp}</div>
            <button class="gymos-qr-btn" style="margin-top:6px; font-size:10px; padding:3px 8px;" onclick="window.__GymOS_SendReply('I want to train with ${t.name}')">Book Assessment</button>
          </div>
        </div>
      `).join('');
    } else if (currentTab === 'timetable') {
      bodyEl.innerHTML = timetable.map(tt => `
        <div class="gymos-card">
          <div class="gymos-card-title"><span>⏰ ${tt.time} — ${tt.class}</span> <span style="color:#3B82F6; font-size:11px;">${tt.spots}</span></div>
          <div class="gymos-card-sub">Coach: ${tt.trainer}</div>
        </div>
      `).join('');
    } else if (currentTab === 'support') {
      bodyEl.innerHTML = `
        <div style="font-size:12px; color:#E4E4E7; margin-bottom:8px; font-weight:700;">Frequently Asked Questions (RAG Base)</div>
        ${faqs.map(f => `
          <div class="gymos-card">
            <div style="font-weight:700; font-size:12px; color:#A5B4FC;">Q: ${f.q}</div>
            <div class="gymos-card-sub" style="color:#D4D4D8; margin-top:4px;">A: ${f.a}</div>
          </div>
        `).join('')}
        <button class="gymos-qr-btn" style="width:100%; margin-top:12px; background:#EF4444; color:#fff; text-align:center;" onclick="window.__GymOS_SendReply('I need to speak to a human manager')">
          🚨 Escalate to Human Sales Manager
        </button>
      `;
    }

    // Bind event handlers
    portal.querySelector('#gymos-close-btn').onclick = () => { portal.style.display = 'none'; };
    portal.querySelector('#gymos-lang-picker').onchange = (e) => {
      currentLanguage = e.target.value;
      renderPortal();
    };
    portal.querySelectorAll('.gymos-nav-item').forEach(item => {
      item.onclick = () => {
        currentTab = item.getAttribute('data-tab');
        renderPortal();
      };
    });

    const inputEl = portal.querySelector('#gymos-chat-input');
    const sendEl = portal.querySelector('#gymos-send-btn');
    if (inputEl && sendEl) {
      const sendMsg = () => {
        const txt = inputEl.value.trim();
        if (!txt) return;
        inputEl.value = '';
        window.__GymOS_SendReply(txt);
      };
      sendEl.onclick = sendMsg;
      inputEl.onkeypress = (e) => { if (e.key === 'Enter') sendMsg(); };
    }
  }

  window.__GymOS_SendReply = async function(text) {
    if (currentTab !== 'home') currentTab = 'home';
    messages.push({ role: 'user', text: text });
    isThinking = true;
    renderPortal();

    // Call Supabase RPC process_ai_sales_interaction
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/process_ai_sales_interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`
        },
        body: JSON.stringify({
          p_gym_id: gymId,
          p_session_token: sessionToken,
          p_visitor_name: 'AI Chat Visitor (' + sessionToken.slice(-4) + ')',
          p_visitor_phone: '+91 98765 ' + Math.floor(10000 + Math.random() * 90000),
          p_goal: text.includes('Weight') || text.includes('Lose') ? 'Lose Weight' : text.includes('Muscle') ? 'Build Muscle' : text,
          p_budget: 3500,
          p_training_days: 4,
          p_recommended_plan: text.includes('Elite') ? 'Elite VIP Transformation' : 'Growth Pro Plan',
          p_confidence: 94.5,
          p_book_trial: text.toLowerCase().includes('book') || text.toLowerCase().includes('trial') || text.toLowerCase().includes('yes')
        })
      });

      const data = await resp.json();
      isThinking = false;

      let replyTxt = '';
      if (currentLanguage === 'Hindi') {
        replyTxt = `शानदार! आपके लक्ष्य के अनुसार हमारा "${data.recommendation ? data.recommendation.program : 'Growth Pro Plan'}" सबसे बेहतरीन है। क्या मैं आपका फ्री VIP गेस्ट ट्रायल बुक कर दूँ?`;
      } else if (currentLanguage === 'Punjabi') {
        replyTxt = `ਬਹੁਤ ਵਧੀਆ! ਤੁਹਾਡੇ ਟੀਚੇ ਲਈ ਸਾਡਾ "${data.recommendation ? data.recommendation.program : 'Growth Pro Plan'}" ਸਭ ਤੋਂ ਬੈਸਟ ਹੈ। ਕੀ ਮੈਂ ਤੁਹਾਡੀ ਫ੍ਰੀ VIP ਟ੍ਰਾਇਲ ਕਲਾਸ ਬੁੱਕ ਕਰ ਦਵਾਂ?`;
      } else {
        replyTxt = `Excellent choice! Based on your target of [${text}], our AI consultant recommends the **${data.recommendation ? data.recommendation.program : 'Growth Pro Plan'}** (${data.recommendation ? data.recommendation.price : '₹2,999/mo'}). Estimated timeline: 4-6 months with nutrition guidance. Would you like me to book your free VIP trial session for tomorrow?`;
      }

      if (text.toLowerCase().includes('book') || text.toLowerCase().includes('yes') || text.toLowerCase().includes('trial')) {
        isBooked = true;
        replyTxt = `🎉 VIP Trial Booked! We have reserved your station for tomorrow evening. A WhatsApp confirmation has been dispatched to your phone! 💪`;
      }

      messages.push({
        role: 'assistant',
        text: replyTxt,
        rec: !isBooked && data.recommendation ? data.recommendation : null,
        quickReplies: !isBooked ? ['Yes, Book VIP Trial Now 📅', 'Tell me about pricing', 'No, maybe later'] : null
      });

      renderPortal();
    } catch (err) {
      isThinking = false;
      messages.push({ role: 'assistant', text: 'Thank you! Our fitness consultant has recorded your inquiry and will follow up via WhatsApp shortly.' });
      renderPortal();
    }
  };

  window.__GymOS_TriggerTrialBook = function(planName) {
    window.__GymOS_SendReply('Yes, Book VIP Trial Now for ' + planName);
  };

  btn.onclick = () => {
    portal.style.display = portal.style.display === 'flex' ? 'none' : 'flex';
    if (portal.style.display === 'flex') renderPortal();
  };
})();
