let products=[],cartItems=JSON.parse(localStorage.getItem("sg_cart")||"[]"),filter="Tous";
const money=n=>new Intl.NumberFormat("fr-FR").format(n)+" FCFA";
async function load(){products=await fetch("/api/products").then(r=>r.json());cats();render();update()}
function cats(){let cs=["Tous",...new Set(products.map(p=>p.category))];document.querySelector("#cats").innerHTML=cs.map(c=>`<button class="catbtn ${c===filter?"on":""}" onclick="filterBy('${c}')">${c}</button>`).join("")}
function filterBy(c){filter=c;cats();render()}
function render(){
let q=document.querySelector("#q").value.toLowerCase();
let list=products.filter(p=>(filter==="Tous"||p.category===filter)&&p.name.toLowerCase().includes(q));

document.querySelector("#products").innerHTML=list.map(p=>{
const promoActive=Boolean(p.promo_active)&&Number(p.promo_price)>0&&Number(p.promo_price)<Number(p.price);
const discount=promoActive?Math.round((1-Number(p.promo_price)/Number(p.price))*100):0;

const priceHtml=promoActive
?`<div class="price" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
<span style="text-decoration:line-through;color:#8190a2;font-size:.9em">${money(p.price)}</span>
<strong style="color:#ff4d6d">${money(p.promo_price)}</strong>
<span style="background:#ff4d6d;color:white;padding:2px 7px;border-radius:6px;font-size:.75em;font-weight:700">-${discount}%</span>
</div>`
:`<div class="price">${money(p.price)}</div>`;

return `<article class="card">
<div class="pic">${p.image1_url ? '<img src="' + p.image1_url + '" alt="' + p.name + '" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" loading="lazy">' : p.emoji}</div>
<div class="info">
<div class="cat">${p.category}</div>
<h3>${p.name}</h3>
${priceHtml}
<div class="stock">${p.stock} disponible(s)</div>

<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
  <button
    class="add"
    style="width:100%;box-sizing:border-box;padding:12px 10px;border:1px solid #478bff;background:linear-gradient(100deg,#1677ff,#713cff);color:#fff;border-radius:12px;font-weight:800;box-shadow:0 0 12px rgba(55,115,255,.28);transition:transform .15s,box-shadow .15s;"
    onclick="buyNow(${p.id})"
    onpointerdown="this.style.boxShadow='0 0 24px rgba(75,125,255,.9)';this.style.transform='scale(.98)'"
    onpointerup="this.style.boxShadow='0 0 12px rgba(55,115,255,.28)';this.style.transform='scale(1)'"
    onpointerleave="this.style.boxShadow='0 0 12px rgba(55,115,255,.28)';this.style.transform='scale(1)'">
    ACHETER
  </button>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    <button
      class="add"
      style="width:100%;box-sizing:border-box;padding:10px 4px;font-size:13px;border-radius:10px;"
      onclick="add(${p.id})">
      🛒 Panier
    </button>

    <button
      class="details"
      style="width:100%;box-sizing:border-box;padding:10px 4px;font-size:13px;border-radius:10px;"
      onclick="openProduct(${p.id})">
      👁 Voir
    </button>
  </div>
</div>


</div>
</article>`;
}).join("");
}
function save(){localStorage.setItem("sg_cart",JSON.stringify(cartItems));update()}
function add(id){
  let x=cartItems.find(a=>a.id===id);
  x ? x.qty++ : cartItems.push({id,qty:1});
  save();
}
function buyNow(id){add(id);cart()}
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
function chg(id,n){let x=cartItems.find(a=>a.id===id);x.qty+=n;if(x.qty<=0)cartItems=cartItems.filter(a=>a.id!==id);save()}
function cart(){document.querySelector("#drawer").classList.add("show");update()}
function closeCart(){document.querySelector("#drawer").classList.remove("show")}
function openCheckout() {
    if (!cartItems.length) {
        return alert("Panier vide.");
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
    ? `<div class="price" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="text-decoration:line-through;color:#8190a2;font-size:.9em">${money(p.price)}</span>
        <strong style="color:#ff4d6d">${money(p.promo_price)}</strong>
        <span style="background:#ff4d6d;color:white;padding:3px 8px;border-radius:6px;font-size:.8em;font-weight:700">-${Math.round((1-Number(p.promo_price)/Number(p.price))*100)}%</span>
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
            }

            // Informations du produit associé
            if (promo.product_id && promo.product_name) {
                const info = document.createElement("div");
                info.className = "promoProductInfo";
                info.style.cssText =
  "position:absolute;bottom:10px;left:10px;right:10px;" +
  "background:rgba(5,10,20,.88);color:white;" +
  "padding:12px;border-radius:14px;box-sizing:border-box;" +
  "max-height:48%;overflow:auto;text-align:center;";

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
                "text-align:center;font-size:20px;font-weight:bold;" +
                "margin:0 0 12px;color:#ff4d6d;";
            const carousel = document.getElementById("promoCarousel");
            if (carousel && carousel.parentNode) {
                carousel.parentNode.insertBefore(title, carousel);
            }
        }

        title.textContent = campaignTitle;
        title.style.display = campaignTitle ? "block" : "none";

    } catch (error) {
        console.error("PROMO_MEDIA_HOME_ERROR", error);
    }
}


document.addEventListener("DOMContentLoaded", function () {
    loadHomepagePromoMedia();
});
