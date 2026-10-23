/* SNGAMER STORE — PRODUCT DETAIL PREMIUM V2
   Presentation layer only. Existing cart/order logic is reused.
*/
(function(){
  const money=n=>new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)||0))+' FCFA';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const validPromo=p=>Boolean(p?.promo_active)&&Number(p?.promo_price)>0&&Number(p?.promo_price)<Number(p?.price);
  async function specs(id){try{const r=await fetch('/api/product-specs/'+encodeURIComponent(id),{cache:'no-store'});if(!r.ok)return {};const d=await r.json();return d&&typeof d.specs==='object'?d.specs:{}}catch(_){return {}}}
  function specRows(obj){const entries=Object.entries(obj||{}).filter(([k,v])=>String(k).trim()&&String(v).trim());if(!entries.length)return '';return `<section class="sngSpecCard"><div class="sngSectionEyebrow">CARACTÉRISTIQUES</div><h3>Caractéristiques techniques</h3><div class="sngSpecTable">${entries.map(([k,v])=>`<div class="sngSpecRow"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div></section>`}
  function trust(){return `<div class="sngTrustGrid"><div><b>✓</b><span>Produit disponible</span></div><div><b>↗</b><span>Commande en ligne</span></div><div><b>▣</b><span>Paiement sécurisé</span></div><div><b>★</b><span>Assistance SNGAMER</span></div></div>`}
  window.openProductPremium=async function(id){
    const p=(window.storeProducts||[]).find(x=>Number(x.id)===Number(id));
    if(!p)return;
    const images=[p.image1_url,p.image2_url,p.image3_url].filter(Boolean);window.productImages=images;
    const promo=validPromo(p),inStock=Number(p.stock)>0;
    const detail=document.querySelector('#productDetail');if(!detail)return;
    detail.innerHTML=`<div class="productDetail sngPremiumProductDetail">
      <div class="productGallery">
        <div class="sngGalleryBadge">${inStock?'EN STOCK':'RUPTURE DE STOCK'}</div>
        <div class="productMainImage">${images.length?`<img id="productMainImage" src="${esc(images[0])}" alt="${esc(p.name)}">`:`<div class="productEmoji">${esc(p.emoji||'🎮')}</div>`}</div>
        ${images.length>1?`<div class="productThumbnails">${images.map((url,i)=>`<button type="button" class="productThumb ${i===0?'isActive':''}" onclick="selectProductImage(${i})"><img src="${esc(url)}" alt="${esc(p.name)} — image ${i+1}"></button>`).join('')}</div>`:''}
        ${p.video_url?`<div class="productVideo"><h3>Voir le produit en vidéo</h3><video controls preload="metadata" src="${esc(p.video_url)}"></video></div>`:''}
      </div>
      <div class="productInfo sngPremiumProductInfo">
        <div class="cat">${esc(typeof window.storeCategory==='function'?window.storeCategory(p):(p.category||'Gaming'))}</div>
        <h2>${esc(p.name)}</h2>
        <div class="sngProductPurchaseMeta"><div class="sngPriceBlock">${promo?`<span class="priceOld">${money(p.price)}</span><strong class="priceCurrent">${money(p.promo_price)}</strong><span class="discountBadge">-${Math.round((1-Number(p.promo_price)/Number(p.price))*100)}%</span>`:`<strong class="priceCurrent">${money(p.price)}</strong>`}</div><span class="sngStockPill ${inStock?'ok':'out'}">${inStock?`${Number(p.stock)} disponible(s)`:'Rupture de stock'}</span></div>
        <section class="productDescriptionSection"><div class="sngSectionEyebrow">À PROPOS DU PRODUIT</div><h3 class="productDescriptionTitle">Description</h3><p class="productDescription">${esc(p.description||'Aucune description disponible.').replace(/\n/g,'<br>')}</p></section>
        <div id="sngProductSpecs"></div>
        ${trust()}
        <div class="sngProductActions">${inStock?`<button class="primary full sngBuyNow" type="button" onclick="add(${Number(p.id)});openCheckout();closeProduct()">Acheter maintenant</button><button class="primary full" type="button" onclick="add(${Number(p.id)});closeProduct()">Ajouter au panier</button>`:`<button class="primary full disabled" disabled>Rupture de stock</button>`}</div>
      </div></div>`;
    document.querySelector('#productModal')?.classList.add('show');
    try{history.replaceState(null,'',location.pathname+'#product='+p.id)}catch(_){location.hash='product='+p.id}
    const data=await specs(p.id);const box=document.querySelector('#sngProductSpecs');if(box)box.innerHTML=specRows(data);
  };
  window.selectProductImage=function(i){const img=document.querySelector('#productMainImage');if(img&&window.productImages?.[i]){img.src=window.productImages[i];document.querySelectorAll('#productModal .productThumb').forEach((b,n)=>b.classList.toggle('isActive',n===i));}};
  const boot=()=>{if(typeof window.openProduct==='function'&&!window.openProduct.__sngPremiumWrapped){const original=window.openProduct;const wrapped=function(id){return window.openProductPremium(id)};wrapped.__sngPremiumWrapped=true;wrapped.__original=original;window.openProduct=wrapped;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setTimeout(boot,300);setTimeout(boot,1200);
})();
