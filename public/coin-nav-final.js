/* SNGAMER STORE — final Pièces eFootball navigation icon
   One premium monochrome coin with € + the exact active floating treatment used by the other categories.
   This file intentionally runs after the older navigation patches so there is one source of truth for the coin icon.
*/
(function () {
  "use strict";

  function install() {
    if (!document.getElementById("sngamerCoinFinalStyles")) {
      const style = document.createElement("style");
      style.id = "sngamerCoinFinalStyles";
      style.textContent = `
        @media (max-width:700px){
          #mobileBottomNav .bottomNavItem[data-nav="coins"] .bottomNavIcon{
            position:relative !important;
            display:grid !important;
            place-items:center !important;
            width:38px !important;
            height:38px !important;
            flex-basis:38px !important;
            overflow:visible !important;
            color:#fff !important;
            background:none !important;
            border:0 !important;
            border-radius:18px !important;
            box-shadow:none !important;
            transform:none !important;
            filter:none !important;
          }

          #mobileBottomNav .bottomNavItem[data-nav="coins"] .bottomNavIcon svg{
            display:block !important;
            width:30px !important;
            height:30px !important;
            overflow:visible !important;
            color:#fff !important;
            stroke:currentColor !important;
            fill:none !important;
            position:relative !important;
            z-index:5 !important;
            filter:none !important;
          }

          #mobileBottomNav .bottomNavItem[data-nav="coins"] .bottomNavIcon::after{
            content:none !important;
            display:none !important;
          }

          #mobileBottomNav .bottomNavItem[data-nav="coins"] .bottomNavIcon::before{
            content:"" !important;
            display:none !important;
          }

          /* Active state: same 58px floating premium frame and glow language as Gaming Phone. */
          #mobileBottomNav .bottomNavItem.active[data-nav="coins"] .bottomNavIcon{
            width:58px !important;
            height:58px !important;
            flex-basis:58px !important;
            background:linear-gradient(145deg,rgba(24,139,255,.28),rgba(124,58,237,.34)) !important;
            border:1px solid rgba(92,194,255,.98) !important;
            box-shadow:0 0 12px rgba(28,150,255,.55),0 0 30px rgba(28,150,255,.28),0 0 54px rgba(124,58,237,.18),inset 0 0 20px rgba(109,205,255,.10) !important;
            transform:translateY(-2px) !important;
            animation:sngCoinFinalPulse 2.2s ease-in-out infinite !important;
            will-change:box-shadow,border-color;
          }

          /* Exactly one rotating luminous outline around the active icon. */
          #mobileBottomNav .bottomNavItem.active[data-nav="coins"] .bottomNavIcon::before{
            content:"" !important;
            display:block !important;
            position:absolute !important;
            inset:-4px !important;
            width:auto !important;
            height:auto !important;
            border:0 !important;
            border-radius:22px !important;
            padding:1px !important;
            background:conic-gradient(from 0deg,rgba(90,184,255,0),rgba(90,184,255,.95),rgba(138,92,255,.95),rgba(90,184,255,0)) !important;
            -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0) !important;
            -webkit-mask-composite:xor !important;
            mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0) !important;
            mask-composite:exclude !important;
            animation:sngCoinFinalOrbit 2.4s linear infinite !important;
            pointer-events:none !important;
            z-index:4 !important;
            box-shadow:0 0 16px rgba(90,184,255,.30) !important;
            filter:none !important;
          }

          #mobileBottomNav .bottomNavItem.active[data-nav="coins"] .bottomNavIcon svg{
            width:32px !important;
            height:32px !important;
          }

          @keyframes sngCoinFinalOrbit{to{transform:rotate(360deg)}}
          @keyframes sngCoinFinalPulse{
            0%,100%{
              border-color:rgba(90,184,255,.82) !important;
              box-shadow:0 0 9px rgba(22,135,255,.42),0 0 20px rgba(22,135,255,.22),inset 0 0 12px rgba(90,184,255,.10) !important;
            }
            50%{
              border-color:rgba(123,210,255,1) !important;
              box-shadow:0 0 14px rgba(22,135,255,.68),0 0 34px rgba(22,135,255,.34),0 0 52px rgba(124,58,237,.16),inset 0 0 16px rgba(90,184,255,.16) !important;
            }
          }

          @media(prefers-reduced-motion:reduce){
            #mobileBottomNav .bottomNavItem.active[data-nav="coins"] .bottomNavIcon,
            #mobileBottomNav .bottomNavItem.active[data-nav="coins"] .bottomNavIcon::before{
              animation:none !important;
            }
          }
        }
      `;
      document.head.appendChild(style);
    }

    const icon = document.querySelector('#mobileBottomNav .bottomNavItem[data-nav="coins"] .bottomNavIcon');
    if (!icon) return false;

    icon.innerHTML = `
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <ellipse cx="24" cy="15" rx="13.5" ry="5.5" fill="currentColor" opacity=".16"></ellipse>
        <path d="M10.5 15v9.5c0 3.05 6.04 5.5 13.5 5.5s13.5-2.45 13.5-5.5V15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"></path>
        <ellipse cx="24" cy="15" rx="13.5" ry="5.5" fill="none" stroke="currentColor" stroke-width="2.5"></ellipse>
        <path d="M15.5 29.2v2.2c0 3.05 3.8 5.1 8.5 5.1s8.5-2.05 8.5-5.1v-2.2" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" opacity=".78"></path>
        <text x="24" y="16.1" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-family="Arial,sans-serif" font-size="9" font-weight="900">€</text>
      </svg>
    `;

    return true;
  }

  if (install()) return;
  const delays = [0, 100, 300, 700, 1400];
  delays.forEach(function (delay) {
    window.setTimeout(install, delay);
  });
})();
