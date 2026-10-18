/* SNGAMER STORE — navigation, premium search + campaign hero reliability */
(function () {
  "use strict";

  /*
     PIÈCES eFOOTBALL — premium coin stack
     Keep the existing navigation behavior untouched and only replace the
     current coin glyph with a stacked-coin mark whose face contains €.
  */
  function injectPremiumCoinIcon() {
    if (document.getElementById("sngamerPremiumCoinIconStyles")) return;
    const style = document.createElement("style");
    style.id = "sngamerPremiumCoinIconStyles";
    style.textContent = `
      .mobileBottomNav .bottomNavItem[data-nav="coins"] .bottomNavIcon{
        position:relative !important;
        display:grid !important;
        place-items:center !important;
        width:48px !important;
        height:48px !important;
        color:#fff !important;
        overflow:visible !important;
      }

      .mobileBottomNav .bottomNavItem[data-nav="coins"] .bottomNavIcon svg{
        display:none !important;
      }

      .mobileBottomNav .bottomNavItem[data-nav="coins"] .bottomNavIcon::after{
        content:"" !important;
        position:absolute !important;
        left:50% !important;
        top:50% !important;
        width:31px !important;
        height:17px !important;
        transform:translate(-50%, 9px) !important;
        border:3px solid currentColor !important;
        border-radius:50% !important;
        box-sizing:border-box !important;
        opacity:.92 !important;
        box-shadow:
          0 5px 0 -1px rgba(255,255,255,.42),
          0 9px 0 -2px rgba(255,255,255,.24) !important;
        z-index:0 !important;
        pointer-events:none !important;
      }

      .mobileBottomNav .bottomNavItem[data-nav="coins"] .bottomNavIcon::before{
        content:"€" !important;
        position:absolute !important;
        left:50% !important;
        top:50% !important;
        width:31px !important;
        height:31px !important;
        transform:translate(-50%, -57%) !important;
        display:grid !important;
        place-items:center !important;
        border:3px solid currentColor !important;
        border-radius:50% !important;
        box-sizing:border-box !important;
        color:currentColor !important;
        background:radial-gradient(circle at 38% 30%, rgba(255,255,255,.18), rgba(255,255,255,.03) 58%, rgba(0,0,0,.12)) !important;
        font-family:Inter,Arial,sans-serif !important;
        font-size:17px !important;
        font-weight:900 !important;
        line-height:1 !important;
        text-shadow:0 0 8px rgba(255,255,255,.22) !important;
        box-shadow:0 0 12px rgba(82,169,255,.18) !important;
        z-index:1 !important;
        pointer-events:none !important;
      }
    `;
    document.head.appendChild(style);
  }

  injectPremiumCoinIcon();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectPremiumCoinIcon, { once: true });
  }

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
      window.setTimeout(function () { originalNavigateStore(pendingSection); }, 0);
    } else if (pendingSection) sessionStorage.removeItem(STORAGE_KEY);
  }

  /*
     SEARCH PREMIUM
     The premium search is intentionally loaded independently and retried.
     This prevents a slow/mobile cache from leaving the old full-width input visible.
  */
  function loadPremiumSearch() {
    const ensurePremiumSearch = function () {
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

    ensurePremiumSearch();
    [150, 500, 1200, 2500].forEach(function (delay) {
      window.setTimeout(ensurePremiumSearch, delay);
    });
  }

  /*
     CAMPAIGN HERO RELIABILITY
     A campaign can be active on a product even when no promo_media slot was
     rendered by the hero layer. In that case the campaign product image is
     used as a safe premium fallback, so activating a campaign in the admin
     can never leave an empty hero on mobile.
  */
  function injectCampaignHeroStyles() {
    if (document.getElementById("sngamerCampaignHeroFallbackStyles")) return;

    const style = document.createElement("style");
    style.id = "sngamerCampaignHeroFallbackStyles";
    style.textContent = `
      .sngCampaignFallback{
        position:relative;
        width:100%;
        min-height:300px;
        overflow:hidden;
        border:1px solid rgba(74,157,255,.30);
        border-radius:24px;
        background:linear-gradient(145deg,rgba(9,20,37,.98),rgba(12,8,27,.98));
        box-shadow:0 24px 55px rgba(0,0,0,.28),0 0 35px rgba(22,135,255,.10);
        cursor:pointer;
      }
      .sngCampaignFallback img{
        display:block;
        width:100%;
        height:100%;
        min-height:300px;
        object-fit:cover;
        opacity:.88;
      }
      .sngCampaignFallback:after{
        content:"";
        position:absolute;
        inset:0;
        background:linear-gradient(180deg,rgba(3,8,18,.08) 15%,rgba(3,8,18,.34) 48%,rgba(3,8,18,.96) 100%);
        pointer-events:none;
      }
      .sngCampaignFallbackInfo{
        position:absolute;
        z-index:2;
        left:18px;
        right:18px;
        bottom:18px;
        display:flex;
        flex-direction:column;
        gap:6px;
      }
      .sngCampaignFallbackBadge{
        align-self:flex-start;
        padding:7px 11px;
        border:1px solid rgba(255,255,255,.20);
        border-radius:999px;
        background:rgba(10,16,29,.72);
        color:#8fc7ff;
        font-size:9px;
        font-weight:900;
        letter-spacing:1.4px;
        text-transform:uppercase;
        backdrop-filter:blur(8px);
      }
      .sngCampaignFallbackTitle{
        color:#fff;
        font-size:24px;
        line-height:1.08;
        font-weight:900;
        text-shadow:0 4px 18px rgba(0,0,0,.42);
      }
      .sngCampaignFallbackProduct{
        color:#d4deed;
        font-size:13px;
        font-weight:750;
      }
      .sngCampaignFallbackPrice{
        color:#fff;
        font-size:15px;
        font-weight:900;
      }
      .sngCampaignFallbackPrice del{
        color:#a4afbf;
        margin-right:8px;
        font-weight:650;
      }
      @media(max-width:560px){
        .sngCampaignFallback{min-height:235px;border-radius:18px}
        .sngCampaignFallback img{min-height:235px}
        .sngCampaignFallbackInfo{left:13px;right:13px;bottom:13px}
        .sngCampaignFallbackTitle{font-size:19px}
        .sngCampaignFallbackProduct{font-size:12px}
        .sngCampaignFallbackPrice{font-size:13px}
      }
    `;
    document.head.appendChild(style);
  }

  function renderCampaignProductFallback(product) {
    const area = document.getElementById("promoArea");
    const carousel = document.getElementById("promoCarousel");
    const dots = document.getElementById("promoDots");
    const fallback = document.getElementById("defaultHeroContent");
    if (!area || !carousel || !product || !product.image1_url) return false;

    injectCampaignHeroStyles();

    carousel.innerHTML = `
      <article class="sngCampaignFallback" role="button" tabindex="0" aria-label="Voir ${String(product.name || "la promotion").replace(/[<>]/g, "")}">
        <img src="${String(product.image1_url).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}" alt="${String(product.name || "Promotion SNGAMER").replace(/[<>]/g, "")}">
        <div class="sngCampaignFallbackInfo">
          <span class="sngCampaignFallbackBadge">${String(product.campaign_name || "OFFRE PROMOTIONNELLE").replace(/[<>]/g, "")}</span>
          <strong class="sngCampaignFallbackTitle">${String(product.campaign_name || "Offre du moment").replace(/[<>]/g, "")}</strong>
          <span class="sngCampaignFallbackProduct">${String(product.name || "Produit en promotion").replace(/[<>]/g, "")}</span>
          <span class="sngCampaignFallbackPrice">
            ${Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price)
              ? `<del>${new Intl.NumberFormat("fr-FR").format(Number(product.price))} FCFA</del>${new Intl.NumberFormat("fr-FR").format(Number(product.promo_price))} FCFA`
              : `${new Intl.NumberFormat("fr-FR").format(Number(product.price) || 0)} FCFA`}
          </span>
        </div>
      </article>
    `;

    const card = carousel.querySelector(".sngCampaignFallback");
    if (card && typeof window.openProduct === "function") {
      card.addEventListener("click", function () {
        window.openProduct(Number(product.id));
      });
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          window.openProduct(Number(product.id));
        }
      });
    }

    if (dots) dots.innerHTML = "";
    if (fallback) fallback.style.display = "none";
    area.classList.remove("has-no-promo");
    area.classList.add("has-active-promo");
    area.style.display = "block";
    return true;
  }

  async function ensureCampaignHero() {
    try {
      const mediaResponse = await fetch("/api/promo-media", { cache: "no-store" });
      const media = mediaResponse.ok ? await mediaResponse.json() : [];
      const validMedia = Array.isArray(media)
        ? media.filter(function (item) {
            return item && item.url && item.campaign_id && item.campaign_active !== false;
          })
        : [];

      const carousel = document.getElementById("promoCarousel");
      if (validMedia.length && carousel && carousel.children.length) return;

      const productsResponse = await fetch("/api/products", { cache: "no-store" });
      if (!productsResponse.ok) return;
      const products = await productsResponse.json();
      if (!Array.isArray(products)) return;

      const campaignProduct = products.find(function (product) {
        return product &&
          product.campaign_id &&
          Boolean(product.promo_active) &&
          Number(product.promo_price) > 0 &&
          Number(product.promo_price) < Number(product.price) &&
          product.image1_url;
      });

      if (campaignProduct) renderCampaignProductFallback(campaignProduct);
    } catch (error) {
      console.warn("SNGAMER_CAMPAIGN_HERO_FALLBACK", error);
    }
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installRefreshNavigation, { once: true });
  } else installRefreshNavigation();

  loadPremiumSearch();
  loadCompactOrders();
  loadAdminWorkspace();

  /* Wait for the product API to populate, then verify the hero. */
  [500, 1200, 2200, 3500].forEach(function (delay) {
    window.setTimeout(ensureCampaignHero, delay);
  });
})();
