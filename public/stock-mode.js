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
      /* ON ORDER uses exactly the same premium status frame as the stock badges. */
      #products .card .stock.onOrderStock,
      #products .card.productCardClickable .stock.onOrderStock,
      #productDetail .onOrderStock,
      #drawer .onOrderStock,
      #checkout .onOrderStock,
      #checkoutSummary .onOrderStock {
        display:inline-flex !important;
        align-items:center !important;
        justify-content:flex-start !important;
        gap:6px !important;
        width:max-content !important;
        max-width:100% !important;
        min-height:28px !important;
        height:28px !important;
        margin:4px 0 10px !important;
        padding:5px 10px !important;
        box-sizing:border-box !important;
        border-radius:9px !important;
        border:1px solid rgba(255,79,163,.34) !important;
        background:rgba(255,79,163,.09) !important;
        color:${PINK} !important;
        font-size:11px !important;
        line-height:1 !important;
        font-weight:800 !important;
        letter-spacing:.1px !important;
        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
        text-shadow:0 0 10px rgba(255,79,163,.20) !important;
        animation:none !important;
        opacity:1 !important;
        transform:none !important;
      }

      #products .card.productCardClickable .stock.onOrderStock .sngOnOrderDot,
      #productDetail .onOrderStock .sngOnOrderDot,
      #drawer .onOrderStock .sngOnOrderDot,
      #checkout .onOrderStock .sngOnOrderDot,
      #checkoutSummary .onOrderStock .sngOnOrderDot {
        display:block !important;
        width:7px !important;
        height:7px !important;
        min-width:7px !important;
        border-radius:50% !important;
        background:${PINK} !important;
        box-shadow:0 0 0 3px rgba(255,79,163,.08),0 0 10px ${PINK} !important;
        flex:0 0 7px !important;
        opacity:1 !important;
        transform:none !important;
        animation:none !important;
      }

      #products .card.productCardClickable .stock.onOrderStock .sngOnOrderLabel,
      #productDetail .onOrderStock .sngOnOrderLabel,
      #drawer .onOrderStock .sngOnOrderLabel,
      #checkout .onOrderStock .sngOnOrderLabel,
      #checkoutSummary .onOrderStock .sngOnOrderLabel {
        display:inline-block !important;
        color:inherit !important;
        opacity:1 !important;
        transform:none !important;
        animation:none !important;
      }
    `;
  }

  function forcePremium(el) {
    if (!el) return;

    const alreadyStructured = !!el.querySelector(".sngOnOrderDot") && !!el.querySelector(".sngOnOrderLabel");
    if (!alreadyStructured) {
      el.textContent = "";
      const dot = document.createElement("i");
      dot.className = "sngOnOrderDot";
      dot.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.className = "sngOnOrderLabel";
      label.textContent = LABEL;
      el.append(dot, label);
    } else {
      const label = el.querySelector(".sngOnOrderLabel");
      if (label.textContent !== LABEL) label.textContent = LABEL;
    }

    el.classList.remove("outOfStock","sngStockStatus","is-stock","is-limited","is-last","is-out");
    el.classList.add("onOrderStock");
    el.style.setProperty("color", PINK, "important");
    el.style.setProperty("font-weight", "700", "important");
    el.style.setProperty("text-shadow", "0 0 10px rgba(255,79,163,.20)", "important");
    el.style.setProperty("animation", "none", "important");
    el.style.setProperty("opacity", "1", "important");
    el.style.setProperty("transform", "none", "important");
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

  function addAvailabilitySelect(stockInput, id, existingMode) {
    if (!stockInput || document.getElementById(id)) return null;

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display:flex;flex-direction:column;gap:5px;min-width:0;margin-top:6px";

    const label = document.createElement("label");
    label.textContent = "Disponibilité";
    label.style.cssText = "font-size:12px;font-weight:700;color:#9fb3cc";

    const select = document.createElement("select");
    select.id = id;
    select.innerHTML = `
      <option value="stock">En stock</option>
      <option value="on_order">Sur commande</option>
      <option value="out">Rupture de stock</option>
    `;
    select.style.cssText = "width:100%;padding:12px;border-radius:8px;border:1px solid #344150;background:#0b0f14;color:#fff";
    if (existingMode) select.value = existingMode;

    wrapper.append(label, select);
    stockInput.insertAdjacentElement("afterend", wrapper);

    select.addEventListener("change", () => {
      if (select.value !== "stock") stockInput.value = "0";
    });

    return select;
  }

  function inferMode(product) {
    const explicit = String(product?.stock_mode || "").trim();
    if (["stock", "on_order", "out"].includes(explicit)) return explicit;
    return Number(product?.stock) > 0 ? "stock" : "out";
  }

  function installEditAdmin() {
    const stock = document.getElementById("editProductStock");
    const modal = document.getElementById("editProductModal");
    if (!stock || !modal) return;

    let select = document.getElementById("editProductStockMode");
    if (!select) {
      const productId = Number(document.getElementById("editProductId")?.value || 0);
      const product = Array.isArray(window.storeProducts)
        ? window.storeProducts.find(p => Number(p.id) === productId)
        : null;
      select = addAvailabilitySelect(stock, "editProductStockMode", inferMode(product));
    }

    if (!select) return;

    function syncFromEditedProduct() {
      const id = Number(document.getElementById("editProductId")?.value || 0);
      const product = Array.isArray(window.storeProducts)
        ? window.storeProducts.find(p => Number(p.id) === id)
        : null;
      if (product) select.value = inferMode(product);
    }

    syncFromEditedProduct();

    if (!window.__sngEditStockModalObserver && typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(records => {
        if (records.some(record => record.attributeName === "class") && modal.classList.contains("show")) {
          setTimeout(syncFromEditedProduct, 0);
        }
      });
      observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
      window.__sngEditStockModalObserver = true;
    }
  }

  function installAdmin() {
    const stock = document.getElementById("pStock");
    if (stock && !document.getElementById("pStockMode")) {
      const select = addAvailabilitySelect(stock, "pStockMode", "stock");
      if (select) {
        select.addEventListener("change", () => {
          if (select.value !== "stock") stock.value = "0";
        });
      }
    }

    installEditAdmin();

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
          } catch (_) {}
        }

        const editMatch = url.match(/\/api\/admin\/products\/([^/?#]+)$/);
        if ((method === "PUT" || method === "PATCH") && editMatch && !url.includes("/stock-mode")) {
          try {
            const id = document.getElementById("editProductId")?.value || decodeURIComponent(editMatch[1]);
            const mode = document.getElementById("editProductStockMode")?.value || "stock";

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

  function install() {
    injectOnOrderStyle();
    installAdmin();

    if (!Array.isArray(window.storeProducts) || !window.storeProducts.length) {
      return false;
    }

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
    installAdmin();
    if (!install()) setTimeout(start, 150);
  }

  start();
})();
