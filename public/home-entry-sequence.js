/* SNGAMER STORE — ordered home entrance sequence.
   Reveal existing content only; never delays catalogue data or changes layout geometry. */
(function(){
  "use strict";
  if(window.__sngamerHomeEntrySequenceV1)return;
  window.__sngamerHomeEntrySequenceV1=true;
  const root=document.documentElement;
  const reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep=ms=>new Promise(resolve=>window.setTimeout(resolve,ms));
  const visible=el=>!!el&&getComputedStyle(el).display!=="none"&&el.getClientRects().length>0;
  function reveal(el,delay){
    if(!el||el.dataset.sngHomeRevealed==="1"||!visible(el))return false;
    el.dataset.sngHomeRevealed="1";
    el.classList.add("sngHomeRevealItem");
    if(reduceMotion){el.classList.add("sngHomeRevealIn");return true;}
    el.style.setProperty("--sng-home-reveal-delay",Math.max(0,delay||0)+"ms");
    requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add("sngHomeRevealIn")));
    return true;
  }
  function unique(nodes){return Array.from(new Set(nodes.filter(Boolean)));}
  async function run(){
    if(window.activeStoreSection&&window.activeStoreSection!=="home"){root.classList.remove("sng-home-sequence-pending");return;}
    const deadline=Date.now()+2200;
    while(Date.now()<deadline){
      const appReady=window.__sngamerStoreReady===true;
      const promoReady=window.__sngamerPromoHeroReady===true;
      const announcement=document.querySelector(".hero .sngPromoAnnouncement");
      if(appReady&&promoReady&&announcement)break;
      await sleep(70);
    }
    const announcement=document.querySelector(".hero .sngPromoAnnouncement");
    if(reveal(announcement,0))await sleep(150);
    const heroNodes=unique([
      document.querySelector(".hero .sngHomeHeroWrap"),
      document.querySelector(".hero .heroVisual"),
      document.querySelector(".hero .sngPromoHeroCta")
    ]);
    heroNodes.forEach((el,index)=>reveal(el,index*45));
    if(heroNodes.length)await sleep(180);
    const collection=document.getElementById("sectionTitle");
    if(reveal(collection,0))await sleep(115);
    const categories=unique([
      document.getElementById("cats"),
      document.getElementById("navSubcategories")
    ]);
    categories.forEach((el,index)=>reveal(el,index*35));
    if(categories.length)await sleep(135);
    const cards=Array.from(document.querySelectorAll("#products > .productCardClickable"));
    cards.forEach((el,index)=>reveal(el,Math.min(index*34,340)));
    const footer=document.querySelector(".store-footer-content");
    if(footer)reveal(footer,0);
    root.classList.remove("sng-home-sequence-pending");
    window.__sngamerHomeSequenceComplete=true;
    window.dispatchEvent(new CustomEvent("sngamer:home-sequence-complete"));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});else run();
})();