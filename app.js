'use strict';
// ---- Settings: change these ----
const WHATSAPP = '918302725757';   // country code + number, no "+"
const ARTISAN_SHARE = 0.6;         // share of order value assumed to reach artisans

const PAGES = ['home', 'register', 'market', 'collab', 'impact'];
const STAGES = ['Idea sent', 'Artisan matched', 'In production', 'Listed on ROOH'];
const CRAFT = { Namda: ['🧶', '#f0c27b'], Embroidery: ['🪡', '#f2a6a0'], Weaving: ['🧵', '#9fd0d0'],
  'Tribal Painting': ['🎨', '#f6d365'], Bamboo: ['🧺', '#c9d99a'], Terracotta: ['🏺', '#e8a37a'], Other: ['✨', '#ddd0f0'] };

// Demo data (sample names, for illustration only)
const SEED = {
  artisans: [
    { id: 'a1', name: 'Savitri Bai', village: 'Niwai', district: 'Tonk', craft: 'Namda', products: 'Namda rugs, felt coasters', cap: 40, women: true },
    { id: 'a2', name: 'Rafiq Khan', village: 'Tonk', district: 'Tonk', craft: 'Namda', products: 'Namda carpets, woollen wall art', cap: 25, women: false },
    { id: 'a3', name: 'Kamla Garasia', village: 'Gogunda', district: 'Udaipur', craft: 'Embroidery', products: 'Cushion covers, hand-embroidered bags', cap: 60, women: true },
    { id: 'a4', name: 'Sukhram Bhil', village: 'Banswara', district: 'Banswara', craft: 'Tribal Painting', products: 'Dot-style Bhil paintings', cap: 15, women: false },
    { id: 'a5', name: 'Geeta Meena', village: 'Todaraisingh', district: 'Tonk', craft: 'Weaving', products: 'Table runners, shawls', cap: 30, women: true },
    { id: 'a6', name: 'Mohan Kumhar', village: 'Molela', district: 'Rajsamand', craft: 'Terracotta', products: 'Clay plaques, tea-light holders', cap: 50, women: false },
    { id: 'a7', name: 'Lalita Bhil', village: 'Sagwara', district: 'Dungarpur', craft: 'Bamboo', products: 'Baskets, desk organisers', cap: 45, women: true }
  ],
  products: [
    { id: 'p1', name: 'Namda wool rug', craft: 'Namda', a: 'a1', price: 1200, type: 'Traditional' },
    { id: 'p2', name: 'Namda denim-style jacket', craft: 'Namda', a: 'a2', price: 3200, type: 'Modern' },
    { id: 'p3', name: 'Embroidered cushion cover', craft: 'Embroidery', a: 'a3', price: 650, type: 'Traditional' },
    { id: 'p4', name: 'Embroidered tote bag', craft: 'Embroidery', a: 'a3', price: 899, type: 'Modern' },
    { id: 'p5', name: 'Bhil dot-painting wall art', craft: 'Tribal Painting', a: 'a4', price: 1400, type: 'Traditional' },
    { id: 'p6', name: 'Handwoven table runner', craft: 'Weaving', a: 'a5', price: 850, type: 'Traditional' },
    { id: 'p7', name: 'Terracotta elephant tea-lights', craft: 'Terracotta', a: 'a6', price: 550, type: 'Modern' },
    { id: 'p8', name: 'Molela clay wall plaque', craft: 'Terracotta', a: 'a6', price: 900, type: 'Traditional' },
    { id: 'p9', name: 'Bamboo desk organiser set', craft: 'Bamboo', a: 'a7', price: 749, type: 'Modern' },
    { id: 'p10', name: 'Bamboo gift basket', craft: 'Bamboo', a: 'a7', price: 950, type: 'Traditional' }
  ],
  orders: [
    { p: 'p9', who: 'Hotel Amber Leaf', type: 'Hotel or resort', qty: 40, total: 29960 },
    { p: 'p7', who: 'Sunrise Events', type: 'Corporate gifting', qty: 100, total: 55000 },
    { p: 'p3', who: 'Priya S.', type: 'Individual customer', qty: 2, total: 1300 }
  ],
  ideas: [
    { id: 'i1', who: 'Aanya (design student)', art: 'a2', title: 'Namda denim-style jacket', note: 'Traditional felt panels on a modern jacket cut for young buyers.', s: 2 },
    { id: 'i2', who: 'Dev Rathore', art: 'a7', title: 'Bamboo phone stand', note: 'Slim, flat-pack stand for corporate gift boxes.', s: 0 }
  ]
};

// ---- State ----
const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const clone = o => JSON.parse(JSON.stringify(o));
let S;
try { S = JSON.parse(localStorage.getItem('rooh_state')); } catch { S = null; }
if (!S || !S.artisans) S = clone(SEED);
const persist = () => { try { localStorage.setItem('rooh_state', JSON.stringify(S)); } catch { toast('Storage is full. Try a smaller photo.'); } };
const artisan = id => S.artisans.find(a => a.id === id);
let toastTimer;
function toast(m) {
  const t = $('#toast'); t.textContent = m; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}
function shrink(file) {
  return new Promise(res => {
    if (!file || !file.size) return res(null);
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 360 / img.width), c = document.createElement('canvas');
      c.width = img.width * k; c.height = img.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => res(null);
    img.src = url;
  });
}

// ---- Rendering ----
const artisanCard = a => {
  const av = a.photo ? `<img src="${a.photo}" alt="">` : `<span style="background:${(CRAFT[a.craft] || CRAFT.Other)[1]}">${esc(a.name[0])}</span>`;
  return `<article class="card ar"><div class="av">${av}</div><div><h3>${esc(a.name)}</h3>
    <p class="mut">${esc(a.craft)} from ${esc(a.village)}, ${esc(a.district)}</p><p>${esc(a.products)}</p>
    <p class="tag">${a.women ? 'Women-led. ' : ''}${a.cap} pieces a month</p></div></article>`;
};
const productCard = p => {
  const a = artisan(p.a), c = CRAFT[p.craft] || CRAFT.Other;
  return `<article class="card pr"><div class="pic" style="--c:${c[1]}">${c[0]}<b class="badge ${p.type}">${p.type}</b></div>
    <div class="pb"><h3>${esc(p.name)}</h3><p class="mut">By ${esc(a ? a.name : 'a ROOH artisan')}${a ? ', ' + esc(a.village) : ''}</p>
    <div class="row sp"><strong>${inr(p.price)}</strong><button class="btn sm" data-enq="${p.id}">Buy / Enquire</button></div></div></article>`;
};

let filter = 'All', query = '';
function renderMarket() {
  const crafts = [...new Set(S.products.map(p => p.craft))];
  $('#chips').innerHTML = ['All', 'Traditional', 'Modern', ...crafts]
    .map(c => `<button class="${c === filter ? 'on' : ''}" data-f="${esc(c)}">${esc(c)}</button>`).join('');
  const list = S.products.filter(p =>
    (filter === 'All' || p.craft === filter || p.type === filter) &&
    (p.name + p.craft).toLowerCase().includes(query));
  $('#grid').innerHTML = list.map(productCard).join('') || '<p class="mut">No products match. Try another craft or search word.</p>';
}

function renderCollab() {
  const sel = $('#cart'), v = sel.value;
  sel.innerHTML = S.artisans.map(a => `<option value="${a.id}">${esc(a.name)}: ${esc(a.craft)}, ${esc(a.village)}</option>`).join('');
  if (v) sel.value = v;
  $('#board').innerHTML = S.ideas.map(i => {
    const a = artisan(i.art);
    return `<article class="card"><h3>${esc(i.title)}</h3>
      <p class="mut">${esc(i.who)} with ${esc(a ? a.name : 'an artisan')}${a ? ' (' + esc(a.craft) + ')' : ''}</p><p>${esc(i.note)}</p>
      <ul class="stages">${STAGES.map((s, n) => `<li class="${n <= i.s ? 'done' : ''}">${s}</li>`).join('')}</ul>
      ${i.s < 3 ? `<button class="btn sm" data-adv="${i.id}">Move to next stage</button>` : ''}</article>`;
  }).join('');
}

function renderImpact() {
  const A = S.artisans, income = S.orders.reduce((t, o) => t + o.total, 0) * ARTISAN_SHARE;
  const stats = [['Artisans onboarded', A.length], ['Women beneficiaries', A.filter(a => a.women).length],
    ['Orders generated', S.orders.length], ['Artisan income', inr(income)],
    ['Villages covered', new Set(A.map(a => a.village.trim().toLowerCase())).size], ['Crafts preserved', new Set(A.map(a => a.craft)).size]];
  $('#stats').innerHTML = stats.map(([l, v]) => `<div class="card"><b>${v}</b>${l}</div>`).join('');
  const by = {}; A.forEach(a => by[a.craft] = (by[a.craft] || 0) + 1);
  const max = Math.max(1, ...Object.values(by));
  $('#bars').innerHTML = Object.entries(by).map(([c, n]) =>
    `<div class="bar-row"><span>${esc(c)}</span><i style="width:${n / max * 100}%"></i><b>${n}</b></div>`).join('');
}

function render() {
  $('#stories').innerHTML = S.artisans.slice(0, 3).map(artisanCard).join('');
  $('#joined').innerHTML = S.artisans.slice(-4).reverse().map(artisanCard).join('');
  renderMarket(); renderCollab(); renderImpact(); calc();
}
function calc() {
  const n = Math.max(0, +$('#cin').value || 0);
  $('#cout').textContent = inr(n * 1.6) + ' to ' + inr(n * 2);
}

// ---- Routing ----
function route() {
  const p = location.hash.slice(1), pg = PAGES.includes(p) ? p : 'home';
  $$('main > section').forEach(s => s.hidden = s.id !== pg);
  $$('nav a').forEach(a => a.classList.toggle('on', a.hash === '#' + pg));
  scrollTo(0, 0);
}

// ---- Events ----
$('#rcraft').innerHTML = Object.keys(CRAFT).map(c => `<option>${c}</option>`).join('');
$('#cin').oninput = calc;
$('#q').oninput = e => { query = e.target.value.trim().toLowerCase(); renderMarket(); };

$('#reg').onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  S.artisans.push({ id: 'u' + Date.now(), name: f.get('name').trim(), village: f.get('village').trim(), district: f.get('district').trim(),
    craft: f.get('craft'), products: f.get('products').trim(), cap: +f.get('cap'), phone: f.get('phone'), women: f.has('women'),
    photo: await shrink(f.get('photo')) });
  persist(); e.target.reset(); e.target.district.value = 'Tonk'; render();
  toast('Artisan registered. Welcome to ROOH!');
};

$('#idea').onsubmit = e => {
  e.preventDefault();
  const f = new FormData(e.target);
  S.ideas.unshift({ id: 'i' + Date.now(), who: f.get('who').trim(), art: f.get('art'), title: f.get('title').trim(), note: f.get('note').trim(), s: 0 });
  persist(); e.target.reset(); render(); toast('Concept sent to the artisan.');
};

let current = null;
document.addEventListener('click', e => {
  const t = e.target.closest('[data-enq],[data-f],[data-adv]');
  if (!t) return;
  if (t.dataset.f) { filter = t.dataset.f; renderMarket(); }
  if (t.dataset.adv) { const i = S.ideas.find(x => x.id === t.dataset.adv); if (i && i.s < 3) i.s++; persist(); renderCollab(); }
  if (t.dataset.enq) { current = S.products.find(p => p.id === t.dataset.enq); $('#dtitle').textContent = current.name + ' (' + inr(current.price) + ')'; $('#dlg').showModal(); }
});
$('#dno').onclick = () => $('#dlg').close();
$('#enq').onsubmit = e => {
  e.preventDefault();
  const f = new FormData(e.target), q = Math.max(1, +f.get('qty'));
  S.orders.push({ p: current.id, who: f.get('who').trim(), type: f.get('type'), qty: q, total: q * current.price });
  persist();
  const msg = `Namaste ROOH! I am ${f.get('who')} (${f.get('type')}). I would like ${q} x ${current.name} at ${inr(current.price)} each. ${f.get('note')}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  $('#dlg').close(); e.target.reset(); render(); toast('Enquiry saved. Opening WhatsApp.');
};

$('#reset').onclick = () => {
  if (!confirm('Reset all demo data? Registered artisans, orders and concepts will be removed.')) return;
  localStorage.removeItem('rooh_state'); S = clone(SEED); render(); toast('Demo data reset.');
};

addEventListener('hashchange', route);
render(); route();