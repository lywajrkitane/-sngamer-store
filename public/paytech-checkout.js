/* SNGAMER STORE — PayTech checkout controller
 * Dedicated submit entry point. The checkout button calls this directly
 * so legacy order() handlers cannot intercept or replace PayTech payments.
 */
(() => {
  "use strict";

  let checkoutInProgress = false;

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

  function restoreButton(button) {
    if (!button) return;
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.textContent = button.dataset.originalText || "Confirmer la commande";
  }

  function paymentAttemptKey() {
    const storageKey = "sngamer.paytech.attempt";
    try {
      const current = sessionStorage.getItem(storageKey);
      if (current && /^[A-Za-z0-9._:-]{16,120}$/.test(current)) return current;
      const value = (crypto.randomUUID ? crypto.randomUUID() : `sng-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem(storageKey, value);
      return value;
    } catch (_) {
      return `sng-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    }
  }

  function clearPaymentAttemptKey() {
    try { sessionStorage.removeItem("sngamer.paytech.attempt"); } catch (_) {}
  }

  async function paytechCheckoutSubmit() {
    // Prevent double taps/clicks from creating multiple payment sessions.
    if (checkoutInProgress) return;

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

    // "Acheter maintenant" supplies a temporary checkout basket containing only
    // the selected product. Normal checkout continues to use the full cart.
    const basket = Array.isArray(window.sngamerCheckoutItems)
      ? window.sngamerCheckoutItems
      : (typeof cartItems !== "undefined" && Array.isArray(cartItems) ? cartItems : []);

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

    checkoutInProgress = true;
    if (button) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = "Connexion à PayTech…";
      button.setAttribute("aria-busy", "true");
    }
    const err = document.getElementById("checkoutDeliveryError");
    if (err) {
      err.textContent = "";
      err.classList.remove("show");
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("/api/paytech/create", {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name,
            phone,
            address,
            delivery: { zone, region, address, notes }
          },
          payment,
          idempotency_key: paymentAttemptKey(),
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

      clearPaymentAttemptKey();
      window.location.assign(data.redirect_url);
    } catch (error) {
      console.error("SNGAMER_PAYTECH_SUBMIT_ERROR", error);
      const message = error?.name === "AbortError"
        ? "La connexion au service de paiement a pris trop de temps. Vérifie ta connexion puis réessaie."
        : (error.message || "Erreur lors de la connexion à PayTech.");
      showCheckoutMessage(message);
      checkoutInProgress = false;
      restoreButton(button);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  window.paytechCheckoutSubmit = paytechCheckoutSubmit;
  window.order = paytechCheckoutSubmit;
})();
