/**
 * Way Ahead GymOS v2.0 — Embeddable Lead Capture Widget
 * Usage: <script src="https://app.wayaheadgymos.com/widget.js" data-gym-id="YOUR_GYM_ID" data-form-id="FREE_TRIAL"></script>
 */
(function() {
  var script = document.currentScript || document.querySelector('script[data-gym-id]');
  if (!script) return;
  var gymId = script.getAttribute('data-gym-id');
  var formId = script.getAttribute('data-form-id') || 'FREE_TRIAL';
  var themeColor = script.getAttribute('data-theme-color') || '#8B5CF6';

  // Inject Styles
  var style = document.createElement('style');
  style.innerHTML = `
    #gymos-widget-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      background: ${themeColor}; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-weight: 700; font-size: 14px; padding: 14px 24px; border-radius: 50px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3); cursor: pointer; border: none; transition: transform 0.2s;
      display: flex; align-items: center; gap: 8px;
    }
    #gymos-widget-btn:hover { transform: scale(1.05); }
    #gymos-modal-overlay {
      position: fixed; inset: 0; z-index: 1000000; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
      display: none; align-items: center; justify-content: center; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #gymos-modal-card {
      background: #18181B; border: 1px solid #27272A; border-radius: 20px; width: 100%; max-width: 440px;
      padding: 28px; box-shadow: 0 25px 50px rgba(0,0,0,0.6); color: #fff; position: relative;
    }
    .gymos-step-badge {
      display: inline-block; background: #27272A; color: #A1A1AA; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 20px; margin-bottom: 8px;
    }
    .gymos-label {
      display: block; font-size: 12px; font-weight: 600; color: #D4D4D8; margin-bottom: 4px;
    }
    .gymos-input {
      width: 100%; background: #111113; border: 1px solid #27272A; color: #fff; padding: 11px 14px;
      border-radius: 10px; margin-bottom: 14px; font-size: 14px; box-sizing: border-box; outline: none; transition: border-color 0.2s;
    }
    .gymos-input:focus { border-color: ${themeColor}; box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2); }
    .gymos-row { display: flex; gap: 12px; }
    .gymos-row > div { flex: 1; }
    .gymos-submit {
      width: 100%; background: ${themeColor}; color: #fff; font-weight: 700; padding: 14px; border-radius: 12px;
      border: none; cursor: pointer; font-size: 15px; margin-top: 8px; transition: opacity 0.2s, transform 0.1s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .gymos-submit:hover { opacity: 0.95; transform: translateY(-1px); }
    .gymos-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  `;
  document.head.appendChild(style);

  // Inject DOM Elements
  var btn = document.createElement('button');
  btn.id = 'gymos-widget-btn';
  btn.innerHTML = '💪 <span>Book Free Trial</span>';
  document.body.appendChild(btn);

  var overlay = document.createElement('div');
  overlay.id = 'gymos-modal-overlay';
  overlay.innerHTML = `
    <div id="gymos-modal-card">
      <button id="gymos-close-btn" style="position: absolute; top: 18px; right: 18px; background: none; border: none; color: #888; cursor: pointer; font-size: 22px; line-height: 1;">&times;</button>
      <div class="gymos-step-badge">VIP Pass Request • Step 1 of 2</div>
      <h3 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #fff;">Book Your Free Trial</h3>
      <p style="margin: 0 0 20px 0; color: #A1A1AA; font-size: 13px; line-height: 1.4;">Leave your details below and choose your preferred schedule. Our team will prepare your complimentary pass.</p>
      
      <form id="gymos-form">
        <label class="gymos-label">Your Full Name *</label>
        <input required class="gymos-input" type="text" placeholder="e.g. Rahul Sharma" name="name" />
        
        <div class="gymos-row">
          <div>
            <label class="gymos-label">WhatsApp / Phone *</label>
            <input required class="gymos-input" type="tel" placeholder="+91 98765 43210" name="phone" />
          </div>
          <div>
            <label class="gymos-label">Email Address</label>
            <input class="gymos-input" type="email" placeholder="rahul@example.com" name="email" />
          </div>
        </div>

        <label class="gymos-label">Primary Fitness Goal</label>
        <select class="gymos-input" name="goal">
          <option value="Lose Weight">Lose Weight & Fat Burn</option>
          <option value="Build Muscle">Build Muscle & Hypertrophy</option>
          <option value="Crossfit">Crossfit & High Intensity</option>
          <option value="Yoga">Yoga & Flexibility</option>
          <option value="Personal Training">1-on-1 Personal Training</option>
        </select>

        <div style="border-top: 1px solid #27272A; margin: 16px 0 14px 0; padding-top: 14px;">
          <div class="gymos-step-badge" style="margin-bottom: 10px;">Schedule • Step 2 of 2</div>
          <div class="gymos-row">
            <div>
              <label class="gymos-label">Preferred Date</label>
              <input class="gymos-input" type="date" name="pref_date" />
            </div>
            <div>
              <label class="gymos-label">Preferred Time</label>
              <select class="gymos-input" name="pref_time">
                <option value="Morning (6AM - 10AM)">Morning (6AM - 10AM)</option>
                <option value="Afternoon (12PM - 4PM)">Afternoon (12PM - 4PM)</option>
                <option value="Evening (5PM - 9PM)">Evening (5PM - 9PM)</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" id="gymos-submit-btn" class="gymos-submit">Confirm VIP Pass Request &rarr;</button>
      </form>

      <div id="gymos-success" style="display: none; text-align: center; padding: 24px 0;">
        <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
        <h4 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 800; color: #22C55E;">VIP Trial Booked!</h4>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #D4D4D8; line-height: 1.5;">We have received your request and dispatched your complimentary guest pass instructions to your WhatsApp.</p>
        <div style="background: #111113; border: 1px solid #27272A; border-radius: 12px; padding: 12px; font-size: 12px; color: #A1A1AA;">
          Our front desk is preparing your station. See you soon! 💪
        </div>
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
    var submitBtn = document.getElementById('gymos-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Securing VIP Pass...';

    var formData = new FormData(e.target);
    var goalText = formData.get('goal');
    var prefDate = formData.get('pref_date');
    var prefTime = formData.get('pref_time');
    if (prefDate || prefTime) {
      goalText += ' [Schedule: ' + (prefDate || 'Any Date') + ' - ' + (prefTime || 'Any Time') + ']';
    }

    var payload = {
      p_gym_id: gymId,
      p_name: formData.get('name'),
      p_phone: formData.get('phone'),
      p_email: formData.get('email'),
      p_goal: goalText,
      p_source: 'Website Embed Widget (' + formId + ')',
      p_form_id: formId
    };

    fetch('https://tkwaarpgvshhkvobzkin.supabase.co/rest/v1/rpc/submit_widget_lead', {
      method: 'POST',
      headers: {
        'apikey': 'sb_publishable_OUTAurmU_aU4jb-_ikl41w_vam3DyFy',
        'Authorization': 'Bearer sb_publishable_OUTAurmU_aU4jb-_ikl41w_vam3DyFy',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(function(res) {
      if (!res.ok) throw new Error('API submission error');
      return res.json();
    }).then(function(data) {
      document.getElementById('gymos-form').style.display = 'none';
      document.getElementById('gymos-success').style.display = 'block';
      setTimeout(function() { overlay.style.display = 'none'; }, 4000);
    }).catch(function(err) {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Confirm VIP Pass Request →';
      alert('Network error while requesting pass. Please call our front desk directly.');
      console.error('GymOS Widget Submission Error:', err);
    });
  };
})();
