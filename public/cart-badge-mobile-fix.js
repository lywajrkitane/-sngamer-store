/* SNGAMER STORE — cart badge mobile hard fix
   This is intentionally independent from the desktop header logic.
   It reads the same sg_cart source used by app.js and renders a badge
   outside the cart button so no mobile overflow/stacking rule can hide it.
*/
(function () {
  "use strict";
  var BADGE_ID = "sngamer-mobile-cart-badge-hard-fix";

  function getCount() {
    try {
      var raw = JSON.parse(localStorage.getItem("sg_cart") || "[]");
      if (!Array.isArray(raw)) return 0;
      return raw.reduce(function (sum, item) {
        var qty = Number(item && item.qty);
        return sum + (Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0);
      }, 0);
    } catch (_) {
      return 0;
    }
  }

  function isMobile() {
    return window.matchMedia("(max-width:700px), (hover:none) and (pointer:coarse)").matches;
  }

  function isProductDetailOpen() {
    var modal = document.getElementById("productModal");
    return !!(modal && modal.classList.contains("show"));
  }

  function ensureBadge() {
    var cart = document.querySelector(".siteHeader .cartButton");
    if (!cart) return null;

    var badge = document.getElementById(BADGE_ID);
    if (!badge) {
      badge = document.createElement("span");
      badge.id = BADGE_ID;
      badge.setAttribute("aria-label", "Nombre d'articles dans le panier");
      badge.setAttribute("aria-live", "polite");
      document.body.appendChild(badge);
    }

    return { cart: cart, badge: badge };
  }

  function paint() {
    var found = ensureBadge();
    if (!found) return;
    var cart = found.cart;
    var badge = found.badge;
    var count = getCount();
    var productDetailOpen = isProductDetailOpen();

    badge.textContent = String(count);
    badge.style.cssText = [
      "position:fixed",
      "display:" + (isMobile() && count > 0 && !productDetailOpen ? "inline-flex" : "none"),
      "align-items:center",
      "justify-content:center",
      "box-sizing:border-box",
      "min-width:19px",
      "height:19px",
      "padding:0 5px",
      "border-radius:999px",
      "background:linear-gradient(135deg,#101827 0%,#30345c 52%,#7c3aed 100%)",
      "color:#fff",
      "border:1px solid rgba(255,255,255,.98)",
      "box-shadow:0 0 0 2px rgba(7,10,16,.96),0 4px 12px rgba(91,53,255,.42),inset 0 1px 0 rgba(255,255,255,.24)",
      "font:900 9px/1 Arial,sans-serif",
      "white-space:nowrap",
      "z-index:2147483647",
      "pointer-events:none",
      "visibility:visible",
      "opacity:1"
    ].join(";");

    if (isMobile() && count > 0 && !productDetailOpen) {
      var rect = cart.getBoundingClientRect();
      var left = Math.round(rect.right - 4);
      var top = Math.round(rect.top - 5);
      badge.style.left = left + "px";
      badge.style.top = top + "px";
      badge.style.transform = "translate(-50%,0)";
    }
  }

  function watchProductModal() {
    var modal = document.getElementById("productModal");
    if (!modal || modal.__sngCartBadgeObserver) return;
    var observer = new MutationObserver(paint);
    observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
    modal.__sngCartBadgeObserver = observer;
  }

  function boot() {
    paint();
    watchProductModal();
    [100, 300, 700, 1200, 2000, 4000].forEach(function (delay) { setTimeout(function () { paint(); watchProductModal(); }, delay); });
    window.addEventListener("resize", paint, { passive: true });
    window.addEventListener("orientationchange", paint, { passive: true });
    window.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("storage", paint);
    setInterval(function () { paint(); watchProductModal(); }, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
