/* SNGAMER STORE — desktop customer profile entry */
(function () {
  'use strict';
  if (window.__sngDesktopProfileEntryV1) return;
  window.__sngDesktopProfileEntryV1 = true;

  function installStyles() {
    if (document.getElementById('sngDesktopProfileStyles')) return;
    const style = document.createElement('style');
    style.id = 'sngDesktopProfileStyles';
    style.textContent = `
      @media (min-width: 769px) {
        .sngDesktopProfileButton {
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
          transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease;
        }
        .sngDesktopProfileButton:hover { transform:translateY(-1px); border-color:rgba(110,171,255,.62); box-shadow:0 13px 34px rgba(0,0,0,.25),0 0 30px rgba(65,116,255,.14); }
        .sngDesktopProfileButton.is-active { border-color:rgba(105,166,255,.72); background:linear-gradient(135deg,rgba(31,74,170,.92),rgba(89,38,171,.92)); box-shadow:0 12px 34px rgba(54,76,220,.22); }
        .sngDesktopProfileIcon { width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center; }
        .sngDesktopProfileIcon svg { width:20px;height:20px; }
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
      }
      @media (max-width: 768px) { .sngDesktopProfileButton { display:none !important; } }
    `;
    document.head.appendChild(style);
  }

  function createButton() {
    const nav = document.querySelector('.siteHeader .nav');
    const cart = document.querySelector('.siteHeader .cartButton');
    if (!nav || !cart) return;
    let button = document.getElementById('sngDesktopProfileButton');
    if (!button) {
      button = document.createElement('button');
      button.id = 'sngDesktopProfileButton';
      button.type = 'button';
      button.className = 'sngDesktopProfileButton';
      button.innerHTML = '<span class="sngDesktopProfileIcon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21c.8-4.1 3.5-6.5 8-6.5s7.2 2.4 8 6.5"/></svg></span><span>Profil</span>';
      button.addEventListener('click', function () {
        if (typeof window.navigateStore === 'function') window.navigateStore('profile');
      });
      nav.insertBefore(button, cart);
    }
    return button;
  }

  function sync() {
    const button = createButton();
    const profile = document.getElementById('profileArea');
    const isProfile = window.activeStoreSection === 'profile';
    document.body.classList.toggle('sngDesktopProfileMode', isProfile);
    if (profile) profile.classList.toggle('sngDesktopProfileArea', isProfile);
    if (button) button.classList.toggle('is-active', isProfile);
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
