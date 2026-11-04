function normalizeCartItems(input){
  if(!Array.isArray(input))return [];
  const normalized=[];
  for(const raw of input){
    if(!raw||typeof raw!=="object")continue;
    const id=Number(raw.id),qty=Math.floor(Number(raw.qty));
    if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(qty)||qty<=0)continue;
    const colorName=String(raw.color&&raw.color.name||"").trim();
    const color=colorName?{name:colorName.slice(0,80),hex:String(raw.color.hex||"").slice(0,32)}:null;
    const existing=normalized.find(item=>Number(item.id)===id&&String(item.color?.name||"").trim().toLowerCase()===String(color?.name||"").trim().toLowerCase());
    if(existing)existing.qty+=qty;
    else normalized.push(color?{id,qty,color}:{id,qty});
  }
  return normalized;
}
function readCartItems(){
  try{return normalizeCartItems(JSON.parse(localStorage.getItem("sg_cart")||"[]"));}
  catch(_){return [];}
}
let products=[],cartItems=readCartItems(),filter="Tous",selectedCoinPlatform=null;
try{
  Object.defineProperty(window,"cartItems",{
    configurable:true,enumerable:true,
    get(){return cartItems;},
    set(value){cartItems=normalizeCartItems(value);}
  });
}catch(_){window.cartItems=cartItems;}

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

function waitForCatalogRetry(ms){
  return new Promise(resolve=>window.setTimeout(resolve,ms));
}

async function fetchProductsWithRetry(){
  const delays=[900,2200,5000,9000];
  let lastError=null;
  for(let attempt=0;attempt<=delays.length;attempt++){
    try{
      const response=await fetch("/api/products",{cache:"no-store",headers:{"Accept":"application/json"}});
      if(!response.ok){
        const error=new Error("products_http_"+response.status);
        error.status=response.status;
        const retryAfter=Number(response.headers.get("Retry-After"));
        error.retryDelay=Number.isFinite(retryAfter)&&retryAfter>0
          ?Math.min(15000,Math.max(1000,retryAfter*1000)):8000;
        throw error;
      }
      const data=await response.json();
      if(!Array.isArray(data)){
        const error=new Error("products_response_not_array");
        error.status=502;
        throw error;
      }
      return data;
    }catch(error){
      lastError=error;
      const status=Number(error&&error.status)||0;
      const retryable=status===0||status===429||status>=500;
      if(!retryable||attempt>=delays.length)break;
      const delay=status===429?error.retryDelay:delays[attempt];
      console.warn("SNGAMER_CATALOG_RETRY",attempt+1,"/",delays.length+1,"after",delay+"ms",error);
      await waitForCatalogRetry(delay);
    }
  }
  throw lastError||new Error("products_unavailable");
}

async function load(){
  if(window.__sngamerCatalogLoading)return;
  window.__sngamerCatalogLoading=true;
  let data;
  try {
    data=await fetchProductsWithRetry();
    if(window.__sngamerCatalogRecoveryTimer){
      window.clearTimeout(window.__sngamerCatalogRecoveryTimer);
      window.__sngamerCatalogRecoveryTimer=null;
    }
  } catch (error) {
    window.__sngamerCatalogLoading=false;
    console.error("SNGAMER_PRODUCTS_FETCH_ERROR",error);
    const grid=document.getElementById("products");
    if(grid&&!grid.querySelector(".productCardClickable")){
      grid.innerHTML='<div role="status" style="grid-column:1/-1;text-align:center;padding:35px 15px;color:#aab8ca">Connexion au catalogue en cours de rétablissement…</div>';
    }
    window.__sngamerStoreReady=true;

    // A short Render restart or network interruption must not strand the
    // storefront on an empty catalogue until the visitor reloads manually.
    const status=Number(error&&error.status)||0;
    if((status===0||status===429||status>=500)&&!window.__sngamerCatalogRecoveryTimer){
      window.__sngamerCatalogRecoveryTimer=window.setTimeout(()=>{
        window.__sngamerCatalogRecoveryTimer=null;
        window.__sngamerStoreReady=false;
        void load();
      },15000);
    }
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
  window.__sngamerCatalogLoading=false;
}

/* SNGAMER — RUBRIQUES ET NAVIGATION */
function productText(p) {
  return [p?.name, p?.category, p?.description].filter(Boolean).map(value=>String(value)).join(" ").toLowerCase();
}
function isCoinProduct(p) {
  const category = String(p?.category || "").trim().toLowerCase();
  if (["coins", "pièces efootball", "piece efootball", "pieces efootball"].includes(category)) return true;
  return /(coins?|e-?football|fc mobile|fc points|mobile legends|diamants?|diamonds?|gems?|myclub|top[- ]?up|recharge de jeu)/i.test(productText(p));
}
function isPhoneProduct(p) {
  const category = String(p?.category || "").trim().toLowerCase();
  if (["univers gaming", "gaming phone", "gaming phones"].includes(category)) return true;
  return !isCoinProduct(p) && /(gaming phone|téléphone|telephone|smartphone|phone|iphone|samsung galaxy|redmi note|poco|rog phone|nubia|redmagic|red magic|infinix gt|tecno pova|black shark)/i.test(productText(p));
}
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
  if(category==="coins"||isCoinProduct(p)) return "Pièces eFootball";
  if(category==="univers gaming"||category==="gaming phone"||category==="gaming phones"||isPhoneProduct(p)) return "Univers Gaming";
  if(category==="accessoires"||isAccessoryProduct(p)) return "Accessoires";
  return p.category||"Accessoires";
}
function cats(){
  const categories=["Tous",...new Set(products.map(p=>storeCategory(p)))];
  document.querySelector("#cats").innerHTML=categories.map(c=>`<button class="catbtn ${c===filter?"on":""}" onclick="filterBy('${c}')">${c}</button>`).join("");
}
function filterBy(c){
  filter=c;
  window.activeStoreCategoryFilter=c;
  window.activeStoreSubcategory=null;
  document.body.dataset.storeCategoryFilter=(c==="Tous"?"":c);
  cats();
  render();
  if(typeof window.updateStoreSubcategories==="function") window.updateStoreSubcategories();
}
function render(){
  const productGrid=document.getElementById("products");
  if(!productGrid)return;
  if(window.activeStoreSection==="profile"){productGrid.replaceChildren();return;}
  const q=(document.querySelector("#q")?.value||"").toLowerCase();
  const sourceList=(window.activeStoreSection==="home"&&filter==="Tous")?homeMixedProducts:products;
  const selectedPlatform=String(window.activeStoreSubcategory||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const list=sourceList.filter(p=>matchesStoreSection(p)&&(window.activeStoreSection!=="home"||filter==="Tous"||storeCategory(p)===filter)&&(!selectedPlatform||String(p.platform||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")===selectedPlatform||(selectedPlatform==="gaming phone"&&String(p.category||"").trim().toLowerCase()==="gaming phone"))&&(p.name||"").toLowerCase().includes(q));
  productGrid.innerHTML=list.map(p=>{
    try {
    const promoActive=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price);
    const discount=promoActive?Math.round((1-Number(p.promo_price)/Number(p.price))*100):0;
    const stockMode=String(p.stock_mode||"stock").trim().toLowerCase();
    const stockCount=Math.max(0,Math.floor(Number(p.stock)||0));
    const isOnOrder=stockMode==="on_order";
    const isOutOfStock=stockMode==="out"||(!isOnOrder&&stockCount<=0);
    const inStock=isOnOrder||!isOutOfStock;
    let availabilityState,availabilityLabel;
    if(isOnOrder){availabilityState="on-order";availabilityLabel="Sur commande";}
    else if(isOutOfStock){availabilityState="is-out";availabilityLabel="Rupture de stock";}
    else if(stockCount>5){availabilityState="is-stock";availabilityLabel="En stock";}
    else if(stockCount===1){availabilityState="is-last";availabilityLabel="Dernier article !";}
    else{availabilityState="is-limited";availabilityLabel="Stock limité";}
    const availabilityClass=isOnOrder?"stock onOrderStock":`stock sngStockStatus ${availabilityState}`;
    const availabilityAttribute=`role="status" aria-label="${availabilityLabel}"`;
    const availabilityHtml=isOnOrder
      ? `<div class="${availabilityClass}" ${availabilityAttribute}>${availabilityLabel}</div>`
      : `<div class="${availabilityClass}" ${availabilityAttribute}><i aria-hidden="true"></i><span>${availabilityLabel}</span></div>`;
    const normalPriceText = new Intl.NumberFormat("fr-FR").format(p.price);
    const currentPriceValue = promoActive ? Number(p.promo_price) : Number(p.price);
    const currentPriceText = new Intl.NumberFormat("fr-FR").format(currentPriceValue);
    const currentPriceDigits = currentPriceText.replace(/\D/g, "").length;
    const currentPriceClass = currentPriceDigits >= 7 ? "priceCurrent priceCurrent--long" : currentPriceDigits >= 6 ? "priceCurrent priceCurrent--medium" : "priceCurrent";
    const priceHtml = promoActive
      ? `<div class="price price--promo"><div class="priceOldRow"><span class="priceOld">${normalPriceText} FCFA</span><span class="discountBadge">-${discount}%</span></div><div class="pricePromoMain"><strong class="${currentPriceClass}">${currentPriceText}<small>FCFA</small></strong></div></div>`
      : `<div class="price price--regular"><div class="priceOldRow priceOldRow--placeholder" aria-hidden="true"></div><div class="pricePromoMain"><strong class="${currentPriceClass}">${currentPriceText}<small>FCFA</small></strong></div></div>`;
    const category=storeCategory(p),categoryLabel=category==="Coins"&&p.platform?`${category} ${p.platform}`:category;
    return `<article class="card productCardClickable" onclick="openProduct(${Number(p.id)})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openProduct(${Number(p.id)});}"><div class="pic">${(p.main_image_url||p.image1_url)?`<img class="productCardImage" src="${escapeHtml(p.image1_url)}" alt="${escapeHtml(p.name||"")}" loading="lazy">`:`<div class="productCardEmoji">${escapeHtml(p.emoji||"🎮")}</div>`}</div><div class="info"><div class="cat">${escapeHtml(categoryLabel||"")}</div><h3>${escapeHtml(p.name||"")}</h3>${availabilityHtml}<div class="productCardPurchaseRow">${priceHtml}<div class="productCardBottom ${inStock?"":"is-placeholder"}">${inStock?`<button type="button" class="addToCartIcon" aria-label="Ajouter au panier" onclick="event.stopPropagation();add(${Number(p.id)});">＋</button>`:""}</div></div></div></article>`;
    } catch(error) {
      console.error("SNGAMER_PRODUCT_CARD_RENDER_ERROR", p?.id, error);
      return "";
    }
  }).join("");
  if(list.length===0&&window.activeStoreSection!=="home"&&window.activeStoreSection!=="profile"){productGrid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:35px 15px;color:#aab8ca;border:1px dashed #2a4262;border-radius:16px"><div style="font-size:32px">🎮</div><p>Aucun produit dans cette rubrique pour le moment.</p></div>`;}
}
function syncCartBadge(){
  const total=cartItems.reduce((sum,item)=>sum+Math.max(0,Math.floor(Number(item&&item.qty)||0)),0);
  const cartButtons=Array.from(document.querySelectorAll(".siteHeader .cartButton, .cartButton"));
  cartButtons.forEach(button=>{
    let badge=button.querySelector("#count");
    if(!badge){
      badge=document.createElement("b");
      badge.id="count";
      button.appendChild(badge);
    }
    badge.textContent=String(total);
    // Keep the quantity visible even if another header script rebuilds the button
    // after the storefront initially synchronizes the cart.
    button.style.setProperty("position","relative","important");
    button.style.setProperty("overflow","visible","important");
    badge.style.setProperty("position","absolute","important");
    badge.style.setProperty("top","-4px","important");
    badge.style.setProperty("right","-4px","important");
    badge.style.setProperty("display","inline-flex","important");
    badge.style.setProperty("align-items","center","important");
    badge.style.setProperty("justify-content","center","important");
    badge.style.setProperty("min-width","19px","important");
    badge.style.setProperty("height","19px","important");
    badge.style.setProperty("padding","0 5px","important");
    badge.style.setProperty("box-sizing","border-box","important");
    badge.style.setProperty("border-radius","999px","important");
    badge.style.setProperty("background","linear-gradient(135deg,#ff4fa3 0%,#e11d8d 48%,#7c3aed 100%)","important");
    badge.style.setProperty("color","#fff","important");
    badge.style.setProperty("border","1.5px solid #fff","important");
    badge.style.setProperty("font-size","9px","important");
    badge.style.setProperty("font-weight","900","important");
    badge.style.setProperty("line-height","1","important");
    badge.style.setProperty("z-index","60","important");
    badge.style.setProperty("opacity","1","important");
    badge.style.setProperty("visibility","visible","important");
    badge.style.setProperty("pointer-events","none","important");
  });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",syncCartBadge,{once:true});
else syncCartBadge();
// Header modules can rebuild the cart button asynchronously. Recreate and refresh
// the badge whenever that specific button's contents change.
if(!window.__sngamerCartBadgeObserver){
  window.__sngamerCartBadgeObserver=new MutationObserver(syncCartBadge);
  const observeCartButton=()=>{
    document.querySelectorAll(".siteHeader .cartButton, .cartButton").forEach(button=>{
      if(button.__sngamerBadgeObserved)return;
      button.__sngamerBadgeObserved=true;
      window.__sngamerCartBadgeObserver.observe(button,{childList:true,subtree:true});
    });
  };
  observeCartButton();
  new MutationObserver(observeCartButton).observe(document.querySelector(".siteHeader .nav")||document.body,{childList:true,subtree:true});
}
window.addEventListener("storage",function(event){
  if(event.key!=="sg_cart")return;
  try{cartItems=normalizeCartItems(JSON.parse(event.newValue||"[]"));}
  catch(_){cartItems=[];}
  syncCartBadge();
});
function save(){cartItems=normalizeCartItems(cartItems);localStorage.setItem("sg_cart",JSON.stringify(cartItems));update();}
function add(id){const product=products.find(x=>Number(x.id)===Number(id));const isOnOrder=String(product?.stock_mode||"")==="on_order";if(!product||(!isOnOrder&&Number(product.stock)<=0)){alert("Ce produit est en rupture de stock.");return false;}const item=cartItems.find(x=>Number(x.id)===Number(id));if(item&&!isOnOrder&&Number(item.qty)>=Number(product.stock)){alert("La quantité demandée dépasse le stock disponible.");return false;}if(item)item.qty++;else cartItems.push({id:product.id,qty:1});save();return true;}
function update(){const validItems=cartItems.filter(x=>products.some(p=>Number(p.id)===Number(x.id)));if(validItems.length!==cartItems.length){cartItems=validItems;localStorage.setItem("sg_cart",JSON.stringify(cartItems));}syncCartBadge();document.querySelector("#items").innerHTML=cartItems.length?cartItems.map(x=>{const p=products.find(p=>Number(p.id)===Number(x.id));return `<div class="cartItem"><div class="em">${p.image1_url?`<img src="${p.image1_url}" alt="${escapeHtml(p.name)}">`:p.emoji}</div><div><b>${escapeHtml(p.name)}</b><br><small>${money(Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price)?Number(p.promo_price):Number(p.price))} × ${x.qty}</small></div><div class="qty"><button onclick="chg(${p.id},-1)">−</button>${x.qty}<button onclick="chg(${p.id},1)">+</button></div></div>`}).join(""):"<p style='color:#8190a2'>Panier vide.</p>";const total=cartItems.reduce((s,x)=>{const p=products.find(p=>Number(p.id)===Number(x.id));return s+(p?(Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price)?Number(p.promo_price):Number(p.price))*x.qty:0)},0);document.querySelector("#total").textContent=money(total);}
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
