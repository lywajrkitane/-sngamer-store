/* SNGAMER STORE — category display only
   Keeps the existing filtering logic and product data untouched.
*/
(function () {
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
