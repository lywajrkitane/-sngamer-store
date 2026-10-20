(() => {
  'use strict';

  function install() {
    const panel = document.getElementById('sg-site-analytics-panel');
    if (!panel) return false;
    const head = panel.querySelector('.sg-analytics-head');
    if (!head) return false;

    let button = head.querySelector('#sgAnalyticsReset');
    if (button) return true;

    const refresh = head.querySelector('#sgAnalyticsRefresh');
    if (!refresh) return false;

    // Keep both controls together on the right, with Reset directly below Refresh.
    // The reset button deliberately reuses the exact same class as Refresh so it
    // inherits the same size, color, typography and responsive styling.
    let actions = head.querySelector('.sg-analytics-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'sg-analytics-actions';
      actions.style.cssText = 'display:flex;flex-direction:column;align-items:stretch;gap:6px;flex:0 0 auto;min-width:max-content';
      head.insertBefore(actions, refresh);
      actions.appendChild(refresh);
    }

    button = document.createElement('button');
    button.type = 'button';
    button.id = 'sgAnalyticsReset';
    button.className = refresh.className || 'sg-analytics-refresh';
    button.textContent = 'Réinitialiser';
    button.title = 'Réinitialiser les statistiques à zéro sans supprimer les produits ni les commandes';
    button.setAttribute('aria-label', 'Réinitialiser les statistiques de la boutique');

    button.addEventListener('click', async () => {
      const ok = window.confirm('Réinitialiser les statistiques de la boutique ?\n\nCette action remettra les statistiques et visites à zéro, mais NE supprimera pas les produits, comptes clients ou commandes.');
      if (!ok) return;
      button.disabled = true;
      button.textContent = 'Réinitialisation…';
      try {
        const response = await fetch('/api/admin/analytics/reset', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Réinitialisation impossible');
        button.textContent = 'Réinitialisé ✓';
        if (refresh && document.body.contains(refresh)) refresh.click();
        setTimeout(() => {
          const current = document.getElementById('sgAnalyticsReset');
          if (current) { current.textContent = 'Réinitialiser'; current.disabled = false; }
        }, 1800);
      } catch (error) {
        console.error(error);
        button.textContent = 'Erreur';
        setTimeout(() => {
          const current = document.getElementById('sgAnalyticsReset');
          if (current) { current.textContent = 'Réinitialiser'; current.disabled = false; }
        }, 2200);
        window.alert(error.message || 'Impossible de réinitialiser les statistiques.');
      }
    });

    actions.appendChild(button);
    return true;
  }

  // Keep watching because the analytics panel is rebuilt whenever the dashboard
  // is refreshed. The reset control must therefore be restored after every render.
  const observer = new MutationObserver(() => install());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  install();
})();
