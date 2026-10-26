(function(){
  'use strict';
  if(window.__sngProductImageActionsV3Loaded)return;
  window.__sngProductImageActionsV3Loaded=true;

  function install(){
    const detail=document.getElementById('productDetail');
    if(!detail)return false;
    const gallery=detail.querySelector('.productMainImage');
    const actions=detail.querySelector('.sngSocialActions');
    if(!gallery||!actions)return false;

    if(actions.parentElement!==gallery) gallery.appendChild(actions);

    gallery.style.position='relative';
    actions.style.cssText += ';position:absolute!important;top:10px!important;left:10px!important;right:10px!important;z-index:100!important;display:flex!important;align-items:center!important;justify-content:space-between!important;pointer-events:none!important;width:auto!important;max-width:none!important;margin:0!important;padding:0!important;gap:10px!important;';

    actions.querySelectorAll('.sngSocialBtn').forEach(btn=>{
      btn.style.cssText += ';pointer-events:auto!important;box-sizing:border-box!important;width:44px!important;min-width:44px!important;max-width:44px!important;height:44px!important;min-height:44px!important;max-height:44px!important;padding:0!important;margin:0!important;display:inline-flex!important;flex:0 0 auto!important;align-items:center!important;justify-content:center!important;gap:0!important;border:1px solid rgba(255,255,255,.32)!important;border-radius:13px!important;background:rgba(7,14,28,.78)!important;background-image:none!important;color:#fff!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;box-shadow:0 8px 22px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.18)!important;font-size:24px!important;line-height:1!important;font-weight:700!important;white-space:nowrap!important;';
      const text=btn.querySelector('span:not(.sngFavIcon):not(.sngShareIcon)');
      if(text) text.style.display='none';
    });

    const fav=actions.querySelector('.sngFavBtn');
    const share=actions.querySelector('.sngShareBtn');
    if(fav){fav.style.setProperty('border-color','rgba(255,255,255,.38)','important');fav.style.setProperty('color','#fff','important');}
    if(share){share.style.setProperty('border-color','rgba(255,255,255,.38)','important');share.style.setProperty('color','#fff','important');}
    return true;
  }

  function run(){install();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  let n=0;const timer=setInterval(()=>{if(install()||++n>120)clearInterval(timer)},100);
})();
