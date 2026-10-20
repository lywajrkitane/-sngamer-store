'use strict';

const fs = require('fs');
const path = require('path');

// The admin pages are ultimately read from /public by bootstrap.js. Patch the
// source HTML itself so the reset control is guaranteed to load, independently
// of Express middleware ordering or response wrappers.
function patchAdminHtmlFiles() {
  try {
    const root = path.join(__dirname, '..', 'public');
    for (const filename of ['admin.html', 'admin-dashboard.html']) {
      const file = path.join(root, filename);
      if (!fs.existsSync(file)) continue;
      let html = fs.readFileSync(file, 'utf8');
      if (!html.includes('/analytics-reset-admin.js')) {
        const tag = '<script src="/analytics-reset-admin.js?v=20261020-reset2" defer></script>';
        html = html.replace(/<\/body>/i, `${tag}</body>`);
        fs.writeFileSync(file, html, 'utf8');
      }
    }
  } catch (error) {
    console.error('ANALYTICS_BASELINE_UI_FILE_PATCH_ERROR:', error.message);
  }
}

patchAdminHtmlFiles();
