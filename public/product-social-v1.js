(function(){
  'use strict';

  const nativeFetch = window.fetch.bind(window);
  let favorites = new Set();
  let favoritesLoaded = false;
  let currentProductId = null;

  const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const money = n => new Intl.NumberFormat('fr-FR').format(Number(n)||0) + ' FCFA';

  function notify(message, opts){
    if(typeof window.sngPremiumAlert === 'function') return window.sngPremiumAlert(message, opts || {});
    window.alert(message);
  }

  async function loadFavorites(){
    try{
      const r = await nativeFetch('/api/customer/favorites',{credentials:'same-origin',cache:'no-store'});
      if(!r.ok){ favorites = new Set(); favoritesLoaded = true; return; }
      const d = await r.json();
      favorites = new Set((d.products || []).map(p=>Number(p.id)));
    }catch(_){ favorites = new Set(); }
    favoritesLoaded = true;
  }

  async function customer(){
    try{
      const r=await nativeFetch('/api/customer/me',{credentials:'same-origin',cache:'no-store'});
      if(!r.ok) return null;
      const d=await r.json();
      return d.customer || null;
    }catch(_){ return null; }
  }

  async function toggleFavorite(id, button){
    const me = await customer();
    if(!me){
      await notify('Connecte-toi à ton espace client pour enregistrer tes favoris. Ils seront ensuite disponibles dans « Mes favoris ».',{title:'Favoris',icon:'❤️',confirmText:'Compris'});
      return;
    }
    const wasFavorite = favorites.has(Number(id));
    button.disabled = true;
    try{
      const r = await nativeFetch('/api/customer/favorites/'+encodeURIComponent(id),{
        method: wasFavorite ? 'DELETE' : 'PUT',
        credentials:'same-origin',
        headers:{'Content-Type':'application/json'}
      });
      const d = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error || 'Impossible de modifier les favoris.');
      if(wasFavorite) favorites.delete(Number(id)); else favorites.add(Number(id));
      renderFavoriteState(button, Number(id));
      if(typeof window.sngRefreshFavorites === 'function') window.sngRefreshFavorites();
    }catch(e){ notify(e.message || 'Impossible de modifier les favoris.',{title:'Favoris',icon:'⚠️',confirmText:'Fermer'}); }
    finally{ button.disabled=false; }
  }

  function renderFavoriteState(button,id){
    const active=favorites.has(Number(id));
    button.classList.toggle('isFavorite',active);
    button.setAttribute('aria-pressed',active?'true':'false');
    button.innerHTML=active?'♥':'♡';
    button.title=active?'Retirer des favoris':'Ajouter aux favoris';
    button.setAttribute('aria-label',active?'Retirer des favoris':'Ajouter aux favoris');
  }

  async function shareProduct(p){
    const id=Number(p.id);
    const url = location.origin + location.pathname + '#product=' + encodeURIComponent(id);
    const price = Boolean(p.promo_active) && Number(p.promo_price)>0 && Number(p.promo_price)<Number(p.price) ? Number(p.promo_price) : Number(p.price);
    const data={title:p.name || 'Produit SNGAMER STORE',text:'Découvre ce produit sur SNGAMER STORE : '+(p.name||'Produit')+' — '+money(price),url};
    try{
      if(navigator.share && (!navigator.canShare || navigator.canShare(data))){ await navigator.share(data); return; }
    }catch(e){ if(e && e.name==='AbortError') return; }
    try{
      await navigator.clipboard.writeText(url);
      await notify('Le lien du produit a été copié. Tu peux maintenant l’envoyer à ton ami.',{title:'Produit partagé',icon:'🔗',confirmText:'OK'});
    }catch(_){
      window.prompt('Copie ce lien pour partager le produit :',url);
    }
  }

  async function reviews(id){
    try{
      const r=await nativeFetch('/api/products/'+encodeURIComponent(id)+'/reviews',{credentials:'same-origin',cache:'no-store'});
      if(!r.ok) return {average:0,count:0,reviews:[]};
      return await r.json();
    }catch(_){ return {average:0,count:0,reviews:[]}; }
  }

  async function rateProduct(id, rating){
    const me=await customer();
    if(!me){
      await notify('Connecte-toi à ton espace client pour noter ce produit.',{title:'Noter le produit',icon:'⭐',confirmText:'Compris'});
      return;
    }
    try{
      const r=await nativeFetch('/api/products/'+encodeURIComponent(id)+'/reviews',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({rating:Number(rating)})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error || 'Impossible d’enregistrer ta note.');
      renderRating(id,d.average,d.count,d.myRating);
      notify('Merci ! Ta note a bien été enregistrée.',{title:'Avis enregistré',icon:'⭐',confirmText:'OK'});
    }catch(e){ notify(e.message || 'Impossible d’enregistrer ta note.',{title:'Notation',icon:'⚠️',confirmText:'Fermer'}); }
  }

  function renderRating(id,avg,count,myRating){
    const box=document.querySelector('.sngProductSocial[data-product-id="'+CSS.escape(String(id))+'"]');
    if(!box)return;
    const score=Number(avg)||0;
    const mine=Number(myRating)||0;
    const stars=box.querySelector('.sngRatingStars');
    const summary=box.querySelector('.sngRatingSummary');
    if(stars){
      stars.innerHTML=[1,2,3,4,5].map(i=>`<button type="button" class="sngStar ${i<=mine?'selected':''}" data-star="${i}" aria-label="${i} étoile${i>1?'s':''}">${i<=mine?'★':'☆'}</button>`).join('');
      stars.querySelectorAll('.sngStar').forEach(b=>b.addEventListener('click',()=>rateProduct(id,Number(b.dataset.star))));
    }
    if(summary) summary.textContent=count ? score.toFixed(1)+' / 5 · '+count+' avis' : 'Pas encore de note';
  }

  async function injectSocial(){
    const detail=document.querySelector('#productDetail');
    if(!detail || !currentProductId) return;
    if(detail.querySelector('.sngProductSocial')) return;
    const p=(window.storeProducts||[]).find(x=>Number(x.id)===Number(currentProductId));
    if(!p)return;
    if(!favoritesLoaded) await loadFavorites();
    const box=document.createElement('section');
    box.className='sngProductSocial'; box.dataset.productId=String(currentProductId);
    box.innerHTML=`
      <div class="sngSocialActions">
        <button type="button" class="sngSocialBtn sngFavBtn" aria-label="Ajouter aux favoris" aria-pressed="false"><span class="sngFavIcon">♡</span><span>Favori</span></button>
        <button type="button" class="sngSocialBtn sngShareBtn" aria-label="Partager ce produit"><span>↗</span><span>Partager</span></button>
      </div>
      <div class="sngRatingBlock">
        <div class="sngRatingTitle">⭐ Note du produit</div>
        <div class="sngRatingRow"><div class="sngRatingStars"></div><span class="sngRatingSummary">Chargement…</span></div>
        <div class="sngRatingHint">Connecte-toi pour laisser ou modifier ta note.</div>
      </div>`;
    const info=detail.querySelector('.productInfo');
    if(info) info.appendChild(box); else detail.appendChild(box);
    const fav=box.querySelector('.sngFavBtn');
    const share=box.querySelector('.sngShareBtn');
    renderFavoriteState(fav,Number(currentProductId));
    fav.addEventListener('click',()=>toggleFavorite(Number(currentProductId),fav));
    share.addEventListener('click',()=>shareProduct(p));
    const data=await reviews(Number(currentProductId));
    renderRating(Number(currentProductId),data.average,data.count,data.myRating);
  }

  function installStyles(){
    if(document.getElementById('sngProductSocialStyles'))return;
    const style=document.createElement('style');style.id='sngProductSocialStyles';
    style.textContent=`
.sngProductSocial{margin-top:18px;padding:14px;border:1px solid rgba(80,150,255,.18);border-radius:18px;background:linear-gradient(145deg,rgba(9,21,38,.72),rgba(23,10,42,.62));box-sizing:border-box}.sngSocialActions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sngSocialBtn{min-height:48px;border:1px solid rgba(93,143,211,.25);border-radius:14px;background:rgba(255,255,255,.045);color:#fff;font:inherit;font-weight:850;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:.18s ease}.sngSocialBtn:active{transform:scale(.98)}.sngSocialBtn.isFavorite{border-color:rgba(255,76,142,.5);background:linear-gradient(135deg,rgba(255,54,123,.16),rgba(128,53,244,.12));color:#ff78ad}.sngFavIcon{font-size:22px;line-height:1}.sngRatingBlock{margin-top:13px;padding-top:13px;border-top:1px solid rgba(255,255,255,.07)}.sngRatingTitle{font-weight:900;color:#fff;font-size:14px;margin-bottom:8px}.sngRatingRow{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.sngRatingStars{display:flex;gap:2px}.sngStar{border:0;background:transparent;color:#8b9ab0;font-size:25px;line-height:1;padding:0 1px;cursor:pointer}.sngStar.selected{color:#ffd34e;text-shadow:0 0 10px rgba(255,211,78,.2)}.sngRatingSummary{font-size:12px;color:#9caec5;font-weight:750}.sngRatingHint{margin-top:7px;color:#71849d;font-size:11px}.sngFavoritesCard{margin-top:18px;padding:16px;border:1px solid rgba(80,150,255,.18);border-radius:20px;background:linear-gradient(145deg,#0d1b2d,#160d27);color:#fff}.sngFavoritesCard h3{margin:0 0 12px;font-size:19px}.sngFavoritesGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sngFavoriteItem{border:1px solid rgba(100,145,210,.18);border-radius:15px;padding:9px;background:rgba(255,255,255,.035);cursor:pointer}.sngFavoriteItem img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:11px;display:block}.sngFavoriteItem strong{display:block;margin-top:7px;font-size:12px;line-height:1.3}.sngFavoriteItem small{display:block;margin-top:3px;color:#8fa1b8;font-size:11px}.sngFavEmpty{color:#8fa1b8;font-size:13px;line-height:1.5}.sngFavSeeAll{margin-top:11px;width:100%;min-height:42px;border:1px solid rgba(87,140,230,.25);border-radius:13px;background:rgba(255,255,255,.04);color:#fff;font:inherit;font-weight:800;cursor:pointer}@media(min-width:701px){.sngFavoritesGrid{grid-template-columns:repeat(4,minmax(0,1fr))}}`;
    document.head.appendChild(style);
  }

  async function renderFavoritesCard(){
    const root = [...document.querySelectorAll('main,section,div')].find(el=>/Espace client/i.test(el.textContent||'') && el.children.length>1);
    if(!root || root.querySelector('.sngFavoritesCard')) return;
    const me=await customer(); if(!me)return;
    const r=await nativeFetch('/api/customer/favorites',{credentials:'same-origin',cache:'no-store'});
    if(!r.ok)return;
    const d=await r.json(); const list=Array.isArray(d.products)?d.products:[];
    const card=document.createElement('section');card.className='sngFavoritesCard';
    card.innerHTML='<h3>❤️ Mes favoris</h3>'+(list.length?'<div class="sngFavoritesGrid">'+list.slice(0,8).map(p=>`<button type="button" class="sngFavoriteItem" data-fav-id="${Number(p.id)}">${p.image1_url?`<img src="${esc(p.image1_url)}" alt="${esc(p.name)}">`:'<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:38px">'+esc(p.emoji||'🎮')+'</div>'}<strong>${esc(p.name||'Produit')}</strong><small>${money(Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price)?p.promo_price:p.price)}</small></button>`).join('')+'</div>':'<div class="sngFavEmpty">Tu n’as encore aucun produit favori. Ajoute un produit avec le bouton ♡ depuis sa fiche.</div>');
    const anchor=root.querySelector('h1,h2,h3')?.parentElement || root.firstElementChild;
    if(anchor) anchor.after(card); else root.prepend(card);
    card.querySelectorAll('[data-fav-id]').forEach(b=>b.addEventListener('click',()=>{if(typeof window.openProduct==='function')window.openProduct(Number(b.dataset.favId));}));
  }

  window.sngRefreshFavorites=async function(){
    favoritesLoaded=false;await loadFavorites();
    document.querySelectorAll('.sngFavoritesCard').forEach(x=>x.remove());
    setTimeout(renderFavoritesCard,80);
  };

  function patchOpenProduct(){
    if(typeof window.openProduct!=='function')return false;
    if(window.__sngProductSocialPatched)return true;
    const original=window.openProduct;
    window.openProduct=function(id){
      currentProductId=Number(id);
      const result=original.apply(this,arguments);
      setTimeout(injectSocial,30);setTimeout(injectSocial,220);
      return result;
    };
    window.__sngProductSocialPatched=true;
    const hash=location.hash.match(/^#product=(\d+)$/);
    if(hash) setTimeout(()=>window.openProduct(Number(hash[1])),350);
    return true;
  }

  function watch(){
    installStyles();
    patchOpenProduct();
    renderFavoritesCard();
    if(!window.__sngProductSocialObserver){
      window.__sngProductSocialObserver=new MutationObserver(()=>{patchOpenProduct();renderFavoritesCard();});
      window.__sngProductSocialObserver.observe(document.body,{childList:true,subtree:true});
    }
  }

  window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#product=(\d+)$/);if(m&&typeof window.openProduct==='function')window.openProduct(Number(m[1]));});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
  setTimeout(watch,500);setTimeout(watch,1500);
})();
