/* ===== PROTOCOL TABS ===== */
(function () {
  const wrap = document.getElementById('protocolTabs');
  if (!wrap) return;
  wrap.addEventListener('click', (e) => {
    const tab = e.target.closest('.protocol-tab');
    if (!tab) return;
    const phase = tab.dataset.phase;
    document.querySelectorAll('.protocol-tab').forEach(t => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.protocol-panel').forEach(p => p.classList.toggle('active', p.dataset.phase === phase));
    document.querySelectorAll('[data-phase-img]').forEach(img => img.classList.toggle('active', img.dataset.phaseImg === phase));
  });
})();

/* ===== NAV SHADOW ===== */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = scrollY > 24 ? '0 4px 20px rgba(0,0,0,.08)' : 'none';
}, { passive: true });

/* ===== REVEAL ===== */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      e.target.style.transitionDelay = (i * 80) + 'ms';
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

function revealFallback() {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    if (el.getBoundingClientRect().top < (innerHeight || 800) * 0.95) el.classList.add('visible');
  });
  const barsEl = document.getElementById('bars');
  if (barsEl && !barsEl.dataset.filled && barsEl.getBoundingClientRect().top < (innerHeight || 800) * 0.9) fillBars();
}
window.addEventListener('scroll', revealFallback, { passive: true });
window.addEventListener('resize', revealFallback);
setTimeout(revealFallback, 800);

/* ===== GAP BARS ===== */
function fillBars() {
  const barsEl = document.getElementById('bars');
  if (!barsEl || barsEl.dataset.filled) return;
  barsEl.dataset.filled = '1';
  barsEl.querySelectorAll('.bar-row').forEach((row, i) => {
    setTimeout(() => {
      row.querySelector('.bar i').style.width = row.dataset.fill + '%';
    }, i * 140);
  });
}
const barsEl = document.getElementById('bars');
if (barsEl) {
  const barIO = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { fillBars(); barIO.unobserve(e.target); } });
  }, { threshold: .3 });
  barIO.observe(barsEl);
}

/* ===== ACCORDION ===== */
document.querySelectorAll('.acc-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.acc-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.acc-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.acc-icon').textContent = '+';
    });
    if (!isOpen) {
      item.classList.add('open');
      btn.querySelector('.acc-icon').textContent = '×';
    }
  });
});

/* ===== REVIEWS CAROUSEL (true infinite loop via clone) ===== */
const reviewsTrack = document.getElementById('reviewsTrack');
if (reviewsTrack) {
  // Clone all cards and append so we have: [original x6] [clone x6]
  const origCards = Array.from(reviewsTrack.querySelectorAll('.review-card'));
  origCards.forEach(c => reviewsTrack.appendChild(c.cloneNode(true)));

  const total = origCards.length; // 6
  let idx = 0;
  let animating = false;

  function getCardW() {
    const c = reviewsTrack.querySelector('.review-card');
    return c ? c.offsetWidth + 19 : 340;
  }

  function jumpTo(i) {
    reviewsTrack.style.transition = 'none';
    idx = i;
    reviewsTrack.style.transform = `translateX(-${idx * getCardW()}px)`;
    // force reflow so next transition applies cleanly
    reviewsTrack.offsetHeight;
  }

  function slideTo(i) {
    if (animating) return;
    animating = true;
    idx = i;
    reviewsTrack.style.transition = 'transform .4s cubic-bezier(.4,0,.2,1)';
    reviewsTrack.style.transform = `translateX(-${idx * getCardW()}px)`;
  }

  reviewsTrack.addEventListener('transitionend', () => {
    animating = false;
    // If we've slid into the clone zone, silently snap back to originals
    if (idx >= total) jumpTo(idx - total);
    else if (idx < 0) jumpTo(idx + total);
  });

  const revPrev = document.getElementById('revPrev');
  const revNext = document.getElementById('revNext');
  if (revNext) revNext.addEventListener('click', () => slideTo(idx + 1));
  if (revPrev) revPrev.addEventListener('click', () => slideTo(idx - 1));
}

/* ===== THEME TWEAK ===== */
(function () {
  const KEY = 'anchor-theme';
  const THEMES = ['dark', 'light'];
  let theme = THEMES.includes(localStorage.getItem(KEY)) ? localStorage.getItem(KEY) : 'dark';

  const apply = (t) => {
    document.body.classList.toggle('theme-light', t === 'light');
  };
  apply(theme);

  const wrap = document.getElementById('tweaks');
  if (!wrap) return;
  const seg = document.getElementById('tweakTheme');
  const sync = () => seg.querySelectorAll('button').forEach(b =>
    b.setAttribute('aria-checked', String(b.dataset.theme === theme)));
  sync();

  document.getElementById('tweaksToggle').addEventListener('click', () => wrap.classList.toggle('is-open'));
  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-theme]');
    if (!btn) return;
    theme = btn.dataset.theme;
    apply(theme);
    sync();
    localStorage.setItem(KEY, theme);
  });
})();


/* ===== CART DRAWER ===== */
(function () {
  const KEY = 'anchor-cart';
  const FREE_AT = 99;
  const PAYMENT_LINKS = {
    'gi': 'https://buy.stripe.com/test_dRmfZ99kmdkMfNZdM9dQQ00',
    'mg': 'https://buy.stripe.com/test_eVq8wHfIK0y07hteQddQQ01',
    'cp': 'https://buy.stripe.com/test_aFaeV5546fsU31d6jHdQQ02',
    'bundle-once': 'https://buy.stripe.com/test_7sYeV5dACfsUbxJazXdQQ03',
    'bundle-sub': 'https://buy.stripe.com/test_aFa3cn2VYgwY7ht8rPdQQ04',
  };
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { items = []; }

  const overlay = document.createElement('div');
  overlay.className = 'cart-overlay';
  const drawer = document.createElement('aside');
  drawer.className = 'cart-drawer';
  drawer.setAttribute('aria-label', 'Shopping cart');
  drawer.innerHTML = `
    <div class="cart-head"><h3>Your Cart <span data-cart-n></span></h3><button class="cart-close" aria-label="Close cart">&times;</button></div>
    <div class="cart-ship"><span data-ship-msg></span><div class="cart-ship-bar"><i data-ship-bar></i></div></div>
    <div class="cart-items" data-cart-items></div>
    <div class="cart-foot">
      <div class="cart-sub-row"><span>Subtotal</span><b data-cart-total>$0.00</b></div>
      <button type="button" class="btn btn-gold" data-checkout>Checkout</button>
      <p>Shipping and taxes calculated at checkout.</p>
    </div>`;
  document.body.append(overlay, drawer);

  const $items = drawer.querySelector('[data-cart-items]');
  const $total = drawer.querySelector('[data-cart-total]');
  const $n = drawer.querySelector('[data-cart-n]');
  const $shipMsg = drawer.querySelector('[data-ship-msg]');
  const $shipBar = drawer.querySelector('[data-ship-bar]');

  const money = (v) => '$' + v.toFixed(2);
  const count = () => items.reduce((s, i) => s + i.qty, 0);
  const total = () => items.reduce((s, i) => s + i.qty * i.price, 0);

  function open() { overlay.classList.add('is-open'); drawer.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  function close() { overlay.classList.remove('is-open'); drawer.classList.remove('is-open'); document.body.style.overflow = ''; }

  function render() {
    localStorage.setItem(KEY, JSON.stringify(items));
    const n = count(), t = total();
    $n.textContent = n ? '(' + n + ')' : '';
    $total.textContent = money(t);
    const remain = Math.max(0, FREE_AT - t);
    $shipMsg.innerHTML = remain > 0 ? 'You\'re <b>' + money(remain) + '</b> away from free shipping' : '<b>Free shipping unlocked.</b>';
    $shipBar.style.width = Math.min(100, (t / FREE_AT) * 100) + '%';

    $items.innerHTML = items.length ? items.map(i => `
      <div class="cart-line" data-line="${i.id}">
        <img class="cart-line-img" src="${i.img}" alt="${i.name}">
        <div>
          <div class="cart-line-name">${i.name}</div>
          <div class="cart-line-sub">${i.sub}</div>
          <div class="cart-qty"><button data-step="-1" aria-label="Decrease">&minus;</button><span>${i.qty}</span><button data-step="1" aria-label="Increase">+</button></div>
        </div>
        <div class="cart-line-right">
          <span class="cart-line-price">${money(i.qty * i.price)}</span>
          <button class="cart-remove" data-remove>Remove</button>
        </div>
      </div>`).join('') : '<div class="cart-empty">Your cart is empty.</div>';

    document.querySelectorAll('.icon-btn[aria-label="Cart"]').forEach(b => {
      let badge = b.querySelector('.cart-count');
      if (!n) { if (badge) badge.remove(); return; }
      if (!badge) { badge = document.createElement('span'); badge.className = 'cart-count'; b.appendChild(badge); }
      badge.textContent = n;
    });
  }

  function checkout() {
    if (!items.length) return;
    const distinctIds = [...new Set(items.map((i) => i.id))];
    if (distinctIds.length > 1) {
      alert('Right now checkout can only handle one formula at a time. Please remove the other item(s) from your cart, or check out separately for each.');
      return;
    }
    const link = PAYMENT_LINKS[distinctIds[0]];
    if (!link) return;
    window.location.href = link;
  }

  function add(data, qty) {
    const found = items.find(i => i.id === data.id);
    if (found) found.qty += qty;
    else items.push({ id: data.id, name: data.name, price: parseFloat(data.price), img: data.img, sub: data.sub, qty });
    render(); open();
  }

  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-btn[data-id]');
    if (addBtn) {
      e.preventDefault();
      const qEl = addBtn.dataset.qty && document.getElementById(addBtn.dataset.qty);
      add(addBtn.dataset, qEl ? parseInt(qEl.textContent, 10) || 1 : 1);
      return;
    }
    if (e.target.closest('.icon-btn[aria-label="Cart"]')) { e.preventDefault(); render(); open(); return; }
    if (e.target === overlay || e.target.closest('.cart-close')) { close(); return; }
    if (e.target.closest('[data-checkout]')) { checkout(); return; }

    const line = e.target.closest('.cart-line');
    if (!line) return;
    const item = items.find(i => i.id === line.dataset.line);
    if (!item) return;
    if (e.target.closest('[data-remove]')) { items = items.filter(i => i !== item); render(); return; }
    const step = e.target.closest('[data-step]');
    if (step) {
      item.qty += parseInt(step.dataset.step, 10);
      if (item.qty < 1) items = items.filter(i => i !== item);
      render();
    }
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  render();
})();
