/* ══════════════════════════════════════════════════════════════
   NOX'S CAFE — script.js  (Firebase version)
   Shared between index.html (customer) and admin.html
   
   Firestore collections used:
     "menu"         — live menu items
     "orders"       — placed orders
     "reservations" — billiards bookings
══════════════════════════════════════════════════════════════ */

import { db, auth }        from './firebase-config.js';
import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy,
  onSnapshot, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ──────────────────────────────────────────────────────────────
   DEFAULT MENU (seeded to Firestore on first run by admin)
────────────────────────────────────────────────────────────── */
const DEFAULT_MENU_DATA = {
  espresso: [
    { n: 'Americano',             p: 120, img: 'images/americano.png' },
    { n: 'Brewed Coffee',         p: 120, img: 'images/brewed-coffee.png' },
    { n: 'Cappuccino',            p: 140, img: 'images/cappuccino.png' },
    { n: 'Caramel Latte',         p: 150, img: 'images/caramel-latte.png' },
    { n: 'Vanilla Latte',         p: 150, img: 'images/vanilla-latte.webp' },
    { n: 'Salted Caramel Latte',  p: 150, img: 'images/salted-caramel-latte.webp' },
    { n: 'Caramel Macchiato',     p: 160, img: 'images/caramel-macchiato.webp' },
    { n: 'Cafe Mocha',            p: 160, img: 'images/cafe-mocha.png' },
    { n: 'Spanish Latte',         p: 150, img: 'images/spanish-latte.webp' },
    { n: 'Cafe Rodrigo',          p: 170, img: 'images/cafe-rodrigo.png' },
    { n: 'Vietnamese Coffee',     p: 155, img: 'images/vietnamese-coffee.png' },
    { n: 'Brown Sugar Oat Latte', p: 180, img: 'images/brownsugaroatlatte.webp' },
    { n: 'Seasalt Kreme Latte',   p: 150, img: 'images/seasalt-kreme-latte.png' },
  ],
  frappes: [
    { n: "Nox's Signature",    p: 150, img: 'images/nox-signature.png' },
    { n: 'Matcha Green Tea',   p: 140, img: 'images/matcha-green-tea.png' },
    { n: 'Strawberry',         p: 140, img: 'images/strawberry-frappe.png' },
    { n: 'Java Chip',          p: 140, img: 'images/java-chip.webp' },
    { n: 'Death by Chocolate', p: 150, img: 'images/death-by-chocolate.png' },
    { n: 'Oreo Delight',       p: 150, img: 'images/oreo-delight.png' },
    { n: 'Vanilla Frappe',     p: 140, img: 'images/vanilla-frappe.png' },
    { n: 'Strawberry Cookies', p: 150, img: 'images/strawberry-cookie.webp' },
    { n: 'Cappuccino',         p: 140, img: 'images/capuccino-frappe.webp' },
  ],
  fingerfoods: [
    { n: 'French Fries',                p: 120, img: 'images/french-fries.png' },
    { n: 'Dynamite',                    p: 110, img: 'images/dynamite.jpg' },
    { n: 'Potato Wedges',               p: 130, img: 'images/potato-wedges.png' },
    { n: 'Popcorn Bowl',                p: 130, img: 'images/popcorn-bowl.png' },
    { n: 'Cheese Sticks',               p: 110, img: 'images/cheese-sticks.png' },
    { n: 'Nachos',                      p: 120, img: 'images/nachos.png' },
    { n: 'Chili Cheese Fries Overload', p: 180, img: 'images/chili-cheese-fries-overload.png' },
  ],
  matcha: [
    { n: 'Matcha Latte',            p: 130, img: 'images/matcha-latte.webp' },
    { n: 'Dirty Matcha',            p: 150, img: 'images/dirty-matcha.webp' },
    { n: 'Matcha Affogato',         p: 120, img: 'images/matcha-affogato.webp' },
    { n: 'Matcha Ichigo',           p: 160, img: 'images/matcha-ichigo.png' },
    { n: 'Matcha Cream Coffee',     p: 150, img: 'images/matcha-cream-coffee.png' },
    { n: 'Strawberry Cream Matcha', p: 150, img: 'images/strawberry-cream-matcha.png' },
  ],
  noncoffee: [
    { n: 'Lemonade',                  p: 80,  img: 'images/lemonade.png' },
    { n: 'Lemonade w/ Mint',          p: 95,  img: 'images/lemonade-mint.jpg' },
    { n: 'Lemonade w/ Basil',         p: 95,  img: 'images/lemonade-basil.webp' },
    { n: 'Strawberry Latte',          p: 130, img: 'images/strawberry-latte.png' },
    { n: 'Chocolate Milk',            p: 100, img: 'images/chocolate-milk.png' },
    { n: 'Softdrinks',                p: 30,  img: 'images/softdrinks.webp' },
    { n: 'Bottled Water',             p: 20,  img: 'images/bottled-water.png' },
    { n: 'Fruit Soda - Kiwi',         p: 100, img: 'images/fruit-soda-kiwi.jpg' },
    { n: 'Fruit Soda - Mango',        p: 100, img: 'images/fruit-soda-mango.png' },
    { n: 'Fruit Soda - Blueberry',    p: 100, img: 'images/fruit-soda-blueberry.png' },
    { n: 'Fruit Soda - Passionfruit', p: 100, img: 'images/fruit-soda-passionfruit.png' },
    { n: 'Fruit Soda - Strawberry',   p: 100, img: 'images/fruit-soda-strawberry.webp' },
    { n: 'Fruit Soda - Green Apple',  p: 100, img: 'images/fruit-soda-green-apple.jpg' },
  ],
  pulutan: [
    { n: 'Sisig',               p: 160, img: 'images/sisig.webp' },
    { n: 'Buffalo Wings',       p: 130, img: 'images/buffalo-wings.png' },
    { n: "Tokwa't Baboy",       p: 130, img: 'images/tokwa-baboy.jpg' },
    { n: 'Kare-Kare (2-3 Pax)', p: 400, img: 'images/kare-kare.webp' },
    { n: 'Sinigang (2-3 Pax)',  p: 400, img: 'images/sinigang.png' },
  ],
  sandwiches: [
    { n: 'Bacon Cheeseburger', p: 170, img: 'images/bacon-cheeseburger.png' },
    { n: 'Clubhouse Sandwich', p: 190, img: 'images/clubhouse-sandwich.png' },
    { n: 'Ham & Egg Sandwich', p: 120, img: 'images/ham-egg-sandwich.jpg' },
    { n: 'French Toast',       p: 120, img: 'images/french-toast.png' },
  ],
  rice: [
    { n: 'Tapsilog',        p: 150, img: 'images/tapsilog.jpg' },
    { n: 'Tocilog',         p: 140, img: 'images/tocilog.jpg' },
    { n: 'Longsilog',       p: 140, img: 'images/longsilog.webp' },
    { n: 'Hotsilog',        p: 100, img: 'images/hotsilog.jpg' },
    { n: 'Porksilog',       p: 160, img: 'images/porksilog.jpg' },
    { n: 'Chicksilog',      p: 150, img: 'images/chicksilog.webp' },
    { n: 'Liemposilog',     p: 160, img: 'images/liemposilog.jpg' },
    { n: 'Sisig Rice',      p: 140, img: 'images/sisig-rice.webp' },
    { n: 'Binalot Regular', p: 160, img: 'images/binalot-regular.jpg' },
  ],
  pasta: [
    { n: 'Spaghetti',             p: 120, img: 'images/spaghetti.png' },
    { n: 'Carbonara',             p: 150, img: 'images/carbonara.png' },
    { n: 'Pancit Canton',         p: 160, img: 'images/pancit-canton.png' },
    { n: 'Pancit Bihon',          p: 160, img: 'images/pancit-bihon.webp' },
    { n: 'Chicken Alfredo',       p: 180, img: 'images/chicken-alfredo.png' },
    { n: 'Pesto Cheese',          p: 180, img: 'images/pesto-cheese.png' },
    { n: 'Tomato Basil',          p: 150, img: 'images/tomato-basil.webp' },
    { n: 'Bacon Tomato Linguine', p: 170, img: 'images/bacon-tomato-linguine.webp' },
  ],
  japanese: [
    { n: 'Okonomiyaki',      p: 180, img: 'images/okonomiyaki.webp' },
    { n: 'Karaage',          p: 130, img: 'images/karaage.webp' },
    { n: 'Yakimeshi',        p: 125, img: 'images/yakimeshi.jpg' },
    { n: 'Chicken Tonkatsu', p: 170, img: 'images/chicken-tonkatsu.webp' },
    { n: 'Pork Tonkatsu',    p: 160, img: 'images/pork-tonkatsu.png' },
    { n: 'Katsudon',         p: 185, img: 'images/katsudon.png' },
    { n: 'Yakisoba',         p: 190, img: 'images/yakisoba.jpg' },
    { n: 'Yakisoba Spicy',   p: 190, img: 'images/yakisoba-spicy.png' },
  ],
};

const CAT_LABELS = {
  espresso:    'Espresso',
  frappes:     'Frappes',
  fingerfoods: 'Finger Foods',
  matcha:      'All About Matcha',
  noncoffee:   'Non-Coffee',
  pulutan:     'Pulutan/Viands',
  sandwiches:  'Sandwiches',
  rice:        'Rice Meals',
  pasta:       'Pastas',
  japanese:    'Japanese Meals',
};

const ALL_TIME_SLOTS = [
  '8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM',
  '4:00 PM','5:00 PM','6:00 PM','7:00 PM',
  '8:00 PM','9:00 PM','10:00 PM',
];

/* ══════════════════════════════════════════════════════════════
   INDEX.HTML — CUSTOMER LOGIC
══════════════════════════════════════════════════════════════ */
if (document.getElementById('home')) {

  const pages = {
    home:     'home',
    menu:     'menu-page',
    cat:      'cat-page',
    billiards:'billiards-page',
    about:    'about-page',
    confirm:  'confirm-page',
  };

  let cart           = [];
  let menuItems      = [];
  let selectedSlot   = null;
  let paymentImgData = null;

  /* ── Guard: block page until auth resolves ── */
  // The auth overlay in auth.css already visually blocks the page.
  // This is an extra JS guard: hide page content until Firebase confirms auth.
  document.querySelectorAll('.page').forEach(p => {
    if (p.id !== 'home') p.style.visibility = 'hidden';
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Reveal all pages once authenticated
      document.querySelectorAll('.page').forEach(p => {
        p.style.visibility = '';
      });
    }
    // If not logged in, auth.js will show the overlay — no need to do anything here
  });

  /* ── Load menu from Firestore (only non-archived items) ── */
  async function loadMenuFromFirestore() {
    try {
      const snap = await getDocs(collection(db, 'menu'));
      // Filter out archived items — customers should NOT see them
      menuItems = snap.docs
        .map(d => ({ firestoreId: d.id, ...d.data() }))
        .filter(item => !item.archived);
      buildMenuGrids();
    } catch (err) {
      console.error('Failed to load menu:', err);
    }
  }

  function buildMenuGrids(filter) {
    filter = filter || '';
    const q = filter.trim().toLowerCase();
    const grouped = {};
    Object.keys(DEFAULT_MENU_DATA).forEach(cat => { grouped[cat] = []; });
    menuItems.forEach(item => {
      if (!grouped[item.cat]) grouped[item.cat] = [];
      grouped[item.cat].push(item);
    });

    let totalVisible = 0;
    Object.entries(grouped).forEach(([cat, items]) => {
      const grid    = document.getElementById(cat + '-grid');
      const section = grid ? grid.closest('.menu-section') : null;
      if (!grid) return;
      const filtered = q ? items.filter(i => i.name.toLowerCase().includes(q)) : items;
      totalVisible += filtered.length;
      if (section) section.style.display = filtered.length === 0 ? 'none' : '';
      if (filtered.length === 0) { grid.innerHTML = ''; return; }
      grid.innerHTML = filtered.map(item => `
        <div class="col-6 col-md-4 col-lg-3">
          <div class="menu-item-card">
            <div>
              ${item.img ? `<img src="${item.img}" class="menu-img" alt="${item.name}" onerror="this.style.display='none'">` : ''}
              <div class="item-name">${item.name}</div>
              <div class="item-price">&#x20B1;${item.price}</div>
            </div>
            <button class="btn-add"
              onclick="addToCart('${CAT_LABELS[cat]}','${item.name.replace(/'/g,"\\'")}',${ item.price})">
              Add +
            </button>
          </div>
        </div>`).join('');
    });

    let noRes = document.getElementById('menu-no-results');
    if (!noRes) {
      noRes = document.createElement('div');
      noRes.id = 'menu-no-results';
      noRes.style.cssText = 'text-align:center;padding:3rem 1rem;color:rgba(255,255,255,0.4);display:none';
      noRes.innerHTML = '<div style="font-size:2rem;margin-bottom:0.75rem">\uD83D\uDD0D</div><p style="font-size:0.95rem">No menu items found for "<span id=\"menu-no-res-q\"></span>"</p>';
      const mb = document.querySelector('.menu-body');
      if (mb) mb.appendChild(noRes);
    }
    if (q && totalVisible === 0) {
      const span = document.getElementById('menu-no-res-q');
      if (span) span.textContent = filter;
      noRes.style.display = 'block';
    } else {
      noRes.style.display = 'none';
    }
  }

  window.searchMenu = function () {
    const inp = document.getElementById('menu-search-input');
    buildMenuGrids(inp ? inp.value : '');
  };


  /* ── Cart ── */
  function showCartPop() {
    const pop = document.getElementById('cart-pop');
    if (!pop) return;
    pop.classList.remove('show');
    void pop.offsetWidth;
    pop.classList.add('show');
    clearTimeout(pop._timer);
    pop._timer = setTimeout(() => pop.classList.remove('show'), 1400);
  }

  window.goTo = function (p) {
    document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
    document.getElementById(pages[p]).classList.add('active');
    window.scrollTo(0, 0);
    if (p === 'menu') loadMenuFromFirestore();
    if (p === 'billiards') renderTimeSlotsPreview();
  };

  window.addToCart = function (cat, name, price) {
    const ex = cart.find(c => c.n === name && c.cat === cat);
    if (ex) { ex.qty++; } else { cart.push({ cat, n: name, p: price, qty: 1 }); }
    updateCartBtn();
    showCartPop();
  };

  function updateCartBtn() {
    const btn = document.getElementById('cart-btn-text');
    if (btn) btn.textContent = '🛒 Cart (' + cart.reduce((s,c) => s + c.qty, 0) + ')';
  }

  function getCartTotal() {
    return cart.reduce((s, c) => s + c.p * c.qty, 0);
  }

  window.openCart = function () {
    const modal  = document.getElementById('cart-modal');
    const list   = document.getElementById('cart-items-list');
    const footer = document.getElementById('cart-footer');
    modal.style.display = 'flex';
    if (cart.length === 0) {
      list.innerHTML = '<p class="empty-cart">Your cart is empty. Add some items!</p>';
      footer.style.display = 'none';
    } else {
      list.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <h4>${item.n}</h4>
            <p class="cart-item-cat">${item.cat}</p>
            <p class="cart-item-price">₱${item.p} × ${item.qty}</p>
          </div>
          <div class="qty-controls">
            <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
            <button class="del-btn" onclick="removeItem(${i})">🗑️</button>
          </div>
        </div>`).join('');
      document.getElementById('cart-total-amt').textContent = '₱' + getCartTotal();
      footer.style.display = 'block';
    }
  };

  window.changeQty = function (i, d) {
    cart[i].qty += d;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    updateCartBtn();
    window.openCart();
  };

  window.removeItem = function (i) {
    cart.splice(i, 1);
    updateCartBtn();
    window.openCart();
  };

  window.closeCart = function () {
    document.getElementById('cart-modal').style.display = 'none';
  };

  /* ── Place Order ── */
  window.placeOrder = async function () {
    if (cart.length === 0) return;

    // ── Feature 2: Confirmation dialog ──
    const confirmed = await showOrderConfirmDialog();
    if (!confirmed) return;

    const total    = getCartTotal();
    const orderNum = Math.floor(100000 + Math.random() * 900000);
    const user     = auth.currentUser;

    let savedItems = cart.map(c => ({ name: c.n, category: c.cat, price: c.p, qty: c.qty }));

    try {
      await addDoc(collection(db, 'orders'), {
        orderNumber:  orderNum,
        items:        savedItems,
        total,
        status:       'pending',
        customerId:   user ? user.uid   : 'guest',
        customerName: user ? (user.displayName || user.email) : 'Guest',
        customerEmail:user ? user.email : '',
        createdAt:    serverTimestamp(),
      });
    } catch (err) {
      console.error('Order save failed:', err);
    }

    document.getElementById('conf-order-num').textContent = orderNum;
    document.getElementById('conf-total').textContent     = '₱' + total;
    document.getElementById('conf-items').innerHTML = cart.map(c => `
      <div class="summary-item">
        <span>${c.n} <span style="color:rgba(255,255,255,0.45);font-size:0.85rem">× ${c.qty}</span></span>
        <span>₱${c.p * c.qty}</span>
      </div>`).join('');

    // ── Feature 5: Send order email ──
    if (user && user.email) {
      sendOrderEmail(user.email, orderNum, savedItems, total);
    }

    cart = [];
    updateCartBtn();
    window.closeCart();
    window.goTo('confirm');
  };

  /* ── Order Confirmation Dialog ── */
  function showOrderConfirmDialog() {
    return new Promise(resolve => {
      // Build modal if not already there
      let modal = document.getElementById('order-confirm-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'order-confirm-modal';
        modal.style.cssText = `
          position:fixed;inset:0;background:rgba(0,0,0,0.75);
          display:flex;align-items:center;justify-content:center;
          z-index:10000;padding:1.5rem;backdrop-filter:blur(4px);`;
        modal.innerHTML = `
          <div style="background:#18181c;border:1px solid rgba(255,255,255,0.1);
            border-radius:18px;padding:2rem;max-width:420px;width:100%;
            box-shadow:0 32px 80px rgba(0,0,0,0.7);animation:slideUp 0.35s cubic-bezier(0.22,1,0.36,1)">
            <div style="text-align:center;margin-bottom:1.5rem">
              <div style="font-size:2.5rem;margin-bottom:0.75rem">🛒</div>
              <h2 style="color:#f5f5f0;font-family:'Syne',sans-serif;font-size:1.25rem;margin-bottom:0.5rem">
                Confirm Your Order?
              </h2>
              <p style="color:rgba(255,255,255,0.5);font-size:0.88rem;line-height:1.6">
                Once placed, your order will be sent to the kitchen. Please make sure everything looks right.
              </p>
            </div>
            <div id="ocd-items" style="background:rgba(255,255,255,0.04);border-radius:10px;
              padding:0.9rem 1rem;margin-bottom:1rem;max-height:180px;overflow-y:auto"></div>
            <div style="display:flex;justify-content:space-between;align-items:center;
              margin-bottom:1.25rem;padding:0.75rem 1rem;border-top:1px solid rgba(255,255,255,0.08)">
              <span style="color:rgba(255,255,255,0.6);font-size:0.9rem">Total</span>
              <span id="ocd-total" style="color:#f5f5f0;font-family:'Syne',sans-serif;font-size:1.15rem;font-weight:700"></span>
            </div>
            <div style="display:flex;gap:0.75rem">
              <button id="ocd-cancel"
                style="flex:1;padding:0.85rem;background:rgba(255,255,255,0.06);
                border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);
                border-radius:10px;font-size:0.95rem;cursor:pointer;font-family:inherit;transition:all 0.2s">
                Edit Order
              </button>
              <button id="ocd-confirm"
                style="flex:1.5;padding:0.85rem;background:linear-gradient(135deg,#e8c97a,#d4a840);
                color:#0c0c0e;border:none;border-radius:10px;font-family:'Syne',sans-serif;
                font-size:0.95rem;font-weight:700;cursor:pointer;transition:all 0.2s;
                box-shadow:0 4px 16px rgba(232,201,122,0.3)">
                ✓ Place Order
              </button>
            </div>
          </div>`;
        document.body.appendChild(modal);
      }

      // Fill in cart items
      document.getElementById('ocd-items').innerHTML = cart.map(c => `
        <div style="display:flex;justify-content:space-between;padding:0.35rem 0;
          border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.85rem">
          <span style="color:rgba(255,255,255,0.75)">${c.n} <span style="color:rgba(255,255,255,0.35)">× ${c.qty}</span></span>
          <span style="color:#e8c97a">₱${c.p * c.qty}</span>
        </div>`).join('');
      document.getElementById('ocd-total').textContent = '₱' + getCartTotal();
      modal.style.display = 'flex';

      const cleanup = (result) => {
        modal.style.display = 'none';
        resolve(result);
      };
      document.getElementById('ocd-confirm').onclick = () => cleanup(true);
      document.getElementById('ocd-cancel').onclick  = () => cleanup(false);
      modal.onclick = (e) => { if (e.target === modal) cleanup(false); };
    });
  }

  /* ── Feature 5: Send order email via EmailJS ── */
  function sendOrderEmail(email, orderNum, items, total) {
    const itemsList = items.map(i => `${i.name} x${i.qty} — ₱${i.price * i.qty}`).join('\n');
    const subject   = `Nox's Cafe — Your Order #${orderNum}`;
    const body      = encodeURIComponent(
      `Hi there!\n\nYour order at Nox's Cafe has been received!\n\n` +
      `Order Number: #${orderNum}\n\nItems Ordered:\n${itemsList}\n\n` +
      `Total: ₱${total}\n\nPlease show your order number to the cashier.\n` +
      `Thank you for ordering at Nox's Cafe! ☕\n\n— Nox's Cafe Team`
    );
    // Use mailto as a fallback (works without a backend)
    // For production, replace with EmailJS or Firebase Functions
    try {
      const link = document.createElement('a');
      link.href  = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {}
  }

  /* ── Feature 5: Send reservation email ── */
  function sendReservationEmail(email, refNum, date, time, durationLabel) {
    const subject = `Nox's Cafe — Reservation ${refNum}`;
    const body    = encodeURIComponent(
      `Hi there!\n\nYour billiards reservation at Nox's Cafe has been submitted!\n\n` +
      `Reference Number: ${refNum}\n` +
      `Date: ${date}\nTime: ${time}\nDuration: ${durationLabel}\n\n` +
      `Your reservation is currently PENDING approval. ` +
      `We'll confirm your slot once our admin reviews your payment.\n\n` +
      `Please screenshot this reference number for your records.\n\n— Nox's Cafe Team`
    );
    try {
      const link = document.createElement('a');
      link.href  = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {}
  }

  /* ── Reservation: check taken slots ── */
  async function getTakenSlotsForDate(dateStr) {
    const snap = await getDocs(query(
      collection(db, 'reservations'),
      where('date', '==', dateStr),
      where('status', 'in', ['pending', 'approved'])
    ));
    return snap.docs.map(d => d.data().time);
  }

  async function renderTimeSlotsPreview() {
    const container = document.getElementById('time-slots-preview');
    if (!container) return;
    const today = new Date().toISOString().split('T')[0];
    let taken   = [];
    try { taken = await getTakenSlotsForDate(today); } catch {}

    const html = ALL_TIME_SLOTS.map(slot => {
      const isTaken = taken.includes(slot);
      return `<div class="slot-chip ${isTaken ? 'slot-taken' : 'slot-free'}">
        ${slot}<span class="slot-status-dot"></span>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="slots-preview-header">
        <span>Today's availability</span>
        <span class="slots-legend">
          <span class="leg-free"></span> Available
          <span class="leg-taken"></span> Reserved
        </span>
      </div>
      <div class="slots-chips">${html}</div>`;
  }

  window.openReservationModal = function () {
    selectedSlot   = null;
    paymentImgData = null;
    document.getElementById('res-step-1').style.display = 'block';
    document.getElementById('res-step-2').style.display = 'none';
    document.getElementById('res-date').value = '';
    document.getElementById('res-slots-grid').innerHTML =
      '<p class="res-slots-hint">Select a date above to see available slots.</p>';
    document.getElementById('res-date').min = new Date().toISOString().split('T')[0];
    document.getElementById('reservation-modal').style.display = 'flex';
  };

  window.closeReservationModal = function () {
    document.getElementById('reservation-modal').style.display = 'none';
  };

  window.loadTimeSlots = async function () {
    const dateVal = document.getElementById('res-date').value;
    if (!dateVal) return;
    const grid   = document.getElementById('res-slots-grid');
    selectedSlot = null;
    grid.innerHTML = '<p class="res-slots-hint">Loading slots…</p>';
    let taken = [];
    try { taken = await getTakenSlotsForDate(dateVal); } catch {}
    grid.innerHTML = ALL_TIME_SLOTS.map(slot => {
      const isTaken = taken.includes(slot);
      return `<button
        class="res-slot-btn ${isTaken ? 'res-slot-taken' : 'res-slot-avail'}"
        onclick="${isTaken ? '' : `selectSlot('${slot}', this)`}"
        ${isTaken ? 'disabled' : ''}>
        ${slot}${isTaken ? '<small>Reserved</small>' : '<small>Available</small>'}
      </button>`;
    }).join('');
  };

  window.selectSlot = function (slot, el) {
    selectedSlot = slot;
    document.querySelectorAll('.res-slot-btn').forEach(b => b.classList.remove('res-slot-selected'));
    el.classList.add('res-slot-selected');
  };

  window.goToStep2 = function () {
    const dateVal = document.getElementById('res-date').value;
    if (!dateVal)     { alert('Please select a date.');       return; }
    if (!selectedSlot){ alert('Please select a time slot.'); return; }
    const dur    = document.getElementById('res-duration').value;
    const labels = { '1': '1 Hour — ₱200', '3': '3 Hours — ₱500', 'all': 'All Day — ₱1,000' };
    document.getElementById('res-summary-bar').innerHTML = `
      <div class="res-summary-row"><span>📅 Date</span><strong>${formatDate(dateVal)}</strong></div>
      <div class="res-summary-row"><span>🕐 Time</span><strong>${selectedSlot}</strong></div>
      <div class="res-summary-row"><span>⏱ Duration</span><strong>${labels[dur]}</strong></div>`;
    document.getElementById('res-step-1').style.display = 'none';
    document.getElementById('res-step-2').style.display = 'block';
    document.getElementById('res-name').value    = '';
    document.getElementById('res-contact').value = '';
    document.getElementById('res-upload-preview').style.display     = 'none';
    document.getElementById('res-upload-placeholder').style.display = 'flex';
    paymentImgData = null;
  };

  window.goToStep1 = function () {
    document.getElementById('res-step-2').style.display = 'none';
    document.getElementById('res-step-1').style.display = 'block';
  };

  window.previewPaymentImg = function (input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      paymentImgData = e.target.result;
      document.getElementById('res-upload-preview').src              = paymentImgData;
      document.getElementById('res-upload-preview').style.display    = 'block';
      document.getElementById('res-upload-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
  };

  /* ── Submit reservation ── */
  window.submitReservation = async function () {
    const name    = document.getElementById('res-name').value.trim();
    const contact = document.getElementById('res-contact').value.trim();
    const dateVal = document.getElementById('res-date').value;
    const dur     = document.getElementById('res-duration').value;
    if (!name)          { alert('Please enter your name.');             return; }
    if (!contact)       { alert('Please enter your contact number.');   return; }
    if (!paymentImgData){ alert('Please upload your proof of payment.');return; }

    const submitBtn = document.querySelector('.btn-res-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; }

    const durLabels = { '1':'1 Hour (₱200)', '3':'3 Hours (₱500)', 'all':'All Day (₱1,000)' };
    const refNum    = 'RES-' + Date.now().toString(36).toUpperCase();
    const user      = auth.currentUser;

    try {
      await setDoc(doc(db, 'reservations', refNum), {
        id:            refNum,
        name,
        contact,
        date:          dateVal,
        time:          selectedSlot,
        duration:      dur,
        durationLabel: durLabels[dur],
        paymentImg:    paymentImgData,
        status:        'pending',
        customerId:    user ? user.uid   : 'guest',
        customerEmail: user ? user.email : '',
        submittedAt:   serverTimestamp(),
      });

      // ── Feature 5: Send reservation confirmation email ──
      if (user && user.email) {
        sendReservationEmail(user.email, refNum, formatDate(dateVal), selectedSlot, durLabels[dur]);
      }

      window.closeReservationModal();
      document.getElementById('res-success-ref').innerHTML = `
        <div class="res-ref-label">Reference Number</div>
        <div class="res-ref-num">${refNum}</div>
        <div class="res-ref-sub">Screenshot this for your records</div>`;
      document.getElementById('res-success-modal').style.display = 'flex';
      renderTimeSlotsPreview();
    } catch (err) {
      console.error('Reservation submission failed:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Reservation'; }
    }
  };

  window.closeResSuccessModal = function () {
    document.getElementById('res-success-modal').style.display = 'none';
  };

  /* ── Feature 3: My Orders / Transaction History ── */
  window.openMyOrders = async function () {
    const user = auth.currentUser;
    if (!user) return;

    let modal = document.getElementById('my-orders-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'my-orders-modal';
      modal.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.8);
        display:flex;align-items:center;justify-content:center;
        z-index:9999;padding:1.5rem;backdrop-filter:blur(4px);`;
      modal.innerHTML = `
        <div style="background:#18181c;border:1px solid rgba(255,255,255,0.1);
          border-radius:18px;width:100%;max-width:500px;max-height:85vh;
          display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.7);
          animation:slideUp 0.35s cubic-bezier(0.22,1,0.36,1)">
          <div style="display:flex;justify-content:space-between;align-items:center;
            padding:1.25rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.08)">
            <h2 style="color:#f5f5f0;font-family:'Syne',sans-serif;font-size:1.15rem;margin:0">
              📋 My Orders
            </h2>
            <button onclick="document.getElementById('my-orders-modal').style.display='none'"
              style="background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.6);
              width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1.1rem;
              display:flex;align-items:center;justify-content:center">×</button>
          </div>
          <div id="my-orders-list" style="overflow-y:auto;padding:1rem 1.5rem;flex:1">
            <p style="color:rgba(255,255,255,0.4);text-align:center;padding:2rem">Loading…</p>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    }
    modal.style.display = 'flex';

    // Load this user's orders from Firestore
    const listEl = document.getElementById('my-orders-list');
    listEl.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:2rem">Loading…</p>';
    try {
      // Use only a single-field filter to avoid needing a composite index.
      // Sort client-side instead.
      const snap = await getDocs(query(
        collection(db, 'orders'),
        where('customerId', '==', user.uid)
      ));
      if (snap.empty) {
        listEl.innerHTML = `
          <div style="text-align:center;padding:2.5rem 1rem">
            <div style="font-size:2.5rem;margin-bottom:1rem">📭</div>
            <p style="color:rgba(255,255,255,0.4);font-size:0.9rem">No orders yet. Start ordering!</p>
          </div>`;
        return;
      }
      // Sort newest first client-side
      const docs = snap.docs.sort((a, b) => {
        const ta = a.data().createdAt?.toMillis?.() || 0;
        const tb = b.data().createdAt?.toMillis?.() || 0;
        return tb - ta;
      });
      listEl.innerHTML = docs.map(d => {
        const o    = d.data();
        const time = o.createdAt?.toDate?.().toLocaleString('en-PH', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit'
        }) || 'Just now';
        const statusColor = { pending: '#e8c97a', completed: '#4ade80', cancelled: '#e05c5c' }[o.status] || '#e8c97a';
        return `
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
            border-radius:12px;padding:1rem 1.1rem;margin-bottom:0.75rem">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.6rem">
              <div>
                <span style="color:#f5f5f0;font-family:'Syne',sans-serif;font-weight:700;font-size:0.95rem">
                  Order #${o.orderNumber}
                </span><br>
                <span style="color:rgba(255,255,255,0.35);font-size:0.75rem">${time}</span>
              </div>
              <span style="color:${statusColor};font-size:0.78rem;font-weight:600;
                background:${statusColor}18;padding:0.25rem 0.6rem;border-radius:20px">
                ${(o.status || 'pending').toUpperCase()}
              </span>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:0.6rem;margin-bottom:0.6rem">
              ${(o.items || []).map(i => `
                <div style="display:flex;justify-content:space-between;font-size:0.82rem;
                  color:rgba(255,255,255,0.55);padding:0.2rem 0">
                  <span>${i.name} × ${i.qty}</span>
                  <span>₱${i.price * i.qty}</span>
                </div>`).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="color:rgba(255,255,255,0.4);font-size:0.78rem">Total</span>
              <span style="color:#e8c97a;font-family:'Syne',sans-serif;font-weight:700">₱${o.total}</span>
            </div>
          </div>`;
      }).join('');
    } catch (err) {
      listEl.innerHTML = `<p style="color:#e05c5c;text-align:center;padding:2rem">Failed to load orders: ${err.message}</p>`;
    }
  };

  /* ── My Reservations ── */
  window.openMyReservations = async function () {
    const user = auth.currentUser;
    if (!user) return;

    let modal = document.getElementById('my-reservations-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'my-reservations-modal';
      modal.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.8);
        display:flex;align-items:center;justify-content:center;
        z-index:9999;padding:1.5rem;backdrop-filter:blur(4px);`;
      modal.innerHTML = `
        <div style="background:#18181c;border:1px solid rgba(255,255,255,0.1);
          border-radius:18px;width:100%;max-width:500px;max-height:85vh;
          display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.7);
          animation:slideUp 0.35s cubic-bezier(0.22,1,0.36,1)">
          <div style="display:flex;justify-content:space-between;align-items:center;
            padding:1.25rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.08)">
            <h2 style="color:#f5f5f0;font-family:'Syne',sans-serif;font-size:1.15rem;margin:0">
              🎱 My Reservations
            </h2>
            <button onclick="document.getElementById('my-reservations-modal').style.display='none'"
              style="background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.6);
              width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1.1rem;
              display:flex;align-items:center;justify-content:center">×</button>
          </div>
          <div id="my-reservations-list" style="overflow-y:auto;padding:1rem 1.5rem;flex:1">
            <p style="color:rgba(255,255,255,0.4);text-align:center;padding:2rem">Loading…</p>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    }
    modal.style.display = 'flex';

    const listEl = document.getElementById('my-reservations-list');
    listEl.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:2rem">Loading…</p>';
    try {
      const snap = await getDocs(query(
        collection(db, 'reservations'),
        where('customerId', '==', user.uid)
      ));
      if (snap.empty) {
        listEl.innerHTML = `
          <div style="text-align:center;padding:2.5rem 1rem">
            <div style="font-size:2.5rem;margin-bottom:1rem">🎱</div>
            <p style="color:rgba(255,255,255,0.4);font-size:0.9rem">No reservations yet. Book a billiards table!</p>
          </div>`;
        return;
      }
      const docs = snap.docs.sort((a, b) => {
        const ta = a.data().submittedAt?.toMillis?.() || 0;
        const tb = b.data().submittedAt?.toMillis?.() || 0;
        return tb - ta;
      });
      const statusColor = { pending: '#e8c97a', approved: '#4ade80', rejected: '#e05c5c' };
      const statusEmoji = { pending: '⏳', approved: '✅', rejected: '❌' };
      listEl.innerHTML = docs.map(d => {
        const r = d.data();
        const time = r.submittedAt?.toDate?.().toLocaleString('en-PH', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit'
        }) || 'Just now';
        const sc = statusColor[r.status] || '#e8c97a';
        const se = statusEmoji[r.status] || '⏳';
        return `
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
            border-radius:12px;padding:1rem 1.1rem;margin-bottom:0.75rem">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem">
              <div>
                <div style="color:#e8c97a;font-family:'Syne',sans-serif;font-weight:800;
                  font-size:0.82rem;letter-spacing:0.08em;margin-bottom:0.2rem">
                  ${r.id || d.id}
                </div>
                <span style="color:rgba(255,255,255,0.35);font-size:0.75rem">${time}</span>
              </div>
              <span style="color:${sc};font-size:0.78rem;font-weight:600;
                background:${sc}18;padding:0.25rem 0.6rem;border-radius:20px">
                ${se} ${(r.status || 'pending').toUpperCase()}
              </span>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:0.65rem;
              display:grid;grid-template-columns:1fr 1fr;gap:0.4rem 0.75rem">
              <div style="font-size:0.82rem;color:rgba(255,255,255,0.45)">📅 Date</div>
              <div style="font-size:0.82rem;color:#f5f5f0;text-align:right">${formatDate(r.date)}</div>
              <div style="font-size:0.82rem;color:rgba(255,255,255,0.45)">🕐 Time</div>
              <div style="font-size:0.82rem;color:#f5f5f0;text-align:right">${r.time}</div>
              <div style="font-size:0.82rem;color:rgba(255,255,255,0.45)">⏱ Duration</div>
              <div style="font-size:0.82rem;color:#f5f5f0;text-align:right">${r.durationLabel}</div>
            </div>
          </div>`;
      }).join('');
    } catch (err) {
      listEl.innerHTML = `<p style="color:#e05c5c;text-align:center;padding:2rem">Failed to load reservations: ${err.message}</p>`;
    }
  };

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00')
      .toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) {
        this.style.display = 'none';
        if (this.id === 'cart-modal') window.closeCart();
      }
    });
  });

  loadMenuFromFirestore();
  renderTimeSlotsPreview();
}


/* ══════════════════════════════════════════════════════════════
   ADMIN.HTML — ADMIN LOGIC
══════════════════════════════════════════════════════════════ */
if (document.getElementById('login-screen')) {

  const CATEGORIES = {
    espresso:    { label: 'Espresso',         emoji: '☕' },
    frappes:     { label: 'Frappes',          emoji: '🥤' },
    fingerfoods: { label: 'Finger Foods',     emoji: '🍟' },
    matcha:      { label: 'All About Matcha', emoji: '🍵' },
    noncoffee:   { label: 'Non-Coffee',       emoji: '🧃' },
    pulutan:     { label: 'Pulutan / Viands', emoji: '🍺' },
    sandwiches:  { label: 'Sandwiches',       emoji: '🥪' },
    rice:        { label: 'Rice Meals',       emoji: '🍚' },
    pasta:       { label: 'Pastas',           emoji: '🍝' },
    japanese:    { label: 'Japanese Meals',   emoji: '🍱' },
  };

  let menuItems   = [];
  let editingId   = null;
  let deletingId  = null;
  let activityLog = [];
  let resFilter   = 'all';
  let unsubOrders = null;

  /* ── Called by admin-auth.js after successful login ── */
  window.initAdmin = async function () {
    populateCatFilter();
    populateCatSelects();
    await loadMenuItems();
    renderDashboard();
    renderTable();
    renderCatOverview();
    updateBadge();
    await renderReservations();
    updateResBadge();
    listenToOrders();
  };

  /* ── Load menu from Firestore ── */
  async function loadMenuItems() {
    const snap = await getDocs(collection(db, 'menu'));
    if (snap.empty) {
      await seedDefaultMenu();
      const snap2 = await getDocs(collection(db, 'menu'));
      menuItems = snap2.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    } else {
      menuItems = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    }
  }

  async function seedDefaultMenu() {
    const batch = [];
    Object.entries(DEFAULT_MENU_DATA).forEach(([cat, items]) => {
      items.forEach(item => {
        batch.push(addDoc(collection(db, 'menu'), {
          name: item.n, price: item.p, cat, img: item.img || '',
          createdAt: serverTimestamp(),
        }));
      });
    });
    await Promise.all(batch);
    showToast('Default menu seeded to Firestore!', 'success');
  }

  function listenToOrders() {
    if (unsubOrders) unsubOrders();
    unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      () => { renderDashboard(); }
    );
  }

  function populateCatFilter() {
    const sel = document.getElementById('cat-filter');
    sel.innerHTML = '<option value="">All Categories</option>';
    Object.entries(CATEGORIES).forEach(([key, val]) => {
      sel.innerHTML += `<option value="${key}">${val.emoji} ${val.label}</option>`;
    });
  }

  function populateCatSelects() {
    const sel = document.getElementById('m-cat');
    sel.innerHTML = '';
    Object.entries(CATEGORIES).forEach(([key, val]) => {
      sel.innerHTML += `<option value="${key}">${val.emoji} ${val.label}</option>`;
    });
  }

  /* ── Dashboard — cards side-by-side using Bootstrap cols ── */
  async function renderDashboard() {
    const total    = menuItems.length;
    const avgPrice = total ? Math.round(menuItems.reduce((s, i) => s + i.price, 0) / total) : 0;
    const catCount = Object.keys(CATEGORIES).length;

    let orderCount = 0, pendingRes = 0;
    try {
      const [orderSnap, resSnap] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(query(collection(db, 'reservations'), where('status', '==', 'pending'))),
      ]);
      orderCount = orderSnap.size;
      pendingRes = resSnap.size;
    } catch {}

    // Stats row — 4 cards side by side (col-6 on mobile, col-3 on desktop)
    document.getElementById('stats-row').innerHTML = `
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-label">Total Menu Items</div>
          <div class="stat-val stat-accent">${total}</div>
          <div class="stat-sub">Across ${catCount} categories</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-label">Total Orders</div>
          <div class="stat-val">${orderCount}</div>
          <div class="stat-sub">All time</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-label">Avg. Price</div>
          <div class="stat-val">₱${avgPrice}</div>
          <div class="stat-sub">Per menu item</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-label">Pending Reservations</div>
          <div class="stat-val stat-accent">${pendingRes}</div>
          <div class="stat-sub">Awaiting approval</div>
        </div>
      </div>`;

    // Category overview — 5 across on large, 2-3 on smaller
    const og = document.getElementById('overview-grid');
    og.innerHTML = '';
    Object.entries(CATEGORIES).forEach(([key, val]) => {
      const count = menuItems.filter(i => i.cat === key).length;
      const pct   = total ? Math.round((count / total) * 100) : 0;
      og.innerHTML += `
        <div class="col-6 col-md-4 col-xl-2">
          <div class="overview-card" onclick="goToCategory('${key}')">
            <div class="ov-label">${val.emoji} ${val.label}</div>
            <div class="ov-val">${count}</div>
            <div class="ov-bar"><div class="ov-bar-fill" style="width:${pct}%"></div></div>
          </div>
        </div>`;
    });
  }

  window.goToCategory = function (catKey) {
    document.getElementById('cat-filter').value = catKey;
    showSection('menu-items', document.querySelector('.nav-item:nth-child(2)'));
    filterTable();
  };

  function renderCatOverview() {
    const total = menuItems.length;
    const g = document.getElementById('cat-overview-grid');
    g.innerHTML = '';
    Object.entries(CATEGORIES).forEach(([key, val]) => {
      const items = menuItems.filter(i => i.cat === key);
      const pct   = total > 0 ? Math.round((items.length / total) * 100) : 0;
      g.innerHTML += `
        <div class="col-6 col-md-4 col-xl-3">
          <div class="overview-card">
            <div class="ov-label" style="font-size:1.4rem;margin-bottom:0.5rem">${val.emoji}</div>
            <div class="ov-label">${val.label}</div>
            <div class="ov-val">${items.length}
              <span style="font-size:1rem;color:var(--muted);font-family:var(--font-body)">items</span>
            </div>
            <div class="ov-bar" style="margin-top:0.75rem">
              <div class="ov-bar-fill" style="width:${pct}%"></div>
            </div>
            <div style="font-size:0.75rem;color:var(--muted);margin-top:0.4rem">${pct}% of total menu</div>
          </div>
        </div>`;
    });
  }

  /* ── Menu Table ── */
  function renderTable(items = menuItems) {
    const tbody = document.getElementById('menu-tbody');
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="empty-state"><span class="es-icon">🔍</span><p>No items found.</p></div>
      </td></tr>`;
      return;
    }
    tbody.innerHTML = items.map((item, idx) => {
      const cat     = CATEGORIES[item.cat];
      const imgHtml = item.img
        ? `<img src="${item.img}" class="item-thumb" alt="${item.name}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="item-thumb-placeholder" style="display:none">${cat?.emoji || '🍽️'}</div>`
        : `<div class="item-thumb-placeholder">${cat?.emoji || '🍽️'}</div>`;
      const isArchived = !!item.archived;
      return `
        <tr style="animation-delay:${idx * 0.03}s;${isArchived ? 'opacity:0.5' : ''}">
          <td>${imgHtml}</td>
          <td><div class="item-name-cell">${item.name}${isArchived ? ' <span style="color:#e8c97a;font-size:0.7rem;font-weight:600">[ARCHIVED]</span>' : ''}</div></td>
          <td><span class="cat-badge">${cat?.emoji || ''} ${cat?.label || item.cat}</span></td>
          <td><span class="price-badge">₱${item.price}</span></td>
          <td>
            ${isArchived
              ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.72rem;color:#e8c97a;background:rgba(232,201,122,0.1);padding:0.25rem 0.6rem;border-radius:20px;border:1px solid rgba(232,201,122,0.3)">🗂 Archived</span>`
              : `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.72rem;color:#4ade80;background:rgba(74,222,128,0.1);padding:0.25rem 0.6rem;border-radius:20px;border:1px solid rgba(74,222,128,0.3)">✅ Visible</span>`
            }
          </td>
          <td>
            <div class="action-btns">
              <button class="btn-edit"   onclick="openEditModal('${item.firestoreId}')" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn-archive ${isArchived ? 'btn-unarchive' : ''}"
                onclick="toggleArchive('${item.firestoreId}', ${isArchived})"
                title="${isArchived ? 'Restore to menu' : 'Archive (hide from menu)'}">
                ${isArchived
                  ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.57"/></svg>`
                  : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`
                }
              </button>
              <button class="btn-delete" onclick="openDeleteModal('${item.firestoreId}')" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 0V4a1 1 0 011-1h2a1 1 0 011 1v2"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  window.filterTable = function () {
    const q        = document.getElementById('search-input').value.toLowerCase();
    const cat      = document.getElementById('cat-filter').value;
    const filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(q) && (!cat || item.cat === cat)
    );
    renderTable(filtered);
  };

  /* ── Feature 6: Archive / Unarchive a menu item ── */
  window.toggleArchive = async function (firestoreId, isCurrentlyArchived) {
    const item = menuItems.find(i => i.firestoreId === firestoreId);
    if (!item) return;
    const newArchived = !isCurrentlyArchived;
    try {
      await updateDoc(doc(db, 'menu', firestoreId), {
        archived: newArchived,
        updatedAt: serverTimestamp(),
      });
      const idx = menuItems.findIndex(i => i.firestoreId === firestoreId);
      menuItems[idx] = { ...menuItems[idx], archived: newArchived };
      logActivity('edit', `${newArchived ? 'Archived' : 'Restored'} "${item.name}"`);
      showToast(`"${item.name}" ${newArchived ? 'archived — hidden from menu' : 'restored to menu'}.`,
        newArchived ? 'warning' : 'success');
      renderTable();
      window.filterTable();
      renderDashboard();
      updateBadge();
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  };

  function updateBadge() {
    document.getElementById('item-count-badge').textContent = menuItems.length;
  }

  /* ── Add / Edit Modal ── */
  window.openAddModal = function () {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Add New Item';
    document.getElementById('m-name').value  = '';
    document.getElementById('m-price').value = '';
    document.getElementById('m-img').value   = '';
    document.getElementById('m-cat').value   = 'espresso';
    document.getElementById('item-modal').classList.add('open');
  };

  window.openEditModal = function (firestoreId) {
    const item = menuItems.find(i => i.firestoreId === firestoreId);
    if (!item) return;
    editingId = firestoreId;
    document.getElementById('modal-title').textContent = 'Edit Item';
    document.getElementById('m-name').value  = item.name;
    document.getElementById('m-price').value = item.price;
    document.getElementById('m-img').value   = item.img || '';
    document.getElementById('m-cat').value   = item.cat;
    document.getElementById('item-modal').classList.add('open');
  };

  window.closeModal = function () {
    document.getElementById('item-modal').classList.remove('open');
  };

  window.saveItem = async function () {
    const name  = document.getElementById('m-name').value.trim();
    const price = parseInt(document.getElementById('m-price').value);
    const cat   = document.getElementById('m-cat').value;
    const img   = document.getElementById('m-img').value.trim();
    if (!name)                               { showToast('Please enter an item name.', 'error');  return; }
    if (!price || isNaN(price) || price < 0) { showToast('Please enter a valid price.', 'error'); return; }

    const btn = document.querySelector('.btn-save');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'menu', editingId), { name, price, cat, img, updatedAt: serverTimestamp() });
        const idx = menuItems.findIndex(i => i.firestoreId === editingId);
        menuItems[idx] = { ...menuItems[idx], name, price, cat, img };
        logActivity('edit', `Edited "${name}"`);
        showToast(`"${name}" updated!`, 'success');
      } else {
        const docRef = await addDoc(collection(db, 'menu'), {
          name, price, cat, img, createdAt: serverTimestamp(),
        });
        menuItems.push({ firestoreId: docRef.id, name, price, cat, img });
        logActivity('add', `Added "${name}" to ${CATEGORIES[cat].label}`);
        showToast(`"${name}" added to the menu!`, 'success');
      }
      window.closeModal();
      renderTable();
      window.filterTable();
      renderDashboard();
      renderCatOverview();
      updateBadge();
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Save Item'; }
    }
  };

  /* ── Delete Modal ── */
  window.openDeleteModal = function (firestoreId) {
    const item = menuItems.find(i => i.firestoreId === firestoreId);
    if (!item) return;
    deletingId = firestoreId;
    document.getElementById('delete-item-name').textContent = item.name;
    document.getElementById('delete-modal').classList.add('open');
  };

  window.closeDeleteModal = function () {
    document.getElementById('delete-modal').classList.remove('open');
    deletingId = null;
  };

  window.confirmDelete = async function () {
    const item = menuItems.find(i => i.firestoreId === deletingId);
    if (!item) return;
    try {
      await deleteDoc(doc(db, 'menu', deletingId));
      menuItems = menuItems.filter(i => i.firestoreId !== deletingId);
      logActivity('delete', `Removed "${item.name}"`);
      showToast(`"${item.name}" removed.`, 'success');
      window.closeDeleteModal();
      renderTable();
      window.filterTable();
      renderDashboard();
      renderCatOverview();
      updateBadge();
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  /* ── Orders ── */
  let orderFilter = 'all';

  window.setOrderFilter = function (f, btn) {
    orderFilter = f;
    document.querySelectorAll('.res-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window.renderOrders();
  };

  window.renderOrders = async function () {
    const container = document.getElementById('orders-container');
    const statsEl   = document.getElementById('order-stats-row');
    if (!container) return;
    container.innerHTML = '<p style="color:var(--muted);padding:2rem">Loading orders…</p>';
    try {
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      const all  = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));

      const pending   = all.filter(o => (o.status || 'pending') === 'pending').length;
      const completed = all.filter(o => o.status === 'completed').length;
      const cancelled = all.filter(o => o.status === 'cancelled').length;

      // Update badge
      const badge = document.getElementById('orders-count-badge');
      if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline-block' : 'none'; }

      if (statsEl) statsEl.innerHTML = `
        <div class="col-6 col-md-3"><div class="res-stat-card">
          <div class="res-stat-num">${all.length}</div><div class="res-stat-label">Total</div>
        </div></div>
        <div class="col-6 col-md-3"><div class="res-stat-card res-stat-pending">
          <div class="res-stat-num">${pending}</div><div class="res-stat-label">Pending</div>
        </div></div>
        <div class="col-6 col-md-3"><div class="res-stat-card res-stat-approved">
          <div class="res-stat-num">${completed}</div><div class="res-stat-label">Completed</div>
        </div></div>
        <div class="col-6 col-md-3"><div class="res-stat-card res-stat-rejected">
          <div class="res-stat-num">${cancelled}</div><div class="res-stat-label">Cancelled</div>
        </div></div>`;

      const filtered = orderFilter === 'all' ? all
        : all.filter(o => (o.status || 'pending') === orderFilter);

      if (filtered.length === 0) {
        container.innerHTML = `<div class="col-12"><div class="empty-state"><span class="es-icon">📋</span><p>No orders found.</p></div></div>`;
        return;
      }
      container.innerHTML = filtered.map(o => {
        const time       = o.createdAt?.toDate?.().toLocaleString('en-PH') || 'Just now';
        const status     = o.status || 'pending';
        const statusClass = { pending:'res-status-pending', completed:'res-status-approved', cancelled:'res-status-rejected' }[status] || 'res-status-pending';
        const itemsHtml  = (o.items || []).map(i =>
          `<div class="order-item-row">${i.name} × ${i.qty} — ₱${i.price * i.qty}</div>`
        ).join('');
        return `
          <div class="col-12 col-md-6 col-xl-4">
            <div class="order-card">
              <div class="order-card-top">
                <strong>#${o.orderNumber}</strong>
                <span class="res-card-status ${statusClass}">${status.toUpperCase()}</span>
              </div>
              <div class="order-customer">👤 ${o.customerName || 'Guest'}
                ${o.customerEmail ? `<span style="color:var(--muted);font-size:0.78rem;margin-left:0.4rem">${o.customerEmail}</span>` : ''}
              </div>
              <div class="order-items-list">${itemsHtml}</div>
              <div class="order-footer">
                <span class="order-total">Total: ₱${o.total}</span>
                <span class="order-time">${time}</span>
              </div>
              ${status === 'pending' ? `
              <div style="display:flex;gap:0.5rem;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border)">
                <button onclick="updateOrderStatus('${o.firestoreId}','completed')"
                  style="flex:1;padding:0.5rem;background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.3);
                  color:#4ade80;border-radius:8px;cursor:pointer;font-size:0.82rem;font-family:inherit">
                  ✅ Mark Completed
                </button>
                <button onclick="updateOrderStatus('${o.firestoreId}','cancelled')"
                  style="flex:1;padding:0.5rem;background:rgba(224,92,92,0.1);border:1px solid rgba(224,92,92,0.3);
                  color:#e05c5c;border-radius:8px;cursor:pointer;font-size:0.82rem;font-family:inherit">
                  ❌ Cancel
                </button>
              </div>` : ''}
            </div>
          </div>`;
      }).join('');
    } catch (err) {
      container.innerHTML = `<p style="color:var(--red)">Failed to load orders: ${err.message}</p>`;
    }
  };

  window.updateOrderStatus = async function (firestoreId, newStatus) {
    try {
      await updateDoc(doc(db, 'orders', firestoreId), { status: newStatus });
      logActivity('edit', `Order marked as ${newStatus}`);
      showToast(`Order ${newStatus}!`, newStatus === 'completed' ? 'success' : 'error');
      window.renderOrders();
      renderDashboard();
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  };

  /* ── Reservations — cards side-by-side ── */
  async function updateResBadge() {
    try {
      const snap   = await getDocs(query(collection(db, 'reservations'), where('status', '==', 'pending')));
      const count  = snap.size;
      const badge  = document.getElementById('res-count-badge');
      if (badge) {
        badge.textContent   = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
      }
    } catch {}
  }

  window.renderReservations = async function () {
    const container = document.getElementById('res-cards-container');
    const statsEl   = document.getElementById('res-stats');
    if (!container) return;
    container.innerHTML = '<p style="color:var(--muted);padding:2rem">Loading…</p>';

    try {
      const snap = await getDocs(query(collection(db, 'reservations'), orderBy('submittedAt', 'desc')));
      const all  = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));

      const pending  = all.filter(r => r.status === 'pending').length;
      const approved = all.filter(r => r.status === 'approved').length;
      const rejected = all.filter(r => r.status === 'rejected').length;

      // Stats: 4 cards side by side
      if (statsEl) statsEl.innerHTML = `
        <div class="col-6 col-md-3">
          <div class="res-stat-card">
            <div class="res-stat-num">${all.length}</div>
            <div class="res-stat-label">Total</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="res-stat-card res-stat-pending">
            <div class="res-stat-num">${pending}</div>
            <div class="res-stat-label">Pending</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="res-stat-card res-stat-approved">
            <div class="res-stat-num">${approved}</div>
            <div class="res-stat-label">Approved</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="res-stat-card res-stat-rejected">
            <div class="res-stat-num">${rejected}</div>
            <div class="res-stat-label">Rejected</div>
          </div>
        </div>`;

      const filtered = resFilter === 'all' ? all : all.filter(r => r.status === resFilter);
      if (filtered.length === 0) {
        container.innerHTML = `<div class="col-12"><div class="empty-state"><span class="es-icon">📋</span><p>No reservations found.</p></div></div>`;
        return;
      }

      // Reservation cards: 2 side by side on md+, 1 column on mobile
      container.innerHTML = filtered.map(r => {
        const statusClass = { pending:'res-status-pending', approved:'res-status-approved', rejected:'res-status-rejected' }[r.status];
        const statusLabel = { pending:'⏳ Pending', approved:'✅ Approved', rejected:'❌ Rejected' }[r.status];
        const timeAgo     = r.submittedAt?.toDate ? formatTimeAgo(r.submittedAt.toDate()) : '';
        return `
          <div class="col-12 col-md-6 col-xl-4">
            <div class="res-card" onclick="viewReservation('${r.firestoreId}')">
              <div class="res-card-top">
                <div class="res-card-ref">${r.id || r.firestoreId}</div>
                <span class="res-card-status ${statusClass}">${statusLabel}</span>
              </div>
              <div class="res-card-name">${r.name}</div>
              <div class="res-card-details">
                <span>📅 ${formatDateShort(r.date)}</span>
                <span>🕐 ${r.time}</span>
                <span>⏱ ${r.durationLabel}</span>
              </div>
              <div class="res-card-meta">
                <span>📞 ${r.contact}</span>
                <span class="res-card-time">${timeAgo}</span>
              </div>
              <div class="res-card-actions" onclick="event.stopPropagation()">
                ${r.status === 'pending' ? `
                  <button class="res-btn-approve" onclick="approveRes('${r.firestoreId}')">✅ Approve</button>
                  <button class="res-btn-reject"  onclick="rejectRes('${r.firestoreId}')">❌ Reject</button>` : ''}
                <button class="res-btn-view" onclick="viewReservation('${r.firestoreId}')">👁 View Proof</button>
              </div>
            </div>
          </div>`;
      }).join('');
    } catch (err) {
      container.innerHTML = `<p style="color:var(--red)">Failed to load: ${err.message}</p>`;
    }
  };

  window.setResFilter = function (f, btn) {
    resFilter = f;
    document.querySelectorAll('.res-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window.renderReservations();
  };

  async function updateResStatus(firestoreId, status) {
    await updateDoc(doc(db, 'reservations', firestoreId), { status });
    await window.renderReservations();
    await renderDashboard();
    await updateResBadge();
    closeResProofModal();
  }

  window.approveRes = async function (firestoreId) {
    try {
      await updateResStatus(firestoreId, 'approved');
      logActivity('edit', `Approved reservation ${firestoreId}`);
      showToast('Reservation approved!', 'success');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };

  window.rejectRes = async function (firestoreId) {
    try {
      await updateResStatus(firestoreId, 'rejected');
      logActivity('delete', `Rejected reservation ${firestoreId}`);
      showToast('Reservation rejected.', 'error');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };

  window.viewReservation = async function (firestoreId) {
    try {
      const snap = await getDoc(doc(db, 'reservations', firestoreId));
      if (!snap.exists()) return;
      const r = snap.data();
      const statusClass = { pending:'res-status-pending', approved:'res-status-approved', rejected:'res-status-rejected' }[r.status];
      const statusLabel = { pending:'⏳ Pending', approved:'✅ Approved', rejected:'❌ Rejected' }[r.status];
      const submitted   = r.submittedAt?.toDate?.().toLocaleString('en-PH') || '—';
      document.getElementById('res-proof-content').innerHTML = `
        <div class="res-proof-header-info">
          <div>
            <div class="res-proof-ref">${r.id || firestoreId}</div>
            <span class="res-card-status ${statusClass}">${statusLabel}</span>
          </div>
        </div>
        <div class="res-proof-details">
          <div class="res-proof-row"><span>👤 Name</span><strong>${r.name}</strong></div>
          <div class="res-proof-row"><span>📞 Contact</span><strong>${r.contact}</strong></div>
          <div class="res-proof-row"><span>📅 Date</span><strong>${formatDateFull(r.date)}</strong></div>
          <div class="res-proof-row"><span>🕐 Time</span><strong>${r.time}</strong></div>
          <div class="res-proof-row"><span>⏱ Duration</span><strong>${r.durationLabel}</strong></div>
          <div class="res-proof-row"><span>🕒 Submitted</span><strong>${submitted}</strong></div>
        </div>
        <div class="res-proof-img-wrap">
          <div class="res-proof-img-label">Proof of Payment</div>
          <img src="${r.paymentImg}" class="res-proof-img" alt="Payment proof">
        </div>
        ${r.status === 'pending' ? `
        <div class="res-proof-action-row">
          <button class="res-btn-approve" style="flex:1;padding:0.85rem"
            onclick="approveRes('${firestoreId}')">✅ Approve Reservation</button>
          <button class="res-btn-reject" style="flex:1;padding:0.85rem"
            onclick="rejectRes('${firestoreId}')">❌ Reject</button>
        </div>` : ''}`;
      document.getElementById('res-proof-modal').classList.add('open');
    } catch (err) { showToast('Failed to load details: ' + err.message, 'error'); }
  };

  function closeResProofModal() {
    document.getElementById('res-proof-modal').classList.remove('open');
  }
  window.closeResProofModal = closeResProofModal;

  /* ── Date helpers ── */
  function formatDateFull(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00')
      .toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }
  function formatDateShort(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00')
      .toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' });
  }
  function formatTimeAgo(date) {
    const diff = Date.now() - date.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  /* ── Activity log ── */
  function logActivity(type, text) {
    const time = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    activityLog.unshift({ type, text, time });
    if (activityLog.length > 8) activityLog.pop();
    renderActivityLog();
  }
  function renderActivityLog() {
    const icons  = { add:'✨', edit:'✏️', delete:'🗑️' };
    const logDiv = document.getElementById('activity-log');
    const items  = activityLog.length
      ? activityLog
      : [{ type:'add', text:'Welcome to Nox Admin Panel', time:'Now' }];
    logDiv.innerHTML = items.map(a => `
      <div class="activity-item">
        <div class="act-icon ${a.type}">${icons[a.type] || '📝'}</div>
        <div class="act-text">${a.text}<span>${a.time}</span></div>
      </div>`).join('');
  }

  /* ── Toast ── */
  function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<div class="toast-dot"></div><div class="toast-msg">${msg}</div>`;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 350); }, 3000);
  }
  window.showToast = showToast;

  /* ── Section switching ── */
  window.showSection = function (name, btn) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`section-${name}`)?.classList.add('active');
    if (btn) btn.classList.add('active');
    if (name === 'reservations') window.renderReservations();
    if (name === 'orders')       window.renderOrders();
  };

  /* ── Modal close on backdrop ── */
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) {
        this.classList.remove('open');
        deletingId = null;
      }
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
      deletingId = null;
    }
  });
}