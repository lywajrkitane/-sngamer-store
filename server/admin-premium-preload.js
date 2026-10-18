/* SNGAMER STORE — Admin premium UI preload
   Runs after the existing admin/customer wrappers have assembled the Express stack.
   The previous premium preload could be placed behind the admin HTML injector, so
   native <select> sheets and browser confirm() dialogs were still visible in admin.
*/
const express = require('express');
const fs = require('fs');
const path = require('path');

if (!express.application.__sngAdminPremiumPreload) {
  express.application.__sngAdminPremiumPreload = true;
  const originalListen = express.application.listen;

  express.application.listen = function adminPremiumListen(...args) {
    const app = this;
    const stack = app._router && app._router.stack;

    if (stack && !app.__sngAdminPremiumInjected) {
      app.__sngAdminPremiumInjected = true;

      const injectAdminPremium = function (req, res, next) {
        if (req.method !== 'GET' || !['/admin.html', '/admin-dashboard.html'].includes(req.path)) {
          return next();
        }

        const filename = req.path.slice(1);
        const file = path.join(__dirname, '..', 'public', filename);
        if (!fs.existsSync(file)) return next();

        try {
          let html = fs.readFileSync(file, 'utf8');

          if (!html.includes('premium-dialogs-v1.css')) {
            html = html.replace(
              /<\/head>/i,
              '<link rel="stylesheet" href="/premium-dialogs-v1.css?v=20261018-1615"></head>'
            );
          }

          if (!html.includes('premium-dialogs-v1.js')) {
            html = html.replace(
              /<\/body>/i,
              '<script src="/premium-dialogs-v1.js?v=20261018-1615"></script></body>'
            );
          }

          // Replace legacy synchronous confirmation windows with the premium async dialog.
          html = html.replace(
            /if\s*\(!confirm\(([^;]*?)\)\)\s*return;/g,
            'if (!(await window.sngPremiumConfirm($1))) return;'
          );

          res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.set('Pragma', 'no-cache');
          res.set('Expires', '0');
          return res.type('html').send(html);
        } catch (error) {
          console.error('ADMIN_PREMIUM_HTML_INJECTION_ERROR:', error);
          return next();
        }
      };

      const router = express.Router();
      router.use(injectAdminPremium);

      // This wrapper is intentionally the outermost listen hook. Put the premium
      // admin route at the very front so older admin HTML injectors cannot win first.
      stack.unshift(...(router.stack || []));
    }

    return originalListen.apply(this, args);
  };
}
