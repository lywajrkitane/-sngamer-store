/* SNGAMER STORE — stable product card purchase row.
   Keep this layout owned by one explicit grid; do not use display:contents.
   Each card reserves the same bottom row for price and add-to-cart control. */
(() => {
  "use strict";

  function loadBuyNowFix() {
    if (document.querySelector('script[data-sngamer-buy-now-fix="1"]')) return;
    const script = document.createElement("script");
    script.src = "/buy-now-single-product-fix.js?v=20261024-stock-state-rootfix2";
    script.dataset.sngamerBuyNowFix = "1";
    document.body.appendChild(script);
  }

  function installHomePromoPriceFix() {
    if (document.getElementById("sngamer-home-promo-price-fix")) return;
    const style = document.createElement("style");
    style.id = "sngamer-home-promo-price-fix";
    style.textContent = `
      /* The row spans BOTH columns of the card info grid. */
      #products .card.productCardClickable > .info > .productCardPurchaseRow{
        grid-area:auto!important;
        grid-column:1 / -1!important;
        grid-row:4!important;
        align-self:end!important;
        justify-self:stretch!important;
        display:grid!important;
        grid-template-columns:minmax(0,1fr) 40px!important;
        grid-template-rows:18px 40px!important;
        column-gap:8px!important;
        row-gap:4px!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        box-sizing:border-box!important;
        min-height:62px!important;
        height:62px!important;
        margin:0!important;
        padding:0!important;
        position:relative!important;
        overflow:visible!important;
        z-index:4!important;
      }

      /* Price gets only the left column; the button has a reserved right column. */
      #products .card.productCardClickable .info .productCardPurchaseRow > .price{
        grid-column:1!important;
        grid-row:1 / span 2!important;
        display:grid!important;
        grid-template-columns:minmax(0,1fr)!important;
        grid-template-rows:18px 40px!important;
        align-items:stretch!important;
        align-self:stretch!important;
        justify-self:stretch!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        min-height:62px!important;
        height:62px!important;
        margin:0!important;
        padding:0!important;
        gap:4px!important;
        position:static!important;
        overflow:visible!important;
        box-sizing:border-box!important;
      }
      #products .card.productCardClickable .info .productCardPurchaseRow > .price .priceOldRow{
        grid-column:1!important;
        grid-row:1!important;
        display:flex!important;
        flex-direction:row!important;
        align-items:center!important;
        justify-content:flex-start!important;
        gap:8px!important;
        width:100%!important;
        min-width:0!important;
        height:18px!important;
        min-height:18px!important;
        max-height:18px!important;
        margin:0!important;
        padding:0!important;
        overflow:visible!important;
        white-space:nowrap!important;
        line-height:1!important;
        box-sizing:border-box!important;
      }
      #products .card.productCardClickable .info .productCardPurchaseRow .priceOldRow--placeholder{
        visibility:hidden!important;
      }
      #products .card.productCardClickable .info .productCardPurchaseRow .priceOld{
        display:inline-block!important;
        position:static!important;
        flex:0 0 auto!important;
        width:max-content!important;
        min-width:max-content!important;
        max-width:none!important;
        margin:0!important;
        padding:0!important;
        color:#7f8da0!important;
        font-size:8.5px!important;
        font-weight:650!important;
        line-height:1!important;
        white-space:nowrap!important;
        text-decoration:line-through!important;
        text-decoration-thickness:1.2px!important;
        overflow:visible!important;
        text-overflow:clip!important;
      }
      #products .card.productCardClickable .info .productCardPurchaseRow .priceOldRow .discountBadge{
        position:static!important;
        inset:auto!important;
        flex:0 0 auto!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        width:max-content!important;
        min-width:40px!important;
        max-width:44px!important;
        height:18px!important;
        min-height:18px!important;
        max-height:18px!important;
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

      #products .card.productCardClickable .info .productCardPurchaseRow .pricePromoMain{
        grid-column:1!important;
        grid-row:2!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        align-self:stretch!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        height:40px!important;
        min-height:40px!important;
        max-height:40px!important;
        margin:0!important;
        padding:0!important;
        gap:0!important;
        overflow:visible!important;
        white-space:nowrap!important;
        box-sizing:border-box!important;
      }
      #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent{
        display:inline-flex!important;
        align-items:baseline!important;
        justify-content:flex-start!important;
        flex:0 1 auto!important;
        width:max-content!important;
        min-width:0!important;
        max-width:100%!important;
        margin:0!important;
        padding:0!important;
        gap:3px!important;
        color:#F4D58D!important;
        font-family:Montserrat,Arial,sans-serif!important;
        font-size:16px!important;
        font-weight:900!important;
        line-height:1!important;
        letter-spacing:-.25px!important;
        white-space:nowrap!important;
        text-shadow:0 0 12px rgba(244,213,141,.12)!important;
        overflow:visible!important;
      }
      #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent.priceCurrent--medium{
        font-size:14px!important;
        letter-spacing:-.15px!important;
      }
      #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent.priceCurrent--long{
        font-size:12px!important;
        letter-spacing:-.1px!important;
      }
      #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent small{
        display:inline-block!important;
        flex:0 0 auto!important;
        margin:0 0 0 3px!important;
        padding:0!important;
        color:#aebacc!important;
        font-size:.58em!important;
        font-weight:800!important;
        line-height:1!important;
        letter-spacing:0!important;
        white-space:nowrap!important;
      }

      /* Fixed-size right-side action button. Never overlaps price/badge. */
      #products .card.productCardClickable .info .productCardPurchaseRow > .productCardBottom{
        grid-column:2!important;
        grid-row:2!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-end!important;
        justify-self:end!important;
        align-self:center!important;
        position:static!important;
        inset:auto!important;
        width:40px!important;
        min-width:40px!important;
        max-width:40px!important;
        height:40px!important;
        min-height:40px!important;
        max-height:40px!important;
        margin:0!important;
        padding:0!important;
        flex:0 0 40px!important;
        box-sizing:border-box!important;
        overflow:visible!important;
        z-index:20!important;
      }
      #products .card.productCardClickable .info .productCardPurchaseRow > .productCardBottom.is-placeholder{
        visibility:hidden!important;
      }
      #products .card.productCardClickable .info .productCardPurchaseRow .addToCartIcon{
        position:static!important;
        inset:auto!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        width:40px!important;
        min-width:40px!important;
        max-width:40px!important;
        height:40px!important;
        min-height:40px!important;
        max-height:40px!important;
        flex:0 0 40px!important;
        margin:0!important;
        padding:0!important;
        white-space:nowrap!important;
        transform:none!important;
      }

      @media(max-width:700px){
        #products .card.productCardClickable > .info > .productCardPurchaseRow{
          grid-template-columns:minmax(0,1fr) 36px!important;
          grid-template-rows:17px 36px!important;
          column-gap:7px!important;
          row-gap:4px!important;
          min-height:57px!important;
          height:57px!important;
        }
        #products .card.productCardClickable .info .productCardPurchaseRow > .price{
          grid-template-rows:17px 36px!important;
          min-height:57px!important;
          height:57px!important;
        }
        #products .card.productCardClickable .info .productCardPurchaseRow .priceOldRow{
          height:17px!important;
          min-height:17px!important;
          max-height:17px!important;
          gap:8px!important;
        }
        #products .card.productCardClickable .info .productCardPurchaseRow .priceOld{font-size:8.5px!important}
        #products .card.productCardClickable .info .productCardPurchaseRow .priceOldRow .discountBadge{
          min-width:40px!important;
          max-width:44px!important;
          height:17px!important;
          min-height:17px!important;
          max-height:17px!important;
          padding:2px 5px!important;
          font-size:8px!important;
        }
        #products .card.productCardClickable .info .productCardPurchaseRow .pricePromoMain{
          height:36px!important;
          min-height:36px!important;
          max-height:36px!important;
        }
        #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent{font-size:15px!important}
        #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent.priceCurrent--medium{font-size:13px!important}
        #products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent.priceCurrent--long{font-size:11.5px!important}
        #products .card.productCardClickable .info .productCardPurchaseRow > .productCardBottom{
          width:36px!important;
          min-width:36px!important;
          max-width:36px!important;
          height:36px!important;
          min-height:36px!important;
          max-height:36px!important;
          flex-basis:36px!important;
        }
        #products .card.productCardClickable .info .productCardPurchaseRow .addToCartIcon{
          width:36px!important;
          min-width:36px!important;
          max-width:36px!important;
          height:36px!important;
          min-height:36px!important;
          max-height:36px!important;
          flex-basis:36px!important;
          line-height:36px!important;
          font-size:22px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function installStockDisplayFix() {
    if (document.getElementById("sngamer-stock-display-fix")) return;
    const style = document.createElement("style");
    style.id = "sngamer-stock-display-fix";
    style.textContent = `
      /* SNGAMER STORE — customer-facing stock privacy/status badge.
         The badge stays in the EXISTING .stock position. Only its visual content changes. */
      #products .card.productCardClickable .info > .stock.sngStockStatus{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        gap:6px!important;
        width:max-content!important;
        max-width:100%!important;
        min-height:28px!important;
        height:28px!important;
        margin:4px 0 10px!important;
        padding:5px 10px!important;
        border-radius:9px!important;
        border:1px solid rgba(86,211,122,.28)!important;
        background:rgba(33,130,64,.10)!important;
        color:#63dc86!important;
        font-size:11px!important;
        line-height:1!important;
        font-weight:800!important;
        letter-spacing:.1px!important;
        box-sizing:border-box!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        animation:none!important; opacity:1!important;
      }
      #products .card.productCardClickable .info > .stock.sngStockStatus i{
        display:block!important;
        width:7px!important;
        height:7px!important;
        min-width:7px!important;
        border-radius:50%!important;
        background:currentColor!important;
        box-shadow:0 0 0 3px rgba(99,220,134,.08),0 0 10px currentColor!important;
        flex:0 0 7px!important;
      }
      #products .card.productCardClickable .info > .stock.sngStockStatus.is-stock{
        animation:none!important;
        opacity:1!important;
      }
      #products .card.productCardClickable .info > .stock.sngStockStatus.is-stock > i,
      #products .card.productCardClickable .info > .stock.sngStockStatus.is-stock > span{
        animation:none!important;
        opacity:1!important;
        transform:none!important;
      }
      #products .card.productCardClickable .info > .stock.sngStockStatus.is-limited{
        color:#f2a93b!important;
        border-color:rgba(242,169,59,.34)!important;
        background:rgba(242,169,59,.09)!important;
        animation:sngStockPulseLimited 2.0s ease-in-out infinite!important;
      }
      #products .card.productCardClickable .info > .stock.sngStockStatus.is-last{
        color:#ef8b3d!important;
        border-color:rgba(239,139,61,.40)!important;
        background:rgba(239,139,61,.10)!important;
        font-weight:900!important;
        animation:sngStockPulseLast 1.8s ease-in-out infinite!important;
      }
      #products .card.productCardClickable .info > .stock.sngStockStatus.is-out{
        color:#ff6b8a!important;
        border-color:rgba(255,107,138,.34)!important;
        background:rgba(255,107,138,.09)!important;
        font-weight:900!important;
        animation:sngStockPulseOut 1.8s ease-in-out infinite!important;
      }
      @keyframes sngStockPulse{
        0%,100%{box-shadow:0 0 0 0 rgba(99,220,134,0),0 0 0 rgba(99,220,134,0)}
        50%{box-shadow:0 0 0 2px rgba(99,220,134,.05),0 0 16px rgba(99,220,134,.12)}
      }
      @keyframes sngStockPulseLimited{
        0%,100%{box-shadow:0 0 0 0 rgba(242,169,59,0),0 0 0 rgba(242,169,59,0)}
        50%{box-shadow:0 0 0 2px rgba(242,169,59,.06),0 0 16px rgba(242,169,59,.14)}
      }
      @keyframes sngStockPulseLast{
        0%,100%{box-shadow:0 0 0 0 rgba(239,139,61,0),0 0 0 rgba(239,139,61,0)}
        50%{box-shadow:0 0 0 2px rgba(239,139,61,.07),0 0 18px rgba(239,139,61,.16)}
      }
      @keyframes sngStockPulseOut{
        0%,100%{box-shadow:0 0 0 0 rgba(255,107,138,0),0 0 0 rgba(255,107,138,0)}
        50%{box-shadow:0 0 0 2px rgba(255,107,138,.06),0 0 16px rgba(255,107,138,.14)}
      }
      @media(max-width:700px){
        #products .card.productCardClickable .info > .stock.sngStockStatus{
          min-height:27px!important;
          height:27px!important;
          margin:4px 0 10px!important;
          padding:5px 9px!important;
          border-radius:8px!important;
          font-size:10px!important;
          gap:5px!important;
        }
        #products .card.productCardClickable .info > .stock.sngStockStatus i{
          width:6px!important;
          height:6px!important;
          min-width:6px!important;
          flex-basis:6px!important;
        }
      }
      @media(prefers-reduced-motion:reduce){
        #products .card.productCardClickable .info > .stock.sngStockStatus{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function refreshStockDisplay(root) {
    const scope=root||document;
    scope.querySelectorAll?.('#products .card.productCardClickable .info > .stock').forEach(stockEl=>{
      if(stockEl.dataset.sngamerStockStatusApplied==="1") return;
      const card=stockEl.closest(".productCardClickable");
      if(!card) return;
      const raw=stockEl.textContent||"";
      const match=raw.match(/(\d+)/);
      const stock=match?Number(match[1]):0;
      stockEl.classList.add("sngStockStatus");
      stockEl.classList.remove("is-stock","is-limited","is-last","is-out","outOfStock");
      if(stock>5){
        stockEl.classList.add("is-stock");
        stockEl.innerHTML='<i aria-hidden="true"></i><span>En stock</span>';
        stockEl.setAttribute("aria-label","En stock");
      }else if(stock>1){
        stockEl.classList.add("is-limited");
        stockEl.innerHTML='<i aria-hidden="true"></i><span>'+stock+' en stock</span>';
        stockEl.setAttribute("aria-label",stock+' en stock');
      }else if(stock===1){
        stockEl.classList.add("is-last");
        stockEl.innerHTML='<i aria-hidden="true"></i><span>Dernier article !</span>';
        stockEl.setAttribute("aria-label","Dernier article");
      }else{
        stockEl.classList.add("is-out");
        stockEl.innerHTML='<i aria-hidden="true"></i><span>Rupture de stock</span>';
        stockEl.setAttribute("aria-label","Rupture de stock");
      }
      stockEl.dataset.sngamerStockStatusApplied="1";
    });
  }

  function init() {
    installHomePromoPriceFix();
    installStockDisplayFix();
    loadBuyNowFix();
    const grid=document.getElementById("products");
    if(grid && !grid.dataset.sngamerPromoLayoutObserver){
      const observer=new MutationObserver(()=>{
        // Reassert position only; do not move elements, preserving the explicit grid.
        grid.querySelectorAll(".productCardPurchaseRow").forEach(row=>{
          row.style.gridColumn="1 / -1";
          row.style.width="100%";
        });
        refreshStockDisplay(grid);
      });
      observer.observe(grid,{childList:true,subtree:true});
      grid.dataset.sngamerPromoLayoutObserver="1";
    }
    refreshStockDisplay(document);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
