/* SNGAMER STORE — category display only
   Keeps the existing filtering logic and product data untouched.
*/
(function () {
  // Restore the premium search interaction on every fresh page load.
  // The existing search component remains untouched; this only loads its
  // dedicated interaction layer, which is intentionally separate from the
  // category normalization below.
  function loadPremiumSearch() {
    if (document.querySelector('script[data-sngamer-search-polish="1"]')) return;
    const script = document.createElement("script");
    script.src = "search-polish.js?v=20261020-0945";
    script.dataset.sngamerSearchPolish = "1";
    script.defer = true;
    document.head.appendChild(script);
  }

  loadPremiumSearch();

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

    buttons.forEach(button => {
      if (button.textContent.trim() === "Coins") {
        button.textContent = "Coins / Pièces eFootball";
      }
    });

    const rank = text => {
      const index = order.indexOf(text);
      return index === -1 ? 999 : index;
    };

    buttons
      .sort((a, b) => {
        const ra = rank(a.textContent.trim());
        const rb = rank(b.textContent.trim());
        return ra - rb;
      })
      .forEach(button => area.appendChild(button));
  }

  patchCategories();

  const area = document.getElementById("cats");
  if (area) {
    new MutationObserver(patchCategories).observe(area, { childList: true });
  }
})();
