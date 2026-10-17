/* SNGAMER STORE — PayTech checkout bridge */
(() => {
  function getSelectedPayment() {
    const selectedCard = document.querySelector("#checkout .paymentMethodCard.is-selected[data-payment]");
    const cardValue = selectedCard?.dataset?.payment || "";
    if (cardValue === "Wave" || cardValue === "Orange Money") return cardValue;

    const selectValue = document.querySelector("#pay")?.value || "";
    if (selectValue === "Wave" || selectValue === "Orange Money") return selectValue;

    return "";
  }

  function showError(message) {
    const error = document.getElementById("checkoutDeliveryError");
    if (error) {
      error.textContent = message;
      error.classList.add("show");
      error.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      alert(message);
    }
  }

  window.order = async function () {
    const payment = getSelectedPayment();
    const name = document.querySelector("#name")?.value.trim() || "";
    const phone = document.querySelector("#phone")?.value.trim() || "";
    const zone = document.querySelector('input[name="deliveryZone"]:checked')?.value || "";
    const region = document.querySelector("#deliveryRegionValue")?.value || "";
    const address = document.querySelector("#deliveryAddress")?.value.trim() || document.querySelector("#addr")?.value.trim() || "";
    const notes = document.querySelector("#deliveryNotes")?.value.trim() || "";

    if (!name) {
      showError("Indique ton nom complet pour continuer.");
      document.querySelector("#name")?.focus();
      return;
    }
    if (!phone) {
      showError("Indique ton numéro de téléphone pour continuer.");
      document.querySelector("#phone")?.focus();
      return;
    }
    if (!zone) {
      showError("Choisis une zone de livraison.");
      return;
    }
    if (zone === "Régions" && !region) {
      showError("Choisis la région de livraison.");
      return;
    }
    if (!address) {
      showError("Indique l'adresse ou le point de repère pour la livraison.");
      document.querySelector("#deliveryAddress")?.focus();
      return;
    }
    if (!payment) {
      showError("Sélectionne Wave ou Orange Money pour continuer vers PayTech.");
      return;
    }

    const items = typeof cartItems !== "undefined" && Array.isArray(cartItems) ? cartItems : [];
    if (!items.length) {
      showError("Le panier est vide.");
      return;
    }

    const button = document.querySelector('#checkout .primary.full');
    const error = document.getElementById("checkoutDeliveryError");
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
          customer: { name, phone, address, delivery: { zone, region, address, notes } },
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
      showError(e.message || "Impossible d'ouvrir le paiement. Réessaie.");
      if (button) {
        button.disabled = false;
        button.textContent = "Confirmer la commande";
      }
    }
  };
})();
