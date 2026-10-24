(function(){
  "use strict";
  if(window.__sngProductColorsAdminV1)return;
  window.__sngProductColorsAdminV1=true;
  const MAX=20;
  const PRESETS={"noir":"#111111","black":"#111111","blanc":"#FFFFFF","white":"#FFFFFF","gris":"#8B919B","gray":"#8B919B","grey":"#8B919B","argent":"#C0C0C0","silver":"#C0C0C0","bleu":"#2563EB","blue":"#2563EB","rouge":"#EF4444","red":"#EF4444","vert":"#16A34A","green":"#16A34A","jaune":"#FACC15","yellow":"#FACC15","rose":"#EC4899","pink":"#EC4899","violet":"#8B5CF6","purple":"#8B5CF6","orange":"#F97316","or":"#D4AF37","gold":"#D4AF37","marron":"#854D0E","brown":"#854D0E","beige":"#D6C6A5"};
  function normalize(rows){return (Array.isArray(rows)?rows:[]).map(function(row){return {name:String(row&&row.name!==undefined?row.name:"").trim().slice(0,40),hex:String(row&&row.hex!==undefined?row.hex:(row&&row.color!==undefined?row.color:"#808080")).trim().toUpperCase()};}).filter(function(row){return row.name;}).slice(0,MAX);}
  function sync(editor){const count=editor.querySelector(".sng-product-colors-count");if(count)count.textContent=editor.querySelectorAll(".sng-product-color-row").length+"/"+MAX;}
  function addRow(editor,row){
    row=row||{};const list=editor.querySelector(".sng-product-colors-rows");if(!list||list.children.length>=MAX)return;
    const item=document.createElement("div");item.className="sng-product-color-row";
    item.innerHTML='<label class="sng-color-name-field"><span>Nom de la couleur</span><input class="sng-product-color-name" type="text" maxlength="40" placeholder="Ex. Gris" autocomplete="off"></label><label class="sng-color-picker-field"><span>Échantillon</span><input class="sng-product-color-hex" type="color" value="#808080" aria-label="Choisir la teinte"></label><button class="sng-product-color-remove" type="button" aria-label="Supprimer la couleur" title="Supprimer">×</button>';
    const name=item.querySelector(".sng-product-color-name"),picker=item.querySelector(".sng-product-color-hex");name.value=String(row.name||"");picker.value=/^#[0-9a-fA-F]{6}$/.test(String(row.hex||""))?String(row.hex).toUpperCase():"#808080";picker.dataset.manual="0";
    picker.addEventListener("input",function(){picker.dataset.manual="1";});
    name.addEventListener("input",function(){const preset=PRESETS[name.value.trim().toLowerCase()];if(preset&&picker.dataset.manual!=="1")picker.value=preset;sync(editor);});
    item.querySelector(".sng-product-color-remove").addEventListener("click",function(){item.remove();sync(editor);});list.appendChild(item);sync(editor);
  }
  function editorMarkup(mode){
    const editor=document.createElement("section");editor.className="sng-product-colors-editor";editor.dataset.sngProductColorsEditor=mode;
    editor.innerHTML='<div class="sng-product-colors-head"><div><h3>🎨 Couleurs disponibles</h3><p>Facultatif. Active cette option uniquement si le client doit choisir une couleur pour ce produit.</p></div><span class="sng-product-colors-count">0/20</span></div><label class="sng-product-colors-toggle"><input type="checkbox" class="sng-product-colors-enabled"><span>Ce produit propose plusieurs couleurs</span></label><div class="sng-product-colors-body" hidden><div class="sng-product-colors-rows"></div><button type="button" class="sng-product-color-add">＋ Ajouter une couleur</button></div>';
    const toggle=editor.querySelector(".sng-product-colors-enabled"),body=editor.querySelector(".sng-product-colors-body");
    toggle.addEventListener("change",function(){body.hidden=!toggle.checked;if(toggle.checked&&!body.querySelector(".sng-product-color-row"))addRow(editor,{});});
    editor.querySelector(".sng-product-color-add").addEventListener("click",function(){toggle.checked=true;body.hidden=false;addRow(editor,{});});return editor;
  }
  function injectStyles(){
    if(document.getElementById("sng-product-colors-admin-css"))return;
    const style=document.createElement("style");style.id="sng-product-colors-admin-css";
    style.textContent=[
      ".sng-product-colors-editor{margin:16px 0 20px;padding:16px;border:1px solid rgba(94,150,224,.24);border-radius:16px;background:linear-gradient(145deg,rgba(17,30,48,.82),rgba(8,15,27,.82));color:#edf4ff}",
      ".sng-product-colors-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}",
      ".sng-product-colors-head h3{font-size:16px;margin:0 0 5px;color:#f4f8ff}",
      ".sng-product-colors-head p{font-size:12px;line-height:1.45;color:#91a4ba;margin:0}",
      ".sng-product-colors-count{flex:0 0 auto;padding:5px 8px;border:1px solid rgba(94,150,224,.25);border-radius:999px;font-size:11px;color:#9cc8ff}",
      ".sng-product-colors-toggle{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:750;color:#e8f0fb;cursor:pointer}",
      ".sng-product-colors-toggle input{width:17px;height:17px;accent-color:#3b9bff}",
      ".sng-product-colors-body{margin-top:14px}",
      ".sng-product-colors-rows{display:grid;gap:9px}",
      ".sng-product-color-row{display:grid;grid-template-columns:minmax(0,1fr) 90px 36px;align-items:end;gap:10px}",
      ".sng-product-color-row label{display:flex;min-width:0;flex-direction:column;gap:5px;color:#a8bed8;font-size:11px;font-weight:800}",
      ".sng-product-color-row input[type=text]{box-sizing:border-box;width:100%;min-width:0;margin:0;padding:10px 12px;border:1px solid rgba(118,151,191,.28);border-radius:10px;background:#080f1a;color:#f3f7ff;font-size:13px}",
      ".sng-product-color-row input[type=color]{box-sizing:border-box;width:100%;height:40px;padding:4px;border:1px solid rgba(118,151,191,.28);border-radius:10px;background:#080f1a}",
      ".sng-product-color-remove{width:36px;height:40px;padding:0;border:1px solid rgba(255,110,130,.24);border-radius:10px;background:rgba(180,40,65,.12);color:#ff9baa;font-size:22px}",
      ".sng-product-color-add{margin-top:12px;padding:10px 13px;border:1px solid rgba(67,148,255,.36);border-radius:11px;background:rgba(30,105,200,.13);color:#a9d2ff;font-size:12px;font-weight:850}",
      "@media(max-width:560px){.sng-product-colors-editor{padding:12px}.sng-product-color-row{grid-template-columns:minmax(0,1fr) 70px 32px;gap:7px}.sng-product-color-row input[type=text]{padding:10px 8px;font-size:12px}.sng-product-color-remove{width:32px}}"
    ].join("\n");
    document.head.appendChild(style);
  }
  function mount(){
    const createForm=document.querySelector(".product-form"),createDesc=document.getElementById("pDescription");
    if(createForm&&createDesc&&!createForm.querySelector('[data-sng-product-colors-editor="create"]')){const anchor=createForm.querySelector('[data-sng-characteristics-editor="create"]')||createDesc;anchor.insertAdjacentElement("afterend",editorMarkup("create"));}
    const editDesc=document.getElementById("editProductDescription");
    if(editDesc){const form=document.getElementById("editProductForm");if(form&&!form.querySelector('[data-sng-product-colors-editor="edit"]')){const anchor=form.querySelector('[data-sng-characteristics-editor="edit"]')||editDesc.closest(".edit-product-field")||editDesc;anchor.insertAdjacentElement("afterend",editorMarkup("edit"));}}
  }
  function getEditor(mode){
    const editor=document.querySelector('[data-sng-product-colors-editor="'+mode+'"]');if(!editor||!editor.querySelector(".sng-product-colors-enabled").checked)return [];
    const rows=Array.from(editor.querySelectorAll(".sng-product-color-row")),result=[],seen=new Set();
    for(const row of rows){const name=String(row.querySelector(".sng-product-color-name").value||"").trim();const hex=String(row.querySelector(".sng-product-color-hex").value||"").trim().toUpperCase();if(!name)continue;if(name.length>40||!/^#[0-9A-F]{6}$/.test(hex))return null;const key=name.toLowerCase();if(seen.has(key))return null;seen.add(key);result.push({name:name,hex:hex});}
    if(result.length>MAX)return null;return result;
  }
  function setEditor(mode,rows){
    mount();const editor=document.querySelector('[data-sng-product-colors-editor="'+mode+'"]');if(!editor)return;
    const list=editor.querySelector(".sng-product-colors-rows");list.innerHTML="";const values=normalize(rows);const enabled=values.length>0;
    editor.querySelector(".sng-product-colors-enabled").checked=enabled;editor.querySelector(".sng-product-colors-body").hidden=!enabled;if(enabled)values.forEach(function(row){addRow(editor,row);});sync(editor);
  }
  window.sngProductColorsGetEditor=getEditor;window.sngProductColorsSetEditor=setEditor;window.sngProductColorsResetEditor=function(mode){setEditor(mode,[]);};
  function installFetchBridge(){
    if(window.__sngProductColorsFetchBridge)return;const originalFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const url=typeof input==="string"?input:(input&&input.url)||"";const method=String((init&&init.method)||(typeof input!=="string"&&input&&input.method)||"GET").toUpperCase();
      const isCreate=method==="POST"&&/\/api\/admin\/products(?:\?|$)/.test(url);const isEdit=method==="PATCH"&&/\/api\/admin\/products\/\d+(?:\?|$)/.test(url);
      if((isCreate||isEdit)&&init&&typeof init.body==="string"){
        let payload;try{payload=JSON.parse(init.body);}catch(_){return originalFetch(input,init);}
        const colors=getEditor(isCreate?"create":"edit");
        if(colors===null)return new Response(JSON.stringify({error:"Vérifie les couleurs : supprime les doublons et choisis une couleur valide."}),{status:400,headers:{"Content-Type":"application/json"}});
        payload.colors=colors;const response=await originalFetch(input,Object.assign({},init,{body:JSON.stringify(payload)}));if(isCreate&&response.ok)setEditor("create",[]);return response;
      }
      return originalFetch(input,init);
    };window.__sngProductColorsFetchBridge=true;
  }
  function init(){injectStyles();mount();installFetchBridge();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  setTimeout(mount,350);setTimeout(mount,1100);
})();