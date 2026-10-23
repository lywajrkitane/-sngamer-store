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
      const bootGate = `<style id="sngamer-refresh-boot-style">
html.sngamer-refresh-boot body{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
html.sngamer-refresh-boot::before{content:"SNGAMER STORE\\A Préparation de la boutique…";white-space:pre-line;position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 22px 62px;box-sizing:border-box;background:radial-gradient(ellipse at 50% 38%,rgba(20,95,170,.28),transparent 48%),linear-gradient(145deg,#070b13,#0b1423 58%,#120c20);color:#f3f7ff;font:900 20px/1.8 system-ui,-apple-system,Segoe UI,sans-serif;letter-spacing:.4px}
html.sngamer-refresh-boot::after{content:"";position:fixed;z-index:2147483647;top:calc(50% + 36px);left:calc(50% - 14px);width:28px;height:28px;box-sizing:border-box;border:3px solid rgba(104,174,255,.38);border-top-color:#d52db4;border-radius:50%;animation:sngBootSpin .8s linear infinite}
@keyframes sngBootSpin{to{transform:rotate(360deg)}}
html.sngamer-refresh-boot.sngamer-refresh-error::before,html.sngamer-refresh-boot.sngamer-refresh-error::after{display:none!important;content:none!important}
</style><script id="sngamer-refresh-boot-script">(function(){
  try{
    var root=document.documentElement;
    root.classList.add('sngamer-refresh-boot');
    var started=Date.now(),stableSince=0,finished=false,windowLoaded=document.readyState==='complete';
    var required=['__sngamerStoreReady','__sngamerCampaignBannerReady','__sngamerPromoHeroReady','__sngamerAnnouncementReady'];
    function ready(){
      return windowLoaded && required.every(function(key){return window[key]===true;});
    }
    function reveal(){
      if(finished)return;
      finished=true;
      requestAnimationFrame(function(){requestAnimationFrame(function(){root.classList.remove('sngamer-refresh-boot','sngamer-refresh-error');});});
    }
    function showFailure(){
      if(finished)return;
      finished=true;
      root.classList.add('sngamer-refresh-error');
      var panel=document.createElement('div');
      panel.id='sngamer-refresh-boot-failure';
      panel.setAttribute('role','alert');
      panel.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:radial-gradient(ellipse at 50% 35%,rgba(20,95,170,.28),transparent 48%),linear-gradient(145deg,#070b13,#0b1423 58%,#120c20);color:#f3f7ff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;text-align:center';
      panel.innerHTML='<div style="max-width:380px"><div style="font-size:22px;font-weight:900;letter-spacing:.5px">SNGAMER STORE</div><p style="color:#b7c5d9;line-height:1.6;margin:14px 0 20px">La boutique n’a pas pu terminer son chargement. Réessaie pour afficher la version à jour.</p><button type="button" style="border:0;border-radius:12px;padding:13px 22px;background:linear-gradient(120deg,#167dff,#743bff,#d52db4);color:white;font-weight:900;font-size:15px" id="sngamer-refresh-retry">Réessayer</button></div>';
      panel.querySelector('#sngamer-refresh-retry').addEventListener('click',function(){location.reload();});
      root.appendChild(panel);
    }
    function check(){
      if(finished)return;
      if(ready()){
        if(!stableSince)stableSince=Date.now();
        // Allow the campaign API render, announcement carousel and injected hero styles to settle together.
        if(Date.now()-stableSince>=900){reveal();return;}
      }else{
        stableSince=0;
      }
      if(Date.now()-started>=20000){showFailure();return;}
      setTimeout(check,50);
    }
    window.addEventListener('load',function(){windowLoaded=true;},{once:true});
    if(windowLoaded) setTimeout(check,0); else window.addEventListener('DOMContentLoaded',function(){setTimeout(check,0);},{once:true});
    check();
  }catch(_){
    // If the guard itself fails, fail open only after the real load event.
    window.addEventListener('load',function(){document.documentElement.classList.remove('sngamer-refresh-boot','sngamer-refresh-error');},{once:true});
  }
})();</script>`;

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
