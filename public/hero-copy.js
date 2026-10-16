/* SNGAMER STORE — texte commercial du Hero */
(function(){
  "use strict";

  const copy = "Choisis ton produit. Commande en quelques clics. Livraison partout au Sénégal et dans toute la sous-région.";

  function apply(){
    const hero = document.querySelector(".hero");
    const paragraph = hero && hero.querySelector(".heroIn > div:first-child p");
    if(paragraph && paragraph.textContent !== copy){
      paragraph.textContent = copy;
    }
  }

  function start(){
    apply();
    const hero = document.querySelector(".hero");
    if(hero){
      const observer = new MutationObserver(apply);
      observer.observe(hero,{subtree:true,childList:true,characterData:true});
    }
    setInterval(apply,1000);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }
})();
