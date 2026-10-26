(function(){
  'use strict';
  if(window.__sngProductPurchaseActionsV1)return;
  window.__sngProductPurchaseActionsV1=true;

  function installStyles(){
    if(document.getElementById('sngProductPurchaseActionsStyles'))return;
    const style=document.createElement('style');
    style.id='sngProductPurchaseActionsStyles';
    style.textContent=`
      /* Product social actions are styled and positioned exclusively by product-image-actions-v1.js. */

      /* Add to cart: neutral secondary action, distinct from the green Buy Now CTA. */
      #productDetail .sngAddToCartBtn{
        width:100%!important;
        min-height:52px!important;
        margin:10px 0 0!important;
        padding:0 18px!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:9px!important;
        border:1px solid rgba(125,145,175,.34)!important;
        border-radius:14px!important;
        background:rgba(20,31,48,.88)!important;
        background-image:none!important;
        color:#e6edf7!important;
        font:inherit!important;
        font-size:16px!important;
        font-weight:800!important;
        letter-spacing:.1px!important;
        cursor:pointer!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 6px 18px rgba(0,0,0,.12)!important;
        transition:transform .15s ease,border-color .15s ease,background .15s ease,box-shadow .15s ease!important;
      }
      #productDetail .sngAddToCartBtn .sngCartIcon{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        font-size:20px!important;
        line-height:1!important;
        flex:0 0 auto!important;
      }
      #productDetail .sngAddToCartBtn:hover{
        border-color:rgba(105,160,220,.55)!important;
        background:rgba(29,43,64,.96)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 8px 22px rgba(0,0,0,.16)!important;
      }
      #productDetail .sngAddToCartBtn:active{transform:scale(.985)!important}

      /* Buy now: immediately above Add to cart, with its own stacked sticky position. */
      #productDetail .sngBuyNowBtn{
        order:79!important;
        position:sticky!important;
        bottom:70px!important;
        z-index:5!important;
        width:100%!important;
        min-height:52px!important;
        margin:10px 0 0!important;
        padding:0 18px!important;
        border:1px solid rgba(105,238,157,.48)!important;
        border-radius:14px!important;
        background:linear-gradient(135deg,#16a34a 0%,#22c55e 55%,#10b981 100%)!important;
        color:#fff!important;
        font:inherit!important;
        font-size:16px!important;
        font-weight:900!important;
        letter-spacing:.1px!important;
        cursor:pointer!important;
        box-shadow:0 10px 28px rgba(16,185,129,.18),inset 0 1px 0 rgba(255,255,255,.22)!important;
        transition:transform .15s ease,filter .15s ease,box-shadow .15s ease!important;
      }
      #productDetail .sngBuyNowBtn:hover{filter:brightness(1.06)!important;box-shadow:0 12px 32px rgba(16,185,129,.24),inset 0 1px 0 rgba(255,255,255,.24)!important}
      #productDetail .sngBuyNowBtn:active{transform:scale(.985)!important}
      #productDetail .sngBuyNowBtn:disabled{opacity:.65!important;cursor:not-allowed!important}

      /* Cart confirmation toast: restored near the cart/header. */
      #sngamer-cart-toast{
        position:fixed;top:88px;right:18px;z-index:99999;width:min(260px,calc(100vw - 36px));box-sizing:border-box;
        display:flex;align-items:center;gap:9px;padding:9px 10px 9px 11px;border:1px solid rgba(92,176,255,.42);border-radius:13px;
        background:linear-gradient(135deg,rgba(8,20,38,.97),rgba(28,13,55,.97));box-shadow:0 10px 28px rgba(0,0,0,.36),0 0 20px rgba(65,116,255,.14);
        color:#fff;font-family:inherit;opacity:0;transform:translateY(-12px) scale(.98);pointer-events:none;transition:opacity .22s ease,transform .22s ease;
      }
      #sngamer-cart-toast.show{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
      #sngamer-cart-toast .toastIcon{width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;border-radius:9px;background:linear-gradient(135deg,#168cff,#8a35ff);box-shadow:0 0 14px rgba(67,124,255,.25);font-size:16px}
      #sngamer-cart-toast .toastContent{min-width:0;flex:1;line-height:1.18}
      #sngamer-cart-toast .toastTitle{margin:0 0 2px;font-size:11px;font-weight:800;color:#63b6ff;letter-spacing:.02em}
      #sngamer-cart-toast .toastProduct{margin:0;font-size:12px;font-weight:700;color:#f7f9ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #sngamer-cart-toast .toastClose{width:26px;height:26px;flex:0 0 26px;border:0;border-radius:8px;background:rgba(255,255,255,.08);color:#cbd6e8;font-size:17px;line-height:1;cursor:pointer}
      #sngamer-cart-toast .toastClose:hover,#sngamer-cart-toast .toastClose:focus-visible{background:rgba(255,255,255,.14);color:#fff;outline:none}
      @media(max-width:600px){#sngamer-cart-toast{top:78px;right:12px;left:auto;width:min(240px,calc(100vw - 24px));border-radius:12px;padding:8px 9px 8px 10px}}

      @media(max-width:520px){
        #productDetail .sngAddToCartBtn{min-height:54px!important;font-size:16px!important}
        #productDetail .sngBuyNowBtn{bottom:70px!important;min-height:54px!important;font-size:16px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function heartSvg(){
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.84 8.72c0 5.1-8.84 10.02-8.84 10.02S3.16 13.82 3.16 8.72A4.62 4.62 0 0 1 7.78 4.1c1.75 0 3.27.98 4.22 2.38.95-1.4 2.47-2.38 4.22-2.38a4.62 4.62 0 0 1 4.62 4.62Z"></path></svg>';
  }
  function normalizeFavoriteButton(detail){const btn=detail.querySelector('.sngFavBtn');if(!btn)return;const icon=btn.querySelector('.sngFavIcon');if(!icon)return;icon.innerHTML=heartSvg();icon.setAttribute('aria-hidden','true');btn.setAttribute('title',btn.classList.contains('isFavorite')?'Retirer des favoris':'Ajouter aux favoris')}
  function findAddToCartButton(detail){const buttons=Array.from(detail.querySelectorAll('button'));return buttons.find(b=>String(b.textContent||'').trim().toLowerCase().includes('ajouter au panier'))||null}
  function normalizeAddToCartButton(detail){const btn=findAddToCartButton(detail);if(!btn)return;btn.classList.add('sngAddToCartBtn');if(btn.dataset.sngCartNormalized==='1')return;btn.innerHTML='<span class="sngCartIcon" aria-hidden="true">🛒</span><span>Ajouter au panier</span>';btn.setAttribute('aria-label','Ajouter au panier');btn.dataset.sngCartNormalized='1'}
  function injectBuyNow(detail){
    if(detail.querySelector('.sngBuyNowBtn'))return;
    const addButton=findAddToCartButton(detail);if(!addButton)return;
    const id=productIdFromDetail(detail);if(!id)return;
    const buy=document.createElement('button');buy.type='button';buy.className='sngBuyNowBtn';buy.textContent='Acheter maintenant';buy.setAttribute('aria-label','Acheter maintenant');
    buy.addEventListener('click',function(){if(buy.disabled)return;if(typeof window.add!=='function'||typeof window.openCheckout!=='function')return;buy.disabled=true;try{const added=window.add(id);if(added!==false){window.setTimeout(function(){window.openCheckout();buy.disabled=false},120)}else buy.disabled=false}catch(_){buy.disabled=false}});
    addButton.insertAdjacentElement('beforebegin',buy);
  }
  function productIdFromDetail(detail){const social=detail.querySelector('.sngProductSocial[data-product-id]');const id=Number(social?.dataset.productId||0);if(id)return id;const hash=String(location.hash||'').match(/^#product=(\d+)$/);return hash?Number(hash[1]):0}
  function showCartToast(productName){
    let toast=document.getElementById('sngamer-cart-toast');
    if(!toast){toast=document.createElement('div');toast.id='sngamer-cart-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.innerHTML='<div class="toastIcon" aria-hidden="true">🛒</div><div class="toastContent"><p class="toastTitle">Ajouté au panier</p><p class="toastProduct"></p></div><button class="toastClose" type="button" aria-label="Fermer">×</button>';toast.querySelector('.toastClose').addEventListener('click',function(){toast.classList.remove('show')});document.body.appendChild(toast)}
    toast.querySelector('.toastProduct').textContent=String(productName||'Produit');toast.classList.remove('show');void toast.offsetWidth;toast.classList.add('show');window.clearTimeout(window.__sngCartToastTimer);window.__sngCartToastTimer=window.setTimeout(function(){toast.classList.remove('show')},4000);
  }
  function installCartToast(){
    if(window.__sngamerCartToastInstalled)return;if(typeof window.add!=='function')return;const originalAdd=window.add;
    window.add=function(id){const result=originalAdd.apply(this,arguments);if(result===true){const product=Array.isArray(window.storeProducts)?window.storeProducts.find(function(p){return Number(p.id)===Number(id)}):null;showCartToast(product&&product.name?product.name:'Produit')}return result};
    window.__sngamerCartToastInstalled=true;
  }
  function patch(){installStyles();installCartToast();const detail=document.querySelector('#productDetail');if(!detail)return;normalizeFavoriteButton(detail);normalizeAddToCartButton(detail);injectBuyNow(detail)}
  let timer=0;function schedule(){window.clearTimeout(timer);timer=window.setTimeout(patch,30)}
  const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.setTimeout(patch,100);window.setTimeout(patch,400);
})();
