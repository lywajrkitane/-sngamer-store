/* SNGAMER STORE — Premium dialogs + mobile-friendly select sheets */
(function(){
  'use strict';
  if(window.__sngPremiumDialogsV1) return;
  window.__sngPremiumDialogsV1 = true;

  const state={selectSheet:null,dialog:null,queue:[]};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  function ensureRoot(){
    let root=document.getElementById('sngPremiumUiRoot');
    if(root) return root;
    root=document.createElement('div'); root.id='sngPremiumUiRoot'; document.body.appendChild(root); return root;
  }

  function closeLayer(backdrop){
    if(!backdrop) return;
    backdrop.classList.remove('is-open');
    document.body.classList.remove('sngpd-lock');
    setTimeout(()=>backdrop.remove(),220);
  }

  function createDialog({title='SNGAMER STORE',message='',icon='✦',confirmText='OK',cancelText='',danger=false,success=false}){
    const root=ensureRoot();
    const backdrop=document.createElement('div'); backdrop.className='sngpd-backdrop';
    backdrop.innerHTML=`<div class="sngpd-dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sngpd-head"><div class="sngpd-icon">${icon}</div><h3 class="sngpd-title">${esc(title)}</h3></div>
      <div class="sngpd-body">${esc(message)}</div>
      <div class="sngpd-actions">${cancelText?`<button type="button" class="sngpd-btn" data-cancel>${esc(cancelText)}</button>`:''}<button type="button" class="sngpd-btn ${danger?'danger':success?'success':'primary'}" data-ok>${esc(confirmText)}</button></div>
    </div>`;
    root.appendChild(backdrop); requestAnimationFrame(()=>{backdrop.classList.add('is-open');document.body.classList.add('sngpd-lock')});
    return backdrop;
  }

  function premiumAlert(message,title='SNGAMER STORE'){
    return new Promise(resolve=>{
      const b=createDialog({title,message,icon:'✓',confirmText:'Compris',success:true});
      b.querySelector('[data-ok]').onclick=()=>{closeLayer(b);resolve(true)};
      b.addEventListener('click',e=>{if(e.target===b){closeLayer(b);resolve(true)}});
    });
  }

  function premiumConfirm(message,opts={}){
    return new Promise(resolve=>{
      const b=createDialog({title:opts.title||'Confirmation',message,icon:opts.icon||'?',confirmText:opts.confirmText||'Confirmer',cancelText:opts.cancelText||'Annuler',danger:!!opts.danger,success:!!opts.success});
      let done=false; const finish=v=>{if(done)return;done=true;closeLayer(b);resolve(v)};
      b.querySelector('[data-ok]').onclick=()=>finish(true);
      b.querySelector('[data-cancel]')?.addEventListener('click',()=>finish(false));
      b.addEventListener('click',e=>{if(e.target===b)finish(false)});
    });
  }

  window.sngPremiumAlert=premiumAlert;
  window.sngPremiumConfirm=premiumConfirm;
  // Existing alert() calls are intentionally upgraded without changing their control flow.
  window.alert=function(message){ premiumAlert(String(message??'')); };

  function selectLabel(select){
    const o=select.options[select.selectedIndex]; return o?o.textContent.trim():'Sélectionner';
  }
  function enhanceSelect(select){
    if(!select || select.dataset.sngPremiumEnhanced==='1' || select.multiple) return;
    select.dataset.sngPremiumEnhanced='1';
    const wrap=document.createElement('div'); wrap.className='sngpd-select-wrap';
    select.parentNode.insertBefore(wrap,select); wrap.appendChild(select); select.classList.add('sngpd-native');
    const trigger=document.createElement('button'); trigger.type='button'; trigger.className='sngpd-select-trigger'; trigger.textContent=selectLabel(select); trigger.setAttribute('aria-haspopup','listbox');
    wrap.insertBefore(trigger,select);
    const open=()=>openSelectSheet(select,trigger);
    trigger.addEventListener('click',open);
    select.addEventListener('change',()=>{trigger.textContent=selectLabel(select)});
  }

  function openSelectSheet(select,trigger){
    if(state.selectSheet) closeLayer(state.selectSheet);
    const root=ensureRoot(), backdrop=document.createElement('div'); backdrop.className='sngpd-backdrop';
    const title=select.getAttribute('aria-label')||select.previousElementSibling?.textContent?.trim()||'Choisir une option';
    const options=Array.from(select.options).map((o,i)=>`<button type="button" class="sngpd-option ${i===select.selectedIndex?'is-selected':''}" data-index="${i}"><span>${esc(o.textContent)}</span><span class="check">✓</span></button>`).join('');
    backdrop.innerHTML=`<div class="sngpd-sheet" role="dialog" aria-modal="true"><div class="sngpd-sheet-head">${esc(title)}</div>${options}</div>`;
    root.appendChild(backdrop); state.selectSheet=backdrop; trigger.classList.add('is-open');
    requestAnimationFrame(()=>{backdrop.classList.add('is-open');document.body.classList.add('sngpd-lock')});
    backdrop.querySelectorAll('.sngpd-option').forEach(btn=>btn.addEventListener('click',()=>{
      const i=Number(btn.dataset.index); select.selectedIndex=i; select.dispatchEvent(new Event('change',{bubbles:true})); select.dispatchEvent(new Event('input',{bubbles:true}));
      trigger.textContent=selectLabel(select); trigger.classList.remove('is-open'); closeLayer(backdrop); state.selectSheet=null;
    }));
    backdrop.addEventListener('click',e=>{if(e.target===backdrop){trigger.classList.remove('is-open');closeLayer(backdrop);state.selectSheet=null}});
  }

  function scan(root=document){ root.querySelectorAll('select').forEach(enhanceSelect); }
  function boot(){
    scan();
    const observer=new MutationObserver(muts=>{for(const m of muts){m.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches?.('select')) enhanceSelect(n); scan(n)}})}});
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.selectSheet){closeLayer(state.selectSheet);state.selectSheet=null;document.querySelectorAll('.sngpd-select-trigger.is-open').forEach(x=>x.classList.remove('is-open'))}});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
