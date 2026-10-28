/* SNGAMER STORE — AUTHORITATIVE STOREFRONT UI
   Single owner for the customer header controls, profile entry,
   hero equalization and storefront numeric price color.
*/
(function(){
  'use strict';
  if(window.__SNGAMER_STOREFRONT_UI__) return;
  window.__SNGAMER_STOREFRONT_UI__=true;

  var STYLE_ID='sngamerStorefrontUiStyle';
  var PROFILE_ID='sngamerProfileEntry';

  function openProfile(){
    try{sessionStorage.setItem('sg_profile_return_section','home');}catch(e){}
    if(typeof window.navigateStore==='function'){window.navigateStore('profile');return;}
    var attempts=0;
    (function retry(){
      if(typeof window.navigateStore==='function') window.navigateStore('profile');
      else if(++attempts<40) setTimeout(retry,100);
    })();
  }

  function userSvg(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4 21c.8-4.1 3.5-6.5 8-6.5s7.2 2.4 8 6.5"></path></svg>';}
  function cartSvg(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6"></path><circle cx="10" cy="20" r="1.3"></circle><circle cx="18" cy="20" r="1.3"></circle></svg>';}

  function installStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=''+
      '.siteHeader .nav{display:flex!important;align-items:center!important;gap:10px!important;}'+
      '.siteHeader .nav>.searchPremiumButton,.siteHeader .nav>.sngamerProfileEntry,.siteHeader .nav>.profilePremiumButton,.siteHeader .nav>.cartButton{width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;max-width:46px!important;max-height:46px!important;flex:0 0 46px!important;padding:0!important;margin:0!important;border-radius:15px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;position:relative!important;box-sizing:border-box!important;background:linear-gradient(135deg,#167fff,#5b35ff 55%,#d326a8)!important;border:1px solid rgba(132,188,255,.42)!important;color:#fff!important;box-shadow:0 10px 28px rgba(44,91,255,.2),inset 0 1px 0 rgba(255,255,255,.12)!important;}'+
      '.siteHeader .nav>.searchPremiumButton{order:1!important;margin-left:auto!important;}'+
      '.siteHeader .nav>.cartButton{order:2!important;}'+
      '.siteHeader .nav>.sngamerProfileEntry,.siteHeader .nav>.profilePremiumButton{order:3!important;cursor:pointer!important;}'+
      '.siteHeader .nav>.searchPremiumButton svg,.siteHeader .nav>.sngamerProfileEntry svg,.siteHeader .nav>.profilePremiumButton svg,.siteHeader .nav>.cartButton svg{width:22px!important;height:22px!important;display:block!important;}'+
      '.siteHeader .nav>.cartButton>span:not(.cartIcon){display:none!important;}'+
      '.siteHeader .nav>.cartButton .cartIcon{display:inline-flex!important;width:22px!important;height:22px!important;align-items:center!important;justify-content:center!important;font-size:0!important;}'+
      '.siteHeader .nav>.cartButton .cartIcon svg{display:block!important;}'+
      '.siteHeader .nav>.cartButton b{position:absolute!important;top:-5px!important;right:-5px!important;min-width:18px!important;height:18px!important;padding:0 4px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:999px!important;background:linear-gradient(135deg,#ff4d9d,#7c3aed)!important;border:2px solid #050912!important;color:#fff!important;font-size:9px!important;line-height:1!important;z-index:5!important;}'+
      '#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent,#products .card.productCardClickable .info .priceCurrent{color:#FFD21A!important;text-shadow:0 0 12px rgba(255,210,26,.1)!important;}'+
      '#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent small,#products .card.productCardClickable .info .priceCurrent small{color:#aebacc!important;text-shadow:none!important;}'+
      '@media(max-width:700px){.siteHeader .nav>.searchPremiumButton,.siteHeader .nav>.sngamerProfileEntry,.siteHeader .nav>.profilePremiumButton,.siteHeader .nav>.cartButton{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;max-width:40px!important;max-height:40px!important;border-radius:13px!important;}.siteHeader .nav>.searchPremiumButton svg,.siteHeader .nav>.sngamerProfileEntry svg,.siteHeader .nav>.profilePremiumButton svg,.siteHeader .nav>.cartButton svg{width:20px!important;height:20px!important;}.siteHeader .nav{gap:7px!important;}}';
    document.head.appendChild(s);
  }

  function syncHeader(){
    var nav=document.querySelector('.siteHeader .nav');if(!nav)return;
    var cart=nav.querySelector('.cartButton');
    if(cart){
      cart.type='button';cart.setAttribute('aria-label','Ouvrir le panier');cart.title='Panier';
      var count=cart.querySelector('#count');
      if(!count){count=document.createElement('b');count.id='count';count.textContent='0';}
      cart.innerHTML='<span class="cartIcon" aria-hidden="true">'+cartSvg()+'</span>';cart.appendChild(count);
      cart.onclick=function(e){if(e)e.preventDefault();if(typeof window.cart==='function')window.cart();};
    }
    var profile=nav.querySelector('#profilePremiumButton')||nav.querySelector('#'+PROFILE_ID);
    if(!profile){
      profile=document.createElement('button');profile.id=PROFILE_ID;profile.className=PROFILE_ID;profile.type='button';
      profile.setAttribute('aria-label','Ouvrir mon profil');profile.title='Mon profil';profile.innerHTML=userSvg();profile.addEventListener('click',openProfile);
    }
    /* Canonical order: Search -> Cart -> Profile. */
    if(cart) nav.insertBefore(profile,cart.nextSibling); else nav.appendChild(profile);
  }

  function sync(){installStyles();syncHeader();}
  function boot(){
    sync();[100,400,900,1800].forEach(function(t){setTimeout(sync,t);});
    if(!window.__sngStorefrontUiObserver){window.__sngStorefrontUiObserver=new MutationObserver(function(){sync();});window.__sngStorefrontUiObserver.observe(document.body,{childList:true,subtree:true});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
