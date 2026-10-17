(() => {
  const regions = [
    "Diourbel","Fatick","Kaffrine","Kaolack","Kédougou","Kolda","Louga",
    "Matam","Saint-Louis","Sédhiou","Tambacounda","Thiès","Ziguinchor"
  ];

  let deliveryState = { zone: "Dakar", region: "", address: "", notes: "" };

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
    }[c]));
  }

  function installDeliveryBlock() {
    const box = document.querySelector("#checkout .box");
    if (!box || document.getElementById("checkoutDelivery")) return Boolean(box);

    const block = document.createElement("section");
    block.id = "checkoutDelivery";
    block.className = "checkoutDelivery";
    block.innerHTML = `
      <h3 class="checkoutDeliveryTitle">Livraison</h3>
      <p class="checkoutDeliveryHint">Choisis la zone où tu souhaites recevoir ta commande.</p>
      <div class="deliveryOptions" role="radiogroup" aria-label="Zone de livraison">
        <label class="deliveryOption active">
          <input type="radio" name="deliveryZone" value="Dakar" checked>
          <strong>Dakar</strong>
          <small>Livraison à Dakar</small>
        </label>
        <label class="deliveryOption">
          <input type="radio" name="deliveryZone" value="Banlieue">
          <strong>Banlieue</strong>
          <small>Frais à confirmer avec le livreur</small>
        </label>
        <label class="deliveryOption">
          <input type="radio" name="deliveryZone" value="Régions">
          <strong>Régions</strong>
          <small>Coordination avec le gérant</small>
        </label>
      </div>
      <div class="deliveryExtra">
        <div class="deliveryRegion" id="deliveryRegionWrap">
          <label class="deliveryFieldLabel" for="deliveryRegion">Région <span class="requiredMark">*</span></label>
          <select id="deliveryRegion">
            <option value="">Choisir la région</option>
            ${regions.map(region => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="deliveryFieldLabel" for="deliveryAddress">Adresse de livraison <span class="requiredMark">*</span></label>
          <input id="deliveryAddress" type="text" autocomplete="street-address" placeholder="Quartier, rue, point de repère…">
          <p class="deliveryAddressNote">Indique une adresse ou un point de repère précis pour faciliter la livraison.</p>
        </div>
        <div>
          <label class="deliveryFieldLabel" for="deliveryNotes">Notes <span style="font-weight:500;color:#71849b">(facultatif)</span></label>
          <textarea id="deliveryNotes" rows="2" placeholder="Précisions pour la livraison…"></textarea>
        </div>
      </div>
      <div class="checkoutDeliveryError" id="checkoutDeliveryError"></div>
    `;

    const heading = box.querySelector("h2");
    if (heading?.nextSibling) box.insertBefore(block, heading.nextSibling);
    else box.prepend(block);

    bindDeliveryEvents();
    return true;
  }

  function bindDeliveryEvents() {
    document.querySelectorAll('input[name="deliveryZone"]').forEach(input => {
      input.addEventListener("change", () => {
        deliveryState.zone = input.value;
        document.querySelectorAll(".deliveryOption").forEach(option => {
          option.classList.toggle("active", option.querySelector("input")?.checked === true);
        });
        document.getElementById("deliveryRegionWrap")?.classList.toggle("show", input.value === "Régions");
        const address = document.getElementById("deliveryAddress");
        if (address) address.placeholder = input.value === "Dakar"
          ? "Quartier, rue, point de repère…"
          : input.value === "Banlieue"
            ? "Commune, quartier, rue, point de repère…"
            : "Ville, quartier, rue, point de repère…";
      });
    });
  }

  function readDelivery() {
    const zone = document.querySelector('input[name="deliveryZone"]:checked')?.value || "";
    const region = document.getElementById("deliveryRegion")?.value || "";
    const address = document.getElementById("deliveryAddress")?.value.trim() || "";
    const notes = document.getElementById("deliveryNotes")?.value.trim() || "";
    const error = document.getElementById("checkoutDeliveryError");

    if (!zone) return { ok:false, message:"Choisis une zone de livraison." };
    if (zone === "Régions" && !region) return { ok:false, message:"Choisis la région de livraison." };
    if (!address) return { ok:false, message:"Indique l'adresse ou le point de repère pour la livraison." };

    deliveryState = { zone, region, address, notes };
    if (error) { error.textContent = ""; error.classList.remove("show"); }
    return { ok:true, value:deliveryState };
  }

  const originalOpenCheckout = window.openCheckout;
  window.openCheckout = function () {
    installDeliveryBlock();
    return typeof originalOpenCheckout === "function" ? originalOpenCheckout.apply(this, arguments) : undefined;
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    try {
      const url = typeof input === "string" ? input : input?.url;
      if (url === "/api/orders" && init?.body) {
        const parsed = JSON.parse(init.body);
        const delivery = readDelivery();
        if (delivery.ok) {
          parsed.customer = parsed.customer || {};
          parsed.customer.delivery = delivery.value;
          init = { ...init, body: JSON.stringify(parsed) };
        }
      }
    } catch (_) {}
    return originalFetch(input, init);
  };

  const originalOrder = window.order;
  window.order = async function () {
    installDeliveryBlock();
    const result = readDelivery();
    const error = document.getElementById("checkoutDeliveryError");
    if (!result.ok) {
      if (error) { error.textContent = result.message; error.classList.add("show"); }
      document.getElementById("checkoutDelivery")?.scrollIntoView({ behavior:"smooth", block:"center" });
      return;
    }

    const legacyAddress = document.getElementById("addr");
    if (legacyAddress) legacyAddress.value = result.value.address;

    if (typeof originalOrder === "function") return originalOrder.apply(this, arguments);
  };

  document.addEventListener("DOMContentLoaded", installDeliveryBlock);
  setTimeout(installDeliveryBlock, 0);
})();
