/* SNGAMER STORE — catalog recovery guard for Render cold starts. */
(function () {
  "use strict";

  if (window.__sngamerCatalogRecoveryV1) return;
  window.__sngamerCatalogRecoveryV1 = true;

  function hasProducts() {
    var products = window.storeProducts || window.products;
    return Array.isArray(products) && products.length > 0;
  }

  function hasCards() {
    var grid = document.getElementById("products");
    return !!(grid && grid.querySelector(".productCardClickable"));
  }

  function clearFailureMessage() {
    var grid = document.getElementById("products");
    if (!grid || hasCards()) return;
    var text = String(grid.textContent || "").toLowerCase();
    if (text.indexOf("catalogue") >= 0 && text.indexOf("indisponible") >= 0) {
      grid.replaceChildren();
    }
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function recover() {
    for (var attempt = 0; attempt < 12; attempt += 1) {
      if (hasProducts() || hasCards()) return;
      clearFailureMessage();

      try {
        if (typeof window.load === "function") {
          await window.load();
        }
      } catch (error) {
        console.error("SNGAMER_CATALOG_RECOVERY_ERROR", error);
      }

      if (hasProducts() || hasCards()) return;

      clearFailureMessage();
      await wait(Math.min(2500 + attempt * 1500, 10000));
    }

    if (!hasProducts() && !hasCards()) {
      console.error("SNGAMER_CATALOG_RECOVERY_EXHAUSTED");
    }
  }

  function boot() {
    recover();
    window.addEventListener("pageshow", function () {
      if (!hasProducts() && !hasCards()) recover();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
