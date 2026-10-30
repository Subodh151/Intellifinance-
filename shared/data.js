(function (global) {
'use strict';

const STORAGE_KEY     = 'IF_PROFILE';
const SESSION_KEY     = 'IF_SESSION';
const USERS_KEY       = 'IF_USERS';

function computeInitials(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

// ─── Pristine Zero-State Baseline for New Users ─────────────────────────────
const DEFAULT_PROFILE = {
  fullName:          '',
  displayName:       '',
  initials:          '',
  dob:               '',
  age:               0,
  email:             '',
  phone:             '',
  location:          '',
  currency:          'USD',
  baseSalary:        0,
  essentialExpenses: 0,
  discretionary:     0,
  emiTotal:          0,
  insurancePremium:  0,
  sipMonthly:        0,
  emergencyTarget:   0,
  emergencyFunded:   0,
  totalInflow:       0,
  totalOutflow:      0,
  netSurplus:        0,
  netWorth:          0,
  totalInvestments:  0,
  baseInvestments:   0,
  liquidCash:        0,
  altAssets:         0,
  dtiRatio:          0,
  expenseRatio:      0,
  liquidRatio:       0,
  healthScore:       0,
  allocInvestments:   0,
  allocEssential:     0,
  allocDiscretionary: 0,
  allocEMI:           0,
  allocEmergency:     0,
  allocInsurance:     0,
  goals:              [],
  isNewUser:          true,
  accountCreatedAt:   null,
  lastUpdated:        null,
  lastProgressRun:    null,
  simulatedMonths:    0,
};

// ─── Demo Executive Portfolio (for testing populated state) ──────────────────
const DEMO_EXECUTIVE_PROFILE = {
  fullName:          'Subodh Sahu',
  displayName:       'Subodh Sahu',
  initials:          'SS',
  dob:               '1992-06-15',
  age:               34,
  email:             'subodh@intellifinance.io',
  phone:             '+1 (555) 349-8201',
  location:          'San Francisco, CA',
  currency:          'USD',
  baseSalary:        10000,
  essentialExpenses: 5000,
  discretionary:     1400,
  emiTotal:          1550,
  insurancePremium:  920,
  sipMonthly:        2100,
  emergencyTarget:   25000,
  emergencyFunded:   25000,
  totalInflow:       10000,
  totalOutflow:      6400,
  netSurplus:        3600,
  netWorth:          501740,
  totalInvestments:  476740,
  baseInvestments:   476740,
  liquidCash:        25000,
  altAssets:         0,
  dtiRatio:          15.5,
  expenseRatio:      64.0,
  liquidRatio:       5.0,
  healthScore:       80,
  allocInvestments:   21.0,
  allocEssential:     50.0,
  allocDiscretionary: 14.0,
  allocEMI:           15.5,
  allocEmergency:     100.0,
  allocInsurance:     9.2,
  goals: [
    { id: 'g1', name: 'Tech ETF & Index Wealth', target: 500000, current: 320000, sipCurrent: 1200, category: 'Equity' },
    { id: 'g2', name: 'Real Estate Syndicate Fund', target: 200000, current: 110000, sipCurrent: 600, category: 'Real Estate' },
    { id: 'g3', name: 'Global Sovereign Bonds', target: 60000, current: 46740, sipCurrent: 300, category: 'Bonds' }
  ],
  isNewUser:          false,
  accountCreatedAt:   new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  lastUpdated:        new Date().toISOString(),
  lastProgressRun:    new Date().toISOString(),
  simulatedMonths:    12,
};

// ─── Raw Storage Helpers ───────────────────────────────────────────────────
function getRawStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      const fromLocal = localStorage.getItem(STORAGE_KEY);
      if (fromLocal && fromLocal.trim().startsWith('{')) return fromLocal;
    }
  } catch (e) {}
  try {
    if (typeof window !== 'undefined' && window.name && window.name.startsWith('__IF_DATA__:')) {
      return window.name.slice(12);
    }
  } catch (e) {}
  try {
    if (typeof window !== 'undefined' && window.__IF_CACHE__) {
      return JSON.stringify(window.__IF_CACHE__);
    }
  } catch (e) {}
  try {
    if (typeof global !== 'undefined' && global.__IF_CACHE__) {
      return JSON.stringify(global.__IF_CACHE__);
    }
  } catch (e) {}
  return null;
}

function setRawStorage(jsonStr) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, jsonStr);
  } catch (e) {}
  try {
    if (typeof window !== 'undefined') {
      window.name = '__IF_DATA__:' + jsonStr;
      window.__IF_CACHE__ = JSON.parse(jsonStr);
    }
  } catch (e) {}
  try {
    if (typeof global !== 'undefined') {
      global.__IF_CACHE__ = JSON.parse(jsonStr);
    }
  } catch (e) {}
}

// ─── Authentication & User Accounts ─────────────────────────────────────────

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setStoredUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {}
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setSession(sessionData) {
  try {
    if (sessionData) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (e) {}
}

function isAuthenticated() {
  const session = getSession();
  return !!(session && session.userId);
}

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return session;
}

/**
 * Register a new user:
 * - Initializes every single financial parameter to ZERO ($0.00)
 * - Sets Net Worth = $0.00
 * - Marks isNewUser = true
 * - Starts active session
 */
function registerUser(userData) {
  const users = getStoredUsers();
  const email = (userData.email || '').trim().toLowerCase();
  const fullName = (userData.fullName || '').trim() || 'New User';
  const password = userData.password || 'password123';
  const currency = userData.currency || 'USD';

  const existingIdx = users.findIndex(u => u.email === email);
  const userId = existingIdx >= 0 ? users[existingIdx].id : 'user_' + Date.now();

  const userRecord = {
    id: userId,
    email: email,
    fullName: fullName,
    displayName: fullName,
    password: password,
    currency: currency,
    createdAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    users[existingIdx] = userRecord;
  } else {
    users.push(userRecord);
  }
  setStoredUsers(users);

  // Set active session
  setSession({
    userId: userId,
    email: email,
    fullName: fullName,
    displayName: fullName,
    currency: currency,
    loginAt: new Date().toISOString()
  });

  // Create clean ZERO baseline profile
  const zeroProfile = Object.assign({}, DEFAULT_PROFILE, {
    userId: userId,
    fullName: fullName,
    displayName: fullName,
    initials: computeInitials(fullName),
    email: email,
    currency: currency,
    baseSalary: 0,
    essentialExpenses: 0,
    discretionary: 0,
    emiTotal: 0,
    insurancePremium: 0,
    sipMonthly: 0,
    emergencyTarget: 0,
    emergencyFunded: 0,
    totalInflow: 0,
    totalOutflow: 0,
    netSurplus: 0,
    netWorth: 0,
    totalInvestments: 0,
    baseInvestments: 0,
    liquidCash: 0,
    altAssets: 0,
    dtiRatio: 0,
    expenseRatio: 0,
    liquidRatio: 0,
    healthScore: 0,
    goals: [],
    isNewUser: true,
    accountCreatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    lastProgressRun: new Date().toISOString(),
    simulatedMonths: 0
  });

  setRawStorage(JSON.stringify(zeroProfile));

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('IF_PROFILE_UPDATED', { detail: zeroProfile }));
      window.dispatchEvent(new CustomEvent('IF_AUTH_CHANGED', { detail: zeroProfile }));
    }
  } catch (e) {}

  return { success: true, profile: zeroProfile };
}

/**
 * Log in an existing user or authenticate.
 */
function loginUser(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const users = getStoredUsers();
  const user = users.find(u => u.email === cleanEmail);

  if (user && user.password && user.password !== password) {
    return { success: false, message: 'Invalid password. Please try again.' };
  }

  const name = user ? user.fullName : (cleanEmail.split('@')[0] || 'User');
  const userId = user ? user.id : 'user_' + Date.now();

  setSession({
    userId: userId,
    email: cleanEmail,
    fullName: name,
    displayName: name,
    currency: user ? user.currency : 'USD',
    loginAt: new Date().toISOString()
  });

  // If there is already a saved profile, verify it matches
  let profile = loadProfile();
  if (!profile || !profile.fullName || profile.email !== cleanEmail) {
    profile = Object.assign({}, DEFAULT_PROFILE, {
      userId: userId,
      fullName: name,
      displayName: name,
      initials: computeInitials(name),
      email: cleanEmail,
      accountCreatedAt: new Date().toISOString(),
      isNewUser: true
    });
    setRawStorage(JSON.stringify(profile));
  }

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('IF_AUTH_CHANGED', { detail: profile }));
    }
  } catch (e) {}

  return { success: true, profile: profile };
}

/**
 * One-click demo login for the Executive portfolio (Subodh Sahu).
 */
function loginDemoUser() {
  const demoUser = {
    id: 'demo_executive_subodh',
    email: 'subodh@intellifinance.io',
    fullName: 'Subodh Sahu',
    displayName: 'Subodh Sahu',
    currency: 'USD',
    loginAt: new Date().toISOString()
  };
  setSession(demoUser);

  const demoProfile = Object.assign({}, DEMO_EXECUTIVE_PROFILE);
  setRawStorage(JSON.stringify(demoProfile));

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('IF_PROFILE_UPDATED', { detail: demoProfile }));
      window.dispatchEvent(new CustomEvent('IF_AUTH_CHANGED', { detail: demoProfile }));
    }
  } catch (e) {}

  return { success: true, profile: demoProfile };
}

/**
 * Log out active user and redirect to login page.
 */
function logout(loginUrl) {
  setSession(null);
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('IF_AUTH_CHANGED', { detail: null }));
      const target = loginUrl || '/login.html';
      window.location.href = target;
    }
  } catch (e) {}
}

/**
 * Guards protected pages. If user is unauthenticated, redirects to loginUrl.
 */
function requireAuth(loginUrl) {
  if (!isAuthenticated()) {
    const target = loginUrl || '/login.html';
    if (typeof window !== 'undefined') {
      window.location.href = target;
    }
    return false;
  }
  return true;
}

// ─── Elapsed Time Calculation ──────────────────────────────────────────────
function getElapsedMonths(profile) {
  if (!profile || !profile.accountCreatedAt) return 0;
  const created = new Date(profile.accountCreatedAt);
  const now = new Date();
  let calMonths = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
  if (calMonths < 0) calMonths = 0;
  return calMonths + (Number(profile.simulatedMonths) || 0);
}

function accountAge(profile) {
  if (!profile || !profile.accountCreatedAt) return null;
  const elapsed = getElapsedMonths(profile);
  if (elapsed === 0) {
    const created = new Date(profile.accountCreatedAt);
    const now = new Date();
    const diffDays = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
    return diffDays === 0 ? 'Day 1 (New Account)' : `${diffDays} day${diffDays > 1 ? 's' : ''} active`;
  }
  if (elapsed < 12) {
    return `${elapsed} month${elapsed > 1 ? 's' : ''} active`;
  }
  const yrs = Math.floor(elapsed / 12);
  const rem = elapsed % 12;
  return `${yrs} yr${yrs > 1 ? 's' : ''}` + (rem > 0 ? `, ${rem} mo` : '') + ' active';
}

// ─── Monthly Progress & Dynamic Net Worth Engine ───────────────────────────
/**
 * Automatically applies monthly SIP allocations when real calendar months pass.
 */
function applyMonthlyProgress(profile) {
  if (!profile.accountCreatedAt) return profile;
  if (!Array.isArray(profile.goals) && Number(profile.sipMonthly || 0) === 0) return profile;

  const now     = new Date();
  const refDate = new Date(profile.lastProgressRun || profile.accountCreatedAt);

  const monthsElapsed =
    (now.getFullYear() - refDate.getFullYear()) * 12 +
    (now.getMonth()    - refDate.getMonth());

  if (monthsElapsed < 1) return profile; // no full month passed

  profile = JSON.parse(JSON.stringify(profile));

  if (Array.isArray(profile.goals)) {
    profile.goals = profile.goals.map(function(goal) {
      const monthlySIP = Number(goal.sipCurrent) || Number(goal.sipRequired) || 0;
      if (monthlySIP > 0) {
        const added = monthlySIP * monthsElapsed;
        goal.current = Math.min(Number(goal.target) || 0, Number(goal.current || 0) + added);
      }
      return goal;
    });
  }

  const globalSIP = Number(profile.sipMonthly) || 0;
  if (globalSIP > 0) {
    profile.totalInvestments = Number(profile.totalInvestments || 0) + globalSIP * monthsElapsed;
    profile.netWorth = +(Number(profile.liquidCash || 0) + Number(profile.totalInvestments || 0)).toFixed(2);
  }

  profile.lastProgressRun = now.toISOString();
  return profile;
}

// ─── Core Data Store API ───────────────────────────────────────────────────

function loadProfile() {
  try {
    const raw = getRawStorage();
    if (raw) {
      const parsed = JSON.parse(raw);
      let profile = Object.assign({}, DEFAULT_PROFILE, parsed);
      profile = applyMonthlyProgress(profile);
      if (profile.lastProgressRun !== parsed.lastProgressRun) {
        setRawStorage(JSON.stringify(profile));
      }
      return profile;
    }
  } catch (e) {
    console.warn('[IntelliFinance] Could not parse stored profile:', e);
  }
  return Object.assign({}, DEFAULT_PROFILE);
}

function saveProfile(partial) {
  const current = loadProfile();
  const merged  = Object.assign({}, current, partial);

  const num = function(v, fallback) {
    if (fallback === undefined) fallback = 0;
    const n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  };

  merged.baseSalary        = num(merged.baseSalary,        0);
  merged.essentialExpenses = num(merged.essentialExpenses, 0);
  merged.discretionary     = num(merged.discretionary,     0);
  merged.emiTotal          = num(merged.emiTotal,          0);
  merged.insurancePremium  = num(merged.insurancePremium,  0);
  merged.sipMonthly        = num(merged.sipMonthly,        0);
  merged.emergencyTarget   = num(merged.emergencyTarget,   0);
  merged.emergencyFunded   = num(merged.emergencyFunded,   0);

  // Derived financials
  merged.totalInflow  = +merged.baseSalary.toFixed(2);
  merged.totalOutflow = +(merged.essentialExpenses + merged.discretionary + merged.emiTotal + merged.insurancePremium).toFixed(2);
  merged.netSurplus   = +(merged.totalInflow - merged.totalOutflow).toFixed(2);

  merged.liquidCash       = +merged.emergencyFunded.toFixed(2);
  merged.altAssets        = 0;
  const goalsInvested     = Array.isArray(merged.goals) ? merged.goals.reduce((sum, g) => sum + (Number(g.current) || 0), 0) : 0;
  merged.totalInvestments = Math.max(num(merged.totalInvestments, 0), goalsInvested);
  if (merged.baseInvestments == null) {
    merged.baseInvestments = merged.totalInvestments;
  }

  // Dynamic Net Worth calculation: Liquid cash + total accumulated investments
  merged.netWorth = +(merged.liquidCash + merged.totalInvestments).toFixed(2);

  if (merged.totalInflow > 0) {
    merged.dtiRatio           = +((merged.emiTotal          / merged.totalInflow) * 100).toFixed(1);
    merged.expenseRatio       = +((merged.totalOutflow       / merged.totalInflow) * 100).toFixed(1);
    merged.allocInvestments   = +((merged.sipMonthly        / merged.totalInflow) * 100).toFixed(1);
    merged.allocEssential     = +((merged.essentialExpenses  / merged.totalInflow) * 100).toFixed(1);
    merged.allocDiscretionary = +((merged.discretionary      / merged.totalInflow) * 100).toFixed(1);
    merged.allocEMI           = +((merged.emiTotal           / merged.totalInflow) * 100).toFixed(1);
    merged.allocEmergency     = +((merged.emergencyFunded / 12) / merged.totalInflow * 100).toFixed(1);
    merged.allocInsurance     = +((merged.insurancePremium   / merged.totalInflow) * 100).toFixed(1);
  } else {
    merged.dtiRatio = 0;
    merged.expenseRatio = 0;
    merged.allocInvestments = 0;
    merged.allocEssential = 0;
    merged.allocDiscretionary = 0;
    merged.allocEMI = 0;
    merged.allocEmergency = 0;
    merged.allocInsurance = 0;
  }

  if (merged.netWorth > 0) {
    merged.liquidRatio = +((merged.liquidCash / merged.netWorth) * 100).toFixed(1);
  } else {
    merged.liquidRatio = 0;
  }

  // Initials
  const nameToUse = ((merged.displayName || merged.fullName) || '').trim();
  merged.initials = computeInitials(nameToUse);

  // Health score calculation
  if (merged.isNewUser && merged.totalInflow === 0) {
    merged.healthScore = 0;
  } else {
    let score = 50;
    if (merged.dtiRatio < 20)  score += 10;
    if (merged.dtiRatio < 10)  score += 10;
    if (merged.liquidRatio > 25) score += 10;
    if (merged.netSurplus > 0)   score += 10;
    if (merged.emergencyFunded >= merged.emergencyTarget && merged.emergencyTarget > 0) score += 10;
    merged.healthScore = Math.min(100, Math.max(0, score));
  }

  // Goals baseline
  if (Array.isArray(merged.goals)) {
    merged.goals = merged.goals.map(g => {
      if (g.startingAmount == null) g.startingAmount = Number(g.current) || 0;
      if (g.sipCurrent == null && g.sipRequired != null) g.sipCurrent = g.sipRequired;
      return g;
    });
  }

  // If user actually filled numbers, mark isNewUser = false
  if (merged.totalInflow > 0 || merged.totalInvestments > 0 || merged.liquidCash > 0) {
    merged.isNewUser = false;
  }

  if (!merged.accountCreatedAt) {
    merged.accountCreatedAt = new Date().toISOString();
    merged.lastProgressRun  = merged.accountCreatedAt;
    merged.simulatedMonths  = 0;
  }
  merged.lastUpdated = new Date().toISOString();

  const jsonStr = JSON.stringify(merged);
  setRawStorage(jsonStr);
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('IF_PROFILE_UPDATED', { detail: merged }));
    }
  } catch (e) {}
  return merged;
}

/**
 * Fast-forward time by `count` months.
 * Automatically adds monthly SIP to totalInvestments and updates Net Worth!
 */
function advanceMonths(count) {
  count = Number(count) || 1;
  const p = loadProfile();
  if (!p.accountCreatedAt) {
    p.accountCreatedAt = new Date().toISOString();
    p.isNewUser = false;
  }
  p.simulatedMonths = (Number(p.simulatedMonths) || 0) + count;

  let totalSIPApplied = 0;

  if (Array.isArray(p.goals) && p.goals.length > 0) {
    p.goals = p.goals.map(function(goal) {
      const monthlySIP = Number(goal.sipCurrent) || Number(goal.sipRequired) || 0;
      if (monthlySIP > 0) {
        const added = monthlySIP * count;
        goal.current = Math.min(Number(goal.target) || 0, Number(goal.current || 0) + added);
        totalSIPApplied += added;
      }
      return goal;
    });
  }

  const globalSIP = Number(p.sipMonthly) || 0;
  if (globalSIP > 0) {
    p.totalInvestments = Number(p.totalInvestments || 0) + (globalSIP * count);
  } else if (totalSIPApplied > 0) {
    p.totalInvestments = Number(p.totalInvestments || 0) + totalSIPApplied;
  }

  // Update dynamic Net Worth: Liquid Cash + Total Investments
  p.netWorth = +(Number(p.liquidCash || 0) + Number(p.totalInvestments || 0)).toFixed(2);
  p.lastProgressRun = new Date().toISOString();
  p.isNewUser = false;

  const updated = saveProfile(p);
  if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
    const elapsed = getElapsedMonths(updated);
    const addedSum = globalSIP > 0 ? (globalSIP * count) : totalSIPApplied;
    window.showToast(`Advanced +${count} mo (Month ${elapsed})! New Net Worth: $${updated.netWorth.toLocaleString()} (+$${addedSum.toLocaleString()} SIP)`);
  }
  return updated;
}

/**
 * Resets time simulation back to initial creation state.
 */
function resetSimulation() {
  const p = loadProfile();
  p.simulatedMonths = 0;
  if (Array.isArray(p.goals)) {
    p.goals = p.goals.map(function(goal) {
      goal.current = Number(goal.startingAmount || 0);
      return goal;
    });
  }
  p.totalInvestments = Number(p.baseInvestments || 0);
  p.netWorth = +(Number(p.liquidCash || 0) + Number(p.totalInvestments || 0)).toFixed(2);
  const updated = saveProfile(p);
  if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
    window.showToast('Timeline reset to Month 0');
  }
  return updated;
}

/** Reset to empty new-user state ($0 across all parameters) */
function resetProfile() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
  try {
    if (typeof window !== 'undefined') {
      window.name = '';
      window.__IF_CACHE__ = null;
      window.dispatchEvent(new CustomEvent('IF_PROFILE_UPDATED', { detail: Object.assign({}, DEFAULT_PROFILE) }));
    }
  } catch (e) {}
  try {
    if (typeof global !== 'undefined') {
      global.__IF_CACHE__ = null;
    }
  } catch (e) {}
  return Object.assign({}, DEFAULT_PROFILE);
}

// ─── Formatting Utilities ──────────────────────────────────────────────────

function fmtCurrency(val, decimals) {
  if (decimals === undefined) decimals = 2;
  if (val == null || isNaN(val)) return '$0.00';
  return '$' + Number(val).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtINR(usdVal) {
  if (usdVal == null || isNaN(usdVal)) return '\u20b90';
  const inr = Math.round(Number(usdVal) * 84);
  return '\u20b9' + inr.toLocaleString('en-IN');
}

function fmtCompact(val) {
  if (val == null || isNaN(val)) return '$0';
  if (Math.abs(val) >= 1000000) return '$' + (val / 1000000).toFixed(2) + 'M';
  if (Math.abs(val) >= 1000)    return '$' + (val / 1000).toFixed(1)    + 'k';
  return '$' + Number(val).toFixed(0);
}

function pct(current, target) {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.max(0, (current / target) * 100)).toFixed(1);
}

// ─── Export Global API ─────────────────────────────────────────────────────

global.IntelliFinance = {
  loadProfile, saveProfile, resetProfile,
  advanceMonths, resetSimulation, getElapsedMonths, accountAge,
  fmtCurrency, fmtINR, fmtCompact, pct,
  DEFAULT_PROFILE, DEMO_EXECUTIVE_PROFILE,
  // Auth & Session
  isAuthenticated, getCurrentUser, registerUser, loginUser, loginDemoUser, logout, requireAuth
};

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
