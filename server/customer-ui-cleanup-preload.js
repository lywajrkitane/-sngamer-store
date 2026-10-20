const express = require("express");

// SNGAMER STORE — narrowly scoped storefront/profile cleanup.
// This preload only decorates existing HTML responses; it does not alter business logic.
// Important: patch Express's response prototype, not application.handle's raw Node response.
const originalSend = express.response.send;

const CLIENT_SCRIPT = [
  '<script id="sngamer-client-cleanup">',
  '(function(){',
  '  "use strict";',
  '  function installPriceStyle(){',
  '    if(document.getElementById("sngPremiumPriceStyle")) return;',
  '    const style=document.createElement("style");',
  '    style.id="sngPremiumPriceStyle";',
  '    style.textContent=""+',
  '      "#products .card.productCardClickable .priceCurrent{"+',
  '        "color:#63d9ff !important;"+',
  '        "text-shadow:0 0 14px rgba(68,200,255,.18);"+',
  '      "}"+',
  '      "#products .card.productCardClickable .priceCurrent small{"+',
  '        "color:#a9b9ca !important;"+',
  '        "text-shadow:none;"+',
  '      "}";',
  '    document.head.appendChild(style);',
  '  }',
  '',
  '  function cleanProfile(){',
  '    const profile=document.getElementById("profileArea");',
  '    if(!profile) return;',
  '    profile.querySelectorAll(".sngCustomerOrderNotice .sngCustomerOrderTracking").forEach(el=>el.remove());',
  '    profile.querySelectorAll(".sgaOrder *").forEach(el=>{',
  '      if(el.closest(".sngCustomerOrderNotice,.sngTracking")) return;',
  '      if(el.children.length) return;',
  '      const text=(el.textContent||"").replace(/\\s+/g," ").trim();',
  '      if(/^🚚?\\s*Suivi\\s*[·:]\\s*.+$/i.test(text) || /^💬?\\s*Bien reçu$/i.test(text)){',
  '        el.style.display="none";',
  '      }',
  '    });',
  '  }',
  '',
  '  function boot(){',
  '    installPriceStyle();',
  '    cleanProfile();',
  '    const profile=document.getElementById("profileArea");',
  '    if(profile && !profile.dataset.sngCleanupObserver){',
  '      profile.dataset.sngCleanupObserver="1";',
  '      new MutationObserver(()=>cleanProfile()).observe(profile,{childList:true,subtree:true});',
  '    }',
  '    setInterval(cleanProfile,2500);',
  '  }',
  '',
  '  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});',
  '  else boot();',
  '})();',
  '</script>'
].join("\\n");

express.response.send = function sngamerUiCleanupSend(body){
  const req = this.req;
  if(req && (req.path === "/" || req.path === "/index.html") && typeof body === "string" && body.includes("</body>")){
    body = body.replace("</body>", CLIENT_SCRIPT + "</body>");
  }
  return originalSend.call(this, body);
};
