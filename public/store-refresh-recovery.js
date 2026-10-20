/* SNGAMER STORE — refresh recovery
   Keeps the customer's current storefront position/section after a reload.
   No product data or business logic is changed. */
(function () {
  "use strict";

  const SECTION_KEY = "sngamer_store_section_v1";
  const SCROLL_KEY = "sngamer_store_scroll_v1";
  const VALID_SECTIONS = new Set(["home", "accessories", "phones", "coins"]);
  let restoring = false;

  function saveScroll() {
    try {
      if (window.scrollY > 180) {
        sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
        sessionStorage.setItem("sngamer_store_opened_v1", "1");
      }
    } catch (_) {}
  }

  function restore() {
    if (restoring) return;
    try {
      if (sessionStorage.getItem("sngamer_store_opened_v1") !== "1") return;
    } catch (_) {
      return;
    }

    restoring = true;
    let tries = 0;

    const attempt = function () {
      tries += 1;
      let section = "home";
      let scroll = 0;
      try {
        section = sessionStorage.getItem(SECTION_KEY) || "home";
        scroll = Number(sessionStorage.getItem(SCROLL_KEY) || 0);
      } catch (_) {}

      if (!VALID_SECTIONS.has(section)) section = "home";

      const ready = Array.isArray(window.storeProducts) && window.storeProducts.length > 0;
      if (!ready && tries < 60) {
        window.setTimeout(attempt, 150);
        return;
      }

      try {
        if (section !== "home" && typeof window.navigateStore === "function") {
          window.navigateStore(section);
        }
      } catch (_) {}

      window.setTimeout(function () {
        const target = document.getElementById("shop");
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const targetScroll = scroll > 0 ? Math.min(scroll, maxScroll) : (target ? target.offsetTop : 0);
        window.scrollTo({ top: targetScroll, left: 0, behavior: "auto" });
        restoring = false;
      }, 120);
    };

    attempt();
  }

  function installNavigationPersistence() {
    if (typeof window.navigateStore === "function" && !window.__sngamerRefreshRecoveryNav) {
      const original = window.navigateStore;
      window.navigateStore = function (section) {
        try {
          const value = VALID_SECTIONS.has(section) ? section : "home";
          sessionStorage.setItem(SECTION_KEY, value);
          sessionStorage.setItem("sngamer_store_opened_v1", "1");
        } catch (_) {}
        return original.apply(this, arguments);
      };
      window.__sngamerRefreshRecoveryNav = true;
    }
  }

  window.addEventListener("scroll", function () {
    if (!restoring) saveScroll();
  }, { passive: true });

  window.addEventListener("pagehide", saveScroll);
  window.addEventListener("beforeunload", saveScroll);

  const timer = window.setInterval(function () {
    installNavigationPersistence();
    if (window.__sngamerRefreshRecoveryNav) window.clearInterval(timer);
  }, 50);

  window.addEventListener("load", function () {
    installNavigationPersistence();
    restore();
  });

  installNavigationPersistence();
})();
