let products=[],cartItems=JSON.parse(localStorage.getItem("sg_cart")||"[]"),filter="Tous",activeStoreSection="home",selectedCoinPlatform=null;
const money=n=>new Intl.NumberFormat("fr-FR").format(n)+" FCFA";
async function load(){
  try {
    const response = await fetch("/api/products", { cache: "no-store" });
    if (!response.ok) throw new Error("products_http_" + response.status);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("products_response_not_array");
    products = data;
    window.storeProducts = products;
    cats();
    render();
    update();
  } catch (error) {
    console.error("SNGAMER_STORE_LOAD_ERROR", error);
    const grid = document.getElementById("products");
    if (grid && !grid.querySelector(".productCardClickable")) {
      grid.innerHTML = '<div role="status" style="grid-column:1/-1;text-align:center;padding:35px 15px;color:#aab8ca">Impossible de charger les produits. Vérifie ta connexion puis réessaie.</div>';
    }
  }
}
function storeCategory(p) {
  const category = (p.category || "").trim().toLowerCase();
  if (category === "coins" || isCoinProduct(p)) return "Coins";
  if (category === "gaming phone" || isPhoneProduct(p)) return "Gaming Phone";
  if (category === "accessoires" || isAccessoryProduct(p)) return "Accessoires";
  return p.category || "Accessoires";
}
function cats() {
  const categories = ["Tous", ...new Set(products.map(p => storeCategory(p)))];
  document.querySelector("#cats").innerHTML = categories.map(c => `<button class="catbtn ${c === filter ? "on" : ""}" onclick="filterBy('${c}')">${c}</button>`).join("");
}
function filterBy(c){filter=c;cats();render()}
function render(){
  const productGrid = document.getElementById("products");
  if (!productGrid) return;
  if (activeStoreSection === "profile" || activeStoreSection === "coins") { productGrid.replaceChildren(); return; }
  const q = (document.querySelector("#q")?.value || "").toLowerCase();
  const list = products.filter(p => matchesStoreSection(p) && (activeStoreSection !== "home" || filter === "Tous" || storeCategory(p) === filter) && (p.name || "").toLowerCase().includes(q));
  productGrid.innerHTML = list.map(p => {
    const promoActive=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price);
    const discount=promoActive?Math.round((1-Number(p.promo_price)/Number(p.price))*100):0;
    const inStock=Number(p.stock)>0;
    const priceHtml=promoActive?`<div class="price price--promo"><div class="pricePromoTop"><span class="priceOld">${new Intl.NumberFormat("fr-FR").format(p.price)} FCFA</span><span class="discountBadge">-${discount}%</span></div><strong class="priceCurrent">${new Intl.NumberFormat("fr-FR").format(p.promo_price)}<small>FCFA</small></strong></div>`:`<div class="price price--regular"><strong class="priceCurrent">${new Intl.NumberFormat("fr-FR").format(p.price)}<small>FCFA</small></strong></div>`;
    const category=storeCategory(p),categoryLabel=category==="Coins"&&p.platform?`${category} ${p.platform}`:category;
    return `<article class="card productCardClickable" onclick="openProduct(${Number(p.id)})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openProduct(${Number(p.id)});}"><div class="pic">${(p.main_image_url||p.image1_url)?`<img class="productCardImage" src="${escapeHtml(p.image1_url)}" alt="${escapeHtml(p.name||"")}" loading="lazy">`:`<div class="productCardEmoji">${escapeHtml(p.emoji||"🎮")}</div>`}</div><div class="info"><div class="cat">${escapeHtml(categoryLabel||"")}</div><h3>${escapeHtml(p.name||"")}</h3>${priceHtml}<div class="stock ${!inStock?"outOfStock":""}">${inStock?`${p.stock} disponible(s)`:"Rupture de stock"}</div>${inStock?`<div class="productCardBottom"><button type="button" class="addToCartIcon" aria-label="Ajouter au panier" onclick="event.stopPropagation();add(${Number(p.id)});">＋</button></div>`:""}</div></article>`;
  }).join("");
  if(list.length===0&&activeStoreSection!=="home"&&activeStoreSection!=="profile"&&!(activeStoreSection==="coins"&&!selectedCoinPlatform)){productGrid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:35px 15px;color:#aab8ca;border:1px dashed #2a4262;border-radius:16px"><div style="font-size:32px">🎮</div><p>Aucun produit dans cette rubrique pour le moment.</p></div>`;}
}
function save(){localStorage.setItem("sg_cart",JSON.stringify(cartItems));update()}
function add(id){const product=products.find(x=>Number(x.id)===Number(id));if(!product||Number(product.stock)<=0){alert("Ce produit est en rupture de stock.");return false;}const item=cartItems.find(x=>Number(x.id)===Number(id));if(item&&Number(item.qty)>=Number(product.stock)){alert("La quantité demandée dépasse le stock disponible.");return false;}if(item)item.qty++;else cartItems.push({id:product.id,qty:1});save();return true;}
function update(){const validItems=cartItems.filter(x=>products.some(p=>Number(p.id)===Number(x.id)));if(validItems.length!==cartItems.length){cartItems=validItems;localStorage.setItem("sg_cart",JSON.stringify(cartItems));}document.querySelector("#count").textContent=cartItems.reduce((s,x)=>s+x.qty,0);document.querySelector("#items").innerHTML=cartItems.length?cartItems.map(x=>{const p=products.find(p=>Number(p.id)===Number(x.id));return `<div class="cartItem"><div class="em">${p.image1_url?`<img src="${p.image1_url}" alt="${escapeHtml(p.name)}">`:p.emoji}</div><div><b>${escapeHtml(p.name)}</b><br><small>${money(Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price)?Number(p.promo_price):Number(p.price))} × ${x.qty}</small></div><div class="qty"><button onclick="chg(${p.id},-1)">−</button>${x.qty}<button onclick="chg(${p.id},1)">+</button></div></div>`}).join(""):"<p style='color:#8190a2'>Panier vide.</p>";const total=cartItems.reduce((s,x)=>{const p=products.find(p=>Number(p.id)===Number(x.id));return s+(p?(Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price)?Number(p.promo_price):Number(p.price))*x.qty:0)},0);document.querySelector("#total").textContent=money(total)}
function chg(id,n){const item=cartItems.find(x=>Number(x.id)===Number(id));if(!item)return;const product=products.find(p=>Number(p.id)===Number(id));if(!product)return;if(n>0&&Number(item.qty)>=Number(product.stock)){alert("Stock maximum atteint pour ce produit.");return;}item.qty+=n;if(item.qty<=0)cartItems=cartItems.filter(x=>Number(x.id)!==Number(id));save()}
function cart(){document.querySelector("#drawer").classList.add("show");update()}
function closeCart(){document.querySelector("#drawer").classList.remove("show")}
function openCheckout(){if(!cartItems.length)return alert("Panier vide.");for(const item of cartItems){const product=products.find(p=>Number(p.id)===Number(item.id));if(!product||Number(product.stock)<Number(item.qty)){alert("Stock insuffisant pour un produit de ton panier. Actualise la boutique et corrige la quantité.");return;}}document.querySelector("#checkoutSummary")?.remove();const summary=cartItems.map(x=>{const p=products.find(product=>Number(product.id)===Number(x.id));if(!p)return "";const promoActive=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price),unitPrice=promoActive?Number(p.promo_price):Number(p.price);return `<div class="checkoutItem"><span>${escapeHtml(p.name)} × ${x.qty}</span><b>${money(unitPrice*x.qty)}</b></div>`}).join("");const total=cartItems.reduce((sum,x)=>{const p=products.find(product=>Number(product.id)===Number(x.id));if(!p)return sum;const promoActive=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price),unitPrice=promoActive?Number(p.promo_price):Number(p.price);return sum+unitPrice*Number(x.qty)},0);document.querySelector("#checkout .box").classList.add("hasSummary");document.querySelector("#checkout .box").insertAdjacentHTML("afterbegin",`<div id="checkoutSummary"><h3>Votre commande</h3>${summary}<div class="checkoutTotal"><span>Total</span><b>${money(total)}</b></div></div>`);document.querySelector("#checkout").classList.add("show")}
function closeCheckout(){document.querySelector("#checkout").classList.remove("show")}
async function order(){let customer={name:document.querySelector("#name").value,phone:document.querySelector("#phone").value,address:document.querySelector("#addr").value};if(!customer.name||!customer.phone||!customer.address)return alert("Remplis les informations.");let payment=document.querySelector("#pay").value;let r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer,payment,items:cartItems})});let d=await r.json();if(!r.ok)return alert(d.error||"Erreur");alert("Commande enregistrée : "+d.orderId);cartItems=[];save();closeCheckout();closeCart();load()}
document.querySelector("#q").oninput=render;load();
function escapeHtml(text=""){return String(text).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function openProduct(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  const images=[p.image1_url,p.image2_url,p.image3_url].filter(Boolean),inStock=Number(p.stock)>0;window.productImages=images;
  document.querySelector("#productDetail").innerHTML=`
    <div class="productDetail">
      <div class="productGallery">
        <div class="productMainImage">${images.length?`<img id="productMainImage" src="${escapeHtml(images[0])}" alt="${escapeHtml(p.name)}">`:`<div class="productEmoji">${escapeHtml(p.emoji||"🎮")}</div>`}</div>
        ${images.length>1?`<div class="productThumbnails">${images.map((url,i)=>`<button class="productThumb" onclick="selectProductImage(${i})"><img src="${escapeHtml(url)}" alt="${escapeHtml(p.name)}"></button>`).join("")}</div>`:""}
      </div>
      <div class="productInfo">
        <div class="cat">${escapeHtml(p.category||"Gaming")}</div>
        <h2>${escapeHtml(p.name)}</h2>
        ${Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price)?`<div class="price price--promo"><span class="priceOld">${money(p.price)}</span><strong class="priceCurrent">${money(p.promo_price)}</strong><span class="discountBadge">-${Math.round((1-Number(p.promo_price)/Number(p.price))*100)}%</span></div>`:`<div class="price">${money(p.price)}</div>`}
        ${inStock?`<div class="stock">${p.stock} disponible(s)</div>`:`<div class="stock outOfStock">Rupture de stock</div>`}

        <section class="productDescriptionSection">
          <h3 class="productDescriptionTitle">Description</h3>
          <p class="productDescription">${escapeHtml(p.description||"Aucune description disponible.").replace(/\n/g,"<br>")}</p>
        </section>

        ${p.video_url?`<div class="productVideo"><h3>Vidéo du produit</h3><video controls preload="metadata" src="${escapeHtml(p.video_url)}"></video></div>`:""}
        ${inStock?`<button class="primary full" onclick="add(${p.id});closeProduct()">Ajouter au panier</button>`:`<button class="primary full disabled" disabled>Rupture de stock</button>`}
      </div>
    </div>`;
  document.querySelector("#productModal").classList.add("show");
  try{history.replaceState(null,"",location.pathname+"#product="+p.id)}catch(_){location.hash="product="+p.id}
}
function closeProduct(){document.querySelector("#productModal").classList.remove("show");try{history.replaceState(null,"",location.pathname)}catch(_){location.hash=""}}
function selectProductImage(i){const img=document.querySelector("#productMainImage");if(img&&window.productImages?.[i])img.src=window.productImages[i]}
