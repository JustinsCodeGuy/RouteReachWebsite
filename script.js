// ============================================================
// ROUTEREACH — SCRIPTS
// ============================================================

// NAV scroll behavior
const nav = document.getElementById('nav');

function updateNav() {
  const heroHeight = document.getElementById('hero').offsetHeight;
  const scrolled = window.scrollY > 60;
  nav.classList.toggle('scrolled', scrolled);
}

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// Reveal on scroll (Intersection Observer)
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Stagger siblings within the same parent
        const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
        siblings.forEach((sib, i) => {
          if (!sib.classList.contains('visible')) {
            setTimeout(() => sib.classList.add('visible'), i * 80);
          }
        });
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  }
);

revealEls.forEach((el) => revealObserver.observe(el));

// Animated stat counter
function animateCounter(el, target, duration = 1800) {
  let start = null;
  const isDecimal = target % 1 !== 0;
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';

  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    // Ease out expo
    const eased = 1 - Math.pow(2, -10 * progress);
    const current = Math.floor(eased * target);
    el.textContent = prefix + current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = prefix + target.toLocaleString() + suffix;
  }

  requestAnimationFrame(step);
}

// Observe stat elements
const statNums = document.querySelectorAll('.stat-num');
const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        // Parse number from text like "50K+", "$2M+", "1,200+"
        let raw = text.replace(/[^0-9.KMB]/g, '');
        let multiplier = 1;
        if (raw.endsWith('K')) { multiplier = 1000; raw = raw.slice(0, -1); }
        if (raw.endsWith('M')) { multiplier = 1000000; raw = raw.slice(0, -1); }
        const num = parseFloat(raw) * multiplier;
        const prefix = text.startsWith('$') ? '$' : '';
        const hasPlusSuffix = text.endsWith('+');
        const hasK = text.includes('K');
        const hasM = text.includes('M');

        if (!el.dataset.animated) {
          el.dataset.animated = 'true';

          let start = null;
          const duration = 1600;

          function step(timestamp) {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(2, -10 * progress);
            const current = Math.floor(eased * num);

            let display;
            if (hasM) display = prefix + (current / 1000000).toFixed(1).replace('.0','') + 'M';
            else if (hasK) display = prefix + Math.floor(current / 1000) + 'K';
            else display = prefix + current.toLocaleString();
            if (hasPlusSuffix) display += '+';

            el.textContent = display;
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = text; // restore original
          }

          requestAnimationFrame(step);
        }

        statObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.5 }
);

statNums.forEach((el) => statObserver.observe(el));

// Smooth active nav link highlighting
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach((s) => sectionObserver.observe(s));

// Parallax orbs on mouse move (subtle)
document.addEventListener('mousemove', (e) => {
  const orbs = document.querySelectorAll('.hero-bg .orb');
  const x = (e.clientX / window.innerWidth - 0.5) * 20;
  const y = (e.clientY / window.innerHeight - 0.5) * 20;

  orbs.forEach((orb, i) => {
    const factor = (i + 1) * 0.4;
    orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
  });
});

// Chart bar animation on scroll
const chartBars = document.querySelectorAll('.chart-bar');
const chartObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        chartBars.forEach((bar, i) => {
          const targetHeight = bar.style.height;
          bar.style.height = '0%';
          setTimeout(() => {
            bar.style.transition = `height 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`;
            bar.style.height = targetHeight;
          }, 100);
        });
        chartObserver.disconnect();
      }
    });
  },
  { threshold: 0.5 }
);

if (chartBars.length) chartObserver.observe(chartBars[0].closest('.feature-card'));

// ============================================================
// CLICK-MAP ANIMATION (Route Mapping card)
// ============================================================
(function initClickMap() {
  const map      = document.getElementById('clickMap');
  if (!map) return;

  const cursor   = document.getElementById('mapCursor');
  const ripple   = document.getElementById('cursorRipple');
  const countEl  = document.getElementById('houseCountNum');
  const toast    = document.getElementById('houseToast');
  const streets  = [
    document.getElementById('cmStreet0'),
    document.getElementById('cmStreet1'),
    document.getElementById('cmStreet2'),
  ];

  // Each click: { streetIndex, houses, color, toastText, cursorTop%, cursorLeft% }
  const clicks = [
    { idx: 0, houses: 32, color: '#22c55e', text: '+32 houses', top: '28%', left: '38%' },
    { idx: 1, houses: 15, color: '#22c55e', text: '+15 houses', top: '54%', left: '65%' },
    { idx: 2, houses: 23, color: '#22c55e', text: '+23 houses', top: '78%', left: '28%' },
  ];

  let total = 0;
  let running = false;

  // Animate counter from current to target
  function animateCount(from, to, duration) {
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      countEl.textContent = Math.round(from + (to - from) * ease);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function moveCursor(top, left) {
    cursor.style.top  = top;
    cursor.style.left = left;
  }

  function fireClick() {
    ripple.classList.remove('firing');
    void ripple.offsetWidth; // reflow to restart animation
    ripple.classList.add('firing');
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
  }

  function highlightStreet(idx, color) {
    streets[idx].classList.add('selected');
  }

  function bumpCounter() {
    const counter = document.getElementById('houseCounter');
    counter.classList.remove('bump');
    void counter.offsetWidth;
    counter.classList.add('bump');
  }

  function resetAll() {
    streets.forEach(s => s.classList.remove('selected'));
    total = 0;
    countEl.textContent = '0';
  }

  // Start cursor off-screen top-left
  cursor.style.top  = '10%';
  cursor.style.left = '8%';
  cursor.style.transition = 'none';

  async function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function runCycle() {
    if (running) return;
    running = true;

    resetAll();
    await wait(400);

    // Enable transitions now
    cursor.style.transition = 'top 0.55s cubic-bezier(0.22,1,0.36,1), left 0.55s cubic-bezier(0.22,1,0.36,1)';

    for (const step of clicks) {
      // Move cursor to street
      moveCursor(step.top, step.left);
      await wait(700);

      // Click
      fireClick();
      await wait(200);

      // Highlight street + update counter
      highlightStreet(step.idx, step.color);
      const from = total;
      total += step.houses;
      animateCount(from, total, 500);
      bumpCounter();
      showToast(step.text);

      await wait(2000);
    }

    // Pause showing all selected, then reset
    await wait(1200);

    // Fade out: remove selected classes one by one
    for (const s of streets) {
      s.classList.remove('selected');
      await wait(300);
    }

    await wait(400);
    running = false;
    runCycle();
  }

  // Start when the card scrolls into view
  const mapObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !running) runCycle();
    });
  }, { threshold: 0.4 });

  mapObserver.observe(map);
})();

// ============================================================
// CAMPAIGN DEMO ANIMATION (Campaign Management card)
// ============================================================
(function initCampDemo() {
  const demo = document.getElementById('campDemo');
  if (!demo) return;

  const campaigns = [
    { name: 'Spring Rush',    type: 'Door Hangers', placed: '1,240', spend: '$496', cost: '$0.40' },
    { name: 'Mulch Campaign', type: 'Yard Signs',   placed: '85',    spend: '$340', cost: '$4.00' },
    { name: 'Fall Promo',     type: 'Postcards',    placed: '2,100', spend: '$630', cost: '$0.30' },
  ];

  const items    = [0, 1, 2].map(i => document.getElementById(`campItem${i}`));
  const cursor   = document.getElementById('campCursor');
  const ripple   = document.getElementById('campRipple');
  const nameEl   = document.getElementById('campDetailName');
  const typeEl   = document.getElementById('campStatType');
  const placedEl = document.getElementById('campStatPlaced');
  const spendEl  = document.getElementById('campStatSpend');
  const costEl   = document.getElementById('campStatCost');

  let running = false;

  function getCursorPos(idx) {
    const demoRect = demo.getBoundingClientRect();
    const itemRect = items[idx].getBoundingClientRect();
    const top  = ((itemRect.top  - demoRect.top  + itemRect.height / 2) / demoRect.height * 100).toFixed(1) + '%';
    const left = ((itemRect.left - demoRect.left + 20)                  / demoRect.width  * 100).toFixed(1) + '%';
    return { top, left };
  }

  function flashStat(el, val) {
    el.classList.remove('updating');
    void el.offsetWidth;
    el.textContent = val;
    el.classList.add('updating');
  }

  function selectCampaign(idx) {
    items.forEach((it, i) => it.classList.toggle('selected', i === idx));
    const c = campaigns[idx];
    flashStat(nameEl,   c.name);
    flashStat(typeEl,   c.type);
    flashStat(placedEl, c.placed);
    flashStat(spendEl,  c.spend);
    flashStat(costEl,   c.cost);
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function runCycle() {
    if (running) return;
    running = true;

    for (let i = 0; i < campaigns.length; i++) {
      const pos = getCursorPos(i);
      cursor.style.top  = pos.top;
      cursor.style.left = pos.left;
      await wait(650);

      ripple.classList.remove('firing');
      void ripple.offsetWidth;
      ripple.classList.add('firing');
      await wait(160);

      selectCampaign(i);
      await wait(2400);
    }

    running = false;
    runCycle();
  }

  // Initialise with first campaign selected
  selectCampaign(0);

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting && !running) runCycle(); });
  }, { threshold: 0.4 });

  obs.observe(demo);
})();
