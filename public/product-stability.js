/* SNGAMER STORE
   Product rendering is intentionally centralized in public/app.js.
   A previous secondary renderer used a different category classifier and
   could erase the primary product cards after a section transition.
   This file intentionally performs no product rendering mutations.
*/
(() => {
  "use strict";

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
      /* HOME PRODUCT CARDS — PROMO PRICE HIERARCHY
         Row 1: crossed-out regular price + discount badge.
         Row 2: promotional price aligned with the other product prices.
         The badge is structurally separated from the old price and cart button. */
      #products .card.productCardClickable .price.price--promo{
        position:relative!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:stretch!important;
        justify-content:flex-end!important;
        gap:5px!important;
        width:100%!important;
        min-height:48px!important;
        height:48px!important;
        margin-top:auto!important;
        padding:0!important;
        overflow:visible!important;
      }

      /* Regular price + discount badge: content-sized columns.
         The old price must have enough room to show the complete FCFA text. */
      #products .card.productCardClickable .price.price--promo .priceOldRow{
        display:flex!important;
        flex-direction:row!important;
        align-items:center!important;
        justify-content:flex-start!important;
        gap:10px!important;
        width:100%!important;
        height:18px!important;
        min-height:18px!important;
        margin:0!important;
        padding:0!important;
        line-height:1!important;
        overflow:visible!important;
        white-space:nowrap!important;
      }

      #products .card.productCardClickable .price.price--promo .priceOld{
        display:inline-block!important;
        flex:0 0 auto!important;
        min-width:max-content!important;
        max-width:none!important;
        width:max-content!important;
        margin:0!important;
        padding:0!important;
        color:#7f8da0!important;
        font-size:8.5px!important;
        line-height:1!important;
        font-weight:650!important;
        white-space:nowrap!important;
        text-decoration:line-through!important;
        text-decoration-thickness:1.2px!important;
        opacity:.9!important;
        overflow:visible!important;
        text-overflow:clip!important;
      }

      /* Keep the existing pink/red badge color. Position only is changed. */
      #products .card.productCardClickable .price.price--promo .priceOldRow .discountBadge{
        position:static!important;
        inset:auto!important;
        display:inline-flex!important;
        flex:0 0 auto!important;
        align-items:center!important;
        justify-content:center!important;
        width:max-content!important;
        min-width:40px!important;
        max-width:42px!important;
        height:18px!important;
        min-height:18px!important;
        margin:0!important;
        padding:2px 5px!important;
        box-sizing:border-box!important;
        border-radius:6px!important;
        font-size:8px!important;
        line-height:1!important;
        font-weight:900!important;
        white-space:nowrap!important;
        transform:none!important;
        z-index:3!important;
      }

      /* Promotional price is isolated on its own bottom line. */
      #products .card.productCardClickable .price.price--promo .pricePromoMain{
        display:flex!important;
        align-items:baseline!important;
        justify-content:flex-start!important;
        gap:0!important;
        width:100%!important;
        min-width:0!important;
        height:24px!important;
        min-height:24px!important;
        margin:0!important;
        padding:0!important;
        overflow:visible!important;
      }

      #products .card.productCardClickable .price.price--promo .pricePromoMain .priceCurrent{
        display:inline-flex!important;
        align-items:baseline!important;
        flex:0 0 auto!important;
        width:auto!important;
        max-width:100%!important;
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

      /* Only FCFA is grey, while the promotional number stays gold. */
      #products .card.productCardClickable .price.price--promo .priceCurrent small{
        margin-left:3px!important;
        color:#aebacc!important;
        font-size:.58em!important;
        font-weight:800!important;
        letter-spacing:0!important;
        white-space:nowrap!important;
      }

      /* Keep the cart button in its own area, below the price block. */
      #products .card.productCardClickable .productCardBottom{
        position:static!important;
        margin-top:8px!important;
        z-index:20!important;
      }

      @media(max-width:700px){
        #products .card.productCardClickable .price.price--promo{
          min-height:47px!important;
          height:47px!important;
          gap:5px!important;
        }
        #products .card.productCardClickable .price.price--promo .priceOldRow{
          display:flex!important;
          flex-direction:row!important;
          align-items:center!important;
          justify-content:flex-start!important;
          gap:8px!important;
          width:100%!important;
          height:17px!important;
          min-height:17px!important;
          overflow:visible!important;
          white-space:nowrap!important;
        }
        #products .card.productCardClickable .price.price--promo .priceOld{
          flex:0 0 auto!important;
          width:max-content!important;
          min-width:max-content!important;
          max-width:none!important;
          font-size:8px!important;
          overflow:visible!important;
        }
        #products .card.productCardClickable .price.price--promo .priceOldRow .discountBadge{
          flex:0 0 auto!important;
          min-width:40px!important;
          max-width:42px!important;
          height:17px!important;
          min-height:17px!important;
          padding:2px 5px!important;
          font-size:8px!important;
        }
        #products .card.productCardClickable .price.price--promo .priceCurrent{
          font-size:16px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function movePromoBadgesToOldPriceRow(root=document) {
    root.querySelectorAll("#products .card.productCardClickable .price.price--promo").forEach(price => {
      const oldRow = price.querySelector(":scope > .priceOldRow");
      const promoMain = price.querySelector(":scope > .pricePromoMain");
      if (!oldRow || !promoMain) return;
      const badge = promoMain.querySelector(":scope > .discountBadge");
      if (!badge) return;
      oldRow.appendChild(badge);
    });
  }

  function init() {
    installHomePromoPriceFix();
    movePromoBadgesToOldPriceRow();

    const grid = document.getElementById("products");
    if (grid && !grid.dataset.sngamerPromoObserver) {
      const observer = new MutationObserver(() => movePromoBadgesToOldPriceRow(grid));
      observer.observe(grid, { childList:true, subtree:true });
      grid.dataset.sngamerPromoObserver = "1";
    }

    loadBuyNowFix();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
