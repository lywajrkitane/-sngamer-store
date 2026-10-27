(function(){
  "use strict";

  /*
   * The product detail renderer in app.js is now the single source of truth for:
   * - description + Voir plus / Voir moins
   * - delivery / condition / warranty cards
   * This compatibility layer only keeps the cards immediately below the description.
   * It must never create a second warranty card or a second description toggle.
   */
  const STYLE_ID="sng-product-polish-v2";

  function installStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .sngProductInfoV1>.sngProductAssuranceGrid{margin-top:16px;}
      .sngProductInfoV1>.productDescriptionSection{margin-top:18px;}
      .sngProductAssuranceGrid .sngAssuranceItem{min-width:0!important;box-sizing:border-box!important;}
      .sngProductAssuranceGrid .sngAssuranceCopy{min-width:0!important;overflow:hidden!important;}
      .sngProductAssuranceGrid .sngAssuranceCopy strong,
      .sngProductAssuranceGrid .sngAssuranceCopy p,
      .sngProductAssuranceGrid .sngAssuranceCopy small{display:block;overflow:hidden;text-overflow:ellipsis;}

      /* SNGAMER — compact commercial delivery notice: one clean line on mobile. */
      #productModal #productDetail .sngProductDeliveryNotice{
        grid-template-columns:24px minmax(0,1fr)!important;
        gap:7px!important;
        padding:9px 11px!important;
        margin-top:10px!important;
        min-height:0!important;
        align-items:center!important;
      }
      #productModal #productDetail .sngProductDeliveryIcon{
        width:22px!important;
        height:22px!important;
        font-size:18px!important;
        line-height:1!important;
      }
      #productModal #productDetail .sngProductDeliveryNotice p{
        min-width:0!important;
        margin:0!important;
        font-size:12px!important;
        line-height:1.15!important;
        font-weight:750!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:clip!important;
      }
      #productModal #productDetail .sngProductDeliveryNotice strong{
        font-weight:900!important;
        white-space:nowrap!important;
      }
      @media(max-width:700px){
        #productModal #productDetail .sngProductDeliveryNotice{
          grid-template-columns:22px minmax(0,1fr)!important;
          gap:6px!important;
          padding:8px 10px!important;
          margin-top:9px!important;
          border-radius:10px!important;
        }
        #productModal #productDetail .sngProductDeliveryIcon{
          width:20px!important;
          height:20px!important;
          font-size:17px!important;
        }
        #productModal #productDetail .sngProductDeliveryNotice p{
          font-size:11px!important;
          line-height:1.15!important;
          letter-spacing:-.1px!important;
        }
      }
      @media(max-width:380px){
        #productModal #productDetail .sngProductDeliveryNotice p{font-size:10px!important;letter-spacing:-.15px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function moveModules(info){
    if(!info) return;
    const assurance=info.querySelector(":scope > .sngProductAssuranceGrid");
    const description=info.querySelector(":scope > .productDescriptionSection");
    if(!assurance||!description) return;
    /* app.js already renders exactly three cards. Never append another warranty card. */
    description.insertAdjacentElement("afterend",assurance);
  }

  function patch(){
    installStyles();
    const info=document.querySelector("#productDetail .sngProductInfoV1");
    if(!info) return;
    moveModules(info);
  }

  function patchOpenProduct(){
    if(typeof window.openProduct!=="function"||window.__sngProductPolishV2) return;
    const original=window.openProduct;
    window.openProduct=function(id){
      const result=original.apply(this,arguments);
      requestAnimationFrame(()=>requestAnimationFrame(patch));
      setTimeout(patch,250);
      return result;
    };
    window.__sngProductPolishV2=true;
  }

  function start(){
    installStyles();
    patchOpenProduct();
    patch();
    const observer=new MutationObserver(()=>patchOpenProduct());
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();