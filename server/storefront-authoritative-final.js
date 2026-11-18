const fs = require("fs");
const path = require("path");
const express = require("express");

/*
 * SNGAMER STORE — single customer storefront UI authority.
 * Desktop: Search -> Cart -> Profile, all on the right.
 * Mobile: Search -> Cart only; profile remains in the bottom navigation.
 * The desktop promo card is the sole source of truth for the second hero height.
 */
const originalStatic = express.static;
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");

function buildHeader(html) {
  const profileButton = '<button type="button" class="profilePremiumButton" id="profilePremiumButton" aria-label="Mon profil" title="Mon profil" onclick="navigateStore(\'profile\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 20c.8-3.4 3.1-5.2 6.5-5.2s5.7 1.8 6.5 5.2"></path></svg></button>';
  const languageButton = '<button type="button" class="sngLanguageButton" id="sngLanguageButton" aria-label="Choisir pays et langue" title="Choisir pays et langue" aria-expanded="false"><span aria-hidden="true">🇸🇳</span><svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 4 4 4 4-4"></path></svg></button>';
  const cartButton = '<button type="button" class="cartButton" aria-label="Panier" title="Panier" onclick="cart()"><span class="cartIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 4h2l1.7 10.2a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 1.9-1.4L21 8H7"></path><circle cx="10" cy="19" r="1.2"></circle><circle cx="18" cy="19" r="1.2"></circle></svg></span><b id="count">0</b></button>';

  /* Canonical desktop order: Search -> Language -> Cart -> Profile. */
  html = html.replace(/<button\s+class="cartButton"[^>]*>[\s\S]*?<\/button>/i, cartButton);
  html = html.replace(/<button\b[^>]*class=["'][^"']*\bprofilePremiumButton\b[^"']*["'][^>]*>[\s\S]*?<\/button>/gi, '');
  if (!html.includes('id="sngLanguageButton"')) {
    html = html.replace(/(<button\b[^>]*class=["'][^"']*searchPremiumButton[^"']*["'][^>]*>[\s\S]*?<\/button>)/i, '$1' + languageButton);
  }
  if (!/<button\b[^>]*id=["']profilePremiumButton["']/i.test(html)) {
    html = html.replace(/(<button\b[^>]*class="cartButton"[^>]*>[\s\S]*?<\/button>)/i, '$1' + profileButton);
  }

  const css = [
    '.siteHeader .wrap.nav{display:flex!important;align-items:center!important;gap:10px!important;width:100%!important;box-sizing:border-box!important}',
    '.siteHeader .nav>.logo{order:0!important;flex:0 0 auto!important}',
    '.siteHeader .nav>.searchPremiumButton{order:1!important;margin-left:auto!important;margin-right:0!important}',
    '.siteHeader .nav>.sngLanguageButton{order:2!important;margin-left:0!important;margin-right:0!important}',
    '.siteHeader .nav>.cartButton{order:3!important;margin-left:0!important;margin-right:0!important}',
    '.siteHeader .nav>.profilePremiumButton{order:4!important;margin-left:0!important;margin-right:0!important;display:inline-flex!important}',
    '.siteHeader .searchPremiumButton,.siteHeader .profilePremiumButton,.siteHeader .cartButton{width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;max-width:46px!important;max-height:46px!important;flex:0 0 46px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;box-sizing:border-box!important;border-radius:50%!important;position:relative!important}',
    '.siteHeader .nav>.searchPremiumButton,.siteHeader .nav>.profilePremiumButton,.siteHeader .nav>.cartButton{border:1px solid rgba(255,255,255,.15)!important;color:#fff!important;background:rgba(255,255,255,.035)!important;box-shadow:0 3px 12px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.045)!important;cursor:pointer!important}',
    '.siteHeader .searchPremiumButton svg,.siteHeader .profilePremiumButton svg{width:23px!important;height:23px!important;display:block!important}',
    '.siteHeader .sngLanguageButton{width:38px!important;height:40px!important;min-width:38px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:2px!important;padding:0!important;border:0!important;background:transparent!important;color:#fff!important;font-size:23px!important;line-height:1!important;cursor:pointer!important;flex:0 0 38px!important}',
    '.siteHeader .sngLanguageButton svg{width:10px!important;height:10px!important;opacity:.75!important}',
    '.sngLanguageMenu{position:fixed!important;z-index:99999!important;width:min(260px,56vw)!important;max-width:calc(100vw - 24px)!important;max-height:55vh!important;overflow:auto!important;background:#191919!important;color:#f4f4f5!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:18px!important;box-shadow:0 18px 55px rgba(0,0,0,.58)!important;padding:0!important;font-family:inherit!important}',
    '.sngLanguageMenu[hidden]{display:none!important}',
    '.sngLanguageMenuTitle{padding:12px 13px;border-bottom:1px solid rgba(255,255,255,.12);font-size:12px;font-weight:900;letter-spacing:2px;color:#777e8b}',
    '.sngLanguageCountry{padding:10px 12px 12px;border-bottom:1px solid rgba(255,255,255,.1)}',
    '.sngLanguageCountryName{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:14px}',
    '.sngLanguageFlag{font-size:22px;line-height:1}',
    '.sngLanguageOptions{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
    '.sngLanguageChoice{min-width:0;min-height:36px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:#1d1d1d;color:#ddd;font:inherit;font-size:11px;font-weight:700;cursor:pointer;padding:6px 3px;white-space:normal;line-height:1.15}',
    '.sngLanguageChoice[aria-pressed="true"]{background:linear-gradient(115deg,#00d9ff 0%,#6555f5 58%,#c026d3 100%);color:#fff;border-color:rgba(0,217,255,.9);box-shadow:0 0 0 1px rgba(0,217,255,.12),0 5px 18px rgba(101,85,245,.28),inset 0 1px 0 rgba(255,255,255,.22)}',
    '.sngLanguageChoice:not(:disabled):hover{border-color:rgba(0,217,255,.55);color:#fff}',
    '.sngLanguageChoice:focus-visible{outline:2px solid #00d9ff;outline-offset:3px}',
    '.sngLanguageChoice:disabled{opacity:.45;cursor:not-allowed}',
    '.sngLanguageChoice small{display:block;font-size:9px;letter-spacing:.5px}',
    '.sngLanguageMenuNote{padding:9px 12px;color:#9ca3af;font-size:9px;line-height:1.4}',
    '@media(max-width:700px){.siteHeader .sngLanguageButton{width:34px!important;min-width:34px!important;flex:0 0 34px!important;font-size:21px!important}.sngLanguageCountry{padding:12px 14px 14px}.sngLanguageMenuTitle{padding:14px 16px}.sngLanguageChoice{min-height:40px;font-size:13px}}',
    '.siteHeader .cartButton .cartIcon{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:22px!important;height:22px!important;font-size:0!important;line-height:0!important}',
    '.siteHeader .cartButton .cartIcon svg{width:22px!important;height:22px!important;display:block!important}',
    '.siteHeader .cartButton>span:not(.cartIcon){display:none!important}',
    '.siteHeader .cartButton{overflow:visible!important}',
    '.siteHeader .cartButton b#count{position:absolute!important;right:-3px!important;top:-4px!important;transform:none!important;min-width:20px!important;height:20px!important;padding:0 6px!important;border-radius:999px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;background:linear-gradient(135deg,#101827 0%,#30345c 55%,#7c3aed 100%)!important;border:1px solid rgba(255,255,255,.92)!important;box-shadow:0 0 0 2px rgba(7,10,16,.9),0 5px 14px rgba(91,53,255,.35),inset 0 1px 0 rgba(255,255,255,.24)!important;color:#fff!important;font-size:10px!important;font-weight:900!important;line-height:20px!important;box-sizing:border-box!important;z-index:30!important;opacity:1!important;visibility:visible!important}',
    '#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent,#products .card.productCardClickable .info .priceCurrent{color:#FFC928!important;text-shadow:0 0 10px rgba(255,201,40,.16)!important}',
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
    '.siteHeader .searchPremiumButton,.siteHeader .cartButton{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;max-width:40px!important;max-height:40px!important;flex:0 0 40px!important;border-radius:50%!important}',
    '.siteHeader .profilePremiumButton{display:none!important;visibility:hidden!important;pointer-events:none!important}',
    '.siteHeader .searchPremiumButton svg{width:20px!important;height:20px!important}',
    '.siteHeader .cartButton .cartIcon,.siteHeader .cartButton .cartIcon svg{width:20px!important;height:20px!important}',
    '.siteHeader .cartButton b#count{right:-5px!important;top:-5px!important;min-width:18px!important;height:18px!important;padding:0 5px!important;font-size:9px!important;line-height:18px!important;display:inline-flex!important;background:linear-gradient(135deg,#101827 0%,#30345c 55%,#7c3aed 100%)!important;border:1px solid rgba(255,255,255,.95)!important;box-shadow:0 0 0 2px rgba(7,10,16,.9),0 4px 12px rgba(91,53,255,.32),inset 0 1px 0 rgba(255,255,255,.24)!important;color:#fff!important;z-index:30!important;opacity:1!important;visibility:visible!important}',
    '.siteHeader .wrap.nav{gap:7px!important}',
    '}',
    /* Touch-first browsers can expose a desktop-sized CSS viewport when Desktop site is enabled. */
    '@media(max-width:700px) and (hover:none) and (pointer:coarse){',
    'html,body{width:100%!important;max-width:100%!important;overflow-x:clip!important;overscroll-behavior-x:none!important}',
    '.siteHeader .nav>.searchPremiumButton,.siteHeader .nav>.cartButton{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;max-width:40px!important;max-height:40px!important;flex:0 0 40px!important;border-radius:50%!important}',
    '.siteHeader .nav>.profilePremiumButton{display:none!important;visibility:hidden!important;pointer-events:none!important}',
    '.siteHeader .nav>.cartButton{overflow:visible!important}',
    '.siteHeader .nav>.cartButton b#count{position:absolute!important;right:-3px!important;top:-4px!important;min-width:18px!important;height:18px!important;padding:0 5px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;background:linear-gradient(135deg,#101827 0%,#30345c 55%,#7c3aed 100%)!important;border:1px solid rgba(255,255,255,.95)!important;box-shadow:0 0 0 2px rgba(7,10,16,.9),0 4px 12px rgba(91,53,255,.32),inset 0 1px 0 rgba(255,255,255,.24)!important;color:#fff!important;font-size:9px!important;font-weight:900!important;line-height:1!important;z-index:60!important;opacity:1!important;visibility:visible!important}',
    '.siteHeader .nav>.cartButton>span:not(.cartIcon){display:none!important}',
    '.siteHeader .nav>.cartButton .cartIcon,.siteHeader .nav>.cartButton .cartIcon svg{width:19px!important;height:19px!important}',
    '.mobileBottomNav{display:grid!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;width:100%!important;max-width:100%!important;height:calc(82px + env(safe-area-inset-bottom,0px))!important;box-sizing:border-box!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;align-items:center!important;gap:0!important;padding:6px 6px calc(6px + env(safe-area-inset-bottom,0px))!important;margin:0!important;transform:none!important;z-index:10050!important;isolation:isolate!important;overflow:visible!important;touch-action:pan-y!important}',
    '.mobileBottomNav .bottomNavItem{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;transform:none!important;touch-action:manipulation!important}',
    'body{padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))!important}',
    '}'
  ].join('\n');

  if (!html.includes('id="sngamer-storefront-authoritative-final"')) {
    html = html.replace(/<\/head>/i, '<style id="sngamer-storefront-authoritative-final">' + css + '</style></head>');
  }

  const layoutScript = [
    '(function(){',
    '  "use strict";',
    '  function findDesktopHeroCard(heroIn){',
    '    if(!heroIn)return null;',
    '    var card=heroIn.querySelector(":scope > div:first-child .sngHomeHeroWrap .sngHomeHeroCard");',
    '    if(!card)card=heroIn.querySelector(":scope > div:first-child .sngHomeHeroCard");',
    '    if(!card)card=heroIn.querySelector(":scope > div:first-child .promoArea .promoSlide");',
    '    if(!card)card=heroIn.querySelector(":scope > div:first-child .promoCarousel .promoSlide");',
    '    if(!card)card=heroIn.querySelector(":scope > div:first-child .heroAnnouncement");',
    '    return card||null;',
    '  }',
    '  function layoutHero(){',
    '    var hero=document.querySelector(".hero");',
    '    if(!hero)return;',
    '    var heroIn=hero.querySelector(".heroIn");',
    '    var visual=heroIn&&heroIn.querySelector(":scope > .heroVisual");',
    '    if(!heroIn||!visual)return;',
    '    if(window.innerWidth<701){',
    '      visual.style.removeProperty("height");visual.style.removeProperty("min-height");visual.style.removeProperty("max-height");visual.style.removeProperty("margin-top");',
    '      var mobileInner=visual.querySelector(".defaultHeroContent");if(mobileInner){mobileInner.style.removeProperty("height");mobileInner.style.removeProperty("min-height");mobileInner.style.removeProperty("max-height");}',
    '      return;',
    '    }',
    '    var leftCard=findDesktopHeroCard(heroIn);',
    '    if(!leftCard)return;',
    '    var h=Math.ceil(leftCard.getBoundingClientRect().height);',
    '    if(!h||!Number.isFinite(h)||h<120)return;',
    '    var leftColumn=heroIn.querySelector(":scope > div:first-child");',
    '    var offset=leftColumn?Math.max(0,Math.ceil(leftCard.getBoundingClientRect().top-leftColumn.getBoundingClientRect().top)):0;',
    '    visual.style.setProperty("margin-top",offset+"px","important");',
    '    visual.style.setProperty("height",h+"px","important");',
    '    visual.style.setProperty("min-height",h+"px","important");',
    '    visual.style.setProperty("max-height",h+"px","important");',
    '    var inner=visual.querySelector(".defaultHeroContent");',
    '    if(inner){inner.style.setProperty("height",h+"px","important");inner.style.setProperty("min-height",h+"px","important");inner.style.setProperty("max-height",h+"px","important");}',
    '  }',
    '  function installFinalPriceColor(){',
    '    var id="sngamer-final-price-color";',
    '    var style=document.getElementById(id);',
    '    if(!style){style=document.createElement("style");style.id=id;document.head.appendChild(style);}',
    '    style.textContent="#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent,#products .card.productCardClickable .info .priceCurrent{color:#FFC928!important;text-shadow:0 0 10px rgba(255,201,40,.16)!important}#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent small,#products .card.productCardClickable .info .priceCurrent small{color:#aebacc!important;text-shadow:none!important}@media(max-width:700px){#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent,#products .card.productCardClickable .info .priceCurrent{color:#FFC928!important;text-shadow:0 0 10px rgba(255,201,40,.16)!important}}";',
    '  }',
    '  var scheduled=false;',
    '  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;layoutHero();});}',
    '  function boot(){',
    '    schedule();installFinalPriceColor();',
    '    [120,400,900,1800,3000].forEach(function(ms){setTimeout(function(){schedule();installFinalPriceColor();},ms);});',
    '    window.addEventListener("load",function(){schedule();installFinalPriceColor();},{once:true});',
    '    window.addEventListener("resize",schedule,{passive:true});',

    '    if(window.ResizeObserver){',
    '      var hero=document.querySelector(".hero");',
    '      if(hero&&!window.__sngAuthoritativeHeroObserver){',
    '        window.__sngAuthoritativeHeroObserver=new MutationObserver(schedule);',
    '        window.__sngAuthoritativeHeroObserver.observe(hero,{subtree:true,childList:true,characterData:true});',
    '      }',
    '    }',

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