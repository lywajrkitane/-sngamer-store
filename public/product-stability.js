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
      /* HOME PRODUCT CARDS — FINAL PROMO PRICE SEPARATION
         Old price + discount badge share one protected row.
         Sale price stays on its own bottom line, aligned with regular prices.
      */
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

      /* Regular price and discount badge: SAME ROW. */
      #products .card.productCardClickable .price.price--promo .priceOldRow{
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        gap:6px!important;
        width:100%!important;
        height:18px!important;
        min-height:18px!important;
        margin:0!important;
        padding:0!important;
        line-height:1!important;
        overflow:visible!important;
      }

      #products .card.productCardClickable .price.price--promo .priceOld{
        display:block!important;
        flex:0 1 auto!important;
        min-width:0!important;
        max-width:calc(100% - 48px)!important;
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
        overflow:hidden!important;
        text-overflow:clip!important;
      }

      /* Keep the badge's existing pink/red SNGAMER color — position only. */
      #products .card.productCardClickable .price.price--promo .priceOldRow .discountBadge{
        position:static!important;
        inset:auto!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        flex:0 0 auto!important;
        width:auto!important;
        min-width:0!important;
        max-width:42px!important;
        height:18px!important;
        min-height:18px!important;
        margin:0!important;
        padding:2px 5px!important;
        border-radius:6px!important;
        font-size:8px!important;
        line-height:1!important;
        font-weight:900!important;
        white-space:nowrap!important;
        transform:none!important;
        z-index:3!important;
      }

      /* The sale price is isolated on the bottom price line. */
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

      /* Only the FCFA suffix is grey, like the crossed-out regular price. */
      #products .card.productCardClickable .price.price--promo .priceCurrent small{
        margin-left:3px!important;
        color:#aebacc!important;
        font-size:.58em!important;
        font-weight:800!important;
        letter-spacing:0!important;
        white-space:nowrap!important;
      }

      /* Safety: badge can never occupy the add-to-cart area. */
      #products .card.productCardClickable .productCardBottom{
        position:static!important;
        margin-top:8px!important;
        z-index:20!important;
      }

      @media(max-width:700px){
        #products .card.productCardClickable .price.price--promo{
          min-height:45px!important;
          height:45px!important;
          gap:4px!important;
        }
        #products .card.productCardClickable .price.price--promo .priceOldRow{
          height:17px!important;
          min-height:17px!important;
          gap:5px!important;
        }
        #products .card.productCardClickable .price.price--promo .priceOldRow .discountBadge{
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

    // app.js can re-render cards after filtering/searching; relocate the badge
    // again without replacing or changing any product/cart functionality.
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
