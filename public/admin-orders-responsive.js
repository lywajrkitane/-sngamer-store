/* SNGAMER STORE — COMMANDES RESPONSIVE PREMIUM
   Mobile-only presentation layer for the existing orders workspace.
   IMPORTANT: this file only changes the mobile presentation.
   The existing order table, data, status controls and details workflow remain the source of truth.
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
        #adminBox .orders-table-wrap{
          overflow:visible!important;
          border:0!important;
          background:transparent!important;
          box-shadow:none!important;
        }

        #adminBox .orders-table-wrap #ordersTable{
          display:none!important;
        }

        #${CARDS_ID}{
          display:grid!important;
          grid-template-columns:minmax(0,1fr);
          gap:12px;
          margin-top:4px;
          width:100%;
          box-sizing:border-box;
        }

        .sg-order-mobile-card{
          display:grid;
          grid-template-columns:minmax(0,1fr) auto;
          gap:12px;
          align-items:center;
          width:100%;
          box-sizing:border-box;
          padding:15px;
          border:1px solid rgba(115,145,190,.18);
          border-radius:17px;
          background:linear-gradient(145deg,rgba(14,25,43,.98),rgba(7,14,25,.98));
          box-shadow:0 12px 30px rgba(0,0,0,.20);
        }

        .sg-order-mobile-main{
          min-width:0;
          display:grid;
          gap:5px;
        }

        .sg-order-mobile-top{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
          min-width:0;
        }

        .sg-order-mobile-id{
          font-size:12px;
          font-weight:900;
          letter-spacing:.08em;
          color:#91a5c3;
          text-transform:uppercase;
        }

        .sg-order-mobile-date{
          font-size:11px;
          color:#74869f;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .sg-order-mobile-client{
          font-size:16px;
          font-weight:850;
          color:#f7f9ff;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .sg-order-mobile-meta{
          font-size:12px;
          color:#8f9db3;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .sg-order-mobile-bottom{
          display:flex;
          align-items:center;
          gap:8px;
          margin-top:2px;
        }

        .sg-order-mobile-total{
          font-size:13px;
          font-weight:850;
          color:#e9edff;
        }

        .sg-order-mobile-details{
          min-width:48px;
          min-height:48px;
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
          cursor:pointer;
          touch-action:manipulation;
        }

        .sg-order-mobile-details:active{
          transform:scale(.98);
        }
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

    const wrap = table.closest('.orders-table-wrap') || table.parentElement;
    if (!wrap) return;

    let cards = document.getElementById(CARDS_ID);
    if (!cards) {
      cards = document.createElement('div');
      cards.id = CARDS_ID;
      wrap.appendChild(cards);
    }

    cards.innerHTML = '';

    Array.from(table.children).forEach(row => {
      const cells = Array.from(row.children);
      if (cells.length < 2) return;

      const id = text(cells[0]);
      const date = text(cells[1]);
      const client = text(cells[2]) || 'Client non renseigné';
      const total = text(cells[4]);
      const actionCell = cells[cells.length - 1];
      const sourceButton = actionCell?.querySelector('.order-details-btn');
      if (!sourceButton) return;

      const card = document.createElement('article');
      card.className = 'sg-order-mobile-card';

      const main = document.createElement('div');
      main.className = 'sg-order-mobile-main';

      const top = document.createElement('div');
      top.className = 'sg-order-mobile-top';

      const idEl = document.createElement('span');
      idEl.className = 'sg-order-mobile-id';
      idEl.textContent = `Commande ${id}`;

      const dateEl = document.createElement('span');
      dateEl.className = 'sg-order-mobile-date';
      dateEl.textContent = date;

      top.append(idEl, dateEl);

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

      main.append(top, clientEl, meta, bottom);

      /*
       * Do NOT clone the original details button and rely on its listeners.
       * cloneNode() copies HTML attributes but does not copy listeners attached
       * with addEventListener(). The mobile button therefore delegates directly
       * to the original button that already owns the working details workflow.
       */
      const button = document.createElement('button');
      button.className = 'sg-order-mobile-details';
      button.textContent = '👁️ Détails';
      button.setAttribute('type', 'button');
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (typeof sourceButton.click === 'function') {
          sourceButton.click();
        }
      });

      card.append(main, button);
      cards.appendChild(card);
    });
  }

  let scheduled = false;
  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      render();
    });
  }

  const observer = new MutationObserver(scheduleRender);

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
