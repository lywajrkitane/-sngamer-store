/* SNGAMER STORE — desktop customer profile entry + store return */
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
    window.location.reload();
  }

  function installStyles() {
    if (document.getElementById('sngDesktopProfileStyles')) return;
    const style = document.createElement('style');
    style.id = 'sngDesktopProfileStyles';
    style.textContent = `
      @media (min-width: 769px) {
        .sngDesktopProfileButton,
        .sngDesktopStoreButton {
          display:inline-flex !important;
          align-items:center;
          justify-content:center;
          gap:9px;
          min-height:46px;
          padding:0 17px;
          border:1px solid rgba(91,146,255,.34);
          border-radius:15px;
          background:linear-gradient(145deg,rgba(18,30,55,.96),rgba(24,12,48,.94));
          color:#eef5ff;
          box-shadow:0 10px 28px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.07),0 0 24px rgba(65,116,255,.08);
          font:inherit;
          font-weight:850;
          cursor:pointer;
          transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,background .18s ease;
        }
        .sngDesktopProfileButton:hover,
        .sngDesktopStoreButton:hover { transform:translateY(-1px); border-color:rgba(110,171,255,.62); box-shadow:0 13px 34px rgba(0,0,0,.25),0 0 30px rgba(65,116,255,.14); }
        .sngDesktopProfileButton.is-active { border-color:rgba(105,166,255,.72); background:linear-gradient(135deg,rgba(31,74,170,.92),rgba(89,38,171,.92)); box-shadow:0 12px 34px rgba(54,76,220,.22); }
        .sngDesktopStoreButton.is-active { border-color:rgba(110,171,255,.72); background:linear-gradient(135deg,rgba(31,74,170,.92),rgba(34,122,190,.82)); }
        .sngDesktopProfileIcon,.sngDesktopStoreIcon { width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center; }
        .sngDesktopProfileIcon svg,.sngDesktopStoreIcon svg { width:20px;height:20px; }

        #profileArea.sngDesktopProfileArea { width:100%; max-width:none; }
        body.sngDesktopProfileMode .hero,
        body.sngDesktopProfileMode .store-footer-content,
        body.sngDesktopProfileMode footer { display:none !important; }
        body.sngDesktopProfileMode #shop { padding-top:30px; padding-bottom:70px; }
        body.sngDesktopProfileMode #products { display:none !important; }
        body.sngDesktopProfileMode #cats,
        body.sngDesktopProfileMode #navSubcategories { display:none !important; }
        body.sngDesktopProfileMode #sectionTitle { font-size:clamp(28px,3vw,42px); margin:0; }
        body.sngDesktopProfileMode #profileArea { display:block !important; visibility:visible !important; }

        .sngProfileStoreReturn {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:18px;
          margin:0 0 24px;
          padding:16px 18px;
          border:1px solid rgba(87,145,255,.24);
          border-radius:20px;
          background:linear-gradient(135deg,rgba(10,21,39,.94),rgba(18,12,35,.92));
          box-shadow:0 16px 42px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.045);
        }
        .sngProfileStoreReturnCopy { min-width:0; }
        .sngProfileStoreReturnEyebrow { display:block; margin-bottom:4px; color:#7ea8d8; font-size:10px; font-weight:900; letter-spacing:1.6px; text-transform:uppercase; }
        .sngProfileStoreReturnTitle { display:block; color:#f4f8ff; font-size:18px; font-weight:900; }
        .sngProfileStoreReturnButton {
          flex:0 0 auto;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:9px;
          min-height:44px;
          padding:0 16px;
          border:1px solid rgba(102,166,255,.42);
          border-radius:14px;
          background:linear-gradient(135deg,#1d4ed8,#6d28d9);
          color:#fff;
          font:inherit;
          font-weight:900;
          cursor:pointer;
          box-shadow:0 10px 28px rgba(45,71,210,.24),inset 0 1px 0 rgba(255,255,255,.16);
        }
        .sngProfileStoreReturnButton:hover { transform:translateY(-1px); box-shadow:0 13px 34px rgba(45,71,210,.30); }
        @media(max-width:900px){
          .sngProfileStoreReturn { align-items:flex-start; flex-direction:column; }
          .sngProfileStoreReturnButton { width:100%; }
        }
      }
      @media (max-width: 768px) {
        .sngDesktopProfileButton,.sngDesktopStoreButton { display:none !important; }
        .sngProfileStoreReturn { display:none !important; }
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
      storeButton.innerHTML = '<span class="sngDesktopStoreIcon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5h16v9.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 19.7z"/><path d="M3 10.5 5.2 4h13.6l2.2 6.5"/><path d="M8 10.5a2 2 0 0 0 4 0 2 2 0 0 0 4 0"/></svg></span><span>Boutique</span>';
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

  function ensureProfileReturn() {
    const profile = document.getElementById('profileArea');
    if (!profile || !document.body.classList.contains('sngDesktopProfileMode')) return;
    if (profile.querySelector('#sngProfileStoreReturn')) return;

    const bar = document.createElement('div');
    bar.id = 'sngProfileStoreReturn';
    bar.className = 'sngProfileStoreReturn';
    bar.innerHTML = `
      <div class="sngProfileStoreReturnCopy">
        <span class="sngProfileStoreReturnEyebrow">Espace client</span>
        <span class="sngProfileStoreReturnTitle">Vous êtes dans votre profil</span>
      </div>
      <button type="button" class="sngProfileStoreReturnButton" aria-label="Retourner à la boutique">
        <span aria-hidden="true">←</span>
        <span>Retour à la boutique</span>
      </button>
    `;
    bar.querySelector('button').addEventListener('click', function () { goToStore('home'); });
    profile.prepend(bar);
  }

  function sync() {
    const buttons = createButton();
    const profile = document.getElementById('profileArea');
    const isProfile = window.activeStoreSection === 'profile' || Boolean(profile && profile.style.display !== 'none' && document.body.classList.contains('sngDesktopProfileMode'));
    document.body.classList.toggle('sngDesktopProfileMode', isProfile);
    if (profile) profile.classList.toggle('sngDesktopProfileArea', isProfile);
    if (buttons) {
      buttons.profileButton.classList.toggle('is-active', isProfile);
      buttons.storeButton.classList.toggle('is-active', !isProfile);
    }
    if (isProfile) ensureProfileReturn();
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
