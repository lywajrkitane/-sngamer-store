/* SNGAMER STORE — PayTech-only checkout controller (v2)
 * Replaces legacy checkout submission for Wave and Orange Money.
 */
(() => {
  "use strict";

  function selectedPayment() {
    const card = document.querySelector("#checkout .paymentMethodCard.is-selected[data-payment]");
    const value = card?.dataset?.payment || document.getElementById("pay")?.value || "";
    return value === "Wave" || value === "Orange Money" ? value : "";
  }

  function message(text) {
    const el = document.getElementById("checkoutDeliveryError");
    if (el) {
      el.textContent = text;
      el.classList.add("show");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      alert(text);
    }
  }

  window.order = async function paytechOnlyOrder() {
    const button = document.querySelector("#checkout .checkoutActionBar .primary.full, #checkout .primary.full");
    const name = (document.getElementById("name")?.value || "").trim();
    const phone = (document.getElementById("phone")?.value || "").trim();
    const zone = document.querySelector('input[name="deliveryZone"]:checked')?.value || "Dakar";
    const region = (document.getElementById("deliveryRegionValue")?.value || "").trim();
    const address = (document.getElementById("deliveryAddress")?.value || document.getElementById("addr")?.value || "").trim();
    const notes = (document.getElementById("deliveryNotes")?.value || "").trim();
    const payment = selectedPayment();
    const items = typeof cartItems !== "undefined" && Array.isArray(cartItems) ? cartItems : [];

    if (!name) return message("Indique ton nom complet.");
    if (!phone) return message("Indique ton numéro de téléphone.");
    if (!address) return message("Indique ton adresse de livraison.");
    if (zone === "Régions" && !region) return message("Sélectionne la région de livraison.");
    if (!payment) return message("Sélectionne Wave ou Orange Money.");
    if (!items.length) return message("Ton panier est vide.");

    if (button) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = "Connexion à PayTech…";
    }
    const error = document.getElementById("checkoutDeliveryError");
    if (error) { error.textContent = ""; error.classList.remove("show"); }

    try {
      const response = await fetch("/api/paytech/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, phone, address, delivery: { zone, region, address, notes } },
          payment,
          items: items.map(item => ({ id: Number(item.id), qty: Number(item.qty ?? item.quantity) }))
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true || !result.redirect_url) {
        throw new Error(result.error || result.message || "PayTech n'a pas pu créer la session de paiement.");
      }
      window.location.assign(result.redirect_url);
    } catch (err) {
      console.error("SNGAMER_PAYTECH_CHECKOUT_V2_ERROR", err);
      message(err.message || "Erreur lors de l'ouverture de PayTech.");
      if (button) {
        button.disabled = false;
        button.textContent = button.dataset.originalText || "Confirmer la commande";
      }
    }
  };
})();