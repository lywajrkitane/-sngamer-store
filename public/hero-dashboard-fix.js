(function () {
  "use strict";
  if (window.__sngamerHeroDashboardFixV1) return;
  window.__sngamerHeroDashboardFixV1 = true;

  function mount() {
    const admin = document.getElementById("adminBox");
    const stats = admin && admin.querySelector(".stats");
    const hero = document.getElementById("sngHeroMediaAdmin");
    if (!admin || !stats || !hero) return false;

    let anchor = document.getElementById("sngHeroAdminAnchor");
    if (!anchor) {
      anchor = document.createElement("div");
      anchor.id = "sngHeroAdminAnchor";
      anchor.setAttribute("aria-label", "Gestion du Hero");
      anchor.style.cssText = "scroll-margin-top:18px";
      stats.insertAdjacentElement("afterend", anchor);
    }

    if (hero.parentElement !== anchor) anchor.appendChild(hero);

    const heading = hero.querySelector(".sngHeroMediaAdminHead");
    if (heading && !heading.querySelector("[data-hero-admin-note]") ) {
      const note = document.createElement("div");
      note.setAttribute("data-hero-admin-note", "1");
      note.textContent = "Les images sont placées derrière le texte du Hero : le texte reste toujours lisible au-dessus de l’image.";
      note.style.cssText = "margin-top:10px;padding:9px 12px;border-radius:12px;background:rgba(214,42,168,.08);border:1px solid rgba(214,42,168,.2);color:#d9c8ff;font-size:12px;line-height:1.45";
      const left = heading.firstElementChild;
      if (left) left.appendChild(note);
    }

    return true;
  }

  function boot() {
    let attempts = 0;
    const timer = window.setInterval(function () {
      if (mount() || ++attempts > 120) window.clearInterval(timer);
    }, 250);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
