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
  function start(){
    loadOnce('script[data-sngamer-customer-account]','/customer-account.js?v=20261027-profile-catalog-stability1','sngamerCustomerAccount');
    loadOnce('script[data-sngamer-home-hero]','/home-hero.js?v=20261024-dynamic-home-hero3','sngamerHomeHero');
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
