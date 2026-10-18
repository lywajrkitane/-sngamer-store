/* SNGAMER STORE — ADMIN REFUND UI
   Dedicated refund controls for the V2.1 orders modal.
   Payment status and refund status are intentionally kept separate.
*/
(function () {
  'use strict';

  const STATE = '__sngAdminRefundUiV1';
  if (window[STATE]) return;
  window[STATE] = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const money = value => new Intl.NumberFormat('fr-FR').format(Number(value) || 0) + ' FCFA';
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
    "'": '&#039;'
  }[char]));

  let observer = null;
  let renderTimer = null;
  let activeOrderId = null;

  function normalizePayment(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizeRefund(value) {
    const status = String(value || 'Aucun').trim();
    if (!status) return 'Aucun';
    if (status === 'Echec') return 'Échec';
    return status;
  }

  function orderIdFromModal() {
    const title = $('#sngModalTitle')?.textContent || '';
    const match = title.match(/#(\d+)/);
    return match ? Number(match[1]) : null;
  }

  async function getOrder(id) {
    const response = await fetch('/api/admin/orders', {
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Impossible de récupérer la commande.');
    const orders = await response.json();
    if (!Array.isArray(orders)) throw new Error('Réponse commandes invalide.');
    return orders.find(order => Number(order.id) === Number(id)) || null;
  }

  function sanitizePaymentSelect() {
    const select = $('#sngModalPayment');
    if (!select) return;

    const oldValue = String(select.value || '').trim().toLowerCase();
    Array.from(select.options || []).forEach(option => {
      const text = String(option.textContent || '').trim().toLowerCase();
      if (text === 'remboursement demandé' || text === 'remboursé') option.remove();
    });

    if (oldValue === 'remboursement demandé' || oldValue === 'remboursé') {
      const paid = Array.from(select.options).find(option =>
        ['payé', 'paye'].includes(String(option.textContent || '').trim().toLowerCase())
      );
      if (paid) select.value = paid.value;
    }
  }

  function installStyles() {
    if ($('#sg-refund-ui-style')) return;
    const style = document.createElement('style');
    style.id = 'sg-refund-ui-style';
    style.textContent = `
      .sg-refund-box{margin-top:16px;padding:14px;border:1px solid rgba(75,140,255,.22);border-radius:13px;background:linear-gradient(145deg,#0d1723,#09111a)}
      .sg-refund-box h4{margin:0 0 10px;color:#fff;font-size:14px;font-weight:900}
      .sg-refund-status{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:9px 0;color:#aebbd0;font-size:13px}
      .sg-refund-status strong{color:#fff}
      .sg-refund-meta{margin:8px 0 0;color:#8999ad;font-size:11px;line-height:1.5}
      .sg-refund-message{margin:10px 0 0;padding:9px 10px;border-radius:9px;background:rgba(75,140,255,.07);color:#aebbd0;font-size:11px;line-height:1.5}
      .sg-refund-action{width:100%;margin-top:12px;padding:11px 12px;border:0;border-radius:10px;background:linear-gradient(135deg,#a9233b,#d33b55);color:#fff;font-weight:900;cursor:pointer}
      .sg-refund-confirm{background:linear-gradient(135deg,#166534,#1f8b4c)}
      .sg-refund-success{margin-top:10px;color:#86efac;font-size:12px;font-weight:800;line-height:1.5}
      .sg-refund-warning{margin-top:10px;color:#e8c56d;font-size:12px;line-height:1.5}
      .sg-refund-disabled{margin-top:10px;color:#8f9db3;font-size:11px;line-height:1.5}
    `;
    document.head.appendChild(style);
  }

  function buttonLabel(order, refundStatus, paymentStatus) {
    if (refundStatus === 'En cours') return '✅ Confirmer le remboursement effectué';
    if (!['payé', 'paye', 'paid'].includes(paymentStatus)) return '';
    if (!order.paytech_ref) return '';
    if (refundStatus === 'Remboursé') return '';
    return '↩️ Rembourser la totalité — ' + money(order.total);
  }

  function buildRefundHtml(order) {
    const paymentStatus = normalizePayment(order.payment_status || 'En attente');
    const refundStatus = normalizeRefund(order.refund_status || 'Aucun');
    const action = buttonLabel(order, refundStatus, paymentStatus);

    let body = `
      <div class="sg-refund-box" id="sgRefundBox" data-order-id="${Number(order.id)}">
        <h4>↩️ Remboursement</h4>
        <div class="sg-refund-status"><span>Statut</span><strong>${esc(refundStatus)}</strong></div>
    `;

    if (order.refund_requested_at) {
      body += `<div class="sg-refund-meta">Demande : ${esc(new Date(order.refund_requested_at).toLocaleString('fr-FR'))}</div>`;
    }
    if (order.refunded_at) {
      body += `<div class="sg-refund-meta">Confirmé le : ${esc(new Date(order.refunded_at).toLocaleString('fr-FR'))}</div>`;
    }
    if (order.refund_provider_message) {
      body += `<div class="sg-refund-message">${esc(order.refund_provider_message)}</div>`;
    }

    if (refundStatus === 'Remboursé') {
      body += `<div class="sg-refund-success">✅ Remboursement confirmé. Cette commande est exclue du chiffre d'affaires.</div>`;
    } else if (refundStatus === 'En cours') {
      body += `<button type="button" class="sg-refund-action sg-refund-confirm" id="sgRefundAction">${action}</button>`;
      body += `<div class="sg-refund-warning">Confirme uniquement après vérification dans le back-office PayTech que le remboursement est terminé.</div>`;
    } else if (action) {
      body += `<button type="button" class="sg-refund-action" id="sgRefundAction">${action}</button>`;
      body += `<div class="sg-refund-warning">Remboursement total via PayTech. Ne clique qu'une seule fois et vérifie le résultat avant de relancer.</div>`;
    } else if (!['payé', 'paye', 'paid'].includes(paymentStatus)) {
      body += `<div class="sg-refund-disabled">Le remboursement sera disponible uniquement lorsque le paiement est marqué « Payé ».</div>`;
    } else if (!order.paytech_ref) {
      body += `<div class="sg-refund-disabled">Aucune référence PayTech n'est enregistrée pour cette commande. Le remboursement automatique ne peut pas être lancé depuis cette fiche.</div>`;
    }

    body += '</div>';
    return body;
  }

  async function performRefund(id) {
    const response = await fetch('/api/admin/orders/' + encodeURIComponent(id) + '/refund', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Impossible de lancer le remboursement.');
    alert(result.message || 'Demande de remboursement envoyée à PayTech.');
  }

  async function performConfirmRefund(id) {
    const response = await fetch('/api/admin/orders/' + encodeURIComponent(id) + '/refund/confirm', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Impossible de confirmer le remboursement.');
    alert(result.message || 'Remboursement enregistré.');
  }

  async function handleRefundAction(order) {
    const id = Number(order.id);
    const refundStatus = normalizeRefund(order.refund_status || 'Aucun');

    if (refundStatus === 'En cours') {
      if (!confirm('As-tu vérifié dans le back-office PayTech que le remboursement de la commande #' + id + ' est bien terminé ?\n\nNe confirme pas si PayTech affiche encore un remboursement en attente.')) return;
      await performConfirmRefund(id);
    } else {
      if (!confirm('Confirmer le remboursement TOTAL de la commande #' + id + ' via PayTech ?\n\nLe montant total de ' + money(order.total) + ' sera remboursé. Cette opération ne peut pas être annulée.')) return;
      await performRefund(id);
    }

    await refreshModal(id);
  }

  async function refreshModal(id) {
    const order = await getOrder(id);
    if (!order) return;
    activeOrderId = id;
    renderRefundPanel(order);

    const refreshButton = $('#sngRefresh');
    if (refreshButton) refreshButton.click();
  }

  function renderRefundPanel(order) {
    const content = $('#sngModalContent');
    if (!content) return;

    sanitizePaymentSelect();
    const old = $('#sgRefundBox', content);
    if (old) old.remove();

    const deleteButton = $('#sngDeleteOrder', content);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildRefundHtml(order);
    const panel = wrapper.firstElementChild;
    if (!panel) return;

    if (deleteButton) content.insertBefore(panel, deleteButton);
    else content.appendChild(panel);

    const action = $('#sgRefundAction', panel);
    if (action) {
      action.addEventListener('click', async () => {
        action.disabled = true;
        try {
          await handleRefundAction(order);
        } catch (error) {
          console.error('ADMIN_REFUND_UI_ERROR:', error);
          alert(error.message || 'Erreur lors du remboursement.');
          action.disabled = false;
        }
      });
    }
  }

  async function enhanceCurrentModal() {
    const modal = $('#sngModal');
    const content = $('#sngModalContent');
    if (!modal || !content || !modal.classList.contains('show')) return;

    const id = orderIdFromModal();
    if (!id) return;
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(async () => {
      try {
        const order = await getOrder(id);
        if (order) {
          activeOrderId = id;
          renderRefundPanel(order);
        }
      } catch (error) {
        console.error('ADMIN_REFUND_PANEL_LOAD_ERROR:', error);
      }
    }, 20);
  }

  function installObserver() {
    const content = $('#sngModalContent');
    if (!content || observer) return;
    observer = new MutationObserver(() => enhanceCurrentModal());
    observer.observe(content, { childList: true, subtree: true });
  }

  function boot() {
    installStyles();
    installObserver();
    enhanceCurrentModal();

    document.addEventListener('click', event => {
      if (!event.target.closest('.sng-detail')) return;
      window.setTimeout(enhanceCurrentModal, 60);
    }, true);

    window.setInterval(() => {
      sanitizePaymentSelect();
      if ($('#sngModal')?.classList.contains('show')) enhanceCurrentModal();
    }, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
