(function(){
  "use strict";
  if(window.__sngamerHeroMediaV3) return;
  window.__sngamerHeroMediaV3=true;

  const SLIDES=[
    {src:"/hero/hero-welcome.webp?v=20261022-hero1",alt:"Bienvenue sur SNGAMER STORE"},
    {src:"/hero/hero-order.webp?v=20261022-hero2",alt:"Commande rapide SNGAMER STORE"},
    {src:"/hero/hero-delivery.webp?v=20261022-hero3",alt:"Livraison partout au Sénégal et dans la sous-région"}
  ];
  const INTERVAL=7000;

  function style(){
    if(document.getElementById("sngamerHeroMediaV3Styles")) return;
    const s=document.createElement("style"); s.id="sngamerHeroMediaV3Styles";
    s.textContent=`
      .hero.sngHeroMediaV3{overflow:hidden}
      .hero.sngHeroMediaV3 .heroIn{display:block!important;min-height:0!important;padding:24px 0 34px!important}
      .hero.sngHeroMediaV3 .heroIn>div:first-child{display:none!important}
      .hero.sngHeroMediaV3 .sngHeroMediaMount{width:100%;display:flex;flex-direction:column;align-items:center;position:relative;z-index:3;margin:0 0 8px}
      .hero.sngHeroMediaV3 .sngHeroMediaCarousel{width:min(100%,1180px);display:block;position:relative;overflow:hidden;border-radius:26px;box-shadow:0 24px 60px rgba(0,0,0,.34),0 0 34px rgba(28,132,255,.10)}
      .sngHeroMediaTrack{display:flex;width:100%;transition:transform .7s cubic-bezier(.22,1,.36,1);will-change:transform}
      .sngHeroMediaSlide{flex:0 0 100%;position:relative;line-height:0}
      .sngHeroMediaSlide img{display:block;width:100%;height:auto;aspect-ratio:768/286;object-fit:cover;user-select:none;-webkit-user-drag:none}
      .sngHeroAudioHotspot{position:absolute;left:7.2%;top:31.5%;width:13.5%;aspect-ratio:1;border:0;background:transparent;border-radius:22%;cursor:pointer;z-index:4;padding:0}
      .sngHeroAudioHotspot:focus-visible{outline:3px solid #7bd2ff;outline-offset:5px}
      .sngHeroAudioHotspot::after{content:"";position:absolute;inset:-9%;border-radius:25%;border:2px solid rgba(96,190,255,.75);box-shadow:0 0 0 0 rgba(96,190,255,.35);animation:sngHeroAudioPulse 2.2s ease-out infinite}
      .sngHeroAudioHint{position:absolute;left:8.1%;top:69%;z-index:5;padding:7px 11px;border:1px solid rgba(91,169,255,.45);border-radius:999px;background:rgba(5,13,27,.88);color:#eaf5ff;font:800 10px/1.1 Inter,Arial,sans-serif;letter-spacing:.3px;white-space:nowrap;box-shadow:0 8px 22px rgba(0,0,0,.3);pointer-events:none}
      .sngHeroAudioHint::before{content:"▶";margin-right:5px;color:#72c8ff}
      .sngHeroAudioHotspot.is-playing::after{animation:sngHeroAudioPlaying 1s ease-in-out infinite}
      @keyframes sngHeroAudioPulse{0%{transform:scale(.92);opacity:.8}70%{transform:scale(1.13);opacity:0}100%{transform:scale(1.13);opacity:0}}
      @keyframes sngHeroAudioPlaying{0%,100%{transform:scale(.96);opacity:.8}50%{transform:scale(1.1);opacity:.15}}
      .hero.sngHeroMediaV3 .sngHeroMediaDots{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:12px;min-height:10px}
      .hero.sngHeroMediaV3 .sngHeroMediaDots button{display:block;width:7px;height:7px;padding:0;border:0;border-radius:999px;background:#43526a;transition:all .25s ease;cursor:pointer}
      .hero.sngHeroMediaV3 .sngHeroMediaDots button.active{width:27px;background:linear-gradient(90deg,#4da3ff,#d92aa8)}
      .hero.sngHeroMediaV3 .sngHeroMediaCta{margin-top:16px;position:relative;z-index:10}
      .hero.sngHeroMediaV3 .promoArea{margin-top:8px}
      @media(max-width:700px){
        .hero.sngHeroMediaV3 .heroIn{padding:16px 0 28px!important}
        .hero.sngHeroMediaV3 .sngHeroMediaCarousel{border-radius:18px;width:100%}
        .sngHeroAudioHint{font-size:9px;padding:6px 9px;top:70%}
        .hero.sngHeroMediaV3 .sngHeroMediaDots{margin-top:9px}
      }
      @media(prefers-reduced-motion:reduce){.sngHeroMediaTrack{transition:none}.sngHeroAudioHotspot::after{animation:none!important}}
    `;
    document.head.appendChild(s);
  }

  function init(){
    const hero=document.querySelector(".hero");
    if(!hero) return false;
    const heroIn=hero.querySelector(".heroIn");
    if(!heroIn) return false;
    const content=heroIn.querySelector(":scope > div:first-child");
    if(!content) return false;
    style();
    hero.classList.add("sngHeroMediaV3");

    let mount=heroIn.querySelector(".sngHeroMediaMount");
    if(!mount){
      mount=document.createElement("div");
      mount.className="sngHeroMediaMount";
      mount.setAttribute("aria-label","Présentation SNGAMER STORE");
      heroIn.insertBefore(mount,heroIn.querySelector("#promoArea") || null);
    }

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

    if(carousel.querySelector(".sngHeroMediaTrack")) return true;

    const track=document.createElement("div");
    track.className="sngHeroMediaTrack";
    SLIDES.forEach((slide,i)=>{
      const wrap=document.createElement("div");
      wrap.className="sngHeroMediaSlide";
      const img=document.createElement("img");
      img.src=slide.src; img.alt=slide.alt; img.loading=i===0?"eager":"lazy"; img.decoding="async";
      wrap.appendChild(img);
      if(i===0){
        const hot=document.createElement("button");
        hot.type="button"; hot.className="sngHeroAudioHotspot";
        hot.setAttribute("aria-label","Écouter l'annonce SNGAMER STORE");
        const hint=document.createElement("span"); hint.className="sngHeroAudioHint"; hint.textContent="Cliquer pour écouter";
        wrap.appendChild(hot); wrap.appendChild(hint);
      }
      track.appendChild(wrap);
    });
    carousel.appendChild(track);

    const dots=document.createElement("div");
    dots.className="sngHeroMediaDots";
    dots.setAttribute("aria-label","Navigation des présentations");
    SLIDES.forEach((_,i)=>{const d=document.createElement("button");d.type="button";d.className=i===0?"active":"";d.setAttribute("aria-label",`Présentation ${i+1}`);dots.appendChild(d)});
    mount.insertBefore(dots,carousel.nextSibling);

    let index=0,timer=null;
    const render=()=>{
      track.style.transform=`translate3d(${-index*100}%,0,0)`;
      dots.querySelectorAll("button").forEach((d,i)=>d.classList.toggle("active",i===index));
    };
    const advance=()=>{index=(index+1)%SLIDES.length;render()};
    const start=()=>{clearInterval(timer);timer=setInterval(advance,INTERVAL)};
    start();

    const hot=track.querySelector(".sngHeroAudioHotspot");
    if(hot){
      hot.addEventListener("click",()=>{
        const old=document.querySelector(".sngHeroAudioButton");
        if(!old) return;
        old.click();
        const sync=()=>hot.classList.toggle("is-playing",old.classList.contains("is-playing"));
        sync();
        const obs=new MutationObserver(sync);
        obs.observe(old,{attributes:true,attributeFilter:["class"]});
        setTimeout(()=>obs.disconnect(),120000);
      });
    }

    dots.querySelectorAll("button").forEach((d,i)=>d.addEventListener("click",()=>{index=i;render();start()}));
    carousel.addEventListener("mouseenter",()=>clearInterval(timer));
    carousel.addEventListener("mouseleave",start);
    return true;
  }

  function boot(){let n=0;const t=setInterval(()=>{if(init()||++n>40)clearInterval(t)},250)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
