const fs = require("fs");
const path = require("path");
const express = require("express");

/*
 * Single owner for the customer-facing header controls and desktop hero layout.
 * Keep customer account, catalog, cart state, and checkout logic in their existing files.
 */
const originalStatic = express.static;
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");

function buildHeader(html) {
  const profileButton = '<button type="button" class="profilePremiumButton" id="profilePremiumButton" aria-label="Mon profil" title="Mon profil" onclick="navigateStore(\'profile\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 20c.8-3.4 3.1-5.2 6.5-5.2s5.7 1.8 6.5 5.2"></path></svg></button>';
  const cartButton = '<button type="button" class="cartButton" aria-label="Panier" title="Panier" onclick="cart()"><span class="cartIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 4h2l1.7 10.2a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 1.9-1.4L21 8H7"></path><circle cx="10" cy="19" r="1.2"></circle><circle cx="18" cy="19" r="1.2"></circle></svg></span><b id="count">0</b></button>';

  /* Canonical order: Search, Cart, Profile. Replace the source cart markup rather than layering a new button over it. */
  html = html.replace(/<button\s+class="cartButton"[^>]*>[\s\S]*?<\/button>/i, cartButton);
  html = html.replace(/<button\s+type="button"\s+class="profilePremiumButton"[^>]*>[\s\S]*?<\/button>/i, '');
  if (!html.includes('id="profilePremiumButton"')) {
    html = html.replace(cartButton, cartButton + profileButton);
  }

  const css = [
    '.siteHeader .wrap.nav{display:flex!important;align-items:center!important;gap:10px!important;width:100%!important;box-sizing:border-box!important}',
    '.siteHeader .nav>.logo{order:0!important;flex:0 0 auto!important}',
    '.siteHeader .nav>.searchPremiumButton{order:1!important;margin-left:auto!important;margin-right:0!important}',
    '.siteHeader .nav>.cartButton{order:2!important;margin-left:0!important;margin-right:0!important}',
    '.siteHeader .nav>.profilePremiumButton{order:3!important;margin-left:0!important;margin-right:0!important}',
    '.siteHeader .searchPremiumButton,.siteHeader .profilePremiumButton,.siteHeader .cartButton{width:52px!important;height:52px!important;min-width:52px!important;min-height:52px!important;max-width:52px!important;max-height:52px!important;flex:0 0 52px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;box-sizing:border-box!important;border-radius:16px!important;position:relative!important}',
    '.siteHeader .searchPremiumButton,.siteHeader .profilePremiumButton,.siteHeader .cartButton{border:1px solid rgba(70,150,255,.55)!important;color:#fff!important;background:linear-gradient(135deg,#147dff 0%,#5b35ff 55%,#d326a8 100%)!important;box-shadow:0 0 22px rgba(42,111,255,.24),inset 0 1px 0 rgba(255,255,255,.2)!important;cursor:pointer!important}',
    '.siteHeader .searchPremiumButton svg,.siteHeader .profilePremiumButton svg{width:23px!important;height:23px!important;display:block!important}',
    '.siteHeader .cartButton .cartIcon{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:22px!important;height:22px!important;font-size:0!important;line-height:0!important}',
    '.siteHeader .cartButton .cartIcon svg{width:22px!important;height:22px!important;display:block!important}',
    '.siteHeader .cartButton>span:not(.cartIcon){display:none!important}',
    '.siteHeader .cartButton b{position:absolute!important;right:-5px!important;top:-5px!important;transform:none!important;min-width:18px!important;height:18px!important;padding:0 5px!important;border-radius:999px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;background:transparent!important;border:0!important;color:#fff!important;font-size:10px!important;font-weight:900!important;line-height:18px!important;box-sizing:border-box!important}',
    '#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent,#products .card.productCardClickable .info .priceCurrent{color:#D4A017!important;text-shadow:0 0 10px rgba(212,160,23,.10)!important}',
    '#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent small,#products .card.productCardClickable .info .priceCurrent small{color:#aebacc!important;text-shadow:none!important}',
    '@media(min-width:701px){',
    '.hero .heroIn{display:grid!important;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr)!important;grid-template-rows:auto auto!important;align-items:start!important;min-height:0!important;height:auto!important;max-height:none!important;padding-top:36px!important;padding-bottom:36px!important;column-gap:26px!important;row-gap:20px!important}',
    '.hero .heroIn>div:first-child{grid-column:1!important;grid-row:1!important;align-self:start!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;box-sizing:border-box!important}',
    '.hero .heroIn>div:first-child p.heroAnnouncement{height:auto!important;min-height:0!important;max-height:none!important;box-sizing:border-box!important}',
    '.hero .heroIn>.heroVisual{grid-column:2!important;grid-row:1!important;display:flex!important;visibility:visible!important;align-self:start!important;width:100%!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:hidden!important;box-sizing:border-box!important}',
    '.hero .heroIn>.heroVisual>.defaultHeroContent{width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;margin:0!important;padding:clamp(18px,2.5vw,32px)!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important}',
    '.hero .heroIn>.primary,.hero .heroIn>.sngPromoHeroCta{grid-column:1!important;grid-row:2!important;justify-self:start!important;align-self:start!important;margin:0!important;position:relative!important;z-index:2!important}',
    'main#shop{position:relative!important;z-index:1!important;margin-top:0!important;padding-top:36px!important}',
    '}',
    '@media(max-width:700px){',
    '.siteHeader .searchPremiumButton,.siteHeader .profilePremiumButton,.siteHeader .cartButton{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;max-width:48px!important;max-height:48px!important;flex-basis:48px!important;border-radius:15px!important}',
    '.siteHeader .cartButton b{right:-4px!important;top:-4px!important}',
    '}'
  ].join('\n');

  if (!html.includes('id="sngamer-storefront-authoritative-final"')) {
    html = html.replace(/<\/head>/i, '<style id="sngamer-storefront-authoritative-final">' + css + '</style></head>');
  }

  const layoutScript = [
    '(function(){',
    '  "use strict";',
    '  function layoutHero(){',
    '    var hero=document.querySelector(".hero");',
    '    if(!hero)return;',
    '    var heroIn=hero.querySelector(".heroIn");',
    '    var leftColumn=heroIn&&heroIn.querySelector(":scope > div:first-child");',
    '    var leftCard=leftColumn&&leftColumn.querySelector(".promoArea .promoSlide");',
    '    if(!leftCard) leftCard=leftColumn&&leftColumn.querySelector(".promoCarousel .promoSlide");',
    '    if(!leftCard) leftCard=leftColumn&&leftColumn.querySelector(".sngPromoAnnouncement");',
    '    var visual=heroIn&&heroIn.querySelector(":scope > .heroVisual");',
    '    if(!heroIn||!leftCard||!visual)return;',
    '    if(window.innerWidth<701){',
    '      visual.style.removeProperty("height");visual.style.removeProperty("min-height");visual.style.removeProperty("max-height");',
    '      var inner=visual.querySelector(".defaultHeroContent");if(inner){inner.style.removeProperty("height");inner.style.removeProperty("min-height");inner.style.removeProperty("max-height");}',
    '      return;',
    '    }',
    '    leftCard.style.removeProperty("height");leftCard.style.removeProperty("min-height");leftCard.style.removeProperty("max-height");',
    '    var h=Math.ceil(leftCard.getBoundingClientRect().height);',
    '    if(!h||!Number.isFinite(h))return;',
    '    visual.style.setProperty("height",h+"px","important");',
    '    visual.style.setProperty("min-height",h+"px","important");',
    '    visual.style.setProperty("max-height",h+"px","important");',
    '    var inner=visual.querySelector(".defaultHeroContent");',
    '    if(inner){inner.style.setProperty("height",h+"px","important");inner.style.setProperty("min-height",h+"px","important");inner.style.setProperty("max-height",h+"px","important");}',
    '  }',
    '  var scheduled=false;',
    '  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;layoutHero();});}',
    '  function boot(){schedule();[120,400,900,1800,3000].forEach(function(ms){setTimeout(schedule,ms);});window.addEventListener("load",schedule,{once:true});window.addEventListener("resize",schedule,{passive:true});',
    '    if(window.ResizeObserver){var left= document.querySelector(".hero .promoArea .promoSlide") || document.querySelector(".hero .promoCarousel .promoSlide") || document.querySelector(".hero .sngPromoAnnouncement");if(left){var ro=new ResizeObserver(schedule);ro.observe(left);}}',
    '    var hero=document.querySelector(".hero");if(hero&&!window.__sngAuthoritativeHeroObserver){window.__sngAuthoritativeHeroObserver=new MutationObserver(schedule);window.__sngAuthoritativeHeroObserver.observe(hero,{subtree:true,childList:true,characterData:true});}',
    '  }',
    '  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();',
    '})();'
  ].join('\n');

  if (!html.includes('id="sngamer-authoritative-hero-layout"')) {
    html = html.replace(/<\/body>/i, '<script id="sngamer-authoritative-hero-layout">' + layoutScript + '</script></body>');
  }

  return html;
}

express.static = function storefrontAuthoritativeStatic(root, options) {
  const middleware = originalStatic(root, options);
  if (path.resolve(root || "") !== PUBLIC_DIR) return middleware;
  return function storefrontAuthoritativeMiddleware(req, res, next) {
    if (req.method !== "GET" && req.method !== "HEAD") return middleware(req, res, next);
    const requestPath = String(req.path || req.url || "").split("?")[0];
    if (requestPath !== "/" && requestPath !== "/index.html") return middleware(req, res, next);
    try {
      const html = buildHeader(fs.readFileSync(INDEX_FILE, "utf8"));
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.set("Surrogate-Control", "no-store");
      res.type("html");
      if (req.method === "HEAD") return res.end();
      return res.send(html);
    } catch (error) {
      console.error("SNGAMER_AUTHORITATIVE_UI_ERROR:", error);
      return middleware(req, res, next);
    }
  };
};
