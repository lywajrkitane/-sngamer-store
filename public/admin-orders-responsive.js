/* SNGAMER STORE — COMMANDES RESPONSIVE PREMIUM
   Mobile-only presentation layer for the existing orders workspace.
   Keeps the existing table and order-details logic intact on desktop.
*/
(function () {
  'use strict';

  const STYLE_ID = 'sg-orders-responsive-premium-style';
  const CARDS_ID = 'sg-orders-mobile-cards';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CARDS_ID}{display:none}
      @media (max-width:700px){
        #adminBox .orders-table-wrap{overflow:visible!important;border:0!important;background:transparent!important}
        #adminBox .orders-table-wrap > table{display:none!important}
        #${CARDS_ID}{display:grid;gap:12px;margin-top:4px}
        .sg-order-mobile-card{
          display:grid;
          grid-template-columns:minmax(0,1fr) auto;
          gap:12px;
          align-items:center;
          padding:15px;
          border:1px solid rgba(115,145,190,.18);
          border-radius:17px;
          background:linear-gradient(145deg,rgba(14,25,43,.98),rgba(7,14,25,.98));
          box-shadow:0 12px 30px rgba(0,0,0,.20);
        }
        .sg-order-mobile-main{min-width:0;display:grid;gap:5px}
        .sg-order-mobile-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .sg-order-mobile-id{font-size:12px;font-weight:900;letter-spacing:.08em;color:#91a5c3;text-transform:uppercase}
        .sg-order-mobile-date{font-size:11px;color:#74869f;white-space:nowrap}
        .sg-order-mobile-client{font-size:16px;font-weight:850;color:#f7f9ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sg-order-mobile-meta{font-size:12px;color:#8f9db3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sg-order-mobile-bottom{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px}
        .sg-order-mobile-total{font-size:13px;font-weight:850;color:#e9edff}
        .sg-order-mobile-status{font-size:11px;font-weight:800;color:#a9b9d2;padding:5px 8px;border-radius:999px;border:1px solid rgba(75,140,255,.22);background:rgba(30,70,120,.16)}
        .sg-order-mobile-details{
          min-width:48px;
          height:48px;
          padding:0 14px;
          border:1px solid rgba(95,125,255,.28);
          border-radius:13px;
          background:linear-gradient(135deg,#2684ff,#7545ff,#e62f9f);
          color:#fff;
          font-size:13px;
          font-weight:900;
          box-shadow:0 9px 22px rgba(76,71,255,.22);
          white-space:nowrap;
        }
        .sg-order-mobile-details:active{transform:scale(.98)}
      }
    `;
    document.head.appendChild(style);
  }

  function text(cell) {
    return String(cell?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function render() {
    injectStyles();
    const table = document.getElementById('ordersTable');
    if (!table) return;
    const wrap = table.closest('.orders-table-wrap');
    if (!wrap) return;

    let cards = document.getElementById(CARDS_ID);
    if (!cards) {
      cards = document.createElement('div');
      cards.id = CARDS_ID;
      wrap.appendChild(cards);
    }

    cards.innerHTML = '';
    Array.from(table.querySelectorAll(':scope > tr')).forEach(row => {
      const cells = Array.from(row.children);
      if (!cells.length) return;
      if (cells.length === 1) return;

      const id = text(cells[0]);
      const date = text(cells[1]);
      const client = text(cells[2]) || 'Client non renseigné';
      const total = text(cells[4]);
      const status = text(cells[6]);
      const actionCell = cells[cells.length - 1];
      const sourceButton = actionCell?.querySelector('.order-details-btn');
      if (!sourceButton) return;

      const card = document.createElement('article');
      card.className = 'sg-order-mobile-card';

      const main = document.createElement('div');
      main.className = 'sg-order-mobile-main';

      const top = document.createElement('div');
      top.className = 'sg-order-mobile-top';
      top.innerHTML = `<span class="sg-order-mobile-id">Commande ${id}</span><span class="sg-order-mobile-date"></span>`;
      top.querySelector('.sg-order-mobile-date').textContent = date;

      const clientEl = document.createElement('div');
      clientEl.className = 'sg-order-mobile-client';
      clientEl.textContent = client;

      const meta = document.createElement('div');
      meta.className = 'sg-order-mobile-meta';
      meta.textContent = 'Commande client';

      const bottom = document.createElement('div');
      bottom.className = 'sg-order-mobile-bottom';
      if (total) {
        const totalEl = document.createElement('span');
        totalEl.className = 'sg-order-mobile-total';
        totalEl.textContent = total;
        bottom.appendChild(totalEl);
      }
      if (status) {
        const statusEl = document.createElement('span');
        statusEl.className = 'sg-order-mobile-status';
        statusEl.textContent = status;
        bottom.appendChild(statusEl);
      }

      main.append(top, clientEl, meta, bottom);

      const button = sourceButton.cloneNode(true);
      button.className = 'sg-order-mobile-details';
      button.textContent = '👁️ Détails';
      button.setAttribute('type', 'button');

      card.append(main, button);
      cards.appendChild(card);
    });
  }

  const observer = new MutationObserver(render);
  function start() {
    render();
    const table = document.getElementById('ordersTable');
    if (table && !table.dataset.sgResponsiveObserved) {
      table.dataset.sgResponsiveObserved = '1';
      observer.observe(table, { childList: true, subtree: true });
    }
  }

  document.addEventListener('DOMContentLoaded', start);
  setInterval(start, 1200);
})();
