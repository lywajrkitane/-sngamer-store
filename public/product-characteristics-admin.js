(function(){
  "use strict";
  if(window.__sngProductCharacteristicsAdminV1)return;
  window.__sngProductCharacteristicsAdminV1=true;
  const MAX_ROWS=30;
  function normalizeRows(rows){return (Array.isArray(rows)?rows:[]).map(row=>({name:String(row?.name??"").trim().slice(0,80),value:String(row?.value??"").trim().slice(0,300)})).filter(row=>row.name&&row.value).slice(0,MAX_ROWS)}
  function syncCount(editor){const label=editor.querySelector(".sng-characteristics-count");if(label)label.textContent=editor.querySelectorAll(".sng-characteristic-editor-row").length+"/30"}
  function addRow(editor,row={}){
    const list=editor.querySelector(".sng-characteristics-rows");if(!list||list.children.length>=MAX_ROWS)return;
    const item=document.createElement("div");item.className="sng-characteristic-editor-row";
    item.innerHTML='<label><span>Caractéristique</span><input class="sng-characteristic-name" type="text" maxlength="80" placeholder="Ex. Processeur" autocomplete="off"></label><label><span>Valeur</span><input class="sng-characteristic-value" type="text" maxlength="300" placeholder="Ex. Intel Core i7" autocomplete="off"></label><button class="sng-characteristic-remove" type="button" aria-label="Supprimer cette caractéristique" title="Supprimer">×</button>';
    item.querySelector(".sng-characteristic-name").value=String(row.name??"");item.querySelector(".sng-characteristic-value").value=String(row.value??"");
    item.querySelector(".sng-characteristic-remove").addEventListener("click",function(){item.remove();if(!list.children.length)addRow(editor);syncCount(editor)});
    list.appendChild(item);syncCount(editor);
  }
  function editorMarkup(mode){
    const editor=document.createElement("section");editor.className="sng-characteristics-editor";editor.dataset.sngCharacteristicsEditor=mode;
    editor.innerHTML='<div class="sng-characteristics-editor-head"><div><h3>⚙️ Caractéristiques du produit</h3><p>Facultatif : renseigne les spécifications utiles (processeur, RAM, stockage, dimensions…).</p></div><span class="sng-characteristics-count">0/30</span></div><div class="sng-characteristics-rows"></div><button class="sng-characteristic-add" type="button">＋ Ajouter une caractéristique</button>';
    editor.querySelector(".sng-characteristic-add").addEventListener("click",function(){addRow(editor)});addRow(editor);return editor;
  }
  function injectStyles(){
    if(document.getElementById("sng-characteristics-admin-styles"))return;
    const style=document.createElement("style");style.id="sng-characteristics-admin-styles";
    style.textContent=`
      .sng-characteristics-editor{margin:16px 0 20px;padding:16px;border:1px solid rgba(94,150,224,.24);border-radius:16px;background:linear-gradient(145deg,rgba(17,30,48,.82),rgba(8,15,27,.82));color:#edf4ff}
      .sng-characteristics-editor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
      .sng-characteristics-editor-head h3{font-size:16px;margin:0 0 5px;color:#f4f8ff}
      .sng-characteristics-editor-head p{font-size:12px;line-height:1.45;color:#91a4ba;margin:0}
      .sng-characteristics-count{flex:0 0 auto;padding:5px 8px;border:1px solid rgba(94,150,224,.25);border-radius:999px;font-size:11px;color:#9cc8ff}
      .sng-characteristics-rows{display:grid;gap:9px}
      .sng-characteristic-editor-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr) 34px;align-items:end;gap:9px}
      .sng-characteristic-editor-row label{display:flex;min-width:0;flex-direction:column;gap:5px;color:#a8bed8;font-size:11px;font-weight:800}
      .sng-characteristic-editor-row input{box-sizing:border-box;width:100%;min-width:0;margin:0;padding:11px 12px;border:1px solid rgba(118,151,191,.28);border-radius:10px;background:#080f1a;color:#f3f7ff;font:inherit;font-size:13px}
      .sng-characteristic-editor-row input:focus{outline:2px solid rgba(52,142,255,.5);outline-offset:1px;border-color:#4c9cff}
      .sng-characteristic-remove{width:34px;height:40px;padding:0;border:1px solid rgba(255,110,130,.24);border-radius:10px;background:rgba(180,40,65,.12);color:#ff9baa;font-size:22px}
      .sng-characteristic-add{margin-top:12px;padding:10px 13px;border:1px solid rgba(67,148,255,.36);border-radius:11px;background:rgba(30,105,200,.13);color:#a9d2ff;font-size:12px;font-weight:850}
      @media(max-width:560px){.sng-characteristics-editor{padding:12px}.sng-characteristic-editor-row{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 32px;gap:6px}.sng-characteristic-editor-row input{padding:10px 8px;font-size:12px}.sng-characteristic-remove{width:32px}}
    `;
    document.head.appendChild(style);
  }
  function mount(){
    const createForm=document.querySelector(".product-form"),createDesc=document.getElementById("pDescription");
    if(createForm&&createDesc&&!createForm.querySelector('[data-sng-characteristics-editor="create"]'))createDesc.insertAdjacentElement("afterend",editorMarkup("create"));
    const editDesc=document.getElementById("editProductDescription");
    if(editDesc){const parent=editDesc.closest(".edit-product-field")||editDesc.parentElement;const editForm=document.getElementById("editProductForm");if(parent&&editForm&&!editForm.querySelector('[data-sng-characteristics-editor="edit"]'))parent.insertAdjacentElement("afterend",editorMarkup("edit"))}
  }
  function getEditor(mode){
    const editor=document.querySelector('[data-sng-characteristics-editor="'+mode+'"]');if(!editor)return [];
    const els=Array.from(editor.querySelectorAll(".sng-characteristic-editor-row"));
    const incomplete=els.some(el=>{const name=String(el.querySelector(".sng-characteristic-name")?.value||"").trim();const value=String(el.querySelector(".sng-characteristic-value")?.value||"").trim();return Boolean(name)!==Boolean(value)});
    if(incomplete)return null;
    return normalizeRows(els.map(el=>({name:el.querySelector(".sng-characteristic-name")?.value,value:el.querySelector(".sng-characteristic-value")?.value})));
  }
  function setEditor(mode,rows){
    mount();const editor=document.querySelector('[data-sng-characteristics-editor="'+mode+'"]');if(!editor)return;
    const list=editor.querySelector(".sng-characteristics-rows");list.innerHTML="";const vals=normalizeRows(rows);
    if(vals.length)vals.forEach(row=>addRow(editor,row));else addRow(editor);syncCount(editor);
  }
  window.sngProductCharacteristicsGetEditor=getEditor;
  window.sngProductCharacteristicsSetEditor=setEditor;
  window.sngProductCharacteristicsResetEditor=function(mode){setEditor(mode,[])};
  function installFetchBridge(){
    if(window.__sngCharacteristicsFetchBridge)return;
    const originalFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const url=typeof input==="string"?input:(input?.url||"");
      const method=String(init?.method||(typeof input!=="string"?input?.method:"GET")||"GET").toUpperCase();
      const isCreate=method==="POST"&&/\/api\/admin\/products(?:\?|$)/.test(url);
      const isEdit=method==="PATCH"&&/\/api\/admin\/products\/\d+(?:\?|$)/.test(url);
      if((isCreate||isEdit)&&init&&typeof init.body==="string"){
        let payload;try{payload=JSON.parse(init.body)}catch(_){return originalFetch(input,init)}
        const rows=getEditor(isCreate?"create":"edit");
        if(rows===null)return new Response(JSON.stringify({error:"Complète le nom et la valeur de chaque caractéristique renseignée."}),{status:400,headers:{"Content-Type":"application/json"}});
        payload.characteristics=rows;
        const response=await originalFetch(input,{...init,body:JSON.stringify(payload)});
        if(isCreate&&response.ok)setEditor("create",[]);
        return response;
      }
      return originalFetch(input,init);
    };
    window.__sngCharacteristicsFetchBridge=true;
  }
  function init(){injectStyles();mount();installFetchBridge()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  setTimeout(mount,300);setTimeout(mount,1000);
})();