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
        if (profile) { profile.hidden = false; profile.style.display = "block"; }
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

    `;
    document.head.appendChild(style);
  }

  function boot() { installIsolationCSS(); installStoreNavigation(); watchCheckout(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
  window.setTimeout(prepareCheckoutLayout, 250);
})();
