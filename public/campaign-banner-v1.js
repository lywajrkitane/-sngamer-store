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
      #${BANNER_ID}{
        width:100%;
        box-sizing:border-box;
        padding:12px 16px 0;
        background:#050914;
      }
      #${BANNER_ID} .campaignBannerInner{
        width:min(1180px,100%);
        margin:0 auto;
        min-height:76px;
        display:flex;
        align-items:center;
        gap:14px;
        box-sizing:border-box;
        padding:12px 14px;
        border:1px solid rgba(96,165,250,.28);
        border-radius:18px;
        background:
          radial-gradient(circle at 0% 50%,rgba(37,99,235,.22),transparent 38%),
          linear-gradient(135deg,#0b1425,#111326 58%,#18112b);
        box-shadow:0 10px 28px rgba(0,0,0,.22);
        overflow:hidden;
      }
      #${BANNER_ID} .campaignBannerMedia{
        width:58px;
        height:58px;
        flex:0 0 58px;
        border-radius:14px;
        overflow:hidden;
        display:flex;
        align-items:center;
        justify-content:center;
        background:linear-gradient(135deg,#2563eb,#9333ea);
        border:1px solid rgba(255,255,255,.12);
        box-shadow:0 5px 16px rgba(37,99,235,.22);
      }
      #${BANNER_ID} .campaignBannerMedia img{
        width:100%;
        height:100%;
        object-fit:cover;
        display:block;
      }
      #${BANNER_ID} .campaignBannerEmoji{font-size:27px}
      #${BANNER_ID} .campaignBannerText{min-width:0;flex:1}
      #${BANNER_ID} .campaignBannerEyebrow{
        margin:0 0 3px;
        font-size:10px;
        line-height:1.2;
        font-weight:900;
        letter-spacing:1.4px;
        color:#78aefc;
        text-transform:uppercase;
      }
      #${BANNER_ID} .campaignBannerTitle{
        margin:0;
        color:#fff;
        font-size:clamp(14px,3.9vw,18px);
        line-height:1.25;
        font-weight:900;
        overflow-wrap:anywhere;
      }
      #${BANNER_ID} .campaignBannerProduct{
        margin-top:3px;
        color:#aebbd0;
        font-size:11px;
        line-height:1.25;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      #${BANNER_ID} .campaignBannerPrice{flex:0 0 auto;text-align:right}
      #${BANNER_ID} .campaignBannerOld{
        display:block;
        color:#8190a2;
        font-size:10px;
        text-decoration:line-through;
        margin-bottom:2px;
      }
      #${BANNER_ID} .campaignBannerCurrent{
        color:#fff;
        font-size:15px;
        font-weight:900;
        white-space:nowrap;
      }
      #${BANNER_ID} .campaignBannerBadge{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        margin-top:3px;
        padding:3px 7px;
        border-radius:999px;
        background:linear-gradient(135deg,#2563eb,#9333ea);
        color:#fff;
        font-size:9px;
        font-weight:900;
        letter-spacing:.3px;
      }
      @media (max-width:560px){
        #${BANNER_ID}{padding:9px 10px 0}
        #${BANNER_ID} .campaignBannerInner{
          min-height:68px;
          gap:10px;
          padding:9px 10px;
          border-radius:15px;
        }
        #${BANNER_ID} .campaignBannerMedia{
          width:48px;
          height:48px;
          flex-basis:48px;
          border-radius:12px;
        }
        #${BANNER_ID} .campaignBannerEmoji{font-size:22px}
        #${BANNER_ID} .campaignBannerEyebrow{font-size:8px;letter-spacing:1px}
        #${BANNER_ID} .campaignBannerTitle{font-size:13px}
        #${BANNER_ID} .campaignBannerProduct{font-size:10px}
        #${BANNER_ID} .campaignBannerCurrent{font-size:12px}
        #${BANNER_ID} .campaignBannerOld{font-size:9px}
        #${BANNER_ID} .campaignBannerBadge{font-size:8px}
      }
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
    const discount = regular > promo
      ? Math.round((1 - promo / regular) * 100)
      : 0;

    const campaignName =
      campaign?.campaign_name ||
      campaign?.name ||
      "OFFRE EXCLUSIVE";

    const sticker =
      campaign?.campaign_sticker ||
      campaign?.sticker ||
      product?.emoji ||
      "🔥";

    const image = getProductImage(product);

    const banner = document.createElement("section");
    banner.id = BANNER_ID;
    banner.setAttribute("aria-label", "Campagne promotionnelle active");

    const productId = Number(product.id);
    banner.innerHTML = `
      <div class="campaignBannerInner">
        <div class="campaignBannerMedia">
          ${image
            ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name || "Produit en promotion")}" loading="eager">`
            : `<span class="campaignBannerEmoji">${escapeHtml(sticker)}</span>`}
        </div>
        <div class="campaignBannerText">
          <div class="campaignBannerEyebrow">${escapeHtml(sticker)} OFFRE EXCLUSIVE</div>
          <div class="campaignBannerTitle">${escapeHtml(campaignName)}</div>
          <div class="campaignBannerProduct">${escapeHtml(product.name || "Produit en promotion")}</div>
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
      inner.style.cursor = "pointer";
      inner.addEventListener("click", function () {
        if (typeof window.openProduct === "function") window.openProduct(productId);
      });
    }
  }

  async function loadCampaignBanner() {
    try {
      const productResponse = await fetch("/api/products?campaign_banner=1", {
        cache: "no-store"
      });

      if (!productResponse.ok) return;

      const products = await productResponse.json();
      let campaign = null;

      try {
        const promoResponse = await fetch("/api/promo-media", {
          cache: "no-store"
        });

        if (promoResponse.ok) {
          const promoData = await promoResponse.json();
          if (promoData?.success && Array.isArray(promoData.promos)) {
            campaign = promoData.promos.find(function (promo) {
              return promo &&
                (promo.campaign_active === true ||
                 promo.campaign_active === "true" ||
                 promo.campaign_active === 1);
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

      buildBanner(product, campaign);

      // The new campaign banner is displayed above the main Hero.
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
