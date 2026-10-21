/* SNGAMER STORE — category consistency
 * The category selected in the admin dashboard is the single source of truth.
 * Product names must never override an explicitly saved category.
 */
(function () {
  function normalizeSavedCategory(product) {
    const raw = String(product?.category || "").trim();
    const key = raw.toLowerCase();

    if (key === "accessoires" || key === "accessory" || key === "accessories") {
      return "Accessoires";
    }

    if (key === "gaming phone" || key === "gaming phones") {
      return "Gaming Phone";
    }

    if (key === "coins" || key === "coin" || key === "pieces efootball" || key === "piece efootball") {
      return "Pièces eFootball";
    }

    // For any future/custom category, keep the exact value saved in the dashboard.
    if (raw) return raw;

    return null;
  }

  // Override the storefront classifier so an explicit dashboard category wins.
  if (typeof window.storeCategory === "function") {
    const originalStoreCategory = window.storeCategory;

    window.storeCategory = function (product) {
      return normalizeSavedCategory(product) || originalStoreCategory(product);
    };
  }

  // Re-render once after the patch is installed because app.js initially renders first.
  function refreshStore() {
    try {
      if (typeof window.cats === "function") window.cats();
      if (typeof window.render === "function") window.render();
    } catch (error) {
      console.error("SNGAMER_CATEGORY_CONSISTENCY_REFRESH_ERROR", error);
    }
  }

  // Keep the product-detail category consistent with the storefront card.
  if (typeof window.openProduct === "function") {
    const originalOpenProduct = window.openProduct;

    window.openProduct = function (id) {
      originalOpenProduct(id);

      requestAnimationFrame(function () {
        const products = Array.isArray(window.storeProducts) ? window.storeProducts : [];
        const product = products.find(p => Number(p.id) === Number(id));
        const category = product && (normalizeSavedCategory(product) || "Accessoires");
        const label = document.querySelector("#productDetail .productInfo .cat");

        if (label && category) {
          label.textContent = category;
        }
      });
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refreshStore, { once: true });
  } else {
    refreshStore();
  }
})();