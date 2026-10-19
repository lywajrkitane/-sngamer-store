/* SNGAMER STORE — ADMIN DATA REFRESH V12
   Single owner for authenticated admin data refresh, refund UI and analytics.
   Order presentation/filtering belongs to the existing V2.1 Orders workspace.
   Do not inject a second order search/filter toolbar here.
   Remove legacy standalone and reduced order filter panels, including those
   accidentally left inside the canonical Orders section.
*/
(function () {
  'use strict';

  const STATE = '__sngamerAdminAutoRefreshV12';
  if (window[STATE]) return;
  window[STATE] = true;

  const INTERVAL_MS = 10000;
  let intervalId = null;
  let refreshInFlight = false;
  let observer = null;
  let lastWorkspace = null;

  function adminBox() {
    return document.getElementById('adminBox');
  }

  function isAdminVisible() {
    const box = adminBox();
    return !!box && !box.classList.contains('hidden');
  }

  function currentWorkspace() {
    return adminBox()?.getAttribute('data-v26-workspace') || '';
  }

  async function runLoader(name) {
    const loader = window[name];
    if (typeof loader !== 'function') {
      throw new Error(`Loader ${name} is not available yet`);
    }
    await loader();
  }

  function loadRefundUiV2() {
    if (window.__sngAdminRefundUiV2 || document.querySelector('script[data-sng-refund-ui-v2]')) return;
    const script = document.createElement('script');
    script.src = '/admin-refund-ui-v2.js?v=20261018-1335';
    script.async = false;
    script.dataset.sngRefundUiV2 = '1';
    script.onload = () => console.debug('SNGAMER: refund UI V2 loaded');
    script.onerror = () => console.error('SNGAMER: unable to load refund UI');
    document.head.appendChild(script);
  }

  function loadAnalyticsAdmin() {
    if (window.__sngAnalyticsAdminLoaded || document.querySelector('script[data-sng-site-analytics-admin]')) return;
    const script = document.createElement('script');
    script.src = '/site-analytics-admin.js?v=20261019-analytics2';
    script.async = false;
    script.dataset.sngSiteAnalyticsAdmin = '1';
    script.onload = () => {
      window.__sngAnalyticsAdminLoaded = true;
      console.debug('SNGAMER: site analytics admin loaded');
    };
    script.onerror = () => console.error('SNGAMER: unable to load site analytics admin');
    document.head.appendChild(script);
  }

  function removeLegacyOrderTools() {
    document.querySelectorAll('#sng-order-tools, #sng-order-tools-style').forEach(el => el.remove());
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function getOrdersSection() {
    const table = document.getElementById('ordersTable');
    return table?.closest('section') || null;
  }

  function isLegacyOrderSearchInput(input) {
    if (!input || input.closest('#sng-order-tools')) return false;
    const placeholder = normalizeText(input.getAttribute('placeholder'));
    return placeholder.includes('commande, client, telephone') ||
      (placeholder.includes('client') && placeholder.includes('telephone')) ||
      placeholder.includes('client, telephone, id');
  }

  function hasOptionText(container, pattern) {
    return Array.from(container.querySelectorAll('select')).some(select =>
      Array.from(select.options || []).some(option => pattern.test(normalizeText(option.textContent)))
    );
  }

  /* Remove the exact legacy standalone panel used by older admin builds.
     Never remove a container that owns the canonical orders table/workspace. */
  function cleanupDuplicateOrderSections() {
    const root = adminBox();
    if (!root) return;

    const markers = Array.from(root.querySelectorAll('input')).filter(isLegacyOrderSearchInput);

    markers.forEach(marker => {
      if (marker.closest('#sng-order-tools')) return;

      let candidate = marker.closest('section');
      if (!candidate || candidate === getOrdersSection()) candidate = marker.parentElement;

      for (let i = 0; i < 8 && candidate && candidate !== root; i += 1) {
        const hasPayment = hasOptionText(candidate, /tous les paiements/);
        const hasStatus = hasOptionText(candidate, /tous les statuts/);
        const hasReset = Array.from(candidate.querySelectorAll('button')).some(button => /reinitialiser/.test(normalizeText(button.textContent)));
        const ownsCanonicalTable = candidate.contains(document.getElementById('ordersTable'));
        const ownsCanonicalWorkspace = candidate.contains(document.getElementById('sngFinalOrders'));
        if (hasPayment && hasStatus && hasReset) {
          if (ownsCanonicalTable || ownsCanonicalWorkspace) return;
          console.debug('SNGAMER: removed duplicate standalone order filter panel');
          candidate.remove();
          return;
        }
        candidate = candidate.parentElement;
      }
    });
  }

  /* Older builds can leave a reduced duplicate containing only search + status.
     This can happen INSIDE the same <section> as #ordersTable, so the old V11
     guard that skipped the entire Orders section was too broad. We only remove
     the small legacy control container itself and never its canonical workspace. */
  function cleanupDuplicateOrderTools(section) {
    if (!section) return;

    const marker = Array.from(section.querySelectorAll('input,select')).find(el => {
      if (el.closest('#sng-order-tools')) return false;
      const placeholder = normalizeText(el.getAttribute('placeholder'));
      return placeholder.includes('client, telephone, id');
    });

    if (!marker) return;

    let container = marker.parentElement;
    for (let i = 0; i < 8 && container && container !== section; i += 1) {
      const controls = container.querySelectorAll('input,select,button');
      const hasStatus = Array.from(container.querySelectorAll('select')).some(select =>
        Array.from(select.options || []).some(option => /tous les statuts/i.test(String(option.textContent || '')))
      );
      const ownsCanonicalTable = container.contains(document.getElementById('ordersTable'));
      const ownsCanonicalWorkspace = container.contains(document.getElementById('sngFinalOrders'));

      if (!ownsCanonicalTable && !ownsCanonicalWorkspace && controls.length >= 2 && hasStatus) {
        console.debug('SNGAMER: removed reduced legacy order filter panel');
        container.remove();
        return;
      }
      container = container.parentElement;
    }

    if (!marker.closest('#sngFinalOrders')) marker.remove();
  }

  function cleanupAllLegacyOrderPanels() {
    const root = adminBox();
    if (!root) return;

    removeLegacyOrderTools();
    cleanupDuplicateOrderSections();

    // IMPORTANT: inspect the canonical Orders section too. V11 skipped it,
    // which is exactly why the remaining search/status panel survived.
    Array.from(root.querySelectorAll('section')).forEach(section => {
      cleanupDuplicateOrderTools(section);
    });
  }

  async function refreshNow(reason) {
    if (!isAdminVisible() || refreshInFlight) return;

    refreshInFlight = true;
    const workspace = currentWorkspace();

    try {
      cleanupAllLegacyOrderPanels();
      await runLoader('loadAll');
      cleanupAllLegacyOrderPanels();

      if (currentWorkspace() === 'orders' || workspace === 'orders') {
        if (typeof window.loadOrders === 'function') {
          await runLoader('loadOrders');
        }
        cleanupAllLegacyOrderPanels();
      }

      lastWorkspace = currentWorkspace();
      console.debug('SNGAMER ADMIN AUTO REFRESH OK:', reason, lastWorkspace);
    } catch (error) {
      console.error('SNGAMER ADMIN AUTO REFRESH ERROR:', reason, error);
    } finally {
      refreshInFlight = false;
    }
  }

  function stopOldCoreTimer() {
    if (window.__sngAdminOrdersAutoRefreshTimer) {
      window.clearInterval(window.__sngAdminOrdersAutoRefreshTimer);
      window.__sngAdminOrdersAutoRefreshTimer = null;
      console.debug('SNGAMER: replaced old core auto-refresh timer');
    }
  }

  function installObserver() {
    const box = adminBox();
    if (!box || observer) return;

    observer = new MutationObserver(() => {
      if (!isAdminVisible()) return;
      cleanupAllLegacyOrderPanels();
      const workspace = currentWorkspace();
      if (workspace !== lastWorkspace) refreshNow('workspace-change');
    });

    observer.observe(box, {
      attributes: true,
      attributeFilter: ['class', 'data-v26-workspace']
    });
  }

  function sanitizePaymentSelectors(root = document) {
    const selects = root.querySelectorAll ? root.querySelectorAll('select') : [];
    selects.forEach(select => {
      const options = Array.from(select.options || []);
      const texts = options.map(o => normalizeText(o.textContent));
      const looksLikePayment = texts.includes('paye') || texts.includes('en attente');
      const hasRefundOptions = texts.some(t => t === 'rembourse' || t === 'remboursement demande');
      if (!looksLikePayment || !hasRefundOptions) return;

      const oldValue = normalizeText(select.value);
      options.forEach(option => {
        const text = normalizeText(option.textContent);
        if (text === 'rembourse' || text === 'remboursement demande') option.remove();
      });

      if (oldValue === 'rembourse' || oldValue === 'remboursement demande') {
        const paid = Array.from(select.options).find(o => normalizeText(o.textContent) === 'paye');
        if (paid) select.value = paid.value;
      }
    });
  }

  function bootPaymentSelectorGuard() {
    sanitizePaymentSelectors(document);
    if (!document.body) return;
    const guard = new MutationObserver(() => sanitizePaymentSelectors(document));
    guard.observe(document.body, { childList: true, subtree: true });
    window.setInterval(() => sanitizePaymentSelectors(document), 2000);
  }

  function scheduleInitialRefreshes() {
    [0, 400, 1000, 2000, 3500, 6000].forEach(delay => {
      window.setTimeout(() => refreshNow(`initial-${delay}ms`), delay);
    });
  }

  function boot() {
    const box = adminBox();
    if (!box) {
      window.setTimeout(boot, 250);
      return;
    }

    stopOldCoreTimer();
    cleanupAllLegacyOrderPanels();
    installObserver();
    bootPaymentSelectorGuard();
    loadRefundUiV2();
    loadAnalyticsAdmin();

    if (!isAdminVisible()) {
      window.setTimeout(boot, 250);
      return;
    }

    if (!intervalId) {
      scheduleInitialRefreshes();
      intervalId = window.setInterval(() => refreshNow('interval'), INTERVAL_MS);
    }

    refreshNow('boot');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      cleanupAllLegacyOrderPanels();
      loadRefundUiV2();
      loadAnalyticsAdmin();
      refreshNow('visibility');
    }
  });

  window.addEventListener('pageshow', () => {
    cleanupAllLegacyOrderPanels();
    loadRefundUiV2();
    loadAnalyticsAdmin();
    refreshNow('pageshow');
  });

  window.addEventListener('focus', () => {
    cleanupAllLegacyOrderPanels();
    loadRefundUiV2();
    loadAnalyticsAdmin();
    refreshNow('focus');
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();