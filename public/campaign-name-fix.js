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
    const STYLE_ID = "sngamer-campaign-frame-symbols-v2";

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        /* Remove every remnant of the old travelling-light animation. */
        #sngamerCampaignCarousel .campaignCard::before,
        #sngamerCampaignCarousel .campaignCard::after {
          content: none !important;
          display: none !important;
          animation: none !important;
          filter: none !important;
          box-shadow: none !important;
          background: none !important;
        }

        #sngamerCampaignCarousel .campaignCard {
          position: relative !important;
          isolation: isolate !important;
          overflow: hidden !important;
        }

        /* Four independent PlayStation-style symbols travel across the card. */
        #sngamerCampaignCarousel .sngPromoControllerSymbols {
          position: absolute !important;
          inset: 0 !important;
          z-index: 8 !important;
          overflow: hidden !important;
          border-radius: inherit !important;
          pointer-events: none !important;
          user-select: none !important;
        }

        #sngamerCampaignCarousel .sngPromoSymbol {
          position: absolute !important;
          display: block !important;
          z-index: 1 !important;
          width: 22px !important;
          height: 22px !important;
          margin: 0 !important;
          padding: 0 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 19px !important;
          font-weight: 800 !important;
          line-height: 22px !important;
          text-align: center !important;
          pointer-events: none !important;
          opacity: 0 !important;
          will-change: left, top, transform, opacity;
          text-shadow: 0 0 7px currentColor, 0 0 14px currentColor !important;
        }

        /* Triangle: green, travelling diagonally from upper-left to upper-right. */
        #sngamerCampaignCarousel .sngPromoTriangle {
          color: #00df76 !important;
          animation: sngPromoTriangleTravel 7.8s ease-in-out infinite !important;
        }

        /* Circle: red, following its own curved-looking path from right to left. */
        #sngamerCampaignCarousel .sngPromoCircle {
          color: #ff4d62 !important;
          animation: sngPromoCircleTravel 8.1s ease-in-out infinite 1.1s !important;
        }

        /* Cross: blue, travelling through the lower half of the panel. */
        #sngamerCampaignCarousel .sngPromoCross {
          color: #42a5ff !important;
          animation: sngPromoCrossTravel 7.5s ease-in-out infinite 2s !important;
        }

        /* Square: pink, travelling on a separate diagonal route. */
        #sngamerCampaignCarousel .sngPromoSquare {
          color: #ff5bc8 !important;
          animation: sngPromoSquareTravel 8.4s ease-in-out infinite 2.9s !important;
        }

        @keyframes sngPromoTriangleTravel {
          0%, 100% { left: 5%; top: 10%; opacity: 0; transform: scale(.68) rotate(-12deg); }
          12% { opacity: .76; }
          32% { left: 23%; top: 36%; opacity: .56; transform: scale(1) rotate(5deg); }
          54% { left: 43%; top: 17%; opacity: .68; transform: scale(.92) rotate(14deg); }
          76% { left: 67%; top: 43%; opacity: .34; transform: scale(.78) rotate(24deg); }
          88% { left: 82%; top: 18%; opacity: 0; transform: scale(.65) rotate(30deg); }
        }

        @keyframes sngPromoCircleTravel {
          0%, 100% { left: 82%; top: 12%; opacity: 0; transform: scale(.72); }
          13% { opacity: .72; }
          34% { left: 68%; top: 55%; opacity: .48; transform: scale(1.02); }
          53% { left: 49%; top: 28%; opacity: .68; transform: scale(.9); }
          74% { left: 28%; top: 62%; opacity: .36; transform: scale(.78); }
          87% { left: 12%; top: 35%; opacity: 0; transform: scale(.68); }
        }

        @keyframes sngPromoCrossTravel {
          0%, 100% { left: 9%; top: 68%; opacity: 0; transform: scale(.7) rotate(-15deg); }
          14% { opacity: .76; }
          33% { left: 28%; top: 48%; opacity: .50; transform: scale(1.04) rotate(4deg); }
          52% { left: 48%; top: 70%; opacity: .68; transform: scale(.92) rotate(17deg); }
          74% { left: 67%; top: 42%; opacity: .36; transform: scale(.8) rotate(28deg); }
          88% { left: 83%; top: 63%; opacity: 0; transform: scale(.66) rotate(35deg); }
        }

        @keyframes sngPromoSquareTravel {
          0%, 100% { left: 82%; top: 69%; opacity: 0; transform: scale(.7) rotate(10deg); }
          14% { opacity: .74; }
          34% { left: 64%; top: 45%; opacity: .48; transform: scale(1.02) rotate(-4deg); }
          53% { left: 45%; top: 17%; opacity: .68; transform: scale(.9) rotate(-14deg); }
          75% { left: 24%; top: 46%; opacity: .36; transform: scale(.78) rotate(-24deg); }
          88% { left: 8%; top: 20%; opacity: 0; transform: scale(.66) rotate(-32deg); }
        }

        @media (max-width: 560px) {
          #sngamerCampaignCarousel .sngPromoSymbol {
            width: 20px !important;
            height: 20px !important;
            font-size: 17px !important;
            line-height: 20px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          #sngamerCampaignCarousel .sngPromoSymbol {
            animation: none !important;
            opacity: .24 !important;
          }
          #sngamerCampaignCarousel .sngPromoTriangle { left: 7% !important; top: 12% !important; }
          #sngamerCampaignCarousel .sngPromoCircle { left: 82% !important; top: 18% !important; }
          #sngamerCampaignCarousel .sngPromoCross { left: 25% !important; top: 70% !important; }
          #sngamerCampaignCarousel .sngPromoSquare { left: 70% !important; top: 65% !important; }
        }
      `;
      document.head.appendChild(style);
    }

    function attachSymbols() {
      const carousel = document.getElementById("sngamerCampaignCarousel");
      if (!carousel) return;
      carousel.querySelectorAll(".campaignCard").forEach((card) => {
        if (card.querySelector(".sngPromoControllerSymbols")) return;
        const layer = document.createElement("div");
        layer.className = "sngPromoControllerSymbols";
        layer.setAttribute("aria-hidden", "true");
        layer.innerHTML = `
          <span class="sngPromoSymbol sngPromoTriangle">△</span>
          <span class="sngPromoSymbol sngPromoCircle">○</span>
          <span class="sngPromoSymbol sngPromoCross">×</span>
          <span class="sngPromoSymbol sngPromoSquare">□</span>
        `;
        card.appendChild(layer);
      });
    }

    attachSymbols();

    if (!window.__sngCampaignSymbolObserver) {
      const observer = new MutationObserver(() => attachSymbols());
      observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
      });
      window.__sngCampaignSymbolObserver = observer;
    }
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
