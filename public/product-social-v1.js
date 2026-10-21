(function(){
  'use strict';
  if(window.__sngProductSocialV2Loaded)return;
  window.__sngProductSocialV2Loaded=true;

  const nativeFetch=window.fetch.bind(window);
  let favorites=new Set(),favoritesLoaded=false,currentProductId=null;
  const money=n=>new Intl.NumberFormat('fr-FR').format(Number(n)||0)+' FCFA';
  const esc=v=>String(v||'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const notify=(m,o)=>typeof window.sngPremiumAlert==='function'?window.sngPremiumAlert(m,o||{}):window.alert(m);

  async function customer(){try{const r=await nativeFetch('/api/customer/me',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return null;const d=await r.json();return d.customer||null}catch(_){return null}}
  async function loadFavorites(){try{const r=await nativeFetch('/api/customer/favorites',{credentials:'same-origin',cache:'no-store'});if(r.ok){const d=await r.json();favorites=new Set((d.products||[]).map(p=>Number(p.id)));}else favorites=new Set()}catch(_){favorites=new Set()}favoritesLoaded=true}

  function renderFavoriteState(btn,id){const active=favorites.has(Number(id));btn.classList.toggle('isFavorite',active);btn.setAttribute('aria-pressed',active?'true':'false');btn.innerHTML=active?'♥':'♡';btn.title=active?'Retirer des favoris':'Ajouter aux favoris';btn.setAttribute('aria-label',active?'Retirer des favoris':'Ajouter aux favoris')}
  async function toggleFavorite(id,btn){const me=await customer();if(!me){await notify('Connecte-toi à ton espace client pour enregistrer tes favoris. Ils seront ensuite disponibles dans « Mes favoris ».',{title:'Favoris',icon:'❤️',confirmText:'Compris'});return}const was=favorites.has(Number(id));btn.disabled=true;try{const r=await nativeFetch('/api/customer/favorites/'+encodeURIComponent(id),{method:was?'DELETE':'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Impossible de modifier les favoris.');was?favorites.delete(Number(id)):favorites.add(Number(id));renderFavoriteState(btn,id);if(typeof window.sngRefreshFavorites==='function')window.sngRefreshFavorites()}catch(e){notify(e.message||'Impossible de modifier les favoris.',{title:'Favoris',icon:'⚠️',confirmText:'Fermer'})}finally{btn.disabled=false}}

  async function shareProduct(p){const id=Number(p.id);const url=location.origin+location.pathname+'#product='+encodeURIComponent(id);const price=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price)?Number(p.promo_price):Number(p.price);const data={title:p.name||'Produit SNGAMER STORE',text:'Découvre ce produit sur SNGAMER STORE : '+(p.name||'Produit')+' — '+money(price),url};try{if(navigator.share&&(!navigator.canShare||navigator.canShare(data))){await navigator.share(data);return}}catch(e){if(e&&e.name==='AbortError')return}try{await navigator.clipboard.writeText(url);await notify('Le lien du produit a été copié. Tu peux maintenant l’envoyer à ton ami.',{title:'Produit partagé',icon:'🔗',confirmText:'OK'})}catch(_){window.prompt('Copie ce lien pour partager le produit :',url)}}
  async function reviews(id){try{const r=await nativeFetch('/api/products/'+encodeURIComponent(id)+'/reviews',{credentials:'same-origin',cache:'no-store'});return r.ok?await r.json():{average:0,count:0,reviews:[]}}catch(_){return{average:0,count:0,reviews:[]}}}
  async function rateProduct(id,rating){const me=await customer();if(!me){await notify('Connecte-toi à ton espace client pour noter ce produit.',{title:'Noter le produit',icon:'⭐',confirmText:'Compris'});return}try{const r=await nativeFetch('/api/products/'+encodeURIComponent(id)+'/reviews',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({rating:Number(rating)})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Impossible d’enregistrer ta note.');renderRating(id,d.average,d.count,d.myRating);notify('Merci ! Ta note a bien été enregistrée.',{title:'Avis enregistré',icon:'⭐',confirmText:'OK'})}catch(e){notify(e.message||'Impossible d’enregistrer ta note.',{title:'Notation',icon:'⚠️',confirmText:'Fermer'})}}

  function renderRating(id,avg,count,myRating){const box=document.querySelector('.sngProductSocial[data-product-id="'+CSS.escape(String(id))+'"]');if(!box)return;const mine=Number(myRating)||0;const stars=box.querySelector('.sngRatingStars'),summary=box.querySelector('.sngRatingSummary');if(stars){stars.innerHTML=[1,2,3,4,5].map(i=>`<button type="button" class="sngStar ${i<=mine?'selected':''}" data-star="${i}" aria-label="${i} étoile${i>1?'s':''}">${i<=mine?'★':'☆'}</button>`).join('');stars.querySelectorAll('.sngStar').forEach(b=>b.addEventListener('click',()=>rateProduct(id,Number(b.dataset.star))))}if(summary)summary.textContent=count?(Number(avg)||0).toFixed(1)+' / 5 · '+count+' avis':'Pas encore de note'}

  async function injectSocial(){
    const detail=document.querySelector('#productDetail');
    if(!detail||!currentProductId||detail.querySelector('.sngProductSocial'))return;
    if(detail.dataset.sngSocialInjecting==='1')return;
    detail.dataset.sngSocialInjecting='1';
    try{
      const p=(window.storeProducts||window.products||[]).find(x=>Number(x.id)===Number(currentProductId));
      if(!p)return;
      if(!favoritesLoaded)await loadFavorites();
      if(detail.querySelector('.sngProductSocial'))return;
      const box=document.createElement('section');box.className='sngProductSocial';box.dataset.productId=String(currentProductId);
      box.innerHTML=`<div class="sngSocialActions"><button type="button" class="sngSocialBtn sngFavBtn" aria-label="Ajouter aux favoris" aria-pressed="false"><span class="sngFavIcon">♡</span><span>Favori</span></button><button type="button" class="sngSocialBtn sngShareBtn" aria-label="Partager ce produit"><span class="sngShareIcon">↗</span><span>Partager</span></button></div><div class="sngRatingBlock"><div class="sngRatingTitle">Note du produit</div><div class="sngRatingRow"><div class="sngRatingStars"></div><span class="sngRatingSummary">Chargement…</span></div><div class="sngRatingHint">Connecte-toi pour laisser ou modifier ta note.</div></div>`;
      const info=detail.querySelector('.productInfo')||detail;
      const stockMeta=info.querySelector('.sngProductPurchaseMeta');
      const description=info.querySelector('.productDescription');
      if(stockMeta)stockMeta.insertAdjacentElement('afterend',box);else if(description)description.insertAdjacentElement('beforebegin',box);else info.appendChild(box);
      const fav=box.querySelector('.sngFavBtn'),share=box.querySelector('.sngShareBtn');renderFavoriteState(fav,Number(currentProductId));fav.addEventListener('click',()=>toggleFavorite(Number(currentProductId),fav));share.addEventListener('click',()=>shareProduct(p));
      const data=await reviews(Number(currentProductId));renderRating(Number(currentProductId),data.average,data.count,data.myRating);
    }finally{delete detail.dataset.sngSocialInjecting}
  }

  function installStyles(){if(document.getElementById('sngProductSocialStyles'))return;const style=document.createElement('style');style.id='sngProductSocialStyles';style.textContent=`
.sngProductSocial{width:100%;box-sizing:border-box;margin:14px 0 16px;padding:12px 14px;border:1px solid rgba(96,165,250,.18);border-radius:16px;background:rgba(8,15,27,.72)}
.sngSocialActions{display:flex;gap:10px;align-items:center}
.sngSocialBtn{min-height:40px;height:40px;padding:0 15px;border:1px solid rgba(110,150,205,.22);border-radius:11px;background:rgba(255,255,255,.045);color:#eaf1fb;font:inherit;font-size:13px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:.18s ease;flex:0 1 auto}
.sngSocialBtn:hover{background:rgba(255,255,255,.08);border-color:rgba(120,170,235,.38)}
.sngSocialBtn:active{transform:scale(.98)}
.sngSocialBtn.isFavorite{border-color:rgba(255,92,151,.45);color:#ff86b6;background:rgba(255,70,135,.08)}
.sngFavIcon,.sngShareIcon{font-size:18px;line-height:1}
.sngRatingBlock{margin-top:11px;padding-top:11px;border-top:1px solid rgba(255,255,255,.07)}
.sngRatingTitle{font-weight:850;color:#fff;font-size:14px;margin-bottom:6px}
.sngRatingRow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sngRatingStars{display:flex;align-items:center;gap:1px}
.sngStar{appearance:none;border:0!important;background:transparent!important;box-shadow:none!important;outline:0;padding:0 1px;color:#7f8ea4;font-size:25px;line-height:1;cursor:pointer}
.sngStar.selected{color:#ffd34e;text-shadow:0 0 8px rgba(255,211,78,.18)}
.sngRatingSummary{font-size:12px;color:#9caec5;font-weight:750}
.sngRatingHint{margin-top:6px;color:#71849d;font-size:11px}
.sngFavoritesCard{margin-top:18px;padding:16px;border:1px solid rgba(80,150,255,.18);border-radius:20px;background:linear-gradient(145deg,#0d1b2d,#160d27);color:#fff}.sngFavoritesCard h3{margin:0 0 12px;font-size:19px}.sngFavoritesGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sngFavoriteItem{border:1px solid rgba(100,145,210,.18);border-radius:15px;padding:9px;background:rgba(255,255,255,.035);cursor:pointer}.sngFavoriteItem img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:11px;display:block}.sngFavoriteItem strong{display:block;margin-top:7px;font-size:12px;line-height:1.3}.sngFavoriteItem small{display:block;margin-top:3px;color:#8fa1b8;font-size:11px}.sngFavEmpty{color:#8fa1b8;font-size:13px;line-height:1.5}.sngFavSeeAll{margin-top:11px;width:100%;min-height:42px;border:1px solid rgba(87,140,230,.25);border-radius:13px;background:rgba(255,255,255,.04);color:#fff;font:inherit;font-weight:800;cursor:pointer}
@media(max-width:520px){.sngProductSocial{padding:11px 12px}.sngSocialActions{gap:8px}.sngSocialBtn{min-height:38px;height:38px;padding:0 12px;font-size:12px}.sngFavIcon,.sngShareIcon{font-size:17px}.sngStar{font-size:24px}}
@media(min-width:701px){.sngFavoritesGrid{grid-template-columns:repeat(4,minmax(0,1fr))}}
`;document.head.appendChild(style)}

  async function renderFavoritesCard(){const root=[...document.querySelectorAll('main,section,div')].find(el=>/Espace client/i.test(el.textContent||'')&&el.children.length>1);if(!root||root.querySelector('.sngFavoritesCard'))return;const me=await customer();if(!me)return;const r=await nativeFetch('/api/customer/favorites',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return;const d=await r.json(),list=Array.isArray(d.products)?d.products:[];const card=document.createElement('section');card.className='sngFavoritesCard';card.innerHTML='<h3>❤️ Mes favoris</h3>'+(list.length?'<div class="sngFavoritesGrid">'+list.slice(0,8).map(p=>`<button type="button" class="sngFavoriteItem" data-fav-id="${Number(p.id)}">${p.image1_url?`<img src="${esc(p.image1_url)}" alt="${esc(p.name)}">`:'<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:38px">'+esc(p.emoji||'🎮')+'</div>'}<strong>${esc(p.name||'Produit')}</strong><small>${money(Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price)?p.promo_price:p.price)}</small></button>`).join('')+'</div>':'<div class="sngFavEmpty">Tu n’as encore aucun produit favori. Ajoute un produit avec le bouton ♡ depuis sa fiche.</div>');const anchor=root.querySelector('h1,h2,h3')?.parentElement||root.firstElementChild;if(anchor)anchor.after(card);else root.prepend(card);card.querySelectorAll('[data-fav-id]').forEach(b=>b.addEventListener('click',()=>{if(typeof window.openProduct==='function')window.openProduct(Number(b.dataset.favId))}))}
  window.sngRefreshFavorites=async function(){favoritesLoaded=false;await loadFavorites();document.querySelectorAll('.sngFavoritesCard').forEach(x=>x.remove());setTimeout(renderFavoritesCard,80)};
  function patchOpenProduct(){if(typeof window.openProduct!=='function')return false;if(window.__sngProductSocialPatched)return true;const original=window.openProduct;window.openProduct=function(id){currentProductId=Number(id);const result=original.apply(this,arguments);setTimeout(injectSocial,30);setTimeout(injectSocial,220);return result};window.__sngProductSocialPatched=true;const hash=location.hash.match(/^#product=(\d+)$/);if(hash)setTimeout(()=>window.openProduct(Number(hash[1])),350);return true}
  function watch(){installStyles();patchOpenProduct();renderFavoritesCard();if(!window.__sngProductSocialObserver){window.__sngProductSocialObserver=new MutationObserver(()=>{patchOpenProduct();renderFavoritesCard()});window.__sngProductSocialObserver.observe(document.body,{childList:true,subtree:true})}}
  window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#product=(\d+)$/);if(m&&typeof window.openProduct==='function')window.openProduct(Number(m[1]))});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();setTimeout(watch,500);setTimeout(watch,1500);
})();