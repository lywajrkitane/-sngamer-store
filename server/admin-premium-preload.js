/* SNGAMER STORE — Admin premium HTML delivery
   This middleware serves admin pages before static files. Keep its HTML in
   sync with the main workspace controller: this early response would
   otherwise bypass the later bootstrap HTML injector.
*/
const express = require('express');
const fs = require('fs');
const path = require('path');

const ADMIN_SCRIPTS = [
  ['admin-v24-workspace.js', '<script src="/admin-v24-workspace.js?v=20261025-recover1"></script>'],
  ['admin-data-fix.js', '<script src="/admin-data-fix.js?v=20261025-recover1"></script>'],
  ['premium-dialogs-v1.js', '<script src="/premium-dialogs-v1.js?v=20261018-1835"></script>'],
  ['premium-select-guard-v1.js', '<script src="/premium-select-guard-v1.js?v=20261018-1835"></script>'],
  ['customer-admin.js', '<script src="/customer-admin.js?v=20261025-client-workspace2" defer></script>'],
  ['admin-hero-workspace.js', '<script src="/admin-hero-workspace.js?v=20261024-hero-workspace1"></script>'],
  ['admin-runtime-rescue.js', '<script src="/admin-runtime-rescue.js?v=20261025-runtime-rescue1"></script>']
];

function removeScriptTags(html, filename) {
  const escaped = filename.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<script\\b[^>]*\\bsrc=["'][^"']*${escaped}(?:\\?[^"']*)?["'][^>]*>\\s*<\\/script>`,
    'gi'
  );
  return html.replace(pattern, '');
}

function insertBeforeClosingTag(html, tagName, content) {
  const marker = `</${tagName}>`;
  const index = html.toLowerCase().lastIndexOf(marker);
  if (index < 0) return html + String.fromCharCode(10) + content + String.fromCharCode(10);
  return html.slice(0, index) + content + '\\n' + html.slice(index);
}

function prepareAdminHtml(source) {
  let html = source;

  // Replace stale or duplicate copies, then add one canonical ordered set.
  for (const [filename] of ADMIN_SCRIPTS) {
    html = removeScriptTags(html, filename);
  }

  const scripts = ADMIN_SCRIPTS.map(([, tag]) => tag).join(String.fromCharCode(10));
  return insertBeforeClosingTag(html, 'body', scripts);
}

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
            const css = '<link rel="stylesheet" href="/premium-dialogs-v1.css?v=20261018-1835">';
            html = insertBeforeClosingTag(html, 'head', css);
          }

          html = prepareAdminHtml(html);
          res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.set('Pragma', 'no-cache');
          res.set('Expires', '0');
          res.set('X-SNGAMER-Admin-Workspace', 'canonical-v1');
          return res.type('html').send(html);
        } catch (error) {
          console.error('ADMIN_PREMIUM_HTML_INJECTION_ERROR:', error);
          return next();
        }
      };

      const router = express.Router();
      router.use(injectAdminPremium);
      stack.unshift(...(router.stack || []));
    }

    return originalListen.apply(this, args);
  };
}
