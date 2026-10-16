/* SNGAMER STORE — gestion du Hero avec ou sans campagne active */
(function(){
  "use strict";

  function applyProfessionalHero(){
    const hero = document.querySelector(".hero");
    if(!hero) return;

    const label = hero.querySelector(".heroIn > div:first-child > label");
    const title = hero.querySelector(".heroIn > div:first-child h1");
    const description = hero.querySelector(".heroIn > div:first-child p");
    const button = hero.querySelector(".heroIn > div:first-child .primary");
    const fallback = document.getElementById("defaultHeroContent");

    if(label) label.textContent = "SNGAMER STORE";
    if(title) title.innerHTML = "ÉQUIPE-TOI.<br><span>JOUE. GAGNE.</span>";
    if(description) description.textContent = "Gaming Phones, accessoires gaming et pièces eFootball sélectionnés pour les passionnés.";
    if(button) button.textContent = "Découvrir les produits";

    if(fallback){
      fallback.innerHTML = `
        <div class="heroTrustBadge">✨ SÉLECTION DU MOMENT</div>
        <h2>TON SETUP. TON GAME.<br>TON STYLE.</h2>
        <p class="heroTrustProducts">Gaming Phones <span>•</span> Accessoires gaming <span>•</span> Pièces eFootball</p>
        <div class="heroDelivery"><span class="heroDeliveryIcon">🚚</span><span>Livraison au Sénégal et dans toute la sous-région</span></div>
      `;
    }

    hero.classList.add("professional-hero");
  }

  function injectProfessionalHeroStyles(){
    if(document.getElementById("sngamerProfessionalHeroStyles")) return;

    const style = document.createElement("style");
    style.id = "sngamerProfessionalHeroStyles";
    style.textContent = `
      .professional-hero .heroIn > div:first-child > label{
        color:#55a8ff;
        letter-spacing:3px;
      }

      .professional-hero .heroIn > div:first-child p{
        max-width:590px;
      }

      .professional-hero .heroVisual.has-default-hero{
        display:flex;
        align-items:center;
        justify-content:center;
        min-height:360px;
        font-size:initial;
        text-shadow:none;
      }

      .professional-hero .defaultHeroContent{
        width:min(100%,520px);
        min-height:300px;
        padding:42px 38px;
        display:flex;
        flex-direction:column;
        justify-content:center;
        text-align:center;
        border:1px solid rgba(74,157,255,.28);
        border-radius:26px;
        background:
          radial-gradient(circle at 15% 15%,rgba(22,135,255,.18),transparent 34%),
          radial-gradient(circle at 90% 85%,rgba(233,30,99,.12),transparent 36%),
          linear-gradient(145deg,rgba(12,24,42,.96),rgba(8,12,22,.98));
        box-shadow:0 24px 55px rgba(0,0,0,.28),0 0 35px rgba(22,135,255,.08);
      }

      .professional-hero .heroTrustBadge{
        align-self:center;
        padding:9px 16px;
        border:1px solid rgba(74,157,255,.35);
        border-radius:999px;
        color:#8fc7ff;
        background:rgba(22,135,255,.08);
        font-size:11px;
        font-weight:900;
        letter-spacing:2px;
        text-transform:uppercase;
      }

      .professional-hero .defaultHeroContent h2{
        margin:22px 0 12px;
        color:#fff;
        font-family:Montserrat,Arial,sans-serif;
        font-size:clamp(28px,4vw,42px);
        line-height:1.08;
        font-weight:900;
        letter-spacing:-.5px;
      }

      .professional-hero .heroTrustProducts{
        margin:0 auto 24px;
        color:#b9c6d7;
        font-size:15px;
        line-height:1.6;
        font-weight:700;
      }

      .professional-hero .heroTrustProducts span{
        color:#4ea2ff;
        padding:0 5px;
      }

      .professional-hero .heroDelivery{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:9px;
        width:100%;
        padding:13px 15px;
        border-radius:13px;
        background:rgba(22,135,255,.08);
        border:1px solid rgba(74,157,255,.18);
        color:#8fc7ff;
        font-size:13px;
        line-height:1.4;
        font-weight:800;
      }

      .professional-hero .heroDeliveryIcon{
        font-size:18px;
      }

      @media(max-width:900px){
        .professional-hero .heroVisual.has-default-hero{
          min-height:0;
          margin-top:18px;
        }
      }

      @media(max-width:560px){
        .professional-hero .defaultHeroContent{
          min-height:280px;
          padding:30px 20px;
          border-radius:22px;
        }

        .professional-hero .heroTrustBadge{
          font-size:9px;
          letter-spacing:1.5px;
        }

        .professional-hero .defaultHeroContent h2{
          font-size:27px;
        }

        .professional-hero .heroTrustProducts{
          font-size:13px;
        }

        .professional-hero .heroDelivery{
          font-size:12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function syncPromoHero(){
    const area = document.getElementById("promoArea");
    const carousel = document.getElementById("promoCarousel");
    const dots = document.getElementById("promoDots");
    const fallback = document.getElementById("defaultHeroContent");
    const title = document.getElementById("promoCampaignTitle");

    applyProfessionalHero();
    injectProfessionalHeroStyles();

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
