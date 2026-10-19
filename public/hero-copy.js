/* SNGAMER STORE — annonce automatique du Hero */
(function(){
  "use strict";

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
    script.src="customer-account.js?v=20261019-1025";
    script.defer=true;
    script.dataset.sngamerCustomerAccount="true";
    document.body.appendChild(script);
  }

  function injectAnnouncementStyles(){
    if(document.getElementById("sngamerHeroAnnouncementStyles")) return;

    const style=document.createElement("style");
    style.id="sngamerHeroAnnouncementStyles";
    style.textContent=`
      .sngHeroAnnouncement{
        width:min(100%,720px);
        margin:22px 0 28px;
        min-height:126px;
        box-sizing:border-box;
        padding:22px 24px;
        display:flex;
        align-items:center;
        gap:18px;
        border:1px solid rgba(72,157,255,.32);
        border-radius:22px;
        background:
          radial-gradient(circle at 0% 50%,rgba(30,136,255,.18),transparent 42%),
          radial-gradient(circle at 100% 0%,rgba(220,38,180,.10),transparent 35%),
          linear-gradient(135deg,rgba(10,27,49,.96),rgba(7,13,25,.98));
        box-shadow:0 20px 48px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.045),0 0 34px rgba(30,136,255,.08);
        backdrop-filter:blur(12px);
        -webkit-backdrop-filter:blur(12px);
        animation:sngHeroAnnouncementIn .45s cubic-bezier(.22,1,.36,1) both;
      }

      .sngHeroAnnouncementIcon{
        flex:0 0 58px;
        width:58px;
        height:58px;
        display:grid;
        place-items:center;
        border-radius:17px;
        background:linear-gradient(135deg,#1687ff,#7c3aed 58%,#e91e63);
        box-shadow:0 10px 28px rgba(42,104,255,.30);
        font-size:28px;
      }

      .sngHeroAnnouncementBody{min-width:0;flex:1}

      .sngHeroAnnouncementLabel{
        display:block;
        margin-bottom:7px;
        color:#72bcff;
        font-size:11px;
        line-height:1.1;
        font-weight:900;
        letter-spacing:2.2px;
        text-transform:uppercase;
      }

      .sngHeroAnnouncementText{
        display:block;
        color:#f1f6ff;
        font-family:Inter,Arial,sans-serif;
        font-size:18px;
        line-height:1.42;
        font-weight:800;
      }

      .sngHeroAnnouncementDots{
        flex:0 0 auto;
        display:flex;
        gap:7px;
        align-items:center;
        justify-content:center;
      }

      .sngHeroAnnouncementDots i{
        width:7px;
        height:7px;
        border-radius:50%;
        background:#40516a;
        transition:all .25s ease;
      }

      .sngHeroAnnouncementDots i.active{
        width:27px;
        border-radius:99px;
        background:linear-gradient(90deg,#2f9cff,#d62ab1);
      }

      /* Aucun contrôle gauche/droite : le défilement est automatique. */
      .sngHeroAnnouncement button,
      .sngHeroAnnouncement .prev,
      .sngHeroAnnouncement .next,
      .sngHeroAnnouncement .arrow,
      .sngHeroAnnouncement [aria-label*="précédent" i],
      .sngHeroAnnouncement [aria-label*="suivant" i]{display:none!important}

      @keyframes sngHeroAnnouncementIn{
        from{opacity:0;transform:translateY(8px)}
        to{opacity:1;transform:translateY(0)}
      }

      @media(max-width:900px){
        .sngHeroAnnouncement{width:100%;margin:20px 0 26px;min-height:118px;padding:20px 19px}
      }

      @media(max-width:560px){
        .sngHeroAnnouncement{
          width:100%;
          min-height:116px;
          gap:13px;
          border-radius:19px;
          padding:18px 15px;
          margin:18px 0 24px;
        }
        .sngHeroAnnouncementIcon{
          flex-basis:50px;
          width:50px;
          height:50px;
          border-radius:15px;
          font-size:24px;
        }
        .sngHeroAnnouncementLabel{font-size:9px;letter-spacing:1.6px;margin-bottom:6px}
        .sngHeroAnnouncementText{font-size:15px;line-height:1.38}
        .sngHeroAnnouncementDots{gap:5px}
        .sngHeroAnnouncementDots i{width:6px;height:6px}
        .sngHeroAnnouncementDots i.active{width:21px}
      }

      @media(prefers-reduced-motion:reduce){.sngHeroAnnouncement{animation:none}}
    `;
    document.head.appendChild(style);
  }

  function createAnnouncement(){
    const hero=document.querySelector(".hero");
    if(!hero) return;

    const content=hero.querySelector(".heroIn > div:first-child");
    const title=content && content.querySelector("h1");
    const description=content && content.querySelector("p");
    const button=content && content.querySelector(".primary");
    if(!content || !description || !button) return;

    /* Neutralise les anciennes modifications de promo-fix.js :
       un seul bloc d'annonce doit rester visible sous le titre de marque. */
    if(title){
      title.innerHTML="";
      title.style.display="none";
      title.setAttribute("aria-hidden","true");
    }
    description.style.display="none";
    description.classList.remove("heroAnnouncement");
    description.textContent="";
    button.textContent="Découvrir les produits";

    let box=document.getElementById("sngamerHeroAnnouncement");
    if(!box){
      box=document.createElement("div");
      box.id="sngamerHeroAnnouncement";
      box.className="sngHeroAnnouncement";
      box.setAttribute("role","status");
      box.setAttribute("aria-live","polite");
      box.innerHTML=`
        <div class="sngHeroAnnouncementIcon" aria-hidden="true">👋</div>
        <div class="sngHeroAnnouncementBody">
          <span class="sngHeroAnnouncementLabel"></span>
          <span class="sngHeroAnnouncementText"></span>
        </div>
        <div class="sngHeroAnnouncementDots" aria-hidden="true"></div>
      `;
      description.insertAdjacentElement("afterend",box);
    }

    /* Paiement réel non activé : aucun message de commande/merci n'est injecté ici. */
    const messages=[
      {icon:"👋",label:"BIENVENUE CHEZ SNGAMER",text:"Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui."},
      {icon:"⚡",label:"COMMANDE RAPIDE",text:"Choisis ton produit et commande en quelques clics, simplement et rapidement."},
      {icon:"🚚",label:"LIVRAISON",text:"Livraison partout au Sénégal et dans toute la sous-région."}
    ];

    const dots=box.querySelector(".sngHeroAnnouncementDots");
    if(dots && dots.children.length!==messages.length){
      dots.innerHTML=messages.map((_,i)=>`<i class="${i===0?"active":""}"></i>`).join("");
    }

    let index=Number(box.dataset.messageIndex||0);
    if(!Number.isFinite(index) || index<0 || index>=messages.length) index=0;

    const renderMessage=function(){
      const message=messages[index];
      const icon=box.querySelector(".sngHeroAnnouncementIcon");
      const label=box.querySelector(".sngHeroAnnouncementLabel");
      const text=box.querySelector(".sngHeroAnnouncementText");
      if(icon) icon.textContent=message.icon;
      if(label) label.textContent=message.label;
      if(text) text.textContent=message.text;
      Array.from(box.querySelectorAll(".sngHeroAnnouncementDots i")).forEach((dot,i)=>dot.classList.toggle("active",i===index));
      box.dataset.messageIndex=String(index);
    };

    renderMessage();

    if(!box.dataset.timerStarted && messages.length>1){
      box.dataset.timerStarted="1";
      box.__announcementTimer=setInterval(function(){
        index=(index+1)%messages.length;
        renderMessage();
      },4000);
    }
  }

  function startAnnouncement(){
    injectAnnouncementStyles();

    let attempts=0;
    const timer=setInterval(function(){
      createAnnouncement();
      attempts++;
      if(attempts>=30) clearInterval(timer);
    },250);
  }

  function start(){
    loadProductStability();
    loadCustomerAccount();
    startAnnouncement();
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }
})();
