let products=[],cartItems=JSON.parse(localStorage.getItem("sg_cart")||"[]"),filter="Tous",activeStoreSection="home",selectedCoinPlatform=null;
const money=n=>new Intl.NumberFormat("fr-FR").format(n)+" FCFA";
async function load(){products=await fetch("/api/products").then(r=>r.json());cats();render();update()}
function storeCategory(p) {
  const category = (p.category || "").trim().toLowerCase();

  if (category === "coins" || isCoinProduct(p)) {
    return "Coins";
  }

  if (category === "gaming phone" || isPhoneProduct(p)) {
    return "Gaming Phone";
  }

  if (category === "accessoires" || isAccessoryProduct(p)) {
    return "Accessoires";
  }

  return p.category || "Accessoires";
}

function cats() {
  const categories = [
    "Tous",
    ...new Set(products.map(p => storeCategory(p)))
  ];

  document.querySelector("#cats").innerHTML =
    categories.map(c =>
      `<button class="catbtn ${c === filter ? "on" : ""}"
      onclick="filterBy('${c}')">${c}</button>`
    ).join("");
}
function filterBy(c){filter=c;cats();render()}
function render(){
  const q = (document.querySelector("#q")?.value || "").toLowerCase();

  const list = products.filter(p =>
    matchesStoreSection(p) &&
    (
      activeStoreSection !== "home" ||
      filter === "Tous" ||
      storeCategory(p) === filter
    ) &&
    (p.name || "").toLowerCase().includes(q)
  );

  const productGrid = document.querySelector("#products");

  productGrid.innerHTML = list.map(p => {

    const promoActive =
      Boolean(p.promo_active) &&
      Number(p.promo_price) > 0 &&
      Number(p.promo_price) < Number(p.price);

    const discount = promoActive
      ? Math.round(
          (1 - Number(p.promo_price) / Number(p.price)) * 100
        )
      : 0;

    const inStock = Number(p.stock) > 0;

    const priceHtml = promoActive
  ? `
    <div class="price price--promo">
      <div class="pricePromoTop">
        <span class="priceOld">
          ${new Intl.NumberFormat("fr-FR").format(p.price)} FCFA
        </span>

        <span class="discountBadge">
          -${discount}%
        </span>
      </div>

      <strong class="priceCurrent">
  ${new Intl.NumberFormat("fr-FR").format(p.promo_price)}
  <small>FCFA</small>
</strong>
</div>
  `
  : `
    <div class="price price--regular">
      <strong class="priceCurrent">
        ${new Intl.NumberFormat("fr-FR").format(p.price)}
        <small>FCFA</small>
      </strong>
    </div>
  `;

    const category = storeCategory(p);

    const categoryLabel =
      category === "Coins" && p.platform
        ? `${category} ${p.platform}`
        : category;

    return `
      <article
        class="card productCardClickable"
        onclick="openProduct(${Number(p.id)})"
        role="button"
        tabindex="0"
        onkeydown="
          if(event.key==='Enter' || event.key===' '){
            event.preventDefault();
            openProduct(${Number(p.id)});
          }
        "
      >

        <div class="pic">
          ${
            (p.main_image_url || p.image1_url)
              ? `
                <img
                  class="productCardImage"
                  src="${escapeHtml(p.image1_url)}"
                  alt="${escapeHtml(p.name || "")}"
                  loading="lazy"
                >
              `
              : `
                <div class="productCardEmoji">
                  ${escapeHtml(p.emoji || "🎮")}
                </div>
              `
          }
        </div>

        <div class="info">

          <div class="cat">
            ${escapeHtml(categoryLabel || "")}
          </div>

          <h3>
            ${escapeHtml(p.name || "")}
          </h3>

          ${priceHtml}

          <div class="stock ${!inStock ? "outOfStock" : ""}">
            ${
              inStock
                ? `${p.stock} disponible(s)`
                : "Rupture de stock"
            }
          </div>

          ${
            inStock
              ? `
                <div class="productCardBottom">
                  <button
                    type="button"
                    class="addToCartIcon"
                    aria-label="Ajouter au panier"
                    onclick="
                      event.stopPropagation();
                      add(${Number(p.id)});
                    "
                  >
                    ＋
                  </button>
                </div>
              `
              : ""
          }

        </div>

      </article>
    `;
  }).join("");

  if (
    list.length === 0 &&
    activeStoreSection !== "home" &&
    activeStoreSection !== "profile" &&
    !(activeStoreSection === "coins" && !selectedCoinPlatform)
  ) {
    productGrid.innerHTML = `
      <div
        style="
          grid-column:1/-1;
          text-align:center;
          padding:35px 15px;
          color:#aab8ca;
          border:1px dashed #2a4262;
          border-radius:16px;
        "
      >
        <div style="font-size:32px">🎮</div>
        <p>Aucun produit dans cette rubrique pour le moment.</p>
      </div>
    `;
  }
}  


function save(){localStorage.setItem("sg_cart",JSON.stringify(cartItems));update()}
function add(id) {
  const product = products.find(p => Number(p.id) === Number(id));

  if (!product || Number(product.stock) <= 0) {
    alert("Ce produit est en rupture de stock.");
    return false;
  }

  const item = cartItems.find(x => Number(x.id) === Number(id));

  if (item && Number(item.qty) >= Number(product.stock)) {
    alert("La quantité demandée dépasse le stock disponible.");
    return false;
  }

  if (item) {
    item.qty++;
  } else {
    cartItems.push({ id: product.id, qty: 1 });
  }

  save();
  return true;
}

function update(){
  const validItems = cartItems.filter(x =>
    products.some(p => Number(p.id) === Number(x.id))
  );

  if (validItems.length !== cartItems.length) {
    cartItems = validItems;
    localStorage.setItem("sg_cart", JSON.stringify(cartItems));
  }

  document.querySelector("#count").textContent =
    cartItems.reduce((s,x) => s + x.qty, 0);

  document.querySelector("#items").innerHTML =
    cartItems.length
      ? cartItems.map(x => {
          const p = products.find(
            p => Number(p.id) === Number(x.id)
          );

          return `
            <div class="cartItem">
              <div class="em">
                ${
                  p.image1_url
                    ? `<img src="${p.image1_url}" alt="${escapeHtml(p.name)}">`
                    : p.emoji
                }
              </div>

              <div>
                <b>${escapeHtml(p.name)}</b><br>
                <small>${money(Boolean(p.promo_active) && Number(p.promo_price) > 0 && Number(p.promo_price) < Number(p.price) ? Number(p.promo_price) : Number(p.price))} × ${x.qty}</small>
              </div>

              <div class="qty">
                <button onclick="chg(${p.id},-1)">−</button>
                ${x.qty}
                <button onclick="chg(${p.id},1)">+</button>
              </div>
            </div>
          `;
        }).join("")
      : "<p style='color:#8190a2'>Panier vide.</p>";

  const total = cartItems.reduce((s,x) => {
    const p = products.find(
      p => Number(p.id) === Number(x.id)
    );

   return s + (p ? (Boolean(p.promo_active) && Number(p.promo_price) > 0 && Number(p.promo_price) < Number(p.price) ? Number(p.promo_price) : Number(p.price)) * x.qty : 0);
  }, 0);

  document.querySelector("#total").textContent = money(total);
}
function chg(id, n) {
  const item = cartItems.find(x => Number(x.id) === Number(id));
  if (!item) return;

  const product = products.find(p => Number(p.id) === Number(id));
  if (!product) return;

  if (n > 0 && Number(item.qty) >= Number(product.stock)) {
    alert("Stock maximum atteint pour ce produit.");
    return;
  }

  item.qty += n;

  if (item.qty <= 0) {
    cartItems = cartItems.filter(x => Number(x.id) !== Number(id));
  }

  save();
}
function cart(){document.querySelector("#drawer").classList.add("show");update()}
function closeCart(){document.querySelector("#drawer").classList.remove("show")}
function openCheckout() {
    if (!cartItems.length) {
        return alert("Panier vide.");
    }
for (const item of cartItems) {
    const product = products.find(
        p => Number(p.id) === Number(item.id)
    );

    if (!product || Number(product.stock) < Number(item.qty)) {
        alert(
            "Stock insuffisant pour un produit de ton panier. Actualise la boutique et corrige la quantité."
        );
        return;
    }
}
    document.querySelector("#checkoutSummary")?.remove();

    const summary = cartItems.map(x => {
        const p = products.find(
            product => Number(product.id) === Number(x.id)
        );

        if (!p) {
            return "";
        }

        const promoActive =
            Boolean(p.promo_active) &&
            Number(p.promo_price) > 0 &&
            Number(p.promo_price) < Number(p.price);

        const unitPrice = promoActive
            ? Number(p.promo_price)
            : Number(p.price);

        return `
            <div class="checkoutItem">
                <span>${escapeHtml(p.name)} × ${x.qty}</span>
                <b>${money(unitPrice * x.qty)}</b>
            </div>
        `;
    }).join("");

    const total = cartItems.reduce((sum, x) => {
        const p = products.find(
            product => Number(product.id) === Number(x.id)
        );

        if (!p) {
            return sum;
        }

        const promoActive =
            Boolean(p.promo_active) &&
            Number(p.promo_price) > 0 &&
            Number(p.promo_price) < Number(p.price);

        const unitPrice = promoActive
            ? Number(p.promo_price)
            : Number(p.price);

        return sum + unitPrice * Number(x.qty);
    }, 0);

    document.querySelector("#checkout .box")
        .classList.add("hasSummary");

    document.querySelector("#checkout .box")
        .insertAdjacentHTML(
            "afterbegin",
            `
                <div id="checkoutSummary">
                    <h3>Votre commande</h3>
                    ${summary}
                    <div class="checkoutTotal">
                        <span>Total</span>
                        <b>${money(total)}</b>
                    </div>
                </div>
            `
        );

    document.querySelector("#checkout").classList.add("show");
}

function closeCheckout(){document.querySelector("#checkout").classList.remove("show")}
async function order(){let customer={name:document.querySelector("#name").value,phone:document.querySelector("#phone").value,address:document.querySelector("#addr").value};if(!customer.name||!customer.phone||!customer.address)return alert("Remplis les informations.");let payment=document.querySelector("#pay").value;let r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer,payment,items:cartItems})});let d=await r.json();if(!r.ok)return alert(d.error||"Erreur");alert("Commande enregistrée : "+d.orderId);cartItems=[];save();closeCheckout();closeCart();load()}
document.querySelector("#q").oninput=render;load();
function escapeHtml(text=""){
  return String(text).replace(/[&<>"']/g, c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[c]));
}

function openProduct(id){
  const p=products.find(x=>x.id===id);
  if(!p)return;

  const images=[p.image1_url,p.image2_url,p.image3_url].filter(Boolean);
  const inStock=Number(p.stock)>0;

  window.productImages=images;

  document.querySelector("#productDetail").innerHTML=`
    <div class="productDetail">

      <div class="productGallery">

        <div class="productMainImage">
          ${
            images.length
            ? `<img id="productMainImage"
                 src="${escapeHtml(images[0])}"
                 alt="${escapeHtml(p.name)}">`
            : `<div class="productEmoji">${escapeHtml(p.emoji || "🎮")}</div>`
          }
        </div>

        ${
          images.length>1
          ? `
            <div class="productThumbnails">
              ${images.map((url,i)=>`
                <button class="productThumb" onclick="selectProductImage(${i})">
                  <img src="${escapeHtml(url)}"
                       alt="${escapeHtml(p.name)}">
                </button>
              `).join("")}
            </div>
          `
          : ""
        }

      </div>

      <div class="productInfo">

        <div class="cat">${escapeHtml(p.category || "Gaming")}</div>

        <h2>${escapeHtml(p.name)}</h2>

        
${
  Boolean(p.promo_active) &&
  Number(p.promo_price) > 0 &&
  Number(p.promo_price) < Number(p.price)
    ? `<div class="price price--promo">
        <span class="priceOld">${money(p.price)}</span>
        <strong class="priceCurrent">${money(p.promo_price)}</strong>
        <span class="discountBadge">-${Math.round((1-Number(p.promo_price)/Number(p.price))*100)}%</span>
      </div>`
    : `<div class="price">${money(p.price)}</div>`
}


        ${
          inStock
          ? `<div class="stock">${p.stock} disponible(s)</div>`
          : `<div class="stock outOfStock">Rupture de stock</div>`
        }

        <p class="productDescription">
          ${escapeHtml(p.description || "Aucune description disponible.").replace(/\n/g,"<br>")}
        </p>

        ${
          p.video_url
          ? `
            <div class="productVideo">
              <h3>Vidéo du produit</h3>
              <video controls preload="metadata" src="${escapeHtml(p.video_url)}"></video>
            </div>
          `
          : ""
        }

        ${
          inStock
          ? `
            <button class="primary full" onclick="add(${p.id});closeProduct()">
              Ajouter au panier
            </button>
          `
          : `
            <button class="primary full disabled" disabled>
              Rupture de stock
            </button>
          `
        }

      </div>

    </div>
  `;

  document.querySelector("#productModal").classList.add("show");
}

function selectProductImage(index){
  const images=window.productImages||[];
  const image=document.querySelector("#productMainImage");

  if(image && images[index]){
    image.src=images[index];
  }
}

function closeProduct(){
  document.querySelector("#productModal").classList.remove("show");
}
/* =================================
/* =================================
   HERO — CARROUSEL PROMOTIONNEL
================================= */

document.addEventListener("DOMContentLoaded", function () {

  const carousel = document.getElementById("promoCarousel");
  const dots = document.querySelectorAll("#promoDots button");

  if (!carousel || !dots.length) return;

  let autoplayTimer = null;

  function updatePromoDot() {

    const slideWidth = carousel.clientWidth;

    if (!slideWidth) return;

    const index = Math.round(
      carousel.scrollLeft / slideWidth
    );

    dots.forEach(function (dot, i) {

      dot.classList.toggle(
        "active",
        i === index
      );

    });

  }

  function goToSlide(index) {

    const slideWidth = carousel.clientWidth;

    if (!slideWidth) return;

    carousel.scrollTo({
      left: index * slideWidth,
      behavior: "smooth"
    });

  }

  function startAutoplay() {

    clearInterval(autoplayTimer);

    autoplayTimer = setInterval(function () {

      const slideWidth = carousel.clientWidth;

      if (!slideWidth) return;

      const currentIndex = Math.round(
        carousel.scrollLeft / slideWidth
      );

      const nextIndex =
        (currentIndex + 1) % dots.length;

      goToSlide(nextIndex);

    }, 4000);

  }

  carousel.addEventListener(
    "scroll",
    updatePromoDot,
    { passive: true }
  );

  dots.forEach(function (dot, index) {

    dot.addEventListener("click", function () {

      goToSlide(index);

      startAutoplay();

    });

  });

  updatePromoDot();

  startAutoplay();

});
// =========================================
// CHARGER LES MÉDIAS PROMOTIONNELS DEPUIS L'ADMIN
// =========================================


async function loadHomepagePromoMedia() {
    try {
        const response = await fetch("/api/promo-media");

        if (!response.ok) {
            throw new Error("Impossible de récupérer les médias promotionnels");
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.promos)) return;

        const slides = document.querySelectorAll("#promoCarousel .promoSlide");
        if (!slides.length) return;

        let campaignTitle = "";
      let activePromoCount = 0;

        data.promos.forEach(promo => {
            const index = Number(promo.slot) - 1;
            const slide = slides[index];

            if (!slide) return;

            // Masquer la campagne si elle est inactive
            if (promo.campaign_id && promo.campaign_active !== true) {
                slide.style.display = "none";
                return;
            }

            slide.style.display = "";
          activePromoCount++;

            // Afficher le média promotionnel
            slide.innerHTML = "";

            if (promo.media_type === "image") {
                const img = document.createElement("img");
                img.src = promo.url;
                img.alt = promo.campaign_name || "Promotion SNGAMER";
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "cover";
                slide.appendChild(img);
            } else if (promo.media_type === "video") {
                const video = document.createElement("video");
                video.src = promo.url;
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                video.preload = "metadata";
                video.style.width = "100%";
                video.style.height = "100%";
                video.style.objectFit = "cover";
                slide.appendChild(video);
            }

            
if (promo.campaign_name) {
    campaignTitle = promo.campaign_name;
    window.promoCampaignSticker = promo.campaign_sticker || "✧";
    window.promoCampaignRightSticker = promo.campaign_right_sticker || "✦";
}

            

            // Informations du produit associé
            if (promo.product_id && promo.product_name) {
                const info = document.createElement("div");
                info.className = "promoProductInfo";
                info.style.cssText =
  "position:absolute;bottom:10px;left:10px;right:10px;" +
  "background:rgba(5,10,20,.88);color:white;" +
  "padding:12px;border-radius:14px;box-sizing:border-box;" +
  "max-height:48%;overflow:hidden;text-align:center;";

                const name = document.createElement("div");
                name.textContent =
                    (promo.product_emoji || "🛍️") + " " + promo.product_name;
                name.style.fontWeight = "bold";
                info.appendChild(name);

                const price = document.createElement("div");
                const regular = Number(promo.product_price || 0);
                const special = Number(promo.product_promo_price || 0);
                
              const hasPromo =
    (promo.product_promo_active === true ||
     promo.product_promo_active === "true" ||
     promo.product_promo_active === 1) &&
    special > 0 &&
    regular > special;
              if (hasPromo) {

                const discount = Math.round((1 - special / regular) * 100);

price.innerHTML =
    '<div style="display:flex;justify-content:center;align-items:center;' +
    'gap:8px;flex-wrap:wrap;margin-top:5px">' +
    '<span style="text-decoration:line-through;color:#ccc;font-size:13px">' +
    regular.toLocaleString("fr-FR") + ' FCFA</span>' +
    '<strong style="color:#ff4d6d;font-size:19px">' +
    special.toLocaleString("fr-FR") + ' FCFA</strong>' +
    '</div>' +
    '<div style="display:inline-block;margin-top:6px;background:#ff4d6d;' +
    'color:white;font-size:20px;font-weight:900;padding:5px 12px;' +
    'border-radius:8px">-' + discount + '%</div>';
              
              } else {
                    price.textContent = regular.toLocaleString("fr-FR") + " FCFA";
                }

                const purchaseRow = document.createElement("div");
purchaseRow.style.cssText =
  "display:flex;align-items:center;justify-content:space-between;" +
  "gap:10px;flex-wrap:nowrap;margin-top:8px;width:100%;";

price.style.cssText =
  "flex:1;min-width:0;text-align:left;font-size:14px;";

purchaseRow.appendChild(price);

                const buy = document.createElement("button");
                buy.type = "button";
                buy.textContent = "ACHETER";
                
buy.style.cssText =
  "display:inline-flex;align-items:center;justify-content:center;" +
  "margin:0;padding:11px 16px;border:1px solid #a855f7;" +
  "border-radius:10px;background:linear-gradient(135deg,#2563eb,#9333ea);" +
  "color:#fff;font-size:13px;font-weight:800;letter-spacing:.5px;" +
  "cursor:pointer;white-space:nowrap;box-shadow:0 4px 14px rgba(147,51,234,.3);";


                buy.addEventListener("click", event => {
                    event.stopPropagation();
                    if (typeof buyNow === "function") {
                        buyNow(Number(promo.product_id));
                    }
                });

                purchaseRow.appendChild(buy);
info.appendChild(purchaseRow);
                slide.style.position = "relative";
                slide.appendChild(info);
            }
        });

        // Titre de campagne affiché au-dessus du carrousel
        let title = document.getElementById("promoCampaignTitle");

        if (!title) {
            title = document.createElement("div");
            title.id = "promoCampaignTitle";
            

title.style.cssText =
  "display:flex;align-items:center;gap:14px;width:100%;" +
  "text-align:left;font-size:clamp(16px,4.5vw,23px);" +
  "font-weight:900;letter-spacing:1.5px;text-transform:uppercase;" +
  "margin:0 auto 20px;padding:16px 18px;box-sizing:border-box;" +
  "color:#ffffff;background:#080d18;" +
  "border:1px solid rgba(96,165,250,.3);border-radius:18px;" +
  "box-shadow:0 8px 28px rgba(0,0,0,.22);";


            const carousel = document.getElementById("promoCarousel");
            if (carousel && carousel.parentNode) {
                carousel.parentNode.insertBefore(title, carousel);
            }
        }

        
title.replaceChildren();

const leftIcon = document.createElement("div");
leftIcon.textContent = window.promoCampaignSticker || "✧";
leftIcon.style.cssText =
  "flex:0 0 54px;height:54px;display:flex;align-items:center;" +
  "justify-content:center;background:#142847;color:#60a5fa;" +
  "border-radius:14px;font-size:36px;";

const textBlock = document.createElement("div");
textBlock.style.cssText =
  "flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;";

const eyebrow = document.createElement("div");
eyebrow.textContent = "OFFRE EXCLUSIVE";
eyebrow.style.cssText =
  "font-size:12px;font-weight:800;letter-spacing:1.5px;" +
  "color:#8ba9d9;";

const campaignName = document.createElement("div");
campaignName.textContent = campaignTitle;
campaignName.style.cssText =
  "font-size:clamp(16px,4.5vw,24px);font-weight:900;" +
  "letter-spacing:.5px;color:#fff;overflow-wrap:anywhere;";

textBlock.append(eyebrow, campaignName);

const rightIcon = document.createElement("div");
rightIcon.textContent = window.promoCampaignRightSticker || "ϟ";
rightIcon.style.cssText =
  "flex:0 0 54px;height:54px;display:flex;align-items:center;" +
  "justify-content:center;background:#2b1742;color:#c084fc;" +
  "border-radius:14px;font-size:36px;";

title.append(leftIcon, textBlock, rightIcon);
title.style.display = campaignTitle ? "flex" : "none";


    } catch (error) {
        console.error("PROMO_MEDIA_HOME_ERROR", error);
    }
}


document.addEventListener("DOMContentLoaded", function () {
    loadHomepagePromoMedia();
});
/* SNGAMER — RUBRIQUES ET NAVIGATION */

function productText(p) {
  return [p.name, p.category, p.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isCoinProduct(p) {
  return /(coins?|e-?football|fc mobile|fc points|mobile legends|diamants?|diamonds?|gems?|myclub|top[- ]?up|recharge de jeu)/i.test(productText(p));
}

function isPhoneProduct(p) {
  return !isCoinProduct(p) &&
    /(gaming phone|téléphone|telephone|smartphone|phone|iphone|samsung galaxy|redmi note|poco|rog phone|nubia|redmagic|red magic|infinix gt|tecno pova|black shark)/i.test(productText(p));
}

function isAccessoryProduct(p) {
  return !isCoinProduct(p) &&
    !isPhoneProduct(p) &&
    /(accessoire|accessory|accessories|clavier|keyboard|manette|controller|gamepad|casque|headset|écouteur|ecouteur|souris|mouse|refroidisseur|cooler|ventilateur|chargeur|charger|câble|cable|support|stand|coque|étui|etui|microphone|adaptateur|hub usb|gâchette|gachette|trigger|tapis|mousepad|power bank|batterie|joystick|webcam|dock|carte mémoire|carte memoire)/i.test(productText(p));
}

function matchesStoreSection(p) {
  if (activeStoreSection === "home") {
    return true;
  }

  if (activeStoreSection === "accessories") {
    return storeCategory(p) === "Accessoires";
  }

  if (activeStoreSection === "phones") {
    return storeCategory(p) === "Gaming Phone";
  }

  if (activeStoreSection === "coins") {
    if (storeCategory(p) !== "Coins" || !selectedCoinPlatform) {
      return false;
    }

    const platform = (p.platform || "").toLowerCase();

    // Utiliser la plateforme enregistrée dans l'administration
    if (platform) {
      return selectedCoinPlatform === "iphone"
        ? platform === "iphone"
        : platform === "android";
    }

    // Compatibilité avec les anciens produits sans plateforme enregistrée
    const text = productText(p);

    if (selectedCoinPlatform === "iphone") {
      return /(iphone|ios|apple|app store)/i.test(text);
    }

    return /(android|google play|samsung|xiaomi|redmi|poco|pixel)/i.test(text);
  }

  return false;
}


    function navigateStore(section) {
  activeStoreSection = section;

  const nav = document.getElementById("mobileBottomNav");
  const title = document.getElementById("sectionTitle");
  const catsArea = document.getElementById("cats");
  const subcategories = document.getElementById("navSubcategories");
  const profileArea = document.getElementById("profileArea");
  const productsArea = document.getElementById("products");

  nav.querySelectorAll(".bottomNavItem").forEach(function(button) {
    const selected = button.dataset.nav === section;
    button.classList.toggle("active", selected);

    if (selected) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  updateNavigationRing();

  const home = section === "home";

  document.querySelector(".hero").style.display = home ? "" : "none";
  document.querySelector(".banner").style.display = home ? "" : "none";
  document.querySelector("footer").style.display = home ? "" : "none";

  const titles = {
    home: "Nos produits",
    accessories: "Accessoires",
    phones: "Gaming Phone",
    coins: "Pièces eFootball",
    profile: "Mon profil"
  };

  title.textContent = titles[section] || "Nos produits";

  catsArea.style.display = home ? "" : "none";
  subcategories.style.display = "none";
  subcategories.hidden = true;
  profileArea.hidden = section !== "profile";

  selectedCoinPlatform = null;
  filter = "Tous";
  cats();

  if (section === "coins") {
    subcategories.hidden = false;
    subcategories.style.display = "grid";

    subcategories.innerHTML = `
  <div class="coinCategoryIntro">
    <span class="coinCategoryEyebrow">SNGAMER STORE · PIÈCES eFOOTBALL</span>
    <h3>Choisis ta plateforme</h3>
    <p>Sélectionne ton système pour découvrir les recharges disponibles.</p>
  </div>

  <button class="coinCategoryCard"
    type="button"
    data-platform="iphone"
    aria-pressed="false"
    onclick="filterCoinProducts('iphone')">

    <span class="coinCategoryIcon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="2" width="12" height="20" rx="2.5"/>
        <path d="M10 5h4"/>
        <path d="M10 18.5h4"/>
      </svg>
    </span>

    <span class="coinCategoryText">
      <strong>eFootball Pièces iPhone</strong>
      <small>iOS · Apple App Store</small>
    </span>

    <span class="coinCategoryArrow" aria-hidden="true">↗</span>
  </button>

  <button class="coinCategoryCard"
    type="button"
    data-platform="android"
    aria-pressed="false"
    onclick="filterCoinProducts('android')">

    <span class="coinCategoryIcon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="m7 6-2-3M17 6l2-3"/>
        <path d="M5 11a7 7 0 0 1 14 0"/>
        <path d="M4 11h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>
        <path d="M8 19v2M16 19v2"/>
        <circle cx="9" cy="8" r=".7" fill="currentColor"/>
        <circle cx="15" cy="8" r=".7" fill="currentColor"/>
      </svg>
    </span>

    <span class="coinCategoryText">
      <strong>eFootball Pièces Android</strong>
      <small>Google Play · Android</small>
    </span>

    <span class="coinCategoryArrow" aria-hidden="true">↗</span>
  </button>
`;
  }

  if (section === "profile") {
    productsArea.style.display = "none";

    profileArea.innerHTML = `
      <div style="padding:26px 20px;background:linear-gradient(145deg,#111e30,#080d16);border:1px solid #2a4262;border-radius:20px;text-align:center">
        <div style="font-size:42px;color:#55c9ff">♙</div>
        <p style="color:#55b8ff;font-weight:800;letter-spacing:2px">SNGAMER STORE</p>
        <h3>Espace client</h3>
        <p style="color:#aab8ca;line-height:1.6">
          Ton futur espace personnel réunira tes informations,
          tes commandes et leur suivi.
        </p>
        <p style="color:#8794aa;font-size:12px">
          La connexion sécurisée sera activée dans l’étape suivante.
        </p>
      </div>
    `;

  } else {
    profileArea.innerHTML = "";
    productsArea.style.display =
      section === "coins" ? "none" : "";

    render();
  }

  if (home) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    document.getElementById("shop").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function filterCoinProducts(platform) {
  selectedCoinPlatform = platform;

  const productsArea = document.getElementById("products");
  const title = document.getElementById("sectionTitle");

  title.textContent =
  platform === "iphone"
    ? "eFootball Pièces iPhone"
    : "eFootball Pièces Android";

  productsArea.style.display = "";

  // Afficher les produits de la plateforme choisie
  render();

  // Remplacer les deux cartes par un bouton compact
  showCoinPlatformSwitch();

  document.getElementById("shop").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function showCoinPlatformSwitch() {
  const area = document.getElementById("navSubcategories");
  const name =
    selectedCoinPlatform === "iphone"
      ? "eFootball Pièces iPhone"
      : "eFootball Pièces Android";

  area.classList.remove("coinPickerOpen");
  area.hidden = false;
  area.style.display = "block";

  area.innerHTML = `
    <button type="button"
      class="coinPlatformCurrent"
      onclick="openCoinPlatformPicker()">
      <span class="coinPlatformCurrentIcon">⇄</span>
      <span class="coinPlatformCurrentText">
        <strong>${name}</strong>
        <small>Plateforme sélectionnée</small>
      </span>
      <span class="coinPlatformChange">
        Changer ↗
      </span>
    </button>
  `;
}

function openCoinPlatformPicker() {
  const area = document.getElementById("navSubcategories");

  area.hidden = false;
  area.style.display = "block";
  area.classList.add("coinPickerOpen");

  area.innerHTML = `
    <div class="coinPickerBackdrop"
      onclick="closeCoinPlatformPicker()"></div>

    <section class="coinPickerDialog" role="dialog"
      aria-modal="true" aria-label="Choisir une plateforme">

      <button type="button" class="coinPickerClose"
        onclick="closeCoinPlatformPicker()"
        aria-label="Fermer">×</button>

      <span class="coinCategoryEyebrow">
        SNGAMER STORE · COINS
      </span>

      <h3>Changer de plateforme</h3>
      <p>Choisis la plateforme pour afficher ses produits.</p>

      <button type="button" class="coinCategoryCard"
        onclick="filterCoinProducts('iphone')">
        <span class="coinCategoryIcon">iOS</span>
        <span class="coinCategoryText">
          <strong>Coins iPhone</strong>
          <small>iOS · Apple App Store</small>
        </span>
        <span class="coinCategoryArrow">↗</span>
      </button>

      <button type="button" class="coinCategoryCard"
        onclick="filterCoinProducts('android')">
        <span class="coinCategoryIcon">AND</span>
        <span class="coinCategoryText">
          <strong>Coins Android</strong>
          <small>Google Play · Android</small>
        </span>
        <span class="coinCategoryArrow">↗</span>
      </button>
    </section>
  `;
}

function closeCoinPlatformPicker() {
  showCoinPlatformSwitch();
}

function updateNavigationRing() {
  const nav = document.getElementById("mobileBottomNav");
  if (!nav) return;

  const activeButton = nav.querySelector(".bottomNavItem.active");
  if (!activeButton) return;

  const center =
    activeButton.offsetLeft + activeButton.offsetWidth / 2;

  nav.style.setProperty("--ring-x", center + "px");
  nav.classList.add("has-active-ring");
}

document.addEventListener("DOMContentLoaded", function() {
  navigateStore("home");
});

window.addEventListener("resize", updateNavigationRing);
