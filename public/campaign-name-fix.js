(function () {
  "use strict";

  const STYLE_ID = "sngamer-promo-controller-motion-v3";
  const SYMBOL_HOST_CLASS = "sngPromoControllerSymbols";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* The promotion frame is the reference surface for the motion layer. */
      #sngamerCampaignCarousel .campaignCard {
        position: relative !important;
        isolation: isolate !important;
        overflow: hidden !important;
      }

      /* Remove the previous travelling glow completely. */
      #sngamerCampaignCarousel .campaignCard::before,
      #sngamerCampaignCarousel .campaignCard::after {
        content: none !important;
        display: none !important;
        animation: none !important;
        background: none !important;
        box-shadow: none !important;
        filter: none !important;
      }

      #sngamerCampaignCarousel .${SYMBOL_HOST_CLASS} {
        position: absolute !important;
        inset: 0 !important;
        z-index: 1 !important;
        overflow: hidden !important;
        border-radius: inherit !important;
        pointer-events: none !important;
        user-select: none !important;
      }

      /* Keep the real product, text and prices above the decorative layer. */
      #sngamerCampaignCarousel .campaignMedia,
      #sngamerCampaignCarousel .campaignCopy,
      #sngamerCampaignCarousel .campaignPrice {
        position: relative !important;
        z-index: 3 !important;
      }

      #sngamerCampaignCarousel .sngPromoSymbol {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 22px !important;
        height: 22px !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 18px !important;
        font-weight: 800 !important;
        line-height: 22px !important;
        text-align: center !important;
        opacity: 0 !important;
        pointer-events: none !important;
        will-change: left, top, transform, opacity !important;
        text-shadow: 0 0 6px currentColor, 0 0 13px currentColor !important;
        transform-origin: center !important;
      }

      /* PlayStation controller colours. */
      #sngamerCampaignCarousel .sngPromoTriangle {
        color: #35d07f !important;
        animation: sngPromoTriangleMotion 7.2s linear infinite !important;
      }
      #sngamerCampaignCarousel .sngPromoCircle {
        color: #ff5265 !important;
        animation: sngPromoCircleMotion 8.0s linear infinite 1.0s !important;
      }
      #sngamerCampaignCarousel .sngPromoCross {
        color: #55a9ff !important;
        animation: sngPromoCrossMotion 7.6s linear infinite 2.0s !important;
      }
      #sngamerCampaignCarousel .sngPromoSquare {
        color: #ff5bc8 !important;
        animation: sngPromoSquareMotion 8.4s linear infinite 2.8s !important;
      }

      @keyframes sngPromoTriangleMotion {
        0%   { left: 4%;  top: 8%;  opacity: 0; transform: scale(.72) rotate(-15deg); }
        8%   { opacity: .78; }
        28%  { left: 28%; top: 58%; opacity: .58; transform: scale(1) rotate(15deg); }
        50%  { left: 54%; top: 20%; opacity: .72; transform: scale(.86) rotate(75deg); }
        73%  { left: 79%; top: 64%; opacity: .48; transform: scale(1.02) rotate(145deg); }
        92%  { opacity: .72; }
        100% { left: 94%; top: 18%; opacity: 0; transform: scale(.68) rotate(205deg); }
      }

      @keyframes sngPromoCircleMotion {
        0%   { left: 94%; top: 62%; opacity: 0; transform: scale(.68); }
        9%   { opacity: .72; }
        30%  { left: 68%; top: 15%; opacity: .52; transform: scale(1.02); }
        52%  { left: 43%; top: 70%; opacity: .76; transform: scale(.82); }
        75%  { left: 18%; top: 28%; opacity: .48; transform: scale(1.05); }
        92%  { opacity: .68; }
        100% { left: 4%; top: 72%; opacity: 0; transform: scale(.68); }
      }

      @keyframes sngPromoCrossMotion {
        0%   { left: 8%;  top: 72%; opacity: 0; transform: scale(.70) rotate(-25deg); }
        8%   { opacity: .76; }
        30%  { left: 36%; top: 28%; opacity: .52; transform: scale(1) rotate(20deg); }
        54%  { left: 72%; top: 76%; opacity: .70; transform: scale(.84) rotate(90deg); }
        77%  { left: 54%; top: 12%; opacity: .46; transform: scale(1.03) rotate(155deg); }
        92%  { opacity: .66; }
        100% { left: 90%; top: 52%; opacity: 0; transform: scale(.68) rotate(205deg); }
      }

      @keyframes sngPromoSquareMotion {
        0%   { left: 72%; top: 6%; opacity: 0; transform: scale(.72) rotate(-10deg); }
        8%   { opacity: .72; }
        31%  { left: 48%; top: 62%; opacity: .50; transform: scale(1) rotate(35deg); }
        55%  { left: 12%; top: 18%; opacity: .76; transform: scale(.86) rotate(105deg); }
        78%  { left: 83%; top: 34%; opacity: .46; transform: scale(1.02) rotate(165deg); }
        92%  { opacity: .68; }
        100% { left: 22%; top: 78%; opacity: 0; transform: scale(.68) rotate(225deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        #sngamerCampaignCarousel .sngPromoSymbol { animation-play-state: running !important; }
      }

      @media (max-width: 560px) {
        #sngamerCampaignCarousel .sngPromoSymbol {
          width: 18px !important;
          height: 18px !important;
          font-size: 15px !important;
          line-height: 18px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function addSymbols(card) {
    if (!card || card.querySelector(`.${SYMBOL_HOST_CLASS}`)) return;

    const host = document.createElement("span");
    host.className = SYMBOL_HOST_CLASS;
    host.setAttribute("aria-hidden", "true");
    host.innerHTML = `
      <span class="sngPromoSymbol sngPromoTriangle">△</span>
      <span class="sngPromoSymbol sngPromoCircle">○</span>
      <span class="sngPromoSymbol sngPromoCross">×</span>
      <span class="sngPromoSymbol sngPromoSquare">□</span>
    `;
    card.appendChild(host);
  }

  function mountAll() {
    injectStyles();
    const cards = document.querySelectorAll("#sngamerCampaignCarousel .campaignCard");
    cards.forEach(addSymbols);
  }

  function start() {
    mountAll();

    const observer = new MutationObserver(() => {
      mountAll();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    /* Carousel slides are rebuilt dynamically, so check a few times after boot. */
    [100, 350, 800, 1500, 3000].forEach((delay) => {
      window.setTimeout(mountAll, delay);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
