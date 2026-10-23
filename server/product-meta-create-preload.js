'use strict';

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'server.js');
const marker = 'SNGAMER_PRODUCT_META_CREATE_V1';

try {
  if (!fs.existsSync(file)) return;

  let text = fs.readFileSync(file, 'utf8');
  if (text.includes(marker)) return;

  let changed = false;

  const bodyPattern = /  campaign_id,\n?\} = req\.body;/;
  if (bodyPattern.test(text)) {
    text = text.replace(bodyPattern, `  campaign_id,\n  product_condition,\n  warranty,\n  warranty_configured\n} = req.body;`);
    changed = true;
  }

  const pEndPattern = /  campaign_id:\n    campaign_id !== null && campaign_id !== undefined && campaign_id !== ""\n      \? Number\(campaign_id\)\n      : null\n  \};/;
  if (pEndPattern.test(text)) {
    text = text.replace(pEndPattern, `  campaign_id:\n    campaign_id !== null && campaign_id !== undefined && campaign_id !== ""\n      ? Number(campaign_id)\n      : null,\n  product_condition: ["Neuf", "Occasion", "Reconditionné"].includes(String(product_condition || "Neuf"))\n    ? String(product_condition || "Neuf")\n    : "Neuf",\n  warranty: String(warranty || "").trim() || "Aucune garantie",\n  warranty_configured: Boolean(warranty_configured) && Boolean(String(warranty || "").trim())\n  };`);
    changed = true;
  }

  const insertColumnsPattern = /      promo_active,\n      campaign_id\n    \)\n  VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10\)/;
  if (insertColumnsPattern.test(text)) {
    text = text.replace(insertColumnsPattern, `      promo_active,\n      campaign_id,\n      product_condition,\n      warranty,\n      warranty_configured\n    )\n  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`);
    changed = true;
  }

  const valuesPattern = /    p\.promo_active,\n    p\.campaign_id\n  \]\n    \);/;
  if (valuesPattern.test(text)) {
    text = text.replace(valuesPattern, `    p.promo_active,\n    p.campaign_id,\n    p.product_condition,\n    p.warranty,\n    p.warranty_configured\n  ]\n    );`);
    changed = true;
  }

  if (changed) {
    text = `/* ${marker} */\n` + text;
    fs.writeFileSync(file, text, 'utf8');
    console.log('SNGAMER_PRODUCT_META_CREATE_V1: create route patched');
  } else {
    console.warn('SNGAMER_PRODUCT_META_CREATE_V1: expected create-route anchors not found');
  }
} catch (error) {
  console.error('PRODUCT_META_CREATE_PRELOAD_ERROR:', error);
}
