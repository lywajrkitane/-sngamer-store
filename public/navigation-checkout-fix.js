/* SNGAMER STORE — navigation centralisée dans app.js + checkout fiable */
(function () {
  "use strict";

  function prepareCheckoutLayout() {
    const checkout = document.getElementById("checkout");
    const box = checkout && checkout.querySelector(".box");
    if (!box) return;

    const closeButton = box.querySelector(":scope > .x");
    let scroll = box.querySelector(":scope > .checkoutScrollArea");
    let actionBar = box.querySelector(":scope > .checkoutActionBar");
    let confirmButton =
      box.querySelector(":scope > .primary.full") ||
      (actionBar && actionBar.querySelector(".primary.full"));

    if (!scroll || !actionBar) {
      if (!confirmButton) return;

      scroll = document.createElement("div");
      scroll.className = "checkoutScrollArea";

      actionBar = document.createElement("div");
      actionBar.className = "checkoutActionBar";

      Array.from(box.children).forEach(function (child) {
        if (child === closeButton || child === confirmButton) return;
        scroll.appendChild(child);
      });

      actionBar.appendChild(confirmButton);
      box.appendChild(scroll);
      box.appendChild(actionBar);
    }

    // Le résumé est créé dynamiquement à l'ouverture du checkout.
    // Le placer juste sous le titre, jamais à la fin derrière les champs.
    Array.from(box.children).forEach(function (child) {
      if (child === closeButton || child === scroll || child === actionBar) return;

      if (child.id === "checkoutSummary") {
        const heading = scroll.querySelector(":scope > h2");
        if (heading) {
          heading.insertAdjacentElement("afterend", child);
        } else {
          scroll.insertBefore(child, scroll.firstChild);
        }
      } else {
        scroll.appendChild(child);
      }
    });

    const summary = scroll.querySelector(":scope > #checkoutSummary");
    const heading = scroll.querySelector(":scope > h2");
    if (summary && heading && heading.nextElementSibling !== summary) {
      heading.insertAdjacentElement("afterend", summary);
    } else if (summary && !heading && scroll.firstElementChild !== summary) {
      scroll.insertBefore(summary, scroll.firstChild);
    }

    // Garantir que le bouton reste dans la barre fixe, après chaque ouverture.
    confirmButton =
      actionBar.querySelector(".primary.full") ||
      box.querySelector(":scope > .primary.full");
    if (confirmButton && confirmButton.parentElement !== actionBar) {
      actionBar.appendChild(confirmButton);
    }

    box.dataset.layoutFixed = "1";
  }

  function watchCheckout() {
    const checkout = document.getElementById("checkout");
    if (!checkout) return;

    prepareCheckoutLayout();

    const checkoutObserver = new MutationObserver(function () {
      if (checkout.classList.contains("show")) prepareCheckoutLayout();
    });
    checkoutObserver.observe(checkout, {
      attributes: true,
      attributeFilter: ["class"]
    });

    const box = checkout.querySelector(".box");
    if (box) {
      const boxObserver = new MutationObserver(function () {
        if (checkout.classList.contains("show")) prepareCheckoutLayout();
      });
      boxObserver.observe(box, { childList: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchCheckout, { once: true });
  } else {
    watchCheckout();
  }

  window.setTimeout(prepareCheckoutLayout, 250);
})();
