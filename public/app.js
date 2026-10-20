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

function categoryLabel(c) {
  const key = String(c || "").trim().toLowerCase();
  const aliases = {
    "tous": "Tous",
    "coins": "Coins",
    "souris": "Souris",
    "accessoires": "Accessoires",
    "gaming phone": "Gaming Phone",
    "gamingphone": "Gaming Phone",
    "hom": "Homme",
    "homm": "Homme",
    "homme": "Homme",
    "hommes": "Homme"
  };
  return aliases[key] || String(c || "Accessoires").trim();
}

function cats() {
  const rawCategories = [
    "Tous",
    ...new Set(products.map(p => storeCategory(p)))
  ];
  const categories = rawCategories.map(categoryLabel);

  const catsEl = document.querySelector("#cats");
  if (!catsEl) return;

  catsEl.innerHTML = categories.map(c =>
    `<button type="button" class="catbtn ${c === categoryLabel(filter) ? "on" : ""}" onclick="filterBy(${JSON.stringify(c)})">${escapeHtml(c)}</button>`
  ).join("");
}
function filterBy(c){filter=c;cats();render()}
function render(){
  const productGrid = document.getElementById("products");
  if (!productGrid) return;
  if (activeStoreSection === "profile" || activeStoreSection === "coins") {
    productGrid.replaceChildren();
    return;
  }
  const q = (document.querySelector("#q")?.value || "").toLowerCase();

  const list = products.filter(p =>
    matchesStoreSection(p) &&
    (
      activeStoreSection !== "home" ||
      filter === "Tous" ||
      storeCategory(p) === filter ||
      categoryLabel(storeCategory(p)) === categoryLabel(filter)
    ) &&
    (p.name || "").toLowerCase().includes(q)
  );

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

    const categoryText = categoryLabel(category);
    const categoryLabelText =
      category === "Coins" && p.platform
        ? `${categoryText} ${p.platform}`
        : categoryText;

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
            ${escapeHtml(categoryLabelText || "")}
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
                    class="add"
                    onclick="event.stopPropagation(); add(${Number(p.id)})"
                  >
                    Ajouter
                  </button>
                </div>
              `
              : ""
          }
        </div>
      </article>
    `;
  }).join("");
}
