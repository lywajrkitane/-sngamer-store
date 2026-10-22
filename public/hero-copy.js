/* SNGAMER STORE — annonce automatique du Hero + bouton audio premium */
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

  function loadHeroMedia(){
    if(document.querySelector('script[data-sngamer-hero-media-v2]')) return;
    const script=document.createElement("script");
    script.src="hero-media-v2.js?v=20261022-hero";
    script.defer=true;
    script.dataset.sngamerHeroMediaV2="true";
    document.body.appendChild(script);
  }

  function injectAnnouncementStyles(){
    if(document.getElementById("sngamerHeroAnnouncementStyles")) return;
    const style=document.createElement("style");
    style.id="sngamerHeroAnnouncementStyles";
    style.textContent=`
      .sngHeroAnnouncement{width:min(100%,720px);margin:22px 0 28px;min-height:126px;box-sizing:border-box;padding:22px 24px;display:flex;align-items:center;gap:18px;border:1px solid rgba(72,157,255,.32);border-radius:22px;background:radial-gradient(circle at 0% 50%,rgba(30,136,255,.18),transparent 42%),radial-gradient(circle at 100% 0%,rgba(220,38,180,.10),transparent 35%),linear-gradient(135deg,rgba(10,27,49,.96),rgba(7,13,25,.98));box-shadow:0 20px 48px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.045),0 0 34px rgba(30,136,255,.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);animation:sngHeroAnnouncementIn .45s cubic-bezier(.22,1,.36,1) both}
      .sngHeroAnnouncementIcon{flex:0 0 58px;width:58px;height:58px;display:grid;place-items:center;border-radius:17px;background:linear-gradient(135deg,#1687ff,#7c3aed 58%,#e91e63);box-shadow:0 10px 28px rgba(42,104,255,.30);font-size:28px}
      .sngHeroAnnouncementBody{min-width:0;flex:1}
      .sngHeroAnnouncementLabel{display:block;margin-bottom:7px;color:#72bcff;font-size:11px;line-height:1.1;font-weight:900;letter-spacing:2.2px;text-transform:uppercase}
      .sngHeroAnnouncementText{display:block;color:#f1f6ff;font-family:Inter,Arial,sans-serif;font-size:18px;line-height:1.42;font-weight:800}
      .sngHeroAnnouncementDots{flex:0 0 auto;display:flex;gap:7px;align-items:center;justify-content:center}
      .sngHeroAnnouncementDots i{width:7px;height:7px;border-radius:50%;background:#40516a;transition:all .25s ease}
      .sngHeroAnnouncementDots i.active{width:27px;border-radius:99px;background:linear-gradient(90deg,#2f9cff,#d62ab1)}

      .sngHeroAudioButton{appearance:none;-webkit-appearance:none;border:1px solid rgba(91,169,255,.42);background:linear-gradient(135deg,#1687ff,#7c3aed 58%,#e91e63);color:#fff;width:50px;height:50px;padding:0;border-radius:16px;display:grid;place-items:center;font-family:Inter,Arial,sans-serif;cursor:pointer;box-shadow:0 10px 26px rgba(37,99,235,.25),0 0 22px rgba(72,157,255,.12),inset 0 1px 0 rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;margin:0 0 18px}
      .sngHeroAudioButton:hover{transform:translateY(-1px) scale(1.02);box-shadow:0 13px 30px rgba(37,99,235,.30),0 0 26px rgba(72,157,255,.16),inset 0 1px 0 rgba(255,255,255,.18)}
      .sngHeroAudioButton:active{transform:scale(.94)}
      .sngHeroAudioButton.is-playing{border-color:rgba(125,240,255,.78);box-shadow:0 0 28px rgba(45,174,255,.34),0 10px 28px rgba(37,99,235,.25),inset 0 1px 0 rgba(255,255,255,.18)}
      .sngHeroAudioIcon{width:100%;height:100%;display:grid;place-items:center;font-size:22px;line-height:1}
      .sngHeroAudioCopy{display:none!important}
      .sngHeroAudioButton:focus-visible{outline:2px solid #75c8ff;outline-offset:3px}

      .sngHeroAnnouncement button:not(.sngHeroAudioButton),.sngHeroAnnouncement .prev,.sngHeroAnnouncement .next,.sngHeroAnnouncement .arrow,.sngHeroAnnouncement [aria-label*="précédent" i],.sngHeroAnnouncement [aria-label*="suivant" i]{display:none!important}
      @keyframes sngHeroAnnouncementIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @media(max-width:900px){.sngHeroAnnouncement{width:100%;margin:20px 0 26px;min-height:118px;padding:20px 19px}}
      @media(max-width:560px){.sngHeroAnnouncement{width:100%;min-height:116px;gap:13px;border-radius:19px;padding:18px 15px;margin:18px 0 24px}.sngHeroAnnouncementIcon{flex-basis:50px;width:50px;height:50px;border-radius:15px;font-size:24px}.sngHeroAnnouncementLabel{font-size:9px;letter-spacing:1.6px;margin-bottom:6px}.sngHeroAnnouncementText{font-size:15px;line-height:1.38}.sngHeroAnnouncementDots{gap:5px}.sngHeroAnnouncementDots i{width:6px;height:6px}.sngHeroAnnouncementDots i.active{width:21px}.sngHeroAudioButton{width:46px;height:46px;border-radius:15px;margin-bottom:16px}.sngHeroAudioIcon{font-size:20px}}
      @media(prefers-reduced-motion:reduce){.sngHeroAnnouncement{animation:none}.sngHeroAudioButton{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function installAudioButton(content){
    if(!content) return;
    const originalLabel=content.querySelector("label");
    if(originalLabel){originalLabel.style.display="none";originalLabel.setAttribute("aria-hidden","true")}
    let button=content.querySelector(".sngHeroAudioButton");
    if(!button){
      button=document.createElement("button");
      button.type="button";
      button.className="sngHeroAudioButton";
      button.setAttribute("aria-label","Écouter l'annonce SNGAMER STORE");
      button.innerHTML=`<span class="sngHeroAudioIcon" aria-hidden="true">🔊</span><span class="sngHeroAudioCopy"><span class="sngHeroAudioTitle">Écouter l'annonce</span><span class="sngHeroAudioHint">Annonce audio SNGAMER STORE</span></span>`;
      content.insertBefore(button,content.firstChild);
    }
    if(button.dataset.audioBound==="1") return;
    button.dataset.audioBound="1";

    const audio=new Audio("/audio/annonce-sngamer.mp3?v=20261019");
    audio.preload="auto";
    audio.setAttribute("aria-label","Annonce audio SNGAMER STORE");
    button._sngamerAudio=audio;
    const icon=button.querySelector(".sngHeroAudioIcon");
    const reset=function(){button.classList.remove("is-playing");if(icon) icon.textContent="🔊"};
    audio.addEventListener("play",function(){button.classList.add("is-playing");if(icon) icon.textContent="⏹"});
    audio.addEventListener("ended",reset);
    audio.addEventListener("pause",function(){if(audio.currentTime>=audio.duration-0.05) reset()});
    audio.addEventListener("error",reset);

    button.addEventListener("click",function(){
      if(audio.paused){
        audio.currentTime=0;
        const playPromise=audio.play();
        if(playPromise&&typeof playPromise.catch==="function")playPromise.catch(reset);
      }else{
        audio.pause();
        audio.currentTime=0;
        reset();
      }
    });
  }

  function createAnnouncement(){
    const hero=document.querySelector(".hero");
    if(!hero) return;
    const content=hero.querySelector(".heroIn > div:first-child");
    const title=content && content.querySelector("h1");
    const description=content && content.querySelector("p");
    const button=content && content.querySelector(".primary");
    if(!content || !description || !button) return;
    installAudioButton(content);
    if(title){title.innerHTML="";title.style.display="none";title.setAttribute("aria-hidden","true")}
    description.style.display="none";description.classList.remove("heroAnnouncement");description.textContent="";button.textContent="Découvrir les produits";
    let box=document.getElementById("sngamerHeroAnnouncement");
    if(!box){
      box=document.createElement("div");box.id="sngamerHeroAnnouncement";box.className="sngHeroAnnouncement";box.setAttribute("role","status");box.setAttribute("aria-live","polite");
      box.innerHTML=`<div class="sngHeroAnnouncementIcon" aria-hidden="true">👋</div><div class="sngHeroAnnouncementBody"><span class="sngHeroAnnouncementLabel"></span><span class="sngHeroAnnouncementText"></span></div><div class="sngHeroAnnouncementDots" aria-hidden="true"></div>`;
      description.insertAdjacentElement("afterend",box);
    }
    const messages=[
      {icon:"👋",label:"BIENVENUE CHEZ SNGAMER",text:"Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui."},
      {icon:"⚡",label:"COMMANDE RAPIDE",text:"Choisis ton produit et commande en quelques clics, simplement et rapidement."},
      {icon:"🚚",label:"LIVRAISON",text:"Livraison partout au Sénégal et dans toute la sous-région."}
    ];
    const dots=box.querySelector(".sngHeroAnnouncementDots");
    if(dots && dots.children.length!==messages.length)dots.innerHTML=messages.map((_,i)=>`<i class="${i===0?"active":""}"></i>`).join("");
    let index=Number(box.dataset.messageIndex||0);if(!Number.isFinite(index)||index<0||index>=messages.length)index=0;
    const renderMessage=function(){const message=messages[index];const icon=box.querySelector(".sngHeroAnnouncementIcon");const label=box.querySelector(".sngHeroAnnouncementLabel");const text=box.querySelector(".sngHeroAnnouncementText");if(icon)icon.textContent=message.icon;if(label)label.textContent=message.label;if(text)text.textContent=message.text;Array.from(box.querySelectorAll(".sngHeroAnnouncementDots i")).forEach((dot,i)=>dot.classList.toggle("active",i===index));box.dataset.messageIndex=String(index)};
    renderMessage();
    if(!box.dataset.timerStarted && messages.length>1){box.dataset.timerStarted="1";box.__announcementTimer=setInterval(function(){index=(index+1)%messages.length;renderMessage()},4000)}
  }

  function startAnnouncement(){
    injectAnnouncementStyles();
    let attempts=0;
    const timer=setInterval(function(){createAnnouncement();attempts++;if(attempts>=30)clearInterval(timer)},250);
  }
  function start(){loadProductStability();loadCustomerAccount();loadHeroMedia();startAnnouncement()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
