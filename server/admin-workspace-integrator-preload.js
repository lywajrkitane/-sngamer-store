/* SNGAMER STORE — ADMIN WORKSPACE INTEGRATOR
   Source-level integration for the two existing dedicated workspaces
   plus the responsive orders presentation.
   Keeps the main workspace controller and order data logic untouched.
*/
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const FILES = ['admin.html', 'admin-dashboard.html'];
const HERO = '<script src="/admin-hero-workspace.js?v=20261025-hero"></script>';
const CLIENTS = '<script src="/customer-admin.js?v=20261025-clients"></script>';
const ORDERS = '<script src="/admin-orders-responsive.js?v=20261025-orders-premium"></script>';
const UI_STABILITY = '<script src="/admin-ui-stability-fix.js?v=20261025-ui2"></script>';

function patch(fileName) {
  const file = path.join(PUBLIC, fileName);
  if (!fs.existsSync(file)) return;

  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (!html.includes('/admin-hero-workspace.js')) {
    const anchor = /<script[^>]+\/admin-v24-workspace\.js[^>]*><\/script>/i;
    if (anchor.test(html)) html = html.replace(anchor, m => `${m}\n${HERO}`);
    else html = html.replace(/<\/body>/i, `${HERO}</body>`);
    changed = true;
  }

  if (!html.includes('/customer-admin.js')) {
    html = html.replace(/<\/body>/i, `${CLIENTS}</body>`);
    changed = true;
  }

  if (!html.includes('/admin-orders-responsive.js')) {
    html = html.replace(/<\/body>/i, `${ORDERS}</body>`);
    changed = true;
  }

  if (!html.includes('/admin-ui-stability-fix.js')) {
    html = html.replace(/<\/body>/i, `${UI_STABILITY}</body>`);
    changed = true;
  }

  if (changed) fs.writeFileSync(file, html, 'utf8');
}

for (const file of FILES) {
  try {
    patch(file);
  } catch (error) {
    console.error('ADMIN_WORKSPACE_INTEGRATOR_ERROR:', file, error);
  }
}
