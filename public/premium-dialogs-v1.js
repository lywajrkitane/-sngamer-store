/* SNGAMER STORE — Premium dialogs + mobile-friendly select sheets */
(function(){
  'use strict';
  if(window.__sngPremiumDialogsV2) return;
  window.__sngPremiumDialogsV2 = true;

  // Do not depend on the external CSS tag being injected correctly. Admin pages can
  // be assembled by several server-side wrappers, so the premium layer carries its
  // critical CSS with it. This is what guarantees that the native Android <select>
  // sheet can never remain visible behind the premium trigger.
  const styleId='sngPremiumDialogsInlineStyle';
  if(!document.getElementById(styleId)){
    const style=document.createElement('style');
    style.id=styleId;
    style.textContent=`
      body.sngpd-lock{overflow:hidden!important}
      .sngpd-backdrop{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(1,5,12,.74);backdrop-filter:blur(16px) saturate(135%);-webkit-backdrop-filter:blur(16px) saturate(135%);opacity:0;pointer-events:none;transition:opacity .2s ease}
      .sngpd-backdrop.is-open{opacity:1;pointer-events:auto}
      .sngpd-dialog{width:min(440px,calc(100vw - 32px));max-height:min(78vh,680px);overflow:auto;border:1px solid rgba(92,150,255,.28);border-radius:24px;background:linear-gradient(145deg,rgba(17,28,47,.99),rgba(7,13,24,.99));box-shadow:0 30px 90px rgba(0,0,0,.68),0 0 55px rgba(67,91,255,.16);transform:translateY(16px) scale(.97);transition:transform .28s cubic-bezier(.22,1,.36,1)}
      .sngpd-backdrop.is-open .sngpd-dialog{transform:none}
      .sngpd-head{display:flex;align-items:center;gap:12px;padding:22px 22px 14px}.sngpd-icon{width:42px;height:42px;flex:0 0 42px;border-radius:14px;display:grid;place-items:center;font-size:20px;background:linear-gradient(135deg,#237cff,#7b35ff 65%,#e33cff);box-shadow:0 8px 25px rgba(75,91,255,.28)}.sngpd-title{margin:0;color:#f6f8ff;font-size:18px;font-weight:900}.sngpd-body{padding:0 22px 20px;color:#9eacc2;font-size:14px;line-height:1.65;white-space:pre-line}.sngpd-actions{display:flex;gap:10px;padding:0 22px 22px}.sngpd-btn{appearance:none;border:1px solid rgba(255,255,255,.08);border-radius:14px;min-height:46px;padding:0 17px;flex:1;font:inherit;font-weight:900;color:#fff;cursor:pointer;background:rgba(255,255,255,.045)}.sngpd-btn.primary{border-color:transparent;background:linear-gradient(135deg,#237cff,#713cff 62%,#d93cff);box-shadow:0 10px 28px rgba(71,72,255,.25)}.sngpd-btn.danger{background:linear-gradient(135deg,#b72b49,#df3c62);border-color:transparent}.sngpd-btn.success{background:linear-gradient(135deg,#11824d,#22b56b);border-color:transparent}
      .sngpd-select-wrap{position:relative!important;width:100%!important;min-width:0!important;display:block!important}
      .sngpd-select-wrap>select.sngpd-native{position:absolute!important;left:0!important;top:0!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;z-index:-1!important;margin:0!important;padding:0!important}
      .sngpd-select-trigger{width:100%!important;min-height:46px!important;padding:11px 42px 11px 14px!important;border-radius:12px!important;border:1px solid rgba(83,126,194,.3)!important;background:linear-gradient(145deg,rgba(13,24,40,.98),rgba(8,15,26,.98))!important;color:#eef3ff!important;text-align:left!important;position:relative!important;cursor:pointer!important;font:inherit!important;font-weight:700!important;box-sizing:border-box!important}
      .sngpd-select-trigger:after{content:"";position:absolute;right:15px;top:50%;width:8px;height:8px;border-right:2px solid #8ca5c8;border-bottom:2px solid #8ca5c8;transform:translateY(-65%) rotate(45deg)}
      .sngpd-sheet{width:min(480px,calc(100vw - 28px));max-height:min(78vh,620px);overflow:auto;padding:8px;border-radius:24px;background:linear-gradient(145deg,rgba(18,29,48,.99),rgba(7,13,24,.99));border:1px solid rgba(91,144,255,.3);box-shadow:0 30px 90px rgba(0,0,0,.68),0 0 50px rgba(73,92,255,.14)}
      .sngpd-sheet-head{padding:10px 12px 12px;color:#aab9d1;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.11em}.sngpd-option{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:14px 13px;border:0;border-radius:14px;background:transparent;color:#f5f7ff;text-align:left;font:inherit;font-weight:750;cursor:pointer}.sngpd-option.is-selected{background:linear-gradient(90deg,rgba(49,118,255,.18),rgba(126,59,255,.12));box-shadow:inset 0 0 0 1px rgba(86,139,255,.16)}.sngpd-option .check{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(149,166,197,.3);color:transparent;font-size:12px;flex:0 0 22px}.sngpd-option.is-selected .check{color:#fff;border-color:transparent;background:linear-gradient(135deg,#257dff,#8d3fff)}
      @media(max-width:520px){.sngpd-backdrop{padding:12px;align-items:flex-end}.sngpd-dialog{width:100%;border-radius:24px 24px 18px 18px;max-height:82vh}.sngpd-sheet{width:100%;max-height:75vh;border-radius:24px 24px 18px 18px}}
    `;
    (document.head||document.documentElement).appendChild(style);
  }

  const state={selectSheet:null};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  function ensureRoot(){let root=document.getElementById('sngPremiumUiRoot');if(root)return root;root=document.createElement('div');root.id='sngPremiumUiRoot';document.body.appendChild(root);return root}
  function closeLayer(backdrop){if(!backdrop)return;backdrop.classList.remove('is-open');document.body.classList.remove('sngpd-lock');setTimeout(()=>backdrop.remove(),220)}
  function createDialog({title='SNGAMER STORE',message='',icon='✦',confirmText='OK',cancelText='',danger=false,success=false}){const root=ensureRoot(),backdrop=document.createElement('div');backdrop.className='sngpd-backdrop';backdrop.innerHTML=`<div class="sngpd-dialog" role="dialog" aria-modal="true"><div class="sngpd-head"><div class="sngpd-icon">${icon}</div><h3 class="sngpd-title">${esc(title)}</h3></div><div class="sngpd-body">${esc(message)}</div><div class="sngpd-actions">${cancelText?`<button type="button" class="sngpd-btn" data-cancel>${esc(cancelText)}</button>`:''}<button type="button" class="sngpd-btn ${danger?'danger':success?'success':'primary'}" data-ok>${esc(confirmText)}</button></div></div>`;root.appendChild(backdrop);requestAnimationFrame(()=>{backdrop.classList.add('is-open');document.body.classList.add('sngpd-lock')});return backdrop}
  function premiumAlert(message,title='SNGAMER STORE'){return new Promise(resolve=>{const b=createDialog({title,message,icon:'✓',confirmText:'Compris',success:true});b.querySelector('[data-ok]').onclick=()=>{closeLayer(b);resolve(true)}})}
  function premiumConfirm(message,opts={}){return new Promise(resolve=>{const b=createDialog({title:opts.title||'Confirmation',message,icon:opts.icon||'?',confirmText:opts.confirmText||'Confirmer',cancelText:opts.cancelText||'Annuler',danger:!!opts.danger,success:!!opts.success});let done=false;const finish=v=>{if(done)return;done=true;closeLayer(b);resolve(v)};b.querySelector('[data-ok]').onclick=()=>finish(true);b.querySelector('[data-cancel']||b.querySelector('[data-cancel]'))?.addEventListener('click',()=>finish(false));b.addEventListener('click',e=>{if(e.target===b)finish(false)})})}
  window.sngPremiumAlert=premiumAlert;window.sngPremiumConfirm=premiumConfirm;
  window.alert=function(message){premiumAlert(String(message??''))};

  function selectLabel(select){const o=select.options[select.selectedIndex];return o?o.textContent.trim():'Sélectionner'}
  function enhanceSelect(select){
    if(!select||select.multiple||select.dataset.sngPremiumEnhanced==='1')return;
    select.dataset.sngPremiumEnhanced='1';
    const wrap=document.createElement('div');wrap.className='sngpd-select-wrap';select.parentNode.insertBefore(wrap,select);wrap.appendChild(select);select.classList.add('sngpd-native');
    const trigger=document.createElement('button');trigger.type='button';trigger.className='sngpd-select-trigger';trigger.textContent=selectLabel(select);trigger.setAttribute('aria-haspopup','listbox');
    wrap.insertBefore(trigger,select);
    trigger.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openSelectSheet(select,trigger)});
    select.addEventListener('change',()=>{trigger.textContent=selectLabel(select)});
  }
  function openSelectSheet(select,trigger){
    if(state.selectSheet)closeLayer(state.selectSheet);
    const root=ensureRoot(),backdrop=document.createElement('div');backdrop.className='sngpd-backdrop';
    const title=select.getAttribute('aria-label')||select.closest('label')?.textContent?.trim()||'Choisir une option';
    const options=Array.from(select.options).map((o,i)=>`<button type="button" class="sngpd-option ${i===select.selectedIndex?'is-selected':''}" data-index="${i}"><span>${esc(o.textContent)}</span><span class="check">✓</span></button>`).join('');
    backdrop.innerHTML=`<div class="sngpd-sheet" role="dialog" aria-modal="true"><div class="sngpd-sheet-head">${esc(title)}</div>${options}</div>`;root.appendChild(backdrop);state.selectSheet=backdrop;
    requestAnimationFrame(()=>{backdrop.classList.add('is-open');document.body.classList.add('sngpd-lock')});
    backdrop.querySelectorAll('.sngpd-option').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.index);select.selectedIndex=i;select.dispatchEvent(new Event('change',{bubbles:true}));select.dispatchEvent(new Event('input',{bubbles:true}));trigger.textContent=selectLabel(select);closeLayer(backdrop);state.selectSheet=null}));
    backdrop.addEventListener('click',e=>{if(e.target===backdrop){closeLayer(backdrop);state.selectSheet=null}});
  }
  function scan(root=document){if(!root||!root.querySelectorAll)return;root.querySelectorAll('select').forEach(enhanceSelect)}
  function boot(){scan();const observer=new MutationObserver(muts=>muts.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches?.('select'))enhanceSelect(n);scan(n)}})));observer.observe(document.body,{childList:true,subtree:true});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.selectSheet){closeLayer(state.selectSheet);state.selectSheet=null}})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
