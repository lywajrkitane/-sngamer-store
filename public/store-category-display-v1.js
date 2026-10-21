/* SNGAMER STORE — category display only
   Keeps the existing filtering logic and product data untouched.

   CATEGORY PAGE RULE:
   - Home keeps the category chips.
   - A bottom-navigation category page shows only its own products.
   - No other category chips/navigation are shown on a category page.
   - The shared storefront footer remains visible on every section.
   - The Favorites control is a simple real heart glyph.
*/
(function () {
  "use strict";

  const order = [
    "Tous",
    "Pièces eFootball",
    "Souris",
    "Accessoires",
    "Gaming Phone"
  ];

  function normalizeCategory(value) {
    return String(value == null ? "" : value)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  /* The admin-selected category is authoritative on category pages.
     Do not turn a product explicitly saved as "Souris" into "Accessoires"
     merely because its name contains the word souris. */
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
    if (!buttons.length) return;

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
      if (categoryPage && catsArea.childElementCount) catsArea.replaceChildren();
    }
    if (subcats) {
      subcats.hidden = true;
      subcats.style.display = "none";
      if (subcats.childElementCount) subcats.replaceChildren();
    }

    document.body.classList.toggle("sngStrictCategoryPage", categoryPage);
  }

  function installCategoryIsolation() {
    if (document.getElementById("sngStrictCategoryStyles")) return;

    const style = document.createElement("style");
    style.id = "sngStrictCategoryStyles";
    style.textContent = `
      body.sngStrictCategoryPage #cats,
      body.sngStrictCategoryPage #navSubcategories { display:none !important; }
      body.sngStrictCategoryPage > .hero { display:none !important; }

      /* Favorites: a plain real heart — no pill, gradient, frame or custom shape. */
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
        font-size:27px !important;
        font-weight:400 !important;
        line-height:34px !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        transform:none !important;
      }
      html body .sngSocialBtn.sngFavBtn:hover,
      html body .sngSocialBtn.sngFavBtn:active {
        background:transparent !important;
        border:0 !important;
        box-shadow:none !important;
      }
      html body .sngSocialBtn.sngFavBtn.isFavorite { color:#ff4f86 !important; background:transparent !important; border:0 !important; }
      html body .sngSocialBtn.sngFavBtn:disabled { opacity:.55 !important; }
    `;
    document.head.appendChild(style);

    const observer = new MutationObserver(function () {
      patchGlobalCategoryLogic();
      enforceCategoryPage();
      patchCategories();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function install() {
    patchGlobalCategoryLogic();
    installCategoryIsolation();

    if (window.__sngamerCategoryDisplayInstalled) {
      patchCategories();
      enforceCategoryPage();
      return;
    }

    if (typeof window.cats !== "function") {
      window.setTimeout(install, 50);
      return;
    }

    const originalCats = window.cats;
    window.cats = function () {
      const result = originalCats.apply(this, arguments);
      patchGlobalCategoryLogic();
      patchCategories();
      enforceCategoryPage();
      return result;
    };

    window.__sngamerCategoryDisplayInstalled = true;
    patchCategories();
    enforceCategoryPage();
  }

  install();
})();
