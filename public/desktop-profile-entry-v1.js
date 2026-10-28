/* SNGAMER STORE — stable header/profile controls */
(function(){
  'use strict';
  if(window.__sngDesktopProfileEntryV1) return;
  window.__sngDesktopProfileEntryV1=true;

  function go(section){
    const target=section||'home';
    if(typeof window.navigateStore==='function'){window.navigateStore(target);return;}
    try{sessionStorage.setItem('sg_profile_return_section',target);}catch(_){ }
    let n=0;
    (function retry(){if(typeof window.navigateStore==='function')window.navigateStore(target);else if(++n<20)setTimeout(retry,100);})();
  }

  function styles(){
    if(document.getElementById('sngStableHeaderStyles'))return;
    const s=document.createElement('style');
    s.id='sngStableHeaderStyles';
    s.textContent=`
      /* HEADER: search, profile and cart are always compact icon buttons. */
      .siteHeader .nav{display:flex!important;align-items:center!important;gap:10px!important;}
      .siteHeader .nav>.searchPremiumButton{order:1!important;margin-left:auto!important;width:46px!important;min-width:46px!important;height:46px!important;min-height:46px!important;padding:0!important;flex:0 0 46px!important;border-radius:15px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;}
      .siteHeader .nav>.sngDesktopProfileButton{order:2!important;margin-left:0!important;width:46px!important;min-width:46px!important;height:46px!important;min-height:46px!important;padding:0!important;flex:0 0 46px!important;border-radius:15px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;}
      .siteHeader .nav>.cartButton{order:3!important;margin-left:0!important;width:46px!important;min-width:46px!important;height:46px!important;min-height:46px!important;padding:0!important;flex:0 0 46px!important;border-radius:15px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:0!important;position:relative!important;box-sizing:border-box!important;}
      .siteHeader .nav>.searchPremiumButton,.siteHeader .nav>.sngDesktopProfileButton,.siteHeader .nav>.cartButton{background:linear-gradient(135deg,#167fff 0%,#5b35ff 55%,#d326a8 100%)!important;border:1px solid rgba(132,188,255,.42)!important;color:#fff!important;box-shadow:0 10px 28px rgba(44,91,255,.20),inset 0 1px 0 rgba(255,255,255,.12)!important;box-sizing:border-box!important;}
      .siteHeader .nav>.searchPremiumButton svg{width:22px!important;height:22px!important;}
      .siteHeader .nav>.cartButton>span:not(.cartIcon){display:none!important;}
      .siteHeader .nav>.cartButton .cartIcon{display:inline-flex!important;width:22px!important;height:22px!important;align-items:center!important;justify-content:center!important;font-size:19px!important;line-height:1!important;}
      .siteHeader .nav>.cartButton b{position:absolute!important;top:-5px!important;right:-5px!important;min-width:18px!important;height:18px!important;padding:0 4px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:999px!important;background:linear-gradient(135deg,#ff4d9d,#7c3aed)!important;border:2px solid #050912!important;color:#fff!important;font-size:9px!important;line-height:1!important;}
      .sngDesktopProfileButton{appearance:none!important;cursor:pointer!important;color:#fff!important;border:1px solid rgba(132,188,255,.42)!important;font:inherit!important;}
      .sngDesktopProfileButton>span:not(.sngDesktopProfileIcon){display:none!important;}
      .sngDesktopProfileIcon{width:22px!important;height:22px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;}
      .sngDesktopProfileIcon svg{width:22px!important;height:22px!important;display:block!important;}
      .sngDesktopProfileButton.is-hidden{display:none!important;}

      /* Profile page: keep existing customer space behavior. */
      #profileArea.sngDesktopProfileArea{width:100%;max-width:none;display:block!important;visibility:visible!important;}
      body.sngDesktopProfileMode .hero{display:none!important;}
      body.sngDesktopProfileMode #shop{padding-top:30px;padding-bottom:70px;}
      body.sngDesktopProfileMode #products,body.sngDesktopProfileMode #cats,body.sngDesktopProfileMode #navSubcategories{display:none!important;}

      /* HERO: the two visible panels always share the same height on tablet/desktop. */
      @media(min-width:701px){
        .professional-hero .heroIn{align-items:stretch!important;}
        .professional-hero .heroIn>div:first-child,.professional-hero .heroVisual.has-default-hero{height:360px!important;min-height:360px!important;max-height:360px!important;align-self:stretch!important;box-sizing:border-box!important;}
        .professional-hero .heroVisual.has-default-hero .defaultHeroContent{height:100%!important;min-height:0!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;}
      }

      /* Approved mobile yellow for the numeric price only. */
      #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent{color:#FFD21A!important;text-shadow:0 0 12px rgba(255,210,26,.10)!important;}
      #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent small{color:#aebacc!important;text-shadow:none!important;}
    `;
    document.head.appendChild(s);
  }

  function create(){
    const nav=document.querySelector('.siteHeader .nav');
    const cart=document.querySelector('.siteHeader .cartButton');
    if(!nav||!cart)return false;

    let profile=document.getElementById('sngDesktopProfileButton');
    if(!profile){
      profile=document.createElement('button');
      profile.id='sngDesktopProfileButton';
      profile.type='button';
      profile.className='sngDesktopProfileButton';
      profile.setAttribute('aria-label','Ouvrir mon profil');
      profile.setAttribute('title','Mon profil');
      profile.innerHTML='<span class="sngDesktopProfileIcon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21c.8-4.1 3.5-6.5 8-6.5s7.2 2.4 8 6.5"/></svg></span>';
      profile.addEventListener('click',function(){go('profile');});
      nav.insertBefore(profile,cart);
    }
    return true;
  }

  function sync(){
    create();
    const p=document.getElementById('sngDesktopProfileButton');
    const area=document.getElementById('profileArea');
    const active=window.activeStoreSection==='profile';
    document.body.classList.toggle('sngDesktopProfileMode',active);
    if(area)area.classList.toggle('sngDesktopProfileArea',active);
    if(p){p.classList.toggle('is-hidden',active);p.setAttribute('aria-hidden',active?'true':'false');p.tabIndex=active?-1:0;}
  }

  function boot(){
    styles();
    sync();
    [100,300,700,1500,3000,6000].forEach(function(ms){setTimeout(sync,ms);});
    new MutationObserver(function(){sync();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style','class']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();