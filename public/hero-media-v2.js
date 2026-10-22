(function(){
  "use strict";
  if(window.__sngamerHeroMediaV4) return;
  window.__sngamerHeroMediaV4=true;

  const FALLBACK_SLIDES=[
    {src:"/hero/hero-welcome.webp?v=20261022-hero1",alt:"Bienvenue sur SNGAMER STORE"},
    {src:"/hero/hero-order.webp?v=20261022-hero2",alt:"Commande rapide SNGAMER STORE"},
    {src:"/hero/hero-delivery.webp?v=20261022-hero3",alt:"Livraison partout au Sénégal et dans la sous-région"}
  ];
  const INTERVAL=7000;

  async function getSlides(){
    try{
      const response=await fetch("/api/hero-media",{cache:"no-store"});
      if(response.ok){
        const data=await response.json();
        const saved=Array.isArray(data?.hero)?data.hero:[];
        const map=new Map(saved.map(item=>[Number(item.slot),item.url]).filter(x=>x[1]));
        return FALLBACK_SLIDES.map((fallback,i)=>({
          src:map.get(i+1)||fallback.src,
          alt:fallback.alt
        }));
      }
    }catch(error){console.warn("HERO_MEDIA_LOAD_FALLBACK",error)}
    return FALLBACK_SLIDES;
  }

  function style(){
    if(document.getElementById("sngamerHeroMediaV4Styles")) return;
    const s=document.createElement("style"); s.id="sngamerHeroMediaV4Styles";
    s.textContent=`
      .hero.sngHeroMediaV4{overflow:hidden}
      .hero.sngHeroMediaV4 .heroIn{display:block!important;min-height:0!important;padding:20px 0 32px!important}
      .hero.sngHeroMediaV4 .heroIn>div:first-child{display:none!important}
      .hero.sngHeroMediaV4 .sngHeroMediaMount{width:100%;display:flex;flex-direction:column;align-items:center;position:relative;z-index:3;margin:0 auto}
      .hero.sngHeroMediaV4 .sngHeroMediaAnnouncement{width:min(calc(100% - 32px),1180px);display:flex;align-items:center;justify-content:flex-end;gap:9px;margin:0 auto 9px;min-height:38px}
      .hero.sngHeroMediaV4 .sngHeroAnnouncementButton{width:42px;height:42px;flex:0 0 42px;padding:0;border:1px solid rgba(70,150,255,.55);border-radius:14px;color:#fff;background:linear-gradient(135deg,#147dff 0%,#5b35ff 55%,#d326a8 100%);box-shadow:0 0 20px rgba(42,111,255,.22),inset 0 1px 0 rgba(255,255,255,.2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;position:relative}
      .hero.sngHeroMediaV4 .sngHeroAnnouncementButton svg{width:21px;height:21px;display:block}
      .hero.sngHeroMediaV4 .sngHeroAnnouncementButton::after{content:"";position:absolute;inset:-4px;border-radius:16px;border:1px solid rgba(82,179,255,.38);animation:sngHeroAnnouncementPulse 2.2s ease-out infinite;pointer-events:none}
      .hero.sngHeroMediaV4 .sngHeroAnnouncementText{padding:8px 12px;border:1px solid rgba(91,169,255,.35);border-radius:999px;background:rgba(5,13,27,.86);color:#eaf5ff;font:800 11px/1.1 Inter,Arial,sans-serif;letter-spacing:.2px;white-space:nowrap;box-shadow:0 8px 22px rgba(0,0,0,.24)}
      .hero.sngHeroMediaV4 .sngHeroAnnouncementText::before{content:"▶";margin-right:5px;color:#72c8ff}
      .hero.sngHeroMediaV4 .sngHeroAudioButton{display:none!important}
      .hero.sngHeroMediaV4 .sngHeroMediaCarousel{width:min(100%,1180px);display:block;position:relative;overflow:hidden;border-radius:26px;box-shadow:0 24px 60px rgba(0,0,0,.34),0 0 34px rgba(28,132,255,.10);background:#07111f}
      .sngHeroMediaTrack{display:flex;width:100%;transition:transform .7s cubic-bezier(.22,1,.36,1);will-change:transform}
      .sngHeroMediaSlide{flex:0 0 100%;position:relative;line-height:0;background:#07111f}
      .sngHeroMediaSlide img{display:block;width:100%;height:auto;aspect-ratio:1536/572;object-fit:cover;user-select:none;-webkit-user-drag:none}
      .hero.sngHeroMediaV4 .sngHeroMediaDots{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;min-height:10px}
      .hero.sngHeroMediaV4 .sngHeroMediaDots button{display:block;width:7px;height:7px;padding:0;border:0;border-radius:999px;background:#43526a;transition:all .25s ease;cursor:pointer}
      .hero.sngHeroMediaV4 .sngHeroMediaDots button.active{width:27px;background:linear-gradient(90deg,#4da3ff,#d92aa8)}
      .hero.sngHeroMediaV4 .sngHeroMediaCta{margin-top:16px;position:relative;z-index:10;transform:scale(.78);transform-origin:center top}
      .hero.sngHeroMediaV4 .promoArea{margin-top:0}
      @keyframes sngHeroAnnouncementPulse{0%{transform:scale(.96);opacity:.75}70%{transform:scale(1.12);opacity:0}100%{transform:scale(1.12);opacity:0}}
      @media(max-width:700px){
        .hero.sngHeroMediaV4 .heroIn{padding:14px 0 26px!important}
        .hero.sngHeroMediaV4 .sngHeroMediaAnnouncement{width:calc(100% - 24px);margin-bottom:7px;min-height:34px}
        .hero.sngHeroMediaV4 .sngHeroAnnouncementButton{width:38px;height:38px;flex-basis:38px;border-radius:13px}
        .hero.sngHeroMediaV4 .sngHeroAnnouncementText{font-size:10px;padding:7px 10px}
        .hero.sngHeroMediaV4 .sngHeroMediaCarousel{border-radius:18px;width:100%}
        .hero.sngHeroMediaV4 .sngHeroMediaDots{margin-top:9px}
        .hero.sngHeroMediaV4 .sngHeroMediaCta{transform:scale(.68);margin-top:12px}
      }
      @media(prefers-reduced-motion:reduce){.sngHeroMediaTrack{transition:none}.sngHeroAnnouncementButton::after{animation:none!important}}
    `;
    document.head.appendChild(s);
  }

  async function init(){
    const hero=document.querySelector(".hero");
    if(!hero) return false;
    const heroIn=hero.querySelector(".heroIn");
    if(!heroIn) return false;
    const content=heroIn.querySelector(":scope > div:first-child");
    if(!content) return false;
    style();
    hero.classList.remove("sngHeroMediaV3");
    hero.classList.add("sngHeroMediaV4");

    let mount=heroIn.querySelector(".sngHeroMediaMount");
    if(!mount){
      mount=document.createElement("div");
      mount.className="sngHeroMediaMount";
      mount.setAttribute("aria-label","Présentation SNGAMER STORE");
      heroIn.insertBefore(mount,heroIn.querySelector("#promoArea")||null);
    }

    if(mount.dataset.ready==="1") return true;
    mount.dataset.ready="1";

    const announcement=document.createElement("div");
    announcement.className="sngHeroMediaAnnouncement";
    announcement.innerHTML=`<button type="button" class="sngHeroAnnouncementButton" aria-label="Écouter l'annonce SNGAMER STORE" title="Écouter l'annonce SNGAMER STORE"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6.8 8.5H4.5A1.5 1.5 0 0 0 3 10v4a1.5 1.5 0 0 0 1.5 1.5h2.3L11 19V5Z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg></button><span class="sngHeroAnnouncementText">Cliquer pour écouter</span>`;
    mount.appendChild(announcement);

    let carousel=mount.querySelector(".sngHeroMediaCarousel");
    if(!carousel){
      carousel=document.createElement("div");
      carousel.className="sngHeroMediaCarousel";
      mount.appendChild(carousel);
    }

    const primary=content.querySelector(".primary");
    if(primary && !mount.querySelector(".sngHeroMediaCta")){
      primary.classList.add("sngHeroMediaCta");
      mount.appendChild(primary);
    }
    content.style.display="none";

    const slides=await getSlides();
    if(carousel.querySelector(".sngHeroMediaTrack")) return true;

    const track=document.createElement("div");
    track.className="sngHeroMediaTrack";
    slides.forEach((slide,i)=>{
      const wrap=document.createElement("div");
      wrap.className="sngHeroMediaSlide";
      const img=document.createElement("img");
      img.src=slide.src; img.alt=slide.alt; img.loading=i===0?"eager":"lazy"; img.decoding="async";
      wrap.appendChild(img);
      track.appendChild(wrap);
    });
    carousel.appendChild(track);

    const dots=document.createElement("div");
    dots.className="sngHeroMediaDots";
    dots.setAttribute("aria-label","Navigation des présentations");
    slides.forEach((_,i)=>{const d=document.createElement("button");d.type="button";d.className=i===0?"active":"";d.setAttribute("aria-label",`Présentation ${i+1}`);dots.appendChild(d)});
    mount.insertBefore(dots,carousel.nextSibling);

    let index=0,timer=null;
    const render=()=>{
      track.style.transform=`translate3d(${-index*100}%,0,0)`;
      dots.querySelectorAll("button").forEach((d,i)=>d.classList.toggle("active",i===index));
    };
    const advance=()=>{index=(index+1)%slides.length;render()};
    const start=()=>{clearInterval(timer);timer=setInterval(advance,INTERVAL)};
    start();

    const announcementButton=announcement.querySelector("button");
    announcementButton?.addEventListener("click",()=>{
      const old=document.querySelector(".sngHeroAudioButton");
      if(!old) return;
      old.click();
      announcementButton.classList.toggle("is-playing",old.classList.contains("is-playing"));
    });

    dots.querySelectorAll("button").forEach((d,i)=>d.addEventListener("click",()=>{index=i;render();start()}));
    carousel.addEventListener("mouseenter",()=>clearInterval(timer));
    carousel.addEventListener("mouseleave",start);
    return true;
  }

  async function boot(){
    let n=0;
    const t=setInterval(async()=>{if(await init()||++n>40)clearInterval(t)},250);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
