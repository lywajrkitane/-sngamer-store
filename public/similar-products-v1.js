/* SNGAMER STORE — Produits similaires V1 */
(function(){
  'use strict';

  function esc(value=''){
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(value);
    return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function priceFor(p){
    const promo=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price);
    return promo?Number(p.promo_price):Number(p.price);
  }

  function categoryFor(p){
    if (typeof window.storeCategory==='function') return window.storeCategory(p);
    return p.category || 'Gaming';
  }

  function renderSimilar(currentId){
    const host=document.querySelector('#productDetail');
    if(!host || !Array.isArray(window.storeProducts)) return;

    const current=window.storeProducts.find(p=>Number(p.id)===Number(currentId));
    if(!current) return;

    const currentCategory=categoryFor(current);
    let candidates=window.storeProducts.filter(p=>Number(p.id)!==Number(currentId));

    const sameCategory=candidates.filter(p=>categoryFor(p)===currentCategory);
    candidates=(sameCategory.length?sameCategory:candidates).slice(0,12);
    if(!candidates.length) return;

    const section=document.createElement('section');
    section.className='similarProductsSection';
    section.setAttribute('aria-label','Produits similaires');

    section.innerHTML=`
      <div class="similarProductsHeader">
        <div>
          <h3>Produits similaires</h3>
          <p>Découvre d'autres produits qui pourraient te plaire.</p>
        </div>
      </div>
      <div class="similarProductsTrack" role="list">
        ${candidates.map(p=>{
          const image=p.image1_url||p.main_image_url;
          const price=priceFor(p);
          const stock=Number(p.stock)>0;
          return `
            <button type="button" class="similarProductCard" role="listitem" onclick="openProduct(${Number(p.id)})" aria-label="Voir ${esc(p.name||'le produit')}">
              <div class="similarProductMedia">
                ${image
                  ? `<img src="${esc(image)}" alt="${esc(p.name||'')}" loading="lazy">`
                  : `<div class="similarProductEmoji">${esc(p.emoji||'🎮')}</div>`}
              </div>
              <div class="similarProductBody">
                <div class="similarProductCategory">${esc(categoryFor(p))}</div>
                <div class="similarProductName">${esc(p.name||'Produit')}</div>
                <div class="similarProductBottom">
                  <div class="similarProductPrice">${new Intl.NumberFormat('fr-FR').format(price)} <small>FCFA</small></div>
                  <div class="similarProductStock">${stock?`${Number(p.stock)} disponible(s)`:'Rupture'}</div>
                </div>
              </div>
            </button>
          `;
        }).join('')}
      </div>
      <div class="similarProductsHint"><span>↔</span> Fais glisser horizontalement pour voir plus de produits</div>
      <button type="button" class="similarBackToProduct" aria-label="Revenir en haut du produit" title="Revenir en haut du produit" hidden>↑</button>
    `;

    host.appendChild(section);

    const modalBox=document.querySelector('#productModal .productBox');
    const backButton=section.querySelector('.similarBackToProduct');
    if(modalBox && backButton){
      const updateArrow=()=>{backButton.hidden=modalBox.scrollTop<260};
      modalBox.addEventListener('scroll',updateArrow,{passive:true});
      backButton.addEventListener('click',()=>{
        modalBox.scrollTo({top:0,behavior:'smooth'});
      });
      updateArrow();
    }
  }

  function install(){
    if(typeof window.openProduct!=='function' || window.openProduct.__similarWrapped) return;
    const original=window.openProduct;
    function wrapped(id){
      original(id);
      requestAnimationFrame(()=>renderSimilar(id));
    }
    wrapped.__similarWrapped=true;
    window.openProduct=wrapped;
  }

  const timer=setInterval(()=>{
    install();
    if(typeof window.openProduct==='function' && window.openProduct.__similarWrapped) clearInterval(timer);
  },50);
})();
