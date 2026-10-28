const express = require("express");

const originalHandle = express.application.handle;

const CLIENT_SCRIPT = [
  '<script id="sngamer-client-cleanup">',
  '(function(){',
  '  "use strict";',
  '  function installHomePriceColorFix(){',
  '    if(document.getElementById("sngHomePriceColorFix")) return;',
  '    const style=document.createElement("style");',
  '    style.id="sngHomePriceColorFix";',
  '    style.textContent="#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent{color:#FFD300 !important;text-shadow:0 0 12px rgba(255,211,0,.12) !important}#products .card.productCardClickable .info .productCardPurchaseRow .priceCurrent small{color:#aebacc !important;text-shadow:none !important}";',
  '    document.head.appendChild(style);',
  '  }',
  '  function cleanCategories(){',
  '    const area=document.getElementById("cats");if(!area)return;',
  '    area.querySelectorAll(".catbtn").forEach(function(button){',
  '      const text=(button.textContent||"").trim();',
  '      if(text==="Coins"||text==="Coins / Pièces eFootball")button.textContent="Pièces eFootball";',
  '    });',
  '  }',
  '  function installCategoryCleanup(){',
  '    if(window.__sngCategoryCleanupInstalled)return;',
  '    const start=function(){',
  '      const area=document.getElementById("cats");',
  '      if(!area){window.setTimeout(start,100);return;}',
  '      cleanCategories();',
  '      const observer=new MutationObserver(cleanCategories);',
  '      observer.observe(area,{childList:true,subtree:true,characterData:true});',
  '      window.__sngCategoryCleanupInstalled=true;',
  '    };',
  '    start();',
  '  }',
  '  function installStoreLoadGuard(){',
  '    if(window.__sngStoreLoadGuardInstalled||typeof window.load!=="function") return;',
  '    window.__sngStoreLoadGuardInstalled=true;',
  '    const nativeLoad=window.load;let inFlight=null;let startedAt=0;const MAX_FLIGHT_MS=12000;',
  '    const hasCatalog=function(){return Array.isArray(window.storeProducts)&&window.storeProducts.length>0;};',
  '    const hasCards=function(){const grid=document.getElementById("products");return !!(grid&&grid.querySelector(".productCardClickable"));};',
  '    const clearTransientError=function(){',
  '      const grid=document.getElementById("products");if(!grid||hasCards())return;',
  '      const text=String(grid.textContent||"").toLowerCase();',
  '      if(text.includes("catalogue est temporairement indisponible")||text.includes("catalogue temporairement indisponible"))grid.replaceChildren();',
  '    };',
  '    const needsRecovery=function(){return window.activeStoreSection!=="profile"&&!hasCatalog()&&!hasCards();};',
  '    window.load=function(){',
  '      const now=Date.now();if(inFlight&&now-startedAt<MAX_FLIGHT_MS)return inFlight;',
  '      startedAt=now;clearTransientError();',
  '      try{',
  '        inFlight=Promise.resolve(nativeLoad.apply(this,arguments)).finally(function(){if(Date.now()-startedAt<MAX_FLIGHT_MS)inFlight=null});',
  '      }catch(error){inFlight=null;throw error}',
  '      window.setTimeout(function(){if(inFlight&&Date.now()-startedAt>=MAX_FLIGHT_MS)inFlight=null},MAX_FLIGHT_MS+500);',
  '      return inFlight;',
  '    };',
  '    const recover=function(){',
  '      if(!needsRecovery()||inFlight)return;',
  '      clearTransientError();',
  '      try{Promise.resolve(window.load()).catch(function(error){console.error("SNGAMER_CATALOG_RECOVERY_ERROR",error);});}catch(error){console.error("SNGAMER_CATALOG_RECOVERY_THROW",error);}',
  '    };',
  '    [0,250,750,1500,3000,6000,10000,14000].forEach(function(delay){window.setTimeout(recover,delay);});',
  '  }',
  '  function cleanProfile(){',
  '    const profile=document.getElementById("profileArea");if(!profile)return;',
  '    profile.querySelectorAll(".sgaOrder").forEach(function(card){',
  '      card.querySelectorAll(".sgaOrder *").forEach(function(el){',
  '        const text=(el.textContent||"").replace(/\\s+/g," ").trim();',
  '        if(/^💬?\\s*Bien reçu$/i.test(text))el.style.display="none";',
  '      });',
  '    });',
  '  }',
  '  function boot(){installHomePriceColorFix();installCategoryCleanup();installStoreLoadGuard();cleanProfile();const profile=document.getElementById("profileArea");if(profile&&!profile.dataset.sngCleanupObserver){profile.dataset.sngCleanupObserver="1";new MutationObserver(cleanProfile).observe(profile,{childList:true,subtree:true})}setInterval(cleanProfile,2500)}',
  '  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();',
  '})();',
  '</script>'
].join("\\n");

express.application.handle=function(req,res){
  if(!res||typeof res.send!=="function")return originalHandle.call(this,req,res);
  const originalSend=res.send.bind(res);
  res.send=function(body){
    if((req.path==="/"||req.path==="/index.html")&&typeof body==="string"&&body.includes("</body>"))body=body.replace("</body>",CLIENT_SCRIPT+"</body>");
    return originalSend(body);
  };
  return originalHandle.call(this,req,res);
};
