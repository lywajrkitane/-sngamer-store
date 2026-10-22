/* SNGAMER STORE — hero loader */
(function(){
  "use strict";
  function loadOnce(selector,src,dataKey){
    if(document.querySelector(selector)) return;
    const script=document.createElement("script");script.src=src;script.defer=true;script.dataset[dataKey]="true";document.body.appendChild(script);
  }
  function start(){
    loadOnce('script[data-sngamer-customer-account]','/customer-account.js?v=20261019-1025','sngamerCustomerAccount');
    loadOnce('script[data-sngamer-hero-media-v8]','/hero-media-v4.js?v=20261022-dashboardhero1','sngamerHeroMediaV8');
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
