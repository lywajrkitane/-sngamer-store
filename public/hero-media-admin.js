(function () {
  "use strict";
  if (window.__sngamerHeroMediaAdminV3) return;
  window.__sngamerHeroMediaAdminV3 = true;

  const SLOTS = [
    { slot:1, label:"Slide 1 — Bienvenue", desc:"Présentation et accueil de la boutique.", title:"BONJOUR ET BIENVENUE SUR SNGAMER STORE", body:"Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui." },
    { slot:2, label:"Slide 2 — Commande en ligne", desc:"Comment choisir les produits et passer commande.", title:"COMMANDE EN LIGNE", body:"Choisis tes produits, ajoute-les au panier et passe ta commande facilement." },
    { slot:3, label:"Slide 3 — Livraison", desc:"Informations concernant la livraison.", title:"LIVRAISON AU SÉNÉGAL", body:"Nous préparons ta commande avec soin et facilitons sa livraison." }
  ];
  const pendingFiles = {};
  let cropState = null;

  function escapeHtml(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");}

  function css(){
    if(document.getElementById("sngHeroMediaAdminStylesV3"))return;
    const s=document.createElement("style"); s.id="sngHeroMediaAdminStylesV3";
    s.textContent=[
      ".sngHeroMediaAdmin{margin:24px 0;padding:22px;border:1px solid rgba(73,145,255,.28);border-radius:22px;background:linear-gradient(145deg,rgba(9,18,35,.98),rgba(14,11,31,.98));box-shadow:0 18px 45px rgba(0,0,0,.22)}",
      ".sngHeroMediaAdmin *{box-sizing:border-box}.sngHeroMediaAdminHead{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.sngHeroMediaAdmin h2{margin:0 0 7px;font-size:22px;color:#fff}.sngHeroMediaAdmin p{margin:0;color:#9eb0c8;font-size:13px;line-height:1.5}.sngHeroMediaAdminNote{padding:9px 12px;border-radius:12px;background:rgba(44,132,255,.08);border:1px solid rgba(80,157,255,.18);color:#a9d4ff;font-size:12px}",
      ".sngHeroMediaAdminGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.sngHeroMediaAdminCard{min-width:0;padding:13px;border-radius:18px;border:1px solid rgba(93,135,190,.22);background:rgba(3,10,22,.62)}.sngHeroMediaAdminCard h3{margin:0 0 4px;color:#fff;font-size:14px}.sngHeroMediaAdminCard small{display:block;color:#7f92ad;font-size:11px;line-height:1.35;min-height:30px}",
      ".sngHeroMediaAdminPreview{margin:11px 0;border-radius:12px;overflow:hidden;aspect-ratio:1/1;background:#07111f;border:1px dashed rgba(86,153,224,.28);display:flex;align-items:center;justify-content:center;color:#5f7898;font-size:12px;text-align:center}.sngHeroMediaAdminPreview img{display:block;width:100%;height:100%;object-fit:cover}",
      ".sngHeroMediaAdminFields{margin-top:13px}.sngHeroMediaAdminFields label{display:block;margin:0 0 6px;color:#b8c9df;font-size:12px;font-weight:800}.sngHeroMediaAdminFields input,.sngHeroMediaAdminFields textarea{display:block;width:100%;min-width:0;margin:6px 0 12px;padding:10px 11px;border-radius:10px;border:1px solid rgba(101,140,190,.3);background:#080f1b;color:#f4f7ff;font:600 12px/1.45 Inter,Arial,sans-serif;outline:none}.sngHeroMediaAdminFields textarea{min-height:90px;resize:vertical}.sngHeroMediaAdminFields input:focus,.sngHeroMediaAdminFields textarea:focus{border-color:#469cff;box-shadow:0 0 0 3px rgba(70,156,255,.1)}",
      ".sngHeroMediaAdminActions{display:flex;gap:7px;flex-wrap:wrap}.sngHeroMediaAdminActions button,.sngHeroMediaAdminActions label{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:8px 11px;border-radius:10px;border:1px solid rgba(91,156,255,.28);background:linear-gradient(135deg,#147dff,#5b35ff 58%,#d326a8);color:#fff;font-weight:800;font-size:12px;cursor:pointer;text-decoration:none}.sngHeroMediaAdminActions button.secondary{background:rgba(18,29,48,.9);border-color:rgba(100,130,165,.25);color:#a9bad0}.sngHeroMediaAdminActions button.copySave{background:linear-gradient(135deg,#243c5f,#5139a7);border-color:rgba(130,160,255,.25)}.sngHeroMediaAdminActions input[type=file]{display:none}.sngHeroMediaAdminStatus{margin-top:8px;font-size:11px;color:#8ea5c0;min-height:15px;line-height:1.4}.sngHeroMediaAdminStatus.ok{color:#7ee2ad}.sngHeroMediaAdminStatus.err{color:#ff9292}",
      ".sngHeroCropModal{display:none;position:fixed;inset:0;z-index:100000;background:rgba(1,5,12,.86);backdrop-filter:blur(7px);padding:14px;align-items:center;justify-content:center}.sngHeroCropModal.is-open{display:flex}.sngHeroCropBox{width:min(720px,100%);max-height:94vh;overflow:auto;padding:18px;border:1px solid rgba(91,156,255,.3);border-radius:20px;background:linear-gradient(145deg,#0d1828,#0c0b19);box-shadow:0 25px 80px rgba(0,0,0,.55)}.sngHeroCropHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}.sngHeroCropHead h3{margin:0;color:#fff;font-size:19px}.sngHeroCropClose{border:0!important;background:transparent!important;color:#b9c9dc!important;font-size:26px!important;padding:4px 8px!important;min-height:0!important}.sngHeroCropArea{position:relative;width:min(560px,100%);aspect-ratio:1/1;margin:auto;overflow:hidden;border-radius:15px;background:#030811;border:1px solid rgba(96,158,226,.3);touch-action:none;cursor:grab}.sngHeroCropArea:active{cursor:grabbing}.sngHeroCropImage{position:absolute;left:50%;top:50%;max-width:none;transform-origin:center center;user-select:none;-webkit-user-select:none;-webkit-user-drag:none;pointer-events:none}.sngHeroCropHint{margin:10px 0 8px;text-align:center;color:#8fa6c1;font-size:12px}.sngHeroCropZoom{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;max-width:560px;margin:10px auto 0;color:#b9c9dc;font-size:12px;font-weight:800}.sngHeroCropZoom input{width:100%;margin:0}.sngHeroCropActions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap;margin-top:15px}.sngHeroCropActions button{min-width:125px}.sngHeroCropActions .primary{background:linear-gradient(135deg,#147dff,#5b35ff 58%,#d326a8);color:#fff}",
      "@media(max-width:900px){.sngHeroMediaAdminGrid{grid-template-columns:1fr 1fr}.sngHeroMediaAdminHead{flex-direction:column}}@media(max-width:600px){.sngHeroMediaAdmin{padding:16px;border-radius:18px}.sngHeroMediaAdminGrid{grid-template-columns:1fr}.sngHeroCropBox{padding:14px;border-radius:17px}.sngHeroCropActions{flex-direction:column}.sngHeroCropActions button{width:100%}}
    ].join("");
    document.head.appendChild(s);
  }

  function card(item){
    return '<article class="sngHeroMediaAdminCard" data-hero-admin-slot="'+item.slot+'">'+
      '<h3>'+escapeHtml(item.label)+'</h3><small>'+escapeHtml(item.desc)+'</small>'+\
      '<div class="sngHeroMediaAdminPreview" id="sngHeroPreview'+item.slot+'">Aucune image enregistrée</div>'+\
      '<div class="sngHeroMediaAdminFields">'+\
        '<label for="sngHeroTitle'+item.slot+'">Intitulé affiché</label>'+\
        '<input id="sngHeroTitle'+item.slot+'" type="text" maxlength="90" value="'+escapeHtml(item.title)+'">'+\
        '<label for="sngHeroBody'+item.slot+'">Texte affiché</label>'+\
        '<textarea id="sngHeroBody'+item.slot+'" maxlength="260" rows="4">'+escapeHtml(item.body)+'</textarea>'+\
      '</div>'+\
      '<div class="sngHeroMediaAdminActions">'+\
        '<label for="sngHeroFile'+item.slot+'">Choisir une image</label>'+\
        '<input id="sngHeroFile'+item.slot+'" type="file" accept="image/*">'+\
        '<button type="button" data-hero-upload="'+item.slot+'">Enregistrer l’image</button>'+\
        '<button type="button" class="copySave" data-hero-copy-save="'+item.slot+'">Enregistrer les textes</button>'+\
        '<button type="button" class="secondary" data-hero-remove="'+item.slot+'">Retirer l’image</button>'+\
      '</div>'+\
      '<div class="sngHeroMediaAdminStatus" id="sngHeroStatus'+item.slot+'"></div>'+\
    '</article>';
  }

  function ensureCropModal(){
    if(document.getElementById("sngHeroCropModal"))return;
    const modal=document.createElement("div"); modal.id="sngHeroCropModal"; modal.className="sngHeroCropModal";
    modal.innerHTML='<div class="sngHeroCropBox" role="dialog" aria-modal="true" aria-label="Ajuster l’image du Hero"><div class="sngHeroCropHead"><h3>✂️ Ajuster l’image du Hero</h3><button type="button" class="sngHeroCropClose" aria-label="Fermer">×</button></div><div class="sngHeroCropArea"><img class="sngHeroCropImage" id="sngHeroCropImage" alt="Image à ajuster"></div><div class="sngHeroCropHint">Fais glisser l’image pour choisir le cadrage · utilise le zoom pour agrandir ou réduire.</div><label class="sngHeroCropZoom"><span>Zoom</span><input id="sngHeroCropZoom" type="range" min="1" max="3" step="0.01" value="1"><strong id="sngHeroCropZoomValue">100%</strong></label><div class="sngHeroCropActions"><button type="button" class="sngHeroCropCancel">Annuler</button><button type="button" class="primary sngHeroCropApply">✓ Valider le cadrage</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector(".sngHeroCropClose").addEventListener("click",closeCrop);
    modal.querySelector(".sngHeroCropCancel").addEventListener("click",closeCrop);
    modal.querySelector(".sngHeroCropApply").addEventListener("click",applyCrop);
    modal.addEventListener("click",function(e){if(e.target===modal)closeCrop();});
    modal.querySelector("#sngHeroCropZoom").addEventListener("input",function(){if(!cropState)return;cropState.zoom=Number(this.value);document.getElementById("sngHeroCropZoomValue").textContent=Math.round(cropState.zoom*100)+"%";renderCrop();});
    const area=modal.querySelector(".sngHeroCropArea");
    let drag=null;
    area.addEventListener("pointerdown",function(e){if(!cropState)return;area.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,ox:cropState.x,oy:cropState.y};});
    area.addEventListener("pointermove",function(e){if(!drag||!cropState)return;cropState.x=drag.ox+(e.clientX-drag.x);cropState.y=drag.oy+(e.clientY-drag.y);renderCrop();});
    area.addEventListener("pointerup",function(){drag=null;}); area.addEventListener("pointercancel",function(){drag=null;});
  }

  function openCrop(slot,file){
    ensureCropModal();
    const modal=document.getElementById("sngHeroCropModal"),img=document.getElementById("sngHeroCropImage"),area=modal.querySelector(".sngHeroCropArea"),zoom=document.getElementById("sngHeroCropZoom");
    cropState={slot:slot,file:file,img:img,url:URL.createObjectURL(file),zoom:1,x:0,y:0,baseScale:1,areaSize:0};
    img.onload=function(){cropState.areaSize=area.clientWidth;cropState.baseScale=Math.max(cropState.areaSize/img.naturalWidth,cropState.areaSize/img.naturalHeight);cropState.x=0;cropState.y=0;zoom.value="1";document.getElementById("sngHeroCropZoomValue").textContent="100%";renderCrop();};
    img.src=cropState.url; modal.classList.add("is-open");
  }

  function renderCrop(){
    if(!cropState)return;
    const img=cropState.img,scale=cropState.baseScale*cropState.zoom;
    img.style.width=(img.naturalWidth*scale)+"px"; img.style.height=(img.naturalHeight*scale)+"px"; img.style.marginLeft=(-img.naturalWidth*scale/2+cropState.x)+"px"; img.style.marginTop=(-img.naturalHeight*scale/2+cropState.y)+"px";
  }

  function closeCrop(){
    const modal=document.getElementById("sngHeroCropModal");
    if(!modal)return;
    modal.classList.remove("is-open");
    if(cropState && cropState.url)URL.revokeObjectURL(cropState.url);
    cropState=null;
  }

  function applyCrop(){
    if(!cropState)return;
    const state=cropState,img=state.img,areaSize=state.areaSize,scale=state.baseScale*state.zoom;
    const canvas=document.createElement("canvas"); canvas.width=1080; canvas.height=1080; const ctx=canvas.getContext("2d");
    const outputScale=1080/areaSize;
    const drawW=img.naturalWidth*scale*outputScale,drawH=img.naturalHeight*scale*outputScale;
    const left=(areaSize/2+state.x-img.naturalWidth*scale/2)*outputScale;
    const top=(areaSize/2+state.y-img.naturalHeight*scale/2)*outputScale;
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality="high"; ctx.drawImage(img,left,top,drawW,drawH);
    canvas.toBlob(function(blob){
      if(!blob){status(state.slot,"Impossible de préparer cette image.","err");closeCrop();return;}
      pendingFiles[state.slot]=new File([blob],"sngamer-hero-"+state.slot+".jpg",{type:"image/jpeg",lastModified:Date.now()});
      const box=document.getElementById("sngHeroPreview"+state.slot); if(box)box.innerHTML='<img src="'+URL.createObjectURL(blob)+'" alt="Aperçu de l’image '+state.slot+'">';
      status(state.slot,"Cadrage validé. L’image est prête à être enregistrée.","ok"); closeCrop();
    },"image/jpeg",0.92);
  }

  function mount(){
    if(document.getElementById("sngHeroMediaAdmin"))return true;
    css(); ensureCropModal();
    const root=document.createElement("section"); root.id="sngHeroMediaAdmin"; root.className="sngHeroMediaAdmin";
    root.innerHTML='<div class="sngHeroMediaAdminHead"><div><h2>HERO — Page d’accueil</h2><p>Gère séparément les 3 images, intitulés et textes du carrousel. Chaque image peut être recadrée et zoomée avant l’enregistrement.</p></div><div class="sngHeroMediaAdminNote">Format conseillé : 1080 × 1080 px · carré (1:1)</div></div><div class="sngHeroMediaAdminGrid">'+SLOTS.map(card).join("")+'</div>';
    const target=document.querySelector("main")||document.querySelector("#app")||document.body;
    const heading=Array.from(document.querySelectorAll("h1,h2,h3")).find(function(el){return /campagnes|promotions|produits|tableau de bord/i.test(el.textContent||"");});
    const parent=heading&&(heading.parentElement&&(heading.parentElement.parentElement||heading.parentElement)); const insertionParent=parent||target;
    insertionParent.insertBefore(root,heading&&heading.parentElement&&heading.parentElement.nextSibling?heading.parentElement.nextSibling:insertionParent.firstChild);
    SLOTS.forEach(function(item){
      const slot=item.slot,file=document.getElementById("sngHeroFile"+slot); if(file)file.addEventListener("change",function(){const selected=this.files&&this.files[0];if(selected)openCrop(slot,selected);});
      const upload=document.querySelector('[data-hero-upload="'+slot+'"]');if(upload)upload.addEventListener("click",function(){saveImage(slot);});
      const copySave=document.querySelector('[data-hero-copy-save="'+slot+'"]');if(copySave)copySave.addEventListener("click",function(){saveCopy(slot);});
      const removeButton=document.querySelector('[data-hero-remove="'+slot+'"]');if(removeButton)removeButton.addEventListener("click",function(){removeImage(slot);});
    });
    loadImages(); loadCopy(); return true;
  }

  function status(slot,message,type){const el=document.getElementById("sngHeroStatus"+slot);if(!el)return;el.textContent=message||"";el.className="sngHeroMediaAdminStatus"+(type?" "+type:"");}

  async function loadImages(){try{const response=await fetch("/api/hero-media",{cache:"no-store"});if(!response.ok)return;const data=await response.json();(data.hero||[]).forEach(function(item){const box=document.getElementById("sngHeroPreview"+item.slot);if(box&&item.url)box.innerHTML='<img src="'+escapeHtml(item.url)+'" alt="Image du héros '+item.slot+'">';});}catch(error){console.error("HERO_MEDIA_ADMIN_LOAD_ERROR",error);}}
  async function loadCopy(){try{const response=await fetch("/api/hero-content",{cache:"no-store"});if(!response.ok)return;const data=await response.json();(data.slides||[]).forEach(function(item){const title=document.getElementById("sngHeroTitle"+item.slot),body=document.getElementById("sngHeroBody"+item.slot);if(title&&typeof item.title==="string")title.value=item.title;if(body&&typeof item.body==="string")body.value=item.body;});}catch(error){console.error("HERO_CONTENT_ADMIN_LOAD_ERROR",error);}}

  async function saveImage(slot){
    const input=document.getElementById("sngHeroFile"+slot),file=pendingFiles[slot]||(input&&input.files&&input.files[0]);
    if(!file){status(slot,"Choisis d’abord une image.","err");return;}
    status(slot,"Enregistrement de l’image en cours…"); const form=new FormData(); form.append("slot",String(slot)); form.append("media",file);
    try{const response=await fetch("/api/admin/hero-media",{method:"POST",body:form});const data=await response.json().catch(function(){return {};});if(!response.ok||!data.success)throw new Error(data.error||"Impossible d’enregistrer l’image.");const box=document.getElementById("sngHeroPreview"+slot);if(box&&data.url)box.innerHTML='<img src="'+escapeHtml(data.url)+'" alt="Image du héros '+slot+'">';if(input)input.value="";delete pendingFiles[slot];status(slot,"Image enregistrée. Elle sera utilisée par le héros.","ok");}
    catch(error){status(slot,error.message||"Erreur d’enregistrement.","err");}
  }

  async function saveCopy(slot){
    const titleInput=document.getElementById("sngHeroTitle"+slot),bodyInput=document.getElementById("sngHeroBody"+slot),title=titleInput?titleInput.value.trim():"",body=bodyInput?bodyInput.value.trim():"";
    if(!title||!body){status(slot,"L’intitulé et le texte doivent être remplis.","err");return;}
    status(slot,"Enregistrement des textes en cours…");
    try{const response=await fetch("/api/admin/hero-content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slot:slot,title:title,body:body})});const data=await response.json().catch(function(){return {};});if(!response.ok||!data.success)throw new Error(data.error||"Impossible d’enregistrer les textes.");status(slot,"Textes enregistrés. Recharge la page d’accueil pour voir le changement.","ok");}
    catch(error){status(slot,error.message||"Erreur d’enregistrement.","err");}
  }

  async function removeImage(slot){
    if(!window.confirm("Retirer cette image du héros ?"))return; status(slot,"Suppression de l’image…");
    try{const response=await fetch("/api/admin/hero-media/"+slot,{method:"DELETE"});const data=await response.json().catch(function(){return {};});if(!response.ok||!data.success)throw new Error(data.error||"Impossible de retirer l’image.");const box=document.getElementById("sngHeroPreview"+slot);if(box)box.textContent="Aucune image enregistrée";status(slot,"Image retirée.","ok");}
    catch(error){status(slot,error.message||"Erreur de suppression.","err");}
  }

  function boot(){let attempts=0;const timer=window.setInterval(function(){if(mount()||++attempts>80)window.clearInterval(timer);},250);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();