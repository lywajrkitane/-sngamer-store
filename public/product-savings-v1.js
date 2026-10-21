/* SNGAMER STORE — Fiche produit : économie + stock clair
   Non destructif : enrichit la fiche existante sans remplacer son contenu.
*/
(function(){
  'use strict';

  function money(v){
    return new Intl.NumberFormat('fr-FR').format(Math.round(Number(v)||0)) + ' FCFA';
  }

  function findProduct(){
    const detail = document.getElementById('productDetail');
    if(!detail || !Array.isArray(window.products)) return null;
    const title = detail.querySelector('.productInfo h2, .productInfo h1, h2, h1');
    const name = title ? title.textContent.trim() : '';
    if(!name) return null;
    return window.products.find(p => String(p.name||'').trim() === name) ||
           window.products.find(p => String(p.name||'').trim().toLowerCase() === name.toLowerCase()) || null;
  }

  function enhance(){
    const modal = document.getElementById('productModal');
    const detail = document.getElementById('productDetail');
    if(!modal || !detail || !modal.classList.contains('show')) return;

    const p = findProduct();
    if(!p) return;

    const info = detail.querySelector('.productInfo') || detail;
    let box = detail.querySelector('.sngProductPurchaseMeta');
    if(!box){
      box = document.createElement('div');
      box.className = 'sngProductPurchaseMeta';
      const add = info.querySelector('.add');
      if(add) info.insertBefore(box, add);
      else info.appendChild(box);
    }

    const normal = Number(p.price)||0;
    const promoActive = Boolean(p.promo_active) && Number(p.promo_price)>0 && Number(p.promo_price)<normal;
    const current = promoActive ? Number(p.promo_price) : normal;
    const stock = Math.max(0, Number(p.stock)||0);

    const saving = promoActive ? normal - Number(p.promo_price) : 0;
    const percent = promoActive ? Math.round((saving / normal) * 100) : 0;

    box.innerHTML = `
      <div class="sngPurchaseMetaRow">
        <span class="sngStockPill ${stock>0?'is-stock':'is-out'}">
          <i></i>${stock>0 ? `En stock · ${stock} disponible${stock>1?'s':''}` : 'Rupture de stock'}
        </span>
        ${promoActive ? `<span class="sngSavingPill">Économie ${money(saving)} · -${percent}%</span>` : ''}
      </div>
    `;

    const addBtn = info.querySelector('.add');
    if(addBtn){
      addBtn.disabled = stock <= 0;
      addBtn.setAttribute('aria-disabled', stock <= 0 ? 'true' : 'false');
      if(stock <= 0) addBtn.textContent = 'Produit indisponible';
    }
  }

  function init(){
    const modal = document.getElementById('productModal');
    const detail = document.getElementById('productDetail');
    if(!modal || !detail) return;
    const observer = new MutationObserver(function(){ requestAnimationFrame(enhance); });
    observer.observe(modal, {subtree:true, childList:true, attributes:true, attributeFilter:['class']});
    setInterval(enhance, 700);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
