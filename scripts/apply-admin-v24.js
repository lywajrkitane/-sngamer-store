const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'public');
const files = ['admin.html', 'admin-dashboard.html'];
const scriptTag = '<script src="/admin-v24-workspace.js?v=20261016-2024"></script>';

for (const file of files) {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) continue;

  let html = fs.readFileSync(target, 'utf8');

  // Remove older copies so repeated Render builds stay clean and deterministic.
  html = html.replace(/\s*<script[^>]+admin-v24-workspace\.js[^>]*><\/script>/gi, '');

  const bodyClose = /<\/body>\s*<\/html>\s*$/i;
  if (!bodyClose.test(html)) {
    throw new Error(`Impossible de trouver </body> dans ${file}`);
  }

  html = html.replace(bodyClose, `\n${scriptTag}\n</body>\n</html>`);
  fs.writeFileSync(target, html, 'utf8');
  console.log(`ADMIN V2.4 workspace injected into ${file}`);
}
