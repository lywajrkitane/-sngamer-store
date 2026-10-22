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

  const order = ["Tous", "Pièces eFootball", "Univers Gaming", "Souris", "Accessoires"];

  function normalizeCategory(value) {
    return String(value == null ? "" : value)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function strictCategory(product) {
    const raw = normalizeCategory(product && product.category);
    if (raw === "coins" || raw === "pieces efootball" || raw === "piece efootball") return "Pièces eFootball";
    if (raw === "univers gaming" || raw === "gaming phone" || raw === "gaming phones") return "Univers Gaming";
    if (raw === "accessoires" || raw === "accessoire") return "Accessoires";
    if (raw === "souris" || raw === "mouse") return "Souris";
    return String((product && product.category) || "Accessoires").trim() || "Accessoires";
  }

  function strictSectionMatch(product) {
    const section = String(window.activeStoreSection || document.body?.dataset.storeSection || "home");
    if (section === "home") return true;
    const category = strictCategory(product);
    if (section === "accessories") return category === "Accessoires";
    if (section === "phones") return category === "Univers Gaming";
    if (section === "coins") return category === "Pièces eFootball";
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

/* SNGAMER STORE — shared subcategory navigation for Pièces eFootball and Univers Gaming */
(function () {
  'use strict';
  if (window.__sngHierarchicalCategoriesV2) return;

  const definitions = {
    coins: {
      title: 'Pièces eFootball',
      options: [
        { value: 'Android', label: 'Pièces eFootball Android', hint: 'Android / Google Play' },
        { value: 'iPhone', label: 'Pièces eFootball iPhone', hint: 'iPhone / iOS' }
      ]
    },
    phones: {
      title: 'Univers Gaming',
      options: [
        { value: 'PC Gaming', label: 'PC Gaming', hint: 'Ordinateurs et équipements PC' },
        { value: 'Gaming Phone', label: 'Gaming Phone', hint: 'Smartphones dédiés au jeu' },
        { value: 'Console', label: 'Console', hint: 'Consoles et accessoires console' }
      ]
    }
  };
  const selected = { coins: null, phones: null };
  let originalRender = null;
  let originalNavigate = null;
  let originalMatches = null;

  function normalize(value) {
    return String(value == null ? '' : value).trim().toLowerCase()
      .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  }
  function currentSection() {
    return String(window.activeStoreSection || document.body?.dataset.storeSection || 'home');
  }
  function productMatchesSubcategory(product, section, value) {
    const wanted = normalize(value);
    const actual = normalize(product && product.platform);
    if (actual === wanted) return true;
    // Compatibility while older Gaming Phone products are being normalized by the server.
    return section === 'phones' && wanted === 'gaming phone' &&
      normalize(product && product.category) === 'gaming phone';
  }
  function ensureStyles() {
    if (document.getElementById('sngHierarchicalCategoryStylesV2')) return;
    const style = document.createElement('style');
    style.id = 'sngHierarchicalCategoryStylesV2';
    style.textContent = [
      'body[data-store-section="coins"] #navSubcategories, body[data-store-section="phones"] #navSubcategories { display:flex!important; visibility:visible!important; opacity:1!important; position:relative!important; width:100%!important; margin:0 0 20px!important; padding:0!important; gap:10px!important; align-items:stretch!important; flex-wrap:wrap!important; }',
      '.sngStoreSubcategory { flex:1 1 0!important; min-width:145px!important; min-height:54px!important; padding:12px 15px!important; border:1px solid rgba(76,151,230,.28)!important; border-radius:16px!important; background:linear-gradient(145deg,rgba(14,28,48,.92),rgba(12,18,34,.96))!important; color:#b9c9dc!important; font:800 14px/1.15 Arial,sans-serif!important; letter-spacing:.2px!important; text-align:left!important; cursor:pointer!important; box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 8px 20px rgba(0,0,0,.12)!important; transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,color .18s ease!important; }',
      '.sngStoreSubcategory:hover { transform:translateY(-1px)!important; border-color:rgba(89,190,255,.65)!important; color:#fff!important; }',
      '.sngStoreSubcategory.is-active { color:#fff!important; border-color:rgba(89,190,255,.95)!important; background:linear-gradient(135deg,rgba(30,126,255,.42),rgba(105,58,237,.45),rgba(208,35,158,.28))!important; box-shadow:0 0 18px rgba(28,150,255,.20),inset 0 0 18px rgba(109,205,255,.07)!important; }',
      '.sngStoreSubcategory small { display:block!important; margin-top:5px!important; color:inherit!important; opacity:.72!important; font-size:11px!important; font-weight:700!important; }',
      '@media(max-width:700px){ body[data-store-section="coins"] #navSubcategories, body[data-store-section="phones"] #navSubcategories { gap:8px!important; margin-bottom:18px!important; } .sngStoreSubcategory { flex:1 1 calc(50% - 4px)!important; min-width:calc(50% - 4px)!important; min-height:50px!important; padding:11px 10px!important; font-size:13px!important; } }',
      '@media(max-width:380px){ .sngStoreSubcategory { font-size:12px!important; } .sngStoreSubcategory small { font-size:10px!important; } }'
    ].join('\\n');
    document.head.appendChild(style);
  }

  function updateSubcategories() {
    const area = document.getElementById('navSubcategories');
    if (!area) return;
    ensureStyles();
    const section = currentSection();
    const definition = definitions[section];
    if (!definition) {
      area.hidden = true;
      area.style.removeProperty('display');
      area.replaceChildren();
      return;
    }
    area.hidden = false;
    area.setAttribute('aria-label', definition.title + ' : sous-catégories');
    area.style.setProperty('display', 'flex', 'important');
    area.replaceChildren();
    definition.options.forEach(function (option) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sngStoreSubcategory' + (selected[section] === option.value ? ' is-active' : '');
      button.setAttribute('aria-pressed', selected[section] === option.value ? 'true' : 'false');
      const label = document.createElement('span');
      label.textContent = option.label;
      const hint = document.createElement('small');
      hint.textContent = option.hint;
      button.append(label, hint);
      button.addEventListener('click', function () { selectSubcategory(section, option.value); });
      area.appendChild(button);
    });
  }

  function renderWithSubcategory() {
    if (typeof originalRender !== 'function') return;
    const section = currentSection();
    const value = definitions[section] ? selected[section] : null;
    if (!value) {
      originalRender.apply(this, arguments);
      updateSubcategories();
      return;
    }
    const previousMatches = window.matchesStoreSection;
    const baseMatches = originalMatches || previousMatches;
    window.matchesStoreSection = function (product) {
      return (!baseMatches || baseMatches(product)) && productMatchesSubcategory(product, section, value);
    };
    try { originalRender.apply(this, arguments); }
    finally { window.matchesStoreSection = previousMatches; }
    updateSubcategories();
  }

  function selectSubcategory(section, value) {
    if (!definitions[section]) return;
    // Tapping the already-selected subcategory resets to the full category.
    selected[section] = selected[section] === value ? null : value;
    renderWithSubcategory();
  }

  function install() {
    ensureStyles();
    originalRender = window.render;
    originalNavigate = window.navigateStore;
    originalMatches = window.matchesStoreSection;
    if (typeof originalRender !== 'function' || typeof originalNavigate !== 'function' || typeof originalMatches !== 'function') {
      window.setTimeout(install, 50);
      return;
    }
    window.render = renderWithSubcategory;
    window.navigateStore = function (section) {
      const previousSection = currentSection();
      if (section !== previousSection && definitions[section]) selected[section] = null;
      const result = originalNavigate.apply(this, arguments);
      updateSubcategories();
      renderWithSubcategory();
      return result;
    };
    window.sngSelectStoreSubcategory = selectSubcategory;
    // Backward-compatible helper name used by the first eFootball implementation.
    window.sngSelectCoinPlatform = function (value) { return selectSubcategory('coins', value); };
    window.__sngHierarchicalCategoriesV2 = true;
    updateSubcategories();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
