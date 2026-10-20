/* SNGAMER STORE — category display only
   Keeps the existing filtering logic and product data untouched.
   The previous version used a MutationObserver that re-appended the same
   buttons on every mutation, which created a mutation loop and could lock
   the storefront after a refresh. */
(function () {
  "use strict";

  const order = [
    "Tous",
    "Coins / Pièces eFootball",
    "Souris",
    "Accessoires",
    "Gaming Phone"
  ];

  function patchCategories() {
    const area = document.getElementById("cats");
    if (!area) return;

    const buttons = Array.from(area.querySelectorAll(".catbtn"));
    if (!buttons.length) return;

    buttons.forEach(button => {
      if (button.textContent.trim() === "Coins") {
        button.textContent = "Coins / Pièces eFootball";
      }
    });

    const rank = text => {
      const index = order.indexOf(text);
      return index === -1 ? 999 : index;
    };

    const desired = [...buttons].sort((a, b) => {
      const ra = rank(a.textContent.trim());
      const rb = rank(b.textContent.trim());
      return ra - rb;
    });

    const current = Array.from(area.querySelectorAll(".catbtn"));
    const needsReorder = desired.some((button, index) => button !== current[index]);

    if (!needsReorder) return;

    const fragment = document.createDocumentFragment();
    desired.forEach(button => fragment.appendChild(button));
    area.appendChild(fragment);
  }

  function install() {
    if (window.__sngamerCategoryDisplayInstalled) return;

    if (typeof window.cats !== "function") {
      window.setTimeout(install, 50);
      return;
    }

    const originalCats = window.cats;
    window.cats = function () {
      const result = originalCats.apply(this, arguments);
      patchCategories();
      return result;
    };

    window.__sngamerCategoryDisplayInstalled = true;
    patchCategories();
  }

  install();
})();
