'use strict';

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'public', 'admin-dashboard.html');
const marker = 'SNGAMER_CATALOG_ADMIN_UI_V1';
const script = '<script src="/catalog-admin-ui.js?v=20261022-univers1"></script>';

try {
  if (fs.existsSync(file)) {
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes(marker)) {
      html = html.replace(/<\/body>/i, `${script}\n<!-- ${marker} -->\n</body>`);
      fs.writeFileSync(file, html, 'utf8');
    }
  }
} catch (error) {
  console.error('CATALOG_ADMIN_UI_PRELOAD_ERROR:', error);
}
