(function () {
  "use strict";
  if (window.__sngamerHomeHeroV1) return;
  window.__sngamerHomeHeroV1 = true;

  const DEFAULTS = [
    { slot: 1, title: "BONJOUR ET BIENVENUE SUR SNGAMER STORE", body: "Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui." },
    { slot: 2, title: "COMMANDE EN LIGNE", body: "Choisis tes produits, ajoute-les au panier et passe ta commande facilement." },
    { slot: 3, title: "LIVRAISON AU SÉNÉGAL", body: "Nous préparons ta commande avec soin et facilitons sa livraison." }
  ];
  const INTERVAL = 6500;

  function addStyles() {
    if (document.getElementById("sngHomeHeroStyles")) return;
    const style = document.createElement("style");
    style.id = "sngHomeHeroStyles";
    style.textContent = [
      ".sngHomeHeroWrap{width:min(100%,420px);margin:18px 0 25px;display:flex;flex-direction:column;align-items:stretch;position:relative;z-index:2;box-sizing:border-box}",
      ".sngHomeHeroCard{position:relative;width:100%;height:clamp(350px,31vw,420px);min-height:350px;overflow:hidden;border-radius:24px;border:1px solid rgba(94,164,255,.42);background:radial-gradient(circle at 18% 12%,rgba(34,128,255,.32),transparent 38%),radial-gradient(circle at 88% 84%,rgba(214,42,168,.24),transparent 38%),linear-gradient(145deg,#0d1c31,#070b15 74%);box-shadow:0 22px 48px rgba(0,0,0,.34),0 0 28px rgba(34,128,255,.12),inset 0 1px 0 rgba(255,255,255,.08);outline:none;touch-action:pan-y}",
      ".sngHomeHeroCard:focus-visible{outline:2px solid #76bdff;outline-offset:4px}",
      ".sngHomeHeroSlide{position:absolute;inset:0;opacity:0;visibility:hidden;transform:translateX(12px) scale(.99);transition:opacity .58s ease,transform .7s cubic-bezier(.22,1,.36,1),visibility .58s;overflow:hidden;background:linear-gradient(145deg,#112748,#080c16)}",
      ".sngHomeHeroSlide.is-active{opacity:1;visibility:visible;transform:translateX(0) scale(1);z-index:1}",
      ".sngHomeHeroImage{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;object-position:center;user-select:none;-webkit-user-drag:none}",
      ".sngHomeHeroShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,9,19,.04) 0%,rgba(4,9,19,.18) 32%,rgba(4,9,19,.74) 69%,rgba(4,9,19,.96) 100%),linear-gradient(90deg,rgba(3,8,17,.22),transparent 75%)}",
      ".sngHomeHeroCopy{position:absolute;left:0;right:0;bottom:0;z-index:2;display:flex;flex-direction:column;align-items:flex-start;gap:11px;padding:25px 23px 31px;box-sizing:border-box;text-align:left}",
      ".sngHomeHeroEyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid rgba(128,190,255,.38);border-radius:999px;background:rgba(5,14,29,.72);color:#9bcfff;font:900 10px/1 Inter,Arial,sans-serif;letter-spacing:1.8px;text-transform:uppercase;box-shadow:0 8px 20px rgba(0,0,0,.2)}",
      ".sngHomeHeroEyebrow:before{content:'';display:block;width:6px;height:6px;flex:0 0 6px;border-radius:50%;background:#5bb8ff;box-shadow:0 0 12px rgba(91,184,255,.9)}",
      ".sngHomeHeroTitle{max-width:100%;margin:0;color:#fff;font:900 clamp(21px,2.3vw,28px)/1.12 Montserrat,Inter,Arial,sans-serif;letter-spacing:-.45px;text-wrap:pretty;text-shadow:0 4px 24px rgba(0,0,0,.55)}",
      ".sngHomeHeroBody{max-width:100%;margin:0;color:#e3ebf8;font:650 14px/1.52 Inter,Arial,sans-serif;letter-spacing:0;text-shadow:0 2px 14px rgba(0,0,0,.65)}",
      ".sngHomeHeroSlide.is-active .sngHomeHeroEyebrow{animation:sngHomeHeroTextReveal .72s cubic-bezier(.22,1,.36,1) both;animation-delay:.02s}",
      ".sngHomeHeroSlide.is-active .sngHomeHeroTitle{animation:sngHomeHeroTextReveal .78s cubic-bezier(.22,1,.36,1) both;animation-delay:.13s}",
      ".sngHomeHeroSlide.is-active .sngHomeHeroBody{animation:sngHomeHeroTextReveal .8s cubic-bezier(.22,1,.36,1) both;animation-delay:.28s}",
      ".sngHomeHeroDots{display:flex;align-items:center;justify-content:center;gap:8px;min-height:12px;margin:13px 0 0}",
      ".sngHomeHeroDots button{width:7px;height:7px;flex:0 0 7px;padding:0;border:0;border-radius:999px;background:#47546d;box-shadow:none;cursor:pointer;transition:width .25s ease,background .25s ease,box-shadow .25s ease}",
      ".sngHomeHeroDots button.is-active{width:27px;flex-basis:27px;background:linear-gradient(90deg,#4da3ff,#d92aa8);box-shadow:0 0 14px rgba(104,118,255,.25)}",
      "@keyframes sngHomeHeroTextReveal{0%{opacity:0;transform:translateY(13px);filter:blur(3px)}100%{opacity:1;transform:translateY(0);filter:blur(0)}}",
      "@media(max-width:700px){.sngHomeHeroWrap{width:min(100%,420px);margin:17px 0 23px}.sngHomeHeroCard{height:clamp(350px,98vw,410px);min-height:350px;border-radius:21px}.sngHomeHeroCopy{gap:10px;padding:22px 18px 28px}.sngHomeHeroEyebrow{font-size:9px;letter-spacing:1.45px}.sngHomeHeroTitle{font-size:clamp(20px,5.7vw,24px);line-height:1.13}.sngHomeHeroBody{font-size:13px;line-height:1.48}.sngHomeHeroDots{margin-top:10px}}",
      "@media(prefers-reduced-motion:reduce){.sngHomeHeroSlide,.sngHomeHeroDots button{transition:none!important}.sngHomeHeroSlide.is-active .sngHomeHeroEyebrow,.sngHomeHeroSlide.is-active .sngHomeHeroTitle,.sngHomeHeroSlide.is-active .sngHomeHeroBody{animation:none!important}}"
    ].join("");
    document.head.appendChild(style);
  }

  async function fetchData(url) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return null;
      return await response.json();
    } catch (_) {
      return null;
    }
  }

  async function loadSlides() {
    const results = await Promise.all([
      fetchData("/api/hero-media"),
      fetchData("/api/hero-content")
    ]);
    const mediaRows = Array.isArray(results[0] && results[0].hero) ? results[0].hero : [];
    const textRows = Array.isArray(results[1] && results[1].slides) ? results[1].slides : [];
    const mediaBySlot = new Map(mediaRows.map(function (row) { return [Number(row.slot), row.url || ""]; }));
    const textBySlot = new Map(textRows.map(function (row) { return [Number(row.slot), row]; }));
    return DEFAULTS.map(function (fallback) {
      const savedText = textBySlot.get(fallback.slot);
      const savedUrl = mediaBySlot.get(fallback.slot) || "";
      return {
        slot: fallback.slot,
        title: savedText && savedText.title ? String(savedText.title) : fallback.title,
        body: savedText && savedText.body ? String(savedText.body) : fallback.body,
        url: savedUrl
      };
    });
  }

  function makeSlide(slide, index) {
    const panel = document.createElement("article");
    panel.className = "sngHomeHeroSlide" + (index === 0 ? " is-active" : "");
    panel.setAttribute("aria-hidden", index === 0 ? "false" : "true");
    panel.setAttribute("aria-label", "Slide " + (index + 1));
    if (slide.url && (slide.url.startsWith("https://") || slide.url.startsWith("http://"))) {
      const image = document.createElement("img");
      image.className = "sngHomeHeroImage";
      image.src = slide.url;
      image.alt = "";
      image.decoding = "async";
      image.draggable = false;
      panel.appendChild(image);
    }
    const shade = document.createElement("div");
    shade.className = "sngHomeHeroShade";
    shade.setAttribute("aria-hidden", "true");
    const copy = document.createElement("div");
    copy.className = "sngHomeHeroCopy";
    const eyebrow = document.createElement("span");
    eyebrow.className = "sngHomeHeroEyebrow";
    eyebrow.textContent = slide.slot === 1 ? "BIENVENUE CHEZ SNGAMER" : slide.slot === 2 ? "COMMANDE EN LIGNE" : "LIVRAISON AU SÉNÉGAL";
    const title = document.createElement("h2");
    title.className = "sngHomeHeroTitle";
    title.textContent = slide.title;
    const body = document.createElement("p");
    body.className = "sngHomeHeroBody";
    body.textContent = slide.body;
    copy.append(eyebrow, title, body);
    panel.append(shade, copy);
    return panel;
  }

  function mount(placeholder) {
    if (!placeholder || placeholder.dataset.sngHomeHeroReplaced === "1") return;
    placeholder.dataset.sngHomeHeroReplaced = "1";
    addStyles();

    const wrap = document.createElement("div");
    wrap.className = "sngHomeHeroWrap";
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "Héros de présentation SNGAMER STORE");

    const card = document.createElement("div");
    card.className = "sngHomeHeroCard";
    card.tabIndex = 0;
    card.setAttribute("role", "group");
    card.setAttribute("aria-roledescription", "carrousel");
    card.setAttribute("aria-label", "Présentation de la boutique");

    const dots = document.createElement("div");
    dots.className = "sngHomeHeroDots";
    dots.setAttribute("aria-label", "Choisir une diapositive");

    wrap.append(card, dots);
    placeholder.replaceWith(wrap);

    loadSlides().then(function (slides) {
      card.replaceChildren();
      dots.replaceChildren();
      const panels = slides.map(makeSlide);
      const dotButtons = slides.map(function (slide, index) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = index === 0 ? "is-active" : "";
        button.setAttribute("aria-label", "Afficher le slide " + (index + 1) + " : " + slide.title);
        button.title = slide.title;
        button.addEventListener("click", function () { show(index, true); });
        return button;
      });
      panels.forEach(function (panel) { card.appendChild(panel); });
      dotButtons.forEach(function (button) { dots.appendChild(button); });

      let activeIndex = 0;
      let timer = null;
      function show(nextIndex, resetTimer) {
        activeIndex = (nextIndex + panels.length) % panels.length;
        panels.forEach(function (panel, index) {
          panel.classList.toggle("is-active", index === activeIndex);
          panel.setAttribute("aria-hidden", index === activeIndex ? "false" : "true");
        });
        dotButtons.forEach(function (button, index) {
          button.classList.toggle("is-active", index === activeIndex);
          if (index === activeIndex) button.setAttribute("aria-current", "true");
          else button.removeAttribute("aria-current");
        });
        if (resetTimer) startTimer();
      }
      function pauseTimer() {
        if (timer) window.clearInterval(timer);
        timer = null;
      }
      function startTimer() {
        pauseTimer();
        timer = window.setInterval(function () { show(activeIndex + 1, false); }, INTERVAL);
      }

      dotButtons.forEach(function (button, index) {
        button.addEventListener("click", function () { show(index, true); });
      });
      card.addEventListener("mouseenter", pauseTimer);
      card.addEventListener("mouseleave", startTimer);
      card.addEventListener("focusin", pauseTimer);
      card.addEventListener("focusout", startTimer);

      let touchStartX = 0;
      let touchStartY = 0;
      card.addEventListener("touchstart", function (event) {
        const touch = event.touches && event.touches[0];
        if (!touch) return;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }, { passive: true });
      card.addEventListener("touchend", function (event) {
        const touch = event.changedTouches && event.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(activeIndex + (dx < 0 ? 1 : -1), true);
      }, { passive: true });
      card.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight") { event.preventDefault(); show(activeIndex + 1, true); }
        if (event.key === "ArrowLeft") { event.preventDefault(); show(activeIndex - 1, true); }
      });
      startTimer();
    });
  }

  function boot() {
    let attempts = 0;
    const timer = window.setInterval(function () {
      const placeholder = document.querySelector(".professional-hero .heroAnnouncement") || document.querySelector(".heroAnnouncement");
      if (placeholder) {
        window.clearInterval(timer);
        mount(placeholder);
      } else if (++attempts > 80) {
        window.clearInterval(timer);
      }
    }, 200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();