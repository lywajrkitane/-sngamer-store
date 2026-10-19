/* SNGAMER STORE — navigation, premium search + campaign hero reliability */
(function () {
  "use strict";

  /*
     PIÈCES eFOOTBALL — premium stacked-coin icon
     IMPORTANT: this icon must use exactly the same navigation container and
     active animation as Accueil / Accessoires / Gaming Phone. We only replace
     the glyph inside the existing .bottomNavIcon; we do not resize, lift,
     glow, border, or animate the navigation item itself.
  */
  function injectPremiumCoinIcon() {
    const apply = function () {
      const buttons = document.querySelectorAll('.mobileBottomNav .bottomNavItem[data-nav="coins"] .bottomNavIcon');
      if (!buttons.length) return;
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
    window.setTimeout(apply, 0);
    window.setTimeout(apply, 300);
    window.setTimeout(apply, 1000);
  }

  injectPremiumCoinIcon();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectPremiumCoinIcon, { once: true });
  }

  const STORAGE_KEY = "sg_profile_return_section";

  function installRefreshNavigation() {
    // Remove stale state left by earlier versions which forced a full page reload.
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}

    // Keep the profile panel strictly confined to the Profile section.
    // This prevents notification/profile cards from leaking into category views,
    // even if another stylesheet or observer attempts to reveal the panel.
    if (!document.getElementById("sngProfileVisibilityGuard")) {
      const style = document.createElement("style");
      style.id = "sngProfileVisibilityGuard";
      style.textContent = `
        body:not([data-store-section="profile"]) #profileArea {
          display: none !important;
          visibility: hidden !important;
        }
        body[data-store-section="profile"] #profileArea {
          display: block !important;
          visibility: visible !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

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
    [150, 500, 1200, 2500].forEach(function (delay) { window.setTimeout(ensurePremiumSearch, delay); });
  }

  function injectCampaignHeroStyles() {
    if (document.getElementById("sngamerCampaignHeroFallbackStyles")) return;
    const style = document.createElement("style");
    style.id = "sngamerCampaignHeroFallbackStyles";
    style.textContent = `
      .sngCampaignFallback{position:relative;width:100%;min-height:300px;overflow:hidden;border:1px solid rgba(74,157,255,.30);border-radius:24px;background:linear-gradient(145deg,rgba(9,20,37,.98),rgba(12,8,27,.98));box-shadow:0 24px 55px rgba(0,0,0,.28),0 0 35px rgba(22,135,255,.10);cursor:pointer}
      .sngCampaignFallback img{display:block;width:100%;height:100%;min-height:300px;object-fit:cover;opacity:.88}
      .sngCampaignFallback:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,8,18,.08) 15%,rgba(3,8,18,.34) 48%,rgba(3,8,18,.96) 100%);pointer-events:none}
      .sngCampaignFallbackInfo{position:absolute;z-index:2;left:18px;right:18px;bottom:18px;display:flex;flex-direction:column;gap:6px}
      .sngCampaignFallbackBadge{align-self:flex-start;padding:7px 11px;border:1px solid rgba(255,255,255,.20);border-radius:999px;background:rgba(10,16,29,.72);color:#8fc7ff;font-size:9px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;backdrop-filter:blur(8px)}
      .sngCampaignFallbackTitle{color:#fff;font-size:24px;line-height:1.08;font-weight:900;text-shadow:0 4px 18px rgba(0,0,0,.42)}
      .sngCampaignFallbackProduct{color:#d4deed;font-size:13px;font-weight:750}
      .sngCampaignFallbackPrice{color:#fff;font-size:15px;font-weight:900}
      .sngCampaignFallbackPrice del{color:#a4afbf;margin-right:8px;font-weight:650}
      @media(max-width:560px){.sngCampaignFallback{min-height:235px;border-radius:18px}.sngCampaignFallback img{min-height:235px}.sngCampaignFallbackInfo{left:13px;right:13px;bottom:13px}.sngCampaignFallbackTitle{font-size:19px}.sngCampaignFallbackProduct{font-size:12px}.sngCampaignFallbackPrice{font-size:13px}}
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
            ${Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price) ? `<del>${new Intl.NumberFormat("fr-FR").format(Number(product.price))} FCFA</del>${new Intl.NumberFormat("fr-FR").format(Number(product.promo_price))} FCFA` : `${new Intl.NumberFormat("fr-FR").format(Number(product.price) || 0)} FCFA`}
          </span>
        </div>
      </article>`;
    const card = carousel.querySelector(".sngCampaignFallback");
    if (card && typeof window.openProduct === "function") {
      card.addEventListener("click", function () { window.openProduct(Number(product.id)); });
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); window.openProduct(Number(product.id)); }
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
      const validMedia = Array.isArray(media) ? media.filter(function (item) { return item && item.url && item.campaign_id && item.campaign_active !== false; }) : [];
      const carousel = document.getElementById("promoCarousel");
      if (validMedia.length && carousel && carousel.children.length) return;
      const productsResponse = await fetch("/api/products", { cache: "no-store" });
      if (!productsResponse.ok) return;
      const products = await productsResponse.json();
      if (!Array.isArray(products)) return;
      const campaignProduct = products.find(function (product) {
        return product && product.campaign_id && Boolean(product.promo_active) && Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price) && product.image1_url;
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
  [500, 1200, 2200, 3500].forEach(function (delay) { window.setTimeout(ensureCampaignHero, delay); });
})();
