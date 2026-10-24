(function () {
  "use strict";
  if (window.__sngProductColorsStorefrontV2) return;
  window.__sngProductColorsStorefrontV2 = true;
  const selected = Object.create(null);

  function productList() {
    if (Array.isArray(window.storeProducts)) return window.storeProducts;
    if (Array.isArray(window.products)) return window.products;
    return [];
  }
  function productById(id) { return productList().find(function (p) { return Number(p.id) === Number(id); }) || null; }
  function productFromDetail() {
    const detail = document.getElementById("productDetail");
    if (!detail) return null;
    const title = detail.querySelector(".productInfo h2, .productInfo h1, h2, h1");
    const name = title ? String(title.textContent || "").trim() : "";
    if (!name) return null;
    return productList().find(function (p) { return String(p.name || "").trim() === name; }) || null;
  }
  function colorsOf(p) {
    let rows = p && p.colors;
    if (typeof rows === "string") { try { rows = JSON.parse(rows); } catch (_) { rows = []; } }
    if (!Array.isArray(rows)) return [];
    const out = [];
    rows.forEach(function (r) {
      const name = String(typeof r === "string" ? r : (r && r.name) || "").trim().slice(0, 40);
      const hex = String((r && r.hex) || "").toUpperCase();
      if (name && !out.some(function (c) { return c.name.toLowerCase() === name.toLowerCase(); })) {
        out.push({ name: name, hex: /^#[0-9A-F]{6}$/.test(hex) ? hex : "#808080" });
      }
    });
    return out.slice(0, 20);
  }
  function colorName(item) {
    const c = item && item.color;
    return String((c && typeof c === "object" ? c.name : c) || (item && item.color_name) || "").trim();
  }
  function injectCss() {
    if (document.getElementById("sngProductColorCss")) return;
    const s = document.createElement("style"); s.id = "sngProductColorCss";
    s.textContent = "#productDetail .sngProductColorSelector{margin:13px 0 16px;display:block;clear:both}#productDetail .sngProductColorHead{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px}#productDetail .sngProductColorHead strong{color:#f2f6ff;font-size:14px;font-weight:800}#productDetail .sngProductColorHead span{color:#91a4ba;font-size:11px}#productDetail .sngProductColorOptions{display:flex;align-items:center;gap:12px;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;padding:3px 2px 7px;scrollbar-width:none;-webkit-overflow-scrolling:touch}#productDetail .sngProductColorOptions::-webkit-scrollbar{display:none}#productDetail .sngProductColorOption{position:relative;display:inline-flex;flex:0 0 auto;width:32px;height:32px;min-width:32px;min-height:32px;padding:0;margin:0;border:2px solid rgba(255,255,255,.28);border-radius:50%;background:var(--color-swatch,#808080);box-shadow:0 2px 8px rgba(0,0,0,.28),inset 0 0 0 1px rgba(0,0,0,.12);cursor:pointer;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}#productDetail .sngProductColorOption:hover{transform:translateY(-1px);border-color:rgba(255,255,255,.7)}#productDetail .sngProductColorOption:focus-visible{outline:2px solid #63b5ff;outline-offset:3px}#productDetail .sngProductColorOption.is-selected{border-color:#fff;box-shadow:0 0 0 2px rgba(68,157,255,.9),0 0 14px rgba(68,157,255,.42),inset 0 0 0 1px rgba(255,255,255,.55);transform:scale(1.08)}#productDetail .sngProductColorSwatch{display:block;width:100%;height:100%;border-radius:50%;background:var(--color-swatch,#808080)}#productDetail .sngProductColorOption[aria-label*="Blanc"] .sngProductColorSwatch{border:1px solid rgba(20,28,40,.28)}#productDetail .sngProductColorError{margin:8px 0 0;color:#ffb4bf;font-size:12px;font-weight:700}#productDetail .sngProductColorSelector.has-error .sngProductColorOption{border-color:rgba(255,111,132,.72)}.cartItem .sngCartColor{display:block;margin:3px 0;color:#8dbce8;font-size:11px}.cartItem .sngCartColor.missing{color:#ffb4bf}#checkoutSummary .sngCheckoutColor{display:block;margin-top:3px;color:#8dbce8;font-size:12px}";
    document.head.appendChild(s);
  }
  function showError(message) {
    const box = document.querySelector("#productDetail .sngProductColorSelector");
    if (!box) return;
    box.classList.add("has-error");
    const error = box.querySelector(".sngProductColorError");
    if (error) { error.textContent = message || "Choisis une couleur avant de continuer."; error.hidden = false; }
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function renderSelector(id) {
    const p = productById(id), detail = document.getElementById("productDetail");
    if (!p || !detail) return;
    const options = colorsOf(p);
    const title = detail.querySelector(".productInfo h2, .productInfo h1, h2, h1");
    const old = detail.querySelector(".sngProductColorSelector");
    if (!options.length || !title) { if (old) old.remove(); return; }
    if (old && old.dataset.productId === String(p.id)) return;
    if (old) old.remove();
    injectCss();

    const box = document.createElement("section");
    box.className = "sngProductColorSelector";
    box.dataset.productId = String(p.id);

    const head = document.createElement("div");
    head.className = "sngProductColorHead";
    head.innerHTML = "<strong>🎨 Couleur</strong><span>Choisis une couleur</span>";
    box.appendChild(head);

    const row = document.createElement("div");
    row.className = "sngProductColorOptions";
    const current = selected[String(p.id)];

    options.forEach(function (c) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sngProductColorOption";
      const active = !!current && current.name.toLowerCase() === c.name.toLowerCase();
      b.setAttribute("aria-label", "Couleur " + c.name);
      b.setAttribute("title", c.name);
      b.setAttribute("aria-pressed", String(active));
      if (active) b.classList.add("is-selected");
      b.style.setProperty("--color-swatch", c.hex);

      const swatch = document.createElement("span");
      swatch.className = "sngProductColorSwatch";
      swatch.setAttribute("aria-hidden", "true");
      b.appendChild(swatch);

      b.addEventListener("click", function () {
        selected[String(p.id)] = { name: c.name, hex: c.hex };
        box.classList.remove("has-error");
        const err = box.querySelector(".sngProductColorError");
        if (err) err.hidden = true;
        row.querySelectorAll("button").forEach(function (btn) {
          const isActive = btn === b;
          btn.classList.toggle("is-selected", isActive);
          btn.setAttribute("aria-pressed", String(isActive));
        });
      });
      row.appendChild(b);
    });

    box.appendChild(row);
    const error = document.createElement("p");
    error.className = "sngProductColorError";
    error.textContent = "Choisis une couleur pour continuer.";
    error.hidden = true;
    box.appendChild(error);
    title.insertAdjacentElement("afterend", box);
  }
  function renderSelectorFromDetail() { const p = productFromDetail(); if (p) renderSelector(p.id); }
  function saveCartNow() { if (typeof window.save === "function") window.save(); else { try { localStorage.setItem("sg_cart", JSON.stringify(cartItems)); } catch (_) {} if (typeof window.update === "function") window.update(); } }
  function wrapAdd() {
    if (window.__sngColorAddWrapped || typeof window.add !== "function") return;
    const originalAdd = window.add;
    window.add = function (id) {
      const p = productById(id); if (!p) return originalAdd.apply(this, arguments);
      const options = colorsOf(p); if (!options.length) return originalAdd.apply(this, arguments);
      const saved = selected[String(id)]; const color = saved && options.find(function (c) { return c.name.toLowerCase() === String(saved.name).toLowerCase(); });
      if (!color) { showError("Choisis une couleur avant d’ajouter ce produit au panier."); return false; }
      const lines = Array.isArray(cartItems) ? cartItems : [];
      const totalQty = lines.filter(function (x) { return Number(x.id) === Number(id); }).reduce(function (sum, x) { return sum + Number(x.qty || x.quantity || 0); }, 0);
      if (totalQty >= Number(p.stock)) { alert("La quantité demandée dépasse le stock disponible."); return false; }
      let item = lines.find(function (x) { return Number(x.id) === Number(id) && colorName(x).toLowerCase() === color.name.toLowerCase(); });
      if (!item) { item = lines.find(function (x) { return Number(x.id) === Number(id) && !colorName(x); }); if (item) item.color = { name: color.name, hex: color.hex }; }
      if (item) item.qty = Number(item.qty || item.quantity || 0) + 1; else lines.push({ id: p.id, qty: 1, color: { name: color.name, hex: color.hex } });
      saveCartNow(); return true;
    };
    window.__sngColorAddWrapped = true;
  }
  function decorateCart() {
    const rows = Array.from(document.querySelectorAll("#items .cartItem"));
    rows.forEach(function (row, index) {
      const item = cartItems[index]; if (!item) return; const p = productById(item.id); if (!p || !row.children[1]) return;
      const copy = row.children[1], previous = copy.querySelector(".sngCartColor"); if (previous) previous.remove();
      const name = colorName(item), missing = colorsOf(p).length > 0 && !name;
      if (name || missing) { const label = document.createElement("small"); label.className = "sngCartColor" + (missing ? " missing" : ""); label.textContent = name ? "🎨 Couleur : " + name : "🎨 Couleur à choisir"; const bold = copy.querySelector("b"); if (bold) bold.insertAdjacentElement("afterend", label); }
    });
  }
  function installObservers() {
    const detail = document.getElementById("productDetail"); if (!detail || detail.__sngColorObserver) return;
    const observer = new MutationObserver(function () { if (!detail.querySelector(".sngProductColorSelector")) window.requestAnimationFrame(renderSelectorFromDetail); });
    observer.observe(detail, { childList: true, subtree: true }); detail.__sngColorObserver = observer;
  }
  function boot() {
    injectCss(); wrapAdd(); installObservers(); renderSelectorFromDetail(); decorateCart();
    window.setTimeout(function () { wrapAdd(); installObservers(); renderSelectorFromDetail(); decorateCart(); }, 250);
    window.setTimeout(function () { wrapAdd(); installObservers(); renderSelectorFromDetail(); decorateCart(); }, 1000);
  }
  document.addEventListener("click", function (event) {
    const button = event.target && event.target.closest ? event.target.closest("#products .addToCartIcon") : null;
    if (!button) return; const card = button.closest(".productCardClickable"); if (!card) return;
    const match = String(card.getAttribute("onclick") || "").match(/openProduct\((\d+)\)/); if (!match) return;
    const p = productById(Number(match[1])); if (!p || !colorsOf(p).length) return;
    event.preventDefault(); event.stopPropagation(); if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    if (typeof window.openProduct === "function") window.openProduct(Number(match[1]));
  }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
  window.addEventListener("load", boot);
})();
