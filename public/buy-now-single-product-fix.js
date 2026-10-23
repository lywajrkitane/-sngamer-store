/* SNGAMER STORE — BUY NOW = ONE PRODUCT ONLY
 * Keeps the normal cart intact while the customer checks out a single product.
 */
(() => {
  "use strict";

  let originalOpenCheckout = null;
  let originalCloseCheckout = null;

  const money = value => new Intl.NumberFormat("fr-FR").format(value) + " FCFA";

  function getProductFromModal() {
    const detail = document.getElementById("productDetail");
    if (!detail || (!Array.isArray(window.storeProducts) && !Array.isArray(window.products))) return null;
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

  function renderSingleProductCheckout(items) {
    const checkout = document.querySelector("#checkout");
    const box = document.querySelector("#checkout .box");
    if (!checkout || !box) return false;

    for (const item of items) {
      const product = getProduct(item.id);
      if (!product || Number(product.stock) < Number(item.qty)) {
        window.alert("Stock insuffisant pour ce produit. Actualise la boutique et réessaie.");
        return false;
      }
    }

    document.querySelector("#checkoutSummary")?.remove();

    const summary = items.map(item => {
      const p = getProduct(item.id);
      if (!p) return "";
      const promoActive = Boolean(p.promo_active) && Number(p.promo_price) > 0 && Number(p.promo_price) < Number(p.price);
      const unitPrice = promoActive ? Number(p.promo_price) : Number(p.price);
      return `<div class="checkoutItem"><span>${escapeHtml(p.name)} × ${Number(item.qty)}</span><b>${money(unitPrice * Number(item.qty))}</b></div>`;
    }).join("");

    const total = items.reduce((sum, item) => {
      const p = getProduct(item.id);
      if (!p) return sum;
      const promoActive = Boolean(p.promo_active) && Number(p.promo_price) > 0 && Number(p.promo_price) < Number(p.price);
      const unitPrice = promoActive ? Number(p.promo_price) : Number(p.price);
      return sum + unitPrice * Number(item.qty);
    }, 0);

    box.classList.add("hasSummary");
    box.insertAdjacentHTML("afterbegin", `<div id="checkoutSummary"><h3>Votre commande</h3>${summary}<div class="checkoutTotal"><span>Total</span><b>${money(total)}</b></div></div>`);
    checkout.classList.add("show");
    return true;
  }

  function escapeHtml(text = "") {
    return String(text).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
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

    if (renderSingleProductCheckout(selected)) return;
    window.sngamerCheckoutItems = null;
    window.sngamerCheckoutMode = null;
  }

  function install() {
    originalOpenCheckout = window.openCheckout;
    originalCloseCheckout = window.closeCheckout;

    // Override only the public checkout entry point: normal cart checkout is unchanged.
    window.openCheckout = function() {
      if (Array.isArray(window.sngamerCheckoutItems) && window.sngamerCheckoutItems.length) {
        return renderSingleProductCheckout(window.sngamerCheckoutItems);
      }
      if (typeof originalOpenCheckout === "function") return originalOpenCheckout();
    };

    // The button is created dynamically inside the product modal. Capture the click
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

    // Closing checkout cancels the temporary single-product mode. The real cart remains intact.
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
