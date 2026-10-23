/* Farmers Party – front-end logic.
   Calls Spring Boot at /api/*; falls back to built-in data if the API is unreachable. */
(() => {
  const API = '/api';
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
  const load = (path, fallback) => api(path).catch(() => fallback);

  /* Agenda accordion: GET /api/pillars -> [{title, body}] */
  const PILLARS = ['Coffee and tea', 'Dairy and livestock', 'Fertilizer and inputs', 'Markets and fair prices', 'Land, water and irrigation', 'Workers and fair livelihoods', 'Women, youth and persons with disability', 'Environment and social justice', 'Accountable leadership and the rule of law']
    .map((title) => ({ title, body: `[Party position on ${title}, to be provided by the policy committee.]` }));
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
    };
    render();
  }

  /* Notices: GET /api/notices -> [{category, date, title, reference, postedOn, pdfUrl}] */
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
    };
    chips.forEach((c) => c.addEventListener('click', () => render(c.dataset.filter)));
    render('All');
  }

  /* Join: GET /api/counties -> [{name, coordinatorName, coordinatorPhone}]; POST /api/members/interest */
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

/* Mobile menu toggle */
(() => {
  const btn = document.querySelector('.menu-btn'), nav = document.querySelector('#nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => btn.setAttribute('aria-expanded', String(nav.classList.toggle('open'))));
})();
