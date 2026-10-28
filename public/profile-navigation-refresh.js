/* SNGAMER STORE — navigation reliability + instant customer profile */
(function () {
  "use strict";

  const STORAGE_KEY = "sg_profile_return_section";
  const STORE_SECTIONS = new Set(["home", "accessories", "phones", "coins", "profile"]);

  function injectPremiumCoinIcon() {
    const apply = function () {
      const buttons = document.querySelectorAll('.mobileBottomNav .bottomNavItem[data-nav="coins"] .bottomNavIcon');
      buttons.forEach(function (icon) {
        if (icon.dataset.sngamerCoinIcon === "1") return;
        icon.dataset.sngamerCoinIcon = "1";
        icon.innerHTML = `
          <svg class="sngamerCoinStackSvg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round">
              <path d="M32 10c9 0 16 3.7 16 8.2S41 26.4 32 26.4 16 22.7 16 18.2 23 10 32 10Z"/>
              <path d="M16 18.2v7.2c0 4.5 7 8.2 16 8.2s16-3.7 16-8.2v-7.2"/>
              <path d="M22 28.8v7.2c0 4.5 7 8.2 16 8.2s16-3.7 16-8.2v-7.2"/>
              <path d="M22 36v7.2c0 4.5 7 8.2 16 8.2s16-3.7 16-8.2V36"/>
              <path d="M18 28.5c-8.5 0-15 3.4-15 7.8s6.5 7.8 15 7.8c1.5 0 3-.1 4.3-.4"/>
              <path d="M3 36.3v7.1c0 4.4 6.5 7.8 15 7.8 2.2 0 4.3-.2 6.1-.7"/>
              <path d="M46 28.5c8.5 0 15 3.4 15 7.8s-6.5 7.8-15 7.8c-1.5 0-3-.1-4.3-.4"/>
              <path d="M61 36.3v7.1c0 4.4-6.5 7.8-15 7.8-2.2 0-4.3-.2-6.1-.7"/>
            </g>
          </svg>`;
      });
    };
    apply();
    [0,300,1000].forEach(function(delay){ setTimeout(apply,delay); });
  }

  function installVisibilityGuard() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
    if (!document.getElementById("sngProfileVisibilityGuard")) {
      const style = document.createElement("style");
      style.id = "sngProfileVisibilityGuard";
      style.textContent = `
        /* Customer profile must NEVER leak into the storefront. */
        body:not([data-store-section="profile"]) #profileArea,
        body:not(.sngDesktopProfileMode) #profileArea { display:none!important; visibility:hidden!important; }
        body[data-store-section="profile"] #profileArea,
        body.sngDesktopProfileMode #profileArea { display:block!important; visibility:visible!important; }
      `;
      document.head.appendChild(style);
    }

    const sync = function () {
      const body = document.body;
      if (!body) return;

      const raw = window.activeStoreSection;
      const section = STORE_SECTIONS.has(raw) ? raw : "home";
      const isProfile = section === "profile";

      // IMPORTANT: only write attributes when their value really changes.
      // Writing the same data-store-section value inside a MutationObserver
      // can schedule the observer again and freeze scrolling/taps on mobile.
      if (body.getAttribute("data-store-section") !== section) {
        body.setAttribute("data-store-section", section);
      }
      if (body.classList.contains("sngDesktopProfileMode") !== isProfile) {
        body.classList.toggle("sngDesktopProfileMode", isProfile);
      }

      const profile = document.getElementById("profileArea");
      if (!profile) return;

      if (isProfile) {
        if (profile.hidden) profile.hidden = false;
        if (profile.style.getPropertyValue("display")) profile.style.removeProperty("display");
        if (profile.style.getPropertyValue("visibility")) profile.style.removeProperty("visibility");
        profile.classList.add("sngDesktopProfileArea");
      } else {
        if (!profile.hidden) profile.hidden = true;
        if (profile.style.getPropertyValue("display") !== "none" ||
            profile.style.getPropertyPriority("display") !== "important") {
          profile.style.setProperty("display", "none", "important");
        }
        if (profile.style.getPropertyValue("visibility") !== "hidden" ||
            profile.style.getPropertyPriority("visibility") !== "important") {
          profile.style.setProperty("visibility", "hidden", "important");
        }
        profile.classList.remove("sngDesktopProfileArea");
      }
    };

    sync();

    // Navigation writes data-store-section, so this observer only needs
    // to reconcile genuine external changes. sync() is idempotent and will not
    // rewrite unchanged body attributes, preventing a MutationObserver loop.
    if (!window.__sngamerProfileVisibilityObserver) {
      window.__sngamerProfileVisibilityObserver = new MutationObserver(function () {
        sync();
      });
      window.__sngamerProfileVisibilityObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "data-store-section"]
      });
    }
  }

  /* Customer identity can be cached, but order data must always be read from
     the server. Order status/payment changes happen in the admin dashboard and
     must be visible immediately in the customer account as well. */
  function installCustomerAccountCache() {
    if (window.__sngamerCustomerAccountCacheInstalled) return;
    window.__sngamerCustomerAccountCacheInstalled = true;

    const nativeFetch = window.fetch.bind(window);
    const cache = new Map();
    const identityPath = "/api/customer/me";

    function keyFor(input) {
      try {
        const url = typeof input === "string" ? input : input.url;
        return new URL(url, window.location.origin).pathname;
      } catch (_) { return ""; }
    }

    window.fetch = function(input, init) {
      const path = keyFor(input);
      if (path !== identityPath) return nativeFetch(input, init);

      const method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
      if (method !== "GET") return nativeFetch(input, init);

      const cached = cache.get(path);
      if (cached) {
        nativeFetch(input, init).then(function(response){
          if (!response.ok) return;
          return response.clone().json().then(function(data){ cache.set(path, data); });
        }).catch(function(){});
        return Promise.resolve(new Response(JSON.stringify(cached), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      }

      return nativeFetch(input, init).then(function(response){
        if (!response.ok) return response;
        return response.clone().json().then(function(data){
          cache.set(path, data);
          return response;
        }).catch(function(){ return response; });
      });
    };
  }

  /*
   * Catalog reliability guard.
   * app.js currently treats one transient /api/products failure as a permanent
   * catalog outage. That is what produces the "catalogue temporairement
   * indisponible" screen after returning from the customer profile.
   *
   * Keep the existing catalog renderer untouched. We only serialize calls to
   * the existing load() function and retry the same request when the catalog
   * is still empty. Existing products are never cleared by this guard.
   */
  function installCatalogReliability() {
    if (window.__sngamerCatalogReliabilityInstalled) return;
    if (typeof window.load !== "function") return;
    window.__sngamerCatalogReliabilityInstalled = true;

    const nativeLoad = window.load;
    let activeLoad = null;
    let retryTimer = null;
    let retryDelay = 2500;

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const catalogReady = () => {
      const catalog = window.storeProducts || window.products;
      return Array.isArray(catalog) && catalog.length > 0;
    };
    const hasCatalogCards = () => {
      const grid = document.getElementById("products");
      return !!(grid && grid.querySelector(".productCardClickable"));
    };
    const clearTemporaryFailure = () => {
      const grid = document.getElementById("products");
      if (!grid || hasCatalogCards()) return;
      const text = String(grid.textContent || "").toLowerCase();
      if (text.includes("catalogue est temporairement indisponible") ||
          text.includes("catalogue temporairement indisponible") ||
          text.includes("reconnexion au catalogue")) {
        grid.replaceChildren();
      }
    };
    const stopRetry = () => {
      retryDelay = 2500;
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
    };
    const scheduleRetry = () => {
      if (retryTimer || catalogReady() || hasCatalogCards() || window.activeStoreSection === "profile") return;
      const grid = document.getElementById("products");
      if (grid && !hasCatalogCards()) {
        grid.innerHTML = '<div role="status" aria-live="polite" style="grid-column:1/-1;text-align:center;padding:35px 15px;color:#aab8ca">Reconnexion au catalogue en cours…</div>';
      }
      retryTimer = setTimeout(() => {
        retryTimer = null;
        retryDelay = Math.min(Math.round(retryDelay * 1.4), 12000);
        if (!catalogReady() && !hasCatalogCards() && window.activeStoreSection !== "profile") window.load();
      }, retryDelay);
    };

    window.load = function() {
      if (activeLoad) return activeLoad;
      activeLoad = (async function() {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            clearTemporaryFailure();
            await nativeLoad();
            if (catalogReady() || hasCatalogCards()) {
              stopRetry();
              return;
            }
          } catch (error) {
            console.error("SNGAMER_CATALOG_LOAD_RETRY_ERROR", error);
          }
          if (attempt < 4) await wait(350 * Math.pow(2, attempt));
        }
        if (!catalogReady() && !hasCatalogCards()) scheduleRetry();
      })().finally(function() {
        activeLoad = null;
        if (catalogReady() || hasCatalogCards()) stopRetry();
      });
      return activeLoad;
    };

    // Recover the first app.js request after Render cold starts and continue
    // at a capped interval until the live API has successfully populated cards.
    [0, 350, 1000, 2200].forEach(delay => setTimeout(function() {
      if (!catalogReady() && !hasCatalogCards() && window.activeStoreSection !== "profile") window.load();
    }, delay));
    window.addEventListener("online", function() {
      if (!catalogReady() && !hasCatalogCards() && window.activeStoreSection !== "profile") {
        stopRetry();
        window.load();
      }
    });
    window.addEventListener("focus", function() {
      if (!catalogReady() && !hasCatalogCards() && window.activeStoreSection !== "profile") {
        stopRetry();
        window.load();
      }
    });
    document.addEventListener("visibilitychange", function() {
      if (document.visibilityState === "visible" && !catalogReady() && !hasCatalogCards() && window.activeStoreSection !== "profile") {
        stopRetry();
        window.load();
      }
    });
  }

  function loadPremiumSearch() {
    const ensure = function () {
      const source = document.querySelector(".siteHeader .search");
      const cartButton = document.querySelector(".siteHeader .cartButton");
      if (!source || !cartButton) return;
      if (!document.querySelector('link[data-sngamer-premium-search="1"]')) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.dataset.sngamerPremiumSearch = "1";
        css.href = "search-polish.css?v=20261017-1455";
        document.head.appendChild(css);
      }
      if (!document.querySelector('script[data-sngamer-premium-search="1"]')) {
        const script = document.createElement("script");
        script.dataset.sngamerPremiumSearch = "1";
        script.src = "search-polish.js?v=20261017-1455";
        script.defer = true;
        document.body.appendChild(script);
      }
    };
    ensure();
    [150,500,1200,2500].forEach(function(delay){setTimeout(ensure,delay);});
  }

  function loadCompactOrders() {
    if (window.__sngamerCompactOrdersLoader) return;
    window.__sngamerCompactOrdersLoader = true;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "orders-compact-v23.css?v=20261016-2038";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "orders-compact-v23.js?v=20261016-2038";
    script.defer = true;
    document.body.appendChild(script);
  }

  function loadAdminWorkspace() {
    if (window.__sngamerAdminWorkspaceLoader) return;
    window.__sngamerAdminWorkspaceLoader = true;
    const script = document.createElement("script");
    script.src = "admin-section-workspace-v24.js?v=20261016-2100";
    script.defer = true;
    document.body.appendChild(script);
  }

  function start() {
    injectPremiumCoinIcon();
    installVisibilityGuard();
    installCustomerAccountCache();
    installCatalogReliability();
    loadPremiumSearch();
    loadCompactOrders();
    loadAdminWorkspace();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once:true });
  } else {
    start();
  }
})();