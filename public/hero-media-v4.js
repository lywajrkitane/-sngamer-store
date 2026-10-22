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
      .sngPromoAnnouncement{width:100%;min-height:48px;display:flex;align-items:center;justify-content:center;margin:0 0 8px;position:relative;z-index:30}
      .sngPromoAnnouncementButton{width:40px;height:40px;flex:0 0 40px;padding:0;border:1px solid rgba(93,167,255,.55);border-radius:13px;color:#fff;background:linear-gradient(135deg,#147dff 0%,#5b35ff 55%,#d326a8 100%);box-shadow:0 0 20px rgba(42,111,255,.22),inset 0 1px 0 rgba(255,255,255,.2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;position:relative}
      .sngPromoAnnouncementButton svg{width:20px;height:20px;display:block}
      .sngPromoAnnouncementButton::after{content:"";position:absolute;inset:-4px;border-radius:15px;border:1px solid rgba(82,179,255,.38);animation:sngPromoAnnouncementPulse 2.2s ease-out infinite;pointer-events:none}
      .sngPromoAnnouncementButton.is-playing::after{animation:sngPromoAnnouncementPlaying 1s ease-in-out infinite}
      .sngPromoHeroCta{display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;width:min(76vw,270px)!important;max-width:270px!important;height:52px!important;min-height:52px!important;max-height:52px!important;margin:12px auto 0!important;padding:11px 16px!important;border:1px solid rgba(110,169,255,.3)!important;border-radius:14px!important;background:linear-gradient(108deg,#287eff 0%,#6448ef 53%,#ce2b91 100%)!important;color:#fff!important;font-size:15px!important;font-weight:850!important;line-height:1.1!important;text-align:center!important;white-space:nowrap!important;box-shadow:0 7px 18px rgba(36,116,255,.12),0 4px 14px rgba(198,40,145,.07)!important}
      @keyframes sngPromoAnnouncementPulse{0%{transform:scale(.96);opacity:.75}70%{transform:scale(1.12);opacity:0}100%{transform:scale(1.12);opacity:0}}
      @keyframes sngPromoAnnouncementPlaying{0%,100%{transform:scale(.96);opacity:.8}50%{transform:scale(1.1);opacity:.15}}
      @media(max-width:700px){.sngPromoAnnouncement{min-height:44px;margin-bottom:6px}.sngPromoAnnouncementButton{width:37px;height:37px;flex-basis:37px;border-radius:12px}.sngPromoHeroCta{width:min(72vw,250px)!important;height:48px!important;min-height:48px!important;max-height:48px!important;font-size:14px!important;margin-top:10px!important}}
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

    hero.classList.remove("sngHeroMediaV7","sngHeroMediaV8","sngHeroMediaV9","sngHeroMediaV10","has-default-hero");

    const mediaMount=heroIn.querySelector(".sngHeroMediaMount");
    if(mediaMount) mediaMount.remove();

    if(copy){
      copy.style.display="none";
      const primary=copy.querySelector(".primary");
      if(primary){
        primary.classList.remove("sngHeroMediaCta");
        primary.classList.add("sngPromoHeroCta");
        primary.textContent="Découvrir les produits";
        if(primary.parentElement!==heroIn) heroIn.appendChild(primary);
        else heroIn.appendChild(primary);
      }
    }

    let announcement=heroIn.querySelector(".sngPromoAnnouncement");
    if(!announcement){
      announcement=document.createElement("div");
      announcement.className="sngPromoAnnouncement";
      announcement.innerHTML='<button type="button" class="sngPromoAnnouncementButton" aria-label="Écouter l’annonce SNGAMER STORE" title="Écouter l’annonce SNGAMER STORE"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6.8 8.5H4.5A1.5 1.5 0 0 0 3 10v4a1.5 1.5 0 0 0 1.5 1.5h2.3L11 19V5Z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg></button>';
      heroIn.insertBefore(announcement,promoArea);
    }

    const activeSlides=Array.from(promoCarousel.querySelectorAll(".promoSlide")).filter(slide=>getComputedStyle(slide).display!=="none"&&slide.children.length>0);
    if(activeSlides.length) promoArea.style.display="flex";

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
