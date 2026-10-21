/* SNGAMER STORE — FINAL SECTION SHELL GUARD
   One-time safety pass only. No global MutationObserver is used here.
   This file owns shared shell presentation and the client favorites layout.
*/
(function () {
  'use strict';
  if (window.__sngStoreShellFinalV3) return;
  window.__sngStoreShellFinalV3 = true;

  const nativeFetch = window.fetch.bind(window);

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

    if (footerContent) {
      footerContent.hidden = false;
      footerContent.style.removeProperty('display');
    }
    if (footer) {
      footer.hidden = true;
      footer.style.display = 'none';
    }

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

    if (products) products.style.display = isProfile ? 'none' : '';
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

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>\"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' })[c];
    });
  }

  function money(value) {
    return new Intl.NumberFormat('fr-FR').format(Number(value) || 0) + ' FCFA';
  }

  function favoritePrice(product) {
    const promo = Boolean(product && product.promo_active) &&
      Number(product.promo_price) > 0 &&
      Number(product.promo_price) < Number(product.price);
    return promo ? product.promo_price : product.price;
  }

  async function expandFavoritesToAllProducts(card) {
    if (!card || card.dataset.sngAllFavoritesLoading === '1') return;
    const profileRoot = document.getElementById('profileArea');
    if (!profileRoot || !profileRoot.contains(card) || section() !== 'profile') return;

    card.dataset.sngAllFavoritesLoading = '1';
    try {
      const response = await nativeFetch('/api/customer/favorites', {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (!response.ok) return;
      const data = await response.json();
      const list = Array.isArray(data.products) ? data.products : [];
      if (!card.isConnected || section() !== 'profile') return;

      const grid = card.querySelector('.sngFavoritesGrid');
      if (!grid) return;

      grid.innerHTML = list.map(function (p) {
        const image = p.image1_url
          ? `<img src="${escapeHtml(p.image1_url)}" alt="${escapeHtml(p.name || 'Produit')}">`
          : `<div class="sngFavoritePlaceholder">${escapeHtml(p.emoji || '🎮')}</div>`;
        return `<button type="button" class="sngFavoriteItem" data-fav-id="${Number(p.id)}">${image}<strong>${escapeHtml(p.name || 'Produit')}</strong><small>${money(favoritePrice(p))}</small></button>`;
      }).join('');

      if (!list.length) {
        grid.innerHTML = '<div class="sngFavEmpty">Tu n’as encore aucun produit favori. Ajoute un produit avec le bouton ♡ depuis sa fiche.</div>';
      }

      grid.querySelectorAll('[data-fav-id]').forEach(function (button) {
        button.addEventListener('click', function () {
          if (typeof window.openProduct === 'function') window.openProduct(Number(button.dataset.favId));
        });
      });
    } catch (error) {
      console.error('SNGAMER_FAVORITES_LAYOUT_ERROR', error);
    } finally {
      delete card.dataset.sngAllFavoritesLoading;
    }
  }

  function normalizeFavoritesLayout() {
    if (section() !== 'profile') return;
    const profileRoot = document.getElementById('profileArea');
    if (!profileRoot) return;
    const card = profileRoot.querySelector('.sngFavoritesCard');
    if (!card) return;

    expandFavoritesToAllProducts(card);
  }

  function installStyles() {
    if (document.getElementById('sngStoreShellFinalStyles')) return;
    const style = document.createElement('style');
    style.id = 'sngStoreShellFinalStyles';
    style.textContent = `
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

      /* Client favorites: compact horizontal browsing on phones. */
      .sngFavoritesCard {
        overflow:hidden !important;
      }
      .sngFavoritesGrid {
        display:grid !important;
        grid-template-columns:repeat(2,minmax(0,1fr)) !important;
        gap:10px !important;
      }
      .sngFavoriteItem {
        min-width:0 !important;
      }
      .sngFavoritePlaceholder {
        width:100% !important;
        aspect-ratio:1/1 !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        font-size:38px !important;
        border-radius:11px !important;
        background:rgba(255,255,255,.035) !important;
      }
      @media(max-width:700px) {
        .sngFavoritesCard {
          padding:14px !important;
        }
        .sngFavoritesGrid {
          display:flex !important;
          flex-wrap:nowrap !important;
          overflow-x:auto !important;
          overflow-y:hidden !important;
          gap:10px !important;
          margin:0 -2px !important;
          padding:2px 2px 8px !important;
          scroll-snap-type:x proximity !important;
          -webkit-overflow-scrolling:touch !important;
          scrollbar-width:none !important;
        }
        .sngFavoritesGrid::-webkit-scrollbar {
          display:none !important;
        }
        .sngFavoriteItem {
          flex:0 0 155px !important;
          width:155px !important;
          max-width:155px !important;
          scroll-snap-align:start !important;
          padding:8px !important;
        }
        .sngFavoriteItem img,
        .sngFavoritePlaceholder {
          aspect-ratio:1/1 !important;
        }
        .sngFavoriteItem strong {
          font-size:12px !important;
        }
        .sngFavoriteItem small {
          font-size:11px !important;
        }
        .sngFavEmpty {
          min-width:100% !important;
        }
      }
      @media(min-width:701px) {
        .sngFavoritesGrid {
          grid-template-columns:repeat(4,minmax(0,1fr)) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function watchProfileFavorites() {
    const profileRoot = document.getElementById('profileArea');
    if (!profileRoot || profileRoot.__sngFavoritesLayoutObserver) return;

    const observer = new MutationObserver(function () {
      if (section() === 'profile') normalizeFavoritesLayout();
    });
    observer.observe(profileRoot, { childList: true, subtree: true });
    profileRoot.__sngFavoritesLayoutObserver = observer;
    normalizeFavoritesLayout();
  }

  function boot() {
    installStyles();
    enforceShell();
    enforceFavorite();
    watchProfileFavorites();
    window.setTimeout(enforceShell, 250);
    window.setTimeout(enforceFavorite, 250);
    window.setTimeout(normalizeFavoritesLayout, 350);
    window.setTimeout(enforceShell, 750);
    window.setTimeout(enforceFavorite, 750);
    window.setTimeout(normalizeFavoritesLayout, 900);
    window.setTimeout(normalizeFavoritesLayout, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
