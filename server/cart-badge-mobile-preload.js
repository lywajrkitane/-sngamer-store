/* SNGAMER STORE — inject the independent mobile cart badge before storefront HTML is built. */
const fs = require("fs");
const path = require("path");

const originalReadFileSync = fs.readFileSync;
const INDEX_NAME = path.join("public", "index.html");
const SCRIPT_TAG = '<script src="cart-badge-mobile-fix.js?v=20261028-cartbadge1"></script>';

fs.readFileSync = function patchedReadFileSync(file, options) {
  const result = originalReadFileSync.apply(fs, arguments);
  try {
    const filename = String(file && file.toString ? file.toString() : file);
    if (!filename.endsWith(INDEX_NAME)) return result;
    const encoding = typeof options === "string" ? options : options && options.encoding;
    if (encoding !== "utf8" && encoding !== "utf-8") return result;
    const html = String(result);
    if (html.includes("cart-badge-mobile-fix.js")) return result;
    return html.replace(/<\/body>/i, SCRIPT_TAG + "</body>");
  } catch (_) {
    return result;
  }
};
