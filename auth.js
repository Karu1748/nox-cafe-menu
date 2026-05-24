/* ══════════════════════════════════════════════════════════════
   NOX'S CAFE — auth.js  (Firebase version)
   Customer-facing auth for index.html ONLY.
   Admin accounts (role: 'admin') are BLOCKED here.
══════════════════════════════════════════════════════════════ */

import { auth, db }              from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ─── Password validation rules ─── */
const PW_RULES = [
  { id: 'r-len',   label: '8+ characters',    test: pw => pw.length >= 8 },
  { id: 'r-upper', label: 'Uppercase letter',  test: pw => /[A-Z]/.test(pw) },
  { id: 'r-lower', label: 'Lowercase letter',  test: pw => /[a-z]/.test(pw) },
  { id: 'r-num',   label: 'Number',            test: pw => /[0-9]/.test(pw) },
  { id: 'r-spec',  label: 'Special character', test: pw => /[^A-Za-z0-9]/.test(pw) },
];

function scorePassword(pw) { return PW_RULES.filter(r => r.test(pw)).length; }

function validateEmail(email) {
  return /^[a-zA-Z0-9._%+\-]+@gmail\.com$/.test(email.trim());
}

/* ─── Build the auth overlay HTML ─── */
function buildOverlay() {
  const div = document.createElement('div');
  div.id = 'auth-overlay';
  div.innerHTML = `
    <div class="auth-card">
      <div class="auth-brand">
        <div class="auth-logo">☕ NOX'S CAFE</div>
        <div class="auth-tagline">Sign in to start ordering</div>
      </div>
      <div class="auth-tabs">
        <button class="auth-tab active" id="tab-login"  onclick="authSwitchTab('login')">Sign In</button>
        <button class="auth-tab"        id="tab-signup" onclick="authSwitchTab('signup')">Create Account</button>
      </div>
      <div class="auth-error" id="auth-error-msg"></div>

      <!-- LOGIN -->
      <div id="auth-login-form">
        <div class="auth-field">
          <label>Email</label>
          <div class="auth-input-wrap">
            <span class="auth-icon">✉️</span>
            <input type="email" id="li-email" placeholder="yourname@gmail.com" autocomplete="email">
          </div>
        </div>
        <div class="auth-field">
          <label>Password</label>
          <div class="auth-input-wrap">
            <span class="auth-icon">🔒</span>
            <input type="password" id="li-pass" placeholder="Enter your password" autocomplete="current-password">
            <button class="auth-toggle-pw" type="button" onclick="authTogglePw('li-pass', this)">👁</button>
          </div>
        </div>
        <button class="auth-submit" id="li-btn" onclick="authLogin()">Sign In</button>
        <div class="auth-divider">or</div>
        <p style="text-align:center;font-size:0.83rem;color:rgba(255,255,255,0.35)">
          No account yet?
          <button onclick="authSwitchTab('signup')"
            style="background:none;border:none;color:rgba(245,245,240,0.7);font-size:0.83rem;cursor:pointer;font-weight:600;text-decoration:underline;font-family:inherit;">
            Create one →
          </button>
        </p>
      </div>

      <!-- SIGN UP -->
      <div id="auth-signup-form" style="display:none">
        <div class="auth-field">
          <label>Username</label>
          <div class="auth-input-wrap">
            <span class="auth-icon">👤</span>
            <input type="text" id="su-username" placeholder="e.g. juandelacruz" maxlength="30"
              oninput="authValidateUsername(this)">
          </div>
        </div>
        <div class="auth-field">
          <label>Email <span style="color:rgba(255,255,255,0.3);font-weight:400;text-transform:none;letter-spacing:0;font-size:0.7rem">(Gmail only)</span></label>
          <div class="auth-input-wrap">
            <span class="auth-icon">✉️</span>
            <input type="email" id="su-email" placeholder="yourname@gmail.com" autocomplete="email"
              oninput="authValidateEmailField(this)">
          </div>
        </div>
        <div class="auth-field">
          <label>Password</label>
          <div class="auth-input-wrap">
            <span class="auth-icon">🔒</span>
            <input type="password" id="su-pass" placeholder="Create a strong password"
              autocomplete="new-password" oninput="authUpdateStrength(this.value)">
            <button class="auth-toggle-pw" type="button" onclick="authTogglePw('su-pass', this)">👁</button>
          </div>
          <div class="pw-strength-wrap" id="pw-strength-wrap" style="display:none">
            <div class="pw-strength-bar" id="pw-bar">
              <div class="pw-seg" id="ps1"></div><div class="pw-seg" id="ps2"></div>
              <div class="pw-seg" id="ps3"></div><div class="pw-seg" id="ps4"></div>
              <div class="pw-seg" id="ps5"></div>
            </div>
            <div class="pw-rules" id="pw-rules-list"></div>
          </div>
        </div>
        <div class="auth-field">
          <label>Confirm Password</label>
          <div class="auth-input-wrap">
            <span class="auth-icon">🔒</span>
            <input type="password" id="su-pass2" placeholder="Repeat your password"
              autocomplete="new-password" oninput="authCheckConfirm(this)">
            <button class="auth-toggle-pw" type="button" onclick="authTogglePw('su-pass2', this)">👁</button>
          </div>
        </div>
        <button class="auth-submit" id="su-btn" onclick="authSignup()">Create Account</button>
        <div class="auth-divider">or</div>
        <p style="text-align:center;font-size:0.83rem;color:rgba(255,255,255,0.35)">
          Already have an account?
          <button onclick="authSwitchTab('login')"
            style="background:none;border:none;color:rgba(245,245,240,0.7);font-size:0.83rem;cursor:pointer;font-weight:600;text-decoration:underline;font-family:inherit;">
            Sign in →
          </button>
        </p>
      </div>

      <!-- EMAIL VERIFICATION PENDING -->
      <div id="auth-verify-form" style="display:none">
        <div style="text-align:center;padding:1rem 0">
          <div style="font-size:2.5rem;margin-bottom:1rem">📧</div>
          <h3 style="color:#f5f5f0;font-size:1.1rem;margin-bottom:0.5rem">Verify your email</h3>
          <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;line-height:1.6;margin-bottom:1.5rem">
            We sent a verification link to <strong id="verify-email-display" style="color:rgba(255,255,255,0.8)"></strong>.
            Please check your inbox and click the link to activate your account.
          </p>
          <p style="color:rgba(255,255,255,0.3);font-size:0.78rem;margin-bottom:1.5rem">
            After verifying, come back and sign in.
          </p>
          <button class="auth-submit" id="resend-btn" onclick="authResendVerification()" style="margin-bottom:0.75rem">
            Resend Email
          </button>
          <button onclick="authSwitchTab('login')"
            style="display:block;width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);border-radius:10px;padding:0.75rem;font-size:0.9rem;cursor:pointer;font-family:inherit;transition:all 0.2s">
            Back to Sign In
          </button>
        </div>
      </div>

    </div>`;
  return div;
}

/* ─── Build password rules list ─── */
function buildRulesList() {
  const el = document.getElementById('pw-rules-list');
  if (!el) return;
  el.innerHTML = PW_RULES.map(r =>
    `<div class="pw-rule" id="${r.id}"><div class="rule-dot"></div>${r.label}</div>`
  ).join('');
}

/* ─── Strength bar ─── */
window.authUpdateStrength = function (pw) {
  const wrap = document.getElementById('pw-strength-wrap');
  if (!pw) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  const score   = scorePassword(pw);
  const colours = ['s1','s1','s2','s3','s4'];
  ['ps1','ps2','ps3','ps4','ps5'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.className = 'pw-seg';
    if (i < score) el.classList.add(colours[Math.min(score - 1, 4)]);
  });
  PW_RULES.forEach(r => {
    const el = document.getElementById(r.id);
    if (el) el.classList.toggle('met', r.test(pw));
  });
};

window.authCheckConfirm = function (input) {
  const pw = document.getElementById('su-pass').value;
  if (input.value === '') { input.classList.remove('valid','invalid'); return; }
  input.classList.toggle('valid',   input.value === pw);
  input.classList.toggle('invalid', input.value !== pw);
};

window.authValidateEmailField = function (input) {
  if (input.value === '') { input.classList.remove('valid','invalid'); return; }
  const ok = validateEmail(input.value);
  input.classList.toggle('valid',   ok);
  input.classList.toggle('invalid', !ok);
};

window.authValidateUsername = function (input) {
  const val = input.value.trim();
  if (val === '') { input.classList.remove('valid','invalid'); return; }
  const ok = val.length >= 3 && /^[a-zA-Z0-9_]+$/.test(val);
  input.classList.toggle('valid',   ok);
  input.classList.toggle('invalid', !ok);
};

window.authTogglePw = function (inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') { inp.type = 'text';     btn.textContent = '🙈'; }
  else                         { inp.type = 'password'; btn.textContent = '👁'; }
};

/* ─── Error display ─── */
function showAuthError(msg) {
  const el = document.getElementById('auth-error-msg');
  el.textContent = msg;
  el.classList.add('show');
}
function clearAuthError() {
  document.getElementById('auth-error-msg').classList.remove('show');
}

/* ─── Tab switching ─── */
window.authSwitchTab = function (tab) {
  clearAuthError();
  document.getElementById('auth-verify-form').style.display = 'none';
  document.getElementById('auth-login-form').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('auth-signup-form').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active',  tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  if (tab === 'signup') buildRulesList();
};

/* ─── SET BUTTON LOADING STATE ─── */
function setLoading(btnId, loading, defaultText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled     = loading;
  btn.textContent  = loading ? 'Please wait…' : defaultText;
}

/* ─── FIREBASE LOGIN (customers only — blocks admins) ─── */
window.authLogin = async function () {
  clearAuthError();
  const email = document.getElementById('li-email').value.trim();
  const pass  = document.getElementById('li-pass').value;
  if (!email || !pass) { showAuthError('Please fill in all fields.'); return; }
  if (!validateEmail(email)) { showAuthError('Please use a valid @gmail.com address.'); return; }

  setLoading('li-btn', true, 'Sign In');
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);

    // ── BLOCK ADMIN ACCOUNTS from logging in here ──
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (snap.exists() && snap.data().role === 'admin') {
      await signOut(auth);
      setLoading('li-btn', false, 'Sign In');
      showAuthError('Admin accounts must use the Admin Panel to sign in.');
      return;
    }

    // ── BLOCK UNVERIFIED ACCOUNTS ──
    if (!cred.user.emailVerified) {
      // Store for resend
      window._pendingVerifyUser = cred.user;
      await signOut(auth);
      setLoading('li-btn', false, 'Sign In');
      // Show the verify pending screen
      document.getElementById('auth-login-form').style.display  = 'none';
      document.getElementById('auth-signup-form').style.display = 'none';
      document.getElementById('verify-email-display').textContent = email;
      document.getElementById('auth-verify-form').style.display = 'block';
      return;
    }

    // Allowed — onAuthStateChanged handles the UI
  } catch (err) {
    setLoading('li-btn', false, 'Sign In');
    const msgs = {
      'auth/user-not-found':     'No account found with this email.',
      'auth/wrong-password':     'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/too-many-requests':  'Too many failed attempts. Try again later.',
    };
    showAuthError(msgs[err.code] || 'Login failed. Please try again.');
  }
};

/* ─── FIREBASE SIGN UP ─── */
window.authSignup = async function () {
  clearAuthError();
  const username = document.getElementById('su-username').value.trim();
  const email    = document.getElementById('su-email').value.trim().toLowerCase();
  const pass     = document.getElementById('su-pass').value;
  const pass2    = document.getElementById('su-pass2').value;

  if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    showAuthError('Username must be 3+ characters (letters, numbers, _ only).'); return;
  }
  if (!validateEmail(email)) {
    showAuthError('Please enter a valid @gmail.com email address.'); return;
  }
  if (scorePassword(pass) < 5) {
    const failed = PW_RULES.filter(r => !r.test(pass)).map(r => r.label);
    showAuthError('Password must include: ' + failed.join(', ') + '.'); return;
  }
  if (pass !== pass2) { showAuthError('Passwords do not match.'); return; }

  setLoading('su-btn', true, 'Create Account');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: username });
    await setDoc(doc(db, 'users', cred.user.uid), {
      username,
      email,
      createdAt: serverTimestamp(),
      role: 'customer',   // always 'customer' — never 'admin'
    });

    // Send verification email
    await sendEmailVerification(cred.user);

    // Sign them out until they verify
    window._pendingVerifyUser = cred.user;
    await signOut(auth);
    setLoading('su-btn', false, 'Create Account');

    // Show verify pending screen
    document.getElementById('auth-signup-form').style.display = 'none';
    document.getElementById('verify-email-display').textContent = email;
    document.getElementById('auth-verify-form').style.display  = 'block';
  } catch (err) {
    setLoading('su-btn', false, 'Create Account');
    const msgs = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password':        'Password is too weak.',
      'auth/invalid-email':        'Invalid email address.',
    };
    showAuthError(msgs[err.code] || 'Sign up failed. Please try again.');
  }
};

/* ─── RESEND VERIFICATION ─── */
window.authResendVerification = async function () {
  const btn = document.getElementById('resend-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  try {
    if (window._pendingVerifyUser) {
      await sendEmailVerification(window._pendingVerifyUser);
      showAuthToast('Verification email resent! Check your inbox. ✉️');
    } else {
      showAuthToast('Please sign in again to resend.');
    }
  } catch (err) {
    showAuthToast('Failed to resend: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Resend Email'; }
  }
};

/* ─── LOGOUT ─── */
window.authLogout = async function () {
  await signOut(auth);
  showAuthToast('You have been signed out.');
};

/* ─── Toggle dropdown ─── */
window.toggleAuthDropdown = function () {
  document.getElementById('auth-dropdown')?.classList.toggle('open');
};
document.addEventListener('click', e => {
  const wrap = document.getElementById('nav-user-wrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('auth-dropdown')?.classList.remove('open');
  }
});

/* ─── UI helpers ─── */
function hideOverlay() {
  document.getElementById('auth-overlay')?.classList.add('hidden');
}
function showOverlay() {
  const ov = document.getElementById('auth-overlay');
  if (ov) {
    ov.classList.remove('hidden');
    ['li-email','li-pass','su-username','su-email','su-pass','su-pass2']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('auth-verify-form').style.display = 'none';
    authSwitchTab('login');
  }
}

/* ─── Inject account button into the Bootstrap navbar ─── */
function injectNavUserBtn(username) {
  // Remove any existing badge
  document.getElementById('nav-user-wrap')?.remove();

  const initials = username.slice(0, 2).toUpperCase();

  const wrap      = document.createElement('div');
  wrap.id         = 'nav-user-wrap';
  wrap.className  = 'nav-user-wrap';
  wrap.style.cssText = 'position:relative;display:inline-flex;align-items:center;';

  wrap.innerHTML = `
    <div class="auth-user-badge visible" id="user-badge" onclick="toggleAuthDropdown()">
      <div class="badge-avatar">${initials}</div>
      <span style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${username}</span>
    </div>
    <div class="auth-dropdown" id="auth-dropdown">
      <button onclick="toggleAuthDropdown()">👤 ${username}</button>
      <button onclick="toggleAuthDropdown();if(typeof openMyOrders==='function')openMyOrders()">📋 My Orders</button>
      <button onclick="toggleAuthDropdown();if(typeof openMyReservations==='function')openMyReservations()">🎱 My Reservations</button>
      <button class="logout-item" onclick="authLogout()">🚪 Sign Out</button>
    </div>`;

  // Try multiple selectors to find the right spot in the Bootstrap navbar
  const targets = [
    document.querySelector('.home-header .nav-btns'),
    document.querySelector('.home-header'),
    document.querySelector('.navbar-nav'),
    document.querySelector('nav'),
  ];

  const target = targets.find(t => t !== null);
  if (target) {
    // Insert at the end of the nav area
    target.appendChild(wrap);
  } else {
    // Last resort — append to body and position fixed
    wrap.style.cssText += 'position:fixed;top:14px;right:20px;z-index:200;';
    document.body.appendChild(wrap);
  }
}

function showAuthToast(msg) {
  let toast = document.getElementById('auth-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'auth-toast'; toast.className = 'auth-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ─── Auth state listener ─── */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Fetch username from Firestore
    let username = user.displayName || user.email.split('@')[0];
    let role     = 'customer';
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        username = snap.data().username || username;
        role     = snap.data().role || 'customer';
      }
    } catch {}

    // If admin somehow logged in here, sign them out
    if (role === 'admin') {
      await signOut(auth);
      showOverlay();
      return;
    }

    hideOverlay();
    injectNavUserBtn(username);
    showAuthToast(`Welcome back, ${username}! ☕`);

    setLoading('li-btn', false, 'Sign In');
    setLoading('su-btn', false, 'Create Account');
  } else {
    // Remove user badge if present
    document.getElementById('nav-user-wrap')?.remove();
    showOverlay();
  }
});

/* ─── Init ─── */
function init() {
  document.body.insertBefore(buildOverlay(), document.body.firstChild);
  document.getElementById('li-pass')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') window.authLogin();
  });
  document.getElementById('li-email')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') window.authLogin();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}