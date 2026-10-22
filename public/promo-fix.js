/* SNGAMER STORE — Hero premium + annonces + retour commande */
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
      description.classList.remove("heroSlogan");
      description.classList.add("heroAnnouncement");
      description.innerHTML = `
        <span class="announcementIcon" aria-hidden="true">👋</span>
        <span class="announcementCopy">
          <strong>BIENVENUE CHEZ SNGAMER</strong>
          <span>Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui.</span>
        </span>
        <span class="announcementDots" aria-hidden="true"><i class="active"></i><i></i><i></i><i></i></span>
      `;
      description.setAttribute("aria-label","Bienvenue chez SNGAMER. Merci de nous rendre visite aujourd’hui.");
    }

    if(button) button.textContent = "Découvrir les produits";

    if(fallback){
      fallback.innerHTML = `
        <div class="heroTrustBadge">✨ SÉLECTION DU MOMENT</div>
        <h2>TON SETUP. TON GAME.<br>TON STYLE.</h2>
        <p class="heroTrustProducts">Univers Gaming <span>•</span> Accessoires gaming <span>•</span> Pièces eFootball</p>
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
      .professional-hero .heroIn > div:first-child > label{color:#55a8ff;letter-spacing:3px}

      .professional-hero .heroIn > div:first-child p.heroAnnouncement{
        display:flex;
        align-items:center;
        gap:14px;
        width:min(100%,630px);
        box-sizing:border-box;
        margin:26px 0 28px;
        padding:15px 17px;
        border:1px solid rgba(74,157,255,.28);
        border-radius:18px;
        background:linear-gradient(135deg,rgba(12,30,55,.88),rgba(10,16,29,.94));
        box-shadow:0 16px 38px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.035),0 0 28px rgba(22,135,255,.07);
        color:#fff;
        text-transform:none;
        font-family:Inter,Arial,sans-serif;
        font-size:15px;
        line-height:1.35;
        font-weight:700;
        letter-spacing:0;
        text-shadow:none;
      }

      .professional-hero .heroAnnouncement .announcementIcon{
        flex:0 0 48px;
        width:48px;
        height:48px;
        display:grid;
        place-items:center;
        border-radius:14px;
        background:linear-gradient(135deg,#167cff,#8b36f5 62%,#e91e9a);
        box-shadow:0 8px 22px rgba(22,124,255,.24);
        font-size:24px;
      }

      .professional-hero .heroAnnouncement .announcementCopy{
        min-width:0;
        flex:1 1 auto;
        display:flex;
        flex-direction:column;
        gap:3px;
      }

      .professional-hero .heroAnnouncement .announcementCopy strong{
        color:#72b8ff;
        font-size:10px;
        line-height:1.2;
        font-weight:900;
        letter-spacing:2px;
        text-transform:uppercase;
      }

      .professional-hero .heroAnnouncement .announcementCopy span{
        color:#f4f7ff;
        font-size:15px;
        line-height:1.35;
        font-weight:800;
      }

      .professional-hero .heroAnnouncement .announcementDots{
        flex:0 0 auto;
        display:flex;
        align-items:center;
        gap:6px;
      }

      .professional-hero .heroAnnouncement .announcementDots i{
        display:block;
        width:7px;
        height:7px;
        border-radius:999px;
        background:#43526a;
      }

      .professional-hero .heroAnnouncement .announcementDots i.active{
        width:25px;
        background:linear-gradient(90deg,#4da3ff,#d92aa8);
      }

      .professional-hero .heroVisual.has-default-hero{display:flex;align-items:center;justify-content:center;min-height:360px;font-size:initial;text-shadow:none}
      .professional-hero .defaultHeroContent{width:min(100%,520px);min-height:300px;padding:42px 38px;display:flex;flex-direction:column;justify-content:center;text-align:center;border:1px solid rgba(74,157,255,.28);border-radius:26px;background:radial-gradient(circle at 15% 15%,rgba(22,135,255,.18),transparent 34%),radial-gradient(circle at 90% 85%,rgba(233,30,99,.12),transparent 36%),linear-gradient(145deg,rgba(12,24,42,.96),rgba(8,12,22,.98));box-shadow:0 24px 55px rgba(0,0,0,.28),0 0 35px rgba(22,135,255,.08)}
      .professional-hero .heroTrustBadge{align-self:center;padding:9px 16px;border:1px solid rgba(74,157,255,.35);border-radius:999px;color:#8fc7ff;background:rgba(22,135,255,.08);font-size:11px;font-weight:900;letter-spacing:2px;text-transform:uppercase}
      .professional-hero .defaultHeroContent h2{margin:22px 0 12px;color:#fff;font-family:Montserrat,Arial,sans-serif;font-size:clamp(28px,4vw,42px);line-height:1.08;font-weight:900;letter-spacing:-.5px}
      .professional-hero .heroTrustProducts{margin:0 auto 24px;color:#b9c6d7;font-size:15px;line-height:1.6;font-weight:700}
      .professional-hero .heroTrustProducts span{color:#4ea2ff;padding:0 5px}
      .professional-hero .heroDelivery{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:13px 15px;border-radius:13px;background:rgba(22,135,255,.08);border:1px solid rgba(74,157,255,.18);color:#8fc7ff;font-size:13px;line-height:1.4;font-weight:800}
      .professional-hero .heroDeliveryIcon{font-size:18px}

      .sngOrderSuccessToast{
        position:fixed;
        left:50%;
        bottom:calc(24px + env(safe-area-inset-bottom));
        z-index:50000;
        width:min(92vw,520px);
        transform:translate(-50%,18px) scale(.97);
        opacity:0;
        pointer-events:none;
        display:flex;
        align-items:center;
        gap:13px;
        padding:15px 17px;
        border:1px solid rgba(74,157,255,.35);
        border-radius:17px;
        background:linear-gradient(135deg,rgba(8,19,35,.97),rgba(12,11,28,.97));
        box-shadow:0 22px 55px rgba(0,0,0,.42),0 0 30px rgba(22,135,255,.12);
        color:#fff;
        transition:opacity .25s ease,transform .35s cubic-bezier(.22,1,.36,1);
      }
      .sngOrderSuccessToast.show{opacity:1;transform:translate(-50%,0) scale(1)}
      .sngOrderSuccessToast .toastIcon{flex:0 0 42px;width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(135deg,#16c784,#1687ff);font-size:21px}
      .sngOrderSuccessToast .toastCopy{min-width:0;display:flex;flex-direction:column;gap:3px}
      .sngOrderSuccessToast strong{font-size:13px;color:#79c3ff;letter-spacing:.5px}
      .sngOrderSuccessToast span{font-size:14px;line-height:1.35;color:#eef4ff;font-weight:750}

      @media(max-width:900px){
        .professional-hero .heroVisual.has-default-hero{min-height:0;margin-top:18px}
      }

      @media(max-width:560px){
        .professional-hero .heroIn > div:first-child p.heroAnnouncement{width:100%;margin:18px 0 22px;padding:13px 12px;gap:11px;border-radius:16px}
        .professional-hero .heroAnnouncement .announcementIcon{flex-basis:42px;width:42px;height:42px;border-radius:12px;font-size:21px}
        .professional-hero .heroAnnouncement .announcementCopy strong{font-size:9px;letter-spacing:1.5px}
        .professional-hero .heroAnnouncement .announcementCopy span{font-size:13px;line-height:1.32}
        .professional-hero .heroAnnouncement .announcementDots{gap:5px}
        .professional-hero .heroAnnouncement .announcementDots i{width:6px;height:6px}
        .professional-hero .heroAnnouncement .announcementDots i.active{width:20px}
        .professional-hero .defaultHeroContent{min-height:280px;padding:30px 20px;border-radius:22px}
        .professional-hero .heroTrustBadge{font-size:9px;letter-spacing:1.5px}
        .professional-hero .defaultHeroContent h2{font-size:27px}
        .professional-hero .heroTrustProducts{font-size:13px}
        .professional-hero .heroDelivery{font-size:12px}
        .sngOrderSuccessToast{bottom:calc(82px + env(safe-area-inset-bottom));width:calc(100vw - 28px)}
      }
    `;
    document.head.appendChild(style);
  }

  function injectProductDetailTransition(){
    if(document.getElementById("sngamerProductDetailTransitionStyles")) return;

    const style = document.createElement("style");
    style.id = "sngamerProductDetailTransitionStyles";
    style.textContent = `
      #productModal{background:rgba(0,0,0,.72);backdrop-filter:blur(4px)}
      #productModal.show{animation:sngProductBackdropIn .28s ease-out both}
      #productModal.show .productBox{transform-origin:center center;animation:sngProductModalIn .46s cubic-bezier(.22,1,.36,1) both;will-change:transform,opacity}
      #productModal.show .productMainImage{animation:sngProductImageIn .55s cubic-bezier(.22,1,.36,1) .06s both}
      #productModal.show .productInfo{animation:sngProductInfoIn .48s cubic-bezier(.22,1,.36,1) .09s both}
      #productModal.show .productThumbnails{animation:sngProductThumbsIn .4s ease-out .14s both}
      @keyframes sngProductBackdropIn{from{opacity:0}to{opacity:1}}
      @keyframes sngProductModalIn{from{opacity:0;transform:translate3d(0,18px,0) scale(.965)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}
      @keyframes sngProductImageIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
      @keyframes sngProductInfoIn{from{opacity:0;transform:translate3d(12px,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}
      @keyframes sngProductThumbsIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      @media(max-width:700px){
        #productModal.show .productBox{animation:sngProductModalMobileIn .48s cubic-bezier(.22,1,.36,1) both}
        #productModal.show .productInfo{animation:sngProductInfoMobileIn .44s cubic-bezier(.22,1,.36,1) .08s both}
        @keyframes sngProductModalMobileIn{from{opacity:0;transform:translate3d(0,28px,0) scale(.985)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}
        @keyframes sngProductInfoMobileIn{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:translate3d(0,0,0)}}
      }
      @media(prefers-reduced-motion:reduce){#productModal.show,#productModal.show .productBox,#productModal.show .productMainImage,#productModal.show .productInfo,#productModal.show .productThumbnails{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function showOrderSuccessToast(orderId){
    let toast=document.getElementById("sngOrderSuccessToast");
    if(!toast){
      toast=document.createElement("div");
      toast.id="sngOrderSuccessToast";
      toast.className="sngOrderSuccessToast";
      toast.setAttribute("role","status");
      toast.setAttribute("aria-live","polite");
      toast.innerHTML=`<span class="toastIcon">✓</span><span class="toastCopy"><strong>COMMANDE VALIDÉE</strong><span>Merci pour ta confiance. Ta commande${orderId ? ` <b>#${String(orderId).replace(/[<>]/g,"")}</b>` : ""} a bien été enregistrée.</span></span>`;
      document.body.appendChild(toast);
    }
    toast.classList.remove("show");
    requestAnimationFrame(()=>toast.classList.add("show"));
    clearTimeout(window.__sngOrderToastTimer);
    window.__sngOrderToastTimer=setTimeout(()=>toast.classList.remove("show"),6500);
  }

  function installOrderSuccessHook(){
    if(window.__sngOrderSuccessHookInstalled) return;
    const originalFetch=window.fetch;
    if(typeof originalFetch!=="function") return;
    window.fetch=function(input,init){
      const url=typeof input==="string" ? input : (input && input.url) || "";
      const method=((init && init.method) || (input && input.method) || "GET").toUpperCase();
      const request=originalFetch.apply(this,arguments);
      if(method==="POST" && url.includes("/api/orders")){
        request.then(response=>{
          if(!response.ok) return;
          response.clone().json().then(data=>showOrderSuccessToast(data && data.orderId)).catch(()=>showOrderSuccessToast());
        }).catch(()=>{});
      }
      return request;
    };
    window.__sngOrderSuccessHookInstalled=true;
  }

  function syncPromoHero(){
    const area=document.getElementById("promoArea");
    const carousel=document.getElementById("promoCarousel");
    const dots=document.getElementById("promoDots");
    const fallback=document.getElementById("defaultHeroContent");
    const title=document.getElementById("promoCampaignTitle");
    const hero=document.querySelector(".hero");

    applyProfessionalHero();
    injectProfessionalHeroStyles();
    injectProductDetailTransition();
    installOrderSuccessHook();

    if(!area || !carousel || !dots || !fallback) return;

    const slides=Array.from(carousel.querySelectorAll(".promoSlide"));
    const activeSlides=slides.filter(slide=>getComputedStyle(slide).display!=="none" && slide.children.length>0);
    const hasActivePromo=activeSlides.length>0;

    area.style.display=hasActivePromo ? "flex" : "none";
    carousel.style.display=hasActivePromo ? "block" : "none";
    fallback.style.display="none";

    if(hero){
      hero.classList.toggle("has-active-promo",hasActivePromo);
      hero.classList.toggle("has-no-promo",!hasActivePromo);
    }

    if(title) title.style.display=hasActivePromo && title.textContent.trim() ? "flex" : "none";
    dots.style.display=hasActivePromo && activeSlides.length>1 ? "flex" : "none";
    area.classList.toggle("has-active-promo",hasActivePromo);
    area.classList.remove("has-default-hero");
  }

  function start(){
    injectProductDetailTransition();
    injectProfessionalHeroStyles();
    installOrderSuccessHook();
    syncPromoHero();

    const carousel=document.getElementById("promoCarousel");
    if(carousel){
      const observer=new MutationObserver(syncPromoHero);
      observer.observe(carousel,{childList:true,subtree:true,attributes:true,attributeFilter:["style"]});
    }

    const dots=document.getElementById("promoDots");
    if(dots){
      const dotsObserver=new MutationObserver(syncPromoHero);
      dotsObserver.observe(dots,{childList:true,subtree:true});
    }

    let attempts=0;
    const timer=setInterval(function(){
      syncPromoHero();
      attempts++;
      if(attempts>=30) clearInterval(timer);
    },250);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();

  window.syncPromoHero=syncPromoHero;
  window.showSngOrderSuccessToast=showOrderSuccessToast;
})();