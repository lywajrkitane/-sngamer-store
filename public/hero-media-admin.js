(function(){
  "use strict";
  if(window.__sngamerHeroMediaAdminV1) return;
  window.__sngamerHeroMediaAdminV1 = true;

  const SLOTS = [
    {slot:1, title:"Image 1 — Bienvenue", desc:"Bienvenue sur SNGAMER STORE"},
    {slot:2, title:"Image 2 — Commande rapide", desc:"Choisis ton produit et commande"},
    {slot:3, title:"Image 3 — Livraison", desc:"Livraison partout au Sénégal et dans la sous-région"}
  ];

  function css(){
    if(document.getElementById("sngHeroMediaAdminStyles")) return;
    const s=document.createElement("style");
    s.id="sngHeroMediaAdminStyles";
    s.textContent=`
      .sngHeroMediaAdmin{margin:24px 0;padding:22px;border:1px solid rgba(73,145,255,.28);border-radius:22px;background:linear-gradient(145deg,rgba(9,18,35,.98),rgba(14,11,31,.98));box-shadow:0 18px 45px rgba(0,0,0,.22)}
      .sngHeroMediaAdmin *{box-sizing:border-box}
      .sngHeroMediaAdminHead{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}
      .sngHeroMediaAdmin h2{margin:0 0 7px;font-size:22px;color:#fff}
      .sngHeroMediaAdmin p{margin:0;color:#9eb0c8;font-size:13px;line-height:1.5}
      .sngHeroMediaAdminNote{padding:9px 12px;border-radius:12px;background:rgba(44,132,255,.08);border:1px solid rgba(80,157,255,.18);color:#a9d4ff;font-size:12px;white-space:nowrap}
      .sngHeroMediaAdminGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .sngHeroMediaAdminCard{min-width:0;padding:13px;border-radius:18px;border:1px solid rgba(93,135,190,.22);background:rgba(3,10,22,.62)}
      .sngHeroMediaAdminCard h3{margin:0 0 4px;color:#fff;font-size:14px}
      .sngHeroMediaAdminCard small{display:block;color:#7f92ad;font-size:11px;line-height:1.35;min-height:30px}
      .sngHeroMediaAdminPreview{margin:11px 0;border-radius:12px;overflow:hidden;aspect-ratio:1536/572;background:#07111f;border:1px dashed rgba(86,153,224,.28);display:flex;align-items:center;justify-content:center;color:#5f7898;font-size:12px;text-align:center}
      .sngHeroMediaAdminPreview img{display:block;width:100%;height:100%;object-fit:cover}
      .sngHeroMediaAdminActions{display:flex;gap:7px;flex-wrap:wrap}
      .sngHeroMediaAdminActions button,.sngHeroMediaAdminActions label{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:8px 11px;border-radius:10px;border:1px solid rgba(91,156,255,.28);background:linear-gradient(135deg,#147dff,#5b35ff 58%,#d326a8);color:#fff;font-weight:800;font-size:12px;cursor:pointer;text-decoration:none}
      .sngHeroMediaAdminActions button.secondary{background:rgba(18,29,48,.9);border-color:rgba(100,130,165,.25);color:#a9bad0}
      .sngHeroMediaAdminActions input{display:none}
      .sngHeroMediaAdminStatus{margin-top:8px;font-size:11px;color:#8ea5c0;min-height:15px}
      .sngHeroMediaAdminStatus.ok{color:#7ee2ad}.sngHeroMediaAdminStatus.err{color:#ff9292}
      @media(max-width:900px){.sngHeroMediaAdminGrid{grid-template-columns:1fr 1fr}.sngHeroMediaAdminHead{flex-direction:column}.sngHeroMediaAdminNote{white-space:normal}}
      @media(max-width:600px){.sngHeroMediaAdmin{padding:16px;border-radius:18px}.sngHeroMediaAdminGrid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function card(slot){
    return `<article class="sngHeroMediaAdminCard" data-hero-admin-slot="${slot.slot}">
      <h3>${slot.title}</h3>
      <small>${slot.desc}</small>
      <div class="sngHeroMediaAdminPreview" id="sngHeroPreview${slot.slot}">Aucune image enregistrée</div>
      <div class="sngHeroMediaAdminActions">
        <label for="sngHeroFile${slot.slot}">Choisir une image</label>
        <input id="sngHeroFile${slot.slot}" type="file" accept="image/*">
        <button type="button" data-hero-upload="${slot.slot}">Enregistrer</button>
        <button type="button" class="secondary" data-hero-remove="${slot.slot}">Retirer</button>
      </div>
      <div class="sngHeroMediaAdminStatus" id="sngHeroStatus${slot.slot}"></div>
    </article>`;
  }

  function mount(){
    if(document.getElementById("sngHeroMediaAdmin")) return true;
    css();
    const root=document.createElement("section");
    root.id="sngHeroMediaAdmin";
    root.className="sngHeroMediaAdmin";
    root.innerHTML=`
      <div class="sngHeroMediaAdminHead">
        <div><h2>Héros de la page d'accueil</h2><p>Gère ici les 3 images du carrousel. Les cadres, le bouton d'annonce, les textes de navigation et le défilement restent gérés automatiquement sur la boutique.</p></div>
        <div class="sngHeroMediaAdminNote">Format conseillé : 1536 × 572 px · ratio ≈ 2,69:1</div>
      </div>
      <div class="sngHeroMediaAdminGrid">${SLOTS.map(card).join("")}</div>
    `;

    const target = document.querySelector("main") || document.querySelector("#app") || document.body;
    const heading = Array.from(document.querySelectorAll("h1,h2,h3")).find(el=>/campagnes|promotions|produits|tableau de bord/i.test(el.textContent||""));
    if(heading && heading.parentElement) heading.parentElement.parentElement?.insertBefore(root, heading.parentElement.nextSibling);
    else target.prepend(root);

    SLOTS.forEach(({slot})=>{
      document.getElementById(`sngHeroFile${slot}`)?.addEventListener("change",()=>previewLocal(slot));
      document.querySelector(`[data-hero-upload="${slot}"]`)?.addEventListener("click",()=>save(slot));
      document.querySelector(`[data-hero-remove="${slot}"]`)?.addEventListener("click",()=>remove(slot));
    });
    load();
    return true;
  }

  function status(slot,text,type){
    const el=document.getElementById(`sngHeroStatus${slot}`); if(!el) return;
    el.textContent=text||""; el.className="sngHeroMediaAdminStatus"+(type?` ${type}`:"");
  }

  function previewLocal(slot){
    const input=document.getElementById(`sngHeroFile${slot}`), box=document.getElementById(`sngHeroPreview${slot}`);
    const file=input?.files?.[0]; if(!file||!box) return;
    const url=URL.createObjectURL(file);
    box.innerHTML=`<img src="${url}" alt="Aperçu de l'image ${slot}">`;
    status(slot,`${file.name} — prêt à être enregistré`);
  }

  async function load(){
    try{
      const r=await fetch("/api/hero-media",{cache:"no-store"});
      if(!r.ok) return;
      const data=await r.json();
      (data.hero||[]).forEach(item=>{
        const box=document.getElementById(`sngHeroPreview${item.slot}`);
        if(box && item.url) box.innerHTML=`<img src="${item.url}" alt="Image héros ${item.slot}">`;
      });
    }catch(e){console.error("HERO_MEDIA_ADMIN_LOAD_ERROR",e)}
  }

  async function save(slot){
    const input=document.getElementById(`sngHeroFile${slot}`), file=input?.files?.[0];
    if(!file){status(slot,"Choisis d'abord une image.","err");return;}
    status(slot,"Enregistrement en cours…");
    const form=new FormData(); form.append("slot",String(slot)); form.append("media",file);
    try{
      const r=await fetch("/api/admin/hero-media",{method:"POST",body:form});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||!data.success) throw new Error(data.error||"Impossible d'enregistrer l'image.");
      const box=document.getElementById(`sngHeroPreview${slot}`);
      if(box&&data.url) box.innerHTML=`<img src="${data.url}" alt="Image héros ${slot}">`;
      input.value="";
      status(slot,"Image enregistrée. Elle sera utilisée par le héros.","ok");
    }catch(e){status(slot,e.message||"Erreur d'enregistrement.","err")}
  }

  async function remove(slot){
    if(!confirm("Retirer cette image du héros ?")) return;
    status(slot,"Suppression…");
    try{
      const r=await fetch(`/api/admin/hero-media/${slot}`,{method:"DELETE"});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||!data.success) throw new Error(data.error||"Impossible de retirer l'image.");
      const box=document.getElementById(`sngHeroPreview${slot}`);
      if(box) box.textContent="Aucune image enregistrée";
      status(slot,"Image retirée.","ok");
    }catch(e){status(slot,e.message||"Erreur de suppression.","err")}
  }

  function boot(){
    let n=0;
    const timer=setInterval(()=>{if(mount()||++n>80)clearInterval(timer)},250);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true}); else boot();
})();
