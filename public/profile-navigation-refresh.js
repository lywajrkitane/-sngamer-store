/* SNGAMER STORE — refresh complet après retour depuis Profil
   Le bug observé apparaît après Profil -> une rubrique produit :
   l'état de la grille peut rester vide. On force donc une vraie
   actualisation du document uniquement dans ce cas, puis on restaure
   automatiquement la rubrique demandée après le rechargement.
*/
(function () {
  "use strict";

  const STORAGE_KEY = "sg_profile_return_section";
  const validSections = new Set(["home", "accessories", "phones", "coins"]);

  function installRefreshNavigation() {
    if (typeof window.navigateStore !== "function") return;
    if (window.__sngamerProfileRefreshInstalled) return;

    const originalNavigateStore = window.navigateStore;
    window.__sngamerProfileRefreshInstalled = true;

    window.navigateStore = function (section) {
      const currentSection = window.activeStoreSection;

      if (currentSection === "profile" && validSections.has(section)) {
        sessionStorage.setItem(STORAGE_KEY, section);
        window.location.reload();
        return;
      }

      return originalNavigateStore.apply(this, arguments);
    };

    const pendingSection = sessionStorage.getItem(STORAGE_KEY);
    if (pendingSection && validSections.has(pendingSection)) {
      sessionStorage.removeItem(STORAGE_KEY);
      window.setTimeout(function () {
        originalNavigateStore(pendingSection);
      }, 0);
    } else if (pendingSection) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  function loadPremiumSearch() {
    if (window.__sngamerPremiumSearchLoader) return;
    window.__sngamerPremiumSearchLoader = true;

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "search-polish.css?v=20261016-1935";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "search-polish.js?v=20261016-1935";
    script.defer = true;
    document.body.appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installRefreshNavigation, { once: true });
  } else {
    installRefreshNavigation();
  }

  loadPremiumSearch();
})();
