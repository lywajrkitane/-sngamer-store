/* SNGAMER STORE — inject catalog recovery only before storefront HTML is built. */
const fs = require("fs");
const path = require("path");

const originalReadFileSync = fs.readFileSync;
const INDEX_NAME = path.join("public", "index.html");
const SCRIPT_TAG = '<script src="catalog-recovery-v1.js?v=20261028-catalog1"></script>';

fs.readFileSync = function patchedReadFileSync(file, options) {
  const result = originalReadFileSync.apply(fs, arguments);
  try {
    const filename = String(file && file.toString ? file.toString() : file);
    if (!filename.endsWith(INDEX_NAME)) return result;
    const encoding = typeof options === "string" ? options : options && options.encoding;
    if (encoding !== "utf8" && encoding !== "utf-8") return result;
    const html = String(result);
    if (html.includes("catalog-recovery-v1.js")) return result;
    return html.replace(/<\/body>/i, SCRIPT_TAG + "</body>");
  } catch (_) {
    return result;
  }
};
