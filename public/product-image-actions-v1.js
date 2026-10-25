(function(){
  'use strict';
  if(window.__sngProductImageActionsV1Loaded)return;
  window.__sngProductImageActionsV1Loaded=true;

  function installStyles(){
    if(document.getElementById('sngProductImageActionsV1Styles'))return;
    const style=document.createElement('style');
    style.id='sngProductImageActionsV1Styles';
    style.textContent=`
#productModal #productDetail .productMainImage{
  position:relative!important;
}
#productModal #productDetail .productMainImage .sngSocialActions{
  position:absolute!important;
  top:12px!important;
  left:12px!important;
  right:12px!important;
  z-index:20!important;
  width:auto!important;
  max-width:none!important;
  margin:0!important;
  padding:0!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:10px!important;
  pointer-events:none!important;
}
#productModal #productDetail .productMainImage .sngSocialBtn{
  pointer-events:auto!important;
  width:44px!important;
  min-width:44px!important;
  max-width:44px!important;
  height:44px!important;
  min-height:44px!important;
  max-height:44px!important;
  padding:0!important;
  margin:0!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:0!important;
  border:1px solid rgba(255,255,255,.22)!important;
  border-radius:13px!important;
  color:#fff!important;
  background:rgba(7,14,28,.70)!important;
  backdrop-filter:blur(10px)!important;
  -webkit-backdrop-filter:blur(10px)!important;
  box-shadow:0 8px 22px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.16)!important;
  font-size:24px!important;
  line-height:1!important;
  font-weight:700!important;
  white-space:nowrap!important;
}
#productModal #productDetail .productMainImage .sngSocialBtn:hover{
  transform:translateY(-2px)!important;
  border-color:rgba(95,177,255,.65)!important;
  background:linear-gradient(135deg,rgba(20,125,255,.88),rgba(111,50,235,.88))!important;
  box-shadow:0 10px 28px rgba(30,105,255,.30)!important;
}
#productModal #productDetail .productMainImage .sngSocialBtn:active{
  transform:scale(.96)!important;
}
#productModal #productDetail .productMainImage .sngFavBtn.isFavorite{
  border-color:rgba(255,104,170,.60)!important;
  color:#ff8dbd!important;
  background:rgba(110,17,61,.68)!important;
}
#productModal #productDetail .productMainImage .sngFavIcon,
#productModal #productDetail .productMainImage .sngShareIcon{
  font-size:24px!important;
  line-height:1!important;
}
#productModal #productDetail .productMainImage .sngSocialBtn > span:not(.sngFavIcon):not(.sngShareIcon){
  display:none!important;
}
@media(max-width:700px){
  #productModal #productDetail .productMainImage .sngSocialActions{
    top:10px!important;
    left:10px!important;
    right:10px!important;
  }
  #productModal #productDetail .productMainImage .sngSocialBtn{
    width:42px!important;
    min-width:42px!important;
    max-width:42px!important;
    height:42px!important;
    min-height:42px!important;
    max-height:42px!important;
    border-radius:12px!important;
    font-size:23px!important;
  }
  #productModal #productDetail .productMainImage .sngFavIcon,
  #productModal #productDetail .productMainImage .sngShareIcon{
    font-size:23px!important;
  }
}
`;
    document.head.appendChild(style);
  }

  function moveActions(){
    const detail=document.querySelector('#productModal #productDetail');
    if(!detail)return false;
    const gallery=detail.querySelector('.productMainImage');
    const social=detail.querySelector('.sngProductSocial');
    const actions=detail.querySelector('.sngSocialActions');
    if(!gallery||!social||!actions)return false;
    if(actions.parentElement!==gallery)gallery.appendChild(actions);
    return true;
  }

  function watch(){
    installStyles();
    moveActions();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
  else watch();
  if(!window.__sngProductImageActionsV1Observer){
    window.__sngProductImageActionsV1Observer=new MutationObserver(function(){moveActions();});
    window.__sngProductImageActionsV1Observer.observe(document.body,{childList:true,subtree:true});
  }
  setTimeout(watch,100);
  setTimeout(watch,350);
  setTimeout(watch,800);
})();
