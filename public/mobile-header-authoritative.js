/* SNGAMER STORE — mobile header authority
   Mobile keeps Profile exclusively in the bottom navigation.
   Header controls are compact and the cart count always reflects sg_cart.
*/
(function () {
  "use strict";
  var STYLE_ID = "sngamerMobileHeaderAuthority";

  function cartCount() {
    try {
      var raw = JSON.parse(localStorage.getItem("sg_cart") || "[]");
      if (!Array.isArray(raw)) return 0;
      return raw.reduce(function (sum, item) {
        var qty = Number(item && item.qty);
        return sum + (Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0);
      }, 0);
    } catch (_) { return 0; }
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width:700px){
        /* Mobile: profile belongs only to the fixed bottom navigation. */
        .siteHeader #sngamerProfileEntry,
        .siteHeader .sngamerProfileEntry,
        .siteHeader #profilePremiumButton,
        .siteHeader .profilePremiumButton,
        .siteHeader [data-sngamer-profile-entry="1"]{
          display:none !important;
          visibility:hidden !important;
          pointer-events:none !important;
        }

        /* Compact mobile header controls; never use desktop-sized controls here. */
        .siteHeader .nav{
          display:flex !important;
          align-items:center !important;
          gap:7px !important;
        }
        .siteHeader .nav > .searchPremiumButton,
        .siteHeader .nav > .cartButton{
          width:42px !important;
          height:42px !important;
          min-width:42px !important;
          min-height:42px !important;
          max-width:42px !important;
          max-height:42px !important;
          flex:0 0 42px !important;
          padding:0 !important;
          border-radius:12px !important;
          box-sizing:border-box !important;
        }
        .siteHeader .nav > .searchPremiumButton svg,
        .siteHeader .nav > .cartButton svg{
          width:19px !important;
          height:19px !important;
        }
        .siteHeader .nav > .searchPremiumButton{
          margin-left:auto !important;
        }

        /* Keep the cart quantity visible and independent from the cart button size. */
        .siteHeader .nav > .cartButton b#count{
          position:absolute !important;
          top:-4px !important;
          right:-4px !important;
          min-width:16px !important;
          width:auto !important;
          height:16px !important;
          padding:0 4px !important;
          border-radius:999px !important;
          display:flex !important;
          align-items:center !important;
          justify-content:center !important;
          box-sizing:border-box !important;
          background:#101827 !important;
          border:1px solid rgba(255,255,255,.85) !important;
          color:#fff !important;
          font-size:9px !important;
          font-weight:800 !important;
          line-height:1 !important;
          z-index:20 !important;
          opacity:1 !important;
          visibility:visible !important;
        }

        /* Do not show the text label "Panier" in the compact mobile header. */
        .siteHeader .nav > .cartButton > span:not(.cartIcon){
          display:none !important;
        }
        .siteHeader .nav > .cartButton .cartIcon{
          display:inline-flex !important;
          width:19px !important;
          height:19px !important;
          align-items:center !important;
          justify-content:center !important;
          font-size:0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function sync() {
    var nav = document.querySelector(".siteHeader .nav");
    if (!nav) return;
    installStyles();

    /* Remove any desktop profile control from the mobile header only. */
    nav.querySelectorAll("#sngamerProfileEntry,.sngamerProfileEntry,#profilePremiumButton,.profilePremiumButton,[data-sngamer-profile-entry='1']").forEach(function (node) {
      node.style.setProperty("display", "none", "important");
      node.style.setProperty("visibility", "hidden", "important");
      node.style.setProperty("pointer-events", "none", "important");
    });

    var cart = nav.querySelector(".cartButton");
    if (!cart) return;
    var count = cart.querySelector("#count");
    if (!count) {
      count = document.createElement("b");
      count.id = "count";
      cart.appendChild(count);
    }
    var nextCount = String(cartCount());
    if (count.textContent !== nextCount) count.textContent = nextCount;
    count.style.setProperty("display", "flex", "important");
  }

  function boot() {
    installStyles();
    sync();
    [100, 400, 900, 1800].forEach(function (delay) { setTimeout(sync, delay); });
    if (!window.__sngamerMobileHeaderAuthorityObserver) {
      window.__sngamerMobileHeaderAuthorityObserver = new MutationObserver(function () { sync(); });
      var headerNav = document.querySelector(".siteHeader .nav");
      if (headerNav) {
        window.__sngamerMobileHeaderAuthorityObserver.observe(headerNav, { childList:true, subtree:true });
      }
    }
    window.addEventListener("storage", sync);
    window.addEventListener("resize", sync);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
  else boot();
})();
