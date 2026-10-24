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
      /* Premium promotion media: strict 1:1 frame, with the whole product visible. */
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
        padding: 5px !important;
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
        object-fit: contain !important;
        object-position: center !important;
        display: block !important;
        border-radius: 11px !important;
      }

      @media (max-width:560px) {
        #sngamerCampaignCarousel .campaignMedia {
          width: 78px !important;
          height: 78px !important;
          flex-basis: 78px !important;
          padding: 4px !important;
          border-radius: 14px !important;
        }
        #sngamerCampaignCarousel .campaignMedia img {
          border-radius: 10px !important;
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
          if (applyCampaign(campaign) || attempts >= 30) clearInterval(timer);
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
