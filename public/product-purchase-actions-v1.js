(function(){
  'use strict';
  if(window.__sngProductPurchaseActionsV1)return;
  window.__sngProductPurchaseActionsV1=true;

  function installStyles(){
    if(document.getElementById('sngProductPurchaseActionsStyles'))return;
    const style=document.createElement('style');
    style.id='sngProductPurchaseActionsStyles';
    style.textContent=`
      /* Product social actions: real heart + perfectly aligned share button. */
      #productDetail .sngSocialActions{
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        gap:10px!important;
        width:auto!important;
        max-width:100%!important;
      }
      #productDetail .sngSocialBtn{
        box-sizing:border-box!important;
        min-height:42px!important;
        height:42px!important;
        margin:0!important;
        border-radius:12px!important;
      }
      #productDetail .sngFavBtn{
        width:46px!important;
        min-width:46px!important;
        padding:0!important;
        gap:0!important;
        border-color:rgba(125,145,175,.30)!important;
        background:rgba(255,255,255,.045)!important;
      }
      #productDetail .sngFavBtn > span:not(.sngFavIcon){display:none!important}
      #productDetail .sngFavIcon{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        width:24px!important;
        height:24px!important;
        font-size:0!important;
        line-height:1!important;
      }
      #productDetail .sngFavIcon svg{
        width:24px!important;
        height:24px!important;
        display:block!important;
        overflow:visible!important;
      }
      #productDetail .sngFavIcon svg path{
        fill:none!important;
        stroke:currentColor!important;
        stroke-width:1.9!important;
        stroke-linecap:round!important;
        stroke-linejoin:round!important;
      }
      #productDetail .sngFavBtn.isFavorite .sngFavIcon svg path{
        fill:currentColor!important;
      }
      #productDetail .sngShareBtn{
        min-width:112px!important;
        padding:0 14px!important;
      }
      #productDetail .sngBuyNowBtn{
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
      @media(max-width:520px){
        #productDetail .sngSocialActions{gap:9px!important}
        #productDetail .sngSocialBtn{min-height:44px!important;height:44px!important}
        #productDetail .sngFavBtn{width:48px!important;min-width:48px!important}
        #productDetail .sngShareBtn{min-width:112px!important}
        #productDetail .sngBuyNowBtn{min-height:54px!important;font-size:16px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function heartSvg(){
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.84 8.72c0 5.1-8.84 10.02-8.84 10.02S3.16 13.82 3.16 8.72A4.62 4.62 0 0 1 7.78 4.1c1.75 0 3.27.98 4.22 2.38.95-1.4 2.47-2.38 4.22-2.38a4.62 4.62 0 0 1 4.62 4.62Z"></path></svg>';
  }

  function normalizeFavoriteButton(detail){
    const btn=detail.querySelector('.sngFavBtn');
    if(!btn)return;
    const icon=btn.querySelector('.sngFavIcon');
    if(!icon)return;
    icon.innerHTML=heartSvg();
    icon.setAttribute('aria-hidden','true');
    btn.setAttribute('title',btn.classList.contains('isFavorite')?'Retirer des favoris':'Ajouter aux favoris');
  }

  function productIdFromDetail(detail){
    const social=detail.querySelector('.sngProductSocial[data-product-id]');
    const id=Number(social?.dataset.productId||0);
    if(id)return id;
    const hash=String(location.hash||'').match(/^#product=(\d+)$/);
    return hash?Number(hash[1]):0;
  }

  function findAddToCartButton(detail){
    const buttons=Array.from(detail.querySelectorAll('button'));
    return buttons.find(b=>String(b.textContent||'').trim().toLowerCase().includes('ajouter au panier'))||null;
  }

  function injectBuyNow(detail){
    if(detail.querySelector('.sngBuyNowBtn'))return;
    const addButton=findAddToCartButton(detail);
    if(!addButton)return;
    const id=productIdFromDetail(detail);
    if(!id)return;
    const buy=document.createElement('button');
    buy.type='button';
    buy.className='sngBuyNowBtn';
    buy.textContent='Acheter maintenant';
    buy.setAttribute('aria-label','Acheter maintenant');
    buy.addEventListener('click',function(){
      if(buy.disabled)return;
      if(typeof window.add!=='function'||typeof window.openCheckout!=='function')return;
      buy.disabled=true;
      try{
        const added=window.add(id);
        if(added!==false){
          window.setTimeout(function(){
            window.openCheckout();
            buy.disabled=false;
          },120);
        }else{
          buy.disabled=false;
        }
      }catch(_){
        buy.disabled=false;
      }
    });
    addButton.insertAdjacentElement('beforebegin',buy);
  }

  function patch(){
    installStyles();
    const detail=document.querySelector('#productDetail');
    if(!detail)return;
    normalizeFavoriteButton(detail);
    injectBuyNow(detail);
  }

  let timer=0;
  function schedule(){
    window.clearTimeout(timer);
    timer=window.setTimeout(patch,30);
  }

  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('hashchange',schedule);
  window.setTimeout(patch,100);
  window.setTimeout(patch,400);
})();
