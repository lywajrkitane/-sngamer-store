/* SNGAMER ADMIN — PRODUCT PREMIUM EDITOR V1 */
(function(){
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let products=[];
  function section(){return document.querySelector('#adminBox section')}
  function ensure(){
    const host=section();if(!host||$('#sngPremiumProductEditor'))return;
    const el=document.createElement('div');el.id='sngPremiumProductEditor';el.className='sngPremiumProductEditor';el.innerHTML=`<div class="sngEditorHead"><div><span class="sngAdminEyebrow">FICHE PRODUIT PREMIUM</span><h3>Caractéristiques techniques</h3><p>Ajoute les informations techniques qui apparaîtront automatiquement sur la fiche produit.</p></div><span class="sngEditorBadge">SNGAMER</span></div><div class="sngEditorControls"><select id="sngSpecProduct"><option value="">Sélectionner un produit</option></select><button type="button" class="sngSecondary" id="sngLoadSpec">Charger</button></div><div id="sngSpecRows"></div><div class="sngSpecActions"><button type="button" class="sngSecondary" id="sngAddSpec">+ Ajouter une caractéristique</button><button type="button" class="sngPrimary" id="sngSaveSpec">Enregistrer les caractéristiques</button></div><div id="sngSpecStatus" class="sngSpecStatus"></div>`;
    host.appendChild(el);
    $('#sngSpecProduct').addEventListener('change',()=>loadSpecs($('#sngSpecProduct').value));
    $('#sngLoadSpec').addEventListener('click',()=>loadSpecs($('#sngSpecProduct').value));
    $('#sngAddSpec').addEventListener('click',()=>addRow());
    $('#sngSaveSpec').addEventListener('click',saveSpecs);
  }
  function addRow(k='',v=''){const root=$('#sngSpecRows');if(!root)return;const row=document.createElement('div');row.className='sngSpecEditRow';row.innerHTML=`<input class="sngSpecKey" placeholder="Ex. DPI" value="${esc(k)}"><input class="sngSpecValue" placeholder="Ex. 12 000" value="${esc(v)}"><button type="button" class="sngRemoveSpec" aria-label="Supprimer">×</button>`;row.querySelector('.sngRemoveSpec').onclick=()=>row.remove();root.appendChild(row)}
  async function loadSpecs(id){const root=$('#sngSpecRows');if(!root)return;root.innerHTML='';if(!id)return;try{const r=await fetch('/api/admin/product-specs/'+id,{cache:'no-store'});const d=await r.json();Object.entries(d.specs||{}).forEach(([k,v])=>addRow(k,v));if(!root.children.length)addRow();setStatus('Caractéristiques chargées.','ok')}catch(_){addRow();setStatus('Impossible de charger les caractéristiques.','error')}}
  async function saveSpecs(){const id=Number($('#sngSpecProduct')?.value);if(!id)return setStatus('Sélectionne un produit.','error');const specs={};document.querySelectorAll('#sngSpecRows .sngSpecEditRow').forEach(row=>{const k=row.querySelector('.sngSpecKey')?.value.trim(),v=row.querySelector('.sngSpecValue')?.value.trim();if(k&&v)specs[k]=v});try{const r=await fetch('/api/admin/product-specs/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Erreur');setStatus('✓ Caractéristiques enregistrées.','ok')}catch(e){setStatus(e.message||'Erreur lors de l’enregistrement.','error')}}
  function setStatus(text,type){const el=$('#sngSpecStatus');if(el){el.textContent=text;el.className='sngSpecStatus '+type;}}
  async function loadProducts(){try{const r=await fetch('/api/products',{cache:'no-store'});products=await r.json();const sel=$('#sngSpecProduct');if(!sel)return;const current=sel.value;sel.innerHTML='<option value="">Sélectionner un produit</option>'+products.map(p=>`<option value="${Number(p.id)}">${esc(p.name)} — ${esc(p.category||'Gaming')}</option>`).join('');sel.value=current}catch(_){} }
  function boot(){ensure();loadProducts();setTimeout(loadProducts,900)}
  const observer=new MutationObserver(()=>{if($('#adminBox')&&!$('#adminBox').classList.contains('hidden'))boot()});observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
