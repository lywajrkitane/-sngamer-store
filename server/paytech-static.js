const express = require("express");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const originalStatic = express.static;

/* Normalize legacy paid orders created before payment_status was separated. */
async function normalizeLegacyPaidOrders() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      await pool.query(`
        UPDATE orders
        SET status='Nouvelle', payment_status='Payé'
        WHERE status='Payée'
          AND payment_status IN ('En attente', '')
      `);
      console.log("PAYTECH_LEGACY_ORDER_NORMALIZATION: completed");
      break;
    } catch (error) {
      if (attempt === 12) console.error("PAYTECH_LEGACY_ORDER_NORMALIZATION_ERROR:", error);
      else await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  await pool.end().catch(() => {});
}
normalizeLegacyPaidOrders().catch(error => console.error("PAYTECH_LEGACY_BOOT_ERROR:", error));

/* Admin loading is handled by the dashboard's single loadAll implementation. */

express.static = function paytechAwareStatic(root, options) {
  const originalMiddleware = originalStatic(root, options);
  const publicRoot = path.resolve(root);
  const assetRevision = String(
    process.env.RENDER_GIT_COMMIT ||
    process.env.SNGAMER_BUILD_ID ||
    "cache-coherence-20261024"
  ).replace(/[^A-Za-z0-9._-]/g, "").slice(0, 24);

  const mutableAssetPattern = /\.(?:css|m?js|json|webmanifest)$/i;

  function resolvePublicAsset(reference) {
    if (!reference || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) return null;
    const rawPath = String(reference).split(/[?#]/, 1)[0];
    if (!mutableAssetPattern.test(rawPath)) return null;

    let decoded = rawPath;
    try { decoded = decodeURIComponent(rawPath); } catch (_) { return null; }
    const localPath = decoded.startsWith("/")
      ? decoded.slice(1)
      : decoded.replace(/^(?:\.\/)+/, "");
    const filePath = path.resolve(publicRoot, localPath);
    const relative = path.relative(publicRoot, filePath);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
    try {
      if (!fs.statSync(filePath).isFile()) return null;
    } catch (_) {
      return null;
    }
    return { filePath, rawPath };
  }

  function cacheBustAssetUrl(reference) {
    const value = String(reference || "");
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|data:|blob:)/i.test(value)) return value;

    const hashAt = value.indexOf("#");
    const hash = hashAt >= 0 ? value.slice(hashAt) : "";
    const withoutHash = hashAt >= 0 ? value.slice(0, hashAt) : value;
    const queryAt = withoutHash.indexOf("?");
    const pathname = queryAt >= 0 ? withoutHash.slice(0, queryAt) : withoutHash;
    const query = queryAt >= 0 ? withoutHash.slice(queryAt + 1) : "";
    if (!resolvePublicAsset(pathname)) return value;

    const params = new URLSearchParams(query);
    params.set("v", assetRevision);
    return pathname + "?" + params.toString() + hash;
  }

  function rewriteAssetReferences(source) {
    return String(source).replace(/(["'])([^"'\s<>]+)\1/g, (whole, quote, value) => {
      if (!mutableAssetPattern.test(value.split(/[?#]/, 1)[0])) return whole;
      const updated = cacheBustAssetUrl(value);
      return quote + updated + quote;
    });
  }

  function applyAuthoritativeStorefrontUi(html) {
    /* The header is defined here, at the final server-render boundary. This prevents
       older client-side UI patches from deciding whether Profile/Cart are visible. */
    const profileButton = '<button type="button" class="profilePremiumButton" id="profilePremiumButton" aria-label="Mon profil" title="Mon profil" onclick="navigateStore(\'profile\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 20c.8-3.4 3.1-5.2 6.5-5.2s5.7 1.8 6.5 5.2"></path></svg></button>';
    const iconCartButton = '<button type="button" class="cartButton" aria-label="Panier" title="Panier" onclick="cart()"><span class="cartIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 4h2l1.7 10.2a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 1.9-1.4L21 8H7"></path><circle cx="10" cy="19" r="1.2"></circle><circle cx="18" cy="19" r="1.2"></circle></svg></span><b id="count">0</b></button>';

    html = html.replace(/<button\s+class="cartButton"[^>]*>.*?<\/button>/i, iconCartButton);
    if (!html.includes('id="profilePremiumButton"')) {
      html = html.replace(iconCartButton, profileButton + iconCartButton);
    }

    const authoritativeStyle = `<style id="sngamer-authoritative-storefront-ui">
.siteHeader .nav{display:flex!important;align-items:center!important;gap:10px!important}
.siteHeader .searchPremiumButton,.siteHeader .profilePremiumButton,.siteHeader .cartButton{width:52px!important;height:52px!important;min-width:52px!important;min-height:52px!important;flex:0 0 52px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;border-radius:16px!important;box-sizing:border-box!important}
.siteHeader .profilePremiumButton,.siteHeader .cartButton{border:1px solid rgba(70,150,255,.55)!important;color:#fff!important;background:linear-gradient(135deg,#147dff 0%,#5b35ff 55%,#d326a8 100%)!important;box-shadow:0 0 22px rgba(42,111,255,.24),inset 0 1px 0 rgba(255,255,255,.2)!important;cursor:pointer!important}
.siteHeader .profilePremiumButton svg{width:23px!important;height:23px!important}
.siteHeader .cartButton .cartIcon{display:inline-flex!important;align-items:center!important;justify-content:center!important}
.siteHeader .cartButton .cartIcon svg{width:22px!important;height:22px!important}
.siteHeader .cartButton b{position:absolute!important;transform:translate(17px,-17px)!important;min-width:18px!important;height:18px!important;padding:0 5px!important;border-radius:999px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;background:#7c3aed!important;color:#fff!important;font-size:10px!important;line-height:18px!important;box-sizing:border-box!important}
#products .card.productCardClickable .priceCurrent{color:#FFD21A!important}
#products .card.productCardClickable .priceCurrent small{color:#aebacc!important}
@media (min-width:701px){
  .heroIn{align-items:stretch!important}
  .heroIn>div:first-child,.heroIn>.heroVisual{height:256px!important;min-height:256px!important;max-height:256px!important;box-sizing:border-box!important}
}
@media (max-width:700px){
  .siteHeader .searchPremiumButton,.siteHeader .profilePremiumButton,.siteHeader .cartButton{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;flex-basis:48px!important;border-radius:15px!important}
  .siteHeader .cartButton b{transform:translate(16px,-16px)!important}
}
</style>`;

    if (!html.includes('id="sngamer-authoritative-storefront-ui"')) {
      html = html.replace(/<\/head>/i, authoritativeStyle + '</head>');
    }
    return html;
  }

  return function serveStatic(req, res, next) {
    const pathname = String(req.path || req.url || "").split("?")[0];
    const isHome = req.method === "GET" && (pathname === "/" || pathname === "/index.html");

    /* Never allow the storefront's executable/text assets to be reused from a stale browser cache. */
    const isVersionSensitiveAsset = /\.(?:html?|css|js|json)$/i.test(pathname);
    if (isVersionSensitiveAsset) {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.set("Surrogate-Control", "no-store");
    }

    if (!isHome && req.method === "GET" && mutableAssetPattern.test(pathname)) {
      const asset = resolvePublicAsset(pathname);
      if (asset) {
        fs.readFile(asset.filePath, "utf8", (error, content) => {
          if (error) return originalMiddleware(req, res, next);
          res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.set("Pragma", "no-cache");
          res.set("Expires", "0");
          res.set("Surrogate-Control", "no-store");
          res.type(path.extname(asset.filePath));
          return res.send(rewriteAssetReferences(content));
        });
        return;
      }
    }

    if (!isHome) return originalMiddleware(req, res, next);
    const indexPath = path.join(publicRoot, "index.html");
    if (!fs.existsSync(indexPath)) return originalMiddleware(req, res, next);
    try {
      let html = fs.readFileSync(indexPath, "utf8");

      /* ROOT FIX: the old hero was hard-coded in index.html. That meant the browser
         could paint a previous hero before home-hero.js replaced it. Remove only that
         legacy hero paragraph on the server, while deliberately preserving the audio
         announcement button immediately before it. The dynamic hero then owns the
         complete presentation from the first meaningful paint. */
      html = html.replace(/<p\s+class="heroAnnouncement"[^>]*>[\s\S]*?<\/p>/i,
        '<p class="heroAnnouncement sngHomeHeroMount" aria-hidden="true"></p>');

      const scriptTag = '<script src="/paytech-checkout.js?v=20261021-stockcancel1"></script>';
      if (!html.includes("/paytech-checkout.js")) html = html.replace(/<\/body>/i, `${scriptTag}</body>`);

      const refreshRecoveryTag = '<script src="/store-refresh-recovery.js?v=20261020-refresh1"></script>';
      if (!html.includes("/store-refresh-recovery.js")) {
        html = html.replace(/<\/body>/i, `${refreshRecoveryTag}</body>`);
      }

      html = applyAuthoritativeStorefrontUi(html);
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      html = rewriteAssetReferences(html);
      res.set("Surrogate-Control", "no-store");
      res.type("html").send(html);
    } catch (error) {
      console.error("PAYTECH_STATIC_INJECTION_ERROR:", error);
      return originalMiddleware(req, res, next);
    }
  };
};