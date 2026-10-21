/* SNGAMER STORE — stable section/category guard
   Single-purpose, no global MutationObserver.
   - Home keeps category chips.
   - Bottom-nav category pages show only their own category products.
   - Shared footer is never hidden by this file.
   - Favorite remains a plain real heart.
   - Empty promo space cannot stretch the Home hero.
*/
(function () {
  "use strict";

  const order = ["Tous", "Pièces eFootball", "Souris", "Accessoires", "Gaming Phone"];

  function normalizeCategory(value) {
    return String(value == null ? "" : value)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function strictCategory(product) {
    const raw = normalizeCategory(product && product.category);
    if (raw === "coins" || raw === "pieces efootball" || raw === "piece efootball") return "Coins";
    if (raw === "gaming phone" || raw === "gaming phones") return "Gaming Phone";
    if (raw === "accessoires" || raw === "accessoire") return "Accessoires";
    if (raw === "souris" || raw === "mouse") return "Souris";
    return String((product && product.category) || "Accessoires").trim() || "Accessoires";
  }

  function strictSectionMatch(product) {
    const section = String(window.activeStoreSection || document.body?.dataset.storeSection || "home");
    if (section === "home") return true;
    const category = strictCategory(product);
    if (section === "accessories") return category === "Accessoires";
    if (section === "phones") return category === "Gaming Phone";
    if (section === "coins") return category === "Coins";
    return true;
  }

  function patchGlobalCategoryLogic() {
    window.storeCategory = strictCategory;
    window.matchesStoreSection = strictSectionMatch;
  }

  function patchCategories() {
    const area = document.getElementById("cats");
    if (!area) return;
    const section = String(window.activeStoreSection || document.body?.dataset.storeSection || "home");

    if (section !== "home") {
      area.hidden = true;
      area.style.display = "none";
      area.replaceChildren();
      return;
    }

    const buttons = Array.from(area.querySelectorAll(".catbtn"));
    buttons.forEach(button => {
      const text = button.textContent.trim();
      if (text === "Coins" || text === "Coins / Pièces eFootball") button.textContent = "Pièces eFootball";
    });

    const rank = text => {
      const index = order.indexOf(text);
      return index === -1 ? 999 : index;
    };
    const desired = [...buttons].sort((a, b) => rank(a.textContent.trim()) - rank(b.textContent.trim()));
    const current = Array.from(area.querySelectorAll(".catbtn"));
    if (desired.some((button, index) => button !== current[index])) {
      const fragment = document.createDocumentFragment();
      desired.forEach(button => fragment.appendChild(button));
      area.appendChild(fragment);
    }
  }

  function enforceCategoryPage() {
    const section = String(window.activeStoreSection || document.body?.dataset.storeSection || "home");
    const categoryPage = section !== "home" && section !== "profile";
    const catsArea = document.getElementById("cats");
    const subcats = document.getElementById("navSubcategories");

    if (catsArea) {
      catsArea.hidden = categoryPage;
      catsArea.style.display = categoryPage ? "none" : "";
      if (categoryPage) catsArea.replaceChildren();
    }
    if (subcats) {
      subcats.hidden = true;
      subcats.style.display = "none";
      if (subcats.childElementCount) subcats.replaceChildren();
    }
    document.body.classList.toggle("sngStrictCategoryPage", categoryPage);
  }

  function installStyles() {
    if (document.getElementById("sngStableSectionStyles")) return;
    const style = document.createElement("style");
    style.id = "sngStableSectionStyles";
    style.textContent = `
      /* Category pages: no horizontal category selector and no Home hero. */
      body.sngStrictCategoryPage #cats,
      body.sngStrictCategoryPage #navSubcategories,
      body.sngStrictCategoryPage > .hero { display:none !important; }

      /* Do not let an empty/uninitialized promo slot reserve hundreds of pixels. */
      .hero:not(.has-active-promo):not(.has-no-promo) .promoArea { display:none !important; }
      .hero:not(.has-active-promo):not(.has-no-promo) .heroIn {
        min-height:auto !important;
        padding-top:28px !important;
        padding-bottom:30px !important;
      }

      /* Plain real heart: no pill, frame, gradient or custom button shape. */
      html body .sngSocialBtn.sngFavBtn {
        width:34px !important;
        min-width:34px !important;
        max-width:34px !important;
        height:34px !important;
        min-height:34px !important;
        padding:0 !important;
        margin:0 !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
        color:#dce7f4 !important;
        font-family:Arial,Helvetica,sans-serif !important;
        font-size:28px !important;
        font-weight:400 !important;
        line-height:34px !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:0 !important;
        transform:none !important;
      }
      html body .sngSocialBtn.sngFavBtn:hover,
      html body .sngSocialBtn.sngFavBtn:active,
      html body .sngSocialBtn.sngFavBtn.isFavorite {
        border:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }
      html body .sngSocialBtn.sngFavBtn.isFavorite { color:#ff4f86 !important; }
      html body .sngSocialBtn.sngFavBtn .sngFavIcon { display:none !important; }

      /* The bottom navigation is fixed; leave the complete shared footer
         scrollable instead of allowing the bar to cover its last rows. */
      @media (max-width:700px) {
        body > .store-footer-content { margin-bottom:110px !important; }
        body > footer { padding-bottom:120px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    patchGlobalCategoryLogic();
    installStyles();

    if (window.__sngamerStableCategoryDisplayInstalled) {
      patchCategories();
      enforceCategoryPage();
      return;
    }

    if (typeof window.cats === "function") {
      const originalCats = window.cats;
      window.cats = function () {
        const result = originalCats.apply(this, arguments);
        patchGlobalCategoryLogic();
        patchCategories();
        enforceCategoryPage();
        return result;
      };
      window.__sngamerStableCategoryDisplayInstalled = true;
      patchCategories();
      enforceCategoryPage();
      return;
    }

    window.setTimeout(install, 50);
  }

  install();
})();
