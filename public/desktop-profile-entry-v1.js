/* SNGAMER STORE — desktop customer profile entry + premium store return */
(function () {
  'use strict';
  if (window.__sngDesktopProfileEntryV1) return;
  window.__sngDesktopProfileEntryV1 = true;

  function goToStore(section) {
    const target = section || 'home';
    if (typeof window.navigateStore === 'function') {
      window.navigateStore(target);
      return;
    }
    window.sessionStorage.setItem('sg_profile_return_section', target);
    let attempts = 0;
    const retryNavigation = function () {
      attempts += 1;
      if (typeof window.navigateStore === 'function') {
        window.navigateStore(target);
        return;
      }
      if (attempts < 10) window.setTimeout(retryNavigation, 50);
    };
    window.setTimeout(retryNavigation, 0);
  }

  function installStyles() {
    if (document.getElementById('sngDesktopProfileStyles')) return;
    const style = document.createElement('style');
    style.id = 'sngDesktopProfileStyles';
    style.textContent = `
      @media (min-width: 769px) {
        /* Keep the brand on the left and the navigation controls as one compact group on the far right. */
        .siteHeader .nav { justify-content:flex-start !important; }
        .siteHeader .nav > .sngDesktopProfileButton { margin-left:auto !important; }
        .siteHeader .nav > .searchPremiumButton,
        .siteHeader .nav > .sngDesktopStoreButton,
        .siteHeader .nav > .cartButton { margin-left:0 !important; }
        body.sngDesktopProfileMode .siteHeader .nav > .searchPremiumButton { margin-left:auto !important; }
        body.sngDesktopProfileMode .siteHeader .nav > .sngDesktopStoreButton,
        body.sngDesktopProfileMode .siteHeader .nav > .cartButton { margin-left:0 !important; }
        .siteHeader .nav > .searchPremiumButton { order:3 !important; }
        .siteHeader .nav > .sngDesktopProfileButton { order:2 !important; }
        .siteHeader .nav > .sngDesktopStoreButton { order:4 !important; }
        .siteHeader .nav > .cartButton { order:5 !important; }

        .siteHeader .nav > .sngDesktopProfileButton,
        .siteHeader .nav > .sngDesktopStoreButton,
        .siteHeader .nav > .cartButton,
        .siteHeader .nav > .searchPremiumButton {
          width:46px !important;
          min-width:46px !important;
          max-width:46px !important;
          height:46px !important;
          min-height:46px !important;
          max-height:46px !important;
          padding:0 !important;
          flex:0 0 46px !important;
          border-radius:15px !important;
          align-items:center !important;
          justify-content:center !important;
          gap:0 !important;
          overflow:visible !important;
          position:relative;
          box-sizing:border-box !important;
        }

        .siteHeader .nav > .cartButton,
        .siteHeader .nav > .sngDesktopProfileButton,
        .siteHeader .nav > .searchPremiumButton,
        .siteHeader .nav > .sngDesktopStoreButton {
          background:linear-gradient(135deg,#167fff 0%,#5b35ff 55%,#d326a8 100%) !important;
          border:1px solid rgba(132,188,255,.42) !important;
          color:#fff !important;
          box-shadow:0 10px 28px rgba(44,91,255,.20),inset 0 1px 0 rgba(255,255,255,.12),0 0 24px rgba(74,103,255,.12) !important;
        }
        .siteHeader .nav > .cartButton:hover,
        .siteHeader .nav > .sngDesktopProfileButton:hover,
        .siteHeader .nav > .searchPremiumButton:hover,
        .siteHeader .nav > .sngDesktopStoreButton:hover {
          transform:translateY(-1px);
          filter:brightness(1.07) saturate(1.08);
          box-shadow:0 14px 34px rgba(44,91,255,.28),inset 0 1px 0 rgba(255,255,255,.16),0 0 30px rgba(74,103,255,.18) !important;
        }
        .siteHeader .nav > .cartButton:active,
        .siteHeader .nav > .sngDesktopProfileButton:active,
        .siteHeader .nav > .searchPremiumButton:active,
        .siteHeader .nav > .sngDesktopStoreButton:active { transform:translateY(0) scale(.97); }
        .siteHeader .nav > .cartButton > span:not(.cartIcon) { display:none !important; }
        .siteHeader .nav > .cartButton .cartIcon { display:inline-flex !important; width:22px; height:22px; align-items:center; justify-content:center; font-size:19px; line-height:1; }
        .siteHeader .nav > .cartButton b {
          position:absolute; top:-5px; right:-5px; min-width:18px; height:18px; padding:0 4px !important;
          display:flex; align-items:center; justify-content:center; border-radius:999px;
          background:linear-gradient(135deg,#ff4d9d,#7c3aed) !important; border:2px solid #050912; color:#fff;
          font-size:9px; line-height:1; box-shadow:0 4px 12px rgba(124,58,237,.35);
        }

        .sngDesktopProfileButton {
          display:inline-flex !important;
          border:1px solid rgba(132,188,255,.42) !important;
          font:inherit; cursor:pointer;
          transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,background .18s ease,filter .18s ease;
        }
        .sngDesktopProfileButton > span:not(.sngDesktopProfileIcon) { display:none !important; }
        .sngDesktopProfileIcon { width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center; }
        .sngDesktopProfileIcon svg { width:22px;height:22px; }
        .sngDesktopProfileButton.is-active {
          border-color:rgba(255,255,255,.48) !important;
          box-shadow:0 12px 34px rgba(54,76,220,.30),inset 0 1px 0 rgba(255,255,255,.18),0 0 30px rgba(74,103,255,.20) !important;
        }
        .sngDesktopProfileButton.is-hidden { display:none !important; }
        .siteHeader .nav > .searchPremiumButton { order:3 !important; }
        .siteHeader .nav > .searchPremiumButton svg { width:22px !important; height:22px !important; }

        .sngDesktopStoreButton {
          display:none !important;
          border:1px solid rgba(132,188,255,.42) !important;
          color:#f4f8ff; font:inherit; cursor:pointer;
          transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,filter .18s ease;
        }
        .sngDesktopStoreButton.is-visible { display:inline-flex !important; }
        .sngDesktopStoreIcon { width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center; }
        .sngDesktopStoreIcon svg { width:22px;height:22px; }

        #profileArea.sngDesktopProfileArea { width:100%; max-width:none; }
        /* The shared storefront footer is part of the public site shell and
           remains visible in Profile exactly as it is on other sections. */
        body.sngDesktopProfileMode .hero { display:none !important; }
        body.sngDesktopProfileMode #shop { padding-top:30px; padding-bottom:70px; }
        body.sngDesktopProfileMode #products { display:none !important; }
        body.sngDesktopProfileMode #cats,
        body.sngDesktopProfileMode #navSubcategories { display:none !important; }
        body.sngDesktopProfileMode #sectionTitle { font-size:clamp(28px,3vw,42px); margin:0; }
        body.sngDesktopProfileMode #profileArea { display:block !important; visibility:visible !important; }
      }
      @media (max-width: 768px) {
        .sngDesktopProfileButton,.sngDesktopStoreButton { display:none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function createButton() {
    const nav = document.querySelector('.siteHeader .nav');
    const cart = document.querySelector('.siteHeader .cartButton');
    if (!nav || !cart) return null;

    let storeButton = document.getElementById('sngDesktopStoreButton');
    if (!storeButton) {
      storeButton = document.createElement('button');
      storeButton.id = 'sngDesktopStoreButton';
      storeButton.type = 'button';
      storeButton.className = 'sngDesktopStoreButton';
      storeButton.setAttribute('aria-label', 'Retour à la boutique');
      storeButton.setAttribute('title', 'Retour à la boutique');
      storeButton.innerHTML = '<span class="sngDesktopStoreIcon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5h16v9.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 19.7z"/><path d="M3 10.5 5.2 4h13.6l2.2 6.5"/><path d="M8 10.5a2 2 0 0 0 4 0 2 2 0 0 0 4 0"/></svg></span>';
      storeButton.addEventListener('click', function () { goToStore('home'); });
      nav.insertBefore(storeButton, cart);
    }

    let profileButton = document.getElementById('sngDesktopProfileButton');
    if (!profileButton) {
      profileButton = document.createElement('button');
      profileButton.id = 'sngDesktopProfileButton';
      profileButton.type = 'button';
      profileButton.className = 'sngDesktopProfileButton';
      profileButton.setAttribute('aria-label', 'Ouvrir mon profil');
      profileButton.innerHTML = '<span class="sngDesktopProfileIcon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21c.8-4.1 3.5-6.5 8-6.5s7.2 2.4 8 6.5"/></svg></span><span>Profil</span>';
      profileButton.addEventListener('click', function () { goToStore('profile'); });
      nav.insertBefore(profileButton, cart);
    }
    return { storeButton, profileButton };
  }

  function sync() {
    const buttons = createButton();
    const profile = document.getElementById('profileArea');
    const isProfile = window.activeStoreSection === 'profile' || Boolean(profile && profile.style.display !== 'none' && document.body.classList.contains('sngDesktopProfileMode'));
    document.body.classList.toggle('sngDesktopProfileMode', isProfile);
    if (profile) profile.classList.toggle('sngDesktopProfileArea', isProfile);
    if (buttons) {
      buttons.profileButton.classList.toggle('is-active', isProfile);
      buttons.profileButton.classList.toggle('is-hidden', isProfile);
      buttons.profileButton.setAttribute('aria-hidden', isProfile ? 'true' : 'false');
      buttons.profileButton.tabIndex = isProfile ? -1 : 0;
      buttons.storeButton.classList.toggle('is-visible', isProfile);
    }
  }

  function boot() {
    installStyles();
    sync();
    [100,300,700,1500,3000].forEach(delay => setTimeout(sync, delay));
    const observer = new MutationObserver(() => sync());
    observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden','style','class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
