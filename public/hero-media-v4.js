/* SNGAMER STORE — restauration du HERO promotionnel existant.
   Ne remplace pas le système de promotions : il remet uniquement
   la présentation d'origine avec le bouton d'annonce au-dessus. */
(function(){
  "use strict";
  if(window.__sngamerPromoHeroRestore) return;
  window.__sngamerPromoHeroRestore = true;

  function addStyles(){
    if(document.getElementById("sngPromoHeroRestoreStyles")) return;
    const style=document.createElement("style");
    style.id="sngPromoHeroRestoreStyles";
    style.textContent=`
      /* Hero mobile/desktop: conserver le petit SNGAMER STORE, supprimer uniquement le grand slogan. */
      .professional-hero .heroIn > div:first-child h1{display:none!important}
      .professional-hero .heroIn > div:first-child{display:block!important;visibility:visible!important;opacity:1!important}

      /* L'annonce audio doit être ENTRE le petit SNGAMER STORE et la carte BIENVENUE. */
      .sngPromoAnnouncement{width:auto;min-height:42px;display:flex;align-items:center;justify-content:flex-start;margin:6px 0 8px;position:relative;z-index:30}
      .sngPromoAnnouncementButton{width:40px;height:40px;flex:0 0 40px;padding:0;border:1px solid rgba(93,167,255,.55);border-radius:13px;color:#fff;background:linear-gradient(135deg,#147dff 0%,#5b35ff 55%,#d326a8 100%);box-shadow:0 0 20px rgba(42,111,255,.22),inset 0 1px 0 rgba(255,255,255,.2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;position:relative}
      .sngPromoAnnouncementButton svg{width:20px;height:20px;display:block}
      .sngPromoAnnouncementButton::after{content:"";position:absolute;inset:-4px;border-radius:15px;border:1px solid rgba(82,179,255,.38);animation:sngPromoAnnouncementPulse 2.2s ease-out infinite;pointer-events:none}
      .sngPromoAnnouncementButton.is-playing::after{animation:sngPromoAnnouncementPlaying 1s ease-in-out infinite}

      /* CTA petit, à gauche. */
      .sngPromoHeroCta{display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;width:185px!important;max-width:185px!important;height:42px!important;min-height:42px!important;max-height:42px!important;margin:12px 0 0 0!important;padding:8px 12px!important;border:1px solid rgba(110,169,255,.3)!important;border-radius:12px!important;background:linear-gradient(108deg,#287eff 0%,#6448ef 53%,#ce2b91 100%)!important;color:#fff!important;font-size:13px!important;font-weight:850!important;line-height:1.1!important;text-align:center!important;white-space:nowrap!important;box-shadow:0 7px 18px rgba(36,116,255,.12),0 4px 14px rgba(198,40,145,.07)!important;grid-column:1!important;justify-self:start!important}

      /* Ne jamais masquer une promotion active. */
      .hero.has-active-promo #promoArea,
      #promoArea.has-active-promo{display:flex!important}

      @keyframes sngPromoAnnouncementPulse{0%{transform:scale(.96);opacity:.75}70%{transform:scale(1.12);opacity:0}100%{transform:scale(1.12);opacity:0}}
      @keyframes sngPromoAnnouncementPlaying{0%,100%{transform:scale(.96);opacity:.8}50%{transform:scale(1.1);opacity:.15}}

      @media(max-width:700px){
        .professional-hero .heroIn{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important}
        .professional-hero .heroIn > div:first-child{order:1!important;width:100%!important}
        .professional-hero #promoArea{order:2!important;width:100%!important;margin-top:10px!important}
        .professional-hero .sngPromoHeroCta{order:3!important;align-self:flex-start!important;width:185px!important;max-width:185px!important;height:42px!important;min-height:42px!important;max-height:42px!important;margin:12px 0 0 0!important;font-size:13px!important}
        .sngPromoAnnouncement{min-height:42px;margin:4px 0 7px;justify-content:flex-start}
        .sngPromoAnnouncementButton{width:37px;height:37px;flex-basis:37px;border-radius:12px}
        .professional-hero .heroIn > div:first-child label{display:block;margin-bottom:0!important}
      }
      @media(prefers-reduced-motion:reduce){.sngPromoAnnouncementButton::after{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function init(){
    const hero=document.querySelector(".hero");
    const heroIn=hero&&hero.querySelector(".heroIn");
    const promoArea=document.getElementById("promoArea");
    const promoCarousel=document.getElementById("promoCarousel");
    const copy=heroIn&&heroIn.querySelector(":scope > div:first-child");
    if(!hero||!heroIn||!promoArea||!promoCarousel) return false;

    addStyles();

    /* Garder le hero professionnel existant et masquer uniquement le grand slogan. */
    hero.classList.remove("sngHeroMediaV7","sngHeroMediaV8","sngHeroMediaV9","sngHeroMediaV10","has-default-hero");

    const mediaMount=heroIn.querySelector(".sngHeroMediaMount");
    if(mediaMount) mediaMount.remove();

    let announcement=heroIn.querySelector(".sngPromoAnnouncement");

    if(copy){
      copy.style.setProperty("display","block","important");
      const title=copy.querySelector("h1");
      if(title) title.style.setProperty("display","none","important");

      const primary=copy.querySelector(".primary");
      if(primary){
        primary.classList.remove("sngHeroMediaCta");
        primary.classList.add("sngPromoHeroCta");
        primary.textContent="Découvrir les produits";
        /* Le CTA reste après le bloc promotionnel sur mobile, et en bas à gauche sur desktop. */
        heroIn.appendChild(primary);
      }
    }

    if(!announcement){
      announcement=document.createElement("div");
      announcement.className="sngPromoAnnouncement";
      announcement.innerHTML='<button type="button" class="sngPromoAnnouncementButton" aria-label="Écouter l’annonce SNGAMER STORE" title="Écouter l’annonce SNGAMER STORE"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6.8 8.5H4.5A1.5 1.5 0 0 0 3 10v4a1.5 1.5 0 0 0 1.5 1.5h2.3L11 19V5Z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg></button>';
    }

    /* Position exacte: petit SNGAMER STORE -> annonce audio -> carte BIENVENUE. */
    if(copy){
      const label=copy.querySelector("label");
      const description=copy.querySelector("p.heroAnnouncement") || copy.querySelector("p");
      if(label){
        label.insertAdjacentElement("afterend",announcement);
      }else if(description){
        copy.insertBefore(announcement,description);
      }else{
        copy.appendChild(announcement);
      }
    }else{
      heroIn.insertBefore(announcement,promoArea);
    }

    const activeSlides=Array.from(promoCarousel.querySelectorAll(".promoSlide")).filter(slide=>getComputedStyle(slide).display!=="none"&&slide.children.length>0);
    if(activeSlides.length){
      promoArea.style.display="flex";
      promoArea.classList.add("has-active-promo");
      hero.classList.add("has-active-promo");
    }

    const button=announcement.querySelector(".sngPromoAnnouncementButton");
    if(button&&!button.dataset.audioReady){
      button.dataset.audioReady="1";
      const audio=new Audio("/audio/annonce-sngamer.mp3?v=20261022-nativebanners");
      audio.preload="none";
      const reset=()=>button.classList.remove("is-playing");
      audio.addEventListener("play",()=>button.classList.add("is-playing"));
      audio.addEventListener("ended",reset);
      audio.addEventListener("pause",reset);
      button.addEventListener("click",()=>{
        if(audio.paused){audio.currentTime=0;const p=audio.play();if(p&&p.catch)p.catch(()=>{});}
        else{audio.pause();audio.currentTime=0;reset();}
      });
    }

    return true;
  }

  function boot(){
    let attempts=0;
    const timer=setInterval(()=>{
      if(init()||++attempts>80) clearInterval(timer);
    },250);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
