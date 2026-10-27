let products=[],cartItems=JSON.parse(localStorage.getItem("sg_cart")||"[]"),filter="Tous",selectedCoinPlatform=null;
let homeMixedProducts=[];
function shuffleProductGroup(items){
  const shuffled=items.slice();
  for(let i=shuffled.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
  }
  return shuffled;
}
function mixHomeProductsByCategory(items){
  const groups=new Map();
  for(const product of items){
    const fallbackCategory=String(product?.category||"Autres");
    let category=fallbackCategory;
    try { if(typeof storeCategory==="function") category=String(storeCategory(product)||fallbackCategory); } catch (_) {}
    if(!groups.has(category)) groups.set(category,[]);
    groups.get(category).push(product);
  }
  for(const [category,group] of groups) groups.set(category,shuffleProductGroup(group));

  const mixed=[];
  let previousCategory=null;
  while(true){
    const available=[...groups.keys()].filter(category=>groups.get(category).length>0);
    if(!available.length) break;
    let choices=available.filter(category=>category!==previousCategory);
    if(!choices.length) choices=available;
    const category=choices[Math.floor(Math.random()*choices.length)];
    mixed.push(groups.get(category).shift());
    previousCategory=category;
  }
  return mixed;
}
window.activeStoreSection=window.activeStoreSection||"home";
const money=n=>new Intl.NumberFormat("fr-FR").format(n)+" FCFA";
async function load(){
  let data;
  try {
    const response = await fetch("/api/products", { cache: "no-store", headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error("products_http_" + response.status);
    data = await response.json();
    if (!Array.isArray(data)) throw new Error("products_response_not_array");
  } catch (error) {
    console.error("SNGAMER_PRODUCTS_FETCH_ERROR", error);
    const grid = document.getElementById("products");
    if (grid && !grid.querySelector(".productCardClickable")) {
      grid.innerHTML = '<div role="status" style="grid-column:1/-1;text-align:center;padding:35px 15px;color:#aab8ca">Le catalogue est temporairement indisponible. Réessaie dans un instant.</div>';
    }
    window.__sngamerStoreReady = true;
    return;
  }

  products = data.filter(item => item && typeof item === "object" && Number.isFinite(Number(item.id)) && Number(item.id) > 0);
  window.products = products;
  window.storeProducts = products;
  homeMixedProducts = products.slice();

  try {
    homeMixedProducts = mixHomeProductsByCategory(products);
  } catch (error) {
    console.error("SNGAMER_HOME_MIX_ERROR", error);
    homeMixedProducts = products.slice();
  }
  try { cats(); } catch (error) { console.error("SNGAMER_CATEGORIES_RENDER_ERROR", error); }
  try { render(); } catch (error) { console.error("SNGAMER_CATALOG_RENDER_ERROR", error); }
  try { update(); } catch (error) { console.error("SNGAMER_CART_REFRESH_ERROR", error); }

  const grid = document.getElementById("products");
  if (grid && products.length && !grid.querySelector(".productCardClickable")) {
    console.error("SNGAMER_CATALOG_EMPTY_AFTER_RENDER", { products: products.length });
  }
  window.__sngamerStoreReady = true;
}

/* SNGAMER — RUBRIQUES ET NAVIGATION */
function productText(p) {
  return [p?.name, p?.category, p?.description].filter(Boolean).map(value=>String(value)).join(" ").toLowerCase();
}
function isCoinProduct(p) { return /(coins?|e-?football|fc mobile|fc points|mobile legends|diamants?|diamonds?|gems?|myclub|top[- ]?up|recharge de jeu)/i.test(productText(p)); }
function isPhoneProduct(p) { return !isCoinProduct(p) && /(gaming phone|téléphone|telephone|smartphone|phone|iphone|samsung galaxy|redmi note|poco|rog phone|nubia|redmagic|red magic|infinix gt|tecno pova|black shark)/i.test(productText(p)); }
function isAccessoryProduct(p) { return !isCoinProduct(p) && !isPhoneProduct(p) && /(accessoire|accessory|accessories|clavier|keyboard|manette|controller|gamepad|casque|headset|écouteur|ecouteur|souris|mouse|refroidisseur|cooler|ventilateur|chargeur|charger|câble|cable|support|stand|coque|étui|etui|microphone|adaptateur|hub usb|gâchette|gachette|trigger|tapis|mousepad|power bank|batterie|joystick|webcam|dock|carte mémoire|carte memoire)/i.test(productText(p)); }
function matchesStoreSection(p) {
  if (window.activeStoreSection === "home") return true;
  if (window.activeStoreSection === "accessories") return isAccessoryProduct(p);
  if (window.activeStoreSection === "phones") return isPhoneProduct(p);
  if (window.activeStoreSection === "coins") return isCoinProduct(p);
  return true;
}
function storeCategory(p) {
  const category=String(p?.category||"").trim().toLowerCase();
  if(category==="coins"||isCoinProduct(p)) return "Coins";
  if(category==="gaming phone"||isPhoneProduct(p)) return "Gaming Phone";
  if(category==="accessoires"||isAccessoryProduct(p)) return "Accessoires";
  return p.category||"Accessoires";
}
function cats(){
  const categories=["Tous",...new Set(products.map(p=>storeCategory(p)))];
  document.querySelector("#cats").innerHTML=categories.map(c=>`<button class="catbtn ${c===filter?"on":""}" onclick="filterBy('${c}')">${c}</button>`).join("");
}
function filterBy(c){filter=c;cats();render();}
function render(){
  const productGrid=document.getElementById("products");
  if(!productGrid)return;
  if(window.activeStoreSection==="profile"){productGrid.replaceChildren();return;}
  const q=(document.querySelector("#q")?.value||"").toLowerCase();
  const sourceList=(window.activeStoreSection==="home"&&filter==="Tous")?homeMixedProducts:products;
  const list=sourceList.filter(p=>matchesStoreSection(p)&&(window.activeStoreSection!=="home"||filter==="Tous"||storeCategory(p)===filter)&&(p.name||"").toLowerCase().includes(q));
  productGrid.innerHTML=list.map(p=>{
    try {
    const promoActive=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price);
    const discount=promoActive?Math.round((1-Number(p.promo_price)/Number(p.price))*100):0;
    const isOnOrder=String(p.stock_mode||"stock")==="on_order";
    const inStock=isOnOrder||Number(p.stock)>0;
    const availabilityClass=isOnOrder?"stock onOrderStock":`stock ${!inStock?"outOfStock":""}`;
    const availabilityAttribute=isOnOrder?`role="status" aria-label="Sur commande"`:`data-stock-count="${Math.max(0,Math.floor(Number(p.stock)||0))}"`;
    const availabilityLabel=isOnOrder?"Sur commande":inStock?`${p.stock} disponible(s)`:"Rupture de stock";
    const normalPriceText = new Intl.NumberFormat("fr-FR").format(p.price);
    const currentPriceValue = promoActive ? Number(p.promo_price) : Number(p.price);
    const currentPriceText = new Intl.NumberFormat("fr-FR").format(currentPriceValue);
    const currentPriceDigits = currentPriceText.replace(/\D/g, "").length;
    const currentPriceClass = currentPriceDigits >= 7 ? "priceCurrent priceCurrent--long" : currentPriceDigits >= 6 ? "priceCurrent priceCurrent--medium" : "priceCurrent";
    const priceHtml = promoActive
      ? `<div class="price price--promo"><div class="priceOldRow"><span class="priceOld">${normalPriceText} FCFA</span><span class="discountBadge">-${discount}%</span></div><div class="pricePromoMain"><strong class="${currentPriceClass}">${currentPriceText}<small>FCFA</small></strong></div></div>`
      : `<div class="price price--regular"><div class="priceOldRow priceOldRow--placeholder" aria-hidden="true"></div><div class="pricePromoMain"><strong class="${currentPriceClass}">${currentPriceText}<small>FCFA</small></strong></div></div>`;
    const category=storeCategory(p),categoryLabel=category==="Coins"&&p.platform?`${category} ${p.platform}`:category;
    return `<article class="card productCardClickable" onclick="openProduct(${Number(p.id)})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openProduct(${Number(p.id)});}"><div class="pic">${(p.main_image_url||p.image1_url)?`<img class="productCardImage" src="${escapeHtml(p.image1_url)}" alt="${escapeHtml(p.name||"")}" loading="lazy">`:`<div class="productCardEmoji">${escapeHtml(p.emoji||"🎮")}</div>`}</div><div class="info"><div class="cat">${escapeHtml(categoryLabel||"")}</div><h3>${escapeHtml(p.name||"")}</h3><div class="${availabilityClass}" ${availabilityAttribute}>${availabilityLabel}</div><div class="productCardPurchaseRow">${priceHtml}<div class="productCardBottom ${inStock?"":"is-placeholder"}">${inStock?`<button type="button" class="addToCartIcon" aria-label="Ajouter au panier" onclick="event.stopPropagation();add(${Number(p.id)});">＋</button>`:""}</div></div></div></article>`;
    } catch(error) {
      console.error("SNGAMER_PRODUCT_CARD_RENDER_ERROR", p?.id, error);
      return "";
    }
  }).join("");
  if(list.length===0&&window.activeStoreSection!=="home"&&window.activeStoreSection!=="profile"){productGrid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:35px 15px;color:#aab8ca;border:1px dashed #2a4262;border-radius:16px"><div style="font-size:32px">🎮</div><p>Aucun produit dans cette rubrique pour le moment.</p></div>`;}
}
function save(){localStorage.setItem("sg_cart",JSON.stringify(cartItems));update();}
function add(id){const product=products.find(x=>Number(x.id)===Number(id));const isOnOrder=String(product?.stock_mode||"")==="on_order";if(!product||(!isOnOrder&&Number(product.stock)<=0)){alert("Ce produit est en rupture de stock.");return false;}const item=cartItems.find(x=>Number(x.id)===Number(id));if(item&&!isOnOrder&&Number(item.qty)>=Number(product.stock)){alert("La quantité demandée dépasse le stock disponible.");return false;}if(item)item.qty++;else cartItems.push({id:product.id,qty:1});save();return true;}
function update(){const validItems=cartItems.filter(x=>products.some(p=>Number(p.id)===Number(x.id)));if(validItems.length!==cartItems.length){cartItems=validItems;localStorage.setItem("sg_cart",JSON.stringify(cartItems));}document.querySelector("#count").textContent=cartItems.reduce((s,x)=>s+x.qty,0);document.querySelector("#items").innerHTML=cartItems.length?cartItems.map(x=>{const p=products.find(p=>Number(p.id)===Number(x.id));return `<div class="cartItem"><div class="em">${p.image1_url?`<img src="${p.image1_url}" alt="${escapeHtml(p.name)}">`:p.emoji}</div><div><b>${escapeHtml(p.name)}</b><br><small>${money(Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price)?Number(p.promo_price):Number(p.price))} × ${x.qty}</small></div><div class="qty"><button onclick="chg(${p.id},-1)">−</button>${x.qty}<button onclick="chg(${p.id},1)">+</button></div></div>`}).join(""):"<p style='color:#8190a2'>Panier vide.</p>";const total=cartItems.reduce((s,x)=>{const p=products.find(p=>Number(p.id)===Number(x.id));return s+(p?(Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price)?Number(p.promo_price):Number(p.price))*x.qty:0)},0);document.querySelector("#total").textContent=money(total);}
function chg(id,n){const item=cartItems.find(x=>Number(x.id)===Number(id));if(!item)return;const product=products.find(p=>Number(p.id)===Number(id));if(!product)return;if(n>0&&String(product.stock_mode||"")!=="on_order"&&Number(item.qty)>=Number(product.stock)){alert("Stock maximum atteint pour ce produit.");return;}item.qty+=n;if(item.qty<=0)cartItems=cartItems.filter(x=>Number(x.id)!==Number(id));save();}
function cart(){document.querySelector("#drawer").classList.add("show");update();}
function closeCart(){document.querySelector("#drawer").classList.remove("show");}
function openCheckout(){if(!cartItems.length)return alert("Panier vide.");for(const item of cartItems){const product=products.find(p=>Number(p.id)===Number(item.id));if(!product||(String(product.stock_mode||"")!=="on_order"&&Number(product.stock)<Number(item.qty))){alert("Stock insuffisant pour un produit de ton panier. Actualise la boutique et corrige la quantité.");return;}}document.querySelector("#checkoutSummary")?.remove();const summary=cartItems.map(x=>{const p=products.find(product=>Number(product.id)===Number(x.id));if(!p)return "";const promoActive=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price),unitPrice=promoActive?Number(p.promo_price):Number(p.price);return `<div class="checkoutItem"><span>${escapeHtml(p.name)} × ${x.qty}</span><b>${money(unitPrice*x.qty)}</b></div>`}).join("");const total=cartItems.reduce((sum,x)=>{const p=products.find(product=>Number(product.id)===Number(x.id));if(!p)return sum;const promoActive=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price),unitPrice=promoActive?Number(p.promo_price):Number(p.price);return sum+unitPrice*Number(x.qty)},0);document.querySelector("#checkout .box").classList.add("hasSummary");document.querySelector("#checkout .box").insertAdjacentHTML("afterbegin",`<div id="checkoutSummary"><h3>Votre commande</h3>${summary}<div class="checkoutTotal"><span>Total</span><b>${money(total)}</b></div></div>`);document.querySelector("#checkout").classList.add("show");}
function closeCheckout(){document.querySelector("#checkout").classList.remove("show");}
async function order(){let customer={name:document.querySelector("#name").value,phone:document.querySelector("#phone").value,address:document.querySelector("#addr").value};if(!customer.name||!customer.phone||!customer.address)return alert("Remplis les informations.");let payment=document.querySelector("#pay").value;let r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer,payment,items:cartItems})});let d=await r.json();if(!r.ok)return alert(d.error||"Erreur");alert("Commande enregistrée : "+d.orderId);cartItems=[];save();closeCheckout();closeCart();load();}
window.load=load;window.render=render;window.filterBy=filterBy;
document.querySelector("#q").oninput=render;load();
function escapeHtml(text=""){return String(text).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function productDescriptionPreview(text){
  const raw=String(text||"").replace(/\r\n?/g,"\n").trim();
  if(!raw)return "";
  let pieces=[];
  try{
    if(typeof Intl!=="undefined"&&typeof Intl.Segmenter==="function"){
      pieces=Array.from(new Intl.Segmenter("fr",{granularity:"sentence"}).segment(raw),x=>x.segment.trim()).filter(Boolean);
    }
  }catch(_){}
  if(pieces.length<=1){
    const paragraphs=raw.split(/\n+/).map(x=>x.trim()).filter(Boolean);
    if(paragraphs.length>1) pieces=paragraphs;
  }
  if(pieces.length<=1){
    pieces=(raw.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[raw]).map(x=>x.trim()).filter(Boolean);
  }
  let preview=pieces.slice(0,2).join(" ").trim()||raw;
  if(preview===raw&&raw.length>220){
    const cut=raw.slice(0,200);
    const boundary=cut.lastIndexOf(" ");
    preview=(boundary>130?cut.slice(0,boundary):cut).trim().replace(/[.,;:!?\s]+$/,"")+"…";
  }
  return preview;
}
function normalizeProductCharacteristics(input){
  let rows=input;
  if(typeof rows==="string"){try{rows=JSON.parse(rows)}catch(_){return []}}
  if(!Array.isArray(rows))return [];
  return rows.map(row=>({
    name:String(row?.name??"").trim().slice(0,80),
    value:String(row?.value??"").trim().slice(0,300)
  })).filter(row=>row.name&&row.value).slice(0,30);
}
function toggleProductDescription(button){
  const section=button?.closest(".productDescriptionSection");
  if(!section)return;
  const preview=section.querySelector(".sngDescriptionPreview");
  const full=section.querySelector(".sngDescriptionFull");
  if(!preview||!full)return;
  const expanded=button.getAttribute("aria-expanded")==="true";
  const nextExpanded=!expanded;
  preview.hidden=nextExpanded;
  full.hidden=!nextExpanded;
  preview.style.display=nextExpanded?"none":"block";
  full.style.display=nextExpanded?"block":"none";
  button.setAttribute("aria-expanded",String(nextExpanded));
  button.textContent=nextExpanded?"Voir moins ↑":"Voir plus ↓";
}

function openProduct(id){
  const p=products.find(x=>Number(x.id)===Number(id));
  if(!p)return;

  const images=[p.image1_url,p.image2_url,p.image3_url].filter(Boolean);
  const stockMode=String(p.stock_mode||"stock");
  const stockCount=Math.max(0,Math.floor(Number(p.stock)||0));
  const isOnOrder=stockMode==="on_order";
  const isOutOfStock=stockMode==="out"||(!isOnOrder&&stockCount<=0);
  const inStock=isOnOrder||(!isOutOfStock&&stockCount>0);
  const availabilityHtml=(()=>{
    if(isOnOrder){
      return '<div class="stock sngProductAvailability onOrderStock" role="status" aria-label="Sur commande">Sur commande</div>';
    }
    let state,label;
    if(isOutOfStock){state="is-out";label="Rupture de stock";}
    else if(stockCount>5){state="is-stock";label="En stock";}
    else if(stockCount===1){state="is-last";label="Dernier article !";}
    else{state="is-limited";label="Stock limité";}
    return '<div class="stock sngProductAvailability sngStockStatus '+state+'" role="status" aria-label="'+label+'"><i aria-hidden="true"></i><span>'+label+'</span></div>';
  })();
  const promoActive=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price);
  const productCondition=["Neuf","Occasion","Reconditionné","Produit numérique"].includes(String(p.product_condition||"Neuf"))
    ? String(p.product_condition||"Neuf") : "Neuf";
  const warrantyText=String(p.warranty||"").trim();
  const warrantyConfigured=p.warranty_configured===true||p.warranty_configured==="true";
  const warrantyDisplay=warrantyConfigured?(warrantyText||"Aucune garantie"):"À définir";
  window.productImages=images;

  const formattedNormalPrice=new Intl.NumberFormat("fr-FR").format(Number(p.price)||0);
  const formattedCurrentPrice=new Intl.NumberFormat("fr-FR").format(promoActive?Number(p.promo_price):Number(p.price));
  const discountPercent=promoActive?Math.round((1-Number(p.promo_price)/Number(p.price))*100):0;
  const priceHtml=`
    <section class="sngProductCommercialPanel ${promoActive?"has-promo":"no-promo"}" aria-label="Prix et livraison">
      <div class="sngProductPriceRow ${promoActive?"is-promo":"is-regular"}">
        ${promoActive?`<span class="sngProductOldPrice">${formattedNormalPrice} FCFA</span>`:""}
        <strong class="sngProductCurrentPrice">${formattedCurrentPrice}<small>FCFA</small></strong>
        ${promoActive?`<span class="sngProductDiscountBadge">-${discountPercent}%</span>`:""}
      </div>
      <div class="sngProductDeliveryNotice" aria-label="Livraison">
        <span class="sngProductDeliveryIcon" aria-hidden="true">🚚</span>
        <p>Reçois cet article dans <strong>2 heures maximum</strong> chez toi</p>
      </div>
    </section>`;

  const descriptionText=String(p.description||"Aucune description disponible.").replace(/\r\n?/g,"\n").trim();
  const previewText=productDescriptionPreview(descriptionText);
  const compactFull=descriptionText.replace(/\s+/g," ").trim();
  const compactPreview=previewText.replace(/\s+/g," ").trim();
  const needsDescriptionToggle=compactFull!==compactPreview;
  const productCharacteristics=normalizeProductCharacteristics(p.characteristics);
  const characteristicsHtml=productCharacteristics.length
    ? `<section class="sngProductCharacteristics" aria-labelledby="sngProductCharacteristicsTitle">
        <h3 id="sngProductCharacteristicsTitle">Caractéristiques</h3>
        <dl class="sngProductCharacteristicsList">
          ${productCharacteristics.map(item=>`<div class="sngProductCharacteristicRow"><dt>${escapeHtml(item.name)}</dt><dd>${escapeHtml(item.value).replace(/\\n/g,"<br>")}</dd></div>`).join("")}
        </dl>
      </section>`
    : "";
  const fullDescriptionHtml=escapeHtml(descriptionText).replace(/\n/g,"<br>");
  const descriptionHtml=needsDescriptionToggle
    ? `<div class="sngDescriptionContent"><p class="productDescription sngDescriptionPreview">${escapeHtml(previewText).replace(/\\n/g,"<br>")}</p><p class="productDescription sngDescriptionFull" hidden>${fullDescriptionHtml}</p><button type="button" class="sngDescriptionToggle" aria-expanded="false" onclick="toggleProductDescription(this)">Voir plus ↓</button></div>`
    : `<div class="sngDescriptionContent"><p class="productDescription">${fullDescriptionHtml}</p></div>`;

  const assuranceHtml=`
    <section class="sngProductAssuranceGrid" aria-label="Informations de livraison et du produit">
      <div class="sngAssuranceItem sngDeliveryModule">
        <span class="sngAssuranceIcon" aria-hidden="true">🚚</span>
        <div class="sngAssuranceCopy">
          <span class="sngAssuranceEyebrow">LIVRAISON</span>
          <strong>Partout au Sénégal</strong>
        </div>
      </div>
      <div class="sngAssuranceItem">
        <span class="sngAssuranceIcon" aria-hidden="true">${productCondition === "Produit numérique" ? "💻" : "📦"}</span>
        <div class="sngAssuranceCopy">
          <span class="sngAssuranceEyebrow">${productCondition === "Produit numérique" ? "TYPE DE PRODUIT" : "ÉTAT DU PRODUIT"}</span>
          <strong>${escapeHtml(productCondition)}</strong>
        </div>
      </div>
      <div class="sngAssuranceItem">
        <span class="sngAssuranceIcon" aria-hidden="true">🛡️</span>
        <div class="sngAssuranceCopy">
          <span class="sngAssuranceEyebrow">GARANTIE</span>
          <strong>${escapeHtml(warrantyDisplay)}</strong>
        </div>
      </div>
    </section>`;

  document.querySelector("#productDetail").innerHTML=`
    <div class="productDetail sngProductDetailV1">
      <div class="productGallery">
        <div class="productMainImage">${images.length?`<img id="productMainImage" src="${escapeHtml(images[0])}" alt="${escapeHtml(p.name)}">`:`<div class="productEmoji">${escapeHtml(p.emoji||"🎮")}</div>`}</div>
        ${images.length>1?`<div class="productThumbnails">${images.map((url,i)=>`<button type="button" class="productThumb ${i===0?"isActive":""}" onclick="selectProductImage(${i})" aria-label="Afficher l’image ${i+1}"><img src="${escapeHtml(url)}" alt="${escapeHtml(p.name)} — image ${i+1}"></button>`).join("")}</div>`:""}
      </div>
      <div class="productInfo sngProductInfoV1">
        <div class="cat">${escapeHtml(typeof window.storeCategory==="function"?window.storeCategory(p):(p.category||"Gaming"))}</div>
        <h2>${escapeHtml(p.name)}</h2>
        ${availabilityHtml}
        ${priceHtml}
        <section class="productDescriptionSection sngProductDescriptionV1">
          <h3 class="productDescriptionTitle">Description</h3>
          ${descriptionHtml}
        </section>
        ${characteristicsHtml}
        ${assuranceHtml}
        ${p.video_url?`<div class="productVideo"><h3>Vidéo du produit</h3><video controls preload="metadata" src="${escapeHtml(p.video_url)}"></video></div>`:""}
        ${inStock?`<button class="primary full sngProductAddButton" type="button" onclick="if(add(${Number(p.id)}))closeProduct()">Ajouter au panier</button>`:`<button class="primary full disabled sngProductAddButton" type="button" disabled>Rupture de stock</button>`}
      </div>
    </div>`;

  document.querySelector("#productModal").classList.add("show");
  try{history.replaceState(null,"",location.pathname+"#product="+p.id)}catch(_){location.hash="product="+p.id}
}
function closeProduct(){document.querySelector("#productModal").classList.remove("show");try{history.replaceState(null,"",location.pathname)}catch(_){location.hash=""}}
function selectProductImage(i){const img=document.querySelector("#productMainImage");if(img&&window.productImages?.[i])img.src=window.productImages[i]}
