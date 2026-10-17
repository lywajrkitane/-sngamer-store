(function () {
  "use strict";

  const FALLBACK_NAMES = new Set([
    "offre exclusive",
    "offre",
    "exclusive"
  ]);

  // Campagne actuellement activée dans le tableau de bord.
  // Elle sert uniquement de dernier secours si l'API publique ne renvoie
  // pas encore campaign_name sur le produit promotionnel.
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

    // Le produit promotionnel peut exister avant que son campaign_id soit
    // correctement associé côté API publique. Dans ce cas, utilise le nom
    // de la campagne actuellement active au lieu d'afficher le placeholder.
    const hasActivePromo = productRows.some((row) =>
      row &&
      (row.promo_active === true || row.promo_active === "true" || row.promo_active === 1 || row.promo_active === "1") &&
      Number(row.promo_price || 0) > 0 &&
      Number(row.promo_price || 0) < Number(row.price || 0)
    );

    if (hasActivePromo) {
      return {
        name: CURRENT_CAMPAIGN_FALLBACK,
        left: "",
        right: ""
      };
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

    // On conserve le libellé visuel existant « OFFRE EXCLUSIVE ».
    // Seul le nom de la campagne doit remplacer le placeholder « Offre exclusive ».

    return true;
  }

  async function loadCampaignName() {
    try {
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
    loadCampaignName();
    window.addEventListener("load", loadCampaignName, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
