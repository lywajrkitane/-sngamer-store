'use strict';

const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
const publicDir = path.join(__dirname, '..', 'public');
const adminMetaFile = path.join(publicDir, 'product-meta-admin.js');
const appFile = path.join(publicDir, 'app.js');
const adminDashboardFile = path.join(publicDir, 'admin-dashboard.html');
const marker = 'SNGAMER_PRODUCT_META_V3_DIGITAL';

function patchFile(file, patcher, label) {
  try {
    if (!fs.existsSync(file)) return;
    let text = fs.readFileSync(file, 'utf8');
    if (text.includes(marker)) return;
    const next = patcher(text);
    if (next !== text) {
      fs.writeFileSync(file, `/* ${marker} */\n${next}`, 'utf8');
      console.log(`${marker}: ${label} patched`);
    } else {
      console.warn(`${marker}: ${label} anchors not found`);
    }
  } catch (error) {
    console.error(`${marker}: ${label} patch error`, error);
  }
}

patchFile(serverFile, text => text.replace(
  /!\["Neuf", "Occasion", "Reconditionné"\]\.includes\(conditionValue\)/g,
  '!["Neuf", "Occasion", "Reconditionné", "Produit numérique"].includes(conditionValue)'
), 'server validation');

patchFile(adminMetaFile, text => text.replace(
  "const CONDITION_OPTIONS = ['Neuf', 'Occasion', 'Reconditionné'];",
  "const CONDITION_OPTIONS = ['Neuf', 'Occasion', 'Reconditionné', 'Produit numérique'];"
), 'product create form');

patchFile(adminDashboardFile, text => {
  let next = text;
  next = next.replace(
    '<option value="Reconditionné">Reconditionné</option>',
    '<option value="Reconditionné">Reconditionné</option>\n        <option value="Produit numérique">Produit numérique</option>'
  );
  next = next.replace(
    '["Neuf", "Occasion", "Reconditionné"].includes(product.product_condition)',
    '["Neuf", "Occasion", "Reconditionné", "Produit numérique"].includes(product.product_condition)'
  );
  return next;
}, 'product edit form');

patchFile(appFile, text => {
  let next = text;
  next = next.replace(
    'const productCondition=["Neuf","Occasion","Reconditionné"].includes(String(p.product_condition||"Neuf"))\n    ? String(p.product_condition||"Neuf") : "Neuf";',
    'const productConditionOptions=["Neuf","Occasion","Reconditionné","Produit numérique"];\n  const productCondition=productConditionOptions.includes(String(p.product_condition||"Neuf"))\n    ? String(p.product_condition||"Neuf") : "Neuf";'
  );
  next = next.replace(
    '<span class="sngAssuranceIcon" aria-hidden="true">📦</span>\n        <div class="sngAssuranceCopy">\n          <span class="sngAssuranceEyebrow">ÉTAT DU PRODUIT</span>\n          <strong>${escapeHtml(productCondition)}</strong>',
    '<span class="sngAssuranceIcon" aria-hidden="true">${productCondition === "Produit numérique" ? "💻" : "📦"}</span>\n        <div class="sngAssuranceCopy">\n          <span class="sngAssuranceEyebrow">${productCondition === "Produit numérique" ? "TYPE DE PRODUIT" : "ÉTAT DU PRODUIT"}</span>\n          <strong>${escapeHtml(productCondition)}</strong>'
  );
  return next;
}, 'storefront product metadata');
