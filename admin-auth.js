/* ══════════════════════════════════════════════════════════════
   NOX CAFE ADMIN — admin-auth.js  (Firebase version)
   Admin login is SEPARATE from customer login:
   - Validates both username AND password against Firestore
   - Only accounts with role:'admin' in Firestore can access
   - Customer accounts are blocked here
══════════════════════════════════════════════════════════════ */

import { auth, db }              from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, getDoc, getDocs, collection, query, where, updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ──────────────────────────────────────────────────────────────
   Admin login validates:
   1. Username entered → looked up in Firestore users collection
   2. Must have role: 'admin'
   3. Firebase Auth password must match
   This means wrong username = wrong email = Firebase auth fail.
────────────────────────────────────────────────────────────── */

/* ─── Password validation rules ─── */
const PW_RULES = [
  { id: 'apr-len',   label: '8+ characters',    test: pw => pw.length >= 8 },
  { id: 'apr-upper', label: 'Uppercase letter',  test: pw => /[A-Z]/.test(pw) },
  { id: 'apr-lower', label: 'Lowercase letter',  test: pw => /[a-z]/.test(pw) },
  { id: 'apr-num',   label: 'Number',            test: pw => /[0-9]/.test(pw) },
  { id: 'apr-spec',  label: 'Special character', test: pw => /[^A-Za-z0-9]/.test(pw) },
];
function scorePassword(pw) { return PW_RULES.filter(r => r.test(pw)).length; }

/* ── Show login error ── */
function showLoginError(msg) {
  const el = document.getElementById('login-error');
  if (el) { el.textContent = msg; el.classList.add('show'); }
}
function clearLoginError() {
  document.getElementById('login-error')?.classList.remove('show');
}

/* ── Look up admin email by username in Firestore ── */
async function getAdminEmailByUsername(username) {
  try {
    const q    = query(
      collection(db, 'users'),
      where('username', '==', username),
      where('role',     '==', 'admin')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data().email || null;
  } catch (err) {
    console.error('Username lookup failed:', err);
    return null;
  }
}

/* ── FIREBASE ADMIN LOGIN ── */
window.doLogin = async function () {
  clearLoginError();
  const usernameOrEmail = document.getElementById('login-user').value.trim();
  const password        = document.getElementById('login-pass').value;
  const btn             = document.querySelector('.login-btn');

  if (!usernameOrEmail || !password) {
    showLoginError('Please enter both username and password.');
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

  try {
    let emailToUse = usernameOrEmail;

    // If they typed a username (not an email), look up the email in Firestore
    if (!usernameOrEmail.includes('@')) {
      const resolvedEmail = await getAdminEmailByUsername(usernameOrEmail);
      if (!resolvedEmail) {
        showLoginError('Username not found or not an admin account.');
        if (btn) { btn.disabled = false; btn.textContent = 'Sign In to Admin Panel'; }
        return;
      }
      emailToUse = resolvedEmail;
    }

    // Sign in with Firebase Auth
    const cred = await signInWithEmailAndPassword(auth, emailToUse, password);

    // Double-check role in Firestore — customer accounts are blocked
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists() || snap.data().role !== 'admin') {
      await signOut(auth);
      showLoginError('Access denied. This account does not have admin privileges.');
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In to Admin Panel'; }
      return;
    }

    // Success — onAuthStateChanged handles UI
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = 'Sign In to Admin Panel'; }
    const msgs = {
      'auth/user-not-found':     'No admin account found with this username.',
      'auth/wrong-password':     'Incorrect password.',
      'auth/invalid-credential': 'Incorrect username or password.',
      'auth/too-many-requests':  'Too many attempts. Try again later.',
    };
    showLoginError(msgs[err.code] || 'Login failed: ' + err.message);
  }
};

/* ── ADMIN LOGOUT ── */
window.doLogout = async function () {
  await signOut(auth);
};

/* ── Auth state listener ── */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Verify role in Firestore
    let isAdmin = false;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      isAdmin = snap.exists() && snap.data().role === 'admin';
    } catch {}

    if (!isAdmin) {
      // Customer accidentally ended up here — sign them out
      await signOut(auth);
      return;
    }

    // Show admin panel
    document.getElementById('login-screen')?.classList.add('hidden');
    document.getElementById('admin-app')?.classList.add('visible');
    const btn = document.querySelector('.login-btn');
    if (btn) { btn.disabled = false; btn.textContent = 'Sign In to Admin Panel'; }

    if (typeof window.initAdmin === 'function') window.initAdmin();
  } else {
    // Not signed in — show login screen
    document.getElementById('admin-app')?.classList.remove('visible');
    document.getElementById('login-screen')?.classList.remove('hidden');
    const userEl  = document.getElementById('login-user');
    const passEl  = document.getElementById('login-pass');
    if (userEl) userEl.value = '';
    if (passEl) passEl.value = '';
    clearLoginError();
  }
});

/* ──────────────────────────────────────────────────────────────
   LOGIN FORM ENHANCEMENTS (pw toggle + strength)
────────────────────────────────────────────────────────────── */
function patchLoginForm() {
  const note = document.querySelector('.cred-note');
  if (note) note.style.display = 'none';

  const passInput = document.getElementById('login-pass');
  if (!passInput) return;

  passInput.parentElement.style.position = 'relative';

  const toggleBtn       = document.createElement('button');
  toggleBtn.type        = 'button';
  toggleBtn.className   = 'pw-toggle-btn';
  toggleBtn.textContent = '👁';
  toggleBtn.title       = 'Show / hide password';
  toggleBtn.addEventListener('click', () => {
    if (passInput.type === 'password') { passInput.type = 'text';     toggleBtn.textContent = '🙈'; }
    else                               { passInput.type = 'password'; toggleBtn.textContent = '👁'; }
  });
  passInput.parentElement.appendChild(toggleBtn);
}

/* ──────────────────────────────────────────────────────────────
   SETTINGS SECTION — Change Password + Change Username
────────────────────────────────────────────────────────────── */
function injectSettingsSection() {
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (sidebarNav) {
    const label       = document.createElement('label');
    label.textContent = 'Account';
    const navBtn      = document.createElement('button');
    navBtn.className  = 'nav-item';
    navBtn.setAttribute('onclick', "showSection('settings', this)");
    navBtn.innerHTML  = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>Account Settings`;
    sidebarNav.appendChild(label);
    sidebarNav.appendChild(navBtn);
  }

  const main = document.querySelector('.main');
  if (!main) return;

  const section     = document.createElement('section');
  section.className = 'admin-section';
  section.id        = 'section-settings';
  section.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Account Settings</h1>
        <p>Update your admin username and password.</p>
      </div>
    </div>
    <div class="settings-grid">

      <!-- ── Change Username ── -->
      <div class="settings-card">
        <div class="settings-card-title">👤 Change Username</div>
        <div class="settings-card-sub">
          Update the username used to log in to the admin panel. Must be 3+ characters, letters/numbers/underscore only.
        </div>
        <div class="settings-msg" id="s-un-msg"></div>
        <div class="settings-field">
          <label>Current Username</label>
          <div class="settings-input-wrap">
            <input type="text" id="s-current-un" disabled placeholder="Loading…" style="opacity:0.5;cursor:not-allowed">
          </div>
        </div>
        <div class="settings-field">
          <label>New Username</label>
          <div class="settings-input-wrap">
            <input type="text" id="s-new-un" placeholder="e.g. noxadmin"
              maxlength="30" oninput="sValidateUsername(this)">
          </div>
        </div>
        <button class="btn-settings-save" onclick="saveAdminUsername()">Save Username</button>
      </div>

      <!-- ── Change Password ── -->
      <div class="settings-card">
        <div class="settings-card-title">🔒 Change Password</div>
        <div class="settings-card-sub">
          Enter your new password below. All five password rules must be satisfied.
        </div>
        <div class="settings-msg" id="s-pw-msg"></div>
        <div class="settings-field">
          <label>New Password</label>
          <div class="settings-input-wrap">
            <input type="password" id="s-new-pw" placeholder="Create a strong password"
              oninput="sUpdatePwStrength(this.value)">
            <button class="settings-toggle-btn" type="button" onclick="sTogglePw('s-new-pw', this)">👁</button>
          </div>
          <div class="s-pw-strength-wrap" id="s-pw-strength-wrap">
            <div class="s-pw-bar">
              <div class="s-pw-seg" id="sps1"></div><div class="s-pw-seg" id="sps2"></div>
              <div class="s-pw-seg" id="sps3"></div><div class="s-pw-seg" id="sps4"></div>
              <div class="s-pw-seg" id="sps5"></div>
            </div>
            <div class="s-pw-rules" id="s-pw-rules-list"></div>
          </div>
        </div>
        <div class="settings-field">
          <label>Confirm New Password</label>
          <div class="settings-input-wrap">
            <input type="password" id="s-new-pw2" placeholder="Repeat new password"
              oninput="sCheckConfirm(this)">
            <button class="settings-toggle-btn" type="button" onclick="sTogglePw('s-new-pw2', this)">👁</button>
          </div>
        </div>
        <button class="btn-settings-save" onclick="saveAdminPassword()">Save Password</button>
      </div>

    </div>`;
  main.appendChild(section);

  // Build pw rules list
  const rulesList = document.getElementById('s-pw-rules-list');
  if (rulesList) {
    rulesList.innerHTML = PW_RULES.map(r =>
      `<div class="s-pw-rule" id="s-${r.id}"><div class="rule-dot"></div>${r.label}</div>`
    ).join('');
  }
}

/* ── Populate current username in settings ── */
async function populateCurrentUsername() {
  const el = document.getElementById('s-current-un');
  if (!el || !auth.currentUser) return;
  try {
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (snap.exists()) el.value = snap.data().username || '';
  } catch {}
}

/* ── Settings helpers ── */
window.sTogglePw = function (id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type        = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
};

window.sValidateUsername = function (input) {
  const val = input.value.trim();
  if (!val) { input.classList.remove('s-valid','s-invalid'); return; }
  const ok = val.length >= 3 && /^[a-zA-Z0-9_]+$/.test(val);
  input.classList.toggle('s-valid',   ok);
  input.classList.toggle('s-invalid', !ok);
};

window.sUpdatePwStrength = function (pw) {
  const wrap = document.getElementById('s-pw-strength-wrap');
  if (!wrap) return;
  wrap.style.display = pw ? 'block' : 'none';
  const score   = PW_RULES.filter(r => r.test(pw)).length;
  const colours = ['s1','s1','s2','s3','s4'];
  ['sps1','sps2','sps3','sps4','sps5'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 's-pw-seg';
    if (i < score) el.classList.add(colours[Math.min(score - 1, 4)]);
  });
  PW_RULES.forEach(r => {
    const el = document.getElementById('s-' + r.id);
    if (el) el.classList.toggle('met', r.test(pw));
  });
};

window.sCheckConfirm = function (input) {
  const pw = document.getElementById('s-new-pw').value;
  if (!input.value) { input.classList.remove('s-valid','s-invalid'); return; }
  input.classList.toggle('s-valid',   input.value === pw);
  input.classList.toggle('s-invalid', input.value !== pw);
};

function showSettingsMsg(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className    = `settings-msg ${type} show`;
  el.textContent  = msg;
  setTimeout(() => el.classList.remove('show'), 4000);
}

/* ── Save username ── */
window.saveAdminUsername = async function () {
  const newUsername = document.getElementById('s-new-un').value.trim();

  if (!newUsername || newUsername.length < 3 || !/^[a-zA-Z0-9_]+$/.test(newUsername)) {
    showSettingsMsg('s-un-msg', 'error', 'Username must be 3+ characters (letters, numbers, _ only).');
    return;
  }

  if (!auth.currentUser) {
    showSettingsMsg('s-un-msg', 'error', 'Not logged in.');
    return;
  }

  try {
    // Check if username is already taken by another user
    const q    = query(collection(db, 'users'), where('username', '==', newUsername));
    const snap = await getDocs(q);
    const taken = snap.docs.some(d => d.id !== auth.currentUser.uid);
    if (taken) {
      showSettingsMsg('s-un-msg', 'error', 'That username is already taken. Please choose another.');
      return;
    }

    // Update Firestore
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { username: newUsername });

    // Update Firebase Auth display name
    const { updateProfile } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    await updateProfile(auth.currentUser, { displayName: newUsername });

    // Update the displayed current username
    const currentEl = document.getElementById('s-current-un');
    if (currentEl) currentEl.value = newUsername;

    // Clear the input
    const newEl = document.getElementById('s-new-un');
    if (newEl) { newEl.value = ''; newEl.classList.remove('s-valid','s-invalid'); }

    showSettingsMsg('s-un-msg', 'success', '✅ Username updated successfully!');
    if (typeof window.showToast === 'function') window.showToast('Username updated!', 'success');
  } catch (err) {
    showSettingsMsg('s-un-msg', 'error', 'Failed: ' + err.message);
  }
};

/* ── Save password ── */
window.saveAdminPassword = async function () {
  const newPw  = document.getElementById('s-new-pw').value;
  const newPw2 = document.getElementById('s-new-pw2').value;

  if (scorePassword(newPw) < 5) {
    const failed = PW_RULES.filter(r => !r.test(newPw)).map(r => r.label);
    showSettingsMsg('s-pw-msg', 'error', 'Password must include: ' + failed.join(', ') + '.');
    return;
  }
  if (newPw !== newPw2) {
    showSettingsMsg('s-pw-msg', 'error', 'Passwords do not match.');
    return;
  }

  try {
    const { updatePassword } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    await updatePassword(auth.currentUser, newPw);

    ['s-new-pw','s-new-pw2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ''; el.classList.remove('s-valid','s-invalid'); }
    });
    document.getElementById('s-pw-strength-wrap').style.display = 'none';
    showSettingsMsg('s-pw-msg', 'success', '✅ Password updated successfully!');
    if (typeof window.showToast === 'function') window.showToast('Password updated!', 'success');
  } catch (err) {
    showSettingsMsg('s-pw-msg', 'error', 'Failed: ' + err.message);
  }
};

/* ── Enter key on login form ── */
function bindEnter() {
  ['login-pass','login-user'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') window.doLogin();
    });
  });
}

/* ── Hook showSection to load username when settings opens ── */
function hookShowSection() {
  setTimeout(() => {
    const original = window.showSection;
    if (!original) return;
    window.showSection = function (name, btn) {
      original(name, btn);
      if (name === 'settings') populateCurrentUsername();
    };
  }, 300);
}

/* ── Init ── */
function init() {
  patchLoginForm();
  bindEnter();
  injectSettingsSection();
  hookShowSection();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}