/* Farmers Party – front-end logic.
   Calls Spring Boot at API/*; falls back to the built-in data below if the API is unreachable. */

/* ---------- Mobile menu (kept first so an error elsewhere can't break it) ---------- */
document.addEventListener('click', (e) => {
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  if (!btn || !nav) return;
  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close' : 'Menu';
  };
  if (e.target.closest('.menu-btn')) { setOpen(!nav.classList.contains('open')); return; }
  // tapping a link, or anywhere outside the header, closes the menu
  if (nav.classList.contains('open') && (e.target.closest('#nav a') || !e.target.closest('.hdr'))) setOpen(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const nav = document.getElementById('nav'), btn = document.querySelector('.menu-btn');
  if (nav && btn && nav.classList.contains('open')) {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Menu';
  }
});

/* ---------- Scroll reveal ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

function observeReveals() {
  document.querySelectorAll('.reveal:not(.active)').forEach((node) => revealObserver.observe(node));
}

document.addEventListener('DOMContentLoaded', () => {
  // Add the reveal class to major blocks so they animate on scroll
  document.querySelectorAll(
    '.hero-txt, .hero .ph, .sec h2, .lead, .qa, .pcard, .notice-link, ' +
    '.card-pad, .events .card, .cta-in, .intro h1, .intro p, ' +
    '.acc .card, .contact .info, .contact .map, .objection'
  ).forEach((node) => node.classList.add('reveal'));
  observeReveals();
});

/* ---------- Data and forms ---------- */
(() => {
  const API = 'https://api.farmersparty.ke/website-api';
  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) k === 'text' ? (n.textContent = v) : n.setAttribute(k, v);
    n.append(...kids);
    return n;
  };
  async function api(path, opts) {
    const res = await fetch(API + path, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, ...opts });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.status === 204 ? null : res.json();
  }
  // Use the API result only if it is a non-empty list; otherwise use the built-in fallback.
  const load = (path, fallback) =>
    api(path).then((d) => (Array.isArray(d) && d.length ? d : fallback)).catch(() => fallback);

  /* ----- Agenda accordion -----
     GET /api/pillars -> [{ title, body }]
     EDIT THE TEXT BELOW: replace each body with the party's real position. */
  const PILLARS = [
    { title: 'Coffee and tea', body: '[Party position on Coffee and tea, to be provided by the policy committee.]' },
    { title: 'Dairy and livestock', body: '[Party position on Dairy and livestock, to be provided by the policy committee.]' },
    { title: 'Fertilizer and inputs', body: '[Party position on Fertilizer and inputs, to be provided by the policy committee.]' },
    { title: 'Markets and fair prices', body: '[Party position on Markets and fair prices, to be provided by the policy committee.]' },
    { title: 'Land, water and irrigation', body: '[Party position on Land, water and irrigation, to be provided by the policy committee.]' },
    { title: 'Workers and fair livelihoods', body: '[Party position on Workers and fair livelihoods, to be provided by the policy committee.]' },
    { title: 'Women, youth and persons with disability', body: '[Party position on Women, youth and persons with disability, to be provided by the policy committee.]' },
    { title: 'Environment and social justice', body: '[Party position on Environment and social justice, to be provided by the policy committee.]' },
    { title: 'Accountable leadership and the rule of law', body: '[Party position on Accountable leadership and the rule of law, to be provided by the policy committee.]' }
  ];

  async function initAgenda() {
    const box = $('#pillars'); if (!box) return;
    const pillars = await load('/pillars', PILLARS);
    let open = pillars[0]?.title;
    const render = (focusIdx) => {
      box.replaceChildren(...pillars.map((p, i) => {
        const isOpen = p.title === open, id = 'pillar-' + i;
        const btn = el('button', { type: 'button', 'aria-expanded': String(isOpen), 'aria-controls': id },
          el('span', { text: p.title }), el('span', { 'aria-hidden': 'true', text: isOpen ? '−' : '+' }));
        btn.addEventListener('click', () => { open = isOpen ? '' : p.title; render(i); });
        const body = el('p', { id, text: p.body }); body.hidden = !isOpen;
        return el('div', { class: 'card' }, btn, body);
      }));
      if (focusIdx !== undefined) box.querySelectorAll('button')[focusIdx].focus();
      observeReveals();
    };
    render();
  }

  /* ----- Notices -----
     GET /api/notices -> [{ category, date, title, reference, postedOn, pdfUrl }] */
  const NOTICES = [
    { category: 'Gazette', date: '14 AUG 2026', title: 'Change of party slogan', reference: 'Gazette Notice No. 13185', postedOn: '[date]', pdfUrl: '#' },
    { category: 'Constitution', date: '[DATE]', title: '[Amendment to the party constitution]', reference: '[Gazette Notice No.]', postedOn: '[date]', pdfUrl: '#' },
    { category: 'Officials', date: '[DATE]', title: '[Change of party officials]', reference: '[Gazette Notice No.]', postedOn: '[date]', pdfUrl: '#' },
    { category: 'Press', date: '[DATE]', title: '[Title of press statement]', reference: '[Ref. No.]', postedOn: '[date]', pdfUrl: '#' }
  ];
  async function initNotices() {
    const list = $('#notice-list'); if (!list) return;
    const all = await load('/notices', NOTICES);
    const chips = [...document.querySelectorAll('.chip')];
    const render = (f) => {
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
      list.replaceChildren(...all.filter((n) => f === 'All' || n.category === f).map((n) =>
        el('article', { class: 'card' },
          el('span', { class: 'tag', text: `${n.category.toUpperCase()} · ${n.date}` }),
          el('h2', { text: n.title }),
          el('span', { class: 'ref', text: n.reference }),
          el('div', { class: 'foot-row' }, el('span', { text: 'Posted on website: ' + n.postedOn }),
            el('a', { href: n.pdfUrl || '#', text: 'Download PDF' })))));
      observeReveals();
    };
    chips.forEach((c) => c.addEventListener('click', () => render(c.dataset.filter)));
    render('All');
  }

  /* ----- Join form -----
     GET  /api/counties -> [{ name, coordinatorName, coordinatorPhone }]
     POST /api/members/interest  { fullName, phone, county, ward, volunteer, standForOffice, smsUpdates } */
  const COUNTIES = ['Nairobi', 'Nakuru', 'Kiambu', 'Murang’a', 'Nyeri', 'Meru', 'Uasin Gishu', 'Trans Nzoia', 'Kericho', 'Bungoma', 'Kisii', 'Machakos']
    .map((name) => ({ name, coordinatorName: '[Name]', coordinatorPhone: '[Phone]' }));
  async function initJoin() {
    const form = $('#join-form'); if (!form) return;
    const sel = $('#county'), info = $('#coordinator'), ok = $('#sent'), err = $('#error');
    const counties = await load('/counties', COUNTIES);
    counties.forEach((c) => sel.append(el('option', { value: c.name, text: c.name })));
    sel.addEventListener('change', () => {
      const c = counties.find((x) => x.name === sel.value);
      info.hidden = !c;
      if (c) info.replaceChildren(el('strong', { text: `${c.name} County coordinator:` }), ` ${c.coordinatorName} · ${c.coordinatorPhone}`);
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); ok.hidden = err.hidden = true;
      const f = new FormData(form);
      const payload = { fullName: f.get('fullName'), phone: f.get('phone'), county: f.get('county'), ward: f.get('ward'),
        volunteer: f.has('volunteer'), standForOffice: f.has('standForOffice'), smsUpdates: f.has('smsUpdates') };
      try { await api('/members/interest', { method: 'POST', body: JSON.stringify(payload) }); form.reset(); info.hidden = true; ok.hidden = false; }
      catch { err.hidden = false; }
    });
  }

  initAgenda(); initNotices(); initJoin();
})();
