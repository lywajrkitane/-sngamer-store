/* SNGAMER STORE — ADMIN REFUND UI V2 */
(function () {
  'use strict';
  if (window.__sngAdminRefundUiV2) return;
  window.__sngAdminRefundUiV2 = true;

  const $ = (s, r = document) => r.querySelector(s);
  const money = n => new Intl.NumberFormat('fr-FR').format(Number(n) || 0) + ' FCFA';
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[c]));

  function paymentNorm(v) { return String(v || '').trim().toLowerCase(); }
  function refundNorm(v) { return String(v || 'Aucun').trim() || 'Aucun'; }
  function orderStatusNorm(v) { return String(v || '').trim().toLowerCase(); }
  function modalId() {
    const m = ($('#sngModalTitle')?.textContent || '').match(/#(\d+)/);
    return m ? Number(m[1]) : null;
  }

  async function getOrder(id) {
    const r = await fetch('/api/admin/orders', { credentials:'same-origin', cache:'no-store' });
    if (!r.ok) throw new Error('Impossible de récupérer la commande.');
    const data = await r.json();
    return Array.isArray(data) ? data.find(o => Number(o.id) === Number(id)) : null;
  }

  function sanitizePayment() {
    const select = $('#sngModalPayment');
    if (!select) return;
    const old = paymentNorm(select.value);
    Array.from(select.options).forEach(option => {
      const text = paymentNorm(option.textContent);
      if (text === 'remboursement demandé' || text === 'remboursé') option.remove();
    });
    if (old === 'remboursement demandé' || old === 'remboursé') {
      const paid = Array.from(select.options).find(o => ['payé','paye'].includes(paymentNorm(o.textContent)));
      if (paid) select.value = paid.value;
    }
  }

  function styles() {
    if ($('#sg-refund-v2-style')) return;
    const s = document.createElement('style');
    s.id = 'sg-refund-v2-style';
    s.textContent = `
      .sg-refund-v2{margin-top:16px;padding:14px;border:1px solid rgba(75,140,255,.24);border-radius:13px;background:linear-gradient(145deg,#0d1723,#09111a)}
      .sg-refund-v2 h4{margin:0 0 10px;color:#fff;font-size:14px;font-weight:900}
      .sg-refund-v2 .row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;color:#aebbd0;font-size:13px}
      .sg-refund-v2 .row b{color:#fff}
      .sg-refund-v2 .meta,.sg-refund-v2 .msg,.sg-refund-v2 .note,.sg-refund-v2 .ok{margin-top:9px;font-size:11px;line-height:1.5}
      .sg-refund-v2 .meta{color:#8999ad}.sg-refund-v2 .msg{padding:9px;border-radius:9px;background:rgba(75,140,255,.07);color:#aebbd0}.sg-refund-v2 .note{color:#e8c56d}.sg-refund-v2 .ok{color:#86efac;font-weight:800}
      .sg-refund-v2 button{width:100%;margin-top:12px;padding:11px;border:0;border-radius:10px;background:linear-gradient(135deg,#a9233b,#d33b55);color:#fff;font-weight:900}
      .sg-refund-v2 button.confirm{background:linear-gradient(135deg,#166534,#1f8b4c)}
      .sg-refund-v2 button:disabled{opacity:.55}
      .sg-refund-v2 .blocked{margin-top:10px;padding:10px;border-radius:9px;background:rgba(168,85,247,.07);color:#cbd5e1;line-height:1.5;font-size:12px}
    `;
    document.head.appendChild(s);
  }

  function signature(o) {
    return [o.id,o.status,o.payment_status,o.refund_status,o.paytech_ref,o.refund_requested_at,o.refunded_at,o.refund_provider_message,o.total].map(v=>String(v ?? '')).join('|');
  }

  function render(o) {
    const content = $('#sngModalContent');
    if (!content) return;
    sanitizePayment();
    const sig = signature(o);
    const existing = $('#sgRefundV2', content);
    if (existing && existing.dataset.signature === sig) return;
    if (existing) existing.remove();

    const payment = paymentNorm(o.payment_status || 'En attente');
    const refund = refundNorm(o.refund_status);
    const orderStatus = orderStatusNorm(o.status);
    const paid = ['payé','paye','paid'].includes(payment);
    const delivered = orderStatus === 'livrée' || orderStatus === 'livree' || orderStatus === 'delivered';
    const canStart = paid && !!o.paytech_ref && !delivered && refund !== 'Remboursé' && refund !== 'En cours';

    const box = document.createElement('div');
    box.id = 'sgRefundV2';
    box.className = 'sg-refund-v2';
    box.dataset.signature = sig;
    let html = `<h4>↩️ Remboursement</h4><div class="row"><span>Statut</span><b>${esc(refund)}</b></div>`;
    if (o.refund_requested_at) html += `<div class="meta">Demande : ${esc(new Date(o.refund_requested_at).toLocaleString('fr-FR'))}</div>`;
    if (o.refunded_at) html += `<div class="meta">Confirmé le : ${esc(new Date(o.refunded_at).toLocaleString('fr-FR'))}</div>`;
    if (o.refund_provider_message) html += `<div class="msg">${esc(o.refund_provider_message)}</div>`;

    if (refund === 'Remboursé') {
      html += `<div class="ok">✅ Remboursement confirmé. Cette commande est exclue du chiffre d'affaires.</div>`;
    } else if (refund === 'En cours') {
      html += `<button id="sgRefundV2Action" class="confirm">✅ Confirmer le remboursement effectué</button><div class="note">Confirme uniquement après vérification dans le back-office PayTech.</div>`;
    } else if (delivered) {
      html += `<div class="blocked">🔒 <strong>Remboursement indisponible</strong><br>Cette commande a déjà été livrée. Elle ne peut plus être annulée ni remboursée.</div>`;
    } else if (canStart) {
      html += `<button id="sgRefundV2Action">↩️ Rembourser la totalité — ${esc(money(o.total))}</button><div class="note">Remboursement total via PayTech. Ne clique qu'une seule fois.</div>`;
    } else if (!paid) {
      html += `<div class="note">Le remboursement sera disponible lorsque le paiement sera marqué « Payé ».</div>`;
    } else if (!o.paytech_ref) {
      html += `<div class="note">Aucune référence PayTech n'est enregistrée pour cette commande.</div>`;
    }

    box.innerHTML = html;
    const del = $('#sngDeleteOrder', content);
    if (del) content.insertBefore(box, del); else content.appendChild(box);

    const action = $('#sgRefundV2Action', box);
    if (!action) return;
    action.onclick = async () => {
      const id = Number(o.id);
      action.disabled = true;
      try {
        if (refund === 'En cours') {
          if (!confirm('As-tu vérifié dans le back-office PayTech que le remboursement de la commande #' + id + ' est bien terminé ?\n\nNe confirme pas si PayTech affiche encore un remboursement en attente.')) { action.disabled=false; return; }
          await post('/api/admin/orders/' + encodeURIComponent(id) + '/refund/confirm', 'Impossible de confirmer le remboursement.');
        } else {
          if (delivered) {
            alert('Cette commande est déjà livrée. Le remboursement est bloqué.');
            action.disabled=false;
            return;
          }
          if (!confirm('Confirmer le remboursement TOTAL de la commande #' + id + ' via PayTech ?\n\nMontant : ' + money(o.total) + '. Cette opération ne peut pas être annulée.')) { action.disabled=false; return; }
          await post('/api/admin/orders/' + encodeURIComponent(id) + '/refund', 'Impossible de lancer le remboursement.');
        }
        const fresh = await getOrder(id);
        if (fresh) render(fresh);
        $('#sngRefresh')?.click();
      } catch (e) {
        console.error('ADMIN_REFUND_V2_ERROR:', e);
        alert(e.message || 'Erreur lors du remboursement.');
        action.disabled = false;
      }
    };
  }

  async function post(url, fallback) {
    const r = await fetch(url, { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:'{}' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || fallback);
    alert(data.message || 'Opération enregistrée.');
  }

  async function enhance() {
    const modal = $('#sngModal');
    if (!modal || !modal.classList.contains('show')) return;
    const id = modalId();
    if (!id) return;
    try { const o = await getOrder(id); if (o) render(o); }
    catch (e) { console.error('ADMIN_REFUND_V2_LOAD_ERROR:', e); }
  }

  function boot() {
    styles();
    document.addEventListener('click', e => {
      if (e.target.closest('.sng-detail')) setTimeout(enhance, 80);
    }, true);
    const content = $('#sngModalContent');
    if (content) {
      const observer = new MutationObserver(() => {
        sanitizePayment();
        if ($('#sngModal')?.classList.contains('show') && !$('#sgRefundV2')) setTimeout(enhance, 20);
      });
      observer.observe(content, { childList:true, subtree:true });
    }
    setInterval(() => {
      sanitizePayment();
      if ($('#sngModal')?.classList.contains('show') && !$('#sgRefundV2')) enhance();
    }, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
