(function () {
  "use strict";
  if (window.__sngProductColorsStorefrontV3) return;
  window.__sngProductColorsStorefrontV3 = true;

  const selected = Object.create(null);

  function productList() {
    if (Array.isArray(window.storeProducts) && window.storeProducts.length) return window.storeProducts;
    if (Array.isArray(window.products)) return window.products;
    return [];
  }

  function productById(id) {
    return productList().find(function (p) { return Number(p.id) === Number(id); }) || null;
  }

  function colorsOf(product) {
    if (!product) return [];
    let rows = product.colors;
    if (rows == null) rows = product.color_options;
    if (rows == null) rows = product.available_colors;
    if (typeof rows === "string") {
      try { rows = JSON.parse(rows); } catch (_) { rows = []; }
    }
    if (!Array.isArray(rows)) return [];

    const out = [];
    rows.forEach(function (row) {
      const name = String(typeof row === "string" ? row : (row && (row.name || row.label)) || "").trim().slice(0, 40);
      if (!name) return;
      let hex = String(typeof row === "object" && row ? (row.hex || row.color || "") : "").trim().toUpperCase();
      if (!/^#[0-9A-F]{6}$/.test(hex)) {
        const known = {
          NOIR: "#111111", BLACK: "#111111", BLANC: "#FFFFFF", WHITE: "#FFFFFF",
          GRIS: "#8B919B", GRAY: "#8B919B", GREY: "#8B919B", ARGENT: "#C0C0C0", SILVER: "#C0C0C0",
          BLEU: "#2563EB", BLUE: "#2563EB", ROUGE: "#EF4444", RED: "#EF4444", VERT: "#16A34A", GREEN: "#16A34A",
          JAUNE: "#FACC15", YELLOW: "#FACC15", ROSE: "#EC4899", PINK: "#EC4899", VIOLET: "#8B5CF6", PURPLE: "#8B5CF6",
          ORANGE: "#F97316", OR: "#D4AF37", GOLD: "#D4AF37", MARRON: "#854D0E", BROWN: "#854D0E", BEIGE: "#D6C6A5"
        };
        hex = known[name.toUpperCase()] || "#808080";
      }
      if (!out.some(function (c) { return c.name.toLowerCase() === name.toLowerCase(); })) {
        out.push({ name: name, hex: hex });
      }
    });
    return out.slice(0, 20);
  }

  function colorName(item) {
    const c = item && item.color;
    return String((c && typeof c === "object" ? c.name : c) || (item && item.color_name) || "").trim();
  }

  function injectCss() {
    if (document.getElementById("sngProductColorCssV3")) return;
    const style = document.createElement("style");
    style.id = "sngProductColorCssV3";
    style.textContent = `
      #productDetail .sngProductColorSelector{
        display:block!important;clear:both!important;width:100%!important;
        margin:18px 0 20px!important;padding:0!important;
      }
      #productDetail .sngProductColorHead{
        display:flex!important;align-items:center!important;justify-content:space-between!important;
        gap:10px!important;margin:0 0 12px!important;
      }
      #productDetail .sngProductColorHead strong{color:#f4f7ff!important;font-size:14px!important;font-weight:800!important}
      #productDetail .sngProductColorHead span{color:#91a4ba!important;font-size:12px!important}
      #productDetail .sngProductColorOptions{
        display:flex!important;align-items:center!important;gap:13px!important;flex-wrap:nowrap!important;
        width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;
        padding:4px 3px 8px!important;margin:0!important;scrollbar-width:none!important;
        -webkit-overflow-scrolling:touch!important;
      }
      #productDetail .sngProductColorOptions::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
      #productDetail .sngProductColorOption{
        appearance:none!important;-webkit-appearance:none!important;position:relative!important;
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        flex:0 0 30px!important;width:30px!important;height:30px!important;min-width:30px!important;min-height:30px!important;
        padding:0!important;margin:0!important;border:2px solid rgba(255,255,255,.32)!important;
        border-radius:50%!important;background:var(--sng-color,#808080)!important;
        box-shadow:0 2px 8px rgba(0,0,0,.3),inset 0 0 0 1px rgba(0,0,0,.14)!important;
        cursor:pointer!important;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease!important;
      }
      #productDetail .sngProductColorOption:hover{transform:scale(1.08)!important;border-color:rgba(255,255,255,.72)!important}
      #productDetail .sngProductColorOption.is-selected{
        border-color:#fff!important;transform:scale(1.12)!important;
        box-shadow:0 0 0 2px rgba(59,155,255,.95),0 0 16px rgba(59,155,255,.42),inset 0 0 0 1px rgba(255,255,255,.65)!important;
      }
      #productDetail .sngProductColorOption.is-white{border-color:rgba(255,255,255,.65)!important}
      #productDetail .sngProductColorOption:focus-visible{outline:2px solid #58a9ff!important;outline-offset:3px!important}
      #productDetail .sngProductColorError{display:none!important;margin:8px 0 0!important;color:#ffb4bf!important;font-size:12px!important;font-weight:700!important}
      #productDetail .sngProductColorSelector.has-error .sngProductColorError{display:block!important}
      .cartItem .sngCartColor,#checkoutSummary .sngCheckoutColor{display:block!important;margin-top:3px!important;color:#8dbce8!important;font-size:11px!important}
    `;
    document.head.appendChild(style);
  }

  function currentDetailProduct() {
    const detail = document.getElementById("productDetail");
    if (!detail) return null;
    const id = detail.querySelector("[data-product-id]")?.getAttribute("data-product-id");
    if (id) {
      const byId = productById(id);
      if (byId) return byId;
    }
    const title = detail.querySelector(".productInfo h2,.productInfo h1,.sngProductInfoV1 h1,.sngProductInfoV1 h2,h1,h2");
    const name = String(title?.textContent || "").trim();
    return name ? productList().find(function (p) { return String(p.name || "").trim() === name; }) || null : null;
  }

  function showError(message) {
    const box = document.querySelector("#productDetail .sngProductColorSelector");
    if (!box) return;
    box.classList.add("has-error");
    const error = box.querySelector(".sngProductColorError");
    if (error) error.textContent = message || "Choisis une couleur avant de continuer.";
  }

  function renderSelector(id) {
    const detail = document.getElementById("productDetail");
    const product = productById(id) || currentDetailProduct();
    if (!detail || !product) return;

    const options = colorsOf(product);
    const existing = detail.querySelector(".sngProductColorSelector");
    const title = detail.querySelector(".productInfo h2,.productInfo h1,.sngProductInfoV1 h1,.sngProductInfoV1 h2,h1,h2");

    if (!options.length || !title) {
      if (existing) existing.remove();
      return;
    }

    if (existing && existing.dataset.productId === String(product.id) && existing.querySelectorAll(".sngProductColorOption").length === options.length) return;
    if (existing) existing.remove();
    injectCss();

    const box = document.createElement("section");
    box.className = "sngProductColorSelector";
    box.dataset.productId = String(product.id);

    const head = document.createElement("div");
    head.className = "sngProductColorHead";
    head.innerHTML = "<strong>🎨 Couleur</strong><span>Choisis une couleur</span>";
    box.appendChild(head);

    const row = document.createElement("div");
    row.className = "sngProductColorOptions";
    const saved = selected[String(product.id)];

    options.forEach(function (color) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sngProductColorOption";
      if (/^#FFFFFF$/i.test(color.hex)) button.classList.add("is-white");
      const active = saved && saved.name.toLowerCase() === color.name.toLowerCase();
      if (active) button.classList.add("is-selected");
      button.style.setProperty("--sng-color", color.hex);
      button.title = color.name;
      button.setAttribute("aria-label", "Couleur " + color.name);
      button.setAttribute("aria-pressed", String(Boolean(active)));
      button.addEventListener("click", function () {
        selected[String(product.id)] = { name: color.name, hex: color.hex };
        box.classList.remove("has-error");
        row.querySelectorAll(".sngProductColorOption").forEach(function (other) {
          const activeNow = other === button;
          other.classList.toggle("is-selected", activeNow);
          other.setAttribute("aria-pressed", String(activeNow));
        });
      });
      row.appendChild(button);
    });

    box.appendChild(row);
    const error = document.createElement("p");
    error.className = "sngProductColorError";
    error.textContent = "Choisis une couleur avant de continuer.";
    box.appendChild(error);

    title.insertAdjacentElement("afterend", box);
  }

  window.__sngRenderProductColors = renderSelector;

  function wrapOpenProduct() {
    if (window.__sngColorOpenProductWrapped || typeof window.openProduct !== "function") return;
    const original = window.openProduct;
    window.openProduct = function (id) {
      const result = original.apply(this, arguments);
      const renderLater = function () { renderSelector(id); };
      window.requestAnimationFrame(renderLater);
      window.setTimeout(renderLater, 30);
      window.setTimeout(renderLater, 180);
      window.setTimeout(renderLater, 600);
      return result;
    };
    window.__sngColorOpenProductWrapped = true;
  }

  function saveCartNow() {
    if (typeof window.save === "function") window.save();
    else {
      try { localStorage.setItem("sg_cart", JSON.stringify(window.cartItems || [])); } catch (_) {}
      if (typeof window.update === "function") window.update();
    }
  }

  function wrapAdd() {
    if (window.__sngColorAddWrapped || typeof window.add !== "function") return;
    const originalAdd = window.add;
    window.add = function (id) {
      const product = productById(id);
      const options = colorsOf(product);
      if (!product || !options.length) return originalAdd.apply(this, arguments);
      const saved = selected[String(id)];
      const color = saved && options.find(function (c) { return c.name.toLowerCase() === String(saved.name).toLowerCase(); });
      if (!color) {
        showError("Choisis une couleur avant d’ajouter ce produit au panier.");
        return false;
      }
      const lines = Array.isArray(window.cartItems) ? window.cartItems : [];
      const sameProductQty = lines.filter(function (x) { return Number(x.id) === Number(id); }).reduce(function (sum, x) { return sum + Number(x.qty || 0); }, 0);
      if (sameProductQty >= Number(product.stock)) {
        alert("La quantité demandée dépasse le stock disponible.");
        return false;
      }
      let item = lines.find(function (x) { return Number(x.id) === Number(id) && colorName(x).toLowerCase() === color.name.toLowerCase(); });
      if (item) item.qty = Number(item.qty || 0) + 1;
      else lines.push({ id: product.id, qty: 1, color: { name: color.name, hex: color.hex } });
      window.cartItems = lines;
      saveCartNow();
      return true;
    };
    window.__sngColorAddWrapped = true;
  }

  function decorateCart() {
    const rows = Array.from(document.querySelectorAll("#items .cartItem"));
    const lines = Array.isArray(window.cartItems) ? window.cartItems : [];
    rows.forEach(function (row, index) {
      const item = lines[index];
      if (!item) return;
      const product = productById(item.id);
      if (!product) return;
      const copy = row.children[1];
      if (!copy) return;
      copy.querySelector(".sngCartColor")?.remove();
      const name = colorName(item);
      if (!name) return;
      const label = document.createElement("small");
      label.className = "sngCartColor";
      label.textContent = "🎨 Couleur : " + name;
      const bold = copy.querySelector("b");
      if (bold) bold.insertAdjacentElement("afterend", label);
    });
  }

  function boot() {
    injectCss();
    wrapOpenProduct();
    wrapAdd();
    const detail = document.getElementById("productDetail");
    if (detail && !detail.__sngColorObserver) {
      const observer = new MutationObserver(function () {
        window.requestAnimationFrame(function () {
          const product = currentDetailProduct();
          if (product) renderSelector(product.id);
        });
      });
      observer.observe(detail, { childList: true, subtree: true });
      detail.__sngColorObserver = observer;
    }
    const product = currentDetailProduct();
    if (product) renderSelector(product.id);
    decorateCart();
  }

  document.addEventListener("click", function (event) {
    const button = event.target && event.target.closest ? event.target.closest("#products .addToCartIcon") : null;
    if (!button) return;
    const card = button.closest(".productCardClickable");
    if (!card) return;
    const match = String(card.getAttribute("onclick") || "").match(/openProduct\((\d+)\)/);
    if (!match) return;
    const product = productById(Number(match[1]));
    if (!product || !colorsOf(product).length) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    if (typeof window.openProduct === "function") window.openProduct(Number(match[1]));
  }, true);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  window.addEventListener("load", boot);
  window.setTimeout(boot, 500);
})();
