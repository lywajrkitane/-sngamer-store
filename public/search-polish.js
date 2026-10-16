/* SNGAMER STORE — Premium search interaction, version 2 */
(function(){
  function initPremiumSearch(){
    const source=document.querySelector('.siteHeader .search');
    const cartButton=document.querySelector('.siteHeader .cartButton');
    if(!source || !cartButton || source.dataset.premiumSearchReady==='1') return;
    const input=source.querySelector('#q');
    if(!input) return;

    source.dataset.premiumSearchReady='1';
    source.classList.add('sngamerSearchSource');

    const button=document.createElement('button');
    button.type='button';
    button.className='searchPremiumButton';
    button.setAttribute('aria-label','Rechercher un produit');
    button.setAttribute('title','Rechercher un produit');
    button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4.5 4.5"></path></svg>';
    cartButton.parentNode.insertBefore(button,cartButton);

    function syncButtonSize(){
      const height=Math.round(cartButton.getBoundingClientRect().height);
      if(height>0){button.style.width=height+'px';button.style.height=height+'px';button.style.flexBasis=height+'px';}
    }
    syncButtonSize();
    window.addEventListener('resize',syncButtonSize,{passive:true});
    if(window.ResizeObserver){new ResizeObserver(syncButtonSize).observe(cartButton);}

    const modal=document.createElement('div');
    modal.id='searchModal';
    modal.className='searchModal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`
      <div class="searchModalPanel" role="dialog" aria-modal="true" aria-label="Recherche de produits">
        <div class="searchModalHead">
          <div class="searchModalInputWrap">
            <span class="modalSearchIcon" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4.5 4.5"></path></svg></span>
          </div>
          <button type="button" class="searchModalClose" aria-label="Fermer la recherche">×</button>
        </div>
        <div class="searchModalBody" id="searchResults"></div>
      </div>`;
    document.body.appendChild(modal);

    const inputWrap=modal.querySelector('.searchModalInputWrap');
    inputWrap.appendChild(input);
    const results=modal.querySelector('#searchResults');
    const closeButton=modal.querySelector('.searchModalClose');

    function money(value){return new Intl.NumberFormat('fr-FR').format(Number(value)||0)+' FCFA'}
    function esc(value){
      if(typeof window.escapeHtml==='function') return window.escapeHtml(value||'');
      return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    }
    function getCategory(product){return typeof window.storeCategory==='function'?window.storeCategory(product):(product.category||'Accessoires')}

    function renderResults(){
      const all=Array.isArray(window.storeProducts)?window.storeProducts:[];
      const query=(input.value||'').trim().toLowerCase();
      const list=all.filter(p=>{
        const name=(p.name||'').toLowerCase();
        const category=(getCategory(p)||'').toLowerCase();
        const platform=(p.platform||'').toLowerCase();
        return !query || name.includes(query) || category.includes(query) || platform.includes(query);
      });

      if(!all.length){results.innerHTML='<div class="searchEmpty"><strong>Recherche en cours…</strong><span>Les produits vont apparaître dans un instant.</span></div>';return}
      if(!list.length){results.innerHTML='<div class="searchEmpty"><strong>Aucun produit trouvé</strong><span>Essaie un autre nom ou une autre catégorie.</span></div>';return}

      results.innerHTML=`<div class="searchModalHint">${query?'Résultats de recherche':'Produits disponibles · '+list.length}</div>`+
        list.map(p=>{
          const promo=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price);
          const price=promo?Number(p.promo_price):Number(p.price);
          const media=p.image1_url?`<img src="${esc(p.image1_url)}" alt="${esc(p.name||'')}">`:esc(p.emoji||'🎮');
          return `<button type="button" class="searchResult" data-product-id="${Number(p.id)}"><span class="searchResultImage">${media}</span><span class="searchResultInfo"><span class="searchResultCategory">${esc(getCategory(p))}</span><span class="searchResultName">${esc(p.name||'Produit')}</span><span class="searchResultPrice">${money(price)}${promo?' · Promotion':''}</span></span><span class="searchResultArrow" aria-hidden="true">›</span></button>`;
        }).join('');
    }

    function openSearch(){
      modal.classList.add('show');
      modal.setAttribute('aria-hidden','false');
      renderResults();
      document.body.classList.add('searchModalOpen');
      requestAnimationFrame(()=>{input.focus();input.select();});
    }
    function closeSearch(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true');document.body.classList.remove('searchModalOpen')}

    button.addEventListener('click',openSearch);
    closeButton.addEventListener('click',closeSearch);
    modal.addEventListener('click',event=>{if(event.target===modal) closeSearch()});
    input.addEventListener('input',renderResults);
    results.addEventListener('click',event=>{
      const item=event.target.closest('.searchResult');
      if(!item) return;
      const id=Number(item.dataset.productId);
      closeSearch();
      if(typeof window.openProduct==='function') window.openProduct(id);
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal.classList.contains('show'))closeSearch()});
    window.openPremiumSearch=openSearch;
    window.closePremiumSearch=closeSearch;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initPremiumSearch); else initPremiumSearch();
})();
