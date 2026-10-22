(function(){
  "use strict";
  if(window.__sngamerHeroMediaV4) return;
  window.__sngamerHeroMediaV4=true;

  const SLIDES=[
    {src:"/hero/hero-welcome.webp?v=20261022-fix2-welcome",alt:"Bienvenue sur SNGAMER STORE",fallbackTitle:"BIENVENUE SUR SNGAMER STORE",fallbackText:"Ton univers gaming, à portée de clic."},
    {src:"/hero/hero-order.webp?v=20261022-fix2-order",alt:"Commande rapide SNGAMER STORE",fallbackTitle:"COMMANDE RAPIDE",fallbackText:"Choisis ton produit et commande en quelques secondes."},
    {src:"/hero/hero-delivery.webp?v=20261022-fix2-delivery",alt:"Livraison partout au Sénégal et dans la sous-région",fallbackTitle:"LIVRAISON",fallbackText:"Livraison au Sénégal et dans toute la sous-région."}
  ];
  const INTERVAL=7000;

  function style(){
    if(document.getElementById("sngamerHeroMediaV3Styles")) return;
    const s=document.createElement("style"); s.id="sngamerHeroMediaV3Styles";
    s.textContent=`
      .hero.sngHeroMediaV4{overflow:hidden}
      .hero.sngHeroMediaV4 .heroIn{display:block!important;min-height:0!important;padding:24px 0 34px!important}
      .hero.sngHeroMediaV4 .heroIn>div:first-child{display:none!important}
      .hero.sngHeroMediaV4 .sngHeroMediaMount{width:100%;display:flex;flex-direction:column;align-items:center;position:relative;z-index:3;margin:0 0 8px}
      .hero.sngHeroMediaV4 .sngHeroMediaCarousel{width:100%;max-width:1180px;display:block;position:relative;overflow:hidden;border-radius:22px;box-shadow:0 14px 32px rgba(0,0,0,.22),0 0 22px rgba(28,132,255,.07);background:linear-gradient(135deg,#071323,#0a2341 58%,#08101d)}
      .sngHeroMediaTrack{display:flex;width:100%;transition:transform .65s cubic-bezier(.22,1,.36,1);will-change:transform}
      .sngHeroMediaSlide{flex:0 0 100%;min-width:100%;position:relative;line-height:0;aspect-ratio:8/3;overflow:hidden;background:radial-gradient(ellipse at 32% 45%,rgba(35,121,255,.22),transparent 42%),linear-gradient(135deg,#071323,#0a2341 58%,#08101d)}
      .sngHeroMediaSlide img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;user-select:none;-webkit-user-drag:none}
      .sngHeroImageFallback{position:absolute;inset:0;display:flex;align-items:center;gap:clamp(12px,3vw,28px);padding:clamp(16px,4vw,42px);color:#f4f7ff;background:radial-gradient(ellipse at 27% 50%,rgba(33,125,255,.24),transparent 50%),linear-gradient(120deg,#07101f,#0b2340 62%,#08101c);font-family:Inter,Arial,sans-serif}
      .sngHeroImageFallbackIcon{flex:0 0 auto;width:clamp(48px,13vw,94px);aspect-ratio:1;border-radius:22%;display:grid;place-items:center;background:linear-gradient(135deg,#267aff,#7040ee 58%,#d52891);font-size:clamp(24px,6vw,46px);box-shadow:0 8px 24px rgba(31,116,255,.18)}
      .sngHeroImageFallbackCopy{min-width:0;max-width:66%;display:flex;flex-direction:column;gap:8px;line-height:1.25}
      .sngHeroImageFallbackCopy strong{color:#67b7ff;font-size:clamp(10px,2vw,15px);letter-spacing:clamp(1px,.3vw,3px)}
      .sngHeroImageFallbackCopy span{font-size:clamp(15px,3.4vw,28px);font-weight:850;line-height:1.12}
      .sngHeroAudioHotspot{position:absolute;left:7.0%;top:31.5%;width:13.5%;aspect-ratio:1;border:1px solid rgba(115,198,255,.76);background:rgba(8,18,38,.025);border-radius:22%;cursor:pointer;z-index:4;padding:0;box-shadow:0 0 0 2px rgba(6,14,29,.18),0 6px 20px rgba(0,0,0,.12)}
      .sngHeroAudioHotspot:focus-visible{outline:3px solid #7bd2ff;outline-offset:5px}
      .sngHeroAudioHotspot::after{content:"";position:absolute;inset:-9%;border-radius:25%;border:2px solid rgba(96,190,255,.75);box-shadow:0 0 0 0 rgba(96,190,255,.35);animation:sngHeroAudioPulse 2.2s ease-out infinite}
      .sngHeroAudioHint{position:absolute;left:8.1%;top:69%;z-index:5;padding:7px 11px;border:1px solid rgba(91,169,255,.45);border-radius:999px;background:rgba(5,13,27,.88);color:#eaf5ff;font:800 10px/1.1 Inter,Arial,sans-serif;letter-spacing:.3px;white-space:nowrap;box-shadow:0 8px 22px rgba(0,0,0,.3);pointer-events:none}
      .sngHeroAudioHint::before{content:"▶";margin-right:5px;color:#72c8ff}
      .sngHeroAudioHotspot.is-playing::after{animation:sngHeroAudioPlaying 1s ease-in-out infinite}
      @keyframes sngHeroAudioPulse{0%{transform:scale(.92);opacity:.8}70%{transform:scale(1.13);opacity:0}100%{transform:scale(1.13);opacity:0}}
      @keyframes sngHeroAudioPlaying{0%,100%{transform:scale(.96);opacity:.8}50%{transform:scale(1.1);opacity:.15}}
      .hero.sngHeroMediaV4 .sngHeroMediaDots{display:flex!important;align-items:center;justify-content:center;gap:7px;width:max-content;max-width:100%;height:10px;min-height:10px;margin:10px auto 0;padding:0;position:relative;z-index:6}
      .hero.sngHeroMediaV4 .sngHeroMediaDots button{appearance:none!important;-webkit-appearance:none!important;display:block!important;flex:0 0 7px!important;width:7px!important;min-width:7px!important;max-width:7px!important;height:7px!important;min-height:7px!important;max-height:7px!important;margin:0!important;padding:0!important;border:0!important;border-radius:50%!important;background:#526078!important;box-shadow:none!important;transform:none!important;transition:width .25s ease,background .25s ease!important;cursor:pointer;line-height:0!important}
      .hero.sngHeroMediaV4 .sngHeroMediaDots button.active{flex-basis:22px!important;width:22px!important;min-width:22px!important;max-width:22px!important;border-radius:99px!important;background:linear-gradient(90deg,#4da3ff,#d92aa8)!important}
      .hero.sngHeroMediaV4 .sngHeroMediaCta{display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;position:relative!important;isolation:isolate!important;z-index:10!important;width:min(78vw,280px)!important;max-width:280px!important;min-width:0!important;height:56px!important;min-height:56px!important;max-height:56px!important;margin:14px auto 0!important;padding:12px 20px!important;border:1px solid rgba(110,169,255,.3)!important;border-radius:15px!important;background:linear-gradient(108deg,#287eff 0%,#6448ef 53%,#ce2b91 100%)!important;color:#fff!important;font-size:clamp(14px,3.4vw,17px)!important;font-weight:850!important;line-height:1.1!important;letter-spacing:0!important;text-align:center!important;white-space:nowrap!important;box-shadow:0 7px 18px rgba(36,116,255,.12),0 4px 14px rgba(198,40,145,.07)!important}
      .hero.sngHeroMediaV4 .sngHeroMediaCta::before{content:"";position:absolute;inset:-9px -4px;z-index:-1;border-radius:20px;background:radial-gradient(ellipse at 28% 50%,rgba(39,129,255,.27),transparent 55%),radial-gradient(ellipse at 55% 50%,rgba(115,67,238,.16),transparent 62%);filter:blur(13px);opacity:.65;pointer-events:none}
      .hero.sngHeroMediaV4 .sngHeroMediaCta:active{transform:translateY(1px) scale(.99)}
      .hero.sngHeroMediaV4 .promoArea{margin-top:8px}
      @media(max-width:700px){
        .hero.sngHeroMediaV4 .heroIn{padding:14px 0 24px!important}
        .hero.sngHeroMediaV4 .sngHeroMediaCarousel{border-radius:16px;width:100%}
        .sngHeroAudioHint{font-size:9px;padding:6px 9px;top:69.5%;left:7.8%}
        .hero.sngHeroMediaV4 .sngHeroMediaDots{margin-top:8px}
        .hero.sngHeroMediaV4 .sngHeroMediaCta{width:min(76vw,270px)!important;max-width:270px!important;height:52px!important;min-height:52px!important;max-height:52px!important;margin-top:12px!important;padding:11px 16px!important;font-size:15px!important;border-radius:14px!important}
        .sngHeroImageFallbackCopy{gap:5px}
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
    hero.classList.add("sngHeroMediaV4");

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
      img.alt=slide.alt; img.loading=i===0?"eager":"lazy"; img.decoding="async";
      img.addEventListener("error",()=>{if(wrap.querySelector(".sngHeroImageFallback"))return;const fallback=document.createElement("div");fallback.className="sngHeroImageFallback";const icon=document.createElement("span");icon.className="sngHeroImageFallbackIcon";icon.textContent=i===0?"🔊":i===1?"🛒":"🚚";const copy=document.createElement("div");copy.className="sngHeroImageFallbackCopy";const title=document.createElement("strong");title.textContent=slide.fallbackTitle;const body=document.createElement("span");body.textContent=slide.fallbackText;copy.append(title,body);fallback.append(icon,copy);wrap.appendChild(fallback);img.style.display="none";});
      img.src=slide.src;
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
      const audio=new Audio("/audio/annonce-sngamer.mp3?v=20261022-fix2");
      audio.preload="none";
      const hint=track.querySelector(".sngHeroAudioHint");
      const resetAudio=()=>{hot.classList.remove("is-playing");if(hint)hint.textContent="Cliquer pour écouter";};
      audio.addEventListener("play",()=>{hot.classList.add("is-playing");if(hint)hint.textContent="Cliquer pour arrêter";});
      audio.addEventListener("ended",resetAudio);
      audio.addEventListener("pause",resetAudio);
      audio.addEventListener("error",()=>{resetAudio();if(hint)hint.textContent="Audio momentanément indisponible";});
      hot.addEventListener("click",()=>{
        if(audio.paused){
          audio.currentTime=0;
          const p=audio.play();
          if(p&&typeof p.catch==="function")p.catch(()=>{resetAudio();if(hint)hint.textContent="Audio momentanément indisponible";});
        }else{
          audio.pause();audio.currentTime=0;resetAudio();
        }
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
