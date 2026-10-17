/* SNGAMER STORE — PayTech checkout bridge */
(() => {
  const previousOrder = window.order;

  function getSelectedPayment() {
    const selectedCard = document.querySelector("#checkout .paymentMethodCard.is-selected[data-payment]");
    const cardValue = selectedCard?.dataset?.payment || "";
    if (cardValue === "Wave" || cardValue === "Orange Money") return cardValue;

    const selectValue = document.querySelector("#pay")?.value || "";
    if (selectValue === "Wave" || selectValue === "Orange Money") return selectValue;

    return "";
  }

  window.order = async function () {
    const payment = getSelectedPayment();

    if (!payment) {
      const error = document.getElementById("checkoutDeliveryError");
      const message = "Sélectionne Wave ou Orange Money pour continuer vers PayTech.";
      if (error) {
        error.textContent = message;
        error.classList.add("show");
      } else {
        alert(message);
      }
      return;
    }

    const name = document.querySelector("#name")?.value.trim() || "";
    const phone = document.querySelector("#phone")?.value.trim() || "";
    const delivery = {
      zone: document.querySelector('input[name="deliveryZone"]:checked')?.value || "",
      region: document.querySelector("#deliveryRegionValue")?.value || "",
      address: document.querySelector("#deliveryAddress")?.value.trim() || document.querySelector("#addr")?.value.trim() || "",
      notes: document.querySelector("#deliveryNotes")?.value.trim() || ""
    };
    const error = document.getElementById("checkoutDeliveryError");

    if (!name || !phone || !delivery.zone || !delivery.address || (delivery.zone === "Régions" && !delivery.region)) {
      return typeof previousOrder === "function" ? previousOrder.apply(this, arguments) : undefined;
    }

    const items = typeof cartItems !== "undefined" && Array.isArray(cartItems) ? cartItems : [];
    if (!items.length) {
      alert("Le panier est vide.");
      return;
    }

    const button = document.querySelector('#checkout .primary.full');
    if (button) {
      button.disabled = true;
      button.textContent = "Connexion à PayTech…";
    }
    if (error) { error.textContent = ""; error.classList.remove("show"); }

    try {
      const response = await fetch("/api/paytech/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, phone, address: delivery.address, delivery },
          payment,
          items
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.redirect_url) {
        throw new Error(data.error || data.message || "Impossible d'ouvrir le paiement PayTech.");
      }

      window.location.href = data.redirect_url;
    } catch (e) {
      console.error("SNGAMER PAYTECH CHECKOUT ERROR:", e);
      if (error) {
        error.textContent = e.message || "Impossible d'ouvrir le paiement. Réessaie.";
        error.classList.add("show");
      } else {
        alert(e.message || "Impossible d'ouvrir le paiement. Réessaie.");
      }
      if (button) {
        button.disabled = false;
        button.textContent = "Confirmer la commande";
      }
    }
  };
})();
