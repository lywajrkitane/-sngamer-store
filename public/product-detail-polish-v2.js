(function(){
  "use strict";

  const STYLE_ID="sng-product-polish-v2";

  function installStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .sngProductDescriptionV1 .sngDescriptionCollapsed{display:block;}
      .sngProductDescriptionV1 .sngDescriptionFull{display:none;}
      .sngProductDescriptionV1.isExpanded .sngDescriptionCollapsed{display:none;}
      .sngProductDescriptionV1.isExpanded .sngDescriptionFull{display:block;}
      .sngDescriptionToggle{
        display:inline-flex!important;align-items:center;gap:6px;margin-top:8px;padding:0;
        border:0;background:transparent;color:#65b5ff;font:inherit;font-weight:800;cursor:pointer;
      }
      .sngProductAssuranceGrid{order:initial!important;}
      .sngProductInfoV1>.sngProductAssuranceGrid{margin-top:16px;}
      .sngProductInfoV1>.productDescriptionSection{margin-top:18px;}
      .sngProductAssuranceGrid .sngAssuranceItem{min-width:0!important;min-height:112px!important;height:112px!important;box-sizing:border-box!important;}
      .sngProductAssuranceGrid .sngAssuranceCopy{min-width:0!important;overflow:hidden!important;}
      .sngProductAssuranceGrid .sngAssuranceCopy strong,
      .sngProductAssuranceGrid .sngAssuranceCopy p,
      .sngProductAssuranceGrid .sngAssuranceCopy small{display:block;overflow:hidden;text-overflow:ellipsis;}
      @media(max-width:560px){
        .sngProductAssuranceGrid{gap:8px!important;}
        .sngProductAssuranceGrid .sngAssuranceItem{padding:10px 8px!important;min-height:106px!important;height:106px!important;}
        .sngProductAssuranceGrid .sngAssuranceIcon{width:38px!important;height:38px!important;min-width:38px!important;}
        .sngProductAssuranceGrid .sngAssuranceEyebrow{font-size:10px!important;letter-spacing:.7px!important;}
        .sngProductAssuranceGrid .sngAssuranceCopy strong{font-size:13px!important;line-height:1.2!important;}
        .sngProductAssuranceGrid .sngAssuranceCopy p{font-size:11px!important;line-height:1.2!important;margin:3px 0 0!important;}
        .sngProductAssuranceGrid .sngAssuranceCopy small{font-size:9px!important;line-height:1.2!important;margin-top:3px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value=""){
    return String(value).replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#039;"}[c]));
  }

  function ensureWarrantyCard(grid){
    if(!grid) return;
    if(grid.querySelector(".sngWarrantyModule")) return;
    const card=document.createElement("div");
    card.className="sngAssuranceItem sngWarrantyModule";
    card.innerHTML=`<span class="sngAssuranceIcon" aria-hidden="true">🛡️</span><div class="sngAssuranceCopy"><span class="sngAssuranceEyebrow">GARANTIE</span><strong>À définir</strong></div>`;
    grid.appendChild(card);
  }

  function polishDescription(info){
    const section=info?.querySelector(".sngProductDescriptionV1");
    const paragraph=section?.querySelector(".productDescription");
    if(!section||!paragraph||section.dataset.polished==="1") return;
    section.dataset.polished="1";
    const fullHTML=paragraph.innerHTML;
    const text=paragraph.textContent.trim();
    const sentences=text.split(/(?<=[.!?])\s+/).filter(Boolean);
    if(sentences.length<3) return;
    const shortText=sentences.slice(0,2).join(" ");
    paragraph.innerHTML=`<span class="sngDescriptionCollapsed">${escapeHtml(shortText)}…</span><span class="sngDescriptionFull">${fullHTML}</span>`;
    const button=document.createElement("button");
    button.type="button";
    button.className="sngDescriptionToggle";
    button.setAttribute("aria-expanded","false");
    button.textContent="Voir plus ▾";
    button.addEventListener("click",function(){
      const expanded=section.classList.toggle("isExpanded");
      button.setAttribute("aria-expanded",String(expanded));
      button.textContent=expanded?"Voir moins ▴":"Voir plus ▾";
    });
    section.appendChild(button);
  }

  function moveModules(info){
    if(!info) return;
    const assurance=info.querySelector(":scope > .sngProductAssuranceGrid");
    const description=info.querySelector(":scope > .productDescriptionSection");
    if(!assurance||!description) return;
    ensureWarrantyCard(assurance);
    description.insertAdjacentElement("afterend",assurance);
  }

  function patch(){
    installStyles();
    const info=document.querySelector("#productDetail .sngProductInfoV1");
    if(!info) return;
    moveModules(info);
    polishDescription(info);
  }

  function patchOpenProduct(){
    if(typeof window.openProduct!=="function"||window.__sngProductPolishV2) return;
    const original=window.openProduct;
    window.openProduct=function(id){
      const result=original.apply(this,arguments);
      requestAnimationFrame(()=>requestAnimationFrame(patch));
      setTimeout(patch,250);
      return result;
    };
    window.__sngProductPolishV2=true;
  }

  function start(){
    installStyles();
    patchOpenProduct();
    patch();
    const observer=new MutationObserver(()=>{patchOpenProduct();});
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
