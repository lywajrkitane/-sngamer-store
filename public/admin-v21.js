/* SNGAMER STORE — ADMIN V2.1 FINAL ORDERS WORKSPACE */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = n => new Intl.NumberFormat('fr-FR').format(Number(n) || 0) + ' FCFA';
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[m]));

  let orders = [];
  let filter = 'Toutes';
  let query = '';
  let page = 1;
  const pageSize = 25;

  function customer(o) {
    let c = o?.customer || o?.customer_info || {};
    if (typeof c === 'string') { try { c = JSON.parse(c); } catch (_) { c = {}; } }
    return c || {};
  }

  function bucket(status) {
    const s = String(status || 'Nouvelle').toLowerCase();
    if (s.includes('livr')) return 'Livrées';
    if (s.includes('expédi') || s.includes('exped')) return 'Expédiées';
    if (s.includes('préparation') || s.includes('preparation') || s.includes('confirm')) return 'En cours';
    if (s.includes('annul')) return 'Annulées';
    return 'À traiter';
  }

  function findOrdersSection() {
    return [...$$('#adminBox > section')].find(s => /commandes/i.test($('h2', s)?.textContent || '')) || null;
  }

  function injectStyles() {
    if ($('#sng-v21-final-css')) return;
    const style = document.createElement('style');
    style.id = 'sng-v21-final-css';
    style.textContent = `
      #sngFinalOrders{margin-top:0}
      #sngFinalOrders .sng-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:16px}
      #sngFinalOrders .sng-head h2{margin:0 0 4px;font-size:24px}
      #sngFinalOrders .sng-head p{margin:0;color:#8fa0b5;font-size:13px}
      #sngFinalOrders .sng-refresh{border:1px solid rgba(75,140,255,.28);background:#111d2b;color:#fff;border-radius:11px;padding:10px 14px}
      #sngFinalOrders .sng-search{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:0 14px;border:1px solid rgba(75,140,255,.24);background:#09111b;border-radius:12px}
      #sngFinalOrders .sng-search input{margin:0!important;border:0!important;outline:0;background:transparent!important;box-shadow:none!important;padding:13px 0!important}
      #sngFinalOrders .sng-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:5px;margin-bottom:14px;scrollbar-width:none}
      #sngFinalOrders .sng-tabs::-webkit-scrollbar{display:none}
      #sngFinalOrders .sng-tab{white-space:nowrap;background:#101a27;color:#aebbd0;border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:9px 13px}
      #sngFinalOrders .sng-tab.active{background:linear-gradient(135deg,#187cff,#7a35ff);color:#fff;border-color:transparent}
      #sngFinalOrders .sng-list{display:flex;flex-direction:column;gap:8px}
      #sngFinalOrders .sng-row{display:grid;grid-template-columns:90px minmax(0,1fr) auto;align-items:center;gap:14px;padding:12px 14px;background:linear-gradient(145deg,#101a24,#0b121a);border:1px solid rgba(75,140,255,.16);border-radius:13px;min-height:66px}
      #sngFinalOrders .sng-id{font-weight:900;color:#67a9ff;font-size:14px}
      #sngFinalOrders .sng-client{min-width:0}
      #sngFinalOrders .sng-client strong{display:block;color:#fff;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #sngFinalOrders .sng-client span{display:block;color:#8fa0b5;font-size:12px;margin-top:3px}
      #sngFinalOrders .sng-status{font-size:11px;color:#a9b7ca;margin-top:4px}
      #sngFinalOrders .sng-detail{white-space:nowrap;border:1px solid rgba(75,140,255,.3);background:linear-gradient(135deg,#176dff,#8330ff);color:#fff;border-radius:10px;padding:9px 12px;font-weight:800}
      #sngFinalOrders .sng-empty{text-align:center;color:#8190a2;padding:35px 15px;border:1px dashed rgba(255,255,255,.1);border-radius:13px}
      #sngFinalOrders .sng-pages{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;color:#91a0b5;font-size:13px}
      #sngFinalOrders .sng-page-btn{background:#101a27;color:#fff;border:1px solid rgba(255,255,255,.09);border-radius:9px;padding:8px 12px}
      #sngFinalOrders .sng-page-btn:disabled{opacity:.35}
      #sngFinalOrders .sng-modal{display:none;position:fixed;inset:0;z-index:10050;background:rgba(2,5,9,.78);backdrop-filter:blur(8px);padding:15px;align-items:center;justify-content:center}
      #sngFinalOrders .sng-modal.show{display:flex}
      #sngFinalOrders .sng-modal-box{width:min(520px,100%);max-height:88vh;overflow:auto;background:linear-gradient(145deg,#111c29,#09111a);border:1px solid rgba(75,140,255,.25);border-radius:18px;padding:18px;box-shadow:0 25px 80px rgba(0,0,0,.55)}
      #sngFinalOrders .sng-modal-top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
      #sngFinalOrders .sng-modal-top h3{margin:0;font-size:19px}
      #sngFinalOrders .sng-close{width:38px;height:38px;border-radius:10px;background:#172335;color:#fff;font-size:23px;padding:0}
      #sngFinalOrders .sng-info{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      #sngFinalOrders .sng-info div{background:#0b141e;border:1px solid rgba(255,255,255,.07);border-radius:11px;padding:10px}
      #sngFinalOrders .sng-info small{display:block;color:#8190a2;font-size:11px;margin-bottom:4px}
      #sngFinalOrders .sng-info b{font-size:13px;color:#fff;overflow-wrap:anywhere}
      #sngFinalOrders .sng-products{margin-top:12px;border-top:1px solid rgba(255,255,255,.07);padding-top:10px}
      #sngFinalOrders .sng-product{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:13px}
      #sngFinalOrders .sng-modal select{width:100%;margin-top:12px;padding:11px;border-radius:10px;background:#101d2d;color:#fff;border:1px solid rgba(75,140,255,.3)}
      @media(max-width:700px){
        #sngFinalOrders .sng-head h2{font-size:20px}
        #sngFinalOrders .sng-row{grid-template-columns:58px minmax(0,1fr) auto;gap:9px;padding:10px 9px;min-height:60px}
        #sngFinalOrders .sng-detail{padding:8px 9px;font-size:11px}
        #sngFinalOrders .sng-client strong{font-size:14px}
        #sngFinalOrders .sng-info{grid-template-columns:1fr}
        #sngFinalOrders .sng-pages{font-size:12px}
      }
    `;
    document.head.appendChild(style);
  }

  function build() {
    const section = findOrdersSection();
    if (!section || $('#sngFinalOrders')) return !!section;
    injectStyles();

    const oldWrap = $('.orders-table-wrap', section) || $('.table-wrap', section);
    if (oldWrap) oldWrap.style.display = 'none';
    $$('.refresh', section).forEach(b => b.style.display = 'none');
    const oldTitle = $('h2', section);
    if (oldTitle) oldTitle.style.display = 'none';

    const box = document.createElement('div');
    box.id = 'sngFinalOrders';
    box.innerHTML = `
      <div class="sng-head"><div><h2>🛒 Commandes</h2><p>Gestion rapide de toutes les commandes.</p></div><button class="sng-refresh" id="sngRefresh">↻ Actualiser</button></div>
      <label class="sng-search">🔎 <input id="sngSearch" type="search" placeholder="ID, nom ou numéro de téléphone…"></label>
      <div class="sng-tabs">${['Toutes','À traiter','En cours','Expédiées','Livrées','Annulées'].map(x=>`<button class="sng-tab ${x==='Toutes'?'active':''}" data-filter="${x}">${x} <b data-count="${x}">0</b></button>`).join('')}</div>
      <div class="sng-list" id="sngList"></div>
      <div class="sng-pages"><button class="sng-page-btn" id="sngPrev">‹ Précédent</button><span id="sngPageInfo">0–0</span><button class="sng-page-btn" id="sngNext">Suivant ›</button></div>
      <div class="sng-modal" id="sngModal"><div class="sng-modal-box"><div class="sng-modal-top"><h3 id="sngModalTitle">Commande</h3><button class="sng-close" id="sngClose">×</button></div><div id="sngModalContent"></div></div></div>
    `;
    section.appendChild(box);

    $('#sngSearch').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); page = 1; render(); });
    $$('.sng-tab', box).forEach(b => b.addEventListener('click', () => { filter = b.dataset.filter; page = 1; $$('.sng-tab', box).forEach(x => x.classList.toggle('active', x === b)); render(); }));
    $('#sngPrev').onclick = () => { if (page > 1) { page--; render(); } };
    $('#sngNext').onclick = () => { if (page < totalPages()) { page++; render(); } };
    $('#sngClose').onclick = closeModal;
    $('#sngModal').addEventListener('click', e => { if (e.target.id === 'sngModal') closeModal(); });
    $('#sngRefresh').onclick = () => load(true);
    return true;
  }

  function filtered() {
    return orders.filter(o => {
      const c = customer(o);
      const okFilter = filter === 'Toutes' || bucket(o.status) === filter;
      const hay = [o.id, c.name, c.phone].join(' ').toLowerCase();
      return okFilter && (!query || hay.includes(query));
    });
  }

  function totalPages() { return Math.max(1, Math.ceil(filtered().length / pageSize)); }

  function render() {
    if (!$('#sngFinalOrders')) return;
    const all = orders;
    ['Toutes','À traiter','En cours','Expédiées','Livrées','Annulées'].forEach(f => {
      const n = f === 'Toutes' ? all.length : all.filter(o => bucket(o.status) === f).length;
      const el = $(`[data-count="${f}"]`); if (el) el.textContent = n;
    });
    const list = filtered();
    const pages = totalPages();
    if (page > pages) page = pages;
    const start = (page - 1) * pageSize;
    const rows = list.slice(start, start + pageSize);
    $('#sngList').innerHTML = rows.length ? rows.map(o => {
      const c = customer(o);
      return `<div class="sng-row"><span class="sng-id">#${esc(o.id)}</span><div class="sng-client"><strong>${esc(c.name || 'Client')}</strong><span>${esc(c.phone || '—')}</span><span class="sng-status">${esc(o.status || 'Nouvelle')}</span></div><button class="sng-detail" data-order="${esc(o.id)}">Voir les détails</button></div>`;
    }).join('') : '<div class="sng-empty">Aucune commande dans cette catégorie.</div>';
    $$('.sng-detail').forEach(b => b.onclick = () => openModal(Number(b.dataset.order)));
    $('#sngPageInfo').textContent = list.length ? `${start + 1}–${Math.min(start + pageSize, list.length)} sur ${list.length}` : '0–0';
    $('#sngPrev').disabled = page <= 1;
    $('#sngNext').disabled = page >= pages;
  }

  function openModal(id) {
    const o = orders.find(x => Number(x.id) === id); if (!o) return;
    const c = customer(o);
    const items = Array.isArray(o.items) ? o.items : [];
    $('#sngModalTitle').textContent = `Commande #${o.id}`;
    $('#sngModalContent').innerHTML = `<div class="sng-info"><div><small>Client</small><b>${esc(c.name || '-')}</b></div><div><small>Téléphone</small><b>${esc(c.phone || '-')}</b></div><div><small>Adresse</small><b>${esc(c.address || '-')}</b></div><div><small>Date</small><b>${esc(new Date(o.created_at).toLocaleString('fr-FR'))}</b></div><div><small>Total</small><b>${money(o.total)}</b></div><div><small>Paiement</small><b>${esc(o.payment || '-')}</b></div></div><div class="sng-products"><strong>📦 Produits</strong>${items.length ? items.map(i => `<div class="sng-product"><span>${esc(i.name)} × ${esc(i.quantity)}</span><b>${money(Number(i.price || 0) * Number(i.quantity || 0))}</b></div>`).join('') : '<p>Aucun produit.</p>'}</div><select id="sngModalStatus">${['Nouvelle','Confirmée','En préparation','Expédiée','Livrée','Annulée'].map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>`;
    $('#sngModalStatus').onchange = () => changeStatus(id, $('#sngModalStatus').value);
    $('#sngModal').classList.add('show');
  }

  function closeModal() { $('#sngModal')?.classList.remove('show'); }

  async function changeStatus(id, status) {
    const r = await fetch('/api/admin/orders/' + id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status}) });
    if (!r.ok) { alert('Impossible de modifier le statut.'); return; }
    const o = orders.find(x => Number(x.id) === Number(id)); if (o) o.status = status;
    render();
    openModal(id);
  }

  async function load(force) {
    try {
      const r = await fetch('/api/admin/orders', { cache: force ? 'no-store' : 'default' });
      if (r.status === 401) return;
      const data = await r.json();
      if (Array.isArray(data)) orders = data;
      build();
      render();
    } catch (_) {}
  }

  function boot() {
    load();
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      build();
      render();
      if ($('#sngFinalOrders') || tries > 40) clearInterval(timer);
    }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();