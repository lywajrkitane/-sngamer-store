/* SNGAMER STORE — premium category navigation
   Restores the intended mobile bottom navigation:
   - one active category rises above the row
   - active category keeps its luminous premium frame
   - only the active category displays its label
   - inactive categories stay aligned on the same baseline
   - Pièces eFootball uses a clean three-stack coin icon
*/
(function () {
  "use strict";

  const ICONS = {
    home: `
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path d="M8 21.5 24 8l16 13.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11.5 20.5V40h25V20.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M19 40V29h10v11" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/>
      </svg>`,

    accessories: `
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path d="M14 17h20c5.4 0 9.4 5.1 7.8 10.3l-2.3 7.1c-.9 2.8-4.8 3.3-6.3.8L31 31H17l-2.2 4.2c-1.5 2.5-5.4 2-6.3-.8l-2.3-7.1C4.6 22.1 8.6 17 14 17Z" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 23v8M10 27h8" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>
        <circle cx="34" cy="24.5" r="1.5" fill="currentColor"/>
        <circle cx="38" cy="28.5" r="1.5" fill="currentColor"/>
      </svg>`,

    phones: `
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <rect x="14" y="5" width="20" height="38" rx="4" fill="none" stroke="currentColor" stroke-width="2.7"/>
        <path d="M20 10h8M21 37h6" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>
      </svg>`,

    coins: `
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <g>
          <ellipse cx="24" cy="10" rx="9.5" ry="3.6" fill="none" stroke="currentColor" stroke-width="2.3"/>
          <path d="M14.5 10v7.5c0 2 4.3 3.6 9.5 3.6s9.5-1.6 9.5-3.6V10" fill="none" stroke="currentColor" stroke-width="2.3"/>
          <ellipse cx="24" cy="17.5" rx="9.5" ry="3.6" fill="none" stroke="currentColor" stroke-width="2.3"/>
          <path d="M14.5 17.5v7.5c0 2 4.3 3.6 9.5 3.6s9.5-1.6 9.5-3.6v-7.5" fill="none" stroke="currentColor" stroke-width="2.3"/>
        </g>
        <g>
          <ellipse cx="12.5" cy="23" rx="8.5" ry="3.2" fill="none" stroke="currentColor" stroke-width="2.15"/>
          <path d="M4 23v7c0 1.8 3.8 3.2 8.5 3.2s8.5-1.4 8.5-3.2v-7" fill="none" stroke="currentColor" stroke-width="2.15"/>
          <ellipse cx="12.5" cy="30" rx="8.5" ry="3.2" fill="none" stroke="currentColor" stroke-width="2.15"/>
          <path d="M4 30v6.2c0 1.8 3.8 3.2 8.5 3.2s8.5-1.4 8.5-3.2V30" fill="none" stroke="currentColor" stroke-width="2.15"/>
        </g>
        <g>
          <ellipse cx="35.5" cy="23" rx="8.5" ry="3.2" fill="none" stroke="currentColor" stroke-width="2.15"/>
          <path d="M27 23v7c0 1.8 3.8 3.2 8.5 3.2s8.5-1.4 8.5-3.2v-7" fill="none" stroke="currentColor" stroke-width="2.15"/>
          <ellipse cx="35.5" cy="30" rx="8.5" ry="3.2" fill="none" stroke="currentColor" stroke-width="2.15"/>
          <path d="M27 30v6.2c0 1.8 3.8 3.2 8.5 3.2s8.5-1.4 8.5-3.2V30" fill="none" stroke="currentColor" stroke-width="2.15"/>
        </g>
      </svg>`,

    profile: `
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle cx="24" cy="15" r="7" fill="none" stroke="currentColor" stroke-width="2.7"/>
        <path d="M10 41c1.5-8 6.2-12 14-12s12.5 4 14 12" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>
      </svg>`
  };

  const LABELS = {
    home: "Accueil",
    accessories: "Accessoires",
    phones: "Gaming Phone",
    coins: "Pièces eFootball",
    profile: "Profil"
  };

  function install() {
    const nav = document.getElementById("mobileBottomNav");
    if (!nav) return false;

    if (!document.getElementById("sngamerPremiumCategoryNavStyles")) {
      const style = document.createElement("style");
      style.id = "sngamerPremiumCategoryNavStyles";
      style.textContent = `
        @media (max-width:700px){
          #mobileBottomNav{
            position:fixed !important;
            left:0 !important;
            right:0 !important;
            bottom:0 !important;
            height:92px !important;
            min-height:92px !important;
            padding:0 10px max(4px,env(safe-area-inset-bottom)) !important;
            display:flex !important;
            align-items:flex-end !important;
            justify-content:space-around !important;
            gap:0 !important;
            background:rgba(4,9,18,.97) !important;
            border-top:1px solid rgba(76,151,230,.16) !important;
            box-shadow:0 -12px 34px rgba(0,0,0,.30) !important;
            backdrop-filter:blur(18px) saturate(140%) !important;
            -webkit-backdrop-filter:blur(18px) saturate(140%) !important;
            z-index:9999 !important;
          }

          #mobileBottomNav .bottomNavItem{
            position:relative !important;
            flex:1 1 0 !important;
            width:auto !important;
            min-width:0 !important;
            height:82px !important;
            padding:0 !important;
            margin:0 !important;
            display:flex !important;
            flex-direction:column !important;
            align-items:center !important;
            justify-content:flex-end !important;
            gap:0 !important;
            background:transparent !important;
            border:0 !important;
            color:rgba(225,233,245,.76) !important;
            box-shadow:none !important;
            transform:none !important;
            overflow:visible !important;
          }

          #mobileBottomNav .bottomNavItem:hover,
          #mobileBottomNav .bottomNavItem:active{
            transform:none !important;
          }

          #mobileBottomNav .bottomNavIcon{
            position:relative !important;
            width:52px !important;
            height:52px !important;
            flex:0 0 52px !important;
            display:grid !important;
            place-items:center !important;
            margin:0 0 9px !important;
            color:currentColor !important;
            background:rgba(12,20,33,.76) !important;
            border:1px solid rgba(137,157,183,.28) !important;
            border-radius:17px !important;
            box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 8px 20px rgba(0,0,0,.16) !important;
            transform:translateY(0) !important;
            transition:transform .38s cubic-bezier(.22,1,.36,1),width .38s cubic-bezier(.22,1,.36,1),height .38s cubic-bezier(.22,1,.36,1),border-radius .38s ease,box-shadow .38s ease,background .38s ease !important;
            overflow:visible !important;
          }

          #mobileBottomNav .bottomNavIcon svg{
            width:31px !important;
            height:31px !important;
            display:block !important;
            color:currentColor !important;
            stroke:currentColor !important;
            fill:none !important;
            overflow:visible !important;
            filter:none !important;
            transition:transform .38s cubic-bezier(.22,1,.36,1),width .38s ease,height .38s ease !important;
          }

          #mobileBottomNav .bottomNavItem > span:not(.bottomNavIcon){
            position:absolute !important;
            left:50% !important;
            bottom:5px !important;
            transform:translateX(-50%) translateY(5px) !important;
            width:max-content !important;
            max-width:125px !important;
            margin:0 !important;
            padding:0 !important;
            color:#fff !important;
            font-size:12px !important;
            line-height:1 !important;
            font-weight:900 !important;
            letter-spacing:-.15px !important;
            white-space:nowrap !important;
            opacity:0 !important;
            visibility:hidden !important;
            pointer-events:none !important;
            transition:opacity .28s ease,transform .38s cubic-bezier(.22,1,.36,1) !important;
          }

          #mobileBottomNav .bottomNavItem:not(.active) > span:not(.bottomNavIcon){
            display:block !important;
          }

          #mobileBottomNav .bottomNavItem.active{
            color:#fff !important;
            z-index:4 !important;
          }

          #mobileBottomNav .bottomNavItem.active .bottomNavIcon{
            width:60px !important;
            height:60px !important;
            flex-basis:60px !important;
            margin-bottom:17px !important;
            border-radius:20px !important;
            background:linear-gradient(145deg,rgba(24,139,255,.36),rgba(124,58,237,.46),rgba(233,30,99,.28)) !important;
            border:1px solid rgba(89,190,255,.98) !important;
            box-shadow:0 0 13px rgba(28,150,255,.58),0 0 31px rgba(28,150,255,.28),0 0 52px rgba(124,58,237,.18),inset 0 0 20px rgba(109,205,255,.10) !important;
            transform:translateY(-17px) !important;
            animation:sngPremiumNavPulse 2.2s ease-in-out infinite !important;
          }

          #mobileBottomNav .bottomNavItem.active .bottomNavIcon::before{
            content:"" !important;
            position:absolute !important;
            inset:-5px !important;
            border-radius:24px !important;
            padding:1.5px !important;
            background:conic-gradient(from 0deg,rgba(90,184,255,0),rgba(90,184,255,.95),rgba(160,88,255,.95),rgba(233,30,99,.8),rgba(90,184,255,0)) !important;
            -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0) !important;
            -webkit-mask-composite:xor !important;
            mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0) !important;
            mask-composite:exclude !important;
            animation:sngPremiumNavOrbit 2.7s linear infinite !important;
            pointer-events:none !important;
            z-index:0 !important;
            box-shadow:0 0 17px rgba(90,184,255,.34) !important;
          }

          #mobileBottomNav .bottomNavItem.active .bottomNavIcon::after{
            content:"" !important;
            position:absolute !important;
            inset:-9px !important;
            border-radius:28px !important;
            background:radial-gradient(circle,rgba(55,166,255,.16) 0%,rgba(124,58,237,.08) 38%,transparent 70%) !important;
            filter:blur(5px) !important;
            z-index:-1 !important;
            pointer-events:none !important;
          }

          #mobileBottomNav .bottomNavItem.active .bottomNavIcon svg{
            width:34px !important;
            height:34px !important;
            position:relative !important;
            z-index:2 !important;
            transform:translateY(0) !important;
          }

          #mobileBottomNav .bottomNavItem.active > span:not(.bottomNavIcon){
            opacity:1 !important;
            visibility:visible !important;
            transform:translateX(-50%) translateY(0) !important;
          }

          @keyframes sngPremiumNavOrbit{to{transform:rotate(360deg)}}
          @keyframes sngPremiumNavPulse{
            0%,100%{box-shadow:0 0 10px rgba(22,135,255,.45),0 0 24px rgba(22,135,255,.22),inset 0 0 14px rgba(90,184,255,.08)}
            50%{box-shadow:0 0 16px rgba(22,135,255,.72),0 0 36px rgba(22,135,255,.34),0 0 54px rgba(124,58,237,.18),inset 0 0 18px rgba(90,184,255,.14)}
          }

          @media(prefers-reduced-motion:reduce){
            #mobileBottomNav .bottomNavItem.active .bottomNavIcon,
            #mobileBottomNav .bottomNavItem.active .bottomNavIcon::before{animation:none !important}
          }
        }
      `;
      document.head.appendChild(style);
    }

    nav.querySelectorAll(".bottomNavItem").forEach(function (button) {
      const key = button.dataset.nav;
      const icon = button.querySelector(".bottomNavIcon");
      if (!key || !icon || !ICONS[key]) return;

      icon.innerHTML = ICONS[key];

      const label = button.querySelector(":scope > span:not(.bottomNavIcon)");
      if (label) label.textContent = LABELS[key] || label.textContent;
    });

    return true;
  }

  if (install()) return;
  [0, 80, 250, 600, 1200, 2000].forEach(function (delay) {
    window.setTimeout(install, delay);
  });
})();
