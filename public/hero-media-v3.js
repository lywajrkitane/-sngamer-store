(function(){
  "use strict";
  if(window.__sngamerHeroMediaV6) return;
  window.__sngamerHeroMediaV6=true;

  const SLIDES=[
    {src:"https://images.unsplash.com/photo-1759701547201-04a7366e3439?auto=format&fit=crop&fm=jpg&w=1600&q=82",alt:"Gamer jouant sur smartphone",position:"50% 42%",label:"BIENVENUE CHEZ SNGAMER",text:"Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui."},
    {src:"https://images.unsplash.com/photo-1758874573126-cf93a36261e8?auto=format&fit=crop&fm=jpg&w=1600&q=82",alt:"Client utilisant son smartphone pour une commande en ligne",position:"50% 50%",label:"COMMANDE RAPIDE",text:"Choisis ton produit et commande en quelques clics, simplement et rapidement."},
    {src:"https://images.unsplash.com/photo-1774978236617-01a88685e420?auto=format&fit=crop&fm=jpg&w=1600&q=82",alt:"Livreur à moto en ville",position:"50% 50%",label:"LIVRAISON",text:"Livraison partout au Sénégal et dans toute la sous-région."}
  ];
  const INTERVAL=7000;

  function style(){
    if(document.getElementById("sngamerHeroMediaV6Styles")) return;
    const s=document.createElement("style");s.id="sngamerHeroMediaV6Styles";
    s.textContent=`
      .hero.sngHeroMediaV6{overflow:hidden}
      .hero.sngHeroMediaV6 .heroIn{display:block!important;min-height:0!important;padding:12px 0 22px!important}
      .hero.sngHeroMediaV6 .heroIn>div:first-child{display:none!important}
      .hero.sngHeroMediaV6 .sngHeroMediaMount{width:100%;display:flex;flex-direction:column;align-items:center;position:relative;z-index:3;margin:0 0 8px}
      .hero.sngHeroMediaV6 .sngHeroMediaCarousel{width:100%;max-width:1180px;display:block;position:relative;overflow:hidden;border-radius:20px;background:#081322;box-shadow:0 14px 32px rgba(0,0,0,.22),0 0 22px rgba(28,132,255,.07)}
      .sngHeroMediaTrack{display:flex;width:100%;transition:transform .65s cubic-bezier(.22,1,.36,1);will-change:transform}
      .sngHeroMediaSlide{flex:0 0 100%;min-width:100%;position:relative;line-height:0;aspect-ratio:8/3;overflow:hidden;background:#081322}
      .sngHeroMediaSlide::after{content:"";position:absolute;inset:0;z-index:2;background:linear-gradient(90deg,rgba(3,10,22,.78) 0%,rgba(3,10,22,.38) 45%,rgba(3,10,22,.08) 100%),linear-gradient(0deg,rgba(3,10,22,.40),transparent 48%);pointer-events:none}
      .sngHeroMediaSlide img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:50% 50%;user-select:none;-webkit-user-drag:none;transform:scale(1.001)}
      .sngHeroSlideCopy{position:absolute;left:7%;bottom:13%;z-index:4;max-width:min(56%,560px);color:#fff;font-family:Inter,Arial,sans-serif;text-align:left;text-shadow:0 2px 10px rgba(0,0,0,.55)}
      .sngHeroSlideCopy strong{display:block;color:#73c4ff;font-size:clamp(9px,1.8vw,13px);font-weight:900;letter-spacing:clamp(1.4px,.28vw,2.5px);line-height:1.1;margin-bottom:7px}
      .sngHeroSlideCopy span{display:block;font-size:clamp(13px,2.8vw,24px);font-weight:850;line-height:1.16}
      .sngHeroImageFallback{position:absolute;inset:0;z-index:1;display:flex;align-items:center;padding:24px;color:#f4f7ff;background:radial-gradient(ellipse at 28% 50%,rgba(33,125,255,.24),transparent 50%),linear-gradient(120deg,#07101f,#0b2340 62%,#08101c);font-family:Inter,Arial,sans-serif}
      .sngHeroImageFallbackCopy{min-width:0;max-width:72%;display:flex;flex-direction:column;gap:6px;line-height:1.2}
      .sngHeroImageFallbackCopy strong{color:#67b7ff;font-size:12px;letter-spacing:2px}.sngHeroImageFallbackCopy span{font-size:22px;font-weight:850}
      .sngHeroAudioHotspot{position:absolute;left:7%;top:27%;width:13.5%;aspect-ratio:1;border:1px solid rgba(115,198,255,.76);background:rgba(8,18,38,.025);border-radius:22%;cursor:pointer;z-index:6;padding:0;box-shadow:0 0 0 2px rgba(6,14,29,.18),0 6px 20px rgba(0,0,0,.12)}
      .sngHeroAudioHotspot:focus-visible{outline:3px solid #7bd2ff;outline-offset:5px}
      .sngHeroAudioHotspot::after{content:"";position:absolute;inset:-9%;border-radius:25%;border:2px solid rgba(96,190,255,.75);animation:sngHeroAudioPulse 2.2s ease-out infinite}
      .sngHeroAudioHint{position:absolute;left:8%;top:69%;z-index:7;padding:7px 11px;border:1px solid rgba(91,169,255,.45);border-radius:999px;background:rgba(5,13,27,.88);color:#eaf5ff;font:800 10px/1.1 Inter,Arial,sans-serif;letter-spacing:.3px;white-space:nowrap;box-shadow:0 8px 22px rgba(0,0,0,.3);pointer-events:none}
      .sngHeroAudioHint::before{content:"▶";margin-right:5px;color:#72c8ff}
      .sngHeroAudioHotspot.is-playing::after{animation:sngHeroAudioPlaying 1s ease-in-out infinite}
      @keyframes sngHeroAudioPulse{0%{transform:scale(.92);opacity:.8}70%{transform:scale(1.13);opacity:0}100%{transform:scale(1.13);opacity:0}}
      @keyframes sngHeroAudioPlaying{0%,100%{transform:scale(.96);opacity:.8}50%{transform:scale(1.1);opacity:.15}}
      .hero.sngHeroMediaV6 .sngHeroMediaDots{display:flex!important;align-items:center;justify-content:center;gap:7px;width:max-content;max-width:100%;height:10px;min-height:10px;margin:9px auto 0;padding:0;position:relative;z-index:6}
      .hero.sngHeroMediaV6 .sngHeroMediaDots button{appearance:none!important;-webkit-appearance:none!important;display:block!important;flex:0 0 7px!important;width:7px!important;min-width:7px!important;max-width:7px!important;height:7px!important;min-height:7px!important;max-height:7px!important;margin:0!important;padding:0!important;border:0!important;border-radius:50%!important;background:#526078!important;box-shadow:none!important;transform:none!important;transition:width .25s ease,background .25s ease!important;cursor:pointer;line-height:0!important}
      .hero.sngHeroMediaV6 .sngHeroMediaDots button.active{flex-basis:22px!important;width:22px!important;min-width:22px!important;max-width:22px!important;border-radius:99px!important;background:linear-gradient(90deg,#4da3ff,#d92aa8)!important}
      .hero.sngHeroMediaV6 .sngHeroMediaCta{display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;position:relative!important;isolation:isolate!important;z-index:10!important;width:min(76vw,270px)!important;max-width:270px!important;height:52px!important;min-height:52px!important;max-height:52px!important;margin:12px auto 0!important;padding:11px 16px!important;border:1px solid rgba(110,169,255,.3)!important;border-radius:14px!important;background:linear-gradient(108deg,#287eff 0%,#6448ef 53%,#ce2b91 100%)!important;color:#fff!important;font-size:15px!important;font-weight:850!important;line-height:1.1!important;text-align:center!important;white-space:nowrap!important;box-shadow:0 7px 18px rgba(36,116,255,.12),0 4px 14px rgba(198,40,145,.07)!important}
      .hero.sngHeroMediaV6 .sngHeroMediaCta::before{content:"";position:absolute;inset:-9px -4px;z-index:-1;border-radius:20px;background:radial-gradient(ellipse at 28% 50%,rgba(39,129,255,.27),transparent 55%),radial-gradient(ellipse at 55% 50%,rgba(115,67,238,.16),transparent 62%);filter:blur(13px);opacity:.65;pointer-events:none}
      @media(max-width:700px){.hero.sngHeroMediaV6 .sngHeroMediaCarousel{border-radius:16px}.sngHeroSlideCopy{left:7.5%;bottom:10%;max-width:64%}.sngHeroSlideCopy strong{font-size:9px;margin-bottom:5px}.sngHeroSlideCopy span{font-size:14px}.sngHeroAudioHint{font-size:9px;padding:6px 9px;top:69.5%;left:7.8%}}
      @media(prefers-reduced-motion:reduce){.sngHeroMediaTrack{transition:none}.sngHeroAudioHotspot::after{animation:none!important}}
    `;
    document.head.appendChild(s);
  }

  function fallback(wrap,slide){if(wrap.querySelector(".sngHeroImageFallback"))return;const f=document.createElement("div");f.className="sngHeroImageFallback";const c=document.createElement("div");c.className="sngHeroImageFallbackCopy";const a=document.createElement("strong");a.textContent=slide.label;const b=document.createElement("span");b.textContent=slide.text;c.append(a,b);f.appendChild(c);wrap.appendChild(f)}

  function init(){
    const hero=document.querySelector(".hero"),heroIn=hero&&hero.querySelector(".heroIn"),content=heroIn&&heroIn.querySelector(":scope > div:first-child");
    if(!hero||!heroIn||!content)return false;
    style();hero.classList.add("sngHeroMediaV6");
    let mount=heroIn.querySelector(".sngHeroMediaMount");
    if(!mount){mount=document.createElement("div");mount.className="sngHeroMediaMount";mount.setAttribute("aria-label","Présentation SNGAMER STORE");heroIn.insertBefore(mount,heroIn.querySelector("#promoArea")||null)}
    let carousel=mount.querySelector(".sngHeroMediaCarousel");
    if(!carousel){carousel=document.createElement("div");carousel.className="sngHeroMediaCarousel";mount.appendChild(carousel)}
    const primary=content.querySelector(".primary");
    if(primary&&!mount.querySelector(".sngHeroMediaCta")){primary.classList.add("sngHeroMediaCta");primary.textContent="Découvrir les produits";mount.appendChild(primary)}
    content.style.display="none";
    if(carousel.querySelector(".sngHeroMediaTrack"))return true;

    const track=document.createElement("div");track.className="sngHeroMediaTrack";
    SLIDES.forEach((slide,i)=>{
      const wrap=document.createElement("div");wrap.className="sngHeroMediaSlide";
      const img=document.createElement("img");img.alt=slide.alt;img.loading="eager";img.fetchPriority=i===0?"high":"auto";img.decoding="async";img.referrerPolicy="no-referrer";img.style.objectPosition=slide.position;
      img.addEventListener("error",()=>{img.style.display="none";fallback(wrap,slide)});
      img.addEventListener("load",()=>{if(img.naturalWidth<20||img.naturalHeight<20){img.style.display="none";fallback(wrap,slide)}});
      img.src=slide.src;wrap.appendChild(img);
      const copy=document.createElement("div");copy.className="sngHeroSlideCopy";const label=document.createElement("strong");label.textContent=slide.label;const text=document.createElement("span");text.textContent=slide.text;copy.append(label,text);wrap.appendChild(copy);
      if(i===0){const hot=document.createElement("button");hot.type="button";hot.className="sngHeroAudioHotspot";hot.setAttribute("aria-label","Écouter l'annonce SNGAMER STORE");const hint=document.createElement("span");hint.className="sngHeroAudioHint";hint.textContent="Cliquer pour écouter";wrap.append(hot,hint)}
      track.appendChild(wrap);
    });
    carousel.appendChild(track);

    const dots=document.createElement("div");dots.className="sngHeroMediaDots";dots.setAttribute("aria-label","Navigation des présentations");SLIDES.forEach((_,i)=>{const d=document.createElement("button");d.type="button";d.className=i===0?"active":"";d.setAttribute("aria-label",`Présentation ${i+1}`);dots.appendChild(d)});mount.insertBefore(dots,carousel.nextSibling);
    let index=0,timer=null;const render=()=>{track.style.transform=`translate3d(${-index*100}%,0,0)`;dots.querySelectorAll("button").forEach((d,i)=>d.classList.toggle("active",i===index))};const advance=()=>{index=(index+1)%SLIDES.length;render()};const start=()=>{clearInterval(timer);timer=setInterval(advance,INTERVAL)};start();

    const hot=track.querySelector(".sngHeroAudioHotspot");
    if(hot){const audio=new Audio("/audio/annonce-sngamer.mp3?v=20261022-fix3");audio.preload="auto";const hint=track.querySelector(".sngHeroAudioHint");const reset=()=>{hot.classList.remove("is-playing");if(hint)hint.textContent="Cliquer pour écouter"};audio.addEventListener("play",()=>{hot.classList.add("is-playing");if(hint)hint.textContent="Cliquer pour arrêter"});audio.addEventListener("ended",reset);audio.addEventListener("pause",reset);audio.addEventListener("error",()=>{reset();if(hint)hint.textContent="Audio momentanément indisponible"});hot.addEventListener("click",()=>{if(audio.paused){audio.currentTime=0;const p=audio.play();if(p&&p.catch)p.catch(()=>{reset();if(hint)hint.textContent="Audio momentanément indisponible"})}else{audio.pause();audio.currentTime=0;reset()}})}
    dots.querySelectorAll("button").forEach((d,i)=>d.addEventListener("click",()=>{index=i;render();start()}));carousel.addEventListener("mouseenter",()=>clearInterval(timer));carousel.addEventListener("mouseleave",start);return true;
  }
  function boot(){let n=0;const t=setInterval(()=>{if(init()||++n>40)clearInterval(t)},250)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
