/* SNGAMER STORE — PayTech checkout controller
 * Dedicated submit entry point. The checkout button calls this directly
 * so legacy order() handlers cannot intercept or replace PayTech payments.
 */
(() => {
  "use strict";

  function readPayment() {
    const selectedCard = document.querySelector("#checkout .paymentMethodCard.is-selected[data-payment]");
    const cardValue = selectedCard?.dataset?.payment || "";
    if (cardValue === "Wave" || cardValue === "Orange Money") return cardValue;
    const selectValue = document.getElementById("pay")?.value || "";
    return selectValue === "Wave" || selectValue === "Orange Money" ? selectValue : "";
  }

  function showCheckoutMessage(text) {
    const error = document.getElementById("checkoutDeliveryError");
    if (error) {
      error.textContent = text;
      error.classList.add("show");
      error.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.alert(text);
    }
  }

  async function paytechCheckoutSubmit() {
    const button = document.querySelector("#checkout .checkoutActionBar .primary.full, #checkout .primary.full");
    const name = (document.getElementById("name")?.value || "").trim();
    const phone = (document.getElementById("phone")?.value || "").trim();
    const zone = document.querySelector('input[name="deliveryZone"]:checked')?.value || "Dakar";
    const region = (document.getElementById("deliveryRegionValue")?.value || "").trim();
    const address = (
      document.getElementById("deliveryAddress")?.value ||
      document.getElementById("addr")?.value ||
      ""
    ).trim();
    const notes = (document.getElementById("deliveryNotes")?.value || "").trim();
    const payment = readPayment();
    const basket = typeof cartItems !== "undefined" && Array.isArray(cartItems) ? cartItems : [];

    if (!name) {
      showCheckoutMessage("Indique ton nom complet.");
      document.getElementById("name")?.focus();
      return;
    }
    if (!phone) {
      showCheckoutMessage("Indique ton numéro de téléphone.");
      document.getElementById("phone")?.focus();
      return;
    }
    if (!address) {
      showCheckoutMessage("Indique ton adresse de livraison.");
      document.getElementById("deliveryAddress")?.focus();
      return;
    }
    if (zone === "Régions" && !region) {
      showCheckoutMessage("Sélectionne la région de livraison.");
      return;
    }
    if (!payment) {
      showCheckoutMessage("Choisis Wave ou Orange Money.");
      return;
    }
    if (!basket.length) {
      showCheckoutMessage("Ton panier est vide. Ajoute un produit avant de continuer.");
      return;
    }

    if (button) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = "Connexion à PayTech…";
    }
    const err = document.getElementById("checkoutDeliveryError");
    if (err) {
      err.textContent = "";
      err.classList.remove("show");
    }

    try {
      const response = await fetch("/api/paytech/create", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name,
            phone,
            address,
            delivery: { zone, region, address, notes }
          },
          payment,
          items: basket.map((item) => ({
            id: Number(item.id),
            qty: Number(item.qty ?? item.quantity)
          }))
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true || !data.redirect_url) {
        throw new Error(
          data.error ||
          data.message ||
          `Le serveur PayTech a répondu avec le statut ${response.status}.`
        );
      }

      window.location.assign(data.redirect_url);
    } catch (error) {
      console.error("SNGAMER_PAYTECH_SUBMIT_ERROR", error);
      showCheckoutMessage(error.message || "Erreur lors de la connexion à PayTech.");
      if (button) {
        button.disabled = false;
        button.textContent = button.dataset.originalText || "Confirmer la commande";
      }
    }
  }

  // Explicit checkout action used by the HTML button.
  window.paytechCheckoutSubmit = paytechCheckoutSubmit;
  // Fallback for any remaining callers, no longer chained to the legacy handler.
  window.order = paytechCheckoutSubmit;
})();
