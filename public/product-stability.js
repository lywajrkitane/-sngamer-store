/* SNGAMER STORE
   Product rendering is intentionally centralized in public/app.js.
   A previous secondary renderer used a different category classifier and
   could erase the primary product cards after a section transition.
   This file intentionally performs no product rendering mutations.
*/
(() => {
  "use strict";

  // Load the isolated single-product checkout fix after the main product renderer
  // has initialized, without touching the existing cart implementation.
  function loadBuyNowFix() {
    if (document.querySelector('script[data-sngamer-buy-now-fix="1"]')) return;
    const script = document.createElement("script");
    script.src = "/buy-now-single-product-fix.js?v=20261024-pricehierarchy1";
    script.dataset.sngamerBuyNowFix = "1";
    document.body.appendChild(script);
  }

  function installHomePromoPriceFix() {
    if (document.getElementById("sngamer-home-promo-price-fix")) return;
    const style = document.createElement("style");
    style.id = "sngamer-home-promo-price-fix";
    style.textContent = `
      /* HOME PRODUCT CARDS — FINAL PROMO PRICE SEPARATION */
      #products .card.productCardClickable .price.price--promo{
        position:relative!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:flex-start!important;
        justify-content:flex-end!important;
        gap:4px!important;
        width:100%!important;
        min-height:46px!important;
        height:46px!important;
        margin-top:auto!important;
        padding:0!important;
        overflow:visible!important;
      }

      #products .card.productCardClickable .price.price--promo .priceOldRow{
        display:flex!important;
        align-items:center!important;
        width:100%!important;
        height:12px!important;
        min-height:12px!important;
        margin:0!important;
        padding:0!important;
        line-height:1!important;
      }

      #products .card.productCardClickable .price.price--promo .priceOld{
        display:block!important;
        max-width:100%!important;
        margin:0!important;
        padding:0!important;
        color:#7f8da0!important;
        font-size:9px!important;
        line-height:1!important;
        font-weight:650!important;
        white-space:nowrap!important;
        text-decoration:line-through!important;
        text-decoration-thickness:1.2px!important;
        opacity:.9!important;
      }

      #products .card.productCardClickable .price.price--promo .pricePromoMain{
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        gap:6px!important;
        width:100%!important;
        min-width:0!important;
        height:26px!important;
        min-height:26px!important;
        margin:0!important;
        padding:0!important;
        overflow:visible!important;
      }

      #products .card.productCardClickable .price.price--promo .pricePromoMain .priceCurrent{
        display:inline-flex!important;
        align-items:baseline!important;
        flex:0 0 auto!important;
        width:auto!important;
        max-width:calc(100% - 42px)!important;
        margin:0!important;
        padding:0!important;
        color:#F4D58D!important;
        font-size:17px!important;
        line-height:1!important;
        font-weight:900!important;
        letter-spacing:-.25px!important;
        white-space:nowrap!important;
        text-shadow:0 0 12px rgba(244,213,141,.12)!important;
      }

      #products .card.productCardClickable .price.price--promo .priceCurrent small{
        margin-left:3px!important;
        color:#d8c58e!important;
        font-size:.58em!important;
        font-weight:800!important;
        letter-spacing:0!important;
        white-space:nowrap!important;
      }

      #products .card.productCardClickable .price.price--promo .pricePromoMain .discountBadge{
        position:static!important;
        inset:auto!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        flex:0 0 auto!important;
        width:auto!important;
        min-width:0!important;
        max-width:40px!important;
        height:18px!important;
        min-height:18px!important;
        margin:0!important;
        padding:2px 5px!important;
        border:1px solid rgba(255,78,112,.22)!important;
        border-radius:6px!important;
        background:rgba(255,61,96,.09)!important;
        color:#ff6685!important;
        font-size:8px!important;
        line-height:1!important;
        font-weight:900!important;
        white-space:nowrap!important;
        box-shadow:none!important;
        transform:none!important;
        z-index:auto!important;
      }

      @media(max-width:700px){
        #products .card.productCardClickable .price.price--promo{
          min-height:45px!important;
          height:45px!important;
          gap:4px!important;
        }
        #products .card.productCardClickable .price.price--promo .pricePromoMain{
          gap:5px!important;
        }
        #products .card.productCardClickable .price.price--promo .priceCurrent{
          font-size:16px!important;
        }
        #products .card.productCardClickable .price.price--promo .pricePromoMain .discountBadge{
          height:17px!important;
          min-height:17px!important;
          padding:2px 5px!important;
          font-size:8px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    installHomePromoPriceFix();
    loadBuyNowFix();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
