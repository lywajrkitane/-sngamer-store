(function(){
  'use strict';
  if(window.__sngProductImageActionsV2Loaded)return;
  window.__sngProductImageActionsV2Loaded=true;

  function install(){
    const detail=document.getElementById('productDetail');
    if(!detail)return false;
    const gallery=detail.querySelector('.productMainImage');
    const actions=detail.querySelector('.sngSocialActions');
    if(!gallery||!actions)return false;

    if(actions.parentElement!==gallery){
      gallery.appendChild(actions);
    }

    gallery.style.position='relative';
    actions.style.cssText += ';position:absolute!important;top:10px!important;left:10px!important;right:10px!important;z-index:100!important;display:flex!important;align-items:center!important;justify-content:space-between!important;pointer-events:none!important;width:auto!important;margin:0!important;padding:0!important;';

    actions.querySelectorAll('.sngSocialBtn').forEach(btn=>{
      btn.style.cssText += ';pointer-events:auto!important;width:42px!important;min-width:42px!important;max-width:42px!important;height:42px!important;min-height:42px!important;padding:0!important;margin:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border-radius:12px!important;';
      const text=btn.querySelector('span:not(.sngFavIcon):not(.sngShareIcon)');
      if(text)text.style.display='none';
    });
    return true;
  }

  function run(){install();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  let n=0;const timer=setInterval(()=>{if(install()||++n>120)clearInterval(timer)},100);
})();
