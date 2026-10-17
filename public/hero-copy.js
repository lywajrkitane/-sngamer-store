/* SNGAMER STORE — services complémentaires du Hero */
(function(){
  "use strict";

  // Le contenu du Hero est désormais piloté par promo-fix.js.
  // Ce fichier ne réécrit plus le paragraphe du Hero afin de ne pas
  // annuler le rendu premium du slogan « TON SETUP. TON GAME. TON STYLE. ».

  function loadProductStability(){
    if(document.querySelector('script[data-sngamer-product-stability]')) return;
    const script=document.createElement("script");
    script.src="product-stability.js";
    script.defer=true;
    script.dataset.sngamerProductStability="true";
    document.body.appendChild(script);
  }

  function loadCustomerAccount(){
    if(document.querySelector('script[data-sngamer-customer-account]')) return;
    const script=document.createElement("script");
    script.src="customer-account.js";
    script.defer=true;
    script.dataset.sngamerCustomerAccount="true";
    document.body.appendChild(script);
  }

  function start(){
    loadProductStability();
    loadCustomerAccount();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }
})();
