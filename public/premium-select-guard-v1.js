/* SNGAMER STORE — Native <select> guard
   Prevents Android/Chrome native select sheets from appearing on admin screens.
   Delegates every single-select to the SNGAMER premium sheet. */
(function () {
  'use strict';
  if (window.__sngPremiumSelectGuardV1) return;
  window.__sngPremiumSelectGuardV1 = true;

  const STYLE_ID = 'sng-premium-select-guard-style';
  const ROOT_ID = 'sngPremiumSelectGuardRoot';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .sng-native-guarded{appearance:none!important;-webkit-appearance:none!important;background-image:none!important}
      body.sng-native-sheet-lock{overflow:hidden!important}
      #${ROOT_ID}{position:fixed;inset:0;z-index:2147483646;pointer-events:none}
      .sng-ng-backdrop{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,6,14,.76);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);opacity:0;transition:opacity .18s ease;pointer-events:auto}
      .sng-ng-backdrop.open{opacity:1}
      .sng-ng-sheet{width:min(480px,calc(100vw - 28px));max-height:min(78vh,650px);overflow:auto;padding:10px;border-radius:26px;border:1px solid rgba(95,151,255,.38);background:linear-gradient(145deg,#121e31,#070d18);box-shadow:0 30px 100px rgba(0,0,0,.72),0 0 60px rgba(77,100,255,.18);transform:translateY(18px) scale(.98);transition:transform .24s cubic-bezier(.22,1,.36,1)}
      .sng-ng-backdrop.open .sng-ng-sheet{transform:none}
      .sng-ng-kicker{padding:8px 12px 10px;color:#8fa4c3;font:900 11px/1.2 Arial,sans-serif;text-transform:uppercase;letter-spacing:.12em}
      .sng-ng-option{width:100%;min-height:52px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;margin:3px 0;border:1px solid transparent;border-radius:15px;background:transparent;color:#f5f7ff;text-align:left;font:700 15px/1.2 Arial,sans-serif;cursor:pointer}
      .sng-ng-option:active{transform:scale(.99)}
      .sng-ng-option.selected{background:linear-gradient(90deg,rgba(44,122,255,.2),rgba(128,61,255,.16));border-color:rgba(86,139,255,.24)}
      .sng-ng-check{width:23px;height:23px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(164,181,211,.35);color:transparent;flex:0 0 23px}
      .sng-ng-option.selected .sng-ng-check{border:0;color:#fff;background:linear-gradient(135deg,#247eff,#8d3fff);box-shadow:0 5px 18px rgba(79,91,255,.3)}
      @media(max-width:520px){.sng-ng-backdrop{align-items:flex-end;padding:10px}.sng-ng-sheet{width:100%;max-height:78vh;border-radius:26px 26px 18px 18px}}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function root() {
    let r = document.getElementById(ROOT_ID);
    if (!r) { r = document.createElement('div'); r.id = ROOT_ID; document.body.appendChild(r); }
    return r;
  }

  function close(backdrop) {
    if (!backdrop) return;
    backdrop.classList.remove('open');
    document.body.classList.remove('sng-native-sheet-lock');
    setTimeout(() => backdrop.remove(), 190);
  }

  function openSheet(select) {
    if (!select || select.disabled || select.multiple) return;
    const r = root();
    r.innerHTML = '';
    const b = document.createElement('div');
    b.className = 'sng-ng-backdrop';
    const label = select.getAttribute('aria-label') || select.dataset.label || select.closest('label')?.childNodes?.[0]?.textContent?.trim() || 'Choisir une option';
    const buttons = Array.from(select.options).map((option, index) => `
      <button type="button" class="sng-ng-option ${index === select.selectedIndex ? 'selected' : ''}" data-index="${index}">
        <span>${esc(option.textContent.trim())}</span><span class="sng-ng-check">✓</span>
      </button>`).join('');
    b.innerHTML = `<div class="sng-ng-sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}"><div class="sng-ng-kicker">${esc(label)}</div>${buttons}</div>`;
    r.appendChild(b);
    document.body.classList.add('sng-native-sheet-lock');
    requestAnimationFrame(() => b.classList.add('open'));
    b.querySelectorAll('.sng-ng-option').forEach(btn => btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index);
      select.selectedIndex = index;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      close(b);
    }));
    b.addEventListener('click', e => { if (e.target === b) close(b); });
  }

  function boot() {
    ensureStyle();
    const block = (event) => {
      const select = event.target && event.target.closest ? event.target.closest('select') : null;
      if (!select || select.multiple || select.disabled) return;
      if (!select.classList.contains('sngpd-native')) {
        event.preventDefault();
        event.stopPropagation();
        openSheet(select);
      }
    };
    document.addEventListener('pointerdown', block, true);
    document.addEventListener('mousedown', block, true);
    document.addEventListener('touchstart', block, { capture: true, passive: false });
    document.addEventListener('click', block, true);
    document.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && document.activeElement?.tagName === 'SELECT') {
        event.preventDefault();
        event.stopPropagation();
        openSheet(document.activeElement);
      }
      if (event.key === 'Escape') {
        const b = document.querySelector('.sng-ng-backdrop');
        if (b) close(b);
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
