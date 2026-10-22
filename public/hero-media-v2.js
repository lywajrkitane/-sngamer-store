(function(){
  "use strict";
  if(window.__sngamerHeroMediaV2) return;
  window.__sngamerHeroMediaV2=true;
  const SLIDES=[
    {src:"/hero/hero-welcome.webp?v=20261022-hero1",alt:"Bienvenue sur SNGAMER STORE"},
    {src:"/hero/hero-order.webp?v=20261022-hero2",alt:"Commande rapide SNGAMER STORE"},
    {src:"/hero/hero-delivery.webp?v=20261022-hero3",alt:"Livraison partout au Sénégal et dans la sous-région"}
  ];
  const INTERVAL=7000;
  function style(){
    if(document.getElementById("sngamerHeroMediaV2Styles")) return;
    const s=document.createElement("style"); s.id="sngamerHeroMediaV2Styles";
    s.textContent=`
      .hero.sngHeroMediaV2{overflow:hidden}
      .hero.sngHeroMediaV2 .heroIn{display:block!important;min-height:0!important;padding:24px 0 34px!important}
      .hero.sngHeroMediaV2 .heroIn>div:first-child{display:none!important}
      .hero.sngHeroMediaV2 .promoArea{width:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;position:relative!important}
      .hero.sngHeroMediaV2 .promoCarousel{width:min(100%,1180px)!important;display:block!important;position:relative!important;overflow:hidden!important;border-radius:26px!important;box-shadow:0 24px 60px rgba(0,0,0,.34),0 0 34px rgba(28,132,255,.10)!important}
      .sngHeroMediaTrack{display:flex;width:100%;transition:transform .7s cubic-bezier(.22,1,.36,1);will-change:transform}
      .sngHeroMediaSlide{flex:0 0 100%;position:relative;line-height:0}
      .sngHeroMediaSlide img{display:block;width:100%;height:auto;aspect-ratio:768/286;object-fit:cover;user-select:none;-webkit-user-drag:none}
      .sngHeroAudioHotspot{position:absolute;left:7.2%;top:31.5%;width:13.5%;aspect-ratio:1;border:0;background:transparent;border-radius:22%;cursor:pointer;z-index:4;padding:0}
      .sngHeroAudioHotspot:focus-visible{outline:3px solid #7bd2ff;outline-offset:5px}
      .sngHeroAudioHotspot::after{content:"";position:absolute;inset:-9%;border-radius:25%;border:2px solid rgba(96,190,255,.75);box-shadow:0 0 0 0 rgba(96,190,255,.35);animation:sngHeroAudioPulse 2.2s ease-out infinite}
      .sngHeroAudioHint{position:absolute;left:8.1%;top:69%;z-index:5;padding:7px 11px;border:1px solid rgba(91,169,255,.45);border-radius:999px;background:rgba(5,13,27,.88);color:#eaf5ff;font:800 10px/1.1 Inter,Arial,sans-serif;letter-spacing:.3px;white-space:nowrap;box-shadow:0 8px 22px rgba(0,0,0,.3);pointer-events:none}
      .sngHeroAudioHint::before{content:"↗";margin-right:5px;color:#72c8ff}
      .sngHeroAudioHotspot.is-playing::after{animation:sngHeroAudioPlaying 1s ease-in-out infinite}
      @keyframes sngHeroAudioPulse{0%{transform:scale(.92);opacity:.8}70%{transform:scale(1.13);opacity:0}100%{transform:scale(1.13);opacity:0}}
      @keyframes sngHeroAudioPlaying{0%,100%{transform:scale(.96);opacity:.8}50%{transform:scale(1.1);opacity:.15}}
      .hero.sngHeroMediaV2 .promoDots{display:flex!important;align-items:center;justify-content:center;gap:7px;margin-top:12px;min-height:10px}
      .hero.sngHeroMediaV2 .promoDots i{display:block;width:7px;height:7px;border-radius:999px;background:#43526a;transition:all .25s ease}
      .hero.sngHeroMediaV2 .promoDots i.active{width:27px;background:linear-gradient(90deg,#4da3ff,#d92aa8)}
      .hero.sngHeroMediaV2 .defaultHeroContent{display:none!important}
      .hero.sngHeroMediaV2 .primary{margin-top:16px!important;position:relative;z-index:10}
      .hero.sngHeroMediaV2 .sngHeroMediaTrack,.hero.sngHeroMediaV2 .sngHeroAudioHotspot,.hero.sngHeroMediaV2 .sngHeroAudioHint{touch-action:manipulation}
      @media(max-width:700px){
        .hero.sngHeroMediaV2 .heroIn{padding:16px 0 28px!important}
        .hero.sngHeroMediaV2 .promoCarousel{border-radius:18px!important;width:100%!important}
        .sngHeroAudioHint{font-size:9px;padding:6px 9px;top:70%}
        .hero.sngHeroMediaV2 .promoDots{margin-top:9px}
      }
      @media(prefers-reduced-motion:reduce){.sngHeroMediaTrack{transition:none}.sngHeroAudioHotspot::after{animation:none!important}}
    `; document.head.appendChild(s);
  }
  function init(){
    const hero=document.querySelector(".hero"), area=document.getElementById("promoArea"), carousel=document.getElementById("promoCarousel"), dots=document.getElementById("promoDots");
    if(!hero||!area||!carousel||!dots) return false;
    style(); hero.classList.add("sngHeroMediaV2");
    const existing=carousel.querySelector(".sngHeroMediaTrack"); if(existing) return true;
    carousel.replaceChildren();
    const track=document.createElement("div"); track.className="sngHeroMediaTrack";
    SLIDES.forEach((slide,i)=>{const wrap=document.createElement("div");wrap.className="sngHeroMediaSlide";const img=document.createElement("img");img.src=slide.src;img.alt=slide.alt;img.loading=i===0?"eager":"lazy";img.decoding="async";wrap.appendChild(img);if(i===0){const hot=document.createElement("button");hot.type="button";hot.className="sngHeroAudioHotspot";hot.setAttribute("aria-label","Écouter l'annonce SNGAMER STORE");const hint=document.createElement("span");hint.className="sngHeroAudioHint";hint.textContent="Cliquer pour écouter";wrap.appendChild(hot);wrap.appendChild(hint);}track.appendChild(wrap)});
    carousel.appendChild(track); dots.innerHTML=SLIDES.map((_,i)=>`<i class="${i===0?"active":""}"></i>`).join("");
    let index=0, timer=null; const render=()=>{track.style.transform=`translate3d(${-index*100}%,0,0)`;dots.querySelectorAll("i").forEach((d,i)=>d.classList.toggle("active",i===index));};
    const advance=()=>{index=(index+1)%SLIDES.length;render()}; const start=()=>{clearInterval(timer);timer=setInterval(advance,INTERVAL)}; start();
    track.querySelector(".sngHeroAudioHotspot")?.addEventListener("click",()=>{const old=document.querySelector(".sngHeroAudioButton");if(old){old.click();const hot=track.querySelector(".sngHeroAudioHotspot");const sync=()=>hot.classList.toggle("is-playing",old.classList.contains("is-playing"));sync();const obs=new MutationObserver(sync);obs.observe(old,{attributes:true,attributeFilter:["class"]});setTimeout(()=>obs.disconnect(),120000);}});
    dots.querySelectorAll("i").forEach((d,i)=>d.addEventListener("click",()=>{index=i;render();start()}));
    carousel.addEventListener("mouseenter",()=>clearInterval(timer)); carousel.addEventListener("mouseleave",start);
    return true;
  }
  function boot(){let n=0;const t=setInterval(()=>{if(init()||++n>40)clearInterval(t)},250)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
