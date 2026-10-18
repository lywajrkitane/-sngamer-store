/* SNGAMER STORE — customer legacy dialog bridge
   Replaces any remaining native confirm used by the old customer-order UI. */
(function () {
  'use strict';
  if (window.__sngCustomerLegacyBridgeV1) return;
  window.__sngCustomerLegacyBridgeV1 = true;

  function orderIdFromButton(button) {
    const card = button.closest('.sgaOrder, [data-order-id], .order-card, article, section');
    const explicit = card?.getAttribute?.('data-order-id');
    if (explicit && /^\d+$/.test(explicit)) return Number(explicit);
    const text = card?.textContent || '';
    const match = text.match(/Commande\s*#(\d+)/i);
    return match ? Number(match[1]) : null;
  }

  async function hideOrder(button) {
    const id = orderIdFromButton(button);
    if (!id) {
      await window.sngPremiumAlert?.('Impossible d’identifier cette commande.', { title: 'Action impossible', icon: '⚠️', confirmText: 'Fermer' });
      return;
    }

    const ok = await window.sngPremiumConfirm(
      'Cette action retire uniquement cette commande de votre historique personnel. Elle ne supprime pas la commande du système SNGAMER STORE.',
      {
        title: 'Supprimer de mon espace',
        icon: '🗑️',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        danger: true
      }
    );
    if (!ok) return;

    try {
      const response = await fetch('/api/customer/orders/' + encodeURIComponent(id) + '/hide', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de supprimer la commande.');

      if (typeof window.sngRefreshAccount === 'function') {
        await window.sngRefreshAccount();
      } else {
        button.closest('.sgaOrder, [data-order-id], .order-card, article, section')?.remove();
      }
    } catch (error) {
      await window.sngPremiumAlert?.(error.message || 'Impossible de supprimer la commande.', {
        title: 'Action impossible', icon: '⚠️', confirmText: 'Fermer'
      });
    }
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest?.('button, a');
    if (!button) return;
    const label = (button.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!label.includes('supprimer de mon espace')) return;

    // Capture before legacy inline onclick/handlers can invoke the Android native confirm().
    event.preventDefault();
    event.stopImmediatePropagation();
    hideOrder(button);
  }, true);
})();
