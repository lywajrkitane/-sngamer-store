/* SNGAMER STORE — gestion du Hero avec ou sans campagne active */
(function(){
  "use strict";

  function syncPromoHero(){
    const area = document.getElementById("promoArea");
    const carousel = document.getElementById("promoCarousel");
    const dots = document.getElementById("promoDots");
    const fallback = document.getElementById("defaultHeroContent");
    const title = document.getElementById("promoCampaignTitle");

    if(!area || !carousel || !dots || !fallback) return;

    const slides = Array.from(carousel.querySelectorAll(".promoSlide"));
    const activeSlides = slides.filter(slide => {
      const visible = getComputedStyle(slide).display !== "none";
      return visible && slide.children.length > 0;
    });

    const hasActivePromo = activeSlides.length > 0;

    carousel.style.display = hasActivePromo ? "block" : "none";
    fallback.style.display = hasActivePromo ? "none" : "flex";

    if(title){
      title.style.display = hasActivePromo && title.textContent.trim() ? "flex" : "none";
    }

    if(hasActivePromo && activeSlides.length > 1){
      dots.style.display = "flex";
    }else{
      dots.style.display = "none";
    }

    area.classList.toggle("has-active-promo", hasActivePromo);
    area.classList.toggle("has-default-hero", !hasActivePromo);
  }

  function start(){
    syncPromoHero();

    const carousel = document.getElementById("promoCarousel");
    if(carousel){
      const observer = new MutationObserver(syncPromoHero);
      observer.observe(carousel, {
        childList:true,
        subtree:true,
        attributes:true,
        attributeFilter:["style"]
      });
    }

    const dots = document.getElementById("promoDots");
    if(dots){
      const dotsObserver = new MutationObserver(syncPromoHero);
      dotsObserver.observe(dots, {childList:true,subtree:true});
    }

    let attempts = 0;
    const timer = setInterval(function(){
      syncPromoHero();
      attempts++;
      if(attempts >= 30) clearInterval(timer);
    }, 250);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", start, {once:true});
  }else{
    start();
  }

  window.syncPromoHero = syncPromoHero;
})();
