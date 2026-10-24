/* SNGAMER STORE — auxiliaires clients uniquement.
   Le HERO principal est géré par home-hero.js.
   Les anciens contrôles d’annonce ne doivent plus apparaître dans le HERO. */
(function(){
  "use strict";
  function loadOnce(selector,src,dataKey){
    if(document.querySelector(selector)) return;
    const script=document.createElement("script");
    script.src=src; script.defer=true; script.dataset[dataKey]="true";
    document.body.appendChild(script);
  }
  function cleanLegacyHeroUi(){
    if(!document.getElementById("sngamerLegacyHeroCleanupStyles")){
      const style=document.createElement("style");
      style.id="sngamerLegacyHeroCleanupStyles";
      style.textContent='.professional-hero .sngPromoAnnouncement{display:none!important}.professional-hero .heroAnnouncement:empty{display:block!important;margin:0!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important}';
      document.head.appendChild(style);
    }
    document.querySelectorAll(".professional-hero .sngPromoAnnouncement").forEach(function(el){el.remove();});
    const description=document.querySelector(".professional-hero .heroAnnouncement");
    if(description && !description.closest(".sngHomeHeroWrap")){
      description.innerHTML="";
      description.removeAttribute("aria-label");
    }
  }
  function start(){
    loadOnce('script[data-sngamer-customer-account]','/customer-account.js?v=20261019-1025','sngamerCustomerAccount');
    loadOnce('script[data-sngamer-home-hero]','/home-hero.js?v=20261024-dynamic-home-hero2','sngamerHomeHero');
    cleanLegacyHeroUi();
    let attempts=0;
    const timer=window.setInterval(function(){
      cleanLegacyHeroUi();
      if(++attempts>80) window.clearInterval(timer);
    },250);
    const observer=new MutationObserver(function(){cleanLegacyHeroUi();});
    observer.observe(document.body,{childList:true,subtree:true});
    window.setTimeout(function(){observer.disconnect();},22000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
