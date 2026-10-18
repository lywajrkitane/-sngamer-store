/* SNGAMER STORE — Premium campaign dialogs */
(function () {
  'use strict';
  if (window.__sngPremiumCampaignDialogsV2) return;
  window.__sngPremiumCampaignDialogsV2 = true;

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' }[c]));
  function root() { let el=document.getElementById('sngPremiumUiRoot'); if(!el){el=document.createElement('div');el.id='sngPremiumUiRoot';document.body.appendChild(el);} return el; }
  function close(backdrop){if(!backdrop)return;backdrop.classList.remove('is-open');document.body.classList.remove('sngpd-lock');setTimeout(()=>backdrop.remove(),220);}
  function premiumPrompt(message, defaultValue='', options={}) {
    return new Promise(resolve=>{
      const backdrop=document.createElement('div');backdrop.className='sngpd-backdrop';
      backdrop.innerHTML=`<div class="sngpd-dialog" role="dialog" aria-modal="true"><div class="sngpd-head"><div class="sngpd-icon">✎</div><h3 class="sngpd-title">${esc(options.title||'Modifier')}</h3></div><div class="sngpd-body"><div style="margin-bottom:10px">${esc(message)}</div><input data-sng-prompt-input type="text" value="${esc(defaultValue)}" style="width:100%;height:48px;padding:0 14px;border-radius:14px;border:1px solid rgba(92,150,255,.30);background:rgba(5,12,23,.92);color:#f6f8ff;outline:none;font:inherit;font-weight:700;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);"></div><div class="sngpd-actions"><button type="button" class="sngpd-btn" data-cancel>Annuler</button><button type="button" class="sngpd-btn primary" data-ok>Continuer</button></div></div>`;
      root().appendChild(backdrop);const input=backdrop.querySelector('[data-sng-prompt-input]');let done=false;
      const finish=value=>{if(done)return;done=true;close(backdrop);resolve(value);};
      backdrop.querySelector('[data-ok]').onclick=()=>finish(input.value);backdrop.querySelector('[data-cancel]').onclick=()=>finish(null);backdrop.addEventListener('click',e=>{if(e.target===backdrop)finish(null)});input.addEventListener('keydown',e=>{if(e.key==='Enter')finish(input.value);if(e.key==='Escape')finish(null)});
      requestAnimationFrame(()=>{backdrop.classList.add('is-open');document.body.classList.add('sngpd-lock');input.focus();input.select();});
    });
  }
  window.sngPremiumPrompt=premiumPrompt;

  async function premiumEditCampaign(id){
    try{
      const response=await fetch('/api/admin/campaigns');const data=await response.json();if(!response.ok)throw new Error(data.error||'Impossible de charger les campagnes.');
      const campaigns=Array.isArray(data)?data:(data.campaigns||data.data||[]);const campaign=campaigns.find(item=>Number(item.id)===Number(id));if(!campaign)throw new Error('Campagne introuvable.');
      const name=await premiumPrompt('Nom de la campagne',campaign.name||'',{title:'Modifier la campagne'});if(name===null)return;if(!name.trim()){await window.sngPremiumAlert?.('Le nom de la campagne est obligatoire.',{title:'Campagne',icon:'⚠️',confirmText:'Compris'});return;}
      const sticker=await premiumPrompt('Autocollant gauche',campaign.sticker||'',{title:'Modifier la campagne'});if(sticker===null)return;
      const rightSticker=await premiumPrompt('Autocollant droit',campaign.right_sticker||'',{title:'Modifier la campagne'});if(rightSticker===null)return;
      const description=await premiumPrompt('Description',campaign.description||'',{title:'Modifier la campagne'});if(description===null)return;
      const confirmed=window.sngPremiumConfirm?await window.sngPremiumConfirm('Enregistrer les modifications de cette campagne ?',{title:'Enregistrer les modifications',icon:'✓',confirmText:'Enregistrer',cancelText:'Annuler',success:true}):false;if(!confirmed)return;
      const updateResponse=await fetch(`/api/admin/campaigns/${encodeURIComponent(id)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.trim(),sticker,right_sticker:rightSticker,description,active:Boolean(campaign.active),start_date:campaign.start_date||null,end_date:campaign.end_date||null})});
      const result=await updateResponse.json();if(!updateResponse.ok)throw new Error(result.error||'Impossible de modifier la campagne.');
      if(typeof window.loadCampaigns==='function')await window.loadCampaigns();if(window.sngPremiumAlert)await window.sngPremiumAlert('Campagne modifiée avec succès !',{title:'Campagne',icon:'✓',confirmText:'Compris',success:true});
    }catch(error){console.error('PREMIUM_EDIT_CAMPAIGN_ERROR:',error);if(window.sngPremiumAlert)await window.sngPremiumAlert(error.message||'Erreur lors de la modification.',{title:'Campagne',icon:'⚠️',confirmText:'Fermer'});}
  }
  async function premiumDeleteCampaign(id){
    const confirmed=window.sngPremiumConfirm?await window.sngPremiumConfirm('Voulez-vous vraiment supprimer cette campagne ? Cette action est irréversible.',{title:'Supprimer la campagne',icon:'🗑️',confirmText:'Supprimer',cancelText:'Annuler',danger:true}):false;if(!confirmed)return;
    try{const response=await fetch('/api/admin/campaigns/'+encodeURIComponent(id),{method:'DELETE'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Impossible de supprimer la campagne.');if(typeof window.loadCampaigns==='function')await window.loadCampaigns();if(window.sngPremiumAlert)await window.sngPremiumAlert('Campagne supprimée avec succès !',{title:'Campagne',icon:'✓',confirmText:'Compris',success:true});}
    catch(error){console.error('PREMIUM_DELETE_CAMPAIGN_ERROR:',error);if(window.sngPremiumAlert)await window.sngPremiumAlert(error.message||'Erreur lors de la suppression.',{title:'Campagne',icon:'⚠️',confirmText:'Fermer'});}
  }
  function patch(){if(typeof window.editCampaign==='function')window.editCampaign=premiumEditCampaign;if(typeof window.deleteCampaign==='function')window.deleteCampaign=premiumDeleteCampaign;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
  let attempts=0;const timer=setInterval(()=>{patch();if(++attempts>=120)clearInterval(timer);},100);
})();
