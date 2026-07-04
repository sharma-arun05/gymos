/**
 * Way Ahead GymOS v1.0 — Embeddable Lead Capture Widget
 * Usage: <script src="https://gymos.app/widget.js" data-gym-id="YOUR_GYM_ID"></script>
 */
(function() {
  var script = document.currentScript || document.querySelector('script[data-gym-id]');
  if (!script) return;
  var gymId = script.getAttribute('data-gym-id');
  var themeColor = script.getAttribute('data-theme-color') || '#8B5CF6';

  // Inject Styles
  var style = document.createElement('style');
  style.innerHTML = `
    #gymos-widget-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      background: ${themeColor}; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-weight: 700; font-size: 14px; padding: 14px 24px; border-radius: 50px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3); cursor: pointer; border: none; transition: transform 0.2s;
    }
    #gymos-widget-btn:hover { transform: scale(1.05); }
    #gymos-modal-overlay {
      position: fixed; inset: 0; z-index: 1000000; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
      display: none; align-items: center; justify-content: center; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #gymos-modal-card {
      background: #18181B; border: 1px solid #27272A; border-radius: 20px; width: 100%; max-width: 420px;
      padding: 28px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); color: #fff; position: relative;
    }
    .gymos-input {
      width: 100%; background: #111113; border: 1px solid #27272A; color: #fff; padding: 12px 16px;
      border-radius: 12px; margin-bottom: 14px; font-size: 14px; box-sizing: border-box; outline: none;
    }
    .gymos-input:focus { border-color: ${themeColor}; }
    .gymos-submit {
      width: 100%; background: ${themeColor}; color: #fff; font-weight: 700; padding: 14px; border-radius: 12px;
      border: none; cursor: pointer; font-size: 15px; margin-top: 6px; transition: opacity 0.2s;
    }
    .gymos-submit:hover { opacity: 0.9; }
  `;
  document.head.appendChild(style);

  // Inject DOM Elements
  var btn = document.createElement('button');
  btn.id = 'gymos-widget-btn';
  btn.innerText = '💪 Claim Free Guest Pass';
  document.body.appendChild(btn);

  var overlay = document.createElement('div');
  overlay.id = 'gymos-modal-overlay';
  overlay.innerHTML = `
    <div id="gymos-modal-card">
      <button id="gymos-close-btn" style="position: absolute; top: 18px; right: 18px; background: none; border: none; color: #888; cursor: pointer; font-size: 20px;">&times;</button>
      <h3 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 800;">Get Started Today</h3>
      <p style="margin: 0 0 20px 0; color: #aaa; font-size: 13px;">Leave your details below and our team will book your complimentary VIP trial session.</p>
      <form id="gymos-form">
        <input required class="gymos-input" type="text" placeholder="Your Full Name" name="name" />
        <input required class="gymos-input" type="tel" placeholder="WhatsApp / Phone Number" name="phone" />
        <input class="gymos-input" type="email" placeholder="Email Address (Optional)" name="email" />
        <select class="gymos-input" name="goal">
          <option value="Weight Loss">Weight Loss & Fat Burn</option>
          <option value="Muscle Gain">Muscle Gain & Hypertrophy</option>
          <option value="General Fitness">General Fitness & Cardio</option>
          <option value="Personal Training">1-on-1 Personal Training</option>
        </select>
        <button type="submit" class="gymos-submit">Confirm VIP Pass Request &rarr;</button>
      </form>
      <div id="gymos-success" style="display: none; text-align: center; padding: 20px 0;">
        <div style="font-size: 40px; margin-bottom: 10px;">🎉</div>
        <h4 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #22C55E;">Request Confirmed!</h4>
        <p style="margin: 0; font-size: 13px; color: #ccc;">We have sent your guest pass details to your WhatsApp.</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Event Listeners
  btn.onclick = function() { overlay.style.display = 'flex'; };
  document.getElementById('gymos-close-btn').onclick = function() { overlay.style.display = 'none'; };
  overlay.onclick = function(e) { if (e.target === overlay) overlay.style.display = 'none'; };

  document.getElementById('gymos-form').onsubmit = function(e) {
    e.preventDefault();
    var formData = new FormData(e.target);
    var payload = {
      gym_id: gymId,
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      goal: formData.get('goal'),
      source: 'Website Embed Widget'
    };

    fetch('https://YOUR_SUPABASE_URL/functions/v1/widget-lead-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function() {
      document.getElementById('gymos-form').style.display = 'none';
      document.getElementById('gymos-success').style.display = 'block';
      setTimeout(function() { overlay.style.display = 'none'; }, 3000);
    }).catch(function() {
      alert('Network error. Please call our front desk directly.');
    });
  };
})();
