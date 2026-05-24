/* ══════════════════════════════════════════════════════════════
   NOX'S CAFE — firebase-config.js
   Central Firebase initialization. Import this in every file
   that needs Firebase services.

   HOW TO GET YOUR CONFIG:
   1. Go to https://console.firebase.google.com
   2. Create a project (or open existing one)
   3. Click the gear icon ⚙️ > Project Settings
   4. Scroll down to "Your apps" > click the </> (Web) icon
   5. Register app, then copy the firebaseConfig object below
══════════════════════════════════════════════════════════════ */

import { initializeApp }        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth }              from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore }         from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage }           from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

// ─── PASTE YOUR FIREBASE CONFIG HERE ───────────────────────
// Replace every value below with the ones from your Firebase project.
const firebaseConfig = {
  apiKey:            "AIzaSyB3e7uA82DrUW1u_JmLme561p3hYGTR7zQ",
  authDomain:        "noxscafe-1141c.firebaseapp.com",
  projectId:         "noxscafe-1141c",
  storageBucket:     "noxscafe-1141c.firebasestorage.app",
  messagingSenderId: "739980274905",
  appId:             "1:739980274905:web:8be0237209737fb22fe2c8",
};
// ────────────────────────────────────────────────────────────

const app     = initializeApp(firebaseConfig);
const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };