(function(){
  "use strict";
  if(window.__sngamerHeroMediaV8) return;
  window.__sngamerHeroMediaV8=true;

  const FALLBACK_SLIDES=[
    {src:"/hero/hero-welcome.webp?v=20261022-exactbanners",alt:"Bannière Bienvenue sur SNGAMER STORE"},
    {src:"/hero/hero-order.webp?v=20261022-exactbanners",alt:"Bannière Commande rapide SNGAMER STORE"},
    {src:"/hero/hero-delivery.webp?v=20261022-exactbanners",alt:"Bannière Livraison au Sénégal et dans la sous-région"}
  ];
  const INTERVAL=7000;

  async function loadSlides(){
    try{
      const response=await fetch("/api/hero-media",{cache:"no-store"});
      if(response.ok){
        const data=await response.json();
        const saved=Array.isArray(data?.hero)?data.hero:[];
        const map=new Map(saved.map(item=>[Number(item.slot),item.url]).filter(item=>item[1]));
        return FALLBACK_SLIDES.map((fallback,i)=>({src:map.get(i+1)||fallback.src,alt:fallback.alt}));
      }
    }catch(error){console.warn("HERO_MEDIA_LOAD_FALLBACK",error)}
    return FALLBACK_SLIDES;
  }

  function style(){
    if(document.getElementById("sngamerHeroMediaV8Styles")) return;
    const s=document.createElement("style");s.id="sngamerHeroMediaV8Styles";
    s.textContent=`
      .hero.sngHeroMediaV8{overflow:hidden}
      .hero.sngHeroMediaV8 .heroIn{display:block!important;min-height:0!important;padding:12px 0 22px!important}
      .hero.sngHeroMediaV8 .heroIn>div:first-child{display:none!important}
      .hero.sngHeroMediaV8 .sngHeroMediaMount{width:100%;display:flex;flex-direction:column;align-items:center;position:relative;z-index:3;margin:0 0 8px}
      .hero.sngHeroMediaV8 .sngHeroMediaAnnouncement{width:min(calc(100% - 24px),1180px);display:flex;align-items:center;justify-content:flex-end;gap:8px;min-height:40px;margin:0 auto 8px}
      .hero.sngHeroMediaV8 .sngHeroAnnouncementButton{width:40px;height:40px;flex:0 0 40px;padding:0;border:1px solid rgba(70,150,255,.55);border-radius:13px;color:#fff;background:linear-gradient(135deg,#147dff 0%,#5b35ff 55%,#d326a8 100%);box-shadow:0 0 20px rgba(42,111,255,.22),inset 0 1px 0 rgba(255,255,255,.2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;position:relative}
      .hero.sngHeroMediaV8 .sngHeroAnnouncementButton svg{width:20px;height:20px;display:block}
      .hero.sngHeroMediaV8 .sngHeroAnnouncementButton::after{content:"";position:absolute;inset:-4px;border-radius:15px;border:1px solid rgba(82,179,255,.38);animation:sngHeroAnnouncementPulse 2.2s ease-out infinite;pointer-events:none}
      .hero.sngHeroMediaV8 .sngHeroAnnouncementButton.is-playing::after{animation:sngHeroAnnouncementPlaying 1s ease-in-out infinite}
      .hero.sngHeroMediaV8 .sngHeroAnnouncementText{padding:7px 11px;border:1px solid rgba(91,169,255,.35);border-radius:999px;background:rgba(5,13,27,.88);color:#eaf5ff;font:800 10px/1.1 Inter,Arial,sans-serif;letter-spacing:.2px;white-space:nowrap;box-shadow:0 8px 22px rgba(0,0,0,.24)}
      .hero.sngHeroMediaV8 .sngHeroAnnouncementText::before{content:"▶";margin-right:5px;color:#72c8ff}
      .hero.sngHeroMediaV8 .sngHeroMediaCarousel{width:100%;max-width:1180px;display:block;position:relative;overflow:hidden;border-radius:20px;background:#081322;box-shadow:0 14px 32px rgba(0,0,0,.22),0 0 22px rgba(28,132,255,.07)}
      .sngHeroMediaTrack{display:flex;width:100%;transition:transform .65s cubic-bezier(.22,1,.36,1);will-change:transform}
      .sngHeroMediaSlide{flex:0 0 100%;min-width:100%;position:relative;line-height:0;aspect-ratio:1536/572;overflow:hidden;background:#081322}
      .sngHeroMediaSlide img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:50% 50%;user-select:none;-webkit-user-drag:none}
      .sngHeroImageFallback{position:absolute;inset:0;z-index:1;display:flex;align-items:center;padding:24px;color:#f4f7ff;background:radial-gradient(ellipse at 28% 50%,rgba(33,125,255,.24),transparent 50%),linear-gradient(120deg,#07101f,#0b2340 62%,#08101c);font-family:Inter,Arial,sans-serif}
      .sngHeroImageFallbackCopy{min-width:0;max-width:72%;display:flex;flex-direction:column;gap:6px;line-height:1.2}
      .sngHeroImageFallbackCopy strong{color:#67b7ff;font-size:12px;letter-spacing:2px}.sngHeroImageFallbackCopy span{font-size:22px;font-weight:850}
      .hero.sngHeroMediaV8 .sngHeroMediaDots{display:flex!important;align-items:center;justify-content:center;gap:7px;width:max-content;max-width:100%;height:10px;min-height:10px;margin:9px auto 0;padding:0;position:relative;z-index:6}
      .hero.sngHeroMediaV8 .sngHeroMediaDots button{appearance:none!important;-webkit-appearance:none!important;display:block!important;flex:0 0 7px!important;width:7px!important;min-width:7px!important;max-width:7px!important;height:7px!important;min-height:7px!important;max-height:7px!important;margin:0!important;padding:0!important;border:0!important;border-radius:50%!important;background:#526078!important;box-shadow:none!important;transform:none!important;transition:width .25s ease,background .25s ease!important;cursor:pointer;line-height:0!important}
      .hero.sngHeroMediaV8 .sngHeroMediaDots button.active{flex-basis:22px!important;width:22px!important;min-width:22px!important;max-width:22px!important;border-radius:99px!important;background:linear-gradient(90deg,#4da3ff,#d92aa8)!important}
      .hero.sngHeroMediaV8 .sngHeroMediaCta{display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;position:relative!important;isolation:isolate!important;z-index:10!important;width:min(76vw,270px)!important;max-width:270px!important;height:52px!important;min-height:52px!important;max-height:52px!important;margin:12px auto 0!important;padding:11px 16px!important;border:1px solid rgba(110,169,255,.3)!important;border-radius:14px!important;background:linear-gradient(108deg,#287eff 0%,#6448ef 53%,#ce2b91 100%)!important;color:#fff!important;font-size:15px!important;font-weight:850!important;line-height:1.1!important;text-align:center!important;white-space:nowrap!important;box-shadow:0 7px 18px rgba(36,116,255,.12),0 4px 14px rgba(198,40,145,.07)!important}
      .hero.sngHeroMediaV8 .sngHeroMediaCta::before{content:"";position:absolute;inset:-9px -4px;z-index:-1;border-radius:20px;background:radial-gradient(ellipse at 28% 50%,rgba(39,129,255,.27),transparent 55%),radial-gradient(ellipse at 55% 50%,rgba(115,67,238,.16),transparent 62%);filter:blur(13px);opacity:.65;pointer-events:none}
      @keyframes sngHeroAnnouncementPulse{0%{transform:scale(.96);opacity:.75}70%{transform:scale(1.12);opacity:0}100%{transform:scale(1.12);opacity:0}}
      @keyframes sngHeroAnnouncementPlaying{0%,100%{transform:scale(.96);opacity:.8}50%{transform:scale(1.1);opacity:.15}}
      @media(max-width:700px){
        .hero.sngHeroMediaV8 .heroIn{padding:10px 0 20px!important}
        .hero.sngHeroMediaV8 .sngHeroMediaAnnouncement{width:calc(100% - 20px);min-height:36px;margin-bottom:6px}
        .hero.sngHeroMediaV8 .sngHeroAnnouncementButton{width:37px;height:37px;flex-basis:37px;border-radius:12px}
        .hero.sngHeroMediaV8 .sngHeroAnnouncementText{font-size:9px;padding:6px 9px}
        .hero.sngHeroMediaV8 .sngHeroMediaCarousel{border-radius:16px}
        .hero.sngHeroMediaV8 .sngHeroMediaDots{margin-top:8px}
        .hero.sngHeroMediaV8 .sngHeroMediaCta{width:min(72vw,250px)!important;height:48px!important;min-height:48px!important;max-height:48px!important;font-size:14px!important;margin-top:10px!important}
      }
      @media(prefers-reduced-motion:reduce){.sngHeroMediaTrack{transition:none}.sngHeroAnnouncementButton::after{animation:none!important}}
    `;
    document.head.appendChild(s);
  }

  function fallback(wrap,slide){
    if(wrap.querySelector(".sngHeroImageFallback"))return;
    const f=document.createElement("div");f.className="sngHeroImageFallback";
    const c=document.createElement("div");c.className="sngHeroImageFallbackCopy";
    const a=document.createElement("strong");a.textContent="SNGAMER STORE";
    const b=document.createElement("span");b.textContent=slide.alt;
    c.append(a,b);f.appendChild(c);wrap.appendChild(f);
  }

  async function init(){
    const hero=document.querySelector(".hero"),heroIn=hero&&hero.querySelector(".heroIn"),content=heroIn&&heroIn.querySelector(":scope > div:first-child");
    if(!hero||!heroIn||!content)return false;
    style();hero.classList.add("sngHeroMediaV8");
    let mount=heroIn.querySelector(".sngHeroMediaMount");
    if(!mount){mount=document.createElement("div");mount.className="sngHeroMediaMount";mount.setAttribute("aria-label","Présentation SNGAMER STORE");heroIn.insertBefore(mount,heroIn.querySelector("#promoArea")||null)}
    if(mount.dataset.ready==="1")return true;
    mount.dataset.ready="1";

    const announcement=document.createElement("div");announcement.className="sngHeroMediaAnnouncement";announcement.innerHTML=`<button type="button" class="sngHeroAnnouncementButton" aria-label="Écouter l'annonce SNGAMER STORE" title="Écouter l'annonce SNGAMER STORE"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6.8 8.5H4.5A1.5 1.5 0 0 0 3 10v4a1.5 1.5 0 0 0 1.5 1.5h2.3L11 19V5Z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg></button><span class="sngHeroAnnouncementText">Cliquer pour écouter</span>`;mount.appendChild(announcement);

    let carousel=mount.querySelector(".sngHeroMediaCarousel");
    if(!carousel){carousel=document.createElement("div");carousel.className="sngHeroMediaCarousel";mount.appendChild(carousel)}
    const primary=content.querySelector(".primary");
    if(primary&&!mount.querySelector(".sngHeroMediaCta")){primary.classList.add("sngHeroMediaCta");primary.textContent="Découvrir les produits";mount.appendChild(primary)}
    content.style.display="none";

    const slides=await loadSlides();
    if(carousel.querySelector(".sngHeroMediaTrack"))return true;

    const track=document.createElement("div");track.className="sngHeroMediaTrack";
    slides.forEach((slide,i)=>{
      const wrap=document.createElement("div");wrap.className="sngHeroMediaSlide";
      const img=document.createElement("img");img.alt=slide.alt;img.loading=i===0?"eager":"lazy";img.fetchPriority=i===0?"high":"auto";img.decoding="async";img.referrerPolicy="no-referrer";
      img.addEventListener("error",()=>{img.style.display="none";fallback(wrap,slide)});
      img.src=slide.src;wrap.appendChild(img);track.appendChild(wrap);
    });
    carousel.appendChild(track);

    const dots=document.createElement("div");dots.className="sngHeroMediaDots";dots.setAttribute("aria-label","Navigation des présentations");
    slides.forEach((_,i)=>{const d=document.createElement("button");d.type="button";d.className=i===0?"active":"";d.setAttribute("aria-label",`Présentation ${i+1}`);dots.appendChild(d)});mount.insertBefore(dots,carousel.nextSibling);

    let index=0,timer=null;const render=()=>{track.style.transform=`translate3d(${-index*100}%,0,0)`;dots.querySelectorAll("button").forEach((d,i)=>d.classList.toggle("active",i===index))};const advance=()=>{index=(index+1)%slides.length;render()};const start=()=>{clearInterval(timer);timer=setInterval(advance,INTERVAL)};start();

    const button=announcement.querySelector(".sngHeroAnnouncementButton"),label=announcement.querySelector(".sngHeroAnnouncementText");
    const audio=new Audio("/audio/annonce-sngamer.mp3?v=20261022-nativebanners");audio.preload="none";
    const reset=()=>{button?.classList.remove("is-playing");if(label)label.textContent="Cliquer pour écouter"};
    audio.addEventListener("play",()=>{button?.classList.add("is-playing");if(label)label.textContent="Annonce en cours…"});
    audio.addEventListener("ended",reset);audio.addEventListener("pause",reset);audio.addEventListener("error",()=>{if(label)label.textContent="Audio indisponible";setTimeout(()=>{if(label)label.textContent="Cliquer pour écouter"},2200)});
    button?.addEventListener("click",()=>{if(audio.paused){audio.currentTime=0;const p=audio.play();if(p?.catch)p.catch(()=>{})}else{audio.pause();audio.currentTime=0;reset()}});

    dots.querySelectorAll("button").forEach((d,i)=>d.addEventListener("click",()=>{index=i;render();start()}));carousel.addEventListener("mouseenter",()=>clearInterval(timer));carousel.addEventListener("mouseleave",start);
    return true;
  }
  function boot(){let n=0;const t=setInterval(()=>{init().then(ok=>{if(ok||++n>40)clearInterval(t)}).catch(()=>{if(++n>40)clearInterval(t)})},250)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
