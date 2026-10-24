/* SNGAMER STORE — BUY NOW = ONE PRODUCT ONLY
 * Keeps the normal cart intact while the customer checks out a single product.
 * The selected product color is carried into checkout and the PayTech order.
 */
(() => {
  "use strict";

  let originalOpenCheckout = null;
  let originalCloseCheckout = null;

  const money = value => new Intl.NumberFormat("fr-FR").format(value) + " FCFA";

  function installPremiumCheckoutStyles() {
    if (document.getElementById("sngBuyNowPremiumStyles")) return;
    const style = document.createElement("style");
    style.id = "sngBuyNowPremiumStyles";
    style.textContent = `
      #productDetail .price.price--promo{display:flex!important;align-items:baseline!important;flex-wrap:wrap!important;gap:10px!important;margin:20px 0 8px!important;min-height:48px!important}
      #productDetail .price.price--promo .priceCurrent{order:1!important;color:#f7f9ff!important;font-size:clamp(30px,7vw,42px)!important;line-height:1!important;font-weight:900!important;letter-spacing:-1.1px!important;text-shadow:0 0 18px rgba(84,145,255,.14)!important}
      #productDetail .price.price--promo .priceOld{order:2!important;color:#7f8da0!important;font-size:14px!important;line-height:1!important;font-weight:650!important;text-decoration:line-through!important;text-decoration-thickness:1.5px!important;opacity:.85!important}
      #productDetail .price.price--promo .discountBadge{order:3!important;align-self:center!important;padding:7px 10px!important;border-radius:9px!important;border:1px solid rgba(255,78,112,.24)!important;background:rgba(255,61,96,.10)!important;color:#ff6685!important;font-size:12px!important;line-height:1!important;font-weight:900!important}
      #productDetail .price.price--promo .priceCurrent small{margin-left:5px!important;font-size:.42em!important;font-weight:800!important;letter-spacing:0!important}
      #productDetail .price:not(.price--promo){margin:20px 0 8px!important}
      #productDetail .price:not(.price--promo) .priceCurrent{color:#f7f9ff!important;font-size:clamp(30px,7vw,42px)!important;line-height:1!important;font-weight:900!important;letter-spacing:-1.1px!important}
      #productDetail .price:not(.price--promo) .priceCurrent small{margin-left:5px!important;font-size:.42em!important;font-weight:800!important}
      #checkoutSummary .sngCheckoutColor{display:inline-flex!important;align-items:center!important;gap:6px!important;margin:4px 0 0!important;color:#91bde8!important;font-size:12px!important;font-weight:700!important}
      #checkoutSummary .sngCheckoutColorDot{width:10px!important;height:10px!important;min-width:10px!important;border-radius:50%!important;border:1px solid rgba(255,255,255,.45)!important;box-shadow:0 1px 4px rgba(0,0,0,.35)!important}
    `;
    document.head.appendChild(style);
  }

  function getProductFromModal() {
    const detail = document.getElementById("productDetail");
    if (!detail || (!Array.isArray(window.storeProducts) && !Array.isArray(window.products))) return null;
    const list = Array.isArray(window.storeProducts) ? window.storeProducts : window.products;
    const title = detail.querySelector(".productInfo h2,.productInfo h1,h2,h1");
    const name = title ? title.textContent.trim() : "";
    if (!name) return null;
    return list.find(p => String(p.name || "").trim() === name) || list.find(p => String(p.name || "").trim().toLowerCase() === name.toLowerCase()) || null;
  }

  function getProduct(id) {
    const list = Array.isArray(window.storeProducts) ? window.storeProducts : (Array.isArray(window.products) ? window.products : []);
    return list.find(p => Number(p.id) === Number(id)) || null;
  }

  function getSelectedColorFromModal(product) {
    const detail = document.getElementById("productDetail");
    if (!detail || !product) return null;
    const button = detail.querySelector(".sngProductColorOption.is-selected");
    if (!button) return null;
    const name = String(button.getAttribute("title") || "").trim();
    const hex = String(button.style.getPropertyValue("--sng-color") || "").trim();
    if (!name) return null;
    return { name, hex: /^#[0-9a-f]{6}$/i.test(hex) ? hex.toUpperCase() : "#808080" };
  }

  function colorFromItem(item) {
    const color = item && item.color;
    if (!color) return null;
    if (typeof color === "string") return { name: color, hex: "#808080" };
    if (typeof color === "object" && color.name) return { name: String(color.name), hex: String(color.hex || "#808080") };
    return null;
  }

  function colorHtml(color) {
    if (!color || !color.name) return "";
    const safeName = escapeHtml(color.name);
    const safeHex = /^#[0-9a-f]{6}$/i.test(String(color.hex || "")) ? String(color.hex) : "#808080";
    return `<small class="sngCheckoutColor"><span class="sngCheckoutColorDot" style="background:${safeHex}"></span>Couleur : ${safeName}</small>`;
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
      const color = colorFromItem(item);
      return `<div class="checkoutItem"><span>${escapeHtml(p.name)} × ${Number(item.qty)}${colorHtml(color)}</span><b>${money(unitPrice * Number(item.qty))}</b></div>`;
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
    const colors = Array.isArray(product.colors) ? product.colors : [];
    const selectedColor = getSelectedColorFromModal(product);
    if (colors.length && !selectedColor) {
      window.alert("Choisis une couleur avant de continuer.");
      return;
    }
    const selected = [{ id: product.id, qty: 1, ...(selectedColor ? { color: selectedColor } : {}) }];
    window.sngamerCheckoutItems = selected;
    window.sngamerCheckoutMode = "buy-now";
    if (renderSingleProductCheckout(selected)) return;
    window.sngamerCheckoutItems = null;
    window.sngamerCheckoutMode = null;
  }

  function install() {
    installPremiumCheckoutStyles();
    originalOpenCheckout = window.openCheckout;
    originalCloseCheckout = window.closeCheckout;
    window.openCheckout = function() {
      if (Array.isArray(window.sngamerCheckoutItems) && window.sngamerCheckoutItems.length) return renderSingleProductCheckout(window.sngamerCheckoutItems);
      if (typeof originalOpenCheckout === "function") return originalOpenCheckout();
    };
    document.addEventListener("click", event => {
      const button = event.target?.closest?.("#productModal .buyButton, #productModal .sngBuyNowBtn, #productModal button");
      if (!button) return;
      const label = (button.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      const isBuyNow = button.classList.contains("buyButton") || button.classList.contains("sngBuyNowBtn") || /acheter\s+maintenant|acheter\b/.test(label);
      if (!isBuyNow) return;
      const product = getProductFromModal();
      if (!product) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      buyNowSingleProduct(product.id);
    }, true);
    if (typeof originalCloseCheckout === "function") {
      window.closeCheckout = function() {
        originalCloseCheckout();
        window.sngamerCheckoutItems = null;
        window.sngamerCheckoutMode = null;
      };
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
