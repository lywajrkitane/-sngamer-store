/* SNGAMER STORE — MASTER STOREFRONT HEADER / HERO CONTROLLER */
(function(){
  'use strict';
  if(window.__sngamerMasterStorefrontController) return;
  window.__sngamerMasterStorefrontController=true;

  var STYLE_ID='sngamer-master-storefront-v1';
  var PROFILE_ID='sngMasterProfileButton';

  function goProfile(){
    try{sessionStorage.setItem('sg_profile_return_section','home');}catch(_){ }
    if(typeof window.navigateStore==='function'){
      window.navigateStore('profile');
      return;
    }
    var tries=0;
    (function retry(){
      if(typeof window.navigateStore==='function') window.navigateStore('profile');
      else if(++tries<30) setTimeout(retry,100);
    })();
  }

  function installStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      /* ===== MASTER HEADER ===== */
      .siteHeader .nav{display:flex!important;align-items:center!important;gap:10px!important;min-height:72px!important;}
      .siteHeader .nav>.searchPremiumButton,
      .siteHeader .nav>.${PROFILE_ID},
      .siteHeader .nav>.cartButton{
        width:46px!important;min-width:46px!important;max-width:46px!important;
        height:46px!important;min-height:46px!important;max-height:46px!important;
        flex:0 0 46px!important;padding:0!important;margin:0!important;
        border-radius:15px!important;display:inline-flex!important;
        align-items:center!important;justify-content:center!important;
        position:relative!important;box-sizing:border-box!important;
        background:linear-gradient(135deg,#167fff 0%,#5b35ff 55%,#d326a8 100%)!important;
        border:1px solid rgba(132,188,255,.42)!important;color:#fff!important;
        box-shadow:0 10px 28px rgba(44,91,255,.20),inset 0 1px 0 rgba(255,255,255,.12)!important;
      }
      .siteHeader .nav>.searchPremiumButton{order:1!important;margin-left:auto!important;}
      .siteHeader .nav>.${PROFILE_ID}{order:2!important;}
      .siteHeader .nav>.cartButton{order:3!important;}
      .siteHeader .nav>.searchPremiumButton svg{width:22px!important;height:22px!important;display:block!important;}
      .siteHeader .nav>.cartButton>span:not(.cartIcon){display:none!important;}
      .siteHeader .nav>.cartButton .cartIcon{display:inline-flex!important;width:22px!important;height:22px!important;align-items:center!important;justify-content:center!important;font-size:19px!important;line-height:1!important;}
      .siteHeader .nav>.cartButton b{position:absolute!important;top:-5px!important;right:-5px!important;min-width:18px!important;height:18px!important;padding:0 4px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:999px!important;background:linear-gradient(135deg,#ff4d9d,#7c3aed)!important;border:2px solid #050912!important;color:#fff!important;font-size:9px!important;line-height:1!important;z-index:5!important;}
      .siteHeader .nav>.${PROFILE_ID}{appearance:none!important;cursor:pointer!important;}
      .siteHeader .nav>.${PROFILE_ID} svg{width:22px!important;height:22px!important;display:block!important;}

      /* ===== MASTER PRICE COLOR ===== */
      #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent,
      #products .card.productCardClickable .info .priceCurrent{
        color:#FFD21A!important;text-shadow:0 0 12px rgba(255,210,26,.10)!important;
      }
      #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent small,
      #products .card.productCardClickable .info .priceCurrent small{
        color:#aebacc!important;text-shadow:none!important;
      }

      /* ===== MASTER HERO HEIGHT =====
         The left announcement card and right visual card are the two visible
         hero panels. They are forced to one shared height on tablet/desktop. */
      @media(min-width:701px){
        .hero.professional-hero .heroIn{align-items:center!important;}
        .hero.professional-hero .heroIn p.heroAnnouncement,
        .hero.professional-hero .heroVisual{
          height:256px!important;min-height:256px!important;max-height:256px!important;
          box-sizing:border-box!important;
        }
        .hero.professional-hero .heroVisual{overflow:hidden!important;}
        .hero.professional-hero .heroVisual .defaultHeroContent{height:100%!important;min-height:0!important;box-sizing:border-box!important;}
      }
      @media(max-width:700px){
        .siteHeader .nav>.${PROFILE_ID}{display:none!important;}
      }
    `;
    document.head.appendChild(s);
  }

  function svgUser(){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4 21c.8-4.1 3.5-6.5 8-6.5s7.2 2.4 8 6.5"></path></svg>';
  }

  function normalizeCart(nav){
    var old=nav.querySelector('.cartButton');
    if(!old) return;
    old.type='button';
    old.setAttribute('aria-label','Ouvrir le panier');
    old.setAttribute('title','Panier');
    old.onclick=function(e){if(e)e.preventDefault();if(typeof window.cart==='function')window.cart();};
    var count=old.querySelector('#count');
    if(!count){count=document.createElement('b');count.id='count';count.textContent='0';}
    old.innerHTML='<span class="cartIcon" aria-hidden="true">🛒</span>';
    old.appendChild(count);
  }

  function ensureProfile(nav){
    var profile=document.getElementById(PROFILE_ID);
    if(!profile){
      profile=document.createElement('button');
      profile.id=PROFILE_ID;
      profile.className=PROFILE_ID;
      profile.type='button';
      profile.setAttribute('aria-label','Ouvrir mon profil');
      profile.setAttribute('title','Mon profil');
      profile.innerHTML=svgUser();
      profile.addEventListener('click',goProfile);
    }
    var cart=nav.querySelector('.cartButton');
    if(cart && profile.parentNode!==nav) nav.insertBefore(profile,cart);
    if(cart && profile.nextElementSibling!==cart) nav.insertBefore(profile,cart);
    return profile;
  }

  function normalizeHeader(){
    var nav=document.querySelector('.siteHeader .nav');
    if(!nav) return;
    normalizeCart(nav);
    ensureProfile(nav);
  }

  function normalizeHero(){
    if(window.innerWidth<701) return;
    var hero=document.querySelector('.hero.professional-hero')||document.querySelector('.hero');
    if(!hero) return;
    var left=hero.querySelector('p.heroAnnouncement');
    var right=hero.querySelector('.heroVisual');
    if(!left||!right) return;
    left.style.setProperty('height','256px','important');
    left.style.setProperty('min-height','256px','important');
    left.style.setProperty('max-height','256px','important');
    right.style.setProperty('height','256px','important');
    right.style.setProperty('min-height','256px','important');
    right.style.setProperty('max-height','256px','important');
    right.style.setProperty('box-sizing','border-box','important');
    var defaultContent=right.querySelector('.defaultHeroContent');
    if(defaultContent){
      defaultContent.style.setProperty('height','100%','important');
      defaultContent.style.setProperty('min-height','0','important');
      defaultContent.style.setProperty('box-sizing','border-box','important');
    }
  }

  function sync(){
    installStyles();
    normalizeHeader();
    normalizeHero();
  }

  function boot(){
    sync();
    [100,300,700,1200,2000,4000].forEach(function(ms){setTimeout(sync,ms);});
    if(window.ResizeObserver){
      try{
        var ro=new ResizeObserver(function(){normalizeHero();});
        var hero=document.querySelector('.hero');
        if(hero) ro.observe(hero);
      }catch(_){ }
    }
    if(!window.__sngamerMasterStorefrontObserver){
      window.__sngamerMasterStorefrontObserver=new MutationObserver(function(){sync();});
      window.__sngamerMasterStorefrontObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
    }
    window.addEventListener('resize',normalizeHero,{passive:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();