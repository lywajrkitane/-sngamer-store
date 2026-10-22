/* SNGAMER STORE — Hero V10 */
(function(){
  "use strict";
  if(window.__sngamerHeroMediaV10) return;
  window.__sngamerHeroMediaV10 = true;

  const FALLBACK = [
    {src:"/hero/hero-welcome.webp?v=20261022-herov10",alt:"Bienvenue sur SNGAMER STORE"},
    {src:"/hero/hero-order.webp?v=20261022-herov10",alt:"Commande rapide SNGAMER STORE"},
    {src:"/hero/hero-delivery.webp?v=20261022-herov10",alt:"Livraison au Sénégal et dans la sous-région"}
  ];
  const INTERVAL = 7000;

  async function loadSlides(){
    try {
      const res = await fetch("/api/hero-media",{cache:"no-store"});
      if(res.ok){
        const data = await res.json();
        const rows = Array.isArray(data.hero) ? data.hero : [];
        const saved = new Map(rows.map(r=>[Number(r.slot),String(r.url||"").trim()])
          .filter(([slot,url])=>[1,2,3].includes(slot)&&url&&/^(https?:\/\/|\/)/i.test(url)));
        return FALLBACK.map((s,i)=>({src:saved.get(i+1)||s.src,fallbackSrc:s.src,alt:s.alt}));
      }
    } catch(e) { console.warn("[SNG HERO V10] API indisponible, bannières locales utilisées.",e); }
    return FALLBACK.map(s=>({...s,fallbackSrc:s.src}));
  }

  function addStyles(){
    if(document.getElementById("sngHeroMediaV10Styles")) return;
    const style=document.createElement("style");
    style.id="sngHeroMediaV10Styles";
    style.textContent=[
      ".hero.sngHeroMediaV10{overflow:hidden}",
      ".hero.sngHeroMediaV10 .heroIn{display:block!important;min-height:0!important;padding:10px 0 20px!important}",
      ".hero.sngHeroMediaV10 .heroIn>div:first-child{display:none!important}",
      ".hero.sngHeroMediaV10 .promoArea{display:none!important;visibility:hidden!important;width:0!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}",
      ".hero.sngHeroMediaV10 .sngHeroMediaMount{width:100%;display:flex;flex-direction:column;align-items:center;position:relative;z-index:8;margin:0}",
      ".hero.sngHeroMediaV10 .sngHeroMediaAnnouncement{width:min(calc(100% - 20px),1180px);min-height:40px;margin:0 auto 8px;display:flex;align-items:center;justify-content:flex-end;gap:8px;position:relative;z-index:20}",
      ".hero.sngHeroMediaV10 .sngHeroAnnouncementButton{width:40px;height:40px;flex:0 0 40px;padding:0;border:1px solid rgba(93,167,255,.55);border-radius:13px;color:#fff;background:linear-gradient(135deg,#147dff 0%,#5b35ff 55%,#d326a8 100%);box-shadow:0 0 20px rgba(42,111,255,.22),inset 0 1px 0 rgba(255,255,255,.2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;position:relative}",
      ".hero.sngHeroMediaV10 .sngHeroAnnouncementButton svg{width:20px;height:20px;display:block}",
      ".hero.sngHeroMediaV10 .sngHeroAnnouncementButton::after{content:'';position:absolute;inset:-4px;border-radius:15px;border:1px solid rgba(82,179,255,.38);animation:sngHeroV10Pulse 2.2s ease-out infinite;pointer-events:none}",
      ".hero.sngHeroMediaV10 .sngHeroAnnouncementButton.is-playing::after{animation:sngHeroV10Playing 1s ease-in-out infinite}",
      ".hero.sngHeroMediaV10 .sngHeroAnnouncementText{padding:7px 11px;border:1px solid rgba(91,169,255,.35);border-radius:999px;background:rgba(5,13,27,.92);color:#eaf5ff;font:800 10px/1.1 Inter,Arial,sans-serif;letter-spacing:.2px;white-space:nowrap;box-shadow:0 8px 22px rgba(0,0,0,.24)}",
      ".hero.sngHeroMediaV10 .sngHeroAnnouncementText::before{content:'▶';margin-right:5px;color:#72c8ff}",
      ".hero.sngHeroMediaV10 .sngHeroMediaCarousel{display:block!important;width:calc(100% - 20px);max-width:1180px;position:relative;overflow:hidden;border-radius:20px;background:#081322;border:1px solid rgba(70,150,255,.28);box-shadow:0 14px 32px rgba(0,0,0,.22),0 0 22px rgba(28,132,255,.07)}",
      ".hero.sngHeroMediaV10 .sngHeroMediaTrack{display:flex;width:100%;transition:transform .65s cubic-bezier(.22,1,.36,1);will-change:transform}",
      ".hero.sngHeroMediaV10 .sngHeroMediaSlide{flex:0 0 100%;min-width:100%;position:relative;line-height:0;aspect-ratio:1536/572;overflow:hidden;background:#081322}",
      ".hero.sngHeroMediaV10 .sngHeroMediaSlide img{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:50% 50%;opacity:1!important;visibility:visible!important;z-index:2;user-select:none;-webkit-user-drag:none}",
      ".hero.sngHeroMediaV10 .sngHeroImageFallback{position:absolute;inset:0;z-index:1;display:flex;align-items:center;padding:24px;color:#f4f7ff;background:radial-gradient(ellipse at 28% 50%,rgba(33,125,255,.24),transparent 50%),linear-gradient(120deg,#07101f,#0b2340 62%,#08101c);font-family:Inter,Arial,sans-serif}",
      ".hero.sngHeroMediaV10 .sngHeroImageFallbackCopy{min-width:0;max-width:72%;display:flex;flex-direction:column;gap:6px;line-height:1.2}",
      ".hero.sngHeroMediaV10 .sngHeroImageFallbackCopy strong{color:#67b7ff;font-size:12px;letter-spacing:2px}",
      ".hero.sngHeroMediaV10 .sngHeroImageFallbackCopy span{font-size:22px;font-weight:850}",
      ".hero.sngHeroMediaV10 .sngHeroMediaDots{display:flex!important;align-items:center;justify-content:center;gap:7px;width:max-content;max-width:100%;height:10px;min-height:10px;margin:9px auto 0;padding:0;position:relative;z-index:20}",
      ".hero.sngHeroMediaV10 .sngHeroMediaDots button{appearance:none!important;-webkit-appearance:none!important;display:block!important;flex:0 0 7px!important;width:7px!important;min-width:7px!important;max-width:7px!important;height:7px!important;min-height:7px!important;max-height:7px!important;margin:0!important;padding:0!important;border:0!important;border-radius:50%!important;background:#526078!important;box-shadow:none!important;transform:none!important;transition:width .25s ease,background .25s ease!important;cursor:pointer;line-height:0!important}",
      ".hero.sngHeroMediaV10 .sngHeroMediaDots button.active{flex-basis:22px!important;width:22px!important;min-width:22px!important;max-width:22px!important;border-radius:99px!important;background:linear-gradient(90deg,#4da3ff,#d92aa8)!important}",
      ".hero.sngHeroMediaV10 .sngHeroMediaCta{display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;width:min(76vw,270px)!important;max-width:270px!important;height:52px!important;min-height:52px!important;max-height:52px!important;margin:12px auto 0!important;padding:11px 16px!important;border:1px solid rgba(110,169,255,.3)!important;border-radius:14px!important;background:linear-gradient(108deg,#287eff 0%,#6448ef 53%,#ce2b91 100%)!important;color:#fff!important;font-size:15px!important;font-weight:850!important;line-height:1.1!important;text-align:center!important;white-space:nowrap!important;box-shadow:0 7px 18px rgba(36,116,255,.12),0 4px 14px rgba(198,40,145,.07)!important}",
      "@keyframes sngHeroV10Pulse{0%{transform:scale(.96);opacity:.75}70%{transform:scale(1.12);opacity:0}100%{transform:scale(1.12);opacity:0}}",
      "@keyframes sngHeroV10Playing{0%,100%{transform:scale(.96);opacity:.8}50%{transform:scale(1.1);opacity:.15}}",
      "@media(max-width:700px){.hero.sngHeroMediaV10 .heroIn{padding:9px 0 18px!important}.hero.sngHeroMediaV10 .sngHeroMediaAnnouncement{width:calc(100% - 20px);min-height:38px;margin-bottom:6px}.hero.sngHeroMediaV10 .sngHeroAnnouncementButton{width:37px;height:37px;flex-basis:37px;border-radius:12px}.hero.sngHeroMediaV10 .sngHeroAnnouncementText{font-size:9px;padding:6px 9px}.hero.sngHeroMediaV10 .sngHeroMediaCarousel{border-radius:16px}.hero.sngHeroMediaV10 .sngHeroMediaDots{margin-top:8px}.hero.sngHeroMediaV10 .sngHeroMediaCta{width:min(72vw,250px)!important;height:48px!important;min-height:48px!important;max-height:48px!important;font-size:14px!important;margin-top:10px!important}}",
      "@media(prefers-reduced-motion:reduce){.hero.sngHeroMediaV10 .sngHeroMediaTrack{transition:none}.hero.sngHeroMediaV10 .sngHeroAnnouncementButton::after{animation:none!important}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function looksEmpty(img){
    try{
      const canvas=document.createElement("canvas");canvas.width=18;canvas.height=7;
      const ctx=canvas.getContext("2d",{willReadFrequently:true});
      if(!ctx||!img.naturalWidth)return true;
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let lo=255,hi=0,color=0;const tones=new Set();
      for(let i=0;i<d.length;i+=4){
        const l=Math.round((d[i]+d[i+1]+d[i+2])/3);lo=Math.min(lo,l);hi=Math.max(hi,l);
        if(Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])>22)color++;
        tones.add((d[i]>>4)+","+(d[i+1]>>4)+","+(d[i+2]>>4));
      }
      return tones.size<10||(hi-lo<24&&color<12);
    }catch(e){return !img.naturalWidth;}
  }

  function fallbackPanel(wrap,slide){
    if(wrap.querySelector(".sngHeroImageFallback"))return;
    const panel=document.createElement("div");panel.className="sngHeroImageFallback";
    const copy=document.createElement("div");copy.className="sngHeroImageFallbackCopy";
    const eyebrow=document.createElement("strong");eyebrow.textContent="SNGAMER STORE";
    const title=document.createElement("span");title.textContent=slide.alt;
    copy.append(eyebrow,title);panel.appendChild(copy);wrap.appendChild(panel);
  }

  function init(){
    const hero=document.querySelector(".hero");
    const heroIn=hero&&hero.querySelector(".heroIn");
    const copy=heroIn&&heroIn.querySelector(":scope > div:first-child");
    if(!hero||!heroIn||!copy)return false;
    addStyles();
    hero.classList.remove("sngHeroMediaV7","sngHeroMediaV8","sngHeroMediaV9");
    hero.classList.add("sngHeroMediaV10");
    let mount=heroIn.querySelector(".sngHeroMediaMount");
    if(!mount){
      mount=document.createElement("div");mount.className="sngHeroMediaMount";
      mount.setAttribute("aria-label","Présentation SNGAMER STORE");
      // Garde le texte d'origine en premier enfant (il sera masqué) et place le nouveau héros avant promoArea.
      heroIn.insertBefore(mount,heroIn.querySelector("#promoArea")||null);
    }
    if(mount.dataset.ready==="1")return true;
    mount.dataset.ready="1";
    const announcement=document.createElement("div");
    announcement.className="sngHeroMediaAnnouncement";
    announcement.innerHTML='<button type="button" class="sngHeroAnnouncementButton" aria-label="Écouter l’annonce SNGAMER STORE" title="Écouter l’annonce SNGAMER STORE"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6.8 8.5H4.5A1.5 1.5 0 0 0 3 10v4a1.5 1.5 0 0 0 1.5 1.5h2.3L11 19V5Z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg></button><span class="sngHeroAnnouncementText">Cliquer pour écouter</span>';
    mount.appendChild(announcement);
    const carousel=document.createElement("div");carousel.className="sngHeroMediaCarousel";mount.appendChild(carousel);
    const cta=copy.querySelector(".primary");
    if(cta){cta.classList.add("sngHeroMediaCta");cta.textContent="Découvrir les produits";mount.appendChild(cta);}
    copy.style.display="none";

    loadSlides().then(slides=>{
      const track=document.createElement("div");track.className="sngHeroMediaTrack";
      slides.forEach((slide,i)=>{
        const wrap=document.createElement("div");wrap.className="sngHeroMediaSlide";
        const img=document.createElement("img");img.alt=slide.alt;img.loading=i===0?"eager":"lazy";img.decoding="async";
        let triedFallback=false;
        const loadFallback=()=>{
          if(!triedFallback&&img.src!==new URL(slide.fallbackSrc,location.href).href){
            triedFallback=true;img.src=slide.fallbackSrc;return;
          }
          img.remove();fallbackPanel(wrap,slide);
        };
        img.addEventListener("error",loadFallback);
        img.addEventListener("load",()=>{
          if(!triedFallback&&img.src!==new URL(slide.fallbackSrc,location.href).href&&looksEmpty(img)){
            triedFallback=true;img.src=slide.fallbackSrc;return;
          }
          if(triedFallback&&looksEmpty(img)){img.remove();fallbackPanel(wrap,slide);}
        });
        img.src=slide.src;wrap.appendChild(img);track.appendChild(wrap);
      });
      carousel.replaceChildren(track);
      const dots=document.createElement("div");dots.className="sngHeroMediaDots";dots.setAttribute("aria-label","Navigation des bannières");
      slides.forEach((_,i)=>{const dot=document.createElement("button");dot.type="button";dot.className=i===0?"active":"";dot.setAttribute("aria-label","Bannière "+(i+1));dots.appendChild(dot);});
      mount.insertBefore(dots,carousel.nextSibling);
      let index=0,timer=null;
      const render=()=>{track.style.transform="translate3d("+(-index*100)+"%,0,0)";dots.querySelectorAll("button").forEach((d,i)=>d.classList.toggle("active",i===index));};
      const start=()=>{clearInterval(timer);timer=setInterval(()=>{index=(index+1)%slides.length;render();},INTERVAL);};
      start();
      dots.querySelectorAll("button").forEach((d,i)=>d.addEventListener("click",()=>{index=i;render();start();}));
      carousel.addEventListener("mouseenter",()=>clearInterval(timer));carousel.addEventListener("mouseleave",start);
    }).catch(e=>{console.error("[SNG HERO V10]",e);fallbackPanel(carousel,FALLBACK[0]);});

    const button=announcement.querySelector(".sngHeroAnnouncementButton");
    const label=announcement.querySelector(".sngHeroAnnouncementText");
    const audio=new Audio("/audio/annonce-sngamer.mp3?v=20261022-herov10");audio.preload="none";
    const reset=()=>{button.classList.remove("is-playing");label.textContent="Cliquer pour écouter";};
    audio.addEventListener("play",()=>{button.classList.add("is-playing");label.textContent="Annonce en cours…";});
    audio.addEventListener("ended",reset);audio.addEventListener("pause",reset);
    audio.addEventListener("error",()=>{label.textContent="Audio indisponible";setTimeout(()=>{label.textContent="Cliquer pour écouter";},2200);});
    button.addEventListener("click",()=>{if(audio.paused){audio.currentTime=0;const p=audio.play();if(p&&p.catch)p.catch(()=>{});}else{audio.pause();audio.currentTime=0;reset();}});
    return true;
  }
  function start(){
    let tries=0;const timer=setInterval(()=>{try{if(init()||++tries>40)clearInterval(timer);}catch(e){console.error("[SNG HERO V10] Init",e);if(++tries>40)clearInterval(timer);}},250);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();