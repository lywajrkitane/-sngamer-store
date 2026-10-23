/* SNGAMER STORE — BUY NOW = ONE PRODUCT ONLY
 * Keeps the normal cart intact while the customer checks out a single product.
 */
(() => {
  "use strict";

  let originalOpenCheckout = null;
  let originalCloseCheckout = null;

  function getProductFromModal() {
    const detail = document.getElementById("productDetail");
    if (!detail || !Array.isArray(window.storeProducts) && !Array.isArray(window.products)) return null;
    const list = Array.isArray(window.storeProducts) ? window.storeProducts : window.products;
    const title = detail.querySelector(".productInfo h2,.productInfo h1,h2,h1");
    const name = title ? title.textContent.trim() : "";
    if (!name) return null;
    return list.find(p => String(p.name || "").trim() === name) ||
      list.find(p => String(p.name || "").trim().toLowerCase() === name.toLowerCase()) || null;
  }

  function getProduct(id) {
    const list = Array.isArray(window.storeProducts) ? window.storeProducts : (Array.isArray(window.products) ? window.products : []);
    return list.find(p => Number(p.id) === Number(id)) || null;
  }

  function buyNowSingleProduct(id) {
    const product = getProduct(id);
    if (!product || Number(product.stock) <= 0) {
      window.alert("Ce produit est en rupture de stock.");
      return;
    }

    const selected = [{ id: product.id, qty: 1 }];
    window.sngamerCheckoutItems = selected;
    window.sngamerCheckoutMode = "buy-now";

    // Reuse the existing checkout renderer, but temporarily feed it only this product.
    // The customer's real cart is restored immediately after the checkout modal is built.
    if (typeof originalOpenCheckout !== "function") originalOpenCheckout = window.openCheckout;
    if (typeof originalOpenCheckout !== "function") {
      window.alert("Impossible d’ouvrir la commande pour le moment.");
      return;
    }

    const realCart = window.cartItems;
    try {
      window.cartItems = selected;
      originalOpenCheckout();
    } finally {
      window.cartItems = realCart;
      if (typeof window.update === "function") window.update();
    }
  }

  function install() {
    originalOpenCheckout = window.openCheckout;
    originalCloseCheckout = window.closeCheckout;

    // The button already exists dynamically inside the product modal. Capture the click
    // before any inline onclick handler can accidentally open the complete cart.
    document.addEventListener("click", event => {
      const button = event.target?.closest?.("#productModal .buyButton, #productModal button");
      if (!button) return;

      const label = (button.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      const isBuyNow = button.classList.contains("buyButton") || /acheter\s+maintenant|acheter\b/.test(label);
      if (!isBuyNow) return;

      const product = getProductFromModal();
      if (!product) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      buyNowSingleProduct(product.id);
    }, true);

    // Closing the checkout cancels the temporary single-product checkout mode.
    if (typeof originalCloseCheckout === "function") {
      window.closeCheckout = function() {
        originalCloseCheckout();
        window.sngamerCheckoutItems = null;
        window.sngamerCheckoutMode = null;
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
