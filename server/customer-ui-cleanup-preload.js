const express = require("express");

const originalHandle = express.application.handle;

const CLIENT_SCRIPT = [
  '<script id="sngamer-client-cleanup">',
  '(function(){',
  '  "use strict";',
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
  '    const nativeLoad=window.load;let inFlight=null;let startedAt=0;',
  '    window.load=function(){',
  '      const now=Date.now();if(inFlight&&now-startedAt<8000)return inFlight;startedAt=now;',
  '      try{inFlight=Promise.resolve(nativeLoad.apply(this,arguments)).finally(function(){if(Date.now()-startedAt<8000)inFlight=null});}catch(error){inFlight=null;throw error}',
  '      window.setTimeout(function(){if(inFlight&&Date.now()-startedAt>=8000)inFlight=null},8500);return inFlight;',
  '    };',
  '    [1500,3500,7000].forEach(function(delay){window.setTimeout(function(){const grid=document.getElementById("products");if(!Array.isArray(window.storeProducts)&&!(grid&&grid.querySelector(".productCardClickable"))&&!inFlight)window.load()},delay)});',
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
  '  function boot(){installCategoryCleanup();installStoreLoadGuard();cleanProfile();const profile=document.getElementById("profileArea");if(profile&&!profile.dataset.sngCleanupObserver){profile.dataset.sngCleanupObserver="1";new MutationObserver(cleanProfile).observe(profile,{childList:true,subtree:true})}setInterval(cleanProfile,2500)}',
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
