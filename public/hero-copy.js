/* SNGAMER STORE — services complémentaires du Hero */
(function(){
  "use strict";

  // Le contenu du Hero est désormais piloté par promo-fix.js.
  // Ce fichier charge les services complémentaires et le dispositif
  // d'annonce automatique du Hero.

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
    script.src="customer-account.js";
    script.defer=true;
    script.dataset.sngamerCustomerAccount="true";
    document.body.appendChild(script);
  }

  function injectAnnouncementStyles(){
    if(document.getElementById("sngamerHeroAnnouncementStyles")) return;

    const style=document.createElement("style");
    style.id="sngamerHeroAnnouncementStyles";
    style.textContent=`
      /* =========================================================
         SNGAMER STORE — annonce intelligente du Hero
         Position : juste sous le texte principal, avant le CTA.
         ========================================================= */
      .sngHeroAnnouncement{
        width:min(100%,620px);
        margin:0 0 24px;
        padding:13px 15px 12px;
        display:flex;
        align-items:center;
        gap:12px;
        border:1px solid rgba(72,157,255,.24);
        border-radius:16px;
        background:
          radial-gradient(circle at 0% 50%,rgba(30,136,255,.13),transparent 38%),
          linear-gradient(135deg,rgba(10,22,39,.92),rgba(10,14,27,.94));
        box-shadow:0 12px 35px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.035);
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
        animation:sngHeroAnnouncementIn .45s cubic-bezier(.22,1,.36,1) both;
      }

      .sngHeroAnnouncementIcon{
        flex:0 0 38px;
        width:38px;
        height:38px;
        display:grid;
        place-items:center;
        border-radius:12px;
        background:linear-gradient(135deg,#1687ff,#7c3aed 58%,#e91e63);
        box-shadow:0 8px 22px rgba(42,104,255,.24);
        font-size:18px;
      }

      .sngHeroAnnouncementBody{
        min-width:0;
        flex:1;
      }

      .sngHeroAnnouncementLabel{
        display:block;
        margin-bottom:3px;
        color:#67b5ff;
        font-size:9px;
        line-height:1;
        font-weight:900;
        letter-spacing:1.8px;
        text-transform:uppercase;
      }

      .sngHeroAnnouncementText{
        display:block;
        color:#e9f0fb;
        font-family:Inter,Arial,sans-serif;
        font-size:13px;
        line-height:1.4;
        font-weight:700;
      }

      .sngHeroAnnouncementDots{
        flex:0 0 auto;
        display:flex;
        gap:4px;
        align-items:center;
      }

      .sngHeroAnnouncementDots i{
        width:4px;
        height:4px;
        border-radius:50%;
        background:#40516a;
        transition:all .25s ease;
      }

      .sngHeroAnnouncementDots i.active{
        width:14px;
        border-radius:99px;
        background:linear-gradient(90deg,#2f9cff,#d62ab1);
      }

      @keyframes sngHeroAnnouncementIn{
        from{opacity:0;transform:translateY(8px)}
        to{opacity:1;transform:translateY(0)}
      }

      @media(max-width:900px){
        .sngHeroAnnouncement{width:100%;margin:0 0 22px;padding:12px 13px}
      }

      @media(max-width:560px){
        .sngHeroAnnouncement{gap:10px;border-radius:14px;padding:11px 12px;margin:0 0 20px}
        .sngHeroAnnouncementIcon{flex-basis:34px;width:34px;height:34px;border-radius:10px;font-size:16px}
        .sngHeroAnnouncementLabel{font-size:8px;letter-spacing:1.4px}
        .sngHeroAnnouncementText{font-size:12px;line-height:1.35}
      }

      @media(prefers-reduced-motion:reduce){
        .sngHeroAnnouncement{animation:none}
      }
    `;
    document.head.appendChild(style);
  }

  function installOrderRecognition(){
    if(window.__sngamerOrderRecognitionInstalled) return;
    window.__sngamerOrderRecognitionInstalled=true;

    const originalFetch=window.fetch;
    if(typeof originalFetch!=="function") return;

    window.fetch=function(input,init){
      return originalFetch.apply(this,arguments).then(function(response){
        try{
          const url=typeof input === "string" ? input : (input && input.url) || "";
          if(url.includes("/api/orders") && response.ok){
            sessionStorage.setItem("sngamer_recent_order","1");
            window.dispatchEvent(new CustomEvent("sngamer:order-success"));
          }
        }catch(error){
          console.warn("SNGAMER_ORDER_ANNOUNCEMENT",error);
        }
        return response;
      });
    };
  }

  function createAnnouncement(){
    const hero=document.querySelector(".hero");
    if(!hero) return;

    const content=hero.querySelector(".heroIn > div:first-child");
    const description=content && content.querySelector("p");
    const button=content && content.querySelector(".primary");
    if(!content || !description || !button) return;

    let box=document.getElementById("sngamerHeroAnnouncement");
    if(!box){
      box=document.createElement("div");
      box.id="sngamerHeroAnnouncement";
      box.className="sngHeroAnnouncement";
      box.setAttribute("role","status");
      box.setAttribute("aria-live","polite");
      box.innerHTML=`
        <div class="sngHeroAnnouncementIcon" aria-hidden="true">✨</div>
        <div class="sngHeroAnnouncementBody">
          <span class="sngHeroAnnouncementLabel">SNGAMER STORE</span>
          <span class="sngHeroAnnouncementText"></span>
        </div>
        <div class="sngHeroAnnouncementDots" aria-hidden="true"></div>
      `;
      description.insertAdjacentElement("afterend",box);
    }

    const recentOrder=sessionStorage.getItem("sngamer_recent_order")==="1";
    const messages=recentOrder
      ? [
          {icon:"💙",label:"MERCI POUR TA COMMANDE",text:"Merci pour ta confiance. Ta commande a bien été enregistrée."},
          {icon:"🚚",label:"SNGAMER STORE",text:"Nous préparons ta commande avec soin. Merci de faire confiance à SNGAMER."},
          {icon:"✨",label:"BIENVENUE",text:"Bienvenue chez SNGAMER STORE. Ton setup, ton game, ton style."}
        ]
      : [
          {icon:"👋",label:"BIENVENUE CHEZ SNGAMER",text:"Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui."},
          {icon:"⚡",label:"COMMANDE RAPIDE",text:"Choisis ton produit et commande en quelques clics, simplement et rapidement."},
          {icon:"🚚",label:"LIVRAISON",text:"Livraison partout au Sénégal et dans toute la sous-région."},
          {icon:"💙",label:"MERCI POUR TA CONFIANCE",text:"Chaque commande compte. Merci de soutenir SNGAMER STORE."}
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
      },5000);
    }
  }

  function startAnnouncement(){
    injectAnnouncementStyles();
    installOrderRecognition();

    // Le Hero peut être réécrit par promo-fix.js après le chargement.
    // On retente brièvement pour garantir que l'annonce reste au bon endroit.
    let attempts=0;
    const timer=setInterval(function(){
      createAnnouncement();
      attempts++;
      if(attempts>=30) clearInterval(timer);
    },250);

    window.addEventListener("sngamer:order-success",function(){
      const box=document.getElementById("sngamerHeroAnnouncement");
      if(box){
        box.dataset.messageIndex="0";
        box.removeAttribute("data-timer-started");
      }
      createAnnouncement();
    });
  }

  function start(){
    loadProductStability();
    loadCustomerAccount();
    startAnnouncement();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }
})();
