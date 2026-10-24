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

      /*
       * Hide the old DOM while the current product data is fetched. This is
       * the important part for the visual "old version for a moment" flash:
       * the browser may paint the HTML shell before app.js finishes loading
       * the current /api/products response. We keep the page hidden until the
       * current data is available, then reveal it in one frame.
       */
      /* Hide only the homepage fragments that are rewritten by client scripts.
         Never hide the whole storefront or hold it behind readiness flags indefinitely. */
      const visualGate = `<style id="sngamer-refresh-visual-style">
html.sngamer-refresh-visual-boot .sngPromoAnnouncementButton,
html.sngamer-refresh-visual-boot .heroAnnouncement,
html.sngamer-refresh-visual-boot #promoArea .promoCarousel,
html.sngamer-refresh-visual-boot #promoArea .promoDots,
html.sngamer-refresh-visual-boot #promoArea .defaultHeroContent,
html.sngamer-refresh-visual-boot #products,
html.sngamer-refresh-visual-boot #cats { visibility:hidden!important; }
html.sngamer-refresh-visual-boot .sngPromoAnnouncement { min-height:52px!important; }
</style><script id="sngamer-refresh-visual-script">(function(){
  try{
    var root=document.documentElement;
    root.classList.add('sngamer-refresh-visual-boot');
    var started=Date.now(),released=false;
    function reveal(){
      if(released)return;
      released=true;
      requestAnimationFrame(function(){root.classList.remove('sngamer-refresh-visual-boot');});
    }
    function ready(){
      return window.__sngamerStoreReady===true
        && window.__sngamerCampaignBannerReady===true
        && window.__sngamerPromoHeroReady===true
        && window.__sngamerAnnouncementReady===true;
    }
    function check(){
      if(released)return;
      if(ready() || Date.now()-started>=2200){reveal();return;}
      setTimeout(check,40);
    }
    check();
    window.addEventListener('load',function(){setTimeout(check,80);},{once:true});
    setTimeout(reveal,2600);
  }catch(_){
    document.documentElement.classList.remove('sngamer-refresh-visual-boot');
  }
})();</script>`;
      if (!html.includes("sngamer-refresh-visual-style")) {
        html = html.replace(/<head>/i, `<head>${visualGate}`);
      }

      const scriptTag = '<script src="/paytech-checkout.js?v=20261021-stockcancel1"></script>';
      if (!html.includes("/paytech-checkout.js")) html = html.replace(/<\/body>/i, `${scriptTag}</body>`);

      const refreshRecoveryTag = '<script src="/store-refresh-recovery.js?v=20261020-refresh1"></script>';
      if (!html.includes("/store-refresh-recovery.js")) {
        html = html.replace(/<\/body>/i, `${refreshRecoveryTag}</body>`);
      }

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
