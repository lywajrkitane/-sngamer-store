/* SNGAMER STORE — ADMIN DATA FIX PRELOAD
   Adds the client-side admin data fix to both admin pages before bootstrap.js
   rewrites/injects the workspace controller. This avoids another admin HTML
   controller and keeps the existing workspace UI/status logic untouched.
*/
const fs = require('fs');

if (!fs.__sngAdminDataFixPreload) {
  fs.__sngAdminDataFixPreload = true;
  const originalReadFileSync = fs.readFileSync.bind(fs);

  fs.readFileSync = function (file, ...args) {
    const content = originalReadFileSync(file, ...args);
    if (typeof content !== 'string') return content;

    const name = String(file);
    if (!/(?:^|[\\/])public[\\/]admin(?:-dashboard)?\.html$/i.test(name)) {
      return content;
    }

    const tag = '<script src="/admin-data-fix.js?v=20261018-1215"></script>';
    if (content.includes('/admin-data-fix.js')) return content;
    if (!/<\/body>/i.test(content)) return content;

    return content.replace(/<\/body>/i, `${tag}\n</body>`);
  };
}
