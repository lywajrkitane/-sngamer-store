/* SNGAMER STORE — ADMIN DATA FIX PRELOAD
   Adds the client-side admin data fix and the dedicated refund UI to both
   admin pages before bootstrap.js rewrites/injects the workspace controller.
*/
const fs = require('fs');

if (!fs.__sngAdminDataFixPreload) {
  fs.__sngAdminDataFixPreload = true;
  const originalReadFileSync = fs.readFileSync.bind(fs);

  fs.readFileSync = function (file, ...args) {
    let content = originalReadFileSync(file, ...args);
    if (typeof content !== 'string') return content;

    const name = String(file);
    if (!/(?:^|[\\/])public[\\/]admin(?:-dashboard)?\.html$/i.test(name)) {
      return content;
    }

    if (!/<\/body>/i.test(content)) return content;

    const tags = [
      '<script src="/admin-data-fix.js?v=20261018-1220"></script>',
      '<script src="/admin-refund-ui.js?v=20261018-1258"></script>'
    ];

    for (const tag of tags) {
      const srcMatch = tag.match(/src="([^"]+)"/i);
      const src = srcMatch ? srcMatch[1].split('?')[0] : '';
      if (!src || content.includes(src)) continue;
      content = content.replace(/<\/body>/i, `${tag}\n</body>`);
    }

    return content;
  };
}
