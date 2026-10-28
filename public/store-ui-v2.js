/* SNGAMER STORE — SINGLE AUTHORITATIVE HOME UI
   Owns only: header controls, client profile entry, hero equalization and price color.
   This replaces the previous fragmented desktop/profile/header patches. */
(function(){
  'use strict';
  if(window.__SNGAMER_STORE_UI_V2__) return;
  window.__SNGAMER_STORE_UI_V2__=true;

  var STYLE_ID='sngamerStoreUiV2Style';
  var PROFILE_ID='sngamerProfileV2';

  function profile(){
    try{sessionStorage.setItem('sg_profile_return_section','home');}catch(e){}
    if(typeof window.navigateStore==='function'){window.navigateStore('profile');return;}
    var n=0;(function retry(){
      if(typeof window.navigateStore==='function') window.navigateStore('profile');
      else if(++n<40) setTimeout(retry,100);
    })();
  }

  function userSvg(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4 21c.8-4.1 3.5-6.5 8-6.5s7.2 2.4 8 6.5"></path></svg>';}
  function cartSvg(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6"></path><circle cx="10" cy="20" r="1.3"></circle><circle cx="18" cy="20" r="1.3"></circle></svg>';}

  function styles(){
    if(document.getElementById(STYLE_ID)) return;
    var s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=''+
      '.siteHeader .nav{display:flex!important;align-items:center!important;gap:10px!important;}'+
      '.siteHeader .nav>.searchPremiumButton,.siteHeader .nav>.sngamerProfileV2,.siteHeader .nav>.cartButton{width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;max-width:46px!important;max-height:46px!important;flex:0 0 46px!important;padding:0!important;margin:0!important;border-radius:15px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;position:relative!important;box-sizing:border-box!important;background:linear-gradient(135deg,#167fff,#5b35ff 55%,#d326a8)!important;border:1px solid rgba(132,188,255,.42)!important;color:#fff!important;box-shadow:0 10px 28px rgba(44,91,255,.2),inset 0 1px 0 rgba(255,255,255,.12)!important;}'+
      '.siteHeader .nav>.searchPremiumButton{order:1!important;margin-left:auto!important;}'+
      '.siteHeader .nav>.sngamerProfileV2{order:2!important;cursor:pointer!important;}'+
      '.siteHeader .nav>.cartButton{order:3!important;}'+
      '.siteHeader .nav>.searchPremiumButton svg,.siteHeader .nav>.sngamerProfileV2 svg,.siteHeader .nav>.cartButton svg{width:22px!important;height:22px!important;display:block!important;}'+
      '.siteHeader .nav>.cartButton>span:not(.cartIcon){display:none!important;}'+
      '.siteHeader .nav>.cartButton .cartIcon{display:inline-flex!important;width:22px!important;height:22px!important;align-items:center!important;justify-content:center!important;font-size:0!important;}'+
      '.siteHeader .nav>.cartButton .cartIcon svg{display:block!important;}'+
      '.siteHeader .nav>.cartButton b{position:absolute!important;top:-5px!important;right:-5px!important;min-width:18px!important;height:18px!important;padding:0 4px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:999px!important;background:linear-gradient(135deg,#ff4d9d,#7c3aed)!important;border:2px solid #050912!important;color:#fff!important;font-size:9px!important;line-height:1!important;z-index:5!important;}'+
      '#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent,#products .card.productCardClickable .info .priceCurrent{color:#FFD21A!important;text-shadow:0 0 12px rgba(255,210,26,.1)!important;}'+
      '#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent small,#products .card.productCardClickable .info .priceCurrent small{color:#aebacc!important;text-shadow:none!important;}'+
      '@media(max-width:700px){.siteHeader .nav>.searchPremiumButton,.siteHeader .nav>.sngamerProfileV2,.siteHeader .nav>.cartButton{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;max-width:40px!important;max-height:40px!important;border-radius:13px!important;}.siteHeader .nav>.searchPremiumButton svg,.siteHeader .nav>.sngamerProfileV2 svg,.siteHeader .nav>.cartButton svg{width:20px!important;height:20px!important;}.siteHeader .nav{gap:7px!important;}}'+
      '@media(min-width:701px){.hero.professional-hero .heroIn{align-items:stretch!important;}.hero.professional-hero .heroIn p.heroAnnouncement,.hero.professional-hero .heroVisual{box-sizing:border-box!important;}.hero.professional-hero .heroVisual{overflow:hidden!important;}}';
    document.head.appendChild(s);
  }

  function header(){
    var nav=document.querySelector('.siteHeader .nav');if(!nav)return;
    var cart=nav.querySelector('.cartButton');
    if(cart){
      cart.type='button';cart.setAttribute('aria-label','Ouvrir le panier');cart.title='Panier';
      var count=cart.querySelector('#count');if(!count){count=document.createElement('b');count.id='count';count.textContent='0';}
      cart.innerHTML='<span class="cartIcon" aria-hidden="true">'+cartSvg()+'</span>';cart.appendChild(count);
      cart.onclick=function(e){if(e)e.preventDefault();if(typeof window.cart==='function')window.cart();};
    }
    var p=document.getElementById(PROFILE_ID);
    if(!p){p=document.createElement('button');p.id=PROFILE_ID;p.className=PROFILE_ID;p.type='button';p.setAttribute('aria-label','Ouvrir mon profil');p.title='Mon profil';p.innerHTML=userSvg();p.addEventListener('click',profile);}
    if(cart) nav.insertBefore(p,cart); else nav.appendChild(p);
  }

  function heroes(){
    if(window.innerWidth<701)return;
    var hero=document.querySelector('.hero.professional-hero')||document.querySelector('.hero');if(!hero)return;
    var left=hero.querySelector('p.heroAnnouncement'),right=hero.querySelector('.heroVisual');if(!left||!right)return;
    left.style.height='';right.style.height='';
    var h=Math.max(left.getBoundingClientRect().height,right.getBoundingClientRect().height);
    if(h<1)return;
    left.style.setProperty('height',Math.ceil(h)+'px','important');
    right.style.setProperty('height',Math.ceil(h)+'px','important');
    right.style.setProperty('min-height',Math.ceil(h)+'px','important');
    right.style.setProperty('max-height',Math.ceil(h)+'px','important');
  }

  function sync(){styles();header();heroes();}
  function boot(){sync();[100,400,900,1800].forEach(function(t){setTimeout(sync,t);});window.addEventListener('resize',heroes,{passive:true});if(window.ResizeObserver){var ro=new ResizeObserver(heroes);var hero=document.querySelector('.hero');if(hero)ro.observe(hero);}if(!window.__sngUiV2Observer){window.__sngUiV2Observer=new MutationObserver(function(){sync();});window.__sngUiV2Observer.observe(document.body,{childList:true,subtree:true});}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
