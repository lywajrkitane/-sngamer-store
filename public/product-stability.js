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
    style.textContent = "\n/* Shared purchase row: the final price and + button occupy separate grid cells. */\n#products .card.productCardClickable .info .productCardPurchaseRow{\n  display:grid!important;\n  grid-template-columns:minmax(0,1fr) 40px!important;\n  grid-template-rows:18px 40px!important;\n  column-gap:8px!important;\n  row-gap:4px!important;\n  align-items:center!important;\n  width:100%!important;\n  min-width:0!important;\n  min-height:62px!important;\n  height:62px!important;\n  margin: auto 0 0!important;\n  padding:0!important;\n  flex:0 0 62px!important;\n  position:relative!important;\n  overflow:visible!important;\n}\n#products .card.productCardClickable .info .productCardPurchaseRow > .price{\n  display:contents!important;\n  position:static!important;\n  inset:auto!important;\n  width:auto!important;\n  min-width:0!important;\n  max-width:none!important;\n  min-height:0!important;\n  height:auto!important;\n  margin:0!important;\n  padding:0!important;\n  overflow:visible!important;\n  transform:none!important;\n}\n#products .card.productCardClickable .info .productCardPurchaseRow .priceOldRow{\n  grid-column:1 / -1!important;\n  grid-row:1!important;\n  display:flex!important;\n  flex-direction:row!important;\n  align-items:center!important;\n  justify-content:flex-start!important;\n  gap:8px!important;\n  width:100%!important;\n  min-width:0!important;\n  height:18px!important;\n  min-height:18px!important;\n  max-height:18px!important;\n  margin:0!important;\n  padding:0!important;\n  overflow:visible!important;\n  white-space:nowrap!important;\n  line-height:1!important;\n}\n#products .card.productCardClickable .info .priceOldRow--placeholder{visibility:hidden!important}\n#products .card.productCardClickable .info .productCardPurchaseRow .priceOld{\n  display:inline-block!important;\n  position:static!important;\n  flex:0 0 auto!important;\n  width:max-content!important;\n  min-width:max-content!important;\n  max-width:none!important;\n  height:auto!important;\n  margin:0!important;\n  padding:0!important;\n  color:#7f8da0!important;\n  font-size:8.5px!important;\n  font-weight:650!important;\n  line-height:1!important;\n  white-space:nowrap!important;\n  text-decoration:line-through!important;\n  text-decoration-thickness:1.2px!important;\n  overflow:visible!important;\n  text-overflow:clip!important;\n  transform:none!important;\n}\n#products .card.productCardClickable .info .productCardPurchaseRow .priceOldRow .discountBadge{\n  position:static!important;\n  inset:auto!important;\n  flex:0 0 auto!important;\n  display:inline-flex!important;\n  align-items:center!important;\n  justify-content:center!important;\n  width:auto!important;\n  min-width:40px!important;\n  max-width:44px!important;\n  height:18px!important;\n  min-height:18px!important;\n  max-height:18px!important;\n  margin:0!important;\n  padding:2px 5px!important;\n  box-sizing:border-box!important;\n  border-radius:6px!important;\n  font-size:8px!important;\n  line-height:1!important;\n  font-weight:900!important;\n  white-space:nowrap!important;\n  transform:none!important;\n  z-index:3!important;\n}\n#products .card.productCardClickable .info .productCardPurchaseRow .pricePromoMain{\n  grid-column:1!important;\n  grid-row:2!important;\n  display:flex!important;\n  align-items:center!important;\n  justify-content:flex-start!important;\n  align-self:stretch!important;\n  width:100%!important;\n  min-width:0!important;\n  height:40px!important;\n  min-height:40px!important;\n  max-height:40px!important;\n  margin:0!important;\n  padding:0!important;\n  gap:0!important;\n  overflow:visible!important;\n  white-space:nowrap!important;\n}\n#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent{\n  display:inline-flex!important;\n  align-items:baseline!important;\n  justify-content:flex-start!important;\n  flex:0 1 auto!important;\n  width:auto!important;\n  min-width:0!important;\n  max-width:100%!important;\n  margin:0!important;\n  padding:0!important;\n  gap:3px!important;\n  color:#F4D58D!important;\n  font-family:Montserrat,Arial,sans-serif!important;\n  font-size:16px!important;\n  font-weight:900!important;\n  line-height:1!important;\n  letter-spacing:-.25px!important;\n  white-space:nowrap!important;\n  text-shadow:0 0 12px rgba(244,213,141,.12)!important;\n  overflow:visible!important;\n}\n#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent.priceCurrent--long{font-size:13px!important;letter-spacing:-.15px!important}\n#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent small{\n  display:inline-block!important;\n  flex:0 0 auto!important;\n  margin:0!important;\n  padding:0!important;\n  color:#aebacc!important;\n  font-size:.58em!important;\n  font-weight:800!important;\n  line-height:1!important;\n  letter-spacing:0!important;\n  white-space:nowrap!important;\n}\n#products .card.productCardClickable .info .productCardPurchaseRow > .productCardBottom{\n  grid-column:2!important;\n  grid-row:2!important;\n  display:flex!important;\n  align-items:center!important;\n  justify-content:flex-end!important;\n  justify-self:end!important;\n  align-self:center!important;\n  position:static!important;\n  inset:auto!important;\n  width:40px!important;\n  min-width:40px!important;\n  max-width:40px!important;\n  height:40px!important;\n  min-height:40px!important;\n  max-height:40px!important;\n  margin:0!important;\n  padding:0!important;\n  flex:0 0 40px!important;\n  overflow:visible!important;\n  z-index:20!important;\n}\n#products .card.productCardClickable .info .productCardPurchaseRow > .productCardBottom.is-placeholder{visibility:hidden!important}\n#products .card.productCardClickable .info .productCardPurchaseRow .addToCartIcon{\n  position:static!important;\n  inset:auto!important;\n  display:flex!important;\n  align-items:center!important;\n  justify-content:center!important;\n  width:40px!important;\n  min-width:40px!important;\n  max-width:40px!important;\n  height:40px!important;\n  min-height:40px!important;\n  max-height:40px!important;\n  flex:0 0 40px!important;\n  margin:0!important;\n  padding:0!important;\n  white-space:nowrap!important;\n  transform:none!important;\n}\n@media(max-width:700px){\n  #products .card.productCardClickable .info .productCardPurchaseRow{\n    grid-template-columns:minmax(0,1fr) 36px!important;\n    grid-template-rows:17px 36px!important;\n    column-gap:7px!important;\n    row-gap:4px!important;\n    min-height:57px!important;\n    height:57px!important;\n    flex-basis:57px!important;\n  }\n  #products .card.productCardClickable .info .productCardPurchaseRow .priceOldRow{\n    gap:8px!important;\n    height:17px!important;\n    min-height:17px!important;\n    max-height:17px!important;\n  }\n  #products .card.productCardClickable .info .productCardPurchaseRow .priceOld{font-size:8.5px!important}\n  #products .card.productCardClickable .info .productCardPurchaseRow .priceOldRow .discountBadge{\n    min-width:40px!important;\n    max-width:44px!important;\n    height:17px!important;\n    min-height:17px!important;\n    max-height:17px!important;\n    padding:2px 5px!important;\n    font-size:8px!important;\n  }\n  #products .card.productCardClickable .info .productCardPurchaseRow .pricePromoMain{\n    height:36px!important;\n    min-height:36px!important;\n    max-height:36px!important;\n  }\n  #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent{\n    font-size:15px!important;\n  }\n  #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent.priceCurrent--long{\n    font-size:12.5px!important;\n  }\n  #products .card.productCardClickable .info .productCardPurchaseRow > .productCardBottom{\n    width:36px!important;\n    min-width:36px!important;\n    max-width:36px!important;\n    height:36px!important;\n    min-height:36px!important;\n    max-height:36px!important;\n    flex-basis:36px!important;\n  }\n  #products .card.productCardClickable .info .productCardPurchaseRow .addToCartIcon{\n    width:36px!important;\n    min-width:36px!important;\n    max-width:36px!important;\n    height:36px!important;\n    min-height:36px!important;\n    max-height:36px!important;\n    flex-basis:36px!important;\n    line-height:36px!important;\n    font-size:22px!important;\n  }\n}\n";
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
