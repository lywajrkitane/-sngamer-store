/* SNGAMER STORE — Admin premium HTML preload.
   Canonical admin asset injection. Business logic is untouched.

   IMPORTANT: /admin.html is the public/admin entry point used by Render and by
   the deployment documentation. The complete dashboard lives in
   admin-dashboard.html. Always serve that canonical full dashboard for both
   admin URLs so the seven workspaces are backed by the real sections instead
   of the legacy/minimal admin page.
*/
const express = require('express');
const fs = require('fs');
const path = require('path');
require('./admin-dashboard-data-preload');

const WORKSPACE_VERSION = '20261025-1200-canonical-full-dashboard1';
const DATA_VERSION = '20261025-1200-data-stable1';
const CLIENTS_VERSION = '20261025-1200-clients-stable1';
const DASHBOARD_DATA_VERSION = '20261025-1200-dashboard-data1';

function replaceScript(html, filename, version, attributes = '') {
  const escapedName = filename.replace(/\./g, '\\.');
  const pattern = new RegExp(
    '<script\\b[^>]*\\bsrc=["\\\'][^"\\\']*\\/' + escapedName + '(?:\\?[^"\\\']*)?["\\\'][^>]*>\\s*<\\/script>',
    'gi'
  );
  const tag = '<script src="/' + filename + '?v=' + version + '"' + attributes + '></script>';
  const existing = html.match(pattern);
  if (existing && existing.length) {
    let first = true;
    return html.replace(pattern, function () {
      if (first) { first = false; return tag; }
      return '';
    });
  }
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, tag + '</body>');
  return html + '\n' + tag + '\n';
}

function prepareAdminHtml(source) {
  let html = source;
  html = replaceScript(html, 'admin-v24-workspace.js', WORKSPACE_VERSION, ' onload="window.SNGAMER_ADMIN_WORKSPACE_BOOT&&window.SNGAMER_ADMIN_WORKSPACE_BOOT()"');
  html = replaceScript(html, 'admin-data-fix.js', DATA_VERSION);
  html = replaceScript(html, 'customer-admin.js', CLIENTS_VERSION, ' defer');
  html = replaceScript(html, 'admin-dashboard-data.js', DASHBOARD_DATA_VERSION);

  // Strip retired workspace controllers from any pre-existing HTML copy.
  html = html.replace(/<script\b[^>]*\bsrc=["'][^"']*\/admin-hero-workspace\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi, '');
  html = html.replace(/<script\b[^>]*\bsrc=["'][^"']*\/admin-section-workspace-v24\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi, '');

  if (!html.includes('premium-dialogs-v1.css')) {
    html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/premium-dialogs-v1.css?v=20261018-1835"></head>');
  }
  if (!html.includes('premium-dialogs-v1.js')) {
    html = html.replace(/<\/body>/i, '<script src="/premium-dialogs-v1.js?v=20261018-1835"></script></body>');
  }
  if (!html.includes('premium-select-guard-v1.js')) {
    html = html.replace(/<\/body>/i, '<script src="/premium-select-guard-v1.js?v=20261018-1835"></script></body>');
  }
  return html;
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
        if (req.method !== 'GET' || !['/admin.html', '/admin-dashboard.html'].includes(req.path)) return next();

        // Canonical source of truth: the complete dashboard. Never serve the
        // legacy/minimal admin.html to the production admin entry point.
        const canonicalFile = path.join(__dirname, '..', 'public', 'admin-dashboard.html');
        if (!fs.existsSync(canonicalFile)) return next();

        try {
          const html = prepareAdminHtml(fs.readFileSync(canonicalFile, 'utf8'));
          res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.set('Pragma', 'no-cache');
          res.set('Expires', '0');
          res.set('X-SNGAMER-Workspace-Version', WORKSPACE_VERSION);
          res.set('X-SNGAMER-Canonical-Admin', 'admin-dashboard.html');
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
