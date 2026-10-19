/* SNGAMER STORE — Stock availability modes */
(function () {
  "use strict";

  const ON_ORDER = "on_order";
  const LABEL = "Sur commande";
  const PINK = "#ff4fa3";

  function isOnOrder(product) {
    return String(product?.stock_mode || "") === ON_ORDER;
  }

  function injectOnOrderStyle() {
    let style = document.getElementById("sngOnOrderPremiumStyle");
    if (!style) {
      style = document.createElement("style");
      style.id = "sngOnOrderPremiumStyle";
      document.head.appendChild(style);
    }

    style.textContent = `
      #products .card .stock.onOrderStock,
      #products .card.productCardClickable .stock.onOrderStock,
      #productDetail .onOrderStock,
      #drawer .onOrderStock,
      #checkout .onOrderStock,
      #checkoutSummary .onOrderStock {
        color: ${PINK} !important;
        font-weight: 700 !important;
        text-shadow: 0 0 10px rgba(255,79,163,.20) !important;
      }
    `;
  }

  function forcePremium(el) {
    if (!el) return;

    // IMPORTANT: only touch the DOM when something really changed.
    // The previous version wrote textContent on every MutationObserver pass,
    // which created a self-triggering mutation loop and could make refreshes
    // appear to never finish.
    const needsText = el.textContent !== LABEL;
    const needsClass = !el.classList.contains("onOrderStock") || el.classList.contains("outOfStock");
    const needsColor = el.style.getPropertyValue("color") !== PINK || el.style.getPropertyPriority("color") !== "important";
    const needsWeight = el.style.getPropertyValue("font-weight") !== "700" || el.style.getPropertyPriority("font-weight") !== "important";

    if (needsText) el.textContent = LABEL;
    if (needsClass) {
      el.classList.remove("outOfStock");
      el.classList.add("onOrderStock");
    }
    if (needsColor) el.style.setProperty("color", PINK, "important");
    if (needsWeight) el.style.setProperty("font-weight", "700", "important");

    if (el.style.getPropertyValue("text-shadow") !== "0 0 10px rgba(255,79,163,.20)" || el.style.getPropertyPriority("text-shadow") !== "important") {
      el.style.setProperty("text-shadow", "0 0 10px rgba(255,79,163,.20)", "important");
    }
  }

  function normalizeProducts() {
    const list = Array.isArray(window.storeProducts) ? window.storeProducts : [];

    for (const product of list) {
      if (!isOnOrder(product)) continue;

      if (product.__realStock === undefined) {
        product.__realStock = Number(product.stock) || 0;
      }

      // On-order products are purchasable without consuming physical stock.
      // Keep the real database stock separately and expose a large client-side
      // availability value so the existing cart logic remains compatible.
      product.stock = 999999;
    }

    return list;
  }

  function cardProductId(card) {
    const onclick = String(card?.getAttribute("onclick") || "");
    const match = onclick.match(/openProduct\((\d+)\)/);
    return match ? Number(match[1]) : null;
  }

  function decorateCards() {
    const products = Array.isArray(window.storeProducts) ? window.storeProducts : [];
    if (!products.length) return;

    const onOrderIds = new Set(
      products.filter(isOnOrder).map(p => Number(p.id))
    );

    document.querySelectorAll("#products .card.productCardClickable").forEach(card => {
      const id = cardProductId(card);
      const stock = card.querySelector(".stock");
      if (!stock || !onOrderIds.has(id)) return;
      forcePremium(stock);
    });
  }

  function decorateDetail() {
    const root = document.querySelector("#productDetail");
    if (!root) return;

    const products = Array.isArray(window.storeProducts) ? window.storeProducts : [];
    const title = root.querySelector("h2")?.textContent?.trim();
    const product = products.find(p => String(p.name || "").trim() === title);
    if (!isOnOrder(product)) return;

    root.querySelectorAll(".stock, .productStock, .availability, [class*=stock]").forEach(forcePremium);
  }

  function installObserver() {
    if (window.__sngStockObserverInstalled || typeof MutationObserver === "undefined") return;

    let scheduled = false;
    const observer = new MutationObserver(() => {
      // Batch DOM changes into one pass instead of recursively reacting to
      // every individual text/class/style mutation.
      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        scheduled = false;
        decorateCards();
        decorateDetail();
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.__sngStockObserverInstalled = true;
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
        const method = String(
          init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET"
        ).toUpperCase();

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
          } catch (_) {
            // Keep the original admin request result intact.
          }
        }

        return response;
      };

      window.__sngStockFetchWrapped = true;
    }
  }

  function install() {
    injectOnOrderStyle();
    installAdmin();

    if (!Array.isArray(window.storeProducts) || !window.storeProducts.length) {
      return false;
    }

    normalizeProducts();
    installObserver();

    if (typeof window.render === "function") {
      window.render();
    }

    decorateCards();
    decorateDetail();
    return true;
  }

  function start() {
    injectOnOrderStyle();
    if (!install()) setTimeout(start, 150);
  }

  start();
})();
