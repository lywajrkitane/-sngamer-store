/* SNGAMER STORE — auxiliaires clients uniquement.
   Le HERO principal est maintenant géré de façon persistante par promo-fix.js.
   Ne pas charger l'ancien hero-media-v4.js, qui modifiait le HERO après son rendu. */
(function(){
  "use strict";
  function loadOnce(selector,src,dataKey){
    if(document.querySelector(selector)) return;
    const script=document.createElement("script");
    script.src=src;
    script.defer=true;
    script.dataset[dataKey]="true";
    document.body.appendChild(script);
  }
  function start(){
    loadOnce('script[data-sngamer-customer-account]','/customer-account.js?v=20261019-1025','sngamerCustomerAccount');
    loadOnce('script[data-sngamer-home-hero]','/home-hero.js?v=20261024-dynamic-home-hero1','sngamerHomeHero');
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
