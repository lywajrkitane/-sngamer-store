/* SNGAMER STORE — navigation centralisée + checkout fiable + navigation recovery */
(function () {
  "use strict";

  function prepareCheckoutLayout() {
    const checkout = document.getElementById("checkout");
    const box = checkout && checkout.querySelector(".box");
    if (!box) return;
    const closeButton = box.querySelector(":scope > .x");
    let scroll = box.querySelector(":scope > .checkoutScrollArea");
    let actionBar = box.querySelector(":scope > .checkoutActionBar");
    let confirmButton = box.querySelector(":scope > .primary.full") || (actionBar && actionBar.querySelector(".primary.full"));
    if (!scroll || !actionBar) {
      if (!confirmButton) return;
      scroll = document.createElement("div"); scroll.className = "checkoutScrollArea";
      actionBar = document.createElement("div"); actionBar.className = "checkoutActionBar";
      Array.from(box.children).forEach(function (child) { if (child !== closeButton && child !== confirmButton) scroll.appendChild(child); });
      actionBar.appendChild(confirmButton); box.appendChild(scroll); box.appendChild(actionBar);
    }
    Array.from(box.children).forEach(function (child) {
      if (child === closeButton || child === scroll || child === actionBar) return;
      if (child.id === "checkoutSummary") { const heading = scroll.querySelector(":scope > h2"); if (heading) heading.insertAdjacentElement("afterend", child); else scroll.insertBefore(child, scroll.firstChild); }
      else scroll.appendChild(child);
    });
    const summary = scroll.querySelector(":scope > #checkoutSummary");
    const heading = scroll.querySelector(":scope > h2");
    if (summary && heading && heading.nextElementSibling !== summary) heading.insertAdjacentElement("afterend", summary);
    else if (summary && !heading && scroll.firstElementChild !== summary) scroll.insertBefore(summary, scroll.firstChild);
    confirmButton = actionBar.querySelector(".primary.full") || box.querySelector(":scope > .primary.full");
    if (confirmButton && confirmButton.parentElement !== actionBar) actionBar.appendChild(confirmButton);
    box.dataset.layoutFixed = "1";
  }

  function watchCheckout() {
    const checkout = document.getElementById("checkout");
    if (!checkout) return;
    prepareCheckoutLayout();
    const checkoutObserver = new MutationObserver(function () { if (checkout.classList.contains("show")) prepareCheckoutLayout(); });
    checkoutObserver.observe(checkout, { attributes: true, attributeFilter: ["class"] });
    const box = checkout.querySelector(".box");
    if (box) {
      const boxObserver = new MutationObserver(function () { if (checkout.classList.contains("show")) prepareCheckoutLayout(); });
      boxObserver.observe(box, { childList: true });
    }
  }

  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[c]; }); }
  function money(value) { return new Intl.NumberFormat("fr-FR").format(Number(value) || 0) + " FCFA"; }

  function orderTracking(status) {
    const states = ["Nouvelle", "Confirmée", "En préparation", "Expédiée", "Livrée"];
    const current = String(status || "Nouvelle").trim();
    const normalized = current.toLowerCase();
    const activeIndex = current === "Annulée" ? -1 : Math.max(0, states.findIndex(function (s) { return s.toLowerCase() === normalized; }));
    const cancelled = current === "Annulée";
    const labels = ["Nouvelle", "Confirmée", "Préparation", "Expédiée", "Livrée"];
    return `<div class="sngOrderTracking" data-status="${esc(current)}" aria-label="Suivi de la commande">
      <div class="sngOrderTrackLine" aria-hidden="true">${states.slice(0, -1).map(function (_, i) { return `<span class="sngOrderTrackConnector ${!cancelled && activeIndex > i ? "is-done" : ""}"></span>`; }).join("")}</div>
      <div class="sngOrderTrackSteps">${states.map(function (state, i) {
        const done = !cancelled && i <= activeIndex;
        const active = !cancelled && i === activeIndex;
        return `<div class="sngOrderTrackStep ${done ? "is-done" : ""} ${active ? "is-current" : ""}"><span class="sngOrderTrackDot">${done ? "✓" : ""}</span><span>${labels[i]}</span></div>`;
      }).join("")}</div>
      ${cancelled ? `<div class="sngOrderTrackCancelled">✕ Commande annulée</div>` : `<div class="sngOrderTrackCurrent">${esc(current)}</div>`}
    </div>`;
  }

  function setSectionChrome(section) {
    const isHome = section === "home";
    const isProfile = section === "profile";
    const hero = document.querySelector("body > .hero");
    const footerContent = document.querySelector("body > .store-footer-content");
    const cats = document.getElementById("cats");
    const subcats = document.getElementById("navSubcategories");

    if (hero) hero.hidden = !isHome;
    if (footerContent) footerContent.hidden = false;
    const footer = document.querySelector("body > footer");
    if (footer) footer.hidden = false;

    if (cats) {
      cats.hidden = !isHome;
      cats.style.display = isHome ? "" : "none";
      if (!isHome) cats.innerHTML = "";
    }
    if (subcats) {
      subcats.hidden = true;
      subcats.style.display = "none";
      subcats.innerHTML = "";
    }

    document.body.classList.toggle("sngHomeView", isHome);
    document.body.classList.toggle("sngCategoryView", !isHome && !isProfile);
    document.body.classList.toggle("sngProfileView", isProfile);
  }

  function installStoreNavigation() {
    if (window.__sngamerStoreNavigationV2) return;
    window.navigateStore = function (section) {
      const valid = new Set(["home", "accessories", "phones", "coins", "profile"]);
      section = valid.has(section) ? section : "home";
      window.activeStoreSection = section;
      document.body.dataset.storeSection = section;

      document.querySelectorAll(".mobileBottomNav .bottomNavItem[data-nav]").forEach(function (item) {
        item.classList.toggle("active", item.getAttribute("data-nav") === section);
      });

      const title = document.getElementById("sectionTitle");
      const cats = document.getElementById("cats");
      const subcats = document.getElementById("navSubcategories");
      const profile = document.getElementById("profileArea");
      const grid = document.getElementById("products");

      setSectionChrome(section);

      if (section === "profile") {
        if (title) title.textContent = "Mon espace client";
        if (cats) { cats.innerHTML = ""; cats.hidden = true; cats.style.display = "none"; }
        if (subcats) { subcats.hidden = true; subcats.style.display = "none"; subcats.innerHTML = ""; }
        if (grid) grid.replaceChildren();
        if (profile) { profile.hidden = false; profile.style.display = "block"; loadCustomerProfile(profile); }
      } else {
        if (profile) { profile.hidden = true; profile.style.display = "none"; profile.replaceChildren(); delete profile.dataset.sngProfileLoading; }
        if (subcats) { subcats.hidden = true; subcats.style.display = "none"; }
        if (title) title.textContent = section === "home" ? "Collection" : section === "accessories" ? "Accessoires" : section === "phones" ? "Univers Gaming" : "Pièces eFootball";

        if (typeof window.filterBy === "function") {
          const targetFilter = section === "home" ? "Tous" : section === "accessories" ? "Accessoires" : section === "phones" ? "Gaming Phone" : "Coins";
          window.filterBy(targetFilter);
        } else if (typeof window.render === "function") {
          window.render();
        }

        if (section !== "home") {
          if (cats) { cats.innerHTML = ""; cats.hidden = true; cats.style.display = "none"; }
          if (subcats) { subcats.innerHTML = ""; subcats.hidden = true; subcats.style.display = "none"; }
        }
      }

      try {
        sessionStorage.setItem("sngamer_store_section_v1", section);
        sessionStorage.setItem("sngamer_store_opened_v1", "1");
      } catch (_) {}

      const shop = document.getElementById("shop");
      if (shop && !window.__sngamerNavigationRestoring) requestAnimationFrame(function () { shop.scrollIntoView({ behavior: "smooth", block: "start" }); });
    };
    window.__sngamerStoreNavigationV2 = true;
  }

  async function loadCustomerProfile(profile) {
    if (!profile || profile.dataset.sngProfileLoading === "1") return;
    profile.dataset.sngProfileLoading = "1";
    try {
      const r = await fetch("/api/customer/me", { credentials: "same-origin", cache: "no-store" });
      if (!r.ok) { profile.innerHTML = '<div class="sgaCard"><h2>Connexion requise</h2><p>Connecte-toi à ton espace client pour voir tes commandes.</p></div>'; return; }
      const d = await r.json();
      const customer = d.customer || {};
      const or = await fetch("/api/customer/orders", { credentials: "same-origin", cache: "no-store" });
      const orders = or.ok ? await or.json() : [];
      const list = Array.isArray(orders) ? orders : [];
      profile.innerHTML = `
        <div class="sgaCard sngProfileHeader">
          <h2>Bonjour ${esc(customer.name || "Client")} 👋</h2>
          <p>Bienvenue dans ton espace client.</p>
          <div class="sngProfileMeta">${esc(customer.phone || "")}${customer.email ? " · " + esc(customer.email) : ""}</div>
        </div>
        <div class="sgaCard">
          <div class="sgaCardHead"><h3>Mes commandes</h3><span>${list.length}</span></div>
          <div class="sngProfileOrders">${list.length ? list.map(function(order) {
            const items = Array.isArray(order.items) ? order.items : [];
            const first = items[0]?.name || "Votre achat";
            const publicName = items.length > 1 ? first + " + " + (items.length - 1) : first;
            const total = order.total_amount ?? order.total ?? 0;
            const status = String(order.status || "Nouvelle");
            const colorDetails = items.filter(item => item && (typeof item.color === "string" ? item.color : item.color?.name)).map(item => {
              const colorName = typeof item.color === "string" ? item.color : item.color?.name;
              return `${item.name || "Produit"} : ${colorName}`;
            }).join(" · ");
            return `<article class="sgaOrder" data-order-id="${Number(order.id) || 0}"><div class="sgaOrderTop"><strong>Commande #${Number(order.id) || 0}</strong><span>${esc(status)}</span></div><div class="sgaOrderMeta">${esc(publicName)} · ${total ? money(total) : "Montant non disponible"}${colorDetails ? `<div class="sngOrderColorSummary" style="margin-top:5px;color:#92b7dd;font-size:12px">🎨 ${esc(colorDetails)}</div>` : ""}</div>${orderTracking(status)}</article>`;
          }).join("") : '<p class="sngProfileEmpty">Aucune commande pour le moment.</p>'}</div>
        </div>`;
      if (typeof window.sngRefreshFavorites === "function") window.sngRefreshFavorites();
    } catch (e) {
      console.error("SNGAMER_PROFILE_LOAD_ERROR", e);
      profile.innerHTML = '<div class="sgaCard"><h2>Espace client</h2><p>Impossible de charger ton espace client pour le moment. Réessaie dans quelques secondes.</p></div>';
    } finally { delete profile.dataset.sngProfileLoading; }
  }

  function installIsolationCSS() {
    if (document.getElementById("sngSectionIsolationV2")) return;
    const style = document.createElement("style");
    style.id = "sngSectionIsolationV2";
    style.textContent = `
      body.sngCategoryView > .hero,
      body.sngProfileView > .hero { display:none !important; }
      body.sngCategoryView #cats,
      body.sngCategoryView #navSubcategories,
      body.sngProfileView #cats,
      body.sngProfileView #navSubcategories,
      body.sngProfileView #products { display:none !important; }
      body.sngCategoryView #profileArea { display:none !important; }
      body.sngProfileView #profileArea { display:block !important; visibility:visible !important; }
      body.sngCategoryView #shop,
      body.sngProfileView #shop { min-height:calc(100vh - 150px); }
      body.sngCategoryView #shop > .bar,
      body.sngProfileView #shop > .bar { margin-bottom:18px; }
      .sngOrderTracking { margin-top:14px; padding:12px 10px 10px; border:1px solid rgba(112,154,220,.20); border-radius:14px; background:rgba(7,17,32,.58); overflow:hidden; }
      .sngOrderTrackSteps { position:relative; z-index:2; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:3px; }
      .sngOrderTrackStep { min-width:0; display:flex; flex-direction:column; align-items:center; gap:5px; color:#7488a4; font-size:9px; line-height:1.15; text-align:center; }
      .sngOrderTrackDot { width:18px; height:18px; border-radius:50%; display:grid; place-items:center; border:1px solid #3a4c68; background:#0b1424; color:#fff; font-size:10px; font-weight:800; box-sizing:border-box; }
      .sngOrderTrackStep.is-done { color:#8fc5ff; }
      .sngOrderTrackStep.is-current { color:#fff; font-weight:800; }
      .sngOrderTrackStep.is-done .sngOrderTrackDot { background:linear-gradient(135deg,#2374ff,#9b2cff); border-color:#5e83ff; box-shadow:0 0 12px rgba(69,91,255,.35); }
      .sngOrderTrackLine { position:absolute; display:none; }
      .sngOrderTrackSteps { position:relative; }
      .sngOrderTrackSteps:before { content:""; position:absolute; left:10%; right:10%; top:9px; height:2px; background:#263650; z-index:-1; }
      .sngOrderTrackCurrent { margin-top:9px; text-align:center; font-size:11px; font-weight:800; color:#65b6ff; }
      .sngOrderTrackCancelled { margin-top:9px; text-align:center; font-size:11px; font-weight:800; color:#ff6b8a; }
      @media (min-width:700px) { .sngOrderTrackStep { font-size:10px; } .sngOrderTracking { padding:14px 16px 11px; } }
    `;
    document.head.appendChild(style);
  }

  function boot() { installIsolationCSS(); installStoreNavigation(); watchCheckout(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
  window.setTimeout(prepareCheckoutLayout, 250);
})();
