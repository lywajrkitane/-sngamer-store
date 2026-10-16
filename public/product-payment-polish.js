(() => {
  "use strict";

  const style = document.createElement("style");
  style.textContent = `
    /* Fiche produit — hiérarchie claire et professionnelle */
    .productDescriptionBlock {
      margin: 22px 0 18px;
      padding: 18px;
      border: 1px solid rgba(96,165,250,.18);
      border-radius: 16px;
      background: rgba(8,15,27,.72);
    }
    .productDescriptionTitle {
      display: flex;
      align-items: center;
      gap: 9px;
      margin: 0 0 10px;
      color: #fff;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: .2px;
    }
    .productDescriptionTitle::before {
      content: "";
      width: 4px;
      height: 18px;
      border-radius: 99px;
      background: linear-gradient(180deg,#38bdf8,#8b5cf6);
    }
    .productDescriptionText {
      margin: 0;
      color: #aebbd0;
      font-size: 13px;
      line-height: 1.75;
    }

    /* Paiements — sélecteur premium avec identité visuelle */
    #checkout .paymentHeading {
      display: block;
      margin: 15px 0 10px;
      color: #fff;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: .5px;
    }
    #checkout #pay.paymentNativeHidden {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0,0,0,0) !important;
      white-space: nowrap !important;
      border: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .paymentMethodsGrid {
      display: grid;
      gap: 9px;
      margin-top: 0;
    }
    .paymentMethodCard {
      width: 100%;
      min-height: 66px;
      display: grid;
      grid-template-columns: 46px 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border: 1px solid rgba(96,165,250,.18);
      border-radius: 15px;
      background: linear-gradient(145deg,rgba(16,27,44,.92),rgba(9,16,27,.92));
      color: #fff;
      text-align: left;
      cursor: pointer;
      transition: border-color .22s ease,box-shadow .22s ease,transform .22s ease,background .22s ease;
    }
    .paymentMethodCard:hover { transform:translateY(-1px); border-color:rgba(90,184,255,.45); }
    .paymentMethodCard.is-selected {
      border-color:rgba(90,184,255,.92);
      background:linear-gradient(145deg,rgba(22,135,255,.13),rgba(124,58,237,.10));
      box-shadow:0 0 0 1px rgba(90,184,255,.12),0 10px 26px rgba(0,0,0,.18);
    }
    .paymentMethodCard.is-disabled {
      opacity:.48;
      cursor:not-allowed;
      filter:saturate(.65);
    }
    .paymentBrand {
      width:46px;
      height:46px;
      display:grid;
      place-items:center;
      border-radius:12px;
      font-weight:900;
      letter-spacing:-.6px;
      color:#fff;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);
    }
    .paymentBrand.wave { background:linear-gradient(145deg,#1e9bff,#0876dc); font-size:19px; font-style:italic; }
    .paymentBrand.orange { background:linear-gradient(145deg,#ff7900,#f45100); font-size:14px; }
    .paymentBrand.paypal { background:linear-gradient(145deg,#1b73e8,#123b9b); font-size:12px; }
    .paymentMethodName { display:block; font-size:14px; font-weight:900; }
    .paymentMethodSub { display:block; margin-top:3px; color:#8798ae; font-size:10px; font-weight:600; }
    .paymentRadio {
      width:18px;
      height:18px;
      border:2px solid rgba(190,205,224,.65);
      border-radius:50%;
      position:relative;
    }
    .paymentMethodCard.is-selected .paymentRadio { border-color:#5ab8ff; }
    .paymentMethodCard.is-selected .paymentRadio::after {
      content:"";
      position:absolute;
      inset:3px;
      border-radius:50%;
      background:#5ab8ff;
      box-shadow:0 0 10px rgba(90,184,255,.55);
    }
    #checkout .paymentHint {
      margin: 9px 2px 0;
      color: #8191a7;
      font-size: 11px;
      line-height: 1.5;
    }
    #checkout .paymentHint strong { color:#b9c7da; }
    #checkout .box.hasSummary .hint { margin-top: 12px; }

    @media(max-width:560px){
      .paymentMethodCard{min-height:62px;grid-template-columns:42px 1fr auto;padding:9px 10px;gap:10px}
      .paymentBrand{width:42px;height:42px}
      .paymentMethodName{font-size:13px}
    }
  `;
  document.head.appendChild(style);

  function polishProductDescription() {
    const paragraph = document.querySelector("#productDetail .productDescription");
    if (!paragraph || paragraph.closest(".productDescriptionBlock")) return;

    const block = document.createElement("section");
    block.className = "productDescriptionBlock";

    const title = document.createElement("h3");
    title.className = "productDescriptionTitle";
    title.textContent = "Description";

    paragraph.classList.add("productDescriptionText");
    paragraph.parentNode.insertBefore(block, paragraph);
    block.append(title, paragraph);
  }

  const originalOpenProduct = window.openProduct;
  if (typeof originalOpenProduct === "function") {
    window.openProduct = function(id) {
      originalOpenProduct(id);
      requestAnimationFrame(polishProductDescription);
    };
  }

  function polishPaymentUI() {
    const select = document.getElementById("pay");
    if (!select || select.dataset.polished === "true") return;

    select.dataset.polished = "true";
    select.innerHTML = `
      <option value="Wave">Wave</option>
      <option value="Orange Money">Orange Money</option>
      <option value="PayPal" disabled>PayPal — Bientôt disponible</option>
    `;

    const heading = document.createElement("label");
    heading.className = "paymentHeading";
    heading.setAttribute("for", "pay");
    heading.textContent = "Moyen de paiement";

    const methods = document.createElement("div");
    methods.className = "paymentMethodsGrid";
    methods.setAttribute("role", "radiogroup");
    methods.setAttribute("aria-label", "Moyen de paiement");
    methods.innerHTML = `
      <button type="button" class="paymentMethodCard is-selected" data-payment="Wave" role="radio" aria-checked="true">
        <span class="paymentBrand wave" aria-hidden="true">W</span>
        <span><span class="paymentMethodName">Wave</span><span class="paymentMethodSub">Paiement mobile</span></span>
        <span class="paymentRadio" aria-hidden="true"></span>
      </button>
      <button type="button" class="paymentMethodCard" data-payment="Orange Money" role="radio" aria-checked="false">
        <span class="paymentBrand orange" aria-hidden="true">OM</span>
        <span><span class="paymentMethodName">Orange Money</span><span class="paymentMethodSub">Paiement mobile</span></span>
        <span class="paymentRadio" aria-hidden="true"></span>
      </button>
      <button type="button" class="paymentMethodCard is-disabled" data-payment="PayPal" role="radio" aria-checked="false" aria-disabled="true">
        <span class="paymentBrand paypal" aria-hidden="true">P</span>
        <span><span class="paymentMethodName">PayPal</span><span class="paymentMethodSub">Bientôt disponible</span></span>
        <span class="paymentRadio" aria-hidden="true"></span>
      </button>
    `;

    const hint = document.createElement("p");
    hint.className = "paymentHint";
    hint.innerHTML = "Sélectionne ton moyen de paiement. <strong>PayPal</strong> sera activé prochainement.";

    select.classList.add("paymentNativeHidden");
    select.parentNode.insertBefore(heading, select);
    select.parentNode.insertBefore(methods, select);
    select.parentNode.insertBefore(hint, select.nextSibling);

    methods.querySelectorAll(".paymentMethodCard:not(.is-disabled)").forEach(card => {
      card.addEventListener("click", () => {
        const value = card.dataset.payment;
        select.value = value;
        methods.querySelectorAll(".paymentMethodCard").forEach(item => {
          const selected = item === card;
          item.classList.toggle("is-selected", selected);
          item.setAttribute("aria-checked", selected ? "true" : "false");
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", polishPaymentUI);
  setTimeout(polishPaymentUI, 250);
})();
