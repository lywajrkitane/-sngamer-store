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
      const bootGate = `<style id="sngamer-refresh-boot-style">html.sngamer-refresh-boot body{visibility:hidden!important;opacity:0!important}</style><script id="sngamer-refresh-boot-script">(function(){try{document.documentElement.classList.add('sngamer-refresh-boot');var start=Date.now(),done=false;function reveal(){if(done)return;done=true;document.documentElement.classList.remove('sngamer-refresh-boot');}function check(){if(Array.isArray(window.storeProducts)&&window.storeProducts.length>0){requestAnimationFrame(function(){requestAnimationFrame(reveal);});return;}if(Date.now()-start>8000){reveal();return;}setTimeout(check,50);}check();window.addEventListener('pageshow',function(){setTimeout(check,0);},{once:true});}catch(_){document.documentElement.classList.remove('sngamer-refresh-boot');}})();</script>`;
      if (!html.includes("sngamer-refresh-boot-style")) {
        html = html.replace(/<head>/i, `<head>${bootGate}`);
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
      res.set("Surrogate-Control", "no-store");
      res.type("html").send(html);
    } catch (error) {
      console.error("PAYTECH_STATIC_INJECTION_ERROR:", error);
      return originalMiddleware(req, res, next);
    }
  };
};
