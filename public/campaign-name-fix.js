(function () {
  "use strict";

  const FALLBACK_NAMES = new Set([
    "offre exclusive",
    "offre",
    "exclusive"
  ]);

  const CURRENT_CAMPAIGN_FALLBACK = "Black Friday";

  function clean(value) {
    return String(value ?? "").trim();
  }

  function isRealCampaignName(value) {
    const name = clean(value);
    return Boolean(name) && !FALLBACK_NAMES.has(name.toLowerCase());
  }

  function campaignFromRows(products, promos) {
    const promoRows = Array.isArray(promos) ? promos : [];
    const productRows = Array.isArray(products) ? products : [];

    const promoCampaign = promoRows.find((row) =>
      row && isRealCampaignName(row.campaign_name)
    );

    if (promoCampaign) {
      return {
        name: clean(promoCampaign.campaign_name),
        left: clean(promoCampaign.campaign_sticker),
        right: clean(promoCampaign.campaign_right_sticker)
      };
    }

    const productCampaign = productRows.find((row) =>
      row && isRealCampaignName(row.campaign_name)
    );

    if (productCampaign) {
      return {
        name: clean(productCampaign.campaign_name),
        left: clean(productCampaign.campaign_sticker),
        right: clean(productCampaign.campaign_right_sticker)
      };
    }

    const hasActivePromo = productRows.some((row) =>
      row &&
      (row.promo_active === true || row.promo_active === "true" || row.promo_active === 1 || row.promo_active === "1") &&
      Number(row.promo_price || 0) > 0 &&
      Number(row.promo_price || 0) < Number(row.price || 0)
    );

    if (hasActivePromo) {
      return { name: CURRENT_CAMPAIGN_FALLBACK, left: "", right: "" };
    }

    return null;
  }

  function applyCampaign(campaign) {
    if (!campaign || !isRealCampaignName(campaign.name)) return false;

    const titleNodes = document.querySelectorAll(
      "#sngamerCampaignCarousel .campaignTitle"
    );

    if (!titleNodes.length) return false;

    const display = [campaign.left, campaign.name, campaign.right]
      .filter(Boolean)
      .join(" ");

    titleNodes.forEach((node) => {
      node.textContent = display || campaign.name;
    });

    return true;
  }

  function installCampaignOverflowFix() {
    const STYLE_ID = "sngamer-campaign-overflow-fix-v2-square";
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Premium promotion media: strict square 1:1 frame, filled edge-to-edge by the product image. */
      #sngamerCampaignCarousel .campaignCard { overflow: hidden !important; min-width: 0 !important; }
      #sngamerCampaignCarousel .campaignCopy { min-width: 0 !important; width: 0 !important; flex: 1 1 0% !important; overflow: hidden !important; }
      #sngamerCampaignCarousel .campaignTitle,
      #sngamerCampaignCarousel .campaignProduct { display: block !important; width: 100% !important; max-width: 100% !important; min-width: 0 !important; overflow: hidden !important; white-space: nowrap !important; text-overflow: ellipsis !important; }
      #sngamerCampaignCarousel .campaignPrice { flex: 0 0 auto !important; min-width: max-content !important; max-width: none !important; white-space: nowrap !important; }

      /* The product image area is always square (1:1), never stretched. */
      #sngamerCampaignCarousel .campaignMedia {
        width: 88px !important;
        height: 88px !important;
        aspect-ratio: 1 / 1 !important;
        flex: 0 0 88px !important;
        padding: 0 !important;
        border-radius: 16px !important;
        overflow: hidden !important;
        display: grid !important;
        place-items: center !important;
        background: linear-gradient(145deg, #101b2c, #080d16) !important;
        border: 1px solid rgba(87,174,255,.30) !important;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.035), 0 8px 20px rgba(0,0,0,.20) !important;
      }

      #sngamerCampaignCarousel .campaignMedia img {
        width: 100% !important;
        height: 100% !important;
        aspect-ratio: 1 / 1 !important;
        object-fit: cover !important;
        object-position: center !important;
        display: block !important;
        border-radius: inherit !important;
      }

      @media (max-width:560px) {
        #sngamerCampaignCarousel .campaignMedia {
          width: 78px !important;
          height: 78px !important;
          flex-basis: 78px !important;
          padding: 0 !important;
          border-radius: 14px !important;
        }
        #sngamerCampaignCarousel .campaignMedia img {
          border-radius: inherit !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function installCampaignFrameSymbols() {
    const STYLE_ID = "sngamer-campaign-frame-symbols-v1";
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Premium campaign frame: reuse the subtle controller-symbol animation from product cards. */
      #sngamerCampaignCarousel .campaignCard {
        position: relative !important;
        isolation: isolate !important;
        overflow: hidden !important;
      }

      /* Remove the previous travelling-light treatment completely. */
      #sngamerCampaignCarousel .campaignCard::before {
        content: none !important;
        display: none !important;
        animation: none !important;
        filter: none !important;
        box-shadow: none !important;
      }

      #sngamerCampaignCarousel .campaignCard::after {
        content: "△  ○  ×  □";
        position: absolute !important;
        z-index: 4 !important;
        left: 10px !important;
        top: 7px !important;
        color: rgba(104,178,255,.52) !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 9px !important;
        font-weight: 700 !important;
        letter-spacing: 3px !important;
        line-height: 1 !important;
        text-shadow: 0 0 7px rgba(49,148,255,.30) !important;
        opacity: .38 !important;
        pointer-events: none !important;
        white-space: nowrap !important;
        animation: sngCampaignControllerSymbols 7s ease-in-out infinite !important;
        transform: translate3d(0,0,0) !important;
      }

      #sngamerCampaignCarousel .campaignCard > * {
        position: relative;
        z-index: 1;
      }

      @keyframes sngCampaignControllerSymbols {
        0%, 100% { transform: translate3d(0,0,0); opacity: .12; }
        18% { transform: translate3d(20px,0,0); opacity: .40; }
        40% { transform: translate3d(58px,0,0); opacity: .24; }
        60% { transform: translate3d(92px,0,0); opacity: .42; }
        78% { transform: translate3d(126px,0,0); opacity: .16; }
      }

      @media (prefers-reduced-motion: reduce) {
        #sngamerCampaignCarousel .campaignCard::after {
          animation: none !important;
          opacity: .20 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async function loadCampaignName() {
    try {
      installCampaignOverflowFix();
      installCampaignFrameSymbols();
      const [productsResponse, promosResponse] = await Promise.all([
        fetch("/api/products?campaign_banner=1", { cache: "no-store" }),
        fetch("/api/promo-media", { cache: "no-store" })
      ]);
      const products = productsResponse.ok ? await productsResponse.json() : [];
      const promos = promosResponse.ok ? await promosResponse.json() : [];
      const campaign = campaignFromRows(products, promos);
      if (!campaign) return;
      if (!applyCampaign(campaign)) {
        let attempts = 0;
        const timer = setInterval(() => {
          attempts += 1;
          installCampaignOverflowFix();
          installCampaignFrameSymbols();
          if (applyCampaign(campaign) || attempts >= 30) clearInterval(timer);
        }, 200);
      }
    } catch (error) {
      console.error("CAMPAIGN_NAME_FIX_ERROR", error);
    }
  }

  function start() {
    installCampaignOverflowFix();
    installCampaignFrameSymbols();
    loadCampaignName();
    window.addEventListener("load", loadCampaignName, { once: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  const categoryPatch = document.createElement("script");
  categoryPatch.src = "/category-consistency-v1.js?v=20261022-univers1";
  categoryPatch.defer = true;
  document.head.appendChild(categoryPatch);

  const cartToastPatch = document.createElement("script");
  cartToastPatch.src = "/cart-toast-v1.js?v=20261020-1";
  cartToastPatch.defer = true;
  document.head.appendChild(cartToastPatch);

  const productPolishPatch = document.createElement("script");
  productPolishPatch.src = "/product-detail-polish-v2.js?v=20261023-productdetail3";
  productPolishPatch.defer = true;
  document.head.appendChild(productPolishPatch);
})();
