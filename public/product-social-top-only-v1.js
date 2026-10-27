(function(){
  'use strict';
  if(window.__sngProductSocialTopOnlyV1Loaded)return;
  window.__sngProductSocialTopOnlyV1Loaded=true;

  function installStyles(){
    if(document.getElementById('sngProductSocialTopOnlyV1Styles'))return;
    const style=document.createElement('style');
    style.id='sngProductSocialTopOnlyV1Styles';
    style.textContent=`
      #productDetail .productMainImage{position:relative!important;overflow:visible!important;}
      #productDetail .productMainImage .sngSocialActions{
        position:absolute!important;top:10px!important;left:10px!important;right:10px!important;
        z-index:99999!important;width:auto!important;max-width:none!important;margin:0!important;padding:0!important;
        display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;
        pointer-events:none!important;box-sizing:border-box!important;
      }
      #productDetail .productMainImage .sngSocialBtn{
        pointer-events:auto!important;box-sizing:border-box!important;width:46px!important;min-width:46px!important;max-width:46px!important;
        height:46px!important;min-height:46px!important;max-height:46px!important;padding:0!important;margin:0!important;
        display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:0!important;
        border:1.5px solid rgba(255,255,255,.62)!important;border-radius:14px!important;color:#fff!important;
        background:rgba(5,12,25,.90)!important;backdrop-filter:blur(14px) saturate(145%)!important;
        -webkit-backdrop-filter:blur(14px) saturate(145%)!important;
        box-shadow:0 7px 20px rgba(0,0,0,.48),0 0 0 2px rgba(5,12,25,.28),inset 0 1px 0 rgba(255,255,255,.22)!important;
        font-size:24px!important;line-height:1!important;font-weight:800!important;white-space:nowrap!important;
      }
      #productDetail .productMainImage .sngFavIcon,#productDetail .productMainImage .sngShareIcon{font-size:24px!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;}
      #productDetail .productMainImage .sngSocialBtn > span:not(.sngFavIcon):not(.sngShareIcon){display:none!important;}
      #productDetail .productMainImage .sngFavBtn.isFavorite{color:#fff!important;border-color:rgba(255,133,190,.88)!important;background:linear-gradient(135deg,rgba(130,18,72,.94),rgba(196,35,112,.88))!important;}

      /* The bottom social-action version is forbidden: only the image version is visible. */
      #productDetail .sngProductSocial .sngSocialActions{display:none!important;}
      #productDetail .productMainImage .sngSocialActions{display:flex!important;}
      #productDetail .productMainImage .sngProductSocial .sngSocialActions{display:flex!important;}
    `;
    document.head.appendChild(style);
  }

  function moveOnlySocialActions(){
    const detail=document.getElementById('productDetail');
    if(!detail)return false;
    const gallery=detail.querySelector('.productMainImage');
    if(!gallery)return false;
    const actions=detail.querySelector('.sngSocialActions');
    if(!actions)return false;
    if(actions.parentElement!==gallery)gallery.appendChild(actions);
    return true;
  }

  function run(){installStyles();moveOnlySocialActions();}
  function start(){
    run();
    if(document.documentElement&&!window.__sngProductSocialTopOnlyV1Observer){
      window.__sngProductSocialTopOnlyV1Observer=new MutationObserver(run);
      window.__sngProductSocialTopOnlyV1Observer.observe(document.documentElement,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
