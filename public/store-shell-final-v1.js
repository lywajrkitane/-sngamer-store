/* SNGAMER STORE — FINAL SECTION SHELL GUARD
   One-time safety pass only. No global MutationObserver is used here.
   The previous observer could react to its own favorite-heart DOM updates
   and create unnecessary repeated work on the storefront.
*/
(function () {
  'use strict';
  if (window.__sngStoreShellFinalV2) return;
  window.__sngStoreShellFinalV2 = true;

  function section() {
    return String(window.activeStoreSection || document.body?.dataset.storeSection || 'home');
  }

  function enforceShell() {
    const current = section();
    const isHome = current === 'home';
    const isProfile = current === 'profile';

    const footerContent = document.querySelector('body > .store-footer-content');
    const footer = document.querySelector('body > footer');
    const hero = document.querySelector('body > .hero');
    const cats = document.getElementById('cats');
    const subcats = document.getElementById('navSubcategories');
    const products = document.getElementById('products');
    const profile = document.getElementById('profileArea');

    // The footer is shared by every public section.
    if (footerContent) {
      footerContent.hidden = false;
      footerContent.style.removeProperty('display');
    }
    // The old standalone copyright strip is intentionally removed; the shared
    // storefront content above already contains the complete footer information.
    if (footer) {
      footer.hidden = true;
      footer.style.display = 'none';
    }

    // Hero and horizontal category filters belong to Home only.
    if (hero) hero.hidden = !isHome;
    if (cats) {
      cats.hidden = !isHome;
      if (!isHome) cats.style.display = 'none';
      else cats.style.removeProperty('display');
    }
    if (subcats) {
      subcats.hidden = true;
      subcats.style.display = 'none';
    }

    if (products) {
      products.style.display = isProfile ? 'none' : '';
    }
    if (profile) {
      profile.hidden = !isProfile;
      profile.style.display = isProfile ? 'block' : 'none';
    }

    document.body.classList.toggle('sngFinalHomeView', isHome);
    document.body.classList.toggle('sngFinalCategoryView', !isHome && !isProfile);
    document.body.classList.toggle('sngFinalProfileView', isProfile);
  }

  function enforceFavorite() {
    document.querySelectorAll('.sngFavBtn').forEach(function (btn) {
      const active = btn.classList.contains('isFavorite') || btn.getAttribute('aria-pressed') === 'true';
      const heart = active ? '♥' : '♡';
      if (btn.textContent.trim() !== heart) btn.textContent = heart;
      btn.setAttribute('aria-label', active ? 'Retirer des favoris' : 'Ajouter aux favoris');
      btn.title = active ? 'Retirer des favoris' : 'Ajouter aux favoris';
    });
  }

  function installStyles() {
    if (document.getElementById('sngStoreShellFinalStyles')) return;
    const style = document.createElement('style');
    style.id = 'sngStoreShellFinalStyles';
    style.textContent = `
      /* Keep the shared information/policies area close to the preceding content. */
      body > .store-footer-content {
        margin-bottom:20px !important;
      }
      #sngPublicPolicies {
        margin-top:18px !important;
        margin-bottom:0 !important;
        padding-bottom:20px !important;
      }
      body > footer {
        display:none !important;
        height:0 !important;
        min-height:0 !important;
        margin:0 !important;
        padding:0 !important;
        border:0 !important;
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
    window.setTimeout(enforceShell, 250);
    window.setTimeout(enforceFavorite, 250);
    window.setTimeout(enforceShell, 750);
    window.setTimeout(enforceFavorite, 750);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
