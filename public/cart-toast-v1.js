/* SNGAMER STORE — confirmation toast after adding a product to cart */
(function () {
  "use strict";

  const TOAST_ID = "sngamer-cart-toast";
  const STYLE_ID = "sngamer-cart-toast-style";
  let hideTimer = null;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${TOAST_ID} {
        position: fixed;
        top: 88px;
        right: 18px;
        z-index: 99999;
        width: min(300px, calc(100vw - 36px));
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 9px 10px 9px 11px;
        border: 1px solid rgba(92, 176, 255, .42);
        border-radius: 13px;
        background: linear-gradient(135deg, rgba(8, 20, 38, .97), rgba(28, 13, 55, .97));
        box-shadow: 0 12px 35px rgba(0, 0, 0, .38), 0 0 24px rgba(65, 116, 255, .16);
        color: #fff;
        font-family: inherit;
        opacity: 0;
        transform: translateY(-12px) scale(.98);
        pointer-events: none;
        transition: opacity .22s ease, transform .22s ease;
      }

      #${TOAST_ID}.show {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      #${TOAST_ID} .toastIcon {
        width: 31px;
        height: 31px;
        flex: 0 0 31px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        background: linear-gradient(135deg, #168cff, #8a35ff);
        box-shadow: 0 0 16px rgba(67, 124, 255, .28);
        font-size: 16px;
      }

      #${TOAST_ID} .toastContent {
        min-width: 0;
        flex: 1;
        line-height: 1.2;
      }

      #${TOAST_ID} .toastTitle {
        margin: 0 0 2px;
        font-size: 11px;
        font-weight: 800;
        color: #63b6ff;
        letter-spacing: .02em;
      }

      #${TOAST_ID} .toastProduct {
        margin: 0;
        font-size: 12px;
        font-weight: 700;
        color: #f7f9ff;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #${TOAST_ID} .toastClose {
        width: 27px;
        height: 27px;
        flex: 0 0 27px;
        border: 0;
        border-radius: 8px;
        background: rgba(255,255,255,.08);
        color: #cbd6e8;
        font-size: 17px;
        line-height: 1;
        cursor: pointer;
      }

      #${TOAST_ID} .toastClose:hover,
      #${TOAST_ID} .toastClose:focus-visible {
        background: rgba(255,255,255,.14);
        color: #fff;
        outline: none;
      }

      @media (max-width: 600px) {
        #${TOAST_ID} {
          top: 78px;
          right: 12px;
          left: auto;
          width: min(270px, calc(100vw - 24px));
          border-radius: 12px;
          padding: 8px 9px 8px 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function escapeText(value) {
    return String(value ?? "");
  }

  function hideToast() {
    const toast = document.getElementById(TOAST_ID);
    if (!toast) return;
    toast.classList.remove("show");
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function showToast(productName) {
    injectStyles();

    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = TOAST_ID;
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.innerHTML = `
        <div class="toastIcon" aria-hidden="true">🛒</div>
        <div class="toastContent">
          <p class="toastTitle">Ajouté au panier</p>
          <p class="toastProduct"></p>
        </div>
        <button class="toastClose" type="button" aria-label="Fermer">×</button>
      `;
      toast.querySelector(".toastClose").addEventListener("click", hideToast);
      document.body.appendChild(toast);
    }

    toast.querySelector(".toastProduct").textContent = escapeText(productName);
    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");

    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hideToast, 4000);
  }

  function install() {
    if (typeof window.add !== "function" || window.__sngamerCartToastInstalled) return;

    const originalAdd = window.add;
    window.add = function (id) {
      const result = originalAdd.apply(this, arguments);

      if (result === true) {
        const product = Array.isArray(window.storeProducts)
          ? window.storeProducts.find((p) => Number(p.id) === Number(id))
          : null;

        showToast(product && product.name ? product.name : "Produit");
      }

      return result;
    };

    window.__sngamerCartToastInstalled = true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
