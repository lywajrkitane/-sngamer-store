const fs = require('fs');
const path = require('path');

if (!global.__sngFavoritesHorizontalPreloadV1) {
  global.__sngFavoritesHorizontalPreloadV1 = true;
  const originalReadFileSync = fs.readFileSync;
  fs.readFileSync = function patchedReadFileSync(file, options) {
    const value = originalReadFileSync.call(this, file, options);
    try {
      const filePath = String(file || '');
      if (!/public[\\/]index\.html$/i.test(filePath)) return value;
      if (typeof value !== 'string') return value;
      if (value.includes('/customer-favorites-horizontal-v1.js')) return value;
      const tag = '<script src="/customer-favorites-horizontal-v1.js?v=20261025-favorites1" defer></script>';
      return value.replace(/<\/body>/i, `${tag}</body>`);
    } catch (_) {
      return value;
    }
  };
}
