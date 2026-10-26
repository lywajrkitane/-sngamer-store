(function(){
  'use strict';
  if(window.__sngProductImageActionsCanonicalTopLoaded)return;
  window.__sngProductImageActionsCanonicalTopLoaded=true;

  function installStyles(){
    if(document.getElementById('sngProductImageActionsCanonicalTopStyles'))return;
    const style=document.createElement('style');
    style.id='sngProductImageActionsCanonicalTopStyles';
    style.textContent=`
      #productDetail .productMainImage{position:relative!important;overflow:visible!important;}
      #productDetail .productMainImage .sngSocialActions{
        position:absolute!important;top:12px!important;left:12px!important;right:12px!important;
        z-index:9999!important;width:auto!important;max-width:none!important;margin:0!important;padding:0!important;
        display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;
        pointer-events:none!important;
      }
      #productDetail .productMainImage .sngSocialBtn{
        pointer-events:auto!important;box-sizing:border-box!important;width:48px!important;min-width:48px!important;max-width:48px!important;
        height:48px!important;min-height:48px!important;max-height:48px!important;padding:0!important;margin:0!important;
        display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:0!important;
        border:1.5px solid rgba(255,255,255,.62)!important;border-radius:15px!important;color:#fff!important;
        background:rgba(5,12,25,.90)!important;backdrop-filter:blur(14px) saturate(145%)!important;-webkit-backdrop-filter:blur(14px) saturate(145%)!important;
        box-shadow:0 7px 20px rgba(0,0,0,.48),0 0 0 2px rgba(5,12,25,.28),inset 0 1px 0 rgba(255,255,255,.22)!important;
        font-size:25px!important;line-height:1!important;font-weight:800!important;white-space:nowrap!important;
        text-shadow:0 1px 3px rgba(0,0,0,.55)!important;transition:transform .16s ease,background .16s ease,border-color .16s ease,box-shadow .16s ease!important;
      }
      #productDetail .productMainImage .sngSocialBtn:hover{
        transform:translateY(-2px)!important;background:linear-gradient(135deg,rgba(20,125,255,.96),rgba(111,50,235,.96))!important;
        border-color:rgba(255,255,255,.82)!important;box-shadow:0 10px 25px rgba(0,0,0,.52),0 0 18px rgba(79,104,255,.28),inset 0 1px 0 rgba(255,255,255,.3)!important;
      }
      #productDetail .productMainImage .sngSocialBtn:active{transform:scale(.94)!important;}
      #productDetail .productMainImage .sngFavBtn.isFavorite{
        border-color:rgba(255,133,190,.88)!important;color:#fff!important;background:linear-gradient(135deg,rgba(130,18,72,.94),rgba(196,35,112,.88))!important;
        box-shadow:0 7px 20px rgba(0,0,0,.48),0 0 16px rgba(255,70,145,.22),inset 0 1px 0 rgba(255,255,255,.24)!important;
      }
      #productDetail .productMainImage .sngFavBtn:not(.isFavorite){color:#fff!important;}
      #productDetail .productMainImage .sngFavIcon,#productDetail .productMainImage .sngShareIcon{font-size:25px!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;}
      #productDetail .productMainImage .sngSocialBtn > span:not(.sngFavIcon):not(.sngShareIcon){display:none!important;}
      @media(max-width:700px){
        #productDetail .productMainImage .sngSocialActions{top:10px!important;left:10px!important;right:10px!important;}
        #productDetail .productMainImage .sngSocialBtn{width:46px!important;min-width:46px!important;max-width:46px!important;height:46px!important;min-height:46px!important;max-height:46px!important;border-radius:14px!important;font-size:24px!important;}
        #productDetail .productMainImage .sngFavIcon,#productDetail .productMainImage .sngShareIcon{font-size:24px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function moveActions(){
    const detail=document.getElementById('productDetail');
    if(!detail)return false;
    const gallery=detail.querySelector('.productMainImage');
    const actions=detail.querySelector('.sngSocialActions');
    if(!gallery||!actions)return false;
    if(actions.parentElement!==gallery)gallery.appendChild(actions);
    return true;
  }

  function run(){
    installStyles();
    moveActions();
  }

  function observe(){
    run();
    if(!document.documentElement)return;
    if(!window.__sngProductImageActionsCanonicalTopObserver){
      window.__sngProductImageActionsCanonicalTopObserver=new MutationObserver(run);
      window.__sngProductImageActionsCanonicalTopObserver.observe(document.documentElement,{childList:true,subtree:true});
    }
    let attempts=0;
    const timer=setInterval(function(){
      attempts++;
      if(moveActions()||attempts>=100)clearInterval(timer);
    },50);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});
  else observe();
})();
