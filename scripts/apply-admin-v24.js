const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'public');
const files = ['admin.html', 'admin-dashboard.html'];
const scriptTag = '<script src="/admin-v24-workspace.js?v=20261017-0735"></script>';

for (const file of files) {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) continue;

  let html = fs.readFileSync(target, 'utf8');

  // Keep exactly one authoritative workspace controller.
  html = html.replace(/\s*<script[^>]+admin-v24-workspace\.js[^>]*><\/script>/gi, '');
  html = html.replace(/\s*<script[^>]+admin-section-workspace-v24\.js[^>]*><\/script>/gi, '');
  html = html.replace(/\s*<script[^>]+admin-v25-workspace\.js[^>]*><\/script>/gi, '');

  const bodyClose = /<\/body>\s*<\/html>\s*$/i;
  if (!bodyClose.test(html)) {
    throw new Error(`Impossible de trouver </body> dans ${file}`);
  }

  html = html.replace(bodyClose, `\n${scriptTag}\n</body>\n</html>`);
  fs.writeFileSync(target, html, 'utf8');
  console.log(`ADMIN V2.6 isolated workspace injected into ${file}`);
}
