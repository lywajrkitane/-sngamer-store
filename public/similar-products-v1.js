/* SNGAMER STORE — Produits similaires V1 */
(function(){
  'use strict';
  function esc(value=''){
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(value);
    return String(value).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  }
  const MAX_DISPLAY_PRICE=5000000;
  function priceFor(p){
    const normal=Number(p?.price);
    if(!Number.isFinite(normal)||normal<=0||normal>MAX_DISPLAY_PRICE)return null;
    const promo=Number(p?.promo_price);
    const validPromo=Boolean(p?.promo_active)&&Number.isFinite(promo)&&promo>0&&promo<normal&&promo<=MAX_DISPLAY_PRICE;
    return validPromo?promo:normal;
  }
  function categoryFor(p){if(typeof window.storeCategory==='function')return window.storeCategory(p);return p.category||'Gaming';}
  function renderSimilar(currentId){
    const host=document.querySelector('#productDetail');if(!host||!Array.isArray(window.storeProducts))return;
    const current=window.storeProducts.find(p=>Number(p.id)===Number(currentId));if(!current)return;
    const currentCategory=categoryFor(current);let candidates=window.storeProducts.filter(p=>Number(p.id)!==Number(currentId));
    const sameCategory=candidates.filter(p=>categoryFor(p)===currentCategory);candidates=(sameCategory.length?sameCategory:candidates).slice(0,12);if(!candidates.length)return;
    const section=document.createElement('section');section.className='similarProductsSection';section.setAttribute('aria-label','Produits similaires');
    section.innerHTML=`<div class="similarProductsHeader"><div><h3>Produits similaires</h3><p>Découvre d'autres produits qui pourraient te plaire.</p></div></div><div class="similarProductsTrack" role="list">${candidates.map(p=>{const image=p.image1_url||p.main_image_url;const price=priceFor(p);const priceHtml=price===null?"Prix à confirmer":new Intl.NumberFormat("fr-FR").format(price)+" <small>FCFA</small>";const stock=Number(p.stock)>0;return `<button type="button" class="similarProductCard" role="listitem" onclick="openProduct(${Number(p.id)})" aria-label="Voir ${esc(p.name||'le produit')}"><div class="similarProductMedia">${image?`<img src="${esc(image)}" alt="${esc(p.name||'')}" loading="lazy">`:`<div class="similarProductEmoji">${esc(p.emoji||'🎮')}</div>`}</div><div class="similarProductBody"><div class="similarProductCategory">${esc(categoryFor(p))}</div><div class="similarProductName">${esc(p.name||'Produit')}</div><div class="similarProductBottom"><div class="similarProductPrice">${priceHtml}</div><div class="similarProductStock">${stock?`${Number(p.stock)} disponible(s)`:'Rupture'}</div></div></div></button>`;}).join('')}</div><div class="similarProductsHint"><span>↔</span> Fais glisser horizontalement pour voir plus de produits</div><button type="button" class="similarBackToProduct" aria-label="Revenir en haut du produit" title="Revenir en haut du produit" hidden>↑</button>`;
    host.appendChild(section);
    const modalBox=document.querySelector('#productModal .productBox');const backButton=section.querySelector('.similarBackToProduct');
    if(modalBox&&backButton){const updateArrow=()=>{backButton.hidden=modalBox.scrollTop<260};modalBox.addEventListener('scroll',updateArrow,{passive:true});backButton.addEventListener('click',()=>modalBox.scrollTo({top:0,behavior:'smooth'}));updateArrow();}
  }
  function install(){if(typeof window.openProduct!=='function'||window.openProduct.__similarWrapped)return;const original=window.openProduct;function wrapped(id){original(id);requestAnimationFrame(()=>renderSimilar(id));}wrapped.__similarWrapped=true;window.openProduct=wrapped;}
  const timer=setInterval(()=>{install();if(typeof window.openProduct==='function'&&window.openProduct.__similarWrapped)clearInterval(timer);},50);
})();

/* SNGAMER STORE — Footer premium + retour en haut */
(function(){
  'use strict';
  const SOCIALS=[{name:'WhatsApp',short:'WA',url:'https://wa.me/221786127985',text:'Contact direct'},{name:'Facebook',short:'f',url:'https://www.facebook.com/profile.php?id=61581284860925',text:'Page officielle'},{name:'TikTok',short:'♪',url:'https://www.tiktok.com/@sngamer.sn?_r=1&_t=ZN-9AWO8eKq8ko',text:'Vidéos gaming'},{name:'YouTube',short:'▶',url:'https://www.youtube.com/@sngamer-ytb',text:'Chaîne officielle'}];
  function socialMarkup(){return SOCIALS.map(s=>`<a class="premiumFooterSocial" href="${s.url}" target="_blank" rel="noopener noreferrer"><span class="premiumFooterSocialIcon">${s.short}</span><span class="premiumFooterSocialText"><strong>${s.name}</strong><small>${s.text}</small></span><span class="premiumFooterSocialArrow">↗</span></a>`).join('');}
  function footerMarkup(){return `<div class="premiumFooterInner"><div class="premiumFooterTop"><div class="premiumFooterBrand"><div class="premiumFooterLogo"><span>SNG</span>AMER <b>STORE</b></div><p>Votre boutique gaming en ligne au Sénégal, basée à Dakar.</p><p class="premiumFooterIntro">Accessoires gaming, Gaming Phone et pièces eFootball sélectionnés pour les passionnés.</p></div><div class="premiumFooterContactCard"><span class="premiumFooterEyebrow">BESOIN D'AIDE ?</span><strong>Une question sur une commande ?</strong><a href="https://wa.me/221786127985" target="_blank" rel="noopener noreferrer">+221 78 612 79 85 <span>↗</span></a></div></div><div class="premiumFooterSocialArea"><div><span class="premiumFooterEyebrow">SUIVEZ SNGAMER</span><h3>Retrouvez-nous sur nos plateformes</h3></div><div class="premiumFooterSocialGrid">${socialMarkup()}</div></div><div class="premiumFooterLinks"><div><span class="premiumFooterEyebrow">CATÉGORIES</span><a href="#" onclick="event.preventDefault();navigateStore('accessories')">Accessoires</a><a href="#" onclick="event.preventDefault();navigateStore('phones')">Gaming Phone</a><a href="#" onclick="event.preventDefault();navigateStore('coins')">Pièces eFootball</a></div><div><span class="premiumFooterEyebrow">BOUTIQUE</span><a href="#shop" onclick="event.preventDefault();window.scrollTo({top:0,behavior:'smooth'})">Accueil</a><a href="#shop" onclick="event.preventDefault();document.querySelector('#shop')?.scrollIntoView({behavior:'smooth'})">Tous les produits</a><a href="https://wa.me/221786127985" target="_blank" rel="noopener noreferrer">Contact</a></div><div><span class="premiumFooterEyebrow">COMMANDE</span><a href="#" onclick="event.preventDefault();cart()">Mon panier</a><a href="#" onclick="event.preventDefault();cart()">Mes articles</a><span class="premiumFooterDelivery">Livraison au Sénégal</span></div></div><div class="premiumFooterBottom"><span>© 2026 SNGAMER STORE · Dakar, Sénégal</span><span>Gaming · Shopping · Performance</span></div></div>`;}
  function installFooter(){const old=document.querySelector('.store-footer-content');if(!old)return;old.classList.add('premiumFooterHost');old.innerHTML=footerMarkup();old.setAttribute('aria-label','Pied de page SNGAMER STORE');const legacyFooter=document.querySelector('body > footer');if(legacyFooter)legacyFooter.hidden=true;}
  function installBackToTop(){
    if(document.getElementById('sngamerBackToTop'))return;
    const button=document.createElement('button');
    button.id='sngamerBackToTop';
    button.type='button';
    button.setAttribute('aria-label','Revenir en haut');
    button.setAttribute('title','Revenir en haut');
    button.innerHTML='<span>↑</span>';
    button.hidden=true;
    button.setAttribute('aria-hidden','true');
    document.body.appendChild(button);

    const update=()=>{
      const maxScroll=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
      const threshold=Math.max(600,Math.round(maxScroll*0.45));
      const visible=maxScroll>0 && window.scrollY>=threshold;
      button.hidden=!visible;
      button.classList.toggle('is-visible',visible);
      button.setAttribute('aria-hidden',visible?'false':'true');
    };

    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update,{passive:true});
    button.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    update();
  }
  function forceFooterVisible(){const host=document.querySelector('.premiumFooterHost');if(!host)return;host.hidden=false;host.style.display='block';const legacy=document.querySelector('body > footer');if(legacy)legacy.hidden=true;}
  function init(){installFooter();installBackToTop();forceFooterVisible();const observer=new MutationObserver(()=>forceFooterVisible());observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
