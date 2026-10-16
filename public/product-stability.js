/* SNGAMER STORE — product rendering stability guard
   Prevents the mobile category navigation from leaving #products empty
   after repeated section changes. It only takes over when the main grid
   has unexpectedly lost its product cards. */
(function(){
  "use strict";

  let stableProducts = null;
  let repairTimer = null;

  const money = n => new Intl.NumberFormat("fr-FR").format(Number(n) || 0) + " FCFA";
  const esc = text => String(text ?? "").replace(/[&<>\"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#039;"
  }[c]));

  function textOf(p){
    return [p.name,p.category,p.description].filter(Boolean).join(" ").toLowerCase();
  }

  function categoryOf(p){
    const raw = String(p.category || "").trim().toLowerCase();
    const text = textOf(p);
    if(raw === "coins" || /(coins?|e-?football|fc points|myclub|top[- ]?up|recharge de jeu)/i.test(text)) return "Coins";
    if(raw === "gaming phone" || /(gaming phone|téléphone|telephone|smartphone|phone|iphone|samsung galaxy|redmi note|poco|rog phone|nubia|redmagic|red magic|infinix gt|tecno pova|black shark)/i.test(text)) return "Gaming Phone";
    if(raw === "accessoires" || /(accessoire|accessory|accessories|clavier|keyboard|manette|controller|gamepad|casque|headset|écouteur|ecouteur|souris|mouse|refroidisseur|cooler|ventilateur|chargeur|charger|câble|cable|support|stand|coque|étui|etui|microphone|adaptateur|hub usb|gâchette|gachette|trigger|tapis|mousepad|power bank|batterie|joystick|webcam|dock|carte mémoire|carte memoire)/i.test(text)) return "Accessoires";
    return p.category || "Accessoires";
  }

  function isPromo(p){
    return Boolean(p.promo_active) && Number(p.promo_price) > 0 && Number(p.promo_price) < Number(p.price);
  }

  function card(p){
    const promo = isPromo(p);
    const discount = promo ? Math.round((1 - Number(p.promo_price)/Number(p.price))*100) : 0;
    const price = promo
      ? `<div class="price price--promo"><div class="pricePromoTop"><span class="priceOld">${money(p.price)}</span><span class="discountBadge">-${discount}%</span></div><strong class="priceCurrent">${new Intl.NumberFormat("fr-FR").format(Number(p.promo_price))} <small>FCFA</small></strong></div>`
      : `<div class="price price--regular"><strong class="priceCurrent">${money(p.price).replace(" FCFA","")} <small>FCFA</small></strong></div>`;
    const stock = Number(p.stock) > 0;
    const cat = categoryOf(p);
    return `<article class="card productCardClickable" onclick="openProduct(${Number(p.id)})" role="button" tabindex="0">
      <div class="pic">${p.image1_url ? `<img class="productCardImage" src="${esc(p.image1_url)}" alt="${esc(p.name || "")}" loading="lazy">` : `<div class="productCardEmoji">${esc(p.emoji || "🎮")}</div>`}</div>
      <div class="info">
        <div class="cat">${esc(cat)}</div>
        <h3>${esc(p.name || "")}</h3>
        ${price}
        <div class="stock ${stock ? "" : "outOfStock"}">${stock ? `${Number(p.stock)} disponible(s)` : "Rupture de stock"}</div>
        ${stock ? `<div class="productCardBottom"><button type="button" class="addToCartIcon" aria-label="Ajouter au panier" onclick="event.stopPropagation();add(${Number(p.id)});">＋</button></div>` : ""}
      </div>
    </article>`;
  }

  async function getProducts(){
    if(Array.isArray(stableProducts) && stableProducts.length) return stableProducts;
    const response = await fetch("/api/products", {cache:"no-store"});
    if(!response.ok) throw new Error("products_http_" + response.status);
    const data = await response.json();
    if(!Array.isArray(data)) throw new Error("products_not_array");
    stableProducts = data;
    return stableProducts;
  }

  function currentSection(){
    return document.querySelector(".bottomNavItem.active")?.dataset.nav || "home";
  }

  function selectedHomeCategory(){
    const button = document.querySelector("#cats .catbtn.on");
    return button ? button.textContent.trim() : "Tous";
  }

  function shouldShow(p, section, selectedCategory){
    const cat = categoryOf(p);
    if(section === "accessories") return cat === "Accessoires";
    if(section === "phones") return cat === "Gaming Phone";
    if(section === "coins") return false;
    if(section === "home" && selectedCategory !== "Tous") return cat === selectedCategory;
    return section === "home";
  }

  async function repair(){
    const grid = document.getElementById("products");
    if(!grid) return;
    const section = currentSection();
    if(section === "profile" || section === "coins") return;
    if(grid.querySelector(".productCardClickable, .productCard")) return;

    try{
      const data = await getProducts();
      const category = selectedHomeCategory();
      const visible = data.filter(p => shouldShow(p, section, category));
      if(!visible.length) return;
      grid.innerHTML = visible.map(card).join("");
    }catch(error){
      console.error("SNGAMER_PRODUCT_STABILITY_ERROR", error);
    }
  }

  function scheduleRepair(delay){
    clearTimeout(repairTimer);
    repairTimer = setTimeout(repair, delay || 180);
  }

  function start(){
    const grid = document.getElementById("products");
    const nav = document.getElementById("mobileBottomNav");
    const cats = document.getElementById("cats");

    nav?.addEventListener("click", () => scheduleRepair(220), true);
    cats?.addEventListener("click", () => scheduleRepair(220), true);

    if(grid){
      const observer = new MutationObserver(() => {
        if(currentSection() !== "profile" && currentSection() !== "coins" && !grid.querySelector(".productCardClickable, .productCard")){
          scheduleRepair(250);
        }
      });
      observer.observe(grid, {childList:true});
    }

    window.addEventListener("pageshow", () => scheduleRepair(100));
    document.addEventListener("visibilitychange", () => {
      if(!document.hidden) scheduleRepair(100);
    });
    scheduleRepair(300);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();
})();
