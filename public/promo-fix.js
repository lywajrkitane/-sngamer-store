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
    if(description){
      description.innerHTML = "TON SETUP.<br><span>TON GAME.</span><br><span>TON STYLE.</span>";
      description.classList.add("heroSlogan");
      description.setAttribute("aria-label","TON SETUP. TON GAME. TON STYLE.");
    }
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
      .professional-hero .heroIn > div:first-child p.heroSlogan{
        margin:24px 0 28px;
        max-width:620px;
        font-family:Montserrat,Arial,sans-serif;
        font-size:clamp(25px,4vw,44px);
        line-height:.98;
        font-weight:900;
        letter-spacing:-1.4px;
        text-transform:uppercase;
        color:#f7f9ff;
        text-shadow:0 10px 35px rgba(0,0,0,.28);
      }
      .professional-hero .heroIn > div:first-child p.heroSlogan span{
        display:inline-block;
        background:linear-gradient(90deg,#4da3ff 0%,#8b5cf6 52%,#ec2aa4 100%);
        -webkit-background-clip:text;
        background-clip:text;
        color:transparent;
      }
      .professional-hero .heroVisual.has-default-hero{display:flex;align-items:center;justify-content:center;min-height:360px;font-size:initial;text-shadow:none}
      .professional-hero .defaultHeroContent{width:min(100%,520px);min-height:300px;padding:42px 38px;display:flex;flex-direction:column;justify-content:center;text-align:center;border:1px solid rgba(74,157,255,.28);border-radius:26px;background:radial-gradient(circle at 15% 15%,rgba(22,135,255,.18),transparent 34%),radial-gradient(circle at 90% 85%,rgba(233,30,99,.12),transparent 36%),linear-gradient(145deg,rgba(12,24,42,.96),rgba(8,12,22,.98));box-shadow:0 24px 55px rgba(0,0,0,.28),0 0 35px rgba(22,135,255,.08)}
      .professional-hero .heroTrustBadge{align-self:center;padding:9px 16px;border:1px solid rgba(74,157,255,.35);border-radius:999px;color:#8fc7ff;background:rgba(22,135,255,.08);font-size:11px;font-weight:900;letter-spacing:2px;text-transform:uppercase}
      .professional-hero .defaultHeroContent h2{margin:22px 0 12px;color:#fff;font-family:Montserrat,Arial,sans-serif;font-size:clamp(28px,4vw,42px);line-height:1.08;font-weight:900;letter-spacing:-.5px}
      .professional-hero .heroTrustProducts{margin:0 auto 24px;color:#b9c6d7;font-size:15px;line-height:1.6;font-weight:700}
      .professional-hero .heroTrustProducts span{color:#4ea2ff;padding:0 5px}
      .professional-hero .heroDelivery{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:13px 15px;border-radius:13px;background:rgba(22,135,255,.08);border:1px solid rgba(74,157,255,.18);color:#8fc7ff;font-size:13px;line-height:1.4;font-weight:800}
      .professional-hero .heroDeliveryIcon{font-size:18px}
      @media(max-width:900px){
        .professional-hero .heroVisual.has-default-hero{min-height:0;margin-top:18px}
        .professional-hero .heroIn > div:first-child p.heroSlogan{font-size:clamp(24px,7vw,34px);line-height:1.02;letter-spacing:-.8px;margin:20px 0 24px}
      }
      @media(max-width:560px){
        .professional-hero .heroIn > div:first-child p.heroSlogan{font-size:27px;line-height:1.03;margin:18px 0 22px}
        .professional-hero .defaultHeroContent{min-height:280px;padding:30px 20px;border-radius:22px}
        .professional-hero .heroTrustBadge{font-size:9px;letter-spacing:1.5px}
        .professional-hero .defaultHeroContent h2{font-size:27px}
        .professional-hero .heroTrustProducts{font-size:13px}
        .professional-hero .heroDelivery{font-size:12px}
      }
    `;
    document.head.appendChild(style);
  }

  function injectProductDetailTransition(){
    if(document.getElementById("sngamerProductDetailTransitionStyles")) return;

    const style = document.createElement("style");
    style.id = "sngamerProductDetailTransitionStyles";
    style.textContent = `
      /* =========================================================
         SNGAMER STORE — transition premium fiche produit
         Entrée douce depuis la grille vers les détails du produit.
         ========================================================= */
      #productModal{
        background:rgba(0,0,0,.72);
        backdrop-filter:blur(4px);
      }

      #productModal.show{
        animation:sngProductBackdropIn .28s ease-out both;
      }

      #productModal.show .productBox{
        transform-origin:center center;
        animation:sngProductModalIn .46s cubic-bezier(.22,1,.36,1) both;
        will-change:transform,opacity;
      }

      #productModal.show .productMainImage{
        animation:sngProductImageIn .55s cubic-bezier(.22,1,.36,1) .06s both;
      }

      #productModal.show .productInfo{
        animation:sngProductInfoIn .48s cubic-bezier(.22,1,.36,1) .09s both;
      }

      #productModal.show .productThumbnails{
        animation:sngProductThumbsIn .4s ease-out .14s both;
      }

      @keyframes sngProductBackdropIn{
        from{opacity:0}
        to{opacity:1}
      }

      @keyframes sngProductModalIn{
        from{
          opacity:0;
          transform:translate3d(0,18px,0) scale(.965);
        }
        to{
          opacity:1;
          transform:translate3d(0,0,0) scale(1);
        }
      }

      @keyframes sngProductImageIn{
        from{
          opacity:0;
          transform:scale(.97);
        }
        to{
          opacity:1;
          transform:scale(1);
        }
      }

      @keyframes sngProductInfoIn{
        from{
          opacity:0;
          transform:translate3d(12px,0,0);
        }
        to{
          opacity:1;
          transform:translate3d(0,0,0);
        }
      }

      @keyframes sngProductThumbsIn{
        from{opacity:0;transform:translateY(6px)}
        to{opacity:1;transform:translateY(0)}
      }

      @media(max-width:700px){
        #productModal.show .productBox{
          animation:sngProductModalMobileIn .48s cubic-bezier(.22,1,.36,1) both;
        }

        #productModal.show .productInfo{
          animation:sngProductInfoMobileIn .44s cubic-bezier(.22,1,.36,1) .08s both;
        }

        @keyframes sngProductModalMobileIn{
          from{
            opacity:0;
            transform:translate3d(0,28px,0) scale(.985);
          }
          to{
            opacity:1;
            transform:translate3d(0,0,0) scale(1);
          }
        }

        @keyframes sngProductInfoMobileIn{
          from{
            opacity:0;
            transform:translate3d(0,10px,0);
          }
          to{
            opacity:1;
            transform:translate3d(0,0,0);
          }
        }
      }

      @media(prefers-reduced-motion:reduce){
        #productModal.show,
        #productModal.show .productBox,
        #productModal.show .productMainImage,
        #productModal.show .productInfo,
        #productModal.show .productThumbnails{
          animation:none!important;
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
    const hero = document.querySelector(".hero");

    applyProfessionalHero();
    injectProfessionalHeroStyles();
    injectProductDetailTransition();

    if(!area || !carousel || !dots || !fallback) return;

    const slides = Array.from(carousel.querySelectorAll(".promoSlide"));
    const activeSlides = slides.filter(slide => {
      const visible = getComputedStyle(slide).display !== "none";
      return visible && slide.children.length > 0;
    });
    const hasActivePromo = activeSlides.length > 0;

    /* Sans campagne : supprimer complètement la zone promotionnelle pour que
       la section Produits remonte juste sous le contenu principal du Hero. */
    area.style.display = hasActivePromo ? "flex" : "none";
    carousel.style.display = hasActivePromo ? "block" : "none";
    fallback.style.display = "none";

    if(hero){
      hero.classList.toggle("has-active-promo", hasActivePromo);
      hero.classList.toggle("has-no-promo", !hasActivePromo);
    }

    if(title){
      title.style.display = hasActivePromo && title.textContent.trim() ? "flex" : "none";
    }

    dots.style.display = hasActivePromo && activeSlides.length > 1 ? "flex" : "none";
    area.classList.toggle("has-active-promo", hasActivePromo);
    area.classList.remove("has-default-hero");
  }

  function start(){
    injectProductDetailTransition();
    syncPromoHero();

    const carousel = document.getElementById("promoCarousel");
    if(carousel){
      const observer = new MutationObserver(syncPromoHero);
      observer.observe(carousel,{childList:true,subtree:true,attributes:true,attributeFilter:["style"]});
    }

    const dots = document.getElementById("promoDots");
    if(dots){
      const dotsObserver = new MutationObserver(syncPromoHero);
      dotsObserver.observe(dots,{childList:true,subtree:true});
    }

    let attempts = 0;
    const timer = setInterval(function(){
      syncPromoHero();
      attempts++;
      if(attempts >= 30) clearInterval(timer);
    },250);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }

  window.syncPromoHero = syncPromoHero;
})();
