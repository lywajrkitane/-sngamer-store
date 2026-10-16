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

    /* Paiements — cartes lisibles dans le checkout */
    #checkout .paymentHeading {
      display: block;
      margin: 15px 0 8px;
      color: #fff;
      font-size: 13px;
      font-weight: 900;
    }
    #checkout #pay {
      margin-top: 0;
      border-radius: 13px;
      min-height: 46px;
    }
    #checkout .paymentHint {
      margin: 7px 2px 0;
      color: #8191a7;
      font-size: 11px;
      line-height: 1.5;
    }
    #checkout .paymentHint strong { color:#b9c7da; }
    #checkout .box.hasSummary .hint { margin-top: 12px; }
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

    const hint = document.createElement("p");
    hint.className = "paymentHint";
    hint.innerHTML = "Choisis <strong>Wave</strong> ou <strong>Orange Money</strong> pour le moment. <strong>PayPal</strong> sera activé prochainement.";

    select.parentNode.insertBefore(heading, select);
    select.parentNode.insertBefore(hint, select.nextSibling);
  }

  document.addEventListener("DOMContentLoaded", polishPaymentUI);
  setTimeout(polishPaymentUI, 250);
})();
