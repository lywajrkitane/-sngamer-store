/* SNGAMER STORE — catalog recovery only
   The storefront-authoritative-final layer owns the cart badge.
   This file is retained temporarily only for catalog recovery while the
   architecture is being consolidated. */
(function () {
  "use strict";

  function catalogHasProducts() {
    var products = window.storeProducts || window.products;
    return Array.isArray(products) && products.length > 0;
  }

  function catalogHasCards() {
    var grid = document.getElementById("products");
    return !!(grid && grid.querySelector(".productCardClickable"));
  }

  function clearCatalogFailure() {
    var grid = document.getElementById("products");
    if (!grid || catalogHasCards()) return;
    var text = String(grid.textContent || "").toLowerCase();
    if (text.indexOf("catalogue") >= 0 && text.indexOf("indisponible") >= 0) {
      grid.replaceChildren();
    }
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function runLoadWithTimeout(timeoutMs) {
    if (typeof window.load !== "function") {
      return Promise.reject(new Error("catalog_loader_unavailable"));
    }

    var timedOut = false;
    return Promise.race([
      Promise.resolve().then(function () {
        return window.load();
      }),
      wait(timeoutMs).then(function () {
        timedOut = true;
        throw new Error("catalog_load_timeout");
      })
    ]).finally(function () {
      if (timedOut) {
        console.warn("SNGAMER_CATALOG_RECOVERY_TIMEOUT", timeoutMs);
      }
    });
  }

  async function recoverCatalog() {
    for (var attempt = 0; attempt < 18; attempt += 1) {
      if (catalogHasProducts() || catalogHasCards()) return;
      clearCatalogFailure();

      try {
        await runLoadWithTimeout(8000);
      } catch (error) {
        console.error("SNGAMER_CATALOG_RECOVERY_ERROR", error);
      }

      if (catalogHasProducts() || catalogHasCards()) return;
      clearCatalogFailure();
      await wait(Math.min(1500 + attempt * 1000, 8000));
    }

    if (!catalogHasProducts() && !catalogHasCards()) {
      console.error("SNGAMER_CATALOG_RECOVERY_EXHAUSTED");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", recoverCatalog, { once: true });
  } else {
    recoverCatalog();
  }
})();
