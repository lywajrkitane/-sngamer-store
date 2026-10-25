/* SNGAMER STORE — dedicated HERO workspace preload
   Injects the Hero navigation control into both admin pages at source level.
   The client controller handles the actual workspace switching.

   Also mounts the non-destructive admin runtime rescue guard. The guard does
   not replace any existing admin logic; it only recovers the workspace/data
   loader if a browser or intermediary serves the legacy dashboard shell.
*/
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'public');
const files = ['admin.html', 'admin-dashboard.html'];
const scriptTag = '<script src="/admin-hero-workspace.js?v=20261024-hero-workspace1"></script>';
const rescueTag = '<script src="/admin-runtime-rescue.js?v=20261025-runtime-rescue1"></script>';

function patch(file) {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) return;
  let html = fs.readFileSync(target, 'utf8');

  if (!html.includes('/admin-hero-workspace.js')) {
    const workspaceTag = /<script[^>]+\/admin-v24-workspace\.js[^>]*><\/script>/i;
    if (workspaceTag.test(html)) {
      html = html.replace(workspaceTag, match => `${match}\n${scriptTag}`);
    } else if (html.includes('</body>')) {
      html = html.replace('</body>', `${scriptTag}</body>`);
    } else {
      html += `\n${scriptTag}\n`;
    }
  }

  if (!html.includes('/admin-runtime-rescue.js')) {
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${rescueTag}</body>`);
    } else {
      html += `\n${rescueTag}\n`;
    }
  }

  fs.writeFileSync(target, html, 'utf8');
}

for (const file of files) {
  try { patch(file); } catch (error) {
    console.error('ADMIN_HERO_WORKSPACE_PRELOAD_ERROR:', file, error);
  }
}
