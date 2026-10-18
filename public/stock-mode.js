/* SNGAMER STORE — Stock availability modes */
(function () {
  "use strict";

  const ON_ORDER = "on_order";
  const LABEL = "Sur commande";

  // Premium availability color: blue/cyan, distinct from green "En stock"
  // and red "Rupture de stock", while matching SNGAMER's neon identity.
  function injectOnOrderStyle() {
    if (document.getElementById("sngOnOrderPremiumStyle")) return;
    const style = document.createElement("style");
    style.id = "sngOnOrderPremiumStyle";
    style.textContent = `
      .onOrderStock,
      .card .onOrderStock,
      #products .onOrderStock,
      #productDetail .onOrderStock {
        color: #63c7ff !important;
        font-weight: 700 !important;
        text-shadow: 0 0 10px rgba(99,199,255,.16);
      }
    `;
    document.head.appendChild(style);
  }

  function isOnOrder(product) {
    return String(product?.stock_mode || "") === ON_ORDER;
  }

  function normalizeProducts() {
    const list = Array.isArray(window.storeProducts) ? window.storeProducts : [];
    for (const product of list) {
      if (isOnOrder(product)) {
        // The existing cart/checkout code uses stock as its quantity guard.
        // Give on-order products a virtual purchasable quantity while keeping
        // the real database stock at 0.
        product.__realStock = Number(product.stock) || 0;
        product.stock = 999999;
      }
    }
    return list;
  }

  function productIdFromCard(card) {
    const match = String(card?.getAttribute("onclick") || "").match(/openProduct\((\d+)\)/);
    return match ? Number(match[1]) : null;
  }

  function decorateCards() {
    const products = Array.isArray(window.storeProducts) ? window.storeProducts : [];
    const onOrderIds = new Set(products.filter(isOnOrder).map(p => Number(p.id)));

    document.querySelectorAll("#products .productCardClickable").forEach(card => {
      const id = productIdFromCard(card);
      if (!onOrderIds.has(id)) return;
      const stock = card.querySelector(".stock");
      if (stock) {
        stock.textContent = LABEL;
        stock.classList.remove("outOfStock");
        stock.classList.add("onOrderStock");
      }
    });
  }

  function decorateProductDetail(productId) {
    const product = (window.storeProducts || []).find(p => Number(p.id) === Number(productId));
    if (!isOnOrder(product)) return;
    const root = document.querySelector("#productDetail");
    if (!root) return;
    root.querySelectorAll(".stock, .productStock, .availability, [class*=stock]").forEach(el => {
      if (/rupture|disponible|stock/i.test(el.textContent || "")) {
        el.textContent = LABEL;
        el.classList.remove("outOfStock");
        el.classList.add("onOrderStock");
      }
    });
  }

  function install() {
    injectOnOrderStyle();
    if (!Array.isArray(window.storeProducts) || !window.storeProducts.length) return false;

    normalizeProducts();

    if (typeof window.render === "function" && !window.__sngStockRenderWrapped) {
      const originalRender = window.render;
      window.render = function () {
        const result = originalRender.apply(this, arguments);
        setTimeout(decorateCards, 0);
        return result;
      };
      window.__sngStockRenderWrapped = true;
    }

    if (typeof window.openProduct === "function" && !window.__sngStockOpenWrapped) {
      const originalOpenProduct = window.openProduct;
      window.openProduct = function (id) {
        const result = originalOpenProduct.apply(this, arguments);
        setTimeout(() => decorateProductDetail(id), 0);
        return result;
      };
      window.__sngStockOpenWrapped = true;
    }

    if (typeof window.render === "function") window.render();
    decorateCards();
    return true;
  }

  function installAdmin() {
    const stock = document.getElementById("pStock");
    if (!stock || document.getElementById("pStockMode")) return;

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display:flex;flex-direction:column;gap:5px;min-width:0";
    const label = document.createElement("label");
    label.textContent = "Disponibilité";
    label.style.cssText = "font-size:12px;font-weight:700;color:#9fb3cc";
    const select = document.createElement("select");
    select.id = "pStockMode";
    select.innerHTML = `
      <option value="stock">En stock</option>
      <option value="on_order">Sur commande</option>
      <option value="out">Rupture de stock</option>
    `;
    select.style.cssText = "width:100%;padding:12px;border-radius:8px;border:1px solid #344150;background:#0b0f14;color:#fff";
    wrapper.append(label, select);
    stock.insertAdjacentElement("afterend", wrapper);

    select.addEventListener("change", () => {
      if (select.value !== "stock") stock.value = "0";
    });

    if (!window.__sngStockFetchWrapped) {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async function (input, init) {
        const response = await originalFetch(input, init);
        const url = typeof input === "string" ? input : input?.url || "";
        const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();

        if (method === "POST" && url.includes("/api/admin/products") && !url.includes("/media")) {
          try {
            const data = await response.clone().json();
            const id = data?.product?.id || data?.productId || data?.id;
            const mode = document.getElementById("pStockMode")?.value || "stock";
            if (response.ok && id) {
              await originalFetch(`/api/admin/products/${encodeURIComponent(id)}/stock-mode`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stock_mode: mode })
              });
            }
          } catch (_) {}
        }

        return response;
      };
      window.__sngStockFetchWrapped = true;
    }
  }

  function start() {
    injectOnOrderStyle();
    installAdmin();
    if (!install()) setTimeout(start, 150);
  }

  start();
})();
