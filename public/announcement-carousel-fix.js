/* SNGAMER STORE — annonce HERO rotative + espacement */
(function(){
  "use strict";
  if(window.__sngamerAnnouncementCarouselFix) return;
  window.__sngamerAnnouncementCarouselFix=true;

  const SLIDES=[
    {title:"BIENVENUE CHEZ SNGAMER",text:"Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui."},
    {title:"SNGAMER STORE",text:"Découvre nos accessoires gaming, Gaming Phone, consoles et pièces eFootball."},
    {title:"COMMANDE EN LIGNE",text:"Choisis tes produits, ajoute-les au panier et passe ta commande facilement."},
    {title:"LIVRAISON AU SÉNÉGAL",text:"Nous préparons ta commande avec soin et facilitons sa livraison."}
  ];
  const INTERVAL=4500;

  function addStyles(){
    if(document.getElementById("sngAnnouncementCarouselFixStyles")) return;
    const style=document.createElement("style");
    style.id="sngAnnouncementCarouselFixStyles";
    style.textContent=`
      /* Espacement demandé : petit SNGAMER STORE -> bouton annonce -> carte bienvenue. */
      .professional-hero .heroIn > div:first-child > label{display:block!important;margin:0 0 10px!important}
      .professional-hero .sngPromoAnnouncement{margin:0 0 12px!important}
      .professional-hero .heroIn > div:first-child p.heroAnnouncement{margin:0 0 20px!important}

      /* Le bloc d'annonce reste à sa place pendant que son contenu défile. */
      .professional-hero .heroAnnouncement .announcementCopy{overflow:hidden}
      .professional-hero .heroAnnouncement .announcementCopy.is-changing{animation:sngAnnouncementSwap .42s ease both}
      @keyframes sngAnnouncementSwap{
        0%{opacity:.2;transform:translateY(8px)}
        100%{opacity:1;transform:translateY(0)}
      }

      @media(max-width:560px){
        .professional-hero .heroIn > div:first-child > label{margin-bottom:9px!important}
        .professional-hero .sngPromoAnnouncement{margin:0 0 11px!important}
        .professional-hero .heroIn > div:first-child p.heroAnnouncement{margin:0 0 18px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function init(){
    const card=document.querySelector(".professional-hero .heroAnnouncement");
    if(!card) return false;
    const copy=card.querySelector(".announcementCopy");
    const strong=copy?.querySelector("strong");
    const text=copy?.querySelector("span");
    const dots=[...card.querySelectorAll(".announcementDots i")];
    if(!copy||!strong||!text||dots.length<1) return false;
    if(card.dataset.carouselReady==="1") return true;
    card.dataset.carouselReady="1";
    card.setAttribute("aria-live","polite");

    let index=0;
    const render=(next,animate)=>{
      index=(next+SLIDES.length)%SLIDES.length;
      const slide=SLIDES[index];
      if(animate){
        copy.classList.remove("is-changing");
        void copy.offsetWidth;
        copy.classList.add("is-changing");
      }
      strong.textContent=slide.title;
      text.textContent=slide.text;
      dots.forEach((dot,i)=>dot.classList.toggle("active",i===index));
    };

    const timer=setInterval(()=>render(index+1,true),INTERVAL);
    card.addEventListener("mouseenter",()=>clearInterval(timer));
    card.addEventListener("mouseleave",()=>{});
    render(0,false);
    return true;
  }

  function boot(){
    addStyles();
    let attempts=0;
    const timer=setInterval(()=>{
      if(init()||++attempts>80) clearInterval(timer);
    },250);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
