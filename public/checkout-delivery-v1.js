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

  function injectPremiumRegionStyles() {
    if (document.getElementById("premiumDeliveryStyles")) return;
    const style = document.createElement("style");
    style.id = "premiumDeliveryStyles";
    style.textContent = `
      #deliveryRegionWrap{display:none}
      #deliveryRegionWrap.show{display:block}
      .deliveryRegionTrigger{
        width:100%; min-height:58px; display:flex; align-items:center; justify-content:space-between;
        gap:14px; padding:14px 16px; border:1px solid rgba(130,154,190,.28); border-radius:16px;
        background:rgba(10,18,31,.72); color:#f7f9ff; cursor:pointer; text-align:left;
        transition:.2s ease; box-sizing:border-box;
      }
      .deliveryRegionTrigger:active{transform:scale(.99)}
      .deliveryRegionTrigger .regionTriggerText{display:flex; flex-direction:column; gap:4px; min-width:0}
      .deliveryRegionTrigger .regionTriggerLabel{font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#78b9ff}
      .deliveryRegionTrigger .regionTriggerValue{font-size:16px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
      .deliveryRegionTrigger .regionChevron{width:34px;height:34px;flex:0 0 34px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#287cff,#a72cf0);font-size:18px}
      #deliveryRegionModal{position:fixed;inset:0;z-index:99999;display:none;align-items:flex-end;justify-content:center;background:rgba(2,6,15,.72);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);padding:12px;box-sizing:border-box}
      #deliveryRegionModal.show{display:flex}
      .deliveryRegionSheet{width:min(560px,100%);max-height:min(78vh,720px);overflow:hidden;border:1px solid rgba(111,164,255,.28);border-radius:24px;background:linear-gradient(145deg,#101a2d,#090e1b);box-shadow:0 24px 80px rgba(0,0,0,.55);display:flex;flex-direction:column}
      .deliveryRegionHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
      .deliveryRegionHeaderText{min-width:0}
      .deliveryRegionEyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#68adff;margin-bottom:4px}
      .deliveryRegionTitle{font-size:22px;font-weight:800;color:#fff;margin:0}
      .deliveryRegionClose{width:42px;height:42px;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-size:26px;line-height:1;cursor:pointer;display:grid;place-items:center}
      .deliveryRegionClose:active{transform:scale(.95)}
      .deliveryRegionList{overflow:auto;padding:10px 12px 14px;overscroll-behavior:contain}
      .deliveryRegionItem{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 14px;margin:3px 0;border:1px solid transparent;border-radius:15px;background:transparent;color:#eef3ff;text-align:left;font-size:16px;font-weight:650;cursor:pointer}
      .deliveryRegionItem:hover,.deliveryRegionItem:focus-visible{background:rgba(55,124,255,.10);border-color:rgba(92,157,255,.22);outline:none}
      .deliveryRegionItem.selected{background:linear-gradient(90deg,rgba(46,122,255,.16),rgba(178,35,236,.10));border-color:rgba(91,150,255,.35)}
      .deliveryRegionCheck{width:24px;height:24px;border-radius:50%;border:2px solid #6e7d94;display:grid;place-items:center;flex:0 0 24px;box-sizing:border-box}
      .deliveryRegionItem.selected .deliveryRegionCheck{border-color:#4b8cff;background:linear-gradient(135deg,#287cff,#a72cf0);box-shadow:0 0 14px rgba(55,120,255,.35)}
      .deliveryRegionItem.selected .deliveryRegionCheck::after{content:"✓";font-size:14px;font-weight:900;color:#fff}
      @media (min-width:700px){#deliveryRegionModal{align-items:center}.deliveryRegionSheet{max-height:72vh}}
    `;
    document.head.appendChild(style);
  }

  function openRegionModal() {
    const modal = document.getElementById("deliveryRegionModal");
    if (!modal) return;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeRegionModal() {
    const modal = document.getElementById("deliveryRegionModal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function selectRegion(region) {
    const input = document.getElementById("deliveryRegionValue");
    const triggerValue = document.getElementById("deliveryRegionTriggerValue");
    if (input) input.value = region;
    if (triggerValue) triggerValue.textContent = region;
    deliveryState.region = region;
    document.querySelectorAll(".deliveryRegionItem").forEach(item => {
      const selected = item.dataset.region === region;
      item.classList.toggle("selected", selected);
      item.setAttribute("aria-selected", selected ? "true" : "false");
    });
    closeRegionModal();
  }

  function installDeliveryBlock() {
    injectPremiumRegionStyles();
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
          <label class="deliveryFieldLabel" for="deliveryRegionTrigger">Région <span class="requiredMark">*</span></label>
          <input id="deliveryRegionValue" type="hidden" value="">
          <button type="button" class="deliveryRegionTrigger" id="deliveryRegionTrigger" aria-haspopup="dialog" aria-controls="deliveryRegionModal">
            <span class="regionTriggerText">
              <span class="regionTriggerLabel">Zone de livraison</span>
              <span class="regionTriggerValue" id="deliveryRegionTriggerValue">Choisir la région</span>
            </span>
            <span class="regionChevron" aria-hidden="true">⌄</span>
          </button>
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

    const modal = document.createElement("div");
    modal.id = "deliveryRegionModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="deliveryRegionSheet" role="dialog" aria-modal="true" aria-labelledby="deliveryRegionTitle">
        <div class="deliveryRegionHeader">
          <div class="deliveryRegionHeaderText">
            <div class="deliveryRegionEyebrow">Livraison SNGAMER</div>
            <h2 class="deliveryRegionTitle" id="deliveryRegionTitle">Choisir la région</h2>
          </div>
          <button type="button" class="deliveryRegionClose" id="deliveryRegionClose" aria-label="Fermer">×</button>
        </div>
        <div class="deliveryRegionList" role="listbox" aria-label="Régions du Sénégal">
          ${regions.map(region => `
            <button type="button" class="deliveryRegionItem" data-region="${escapeHtml(region)}" role="option" aria-selected="false">
              <span>${escapeHtml(region)}</span>
              <span class="deliveryRegionCheck" aria-hidden="true"></span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    bindDeliveryEvents();
    return true;
  }

  function bindDeliveryEvents() {
    document.querySelectorAll('input[name="deliveryZone"]').forEach(input => {
      if (input.dataset.deliveryBound === "1") return;
      input.dataset.deliveryBound = "1";
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
        if (input.value !== "Régions") closeRegionModal();
      });
    });

    document.getElementById("deliveryRegionTrigger")?.addEventListener("click", openRegionModal);
    document.getElementById("deliveryRegionClose")?.addEventListener("click", closeRegionModal);
    document.getElementById("deliveryRegionModal")?.addEventListener("click", event => {
      if (event.target.id === "deliveryRegionModal") closeRegionModal();
    });
    document.querySelectorAll(".deliveryRegionItem").forEach(item => {
      item.addEventListener("click", () => selectRegion(item.dataset.region || ""));
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeRegionModal();
    }, { once: true });
  }

  function readDelivery() {
    const zone = document.querySelector('input[name="deliveryZone"]:checked')?.value || "";
    const region = document.getElementById("deliveryRegionValue")?.value || "";
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
