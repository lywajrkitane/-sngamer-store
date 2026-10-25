(function(){
  'use strict';
  if(window.__sngFavoritesHorizontalV1)return;
  window.__sngFavoritesHorizontalV1=true;

  const money=v=>new Intl.NumberFormat('fr-FR').format(Number(v)||0)+' FCFA';
  const esc=v=>String(v==null?'':v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const section=()=>String(window.activeStoreSection||document.body?.dataset.storeSection||'home');
  const isMobile=()=>window.matchMedia('(max-width:700px)').matches;

  function installStyles(){
    if(document.getElementById('sngFavoritesHorizontalV1Styles'))return;
    const s=document.createElement('style');
    s.id='sngFavoritesHorizontalV1Styles';
    s.textContent=`
      .sngFavoritesCard{overflow:hidden!important;box-sizing:border-box!important}
      .sngFavoritesGrid{box-sizing:border-box!important}
      @media(max-width:700px){
        .sngFavoritesGrid{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;grid-template-columns:none!important;align-items:stretch!important;gap:10px!important;width:100%!important;max-width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;padding:3px 4px 10px!important;margin:0!important;scroll-snap-type:x mandatory!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;overscroll-behavior-x:contain!important}
        .sngFavoritesGrid::-webkit-scrollbar{display:none!important}
        .sngFavoriteItem{box-sizing:border-box!important;display:block!important;flex:0 0 154px!important;width:154px!important;min-width:154px!important;max-width:154px!important;scroll-snap-align:start!important;padding:8px!important;margin:0!important}
        .sngFavoriteItem img,.sngFavoritePlaceholder{display:block!important;width:100%!important;aspect-ratio:1/1!important;object-fit:cover!important;border-radius:11px!important}
        .sngFavoriteItem strong{display:block!important;font-size:12px!important;line-height:1.28!important;min-height:31px!important;margin-top:7px!important}
        .sngFavoriteItem small{display:block!important;font-size:11px!important;margin-top:4px!important}
        .sngFavoritesHint{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;margin-top:8px!important;color:#8fa1b8!important;font-size:11px!important;font-weight:700!important}
        .sngFavoritesHint::before{content:'←';font-size:14px!important;color:#8ab4ff!important}
        .sngFavoritesHint::after{content:'→';font-size:14px!important;color:#8ab4ff!important}
      }
      @media(min-width:701px){
        .sngFavoritesGrid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;overflow:visible!important}
        .sngFavoritesHint{display:none!important}
      }
    `;
    document.head.appendChild(s);
  }

  async function renderAll(card){
    if(!card||section()!=='profile'||card.dataset.sngFavHorizontalLoading==='1')return;
    const profile=document.getElementById('profileArea');
    if(!profile||!profile.contains(card))return;
    const grid=card.querySelector('.sngFavoritesGrid');
    if(!grid)return;
    card.dataset.sngFavHorizontalLoading='1';
    try{
      const r=await fetch('/api/customer/favorites',{credentials:'same-origin',cache:'no-store'});
      if(!r.ok)return;
      const d=await r.json();
      const list=Array.isArray(d.products)?d.products:[];
      if(!card.isConnected||section()!=='profile')return;
      if(!list.length){
        grid.innerHTML='<div class="sngFavEmpty">Tu n’as encore aucun produit favori. Ajoute un produit avec le bouton ♡ depuis sa fiche.</div>';
      }else{
        grid.innerHTML=list.map(p=>{
          const price=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price)?p.promo_price:p.price;
          const image=p.image1_url?`<img src="${esc(p.image1_url)}" alt="${esc(p.name||'Produit')}" loading="lazy">`:`<div class="sngFavoritePlaceholder">${esc(p.emoji||'🎮')}</div>`;
          return `<button type="button" class="sngFavoriteItem" data-fav-id="${Number(p.id)}">${image}<strong>${esc(p.name||'Produit')}</strong><small>${money(price)}</small></button>`;
        }).join('');
        grid.querySelectorAll('[data-fav-id]').forEach(btn=>btn.addEventListener('click',()=>{
          const id=Number(btn.dataset.favId);
          if(typeof window.openProduct==='function')window.openProduct(id);
        }));
      }
      let hint=card.querySelector('.sngFavoritesHint');
      if(isMobile()&&list.length>2){
        if(!hint){hint=document.createElement('div');hint.className='sngFavoritesHint';hint.textContent='Fais glisser pour voir tes favoris';card.appendChild(hint);}
      }else if(hint)hint.remove();
    }catch(e){console.error('SNGAMER_FAVORITES_HORIZONTAL_ERROR',e)}
    finally{delete card.dataset.sngFavHorizontalLoading}
  }

  function apply(){
    installStyles();
    if(section()!=='profile')return;
    const root=document.getElementById('profileArea');
    if(!root)return;
    const card=root.querySelector('.sngFavoritesCard');
    if(!card)return;
    renderAll(card);
  }

  function boot(){
    installStyles();
    apply();
    const root=document.getElementById('profileArea');
    if(root&&!root.__sngFavoritesHorizontalObserver){
      const observer=new MutationObserver(()=>apply());
      observer.observe(root,{childList:true,subtree:true});
      root.__sngFavoritesHorizontalObserver=observer;
    }
    window.addEventListener('resize',()=>{installStyles();apply()},{passive:true});
    [250,600,1200,2000,3500].forEach(t=>window.setTimeout(apply,t));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
