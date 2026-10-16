(function () {
  "use strict";

  const ACCOUNT_KEY = "sg_customer_profile";
  const LAST_ORDER_KEY = "sg_customer_last_order";

  function getJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>\"']/g, function (c) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#039;" })[c];
    });
  }

  function money(value) {
    return new Intl.NumberFormat("fr-FR").format(Number(value || 0)) + " FCFA";
  }

  function formatDate(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat("fr-FR", { day:"2-digit", month:"short", year:"numeric" }).format(new Date(value));
    } catch (_) { return ""; }
  }

  function customer() { return getJSON(ACCOUNT_KEY, {}); }
  function lastOrder() { return getJSON(LAST_ORDER_KEY, null); }

  function injectAccountStyles() {
    if (document.getElementById("sngamerAccountStyles")) return;
    const style = document.createElement("style");
    style.id = "sngamerAccountStyles";
    style.textContent = `
      #profileArea.sngamer-account{display:block!important;width:100%;margin:0;padding:0 0 34px;box-sizing:border-box}
      #products.sngamer-products-hidden{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
      .sngAccount{width:100%;display:flex;flex-direction:column;gap:18px}
      .sngAccountHero{position:relative;overflow:hidden;padding:24px 20px;border:1px solid rgba(91,169,255,.26);border-radius:24px;background:linear-gradient(145deg,#111e30 0%,#080d16 62%,#151023 100%);box-shadow:0 18px 45px rgba(0,0,0,.22)}
      .sngAccountHero:after{content:"";position:absolute;width:180px;height:180px;right:-90px;top:-90px;border-radius:50%;background:radial-gradient(circle,rgba(55,155,255,.18),transparent 68%);pointer-events:none}
      .sngAccountEyebrow{display:inline-flex;align-items:center;gap:7px;margin-bottom:10px;color:#65b9ff;font-size:11px;font-weight:900;letter-spacing:1.6px;text-transform:uppercase}
      .sngAccountTitle{margin:0;color:#fff;font-size:clamp(26px,7vw,38px);line-height:1.08;font-weight:900;letter-spacing:-.7px}
      .sngAccountSub{margin:10px 0 0;color:#aebbd0;line-height:1.55;font-size:14px;max-width:560px}
      .sngAccountIdentity{display:flex;align-items:center;gap:12px;margin-top:18px}
      .sngAccountAvatar{width:48px;height:48px;flex:0 0 48px;display:grid;place-items:center;border-radius:15px;color:#fff;font-size:20px;font-weight:900;background:linear-gradient(135deg,#168bff,#a62df0);box-shadow:0 8px 22px rgba(70,105,255,.26)}
      .sngAccountIdentity strong{display:block;color:#fff;font-size:15px}.sngAccountIdentity small{display:block;color:#8798b0;margin-top:3px;font-size:12px}
      .sngAccountStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:18px}
      .sngAccountStat{padding:13px 10px;border:1px solid rgba(94,125,167,.24);border-radius:16px;background:rgba(7,14,25,.58);text-align:center}
      .sngAccountStat b{display:block;color:#fff;font-size:20px;line-height:1.1}.sngAccountStat span{display:block;color:#8fa0b7;font-size:10px;font-weight:800;margin-top:5px;text-transform:uppercase;letter-spacing:.65px}
      .sngAccountSectionTitle{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:3px 2px 0}.sngAccountSectionTitle h3{margin:0;color:#fff;font-size:18px;font-weight:900}.sngAccountSectionTitle span{color:#71839b;font-size:11px;font-weight:700}
      .sngAccountQuick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
      .sngAccountTile{min-height:94px;display:flex;flex-direction:column;justify-content:space-between;padding:15px;border:1px solid rgba(83,116,157,.25);border-radius:19px;background:linear-gradient(145deg,rgba(17,30,48,.96),rgba(8,13,22,.96));color:#fff;text-align:left;cursor:pointer;transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}
      .sngAccountTile:hover{transform:translateY(-2px);border-color:rgba(82,176,255,.52);box-shadow:0 12px 28px rgba(0,0,0,.18)}
      .sngAccountTileIcon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:linear-gradient(135deg,#197fff,#8e2df2);font-size:17px}.sngAccountTile strong{margin-top:9px;font-size:13px}.sngAccountTile small{color:#8395ad;font-size:10px;margin-top:3px}
      .sngAccountPanel{padding:18px;border:1px solid rgba(83,116,157,.25);border-radius:21px;background:linear-gradient(145deg,rgba(17,30,48,.92),rgba(8,13,22,.95))}
      .sngAccountPanelHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.sngAccountPanelHeader h3{margin:0;color:#fff;font-size:16px;font-weight:900}
      .sngAccountBadge{padding:6px 9px;border-radius:999px;background:rgba(55,190,130,.12);border:1px solid rgba(55,190,130,.24);color:#66e0ae;font-size:10px;font-weight:900;text-transform:uppercase}
      .sngAccountOrder{padding:13px;border-radius:15px;background:rgba(4,9,17,.56);border:1px solid rgba(83,116,157,.18)}.sngAccountOrderTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.sngAccountOrder strong{color:#fff;font-size:13px}.sngAccountOrder small{display:block;color:#8192a8;margin-top:4px;font-size:10px}.sngAccountOrderStatus{color:#66c4ff;font-size:10px;font-weight:900}.sngAccountOrderBottom{display:flex;justify-content:space-between;gap:10px;margin-top:12px;color:#aebbd0;font-size:11px}
      .sngAccountEmpty{text-align:center;padding:10px 4px 4px}.sngAccountEmptyIcon{width:52px;height:52px;margin:0 auto 10px;display:grid;place-items:center;border-radius:17px;background:rgba(73,150,255,.10);color:#66bfff;font-size:23px}.sngAccountEmpty strong{display:block;color:#fff;font-size:13px}.sngAccountEmpty p{margin:7px auto 13px;color:#8495ab;font-size:11px;line-height:1.55;max-width:330px}
      .sngAccountButton{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border:0;border-radius:12px;background:linear-gradient(135deg,#267fff,#a72be8);color:#fff;font-weight:900;font-size:12px;cursor:pointer;box-shadow:0 8px 22px rgba(82,65,230,.22)}
      .sngAccountNotice{display:flex;gap:11px;align-items:flex-start;padding:14px;border:1px solid rgba(96,165,250,.20);border-radius:16px;background:rgba(29,78,126,.10)}.sngAccountNoticeIcon{color:#62bdff;font-size:18px;line-height:1}.sngAccountNotice strong{display:block;color:#fff;font-size:12px}.sngAccountNotice p{margin:4px 0 0;color:#8192a8;font-size:10px;line-height:1.5}
      @media(min-width:700px){.sngAccountQuick{grid-template-columns:repeat(3,minmax(0,1fr))}.sngAccountHero{padding:28px}.sngAccountPanel{padding:22px}}
      @media(max-width:430px){.sngAccountStats{gap:7px}.sngAccountStat{padding:12px 6px}.sngAccountStat b{font-size:18px}.sngAccountTile{min-height:90px;padding:13px}}
    `;
    document.head.appendChild(style);
  }

  function renderAccount() {
    const area=document.getElementById("profileArea"), products=document.getElementById("products"), cats=document.getElementById("cats"), sub=document.getElementById("navSubcategories");
    if(!area)return;
    injectAccountStyles();
    area.classList.add("sngamer-account"); area.hidden=false; area.style.display="block";
    if(products){products.classList.add("sngamer-products-hidden");products.style.setProperty("display","none","important");products.setAttribute("aria-hidden","true")}
    if(cats)cats.style.display="none";
    if(sub){sub.style.display="none";sub.hidden=true;sub.innerHTML=""}

    const profile=customer(), order=lastOrder(), name=profile.name||"Client SNGAMER", firstName=name.split(/\s+/)[0]||"Client", initial=firstName.charAt(0).toUpperCase(), hasCustomer=Boolean(profile.name||profile.phone);
    const orderCount=Number(profile.orderCount||(order?1:0));
    let cartCount=0; try{const cart=JSON.parse(localStorage.getItem("sg_cart")||"[]");cartCount=cart.reduce((sum,item)=>sum+Number(item.qty||0),0)}catch(_){ }

    area.innerHTML=`
      <div class="sngAccount">
        <section class="sngAccountHero">
          <div class="sngAccountEyebrow">✦ SNGAMER STORE · ESPACE CLIENT</div>
          <h2 class="sngAccountTitle">Bonjour ${esc(firstName)} 👋</h2>
          <p class="sngAccountSub">Retrouve ici tes commandes, ton suivi, tes informations et les services utiles de ta boutique.</p>
          <div class="sngAccountIdentity"><div class="sngAccountAvatar">${esc(initial)}</div><div><strong>${esc(hasCustomer?name:"Espace client")}</strong><small>${esc(profile.phone||"Connecte tes informations après ta première commande")}</small></div></div>
          <div class="sngAccountStats"><div class="sngAccountStat"><b>${orderCount}</b><span>Commande${orderCount>1?"s":""}</span></div><div class="sngAccountStat"><b>${cartCount}</b><span>Article${cartCount>1?"s":""} panier</span></div><div class="sngAccountStat"><b>0</b><span>Notifications</span></div></div>
        </section>

        <div class="sngAccountSectionTitle"><h3>Accès rapides</h3><span>Tout au même endroit</span></div>
        <section class="sngAccountQuick" aria-label="Services client">
          <button class="sngAccountTile" type="button" onclick="sngamerAccountScroll('sngOrders')"><span class="sngAccountTileIcon">▣</span><strong>Mes commandes</strong><small>Historique et statut</small></button>
          <button class="sngAccountTile" type="button" onclick="sngamerAccountScroll('sngTracking')"><span class="sngAccountTileIcon">⌁</span><strong>Suivi livraison</strong><small>Voir l’avancement</small></button>
          <button class="sngAccountTile" type="button" onclick="sngamerAccountScroll('sngProfileInfo')"><span class="sngAccountTileIcon">♙</span><strong>Mes informations</strong><small>Coordonnées et adresse</small></button>
          <button class="sngAccountTile" type="button" onclick="sngamerAccountScroll('sngWishlist')"><span class="sngAccountTileIcon">♡</span><strong>Mes favoris</strong><small>Produits enregistrés</small></button>
          <button class="sngAccountTile" type="button" onclick="cart()"><span class="sngAccountTileIcon">🛒</span><strong>Mon panier</strong><small>${cartCount} article${cartCount>1?"s":""}</small></button>
          <button class="sngAccountTile" type="button" onclick="sngamerAccountSupport()"><span class="sngAccountTileIcon">?</span><strong>Assistance</strong><small>Besoin d’aide ?</small></button>
        </section>

        <section class="sngAccountPanel" id="sngOrders"><div class="sngAccountPanelHeader"><h3>Commandes récentes</h3><span class="sngAccountBadge">Mon compte</span></div>
          ${order?`<div class="sngAccountOrder"><div class="sngAccountOrderTop"><div><strong>Commande SNG-${String(order.reference||order.createdAt||Date.now()).slice(-6)}</strong><small>${formatDate(order.createdAt)} · ${esc(order.phone||profile.phone||"")}</small></div><span class="sngAccountOrderStatus">${esc(order.status||"Reçue")}</span></div><div class="sngAccountOrderBottom"><span>${Number(order.itemCount||0)} article${Number(order.itemCount||0)>1?"s":""}</span><strong>${money(order.total)}</strong></div></div>`:`<div class="sngAccountEmpty"><div class="sngAccountEmptyIcon">▣</div><strong>Aucune commande récente</strong><p>Quand tu passeras une commande, son résumé et son statut apparaîtront ici.</p><button class="sngAccountButton" type="button" onclick="navigateStore('home')">Découvrir les produits</button></div>`}
        </section>

        <section class="sngAccountPanel" id="sngTracking"><div class="sngAccountPanelHeader"><h3>Suivi de livraison</h3><span class="sngAccountBadge">En un coup d’œil</span></div><div class="sngAccountNotice"><div class="sngAccountNoticeIcon">⌁</div><div><strong>${order?"Ta commande est enregistrée":"Le suivi apparaîtra après une commande"}</strong><p>${order?"Notre équipe te contacte pour confirmer la préparation et la livraison au Sénégal ou dans la sous-région.":"Passe ta commande pour retrouver ici les informations importantes de traitement et de livraison."}</p></div></div></section>

        <section class="sngAccountPanel" id="sngProfileInfo"><div class="sngAccountPanelHeader"><h3>Mes informations</h3><span class="sngAccountBadge">Coordonnées</span></div><div class="sngAccountNotice"><div class="sngAccountNoticeIcon">♙</div><div><strong>${esc(profile.name||"Informations non renseignées")}</strong><p>${esc(profile.phone||"Ajoute tes coordonnées lors de ta prochaine commande.")}${profile.address?" · "+esc(profile.address):""}</p></div></div></section>

        <section class="sngAccountPanel" id="sngWishlist"><div class="sngAccountPanelHeader"><h3>Mes favoris</h3><span class="sngAccountBadge">Préparation</span></div><div class="sngAccountEmpty"><div class="sngAccountEmptyIcon">♡</div><strong>Enregistre tes produits préférés</strong><p>La liste de favoris sera reliée aux fiches produits pour retrouver facilement tes articles.</p></div></section>
      </div>`;
  }

  window.sngamerAccountScroll=function(id){const target=document.getElementById(id);if(target)target.scrollIntoView({behavior:"smooth",block:"start"})};
  window.sngamerAccountSupport=function(){window.open("https://wa.me/221786127985","_blank","noopener,noreferrer")};

  const originalNavigateStore=window.navigateStore;
  if(typeof originalNavigateStore==="function"){
    window.navigateStore=function(section){originalNavigateStore(section);if(section==="profile")window.setTimeout(renderAccount,0)};
  }

  const originalOrder=window.order;
  if(typeof originalOrder==="function"){
    window.order=async function(){
      const name=document.getElementById("name")?.value?.trim()||"",phone=document.getElementById("phone")?.value?.trim()||"",address=document.getElementById("addr")?.value?.trim()||"";
      let cart=[];try{cart=JSON.parse(localStorage.getItem("sg_cart")||"[]")}catch(_){ }
      const previous=customer();
      setJSON(ACCOUNT_KEY,{...previous,name,phone,address,orderCount:Number(previous.orderCount||0)+1,updatedAt:new Date().toISOString()});
      const totalText=document.getElementById("total")?.textContent||"0",numericTotal=Number(totalText.replace(/[^0-9]/g,""))||0;
      setJSON(LAST_ORDER_KEY,{reference:Date.now(),createdAt:new Date().toISOString(),status:"Commande reçue",name,phone,address,itemCount:cart.reduce((sum,item)=>sum+Number(item.qty||0),0),total:numericTotal});
      return originalOrder.apply(this,arguments);
    };
  }

  document.addEventListener("DOMContentLoaded",function(){injectAccountStyles()});
})();
