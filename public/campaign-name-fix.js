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
    const STYLE_ID = "sngamer-campaign-overflow-fix-v1";
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Keep the campaign card self-contained when product names are long. */
      #sngamerCampaignCarousel .campaignCard {
        overflow: hidden !important;
        min-width: 0 !important;
      }
      #sngamerCampaignCarousel .campaignCopy {
        min-width: 0 !important;
        width: 0 !important;
        flex: 1 1 0% !important;
        overflow: hidden !important;
      }
      #sngamerCampaignCarousel .campaignTitle,
      #sngamerCampaignCarousel .campaignProduct {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        overflow: hidden !important;
        white-space: nowrap !important;
        text-overflow: ellipsis !important;
      }
      #sngamerCampaignCarousel .campaignPrice {
        flex: 0 0 auto !important;
        min-width: max-content !important;
        max-width: none !important;
        white-space: nowrap !important;
      }
      #sngamerCampaignCarousel .campaignMedia {
        flex: 0 0 58px !important;
      }
      @media (max-width:560px) {
        #sngamerCampaignCarousel .campaignMedia {
          flex-basis: 48px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async function loadCampaignName() {
    try {
      installCampaignOverflowFix();

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
          if (applyCampaign(campaign) || attempts >= 30) {
            clearInterval(timer);
          }
        }, 200);
      }
    } catch (error) {
      console.error("CAMPAIGN_NAME_FIX_ERROR", error);
    }
  }

  function start() {
    installCampaignOverflowFix();
    loadCampaignName();
    window.addEventListener("load", loadCampaignName, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  const categoryPatch = document.createElement("script");
  categoryPatch.src = "/category-consistency-v1.js?v=20261017-1810";
  categoryPatch.defer = true;
  document.head.appendChild(categoryPatch);

  const cartToastPatch = document.createElement("script");
  cartToastPatch.src = "/cart-toast-v1.js?v=20261020-1";
  cartToastPatch.defer = true;
  document.head.appendChild(cartToastPatch);
})();
