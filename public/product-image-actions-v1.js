(function(){
  'use strict';
  if(window.__sngProductImageActionsV2Loaded)return;
  window.__sngProductImageActionsV2Loaded=true;

  function installStyles(){
    if(document.getElementById('sngProductImageActionsV2Styles'))return;
    const style=document.createElement('style');
    style.id='sngProductImageActionsV2Styles';
    style.textContent=`
      #productDetail .productMainImage{position:relative!important;}
      #productDetail .productMainImage .sngSocialActions{
        position:absolute!important;top:12px!important;left:12px!important;right:12px!important;
        z-index:50!important;width:auto!important;max-width:none!important;margin:0!important;padding:0!important;
        display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;
        pointer-events:none!important;
      }
      #productDetail .productMainImage .sngSocialBtn{
        pointer-events:auto!important;box-sizing:border-box!important;width:44px!important;min-width:44px!important;max-width:44px!important;
        height:44px!important;min-height:44px!important;max-height:44px!important;padding:0!important;margin:0!important;
        display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:0!important;
        border:1px solid rgba(255,255,255,.24)!important;border-radius:13px!important;color:#fff!important;
        background:rgba(7,14,28,.74)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;
        box-shadow:0 8px 22px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.16)!important;
        font-size:24px!important;line-height:1!important;font-weight:700!important;white-space:nowrap!important;
      }
      #productDetail .productMainImage .sngSocialBtn:hover{transform:translateY(-2px)!important;background:linear-gradient(135deg,rgba(20,125,255,.9),rgba(111,50,235,.9))!important;}
      #productDetail .productMainImage .sngSocialBtn:active{transform:scale(.96)!important;}
      #productDetail .productMainImage .sngFavBtn.isFavorite{border-color:rgba(255,104,170,.65)!important;color:#ff8dbd!important;background:rgba(110,17,61,.72)!important;}
      #productDetail .productMainImage .sngFavIcon,#productDetail .productMainImage .sngShareIcon{font-size:24px!important;line-height:1!important;}
      #productDetail .productMainImage .sngSocialBtn > span:not(.sngFavIcon):not(.sngShareIcon){display:none!important;}
      @media(max-width:700px){
        #productDetail .productMainImage .sngSocialActions{top:10px!important;left:10px!important;right:10px!important;}
        #productDetail .productMainImage .sngSocialBtn{width:42px!important;min-width:42px!important;max-width:42px!important;height:42px!important;min-height:42px!important;max-height:42px!important;border-radius:12px!important;font-size:23px!important;}
        #productDetail .productMainImage .sngFavIcon,#productDetail .productMainImage .sngShareIcon{font-size:23px!important;}
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
    if(!window.__sngProductImageActionsV2Observer){
      window.__sngProductImageActionsV2Observer=new MutationObserver(run);
      window.__sngProductImageActionsV2Observer.observe(document.documentElement,{childList:true,subtree:true});
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
