const express = require("express");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const originalStatic = express.static;

/*
 * Legacy PayTech orders created before payment_status was separated from
 * the order workflow status could be stored as: status="Payée",
 * payment_status="En attente". Normalize those records at boot so the
 * dashboard correctly shows: Nouvelle + Payé.
 */
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
      if (attempt === 12) {
        console.error("PAYTECH_LEGACY_ORDER_NORMALIZATION_ERROR:", error);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }

  await pool.end().catch(() => {});
}

normalizeLegacyPaidOrders().catch(error => {
  console.error("PAYTECH_LEGACY_BOOT_ERROR:", error);
});

/*
 * The admin page calls loadAll() immediately after login. On a fresh session
 * the first request can race the session commit and return 401, while a
 * manual Actualiser works moments later. Wrap loadAll in the delivered HTML
 * so the first real data load happens after the session is established and
 * is retried once more shortly afterward.
 */
const originalSend = express.response.send;
express.response.send = function adminAutoLoadSend(body) {
  try {
    if (typeof body === "string" && body.includes('id="adminBox"') && !body.includes("sg-admin-autoload-fix")) {
      const fixScript = `<script id="sg-admin-autoload-fix">
(function(){
  'use strict';
  function scheduleLoads(){
    if(typeof window.loadAll !== 'function') return;
    const run = () => {
      const box = document.getElementById('adminBox');
      if(box && !box.classList.contains('hidden')) {
        try { window.loadAll(); } catch(e) { console.error('ADMIN_AUTOLOAD_ERROR:',e); }
      }
    };
    setTimeout(run, 900);
    setTimeout(run, 2200);
    setTimeout(run, 4000);
  }

  function install(){
    const box=document.getElementById('adminBox');
    if(!box) return;

    const originalLoadAll=window.loadAll;
    if(typeof originalLoadAll === 'function' && !originalLoadAll.__sgWrapped){
      const wrapped=function(){
        scheduleLoads();
      };
      wrapped.__sgWrapped=true;
      wrapped.__sgOriginal=originalLoadAll;
      window.loadAll=wrapped;
    }

    let wasVisible=!box.classList.contains('hidden');
    if(wasVisible) scheduleLoads();
    const observer=new MutationObserver(function(){
      const visible=!box.classList.contains('hidden');
      if(visible && !wasVisible){
        wasVisible=true;
        scheduleLoads();
      }else if(!visible){
        wasVisible=false;
      }
    });
    observer.observe(box,{attributes:true,attributeFilter:['class']});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
</script>`;
      body = body.replace(/<\/body>/i, `${fixScript}</body>`);
    }
  } catch (error) {
    console.error("ADMIN_AUTOLOAD_INJECTION_ERROR:", error);
  }
  return originalSend.call(this, body);
};

express.static = function paytechAwareStatic(root, options) {
  const originalMiddleware = originalStatic(root, options);
  const publicRoot = path.resolve(root);

  // Keep the Express static-handler name so the existing bootstrap ordering
  // logic continues to detect the static layer correctly.
  return function serveStatic(req, res, next) {
    const pathname = String(req.path || req.url || "").split("?")[0];
    const isHome = req.method === "GET" && (pathname === "/" || pathname === "/index.html");

    if (!isHome) return originalMiddleware(req, res, next);

    const indexPath = path.join(publicRoot, "index.html");
    if (!fs.existsSync(indexPath)) return originalMiddleware(req, res, next);

    try {
      let html = fs.readFileSync(indexPath, "utf8");
      const scriptTag = '<script src="/paytech-checkout.js?v=20261017-2010"></script>';
      if (!html.includes("/paytech-checkout.js")) {
        html = html.replace(/<\/body>/i, `${scriptTag}</body>`);
      }
      res.type("html").send(html);
    } catch (error) {
      console.error("PAYTECH_STATIC_INJECTION_ERROR:", error);
      return originalMiddleware(req, res, next);
    }
  };
};
