const fs = require("fs");
const path = require("path");
const express = require("express");

/* Single customer-facing UI authority. This preload must run last. */
const originalStatic = express.static;
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");

function buildHeader(html) {
  const profileButton = '<button type="button" class="profilePremiumButton" id="profilePremiumButton" aria-label="Mon profil" title="Mon profil" onclick="navigateStore(\'profile\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 20c.8-3.4 3.1-5.2 6.5-5.2s5.7 1.8 6.5 5.2"></path></svg></button>';
  const cartButton = '<button type="button" class="cartButton" aria-label="Panier" title="Panier" onclick="cart()"><span class="cartIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 4h2l1.7 10.2a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 1.9-1.4L21 8H7"></path><circle cx="10" cy="19" r="1.2"></circle><circle cx="18" cy="19" r="1.2"></circle></svg></span><b id="count">0</b></button>';
  html = html.replace(/<button\s+class="cartButton"[^>]*>[\s\S]*?<\/button>/i, cartButton);
  if (!html.includes('id="profilePremiumButton"')) html = html.replace(cartButton, profileButton + cartButton);
  const css = `<style id="sngamer-storefront-authoritative-final">
.siteHeader .wrap.nav{display:flex!important;align-items:center!important;gap:10px!important}
.siteHeader .searchPremiumButton,.siteHeader .profilePremiumButton,.siteHeader .cartButton{width:52px!important;height:52px!important;min-width:52px!important;min-height:52px!important;flex:0 0 52px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;box-sizing:border-box!important;border-radius:16px!important}
.siteHeader .profilePremiumButton,.siteHeader .cartButton{position:relative!important;border:1px solid rgba(70,150,255,.55)!important;color:#fff!important;background:linear-gradient(135deg,#147dff 0%,#5b35ff 55%,#d326a8 100%)!important;box-shadow:0 0 22px rgba(42,111,255,.24),inset 0 1px 0 rgba(255,255,255,.2)!important;cursor:pointer!important}
.siteHeader .profilePremiumButton svg{width:23px!important;height:23px!important}.siteHeader .cartButton .cartIcon{display:inline-flex!important;align-items:center!important;justify-content:center!important}.siteHeader .cartButton .cartIcon svg{width:22px!important;height:22px!important}
.siteHeader .cartButton b{position:absolute!important;right:-5px!important;top:-5px!important;transform:none!important;min-width:18px!important;height:18px!important;padding:0 5px!important;border-radius:999px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;background:#7c3aed!important;color:#fff!important;font-size:10px!important;line-height:18px!important;box-sizing:border-box!important}
#products .card.productCardClickable .priceCurrent{color:#FFD21A!important}#products .card.productCardClickable .priceCurrent small{color:#aebacc!important}
@media (min-width:701px){.hero .heroIn{align-items:stretch!important}.hero .heroIn>div:first-child,.hero .heroIn>.heroVisual{height:256px!important;min-height:256px!important;max-height:256px!important;box-sizing:border-box!important}}
@media (max-width:700px){.siteHeader .searchPremiumButton,.siteHeader .profilePremiumButton,.siteHeader .cartButton{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;flex-basis:48px!important;border-radius:15px!important}.siteHeader .cartButton b{right:-4px!important;top:-4px!important}}
</style>`;
  if (!html.includes('id="sngamer-storefront-authoritative-final"')) html = html.replace(/<\/head>/i, css + "</head>");
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
