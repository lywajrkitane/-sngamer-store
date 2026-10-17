(function () {
  "use strict";

  const BANNER_ID = "sngamerActiveCampaignBanner";
  const STYLE_ID = "sngamerActiveCampaignBannerStyles";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[char];
    });
  }

  function money(value) {
    return new Intl.NumberFormat("fr-FR").format(Number(value || 0)) + " FCFA";
  }

  function isValidPromo(product) {
    const regular = Number(product?.price || 0);
    const promo = Number(product?.promo_price || 0);
    return Boolean(product?.promo_active) && promo > 0 && promo < regular;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${BANNER_ID}{width:100%;box-sizing:border-box;padding:12px 16px 0;background:#050914}
      #${BANNER_ID} .campaignBannerInner{width:min(1180px,100%);margin:0 auto;min-height:76px;display:flex;align-items:center;gap:14px;box-sizing:border-box;padding:12px 14px;border:1px solid rgba(96,165,250,.28);border-radius:18px;background:radial-gradient(circle at 0% 50%,rgba(37,99,235,.22),transparent 38%),linear-gradient(135deg,#0b1425,#111326 58%,#18112b);box-shadow:0 10px 28px rgba(0,0,0,.22);overflow:hidden;cursor:pointer;transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}
      #${BANNER_ID} .campaignBannerInner.campaignBannerClicked{border-color:rgba(96,165,250,.95);box-shadow:0 0 0 2px rgba(96,165,250,.18),0 0 18px rgba(59,130,246,.48),0 0 34px rgba(147,51,234,.22),0 10px 28px rgba(0,0,0,.22);transform:translateY(-1px)}
      #${BANNER_ID} .campaignBannerMedia{width:58px;height:58px;flex:0 0 58px;border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2563eb,#9333ea);border:1px solid rgba(255,255,255,.12);box-shadow:0 5px 16px rgba(37,99,235,.22)}
      #${BANNER_ID} .campaignBannerMedia img{width:100%;height:100%;object-fit:cover;display:block}
      #${BANNER_ID} .campaignBannerEmoji{font-size:27px}
      #${BANNER_ID} .campaignBannerText{min-width:0;flex:1}
      #${BANNER_ID} .campaignBannerEyebrow{margin:0 0 3px;font-size:10px;line-height:1.2;font-weight:900;letter-spacing:1.2px;color:#78aefc;text-transform:uppercase;overflow-wrap:anywhere}
      #${BANNER_ID} .campaignBannerTitle{margin:0;color:#fff;font-size:clamp(14px,3.9vw,18px);line-height:1.25;font-weight:900;overflow-wrap:anywhere}
      #${BANNER_ID} .campaignBannerProduct{margin-top:3px;color:#aebbd0;font-size:11px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #${BANNER_ID} .campaignBannerPrice{flex:0 0 auto;text-align:right}
      #${BANNER_ID} .campaignBannerOld{display:block;color:#8190a2;font-size:10px;text-decoration:line-through;margin-bottom:2px}
      #${BANNER_ID} .campaignBannerCurrent{color:#fff;font-size:15px;font-weight:900;white-space:nowrap}
      #${BANNER_ID} .campaignBannerBadge{display:inline-flex;align-items:center;justify-content:center;margin-top:3px;padding:3px 8px;border-radius:999px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:9px;font-weight:900;letter-spacing:.3px;box-shadow:0 3px 10px rgba(239,68,68,.25)}
      @media (max-width:560px){#${BANNER_ID}{padding:9px 10px 0}#${BANNER_ID} .campaignBannerInner{min-height:68px;gap:10px;padding:9px 10px;border-radius:15px}#${BANNER_ID} .campaignBannerMedia{width:48px;height:48px;flex-basis:48px;border-radius:12px}#${BANNER_ID} .campaignBannerEmoji{font-size:22px}#${BANNER_ID} .campaignBannerEyebrow{font-size:8px;letter-spacing:.8px}#${BANNER_ID} .campaignBannerTitle{font-size:13px}#${BANNER_ID} .campaignBannerProduct{font-size:10px}#${BANNER_ID} .campaignBannerCurrent{font-size:12px}#${BANNER_ID} .campaignBannerOld{font-size:9px}#${BANNER_ID} .campaignBannerBadge{font-size:8px;padding:3px 7px}}
    `;
    document.head.appendChild(style);
  }

  function getFirstValidProduct(products) {
    return (Array.isArray(products) ? products : []).find(isValidPromo) || null;
  }

  function getProductImage(product) {
    return product?.main_image_url || product?.image1_url || product?.image2_url || product?.image3_url || "";
  }

  function buildBanner(product, campaign) {
    const existing = document.getElementById(BANNER_ID);
    if (existing) existing.remove();

    const regular = Number(product.price || 0);
    const promo = Number(product.promo_price || 0);
    const discount = regular > promo ? Math.round((1 - promo / regular) * 100) : 0;

    // Priority: campaign attached to the product, then promo-media campaign.
    const campaignName =
      product?.campaign_name ||
      campaign?.campaign_name ||
      campaign?.name ||
      "PROMOTION";

    const leftSticker =
      product?.campaign_sticker ||
      campaign?.campaign_sticker ||
      campaign?.sticker ||
      "🔥";

    const rightSticker =
      product?.campaign_right_sticker ||
      campaign?.campaign_right_sticker ||
      campaign?.right_sticker ||
      "";

    const image = getProductImage(product);

    const banner = document.createElement("section");
    banner.id = BANNER_ID;
    banner.setAttribute("aria-label", "Campagne promotionnelle active");

    const productId = Number(product.id);
    const campaignLabel = [leftSticker, campaignName, rightSticker].filter(Boolean).join(" ");

    banner.innerHTML = `
      <div class="campaignBannerInner" role="button" tabindex="0">
        <div class="campaignBannerMedia">
          ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name || "Produit en promotion")}" loading="eager">` : `<span class="campaignBannerEmoji">${escapeHtml(leftSticker)}</span>`}
        </div>
        <div class="campaignBannerText">
          <div class="campaignBannerEyebrow">${escapeHtml(campaignLabel)}</div>
          <div class="campaignBannerTitle">${escapeHtml(product.name || "Produit en promotion")}</div>
          <div class="campaignBannerProduct">Offre promotionnelle</div>
        </div>
        <div class="campaignBannerPrice">
          <span class="campaignBannerOld">${escapeHtml(money(regular))}</span>
          <strong class="campaignBannerCurrent">${escapeHtml(money(promo))}</strong>
          ${discount > 0 ? `<span class="campaignBannerBadge">-${discount}%</span>` : ""}
        </div>
      </div>
    `;

    const hero = document.querySelector(".hero");
    if (hero?.parentNode) hero.parentNode.insertBefore(banner, hero);

    const inner = banner.querySelector(".campaignBannerInner");
    if (inner && Number.isInteger(productId) && productId > 0) {
      const openPromoProduct = function () {
        inner.classList.add("campaignBannerClicked");
        window.setTimeout(function () {
          if (typeof window.openProduct === "function") window.openProduct(productId);
        }, 140);
      };

      inner.addEventListener("click", openPromoProduct);
      inner.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPromoProduct();
        }
      });
    }
  }

  async function loadCampaignBanner() {
    try {
      const productResponse = await fetch("/api/products?campaign_banner=1", { cache: "no-store" });
      if (!productResponse.ok) return;

      const products = await productResponse.json();
      let campaign = null;

      try {
        const promoResponse = await fetch("/api/promo-media", { cache: "no-store" });
        if (promoResponse.ok) {
          const promoData = await promoResponse.json();
          if (promoData?.success && Array.isArray(promoData.promos)) {
            campaign = promoData.promos.find(function (promo) {
              return promo && (promo.campaign_active === true || promo.campaign_active === "true" || promo.campaign_active === 1);
            }) || null;
          }
        }
      } catch (_) {}

      const fallbackProduct = campaign?.product_id
        ? (Array.isArray(products) ? products.find(function (p) {
            return Number(p.id) === Number(campaign.product_id) && isValidPromo(p);
          }) : null)
        : null;

      const product = fallbackProduct || getFirstValidProduct(products);

      if (!product) {
        document.getElementById(BANNER_ID)?.remove();
        return;
      }

      // If the product itself has an active campaign, use its campaign metadata.
      // This keeps the campaign name visible even when promo-media has no matching row.
      const productCampaign = product?.campaign_name ? {
        campaign_name: product.campaign_name,
        campaign_sticker: product.campaign_sticker,
        campaign_right_sticker: product.campaign_right_sticker,
        campaign_active: product.campaign_active
      } : null;

      buildBanner(product, productCampaign || campaign);

      const legacyTitle = document.getElementById("promoCampaignTitle");
      if (legacyTitle) legacyTitle.remove();
    } catch (error) {
      console.error("ACTIVE_CAMPAIGN_BANNER_ERROR", error);
    }
  }

  function start() {
    injectStyles();
    loadCampaignBanner();
    window.addEventListener("load", loadCampaignBanner, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
