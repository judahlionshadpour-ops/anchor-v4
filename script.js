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
