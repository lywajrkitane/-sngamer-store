/* SNGAMER STORE — FINAL SECTION SHELL GUARD
   This is intentionally a small last-pass guard loaded after the storefront
   scripts. It protects the public shell rules from later navigation/profile
   code accidentally hiding shared site content.
*/
(function () {
  'use strict';
  if (window.__sngStoreShellFinalV1) return;
  window.__sngStoreShellFinalV1 = true;

  function section() {
    return String(window.activeStoreSection || document.body?.dataset.storeSection || 'home');
  }

  function enforceShell() {
    const current = section();
    const isHome = current === 'home';
    const isProfile = current === 'profile';
    const isCategory = !isHome && !isProfile;

    const footerContent = document.querySelector('body > .store-footer-content');
    const footer = document.querySelector('body > footer');
    const hero = document.querySelector('body > .hero');
    const cats = document.getElementById('cats');
    const subcats = document.getElementById('navSubcategories');
    const products = document.getElementById('products');
    const profile = document.getElementById('profileArea');

    // Shared public footer: ALWAYS present on Home, every category and Profile.
    [footerContent, footer].forEach(function (node) {
      if (!node) return;
      node.hidden = false;
      node.style.setProperty('display', 'block', 'important');
    });

    // Hero and horizontal category filters are Home-only.
    if (hero) {
      hero.hidden = !isHome;
      hero.style.setProperty('display', isHome ? 'block' : 'none', 'important');
    }
    if (cats) {
      cats.hidden = !isHome;
      cats.style.setProperty('display', isHome ? '' : 'none', 'important');
    }
    if (subcats) {
      subcats.hidden = true;
      subcats.style.setProperty('display', 'none', 'important');
    }

    // Profile owns the content area; product grid stays hidden there.
    if (products) {
      products.style.setProperty('display', isProfile ? 'none' : '', 'important');
    }
    if (profile) {
      profile.hidden = !isProfile;
      profile.style.setProperty('display', isProfile ? 'block' : 'none', 'important');
    }

    document.body.classList.toggle('sngFinalHomeView', isHome);
    document.body.classList.toggle('sngFinalCategoryView', isCategory);
    document.body.classList.toggle('sngFinalProfileView', isProfile);
  }

  function enforceFavorite() {
    document.querySelectorAll('.sngFavBtn').forEach(function (btn) {
      const active = btn.classList.contains('isFavorite') || btn.getAttribute('aria-pressed') === 'true';
      btn.innerHTML = active ? '♥' : '♡';
      btn.setAttribute('aria-label', active ? 'Retirer des favoris' : 'Ajouter aux favoris');
      btn.title = active ? 'Retirer des favoris' : 'Ajouter aux favoris';
    });
  }

  function installStyles() {
    if (document.getElementById('sngStoreShellFinalStyles')) return;
    const style = document.createElement('style');
    style.id = 'sngStoreShellFinalStyles';
    style.textContent = `
      body.sngFinalCategoryView > .store-footer-content,
      body.sngFinalProfileView > .store-footer-content,
      body.sngFinalCategoryView > footer,
      body.sngFinalProfileView > footer {
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
      }
      .sngSocialBtn.sngFavBtn,
      html body .sngSocialBtn.sngFavBtn {
        width:34px !important;
        min-width:34px !important;
        max-width:34px !important;
        height:34px !important;
        min-height:34px !important;
        padding:0 !important;
        margin:0 !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
        color:#dce7f4 !important;
        font-family:Arial,Helvetica,sans-serif !important;
        font-size:28px !important;
        font-weight:400 !important;
        line-height:34px !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:0 !important;
        transform:none !important;
        white-space:nowrap !important;
      }
      .sngSocialBtn.sngFavBtn:hover,
      .sngSocialBtn.sngFavBtn:active,
      html body .sngSocialBtn.sngFavBtn:hover,
      html body .sngSocialBtn.sngFavBtn:active {
        border:0 !important;
        background:transparent !important;
        box-shadow:none !important;
        transform:none !important;
      }
      .sngSocialBtn.sngFavBtn.isFavorite,
      html body .sngSocialBtn.sngFavBtn.isFavorite {
        color:#ff4f86 !important;
        border:0 !important;
        background:transparent !important;
      }
    `;
    document.head.appendChild(style);
  }

  function boot() {
    installStyles();
    enforceShell();
    enforceFavorite();
    const observer = new MutationObserver(function () {
      enforceShell();
      enforceFavorite();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style', 'aria-pressed']
    });
    window.setTimeout(enforceShell, 100);
    window.setTimeout(enforceShell, 500);
    window.setTimeout(enforceFavorite, 100);
    window.setTimeout(enforceFavorite, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
