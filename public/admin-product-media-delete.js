(function () {
  'use strict';

  if (window.__sngAdminProductMediaDeleteV1) return;
  window.__sngAdminProductMediaDeleteV1 = true;

  const MEDIA = [
    ['editProductImage1', 'editProductImage1Preview', 'image1'],
    ['editProductImage2', 'editProductImage2Preview', 'image2'],
    ['editProductImage3', 'editProductImage3Preview', 'image3'],
    ['editProductVideo', 'editProductVideoPreview', 'video']
  ];

  function productId() {
    return Number(document.getElementById('editProductId')?.value || 0);
  }

  function currentUrl(preview) {
    const media = preview?.querySelector('img, video, source');
    if (!media) return '';
    return media.currentSrc || media.src || media.getAttribute('src') || '';
  }

  function showEmpty(preview) {
    preview.innerHTML = '<p class="edit-media-empty">Aucun média enregistré.</p>';
  }

  function clearInput(input) {
    if (input) input.value = '';
  }

  function addStyles() {
    if (document.getElementById('sngMediaDeleteStyles')) return;
    const style = document.createElement('style');
    style.id = 'sngMediaDeleteStyles';
    style.textContent = `
      .sng-media-delete-wrap{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;flex-wrap:wrap}
      .sng-media-delete-btn{border:1px solid rgba(255,82,82,.38);background:rgba(120,20,28,.18);color:#ff9b9b;border-radius:10px;padding:8px 12px;font-weight:700;cursor:pointer}
      .sng-media-delete-btn:hover{background:rgba(180,30,40,.28);border-color:rgba(255,100,100,.62)}
      .sng-media-delete-btn:disabled{opacity:.55;cursor:wait}
      .sng-media-delete-note{font-size:12px;color:#8fa0b5}
    `;
    document.head.appendChild(style);
  }

  async function deleteMedia(input, preview, slot, button) {
    const id = productId();
    if (!id) {
      alert('Impossible d’identifier le produit.');
      return;
    }

    const url = currentUrl(preview);
    if (!url) {
      clearInput(input);
      showEmpty(preview);
      return;
    }

    if (!confirm('Supprimer définitivement ce média du produit ?')) return;

    button.disabled = true;
    button.textContent = 'Suppression…';

    try {
      const response = await fetch('/api/admin/products/' + encodeURIComponent(id) + '/media/' + slot, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de supprimer le média.');

      clearInput(input);
      showEmpty(preview);
      preview.dataset.sngMediaDeleted = '1';
      preview.dataset.sngMediaUrl = '';
      button.closest('.sng-media-delete-wrap')?.remove();
    } catch (error) {
      alert(error.message || 'Impossible de supprimer le média.');
      button.disabled = false;
      button.textContent = '🗑️ Supprimer';
    }
  }

  function enhance(inputId, previewId, slot) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    const existing = preview.parentElement?.querySelector('.sng-media-delete-wrap[data-slot="' + slot + '"]');
    const url = currentUrl(preview);

    if (!url) {
      existing?.remove();
      return;
    }

    if (existing) return;

    const wrap = document.createElement('div');
    wrap.className = 'sng-media-delete-wrap';
    wrap.dataset.slot = slot;

    const note = document.createElement('span');
    note.className = 'sng-media-delete-note';
    note.textContent = 'Média actuel';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sng-media-delete-btn';
    button.textContent = '🗑️ Supprimer';
    button.addEventListener('click', () => deleteMedia(input, preview, slot, button));

    wrap.append(note, button);
    preview.insertAdjacentElement('afterend', wrap);
  }

  function init() {
    addStyles();

    const modal = document.getElementById('editProductModal');
    if (!modal) return;

    const refresh = () => {
      if (!modal.classList.contains('show')) return;
      MEDIA.forEach(item => enhance(item[0], item[1], item[2]));
    };

    const observer = new MutationObserver(refresh);
    observer.observe(modal, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    MEDIA.forEach(([inputId]) => {
      const input = document.getElementById(inputId);
      if (input) input.addEventListener('change', () => setTimeout(refresh, 0));
    });

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
