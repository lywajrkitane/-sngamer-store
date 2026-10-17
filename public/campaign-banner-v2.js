(function () {
  "use strict";

  const HOST_ID = "sngamerCampaignCarousel";
  const STYLE_ID = "sngamerCampaignCarouselStyles";
  const MAX_CAMPAIGNS = 3;
  const ROTATION_MS = 3000;

  const esc = (value) => String(value ?? "").replace(/[&<>\"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  }[c]));

  const money = (value) => new Intl.NumberFormat("fr-FR").format(Number(value || 0)) + " FCFA";

  function validPromo(product) {
    const regular = Number(product?.price || 0);
    const promo = Number(product?.promo_price || 0);
    return Boolean(product?.promo_active) && promo > 0 && regular > promo;
  }

  function imageOf(product) {
    return product?.main_image_url || product?.image1_url || product?.image2_url || product?.image3_url || "";
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${HOST_ID}{width:100%;margin:0;box-sizing:border-box;position:relative;z-index:5}
      #${HOST_ID} .campaignViewport{position:relative;width:100%;min-height:92px;overflow:hidden}
      #${HOST_ID} .campaignSlide{display:none;width:100%;box-sizing:border-box;cursor:pointer}
      #${HOST_ID} .campaignSlide.active{display:block;animation:sngCampaignIn .42s ease both}
      #${HOST_ID} .campaignCard{width:100%;min-height:86px;box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:11px 13px;border:1px solid rgba(96,165,250,.28);border-radius:17px;background:radial-gradient(circle at 0% 50%,rgba(37,99,235,.20),transparent 38%),linear-gradient(135deg,#0b1425,#111326 58%,#18112b);box-shadow:0 12px 30px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.035);transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}
      #${HOST_ID} .campaignCard.is-pressed{border-color:rgba(87,174,255,.98);box-shadow:0 0 0 1px rgba(87,174,255,.75),0 0 18px rgba(76,150,255,.42),inset 0 1px 0 rgba(255,255,255,.08);transform:translateY(-1px)}
      #${HOST_ID} .campaignCard:focus-visible{outline:none;border-color:rgba(87,174,255,.98);box-shadow:0 0 0 1px rgba(87,174,255,.75),0 0 18px rgba(76,150,255,.38)}
      #${HOST_ID} .campaignMedia{width:58px;height:58px;flex:0 0 58px;border-radius:14px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,#2563eb,#9333ea);border:1px solid rgba(255,255,255,.12)}
      #${HOST_ID} .campaignMedia img{width:100%;height:100%;object-fit:cover;display:block}
      #${HOST_ID} .campaignEmoji{font-size:27px}
      #${HOST_ID} .campaignCopy{min-width:0;flex:1}
      #${HOST_ID} .campaignEyebrow{margin:0 0 3px;color:#78aefc;font-size:10px;line-height:1.2;font-weight:900;letter-spacing:1.4px;text-transform:uppercase}
      #${HOST_ID} .campaignTitle{margin:0;color:#fff;font-size:clamp(14px,3.7vw,18px);line-height:1.2;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #${HOST_ID} .campaignProduct{margin-top:3px;color:#aebbd0;font-size:11px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #${HOST_ID} .campaignPrice{flex:0 0 auto;text-align:right}
      #${HOST_ID} .campaignOld{display:block;color:#8190a2;font-size:9px;text-decoration:line-through;margin-bottom:2px;white-space:nowrap}
      #${HOST_ID} .campaignCurrent{display:block;color:#fff;font-size:15px;font-weight:900;white-space:nowrap}
      #${HOST_ID} .campaignBadge{display:inline-flex;margin-top:3px;padding:3px 7px;border-radius:999px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:9px;font-weight:900;box-shadow:0 3px 10px rgba(239,68,68,.22)}
      #${HOST_ID} .campaignDots{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:8px;min-height:7px}
      #${HOST_ID} .campaignDot{display:block;width:7px !important;height:7px !important;min-width:7px !important;min-height:7px !important;max-width:7px !important;max-height:7px !important;padding:0 !important;margin:0;border:0;border-radius:999px;background:#43526a;cursor:pointer;transition:all .25s ease;box-sizing:border-box}
      #${HOST_ID} .campaignDot.active{width:25px !important;min-width:25px !important;max-width:25px !important;height:7px !important;min-height:7px !important;max-height:7px !important;background:linear-gradient(90deg,#4da3ff,#d92aa8)}
      @keyframes sngCampaignIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
      @media(max-width:560px){
        #${HOST_ID} .campaignViewport{min-height:79px}
        #${HOST_ID} .campaignCard{min-height:72px;gap:9px;padding:8px 9px;border-radius:15px}
        #${HOST_ID} .campaignMedia{width:48px;height:48px;flex-basis:48px;border-radius:11px}
        #${HOST_ID} .campaignEmoji{font-size:22px}
        #${HOST_ID} .campaignEyebrow{font-size:8px;letter-spacing:1px}
        #${HOST_ID} .campaignTitle{font-size:13px}
        #${HOST_ID} .campaignProduct{font-size:10px}
        #${HOST_ID} .campaignOld{font-size:8px}
        #${HOST_ID} .campaignCurrent{font-size:12px}
        #${HOST_ID} .campaignBadge{font-size:8px;padding:3px 6px}
        #${HOST_ID} .campaignDots{margin-top:7px;gap:5px;min-height:6px}
        #${HOST_ID} .campaignDot{width:6px !important;height:6px !important;min-width:6px !important;min-height:6px !important;max-width:6px !important;max-height:6px !important}
        #${HOST_ID} .campaignDot.active{width:20px !important;min-width:20px !important;max-width:20px !important;height:6px !important;min-height:6px !important;max-height:6px !important}
      }
    `;
    document.head.appendChild(style);
  }

  function campaignIsActive(product, promo) {
    return product?.campaign_active === true || product?.campaign_active === "true" ||
      product?.campaign_active === 1 || product?.campaign_active === "1" ||
      promo?.campaign_active === true || promo?.campaign_active === "true" ||
      promo?.campaign_active === 1 || promo?.campaign_active === "1";
  }

  function mergeCampaign(product, promo) {
    const source = promo || {};
    return {
      ...source,
      campaign_id: product?.campaign_id || source.campaign_id || null,
      campaign_name: product?.campaign_name || source.campaign_name || "Offre exclusive",
      campaign_sticker: product?.campaign_sticker || source.campaign_sticker || "",
      campaign_right_sticker: product?.campaign_right_sticker || source.campaign_right_sticker || "",
      campaign_active: product?.campaign_active ?? source.campaign_active
    };
  }

  function resolveCampaigns(products, promos) {
    const rows = Array.isArray(promos) ? promos.filter(Boolean) : [];
    const seenProducts = new Set();
    const result = [];

    // IMPORTANT: a campaign can contain several promoted products.
    // Each promoted product is an independent carousel slide. Do not
    // deduplicate by campaign_id, otherwise activating two promotions
    // belonging to the same campaign leaves only one visible.
    for (const promo of rows) {
      const productId = Number(promo?.product_id || 0);
      const mediaCampaignId = Number(promo?.campaign_id || 0);

      const product = productId > 0
        ? products.find((p) => Number(p.id) === productId && validPromo(p))
        : mediaCampaignId > 0
          ? products.find((p) => Number(p.campaign_id) === mediaCampaignId && validPromo(p))
          : null;

      if (!product || !campaignIsActive(product, promo)) continue;

      const key = Number(product.id);
      if (seenProducts.has(key)) continue;
      seenProducts.add(key);
      result.push({ product, campaign: mergeCampaign(product, promo) });
      if (result.length >= MAX_CAMPAIGNS) break;
    }

    if (result.length < MAX_CAMPAIGNS) {
      products
        .filter((product) => validPromo(product) && campaignIsActive(product, null))
        .forEach((product) => {
          if (result.length >= MAX_CAMPAIGNS) return;
          const key = Number(product.id);
          if (seenProducts.has(key)) return;
          seenProducts.add(key);
          result.push({ product, campaign: mergeCampaign(product, null) });
        });
    }

    if (!result.length) {
      products.filter(validPromo).slice(0, MAX_CAMPAIGNS).forEach((product) => {
        const key = Number(product.id);
        if (seenProducts.has(key)) return;
        seenProducts.add(key);
        result.push({ product, campaign: mergeCampaign(product, null) });
      });
    }

    return result;
  }

  function cardMarkup(item) {
    const product = item.product;
    const campaign = item.campaign || {};
    const regular = Number(product.price || 0);
    const promo = Number(product.promo_price || 0);
    const discount = regular > promo ? Math.round((1 - promo / regular) * 100) : 0;
    const name = String(campaign.campaign_name || "Offre exclusive").trim() || "Offre exclusive";
    const leftSticker = String(campaign.campaign_sticker || "").trim();
    const rightSticker = String(campaign.campaign_right_sticker || "").trim();
    const campaignDisplay = [leftSticker, name, rightSticker].filter(Boolean).join(" ");
    const image = imageOf(product);

    return `
      <div class="campaignCard" data-product-id="${Number(product.id) || 0}" role="button" tabindex="0" aria-label="${esc(name)} — ${esc(product.name || "Produit")}">
        <div class="campaignMedia">
          ${image ? `<img src="${esc(image)}" alt="${esc(product.name || "Produit en promotion")}" loading="eager">` : `<span class="campaignEmoji">${esc(leftSticker || product.emoji || "🔥")}</span>`}
        </div>
        <div class="campaignCopy">
          <div class="campaignEyebrow">OFFRE EXCLUSIVE</div>
          <div class="campaignTitle">${esc(campaignDisplay)}</div>
          <div class="campaignProduct">${esc(product.name || "Produit en promotion")}</div>
        </div>
        <div class="campaignPrice">
          <span class="campaignOld">${esc(money(regular))}</span>
          <strong class="campaignCurrent">${esc(money(promo))}</strong>
          ${discount > 0 ? `<span class="campaignBadge">-${discount}%</span>` : ""}
        </div>
      </div>`;
  }

  function render(items) {
    const existing = document.getElementById(HOST_ID);
    if (existing) existing.remove();
    if (!items.length) return;

    const host = document.createElement("section");
    host.id = HOST_ID;
    host.setAttribute("aria-label", "Offres exclusives");
    host.innerHTML = `<div class="campaignViewport"></div><div class="campaignDots" aria-label="Navigation des offres"></div>`;

    const viewport = host.querySelector(".campaignViewport");
    const dots = host.querySelector(".campaignDots");

    items.forEach((item, index) => {
      const slide = document.createElement("article");
      slide.className = `campaignSlide${index === 0 ? " active" : ""}`;
      slide.innerHTML = cardMarkup(item);
      const card = slide.querySelector(".campaignCard");

      const open = () => {
        const id = Number(card?.dataset.productId || 0);
        if (!id || typeof window.openProduct !== "function") return;
        card.classList.add("is-pressed");
        window.setTimeout(() => card.classList.remove("is-pressed"), 360);
        window.setTimeout(() => window.openProduct(id), 120);
      };

      card?.addEventListener("click", open);
      card?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
      viewport.appendChild(slide);

      if (items.length > 1) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = `campaignDot${index === 0 ? " active" : ""}`;
        dot.setAttribute("aria-label", `Voir l'offre ${index + 1}`);
        dots.appendChild(dot);
      }
    });

    const announcement = document.querySelector(".professional-hero .heroAnnouncement");
    const button = document.querySelector(".professional-hero .heroIn > div:first-child .primary");

    if (announcement?.parentNode) {
      announcement.parentNode.insertBefore(host, button || announcement.nextSibling);
    } else {
      const first = document.querySelector(".hero .heroIn > div:first-child");
      if (first) first.insertBefore(host, button || null);
      else return;
    }

    let current = 0;
    let timer = null;
    const slides = [...viewport.querySelectorAll(".campaignSlide")];
    const dotEls = [...dots.querySelectorAll(".campaignDot")];

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("active", i === current));
      dotEls.forEach((d, i) => d.classList.toggle("active", i === current));
      restart();
    }

    function restart() {
      if (timer) clearInterval(timer);
      if (slides.length > 1) timer = setInterval(() => show(current + 1), ROTATION_MS);
    }

    dotEls.forEach((dot, index) => dot.addEventListener("click", (e) => {
      e.stopPropagation();
      show(index);
    }));

    host.addEventListener("mouseenter", () => { if (timer) clearInterval(timer); });
    host.addEventListener("mouseleave", restart);
    restart();
  }

  async function load() {
    try {
      const [productsResponse, promosResponse] = await Promise.all([
        fetch("/api/products?campaign_banner=1", { cache: "no-store" }),
        fetch("/api/promo-media", { cache: "no-store" })
      ]);
      if (!productsResponse.ok) return;
      const products = await productsResponse.json();
      const promos = promosResponse.ok ? await promosResponse.json() : [];
      render(resolveCampaigns(Array.isArray(products) ? products : [], promos));
    } catch (error) {
      console.error("ACTIVE_CAMPAIGN_CAROUSEL_ERROR", error);
    }
  }

  function start() {
    injectStyles();
    const waitForAnnouncement = () => {
      if (document.querySelector(".professional-hero .heroAnnouncement") || document.querySelector(".hero")) {
        load();
        return;
      }
      setTimeout(waitForAnnouncement, 60);
    };
    waitForAnnouncement();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
