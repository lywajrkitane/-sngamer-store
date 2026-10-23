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
    script.src = "/buy-now-single-product-fix.js?v=20261023-singleproduct1";
    script.dataset.sngamerBuyNowFix = "1";
    document.body.appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadBuyNowFix, { once: true });
  } else {
    loadBuyNowFix();
  }
})();
