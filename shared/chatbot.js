/**
 * IntelliFinance Conversational Financial Advisor Chatbot
 * ─────────────────────────────────────────────────────────
 * A floating bottom-right chatbot widget that provides
 * personalized financial guidance based on the user's profile.
 *
 * Usage: Include this script on any page after data.js:
 *   <script src="../shared/chatbot.js"></script>
 */
(function () {
  'use strict';

  // ─── Inject Styles ───────────────────────────────────────────────────────────
  const CHATBOT_CSS = `
    /* ── Floating Action Button ── */
    #if-chatbot-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9998;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      border: none;
      cursor: pointer;
      background: linear-gradient(135deg, #645efb 0%, #4b41e1 100%);
      color: #fff;
      box-shadow: 0 6px 20px rgba(100, 94, 251, 0.45), 0 2px 6px rgba(0,0,0,0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease, opacity 0.3s ease;
      animation: if-fab-entrance 0.5s cubic-bezier(.34,1.56,.64,1) both;
      animation-delay: 1s;
    }
    #if-chatbot-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 8px 28px rgba(100, 94, 251, 0.55), 0 3px 8px rgba(0,0,0,0.15);
    }
    #if-chatbot-fab:active { transform: scale(0.95); }
    #if-chatbot-fab.if-hidden { opacity: 0; pointer-events: none; transform: scale(0.5); }
    #if-chatbot-fab .if-fab-icon {
      font-size: 26px;
      transition: transform 0.4s cubic-bezier(.34,1.56,.64,1);
    }
    #if-chatbot-fab:hover .if-fab-icon { transform: rotate(-12deg) scale(1.1); }

    /* Notification dot */
    #if-chatbot-fab .if-fab-dot {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #00c853;
      border: 2.5px solid #fff;
      animation: if-dot-pulse 2s ease-in-out infinite;
    }

    @keyframes if-fab-entrance {
      from { opacity: 0; transform: scale(0.3) translateY(40px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes if-dot-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.25); }
    }

    /* ── Chat Window ── */
    #if-chatbot-window {
      position: fixed;
      bottom: 90px;
      right: 24px;
      z-index: 9999;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 540px;
      max-height: calc(100vh - 120px);
      border-radius: 20px;
      background: #ffffff;
      border: 1px solid #dce9ff;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(100,94,251,0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.35s cubic-bezier(.22,1,.36,1), transform 0.35s cubic-bezier(.22,1,.36,1);
    }
    #if-chatbot-window.if-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* ── Header ── */
    .if-chat-header {
      background: linear-gradient(135deg, #131b2e 0%, #213145 100%);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .if-chat-header-avatar {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: linear-gradient(135deg, #645efb 0%, #4b41e1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(100,94,251,0.4);
    }
    .if-chat-header-avatar span { font-size: 20px; color: #fff; }
    .if-chat-header-info { flex: 1; }
    .if-chat-header-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      font-size: 14px;
      color: #fff;
      margin: 0;
      line-height: 1.2;
    }
    .if-chat-header-sub {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: rgba(255,255,255,0.6);
      margin: 2px 0 0;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .if-chat-header-sub .if-online-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #4edea3;
      animation: if-dot-pulse 2s ease-in-out infinite;
    }
    .if-chat-close-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      border-radius: 10px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
      flex-shrink: 0;
    }
    .if-chat-close-btn:hover { background: rgba(255,255,255,0.2); }
    .if-chat-close-btn span { font-size: 18px; color: #fff; }

    /* ── Messages Area ── */
    .if-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f8f9ff;
      scroll-behavior: smooth;
    }
    .if-chat-messages::-webkit-scrollbar { width: 5px; }
    .if-chat-messages::-webkit-scrollbar-track { background: transparent; }
    .if-chat-messages::-webkit-scrollbar-thumb { background: #c6c6cd; border-radius: 10px; }

    /* ── Message Bubbles ── */
    .if-msg { display: flex; gap: 8px; animation: if-msg-in 0.35s ease both; max-width: 100%; }
    .if-msg.if-user { flex-direction: row-reverse; }
    @keyframes if-msg-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .if-msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
      font-size: 14px;
    }
    .if-msg.if-bot .if-msg-avatar {
      background: linear-gradient(135deg, #645efb, #4b41e1);
      color: #fff;
    }
    .if-msg.if-user .if-msg-avatar {
      background: #131b2e;
      color: #fff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      font-size: 11px;
    }

    .if-msg-bubble {
      padding: 10px 14px;
      border-radius: 16px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      line-height: 1.55;
      max-width: calc(100% - 44px);
      word-break: break-word;
    }
    .if-msg.if-bot .if-msg-bubble {
      background: #fff;
      color: #0b1c30;
      border: 1px solid #e5eeff;
      border-bottom-left-radius: 6px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .if-msg.if-user .if-msg-bubble {
      background: linear-gradient(135deg, #645efb 0%, #4b41e1 100%);
      color: #fff;
      border-bottom-right-radius: 6px;
      box-shadow: 0 2px 8px rgba(100,94,251,0.3);
    }
    .if-msg-bubble strong { font-weight: 600; }
    .if-msg-bubble em { color: #645efb; font-style: normal; font-weight: 600; }

    /* ── Typing indicator ── */
    .if-typing-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
    }
    .if-typing-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #645efb;
      animation: if-typing 1.4s ease-in-out infinite;
    }
    .if-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .if-typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes if-typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    /* ── Quick Suggestions ── */
    .if-chat-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 14px 6px;
      background: #f8f9ff;
    }
    .if-suggestion-chip {
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid #dce9ff;
      background: #fff;
      color: #4b41e1;
      font-family: 'Inter', sans-serif;
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .if-suggestion-chip:hover {
      background: #645efb;
      color: #fff;
      border-color: #645efb;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(100,94,251,0.3);
    }

    /* ── Input Area ── */
    .if-chat-input-area {
      padding: 12px 14px;
      background: #fff;
      border-top: 1px solid #e5eeff;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .if-chat-input {
      flex: 1;
      border: 1.5px solid #dce9ff;
      border-radius: 14px;
      padding: 10px 14px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: #0b1c30;
      background: #f8f9ff;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      resize: none;
      min-height: 40px;
      max-height: 80px;
    }
    .if-chat-input::placeholder { color: #76777d; }
    .if-chat-input:focus {
      border-color: #645efb;
      box-shadow: 0 0 0 3px rgba(100,94,251,0.1);
      background: #fff;
    }
    .if-chat-send {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #645efb 0%, #4b41e1 100%);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      flex-shrink: 0;
    }
    .if-chat-send:hover {
      transform: scale(1.05);
      box-shadow: 0 3px 12px rgba(100,94,251,0.4);
    }
    .if-chat-send:active { transform: scale(0.92); }
    .if-chat-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .if-chat-send span { font-size: 20px; }

    /* ── Responsive ── */
    @media (max-width: 440px) {
      #if-chatbot-window {
        right: 8px;
        left: 8px;
        bottom: 80px;
        width: auto;
        height: calc(100vh - 100px);
        max-height: calc(100vh - 100px);
        border-radius: 16px;
      }
      #if-chatbot-fab { bottom: 16px; right: 16px; }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = CHATBOT_CSS;
  document.head.appendChild(styleEl);

  // ─── Build DOM ──────────────────────────────────────────────────────────────

  // FAB
  const fab = document.createElement('button');
  fab.id = 'if-chatbot-fab';
  fab.setAttribute('aria-label', 'Open financial advisor chat');
  fab.innerHTML = `
    <span class="material-symbols-outlined if-fab-icon" style="font-variation-settings: 'FILL' 1;">finance_mode</span>
    <span class="if-fab-dot"></span>
  `;

  // Chat Window
  const chatWin = document.createElement('div');
  chatWin.id = 'if-chatbot-window';

  const profile = (window.IntelliFinance && window.IntelliFinance.loadProfile) ? window.IntelliFinance.loadProfile() : {};
  const userInitials = profile.initials || 'U';

  chatWin.innerHTML = `
    <div class="if-chat-header">
      <div class="if-chat-header-avatar">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">psychology</span>
      </div>
      <div class="if-chat-header-info">
        <div class="if-chat-header-title">IntelliFinance Advisor</div>
        <div class="if-chat-header-sub">
          <span class="if-online-dot"></span>
          AI-Powered • Personalized
        </div>
      </div>
      <button class="if-chat-close-btn" aria-label="Close chat">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div class="if-chat-messages" id="if-chat-msgs"></div>
    <div class="if-chat-suggestions" id="if-chat-suggestions"></div>
    <div class="if-chat-input-area">
      <input class="if-chat-input" id="if-chat-input" type="text" placeholder="Ask me anything about finance…" autocomplete="off" />
      <button class="if-chat-send" id="if-chat-send" aria-label="Send message">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">send</span>
      </button>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(chatWin);

  // ─── References ─────────────────────────────────────────────────────────────
  const msgContainer = document.getElementById('if-chat-msgs');
  const inputEl = document.getElementById('if-chat-input');
  const sendBtn = document.getElementById('if-chat-send');
  const suggestionsEl = document.getElementById('if-chat-suggestions');
  const closeBtn = chatWin.querySelector('.if-chat-close-btn');

  let isOpen = false;
  let conversationHistory = [];

  // ─── Toggle ─────────────────────────────────────────────────────────────────
  function toggleChat() {
    isOpen = !isOpen;
    chatWin.classList.toggle('if-open', isOpen);
    fab.querySelector('.if-fab-dot').style.display = isOpen ? 'none' : 'block';
    if (isOpen) {
      setTimeout(() => inputEl.focus(), 350);
      if (conversationHistory.length === 0) showWelcome();
    }
  }

  fab.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggleChat();
  });

  // ─── Render Messages ───────────────────────────────────────────────────────
  function addMessage(text, sender) {
    conversationHistory.push({ text, sender });
    const msgDiv = document.createElement('div');
    msgDiv.className = `if-msg ${sender === 'user' ? 'if-user' : 'if-bot'}`;

    const currentP = loadFreshProfile();
    const initials = currentP.initials || 'U';
    const avatarContent = sender === 'user' ? initials : '<span class="material-symbols-outlined" style="font-size:15px; font-variation-settings: \'FILL\' 1;">psychology</span>';

    msgDiv.innerHTML = `
      <div class="if-msg-avatar">${avatarContent}</div>
      <div class="if-msg-bubble">${text}</div>
    `;
    msgContainer.appendChild(msgDiv);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'if-msg if-bot';
    typingDiv.id = 'if-typing';
    typingDiv.innerHTML = `
      <div class="if-msg-avatar"><span class="material-symbols-outlined" style="font-size:15px; font-variation-settings: 'FILL' 1;">psychology</span></div>
      <div class="if-msg-bubble">
        <div class="if-typing-indicator">
          <div class="if-typing-dot"></div>
          <div class="if-typing-dot"></div>
          <div class="if-typing-dot"></div>
        </div>
      </div>
    `;
    msgContainer.appendChild(typingDiv);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('if-typing');
    if (t) t.remove();
  }

  // ─── Suggestions ────────────────────────────────────────────────────────────
  function showSuggestions(chips) {
    suggestionsEl.innerHTML = '';
    chips.forEach(text => {
      const chip = document.createElement('button');
      chip.className = 'if-suggestion-chip';
      chip.textContent = text;
      chip.addEventListener('click', () => {
        handleUserInput(text);
        suggestionsEl.innerHTML = '';
      });
      suggestionsEl.appendChild(chip);
    });
  }

  // ─── Welcome Message ───────────────────────────────────────────────────────
  function showWelcome() {
    const p = loadFreshProfile();
    const name = p.displayName || p.fullName || 'there';
    const firstName = name.split(' ')[0];

    addMessage(
      `Hey ${firstName}! 👋 I'm your <strong>IntelliFinance Advisor</strong>.<br><br>` +
      `I can help you with personalized financial guidance based on your profile. Ask me anything about:<br>` +
      `• 💰 <strong>Budgeting</strong> & expense management<br>` +
      `• 📈 <strong>Investments</strong> & portfolio strategy<br>` +
      `• 🎯 <strong>Goals</strong> & financial planning<br>` +
      `• 🏥 <strong>Financial health</strong> & score analysis<br>` +
      `• 💳 <strong>Debt</strong> management & EMI optimization`,
      'bot'
    );

    const suggestions = [
      'My financial summary',
      'How\'s my health score?',
      'Investment tips',
      'Budget advice',
      'Debt strategy'
    ];
    showSuggestions(suggestions);
  }

  // ─── Profile Helpers ───────────────────────────────────────────────────────
  function loadFreshProfile() {
    return (window.IntelliFinance && window.IntelliFinance.loadProfile) ? window.IntelliFinance.loadProfile() : {};
  }

  function fmt(val) {
    if (val == null || isNaN(val)) return '$0.00';
    return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ─── Financial Knowledge Engine ─────────────────────────────────────────────
  function generateResponse(userText) {
    const p = loadFreshProfile();
    const q = userText.toLowerCase().trim();

    // ── Summary / Overview ──
    if (matchAny(q, ['summary', 'overview', 'snapshot', 'my finances', 'financial summary', 'how am i doing', 'my profile', 'show me everything', 'dashboard'])) {
      const lines = [];
      lines.push(`Here's your <strong>financial snapshot</strong>, ${(p.displayName || 'friend').split(' ')[0]}:<br>`);
      lines.push(`💵 <strong>Monthly Income:</strong> ${fmt(p.baseSalary)}`);
      lines.push(`📤 <strong>Total Outflow:</strong> ${fmt(p.totalOutflow)}`);
      lines.push(`📊 <strong>Net Surplus:</strong> <em>${fmt(p.netSurplus)}</em>`);
      lines.push(`💎 <strong>Net Worth:</strong> <em>${fmt(p.netWorth)}</em>`);
      lines.push(`📈 <strong>Investments:</strong> ${fmt(p.totalInvestments)}`);
      lines.push(`🏦 <strong>Emergency Fund:</strong> ${fmt(p.emergencyFunded)} / ${fmt(p.emergencyTarget)}`);
      lines.push(`❤️ <strong>Health Score:</strong> <em>${p.healthScore || 0}/100</em>`);

      if (p.netSurplus > 0) {
        lines.push(`<br>✅ You're saving <em>${fmt(p.netSurplus)}</em>/month — that's great! Keep it going.`);
      } else if (p.totalInflow > 0) {
        lines.push(`<br>⚠️ Your outflow exceeds income. Let's work on reducing expenses.`);
      }
      return { text: lines.join('<br>'), suggestions: ['Health score details', 'Investment tips', 'Budget breakdown'] };
    }

    // ── Health Score ──
    if (matchAny(q, ['health score', 'health', 'financial health', 'score', 'how healthy'])) {
      const score = p.healthScore || 0;
      let emoji, verdict;
      if (score >= 80) { emoji = '🟢'; verdict = 'Excellent'; }
      else if (score >= 60) { emoji = '🟡'; verdict = 'Good, with room for improvement'; }
      else if (score >= 40) { emoji = '🟠'; verdict = 'Needs attention'; }
      else { emoji = '🔴'; verdict = 'Critical — let\'s fix this together'; }

      const lines = [
        `Your Financial Health Score: ${emoji} <strong><em>${score}/100</em></strong>`,
        `Verdict: <strong>${verdict}</strong><br>`,
        `Here's what factors into your score:`,
        `• <strong>DTI Ratio:</strong> ${p.dtiRatio || 0}% ${(p.dtiRatio || 0) < 20 ? '✅ Healthy' : '⚠️ High'}`,
        `• <strong>Expense Ratio:</strong> ${p.expenseRatio || 0}% ${(p.expenseRatio || 0) < 70 ? '✅' : '⚠️'}`,
        `• <strong>Net Surplus:</strong> ${fmt(p.netSurplus)} ${p.netSurplus > 0 ? '✅ Positive' : '❌ Negative'}`,
        `• <strong>Emergency Fund:</strong> ${fmt(p.emergencyFunded)}/${fmt(p.emergencyTarget)} ${p.emergencyFunded >= p.emergencyTarget && p.emergencyTarget > 0 ? '✅ Fully funded' : '⚠️ Under-funded'}`,
      ];

      if (score < 80) {
        lines.push(`<br>💡 <strong>Tip:</strong> ${getHealthTip(p)}`);
      }
      return { text: lines.join('<br>'), suggestions: ['How to improve score?', 'Budget advice', 'My summary'] };
    }

    // ── Budget / Expenses ──
    if (matchAny(q, ['budget', 'expenses', 'spending', 'allocation', 'expense', 'where does my money go', 'breakdown', 'outflow'])) {
      const lines = [
        `📊 <strong>Your Monthly Budget Breakdown:</strong><br>`,
        `🏠 Essentials: <strong>${fmt(p.essentialExpenses)}</strong> (${p.allocEssential || 0}% of income)`,
        `🎯 Discretionary: <strong>${fmt(p.discretionary)}</strong> (${p.allocDiscretionary || 0}%)`,
        `💳 EMI / Debt: <strong>${fmt(p.emiTotal)}</strong> (${p.allocEMI || 0}%)`,
        `🛡️ Insurance: <strong>${fmt(p.insurancePremium)}</strong> (${p.allocInsurance || 0}%)`,
        `📈 Investments (SIP): <strong>${fmt(p.sipMonthly)}</strong> (${p.allocInvestments || 0}%)`,
      ];

      const totalAllocated = (p.totalOutflow || 0) + (p.sipMonthly || 0);
      const unallocated = (p.baseSalary || 0) - totalAllocated;
      if (unallocated > 0) {
        lines.push(`<br>💡 You have <em>${fmt(unallocated)}</em> unallocated. Consider directing it to investments or emergency savings!`);
      }

      lines.push(`<br>📏 <strong>50/30/20 Rule Check:</strong>`);
      const needsPerc = p.baseSalary > 0 ? ((p.essentialExpenses / p.baseSalary) * 100).toFixed(0) : 0;
      const wantsPerc = p.baseSalary > 0 ? ((p.discretionary / p.baseSalary) * 100).toFixed(0) : 0;
      const savingsPerc = p.baseSalary > 0 ? (((p.sipMonthly + p.netSurplus) / p.baseSalary) * 100).toFixed(0) : 0;
      lines.push(`Needs: ${needsPerc}% (ideal ≤50%) | Wants: ${wantsPerc}% (ideal ≤30%) | Savings: ${savingsPerc}% (ideal ≥20%)`);

      return { text: lines.join('<br>'), suggestions: ['How to save more?', 'Investment tips', 'Reduce expenses'] };
    }

    // ── Investment ──
    if (matchAny(q, ['invest', 'investment', 'portfolio', 'sip', 'mutual fund', 'stock', 'etf', 'where to invest', 'investment tips', 'portfolio strategy'])) {
      const lines = [
        `📈 <strong>Investment Overview:</strong><br>`,
        `Total Investments: <strong><em>${fmt(p.totalInvestments)}</em></strong>`,
        `Monthly SIP: <strong>${fmt(p.sipMonthly)}</strong>`,
        `Investment Allocation: <strong>${p.allocInvestments || 0}%</strong> of income`,
      ];

      if (Array.isArray(p.goals) && p.goals.length > 0) {
        lines.push(`<br>🎯 <strong>Your Investment Goals:</strong>`);
        p.goals.forEach(g => {
          const pctDone = g.target > 0 ? ((g.current / g.target) * 100).toFixed(1) : 0;
          lines.push(`• ${g.name}: <em>${fmt(g.current)}</em> / ${fmt(g.target)} (${pctDone}%) — SIP: ${fmt(g.sipCurrent || 0)}/mo`);
        });
      }

      lines.push(`<br>💡 <strong>Personalized Tips:</strong>`);
      if ((p.allocInvestments || 0) < 20) {
        lines.push(`• Your investment allocation is below the recommended 20%. Try increasing SIP by even ${fmt(Math.max(100, (p.baseSalary || 0) * 0.05))}/month.`);
      } else {
        lines.push(`• Great job! You're investing ${p.allocInvestments}% of income. Diversification is key — consider a mix of equity, bonds, and real estate.`);
      }
      if (p.baseSalary > 5000) {
        lines.push(`• Consider tax-advantaged accounts (401k, IRA) to maximize returns.`);
      }

      return { text: lines.join('<br>'), suggestions: ['Goal progress', 'Asset allocation', 'My summary'] };
    }

    // ── Goals ──
    if (matchAny(q, ['goal', 'goals', 'target', 'progress', 'goal progress', 'financial goals'])) {
      if (!Array.isArray(p.goals) || p.goals.length === 0) {
        return {
          text: `You don't have any financial goals set yet! 🎯<br><br>Setting goals is crucial for building wealth. I'd recommend starting with:<br>• <strong>Emergency Fund</strong> (3-6 months expenses)<br>• <strong>Retirement Fund</strong><br>• <strong>Short-term savings</strong> goals<br><br>Head to the Investment & Portfolio page to create your first goal!`,
          suggestions: ['Investment tips', 'Budget advice', 'My summary']
        };
      }

      const lines = [`🎯 <strong>Your Financial Goals Progress:</strong><br>`];
      p.goals.forEach(g => {
        const pctDone = g.target > 0 ? ((g.current / g.target) * 100).toFixed(1) : 0;
        const bar = getProgressBar(pctDone);
        const monthsLeft = (g.sipCurrent || 0) > 0 ? Math.ceil((g.target - g.current) / g.sipCurrent) : '∞';
        lines.push(`<strong>${g.name}</strong> (${g.category || 'General'})`);
        lines.push(`${bar} ${pctDone}%`);
        lines.push(`${fmt(g.current)} / ${fmt(g.target)} — ETA: ~${monthsLeft} months<br>`);
      });

      return { text: lines.join('<br>'), suggestions: ['Investment tips', 'How to reach goals faster?', 'Budget advice'] };
    }

    // ── Debt / EMI ──
    if (matchAny(q, ['debt', 'emi', 'loan', 'mortgage', 'credit', 'pay off debt', 'debt strategy', 'debt free'])) {
      const lines = [];
      if ((p.emiTotal || 0) === 0) {
        lines.push(`🎉 <strong>You're debt-free!</strong> That's an incredible position to be in.<br>`);
        lines.push(`With no EMI obligations, you have more flexibility to invest and grow your wealth. Consider directing those potential EMI payments toward building investments.`);
      } else {
        lines.push(`💳 <strong>Your Debt Snapshot:</strong><br>`);
        lines.push(`Monthly EMI: <strong>${fmt(p.emiTotal)}</strong>`);
        lines.push(`DTI Ratio: <strong><em>${p.dtiRatio || 0}%</em></strong> ${(p.dtiRatio || 0) < 20 ? '✅ Healthy range' : (p.dtiRatio || 0) < 36 ? '⚠️ Moderate' : '🔴 High risk'}<br>`);
        lines.push(`💡 <strong>Debt Management Strategies:</strong>`);
        lines.push(`• <strong>Avalanche Method:</strong> Pay highest-interest debt first to minimize total interest paid.`);
        lines.push(`• <strong>Snowball Method:</strong> Pay smallest balance first for psychological wins.`);
        if ((p.dtiRatio || 0) > 30) {
          lines.push(`<br>⚠️ Your DTI is above 30%. Consider refinancing or increasing income to lower this ratio.`);
        }
      }
      return { text: lines.join('<br>'), suggestions: ['Budget breakdown', 'How to save more?', 'My summary'] };
    }

    // ── Emergency Fund ──
    if (matchAny(q, ['emergency', 'emergency fund', 'rainy day', 'safety net', 'liquid cash', 'savings'])) {
      const funded = p.emergencyFunded || 0;
      const target = p.emergencyTarget || 0;
      const pctFunded = target > 0 ? ((funded / target) * 100).toFixed(1) : 0;
      const lines = [
        `🏦 <strong>Emergency Fund Status:</strong><br>`,
        `Current: <strong><em>${fmt(funded)}</em></strong>`,
        `Target: <strong>${fmt(target)}</strong>`,
        `Progress: <strong>${pctFunded}%</strong> ${getProgressBar(pctFunded)}<br>`,
      ];

      if (funded >= target && target > 0) {
        lines.push(`✅ <strong>Congratulations!</strong> Your emergency fund is fully funded! This covers approximately ${target > 0 && p.essentialExpenses > 0 ? Math.floor(target / p.essentialExpenses) : '?'} months of essential expenses.<br>`);
        lines.push(`💡 Now consider directing surplus savings to higher-yield investments.`);
      } else if (target > 0) {
        const gap = target - funded;
        const monthsToFill = p.netSurplus > 0 ? Math.ceil(gap / p.netSurplus) : '∞';
        lines.push(`⚠️ You need <strong>${fmt(gap)}</strong> more to reach your target.`);
        lines.push(`At your current surplus of ${fmt(p.netSurplus)}/mo, it'll take ~<strong>${monthsToFill} months</strong>.`);
        lines.push(`<br>💡 Keep your emergency fund in a high-yield savings account (4-5% APY) for easy access + growth.`);
      } else {
        lines.push(`📝 You haven't set an emergency fund target yet. Financial experts recommend saving <strong>3-6 months</strong> of essential expenses.`);
        if (p.essentialExpenses > 0) {
          lines.push(`Based on your expenses, aim for <em>${fmt(p.essentialExpenses * 3)}</em> to <em>${fmt(p.essentialExpenses * 6)}</em>.`);
        }
      }
      return { text: lines.join('<br>'), suggestions: ['Budget advice', 'Investment tips', 'My summary'] };
    }

    // ── Net Worth ──
    if (matchAny(q, ['net worth', 'networth', 'wealth', 'total assets', 'how much am i worth'])) {
      const lines = [
        `💎 <strong>Your Net Worth: <em>${fmt(p.netWorth)}</em></strong><br>`,
        `📈 Total Investments: ${fmt(p.totalInvestments)}`,
        `🏦 Liquid Cash: ${fmt(p.liquidCash)}`,
        `📊 Liquid Ratio: ${p.liquidRatio || 0}% of net worth<br>`,
      ];

      if (p.netWorth > 0) {
        const monthlyGrowth = p.sipMonthly || 0;
        if (monthlyGrowth > 0) {
          lines.push(`At your current SIP of ${fmt(monthlyGrowth)}/month:`);
          lines.push(`• In 1 year: ~<em>${fmt(p.netWorth + monthlyGrowth * 12)}</em>`);
          lines.push(`• In 5 years: ~<em>${fmt(p.netWorth + monthlyGrowth * 60)}</em>`);
          lines.push(`<br>💡 These projections don't include compound returns — actual growth could be significantly higher!`);
        }
      }

      return { text: lines.join('<br>'), suggestions: ['Investment tips', 'Goal progress', 'Budget advice'] };
    }

    // ── Saving Tips ──
    if (matchAny(q, ['save more', 'saving tips', 'how to save', 'cut expenses', 'reduce expenses', 'frugal', 'tips'])) {
      const lines = [
        `💰 <strong>Smart Saving Strategies for You:</strong><br>`,
        `<strong>1. Automate Savings</strong> — Set up automatic transfers to savings on payday. "Pay yourself first."<br>`,
        `<strong>2. 48-Hour Rule</strong> — Wait 48 hours before any non-essential purchase over $50.<br>`,
        `<strong>3. Subscription Audit</strong> — Review and cancel unused subscriptions. Average person wastes $200+/month on forgotten subscriptions.<br>`,
        `<strong>4. Meal Planning</strong> — Cooking at home vs. dining out saves $200-400/month on average.<br>`,
        `<strong>5. Cash-Back Optimization</strong> — Use cash-back credit cards strategically (pay full balance monthly).<br>`,
      ];

      if (p.baseSalary > 0 && p.discretionary > 0) {
        const savePotential = p.discretionary * 0.2;
        lines.push(`📊 Based on your discretionary spending of ${fmt(p.discretionary)}, cutting just 20% could save <em>${fmt(savePotential)}/month</em> or <em>${fmt(savePotential * 12)}/year</em>!`);
      }

      return { text: lines.join('<br>'), suggestions: ['Budget breakdown', 'Investment tips', 'My summary'] };
    }

    // ── Improve Score ──
    if (matchAny(q, ['improve score', 'increase score', 'better score', 'how to improve', 'raise my score', 'improve health'])) {
      const tips = [];
      tips.push(`🔧 <strong>How to Improve Your Financial Health Score:</strong><br>`);

      if ((p.dtiRatio || 0) >= 20) {
        tips.push(`• <strong>Lower DTI Ratio</strong> (currently ${p.dtiRatio}%): Pay down debt faster or increase income. Target below 20%.`);
      }
      if ((p.liquidRatio || 0) < 25) {
        tips.push(`• <strong>Boost Liquid Reserves</strong> (currently ${p.liquidRatio}%): Build your emergency fund. Target 25%+ of net worth in liquid assets.`);
      }
      if ((p.netSurplus || 0) <= 0) {
        tips.push(`• <strong>Create Positive Cash Flow</strong>: Cut discretionary spending or increase income so monthly surplus > $0.`);
      }
      if (p.emergencyFunded < p.emergencyTarget && (p.emergencyTarget || 0) > 0) {
        tips.push(`• <strong>Fully Fund Emergency Savings</strong>: You're ${fmt(p.emergencyTarget - p.emergencyFunded)} away from your target.`);
      }
      if ((p.allocInvestments || 0) < 15) {
        tips.push(`• <strong>Increase Investment Rate</strong>: Currently ${p.allocInvestments}% of income. Aim for 15-20%+.`);
      }

      if (tips.length === 1) {
        tips.push(`✅ Your financial fundamentals look solid! To push your score higher, focus on growing investments and maintaining your current discipline.`);
      }

      return { text: tips.join('<br>'), suggestions: ['My summary', 'Budget advice', 'Saving tips'] };
    }

    // ── Reach Goals Faster ──
    if (matchAny(q, ['reach goals faster', 'faster', 'speed up', 'accelerate', 'achieve goals'])) {
      const lines = [
        `🚀 <strong>Strategies to Reach Your Goals Faster:</strong><br>`,
        `<strong>1. Increase SIP Amount</strong> — Even a 10% increase compounds dramatically over time.<br>`,
        `<strong>2. Redirect Windfalls</strong> — Bonuses, tax refunds, and gifts → directly to goal funds.<br>`,
        `<strong>3. Step-Up SIP</strong> — Increase your SIP by 10% every year as income grows.<br>`,
        `<strong>4. Optimize Asset Allocation</strong> — Equity-heavy for long-term goals (5+ years), balanced for medium-term.<br>`,
        `<strong>5. Cut and Redirect</strong> — Identify one expense to eliminate and redirect to investments.`,
      ];

      if (p.sipMonthly > 0) {
        const stepUp = p.sipMonthly * 1.1;
        lines.push(`<br>💡 If you increase your SIP from ${fmt(p.sipMonthly)} to <em>${fmt(stepUp)}</em>/month (just 10% more), you'll accumulate an extra <em>${fmt((stepUp - p.sipMonthly) * 12)}</em>/year!`);
      }

      return { text: lines.join('<br>'), suggestions: ['Goal progress', 'Investment tips', 'My summary'] };
    }

    // ── Asset Allocation ──
    if (matchAny(q, ['asset allocation', 'diversif', 'allocation strategy', 'portfolio mix'])) {
      const lines = [
        `📊 <strong>Asset Allocation Guide:</strong><br>`,
        `Your current portfolio: <strong>${fmt(p.totalInvestments)}</strong><br>`,
      ];

      if (Array.isArray(p.goals) && p.goals.length > 0) {
        const categories = {};
        p.goals.forEach(g => {
          const cat = g.category || 'Other';
          categories[cat] = (categories[cat] || 0) + (g.current || 0);
        });
        lines.push(`<strong>Your Current Mix:</strong>`);
        Object.entries(categories).forEach(([cat, val]) => {
          const pct = p.totalInvestments > 0 ? ((val / p.totalInvestments) * 100).toFixed(1) : 0;
          lines.push(`• ${cat}: ${fmt(val)} (${pct}%)`);
        });
        lines.push('');
      }

      lines.push(`<strong>Recommended by Age:</strong>`);
      const age = p.age || 30;
      const equity = Math.max(30, 100 - age);
      lines.push(`• At age ${age}: ~<em>${equity}% Equity</em>, ~<em>${100 - equity}% Bonds/Fixed</em>`);
      lines.push(`<br>💡 Rule of thumb: <strong>100 minus your age</strong> = % in equities. Adjust based on risk tolerance.`);

      return { text: lines.join('<br>'), suggestions: ['Investment tips', 'Goal progress', 'My summary'] };
    }

    // ── Greetings ──
    if (matchAny(q, ['hi', 'hello', 'hey', 'howdy', 'good morning', 'good evening', 'what can you do', 'help'])) {
      return {
        text: `Hello! 👋 I'm here to help you navigate your finances with confidence.<br><br>You can ask me about:<br>• Your <strong>financial summary</strong> & net worth<br>• <strong>Budget optimization</strong> & spending patterns<br>• <strong>Investment strategies</strong> & goal tracking<br>• <strong>Debt management</strong> tips<br>• <strong>Savings</strong> & emergency fund guidance<br>• <strong>Financial health score</strong> analysis<br><br>What would you like to explore?`,
        suggestions: ['My financial summary', 'Health score', 'Budget breakdown', 'Investment tips']
      };
    }

    // ── Thank You ──
    if (matchAny(q, ['thank', 'thanks', 'awesome', 'great', 'perfect', 'cool'])) {
      const responses = [
        `You're welcome! 😊 I'm always here to help you make smarter financial decisions. Anything else you'd like to know?`,
        `Happy to help! 💪 Remember — consistency is the key to financial success. Ask me anything else!`,
        `Glad I could help! 🌟 Your financial journey is looking great. Any other questions?`,
      ];
      return {
        text: responses[Math.floor(Math.random() * responses.length)],
        suggestions: ['My summary', 'Investment tips', 'Budget advice']
      };
    }

    // ── Tax Tips ──
    if (matchAny(q, ['tax', 'taxes', 'tax saving', 'tax planning', 'deduction', 'tax benefit'])) {
      const lines = [
        `🧾 <strong>Tax Optimization Strategies:</strong><br>`,
        `<strong>1. Maximize Tax-Advantaged Accounts</strong>`,
        `• 401(k): Up to $23,000/year (2024) + employer match`,
        `• IRA/Roth IRA: Up to $7,000/year`,
        `• HSA: $4,150 individual / $8,300 family<br>`,
        `<strong>2. Tax-Loss Harvesting</strong>`,
        `• Offset gains by selling losing investments strategically<br>`,
        `<strong>3. Charitable Deductions</strong>`,
        `• Donating appreciated stock avoids capital gains tax<br>`,
        `<strong>4. Income Timing</strong>`,
        `• Defer bonuses or accelerate deductions to optimize brackets`,
      ];

      if (p.sipMonthly > 0) {
        lines.push(`<br>💡 With your ${fmt(p.sipMonthly)}/month SIP, ensure you're investing through tax-advantaged accounts first!`);
      }

      return { text: lines.join('<br>'), suggestions: ['Investment tips', 'Budget advice', 'My summary'] };
    }

    // ── Retirement ──
    if (matchAny(q, ['retire', 'retirement', 'fire', 'financial independence', 'when can i retire'])) {
      const lines = [
        `🏖️ <strong>Retirement & Financial Independence:</strong><br>`,
      ];

      const annualExpense = (p.totalOutflow || 0) * 12;
      const fireNumber = annualExpense * 25;
      lines.push(`Based on your expenses, your <strong>FIRE number</strong> (25× annual expenses) is: <em>${fmt(fireNumber)}</em><br>`);

      if (p.netWorth > 0 && fireNumber > 0) {
        const progress = ((p.netWorth / fireNumber) * 100).toFixed(1);
        lines.push(`Current Progress: <strong>${progress}%</strong> ${getProgressBar(progress)}<br>`);

        if (p.sipMonthly > 0) {
          const remaining = fireNumber - p.netWorth;
          const monthsToFIRE = remaining > 0 ? Math.ceil(remaining / p.sipMonthly) : 0;
          const yearsToFIRE = (monthsToFIRE / 12).toFixed(1);
          lines.push(`At current savings rate: ~<strong>${yearsToFIRE} years</strong> to FIRE (without accounting for compound returns — actual time could be shorter!)`);
        }
      }

      lines.push(`<br>💡 <strong>The 4% Rule:</strong> You can safely withdraw 4% of your portfolio annually in retirement.`);

      return { text: lines.join('<br>'), suggestions: ['Net worth', 'Investment tips', 'Saving tips'] };
    }

    // ── Insurance ──
    if (matchAny(q, ['insurance', 'life insurance', 'health insurance', 'term plan', 'coverage', 'premium'])) {
      const lines = [
        `🛡️ <strong>Insurance Overview:</strong><br>`,
        `Monthly Premium: <strong>${fmt(p.insurancePremium)}</strong> (${p.allocInsurance || 0}% of income)<br>`,
        `<strong>Key Insurance Checklist:</strong>`,
        `✅ <strong>Health Insurance</strong> — Non-negotiable. Ensure adequate coverage.`,
        `✅ <strong>Term Life Insurance</strong> — 10-15× annual income if you have dependents.`,
        `✅ <strong>Disability Insurance</strong> — Protects 60-70% of income if unable to work.`,
        `✅ <strong>Umbrella Policy</strong> — Extra liability protection if net worth > $500K.`,
      ];

      if (p.baseSalary > 0 && (p.insurancePremium || 0) === 0) {
        lines.push(`<br>⚠️ You don't have any insurance premiums recorded. Insurance is a critical safety net — please ensure you have adequate coverage!`);
      }

      return { text: lines.join('<br>'), suggestions: ['Budget breakdown', 'Emergency fund', 'My summary'] };
    }

    // ── Fallback / General Financial Advice ──
    const fallbackResponses = [
      {
        text: `That's a great question! 🤔 While I specialize in analyzing <em>your personal financial data</em>, here's what I can help you with right now:<br><br>• Ask "<strong>my financial summary</strong>" for a complete snapshot<br>• Ask about your "<strong>health score</strong>" for a diagnostic<br>• Ask for "<strong>investment tips</strong>" for personalized advice<br>• Ask about "<strong>budget breakdown</strong>" to optimize spending<br><br>Try rephrasing your question, or pick a topic from the suggestions below!`,
        suggestions: ['My financial summary', 'Health score', 'Investment tips', 'Budget advice', 'Saving tips']
      }
    ];

    return fallbackResponses[0];
  }

  // ─── Utility Functions ──────────────────────────────────────────────────────

  function matchAny(text, keywords) {
    return keywords.some(k => text.includes(k));
  }

  function getProgressBar(pct) {
    const filled = Math.round(Math.min(100, Math.max(0, pct)) / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
  }

  function getHealthTip(p) {
    if ((p.dtiRatio || 0) >= 30) return 'Focus on reducing debt — your DTI ratio is high. Every dollar paid off improves your score.';
    if ((p.netSurplus || 0) <= 0) return 'Create a positive cash flow by cutting non-essential expenses or boosting income.';
    if (p.emergencyFunded < p.emergencyTarget && (p.emergencyTarget || 0) > 0) return 'Building your emergency fund should be priority #1. Aim for 3-6 months of expenses.';
    if ((p.allocInvestments || 0) < 15) return 'Increase your investment rate to at least 15-20% of income for long-term wealth building.';
    return 'Maintain your current discipline and look for small optimizations in your budget.';
  }

  // ─── Handle User Input ──────────────────────────────────────────────────────

  function handleUserInput(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    inputEl.value = '';
    addMessage(trimmed, 'user');
    suggestionsEl.innerHTML = '';

    showTyping();
    sendBtn.disabled = true;

    // Simulate "thinking" delay for natural feel
    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      hideTyping();
      const response = generateResponse(trimmed);
      addMessage(response.text, 'bot');
      if (response.suggestions) {
        showSuggestions(response.suggestions);
      }
      sendBtn.disabled = false;
    }, delay);
  }

  // ─── Event Listeners ───────────────────────────────────────────────────────

  sendBtn.addEventListener('click', () => handleUserInput(inputEl.value));

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserInput(inputEl.value);
    }
  });

})();
