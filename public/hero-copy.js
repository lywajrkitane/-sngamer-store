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
      .sngHeroAudioButton{appearance:none;-webkit-appearance:none;border:1px solid rgba(91,169,255,.34);background:linear-gradient(135deg,rgba(22,135,255,.20),rgba(124,58,237,.24),rgba(233,30,99,.16));color:#f7fbff;min-height:42px;padding:9px 14px 9px 11px;border-radius:999px;display:inline-flex;align-items:center;gap:9px;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1;font-weight:900;letter-spacing:.25px;cursor:pointer;box-shadow:0 9px 25px rgba(37,99,235,.18),inset 0 1px 0 rgba(255,255,255,.10);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
      .sngHeroAudioButton:hover{transform:translateY(-1px);box-shadow:0 12px 30px rgba(37,99,235,.25),inset 0 1px 0 rgba(255,255,255,.12)}
      .sngHeroAudioButton:active{transform:scale(.97)}
      .sngHeroAudioButton.is-playing{border-color:rgba(77,220,255,.58);box-shadow:0 0 24px rgba(45,174,255,.24),inset 0 1px 0 rgba(255,255,255,.12)}
      .sngHeroAudioIcon{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#238cff,#8b3df0 60%,#e12b9c);font-size:13px;box-shadow:0 5px 14px rgba(54,102,255,.28)}
      .sngHeroAudioCopy{display:flex;flex-direction:column;align-items:flex-start;gap:3px;white-space:nowrap}
      .sngHeroAudioTitle{font-size:11px;font-weight:950;letter-spacing:.7px;text-transform:uppercase}
      .sngHeroAudioHint{font-size:9px;font-weight:700;color:#9db2cc;letter-spacing:.15px}
      .sngHeroAnnouncement button:not(.sngHeroAudioButton),.sngHeroAnnouncement .prev,.sngHeroAnnouncement .next,.sngHeroAnnouncement .arrow,.sngHeroAnnouncement [aria-label*="précédent" i],.sngHeroAnnouncement [aria-label*="suivant" i]{display:none!important}
      @keyframes sngHeroAnnouncementIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @media(max-width:900px){.sngHeroAnnouncement{width:100%;margin:20px 0 26px;min-height:118px;padding:20px 19px}}
      @media(max-width:560px){.sngHeroAnnouncement{width:100%;min-height:116px;gap:13px;border-radius:19px;padding:18px 15px;margin:18px 0 24px}.sngHeroAnnouncementIcon{flex-basis:50px;width:50px;height:50px;border-radius:15px;font-size:24px}.sngHeroAnnouncementLabel{font-size:9px;letter-spacing:1.6px;margin-bottom:6px}.sngHeroAnnouncementText{font-size:15px;line-height:1.38}.sngHeroAnnouncementDots{gap:5px}.sngHeroAnnouncementDots i{width:6px;height:6px}.sngHeroAnnouncementDots i.active{width:21px}.sngHeroAudioButton{min-height:38px;padding:8px 12px 8px 9px;gap:8px}.sngHeroAudioIcon{width:23px;height:23px;font-size:12px}.sngHeroAudioTitle{font-size:10px}.sngHeroAudioHint{font-size:8px}}
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
    button.addEventListener("click",function(){
      const label=document.querySelector("#sngamerHeroAnnouncement .sngHeroAnnouncementLabel");
      const text=document.querySelector("#sngamerHeroAnnouncement .sngHeroAnnouncementText");
      const phrase=[label&&label.textContent,text&&text.textContent].filter(Boolean).join(". ").trim();
      if(!phrase || !("speechSynthesis" in window)) return;
      if(window.speechSynthesis.speaking){
        window.speechSynthesis.cancel();
        button.classList.remove("is-playing");
        const icon=button.querySelector(".sngHeroAudioIcon");
        if(icon) icon.textContent="🔊";
        return;
      }
      const utterance=new SpeechSynthesisUtterance(phrase);
      utterance.lang="fr-FR";utterance.rate=.96;utterance.pitch=1;utterance.volume=1;
      utterance.onstart=function(){button.classList.add("is-playing");const icon=button.querySelector(".sngHeroAudioIcon");if(icon) icon.textContent="⏹"};
      utterance.onend=utterance.onerror=function(){button.classList.remove("is-playing");const icon=button.querySelector(".sngHeroAudioIcon");if(icon) icon.textContent="🔊"};
      window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance);
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
  function start(){loadProductStability();loadCustomerAccount();startAnnouncement()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
