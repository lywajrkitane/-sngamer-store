const fs = require("fs");
const path = require("path");
const express = require("express");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");

/*
 * SNGAMER STORE — hero must never disappear while the dynamic carousel loads.
 * The previous first-paint guard hid the only visible mobile hero paragraph and
 * left a large empty block whenever home-hero.js was delayed, cached or failed.
 */
const HERO_SCRIPT = `<script src="/home-hero.js?v=20261028-stable1" defer data-sngamer-home-hero="true"></script>`;

function ensureScript(html) {
  html = html.replace(/<style[^>]*id=["']sngamer-home-hero-first-paint["'][^>]*>[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<script[^>]*data-sngamer-home-hero=["']true["'][^>]*><\/script>/gi, "");
  html = html.replace(/<script[^>]*src=["'][^"']*\/home-hero\.js[^"']*["'][^>]*><\/script>/gi, "");
  html = html.replace(/<\/head>/i, HERO_SCRIPT + "</head>");
  return html;
}

function prepareIndex() {
  if (!fs.existsSync(INDEX_FILE)) return;
  const original = fs.readFileSync(INDEX_FILE, "utf8");
  const html = ensureScript(original);
  if (html !== original) fs.writeFileSync(INDEX_FILE, html, "utf8");
}

try {
  prepareIndex();
} catch (error) {
  console.error("HOME_HERO_FIRST_PAINT_PRELOAD_ERROR:", error);
}

const originalStatic = express.static;
express.static = function patchedStatic(root, options) {
  const middleware = originalStatic(root, options);
  const publicRoot = path.resolve(root || "");
  const expectedRoot = path.resolve(PUBLIC_DIR);
  if (publicRoot !== expectedRoot) return middleware;

  return function sngamerHomeHeroStatic(req, res, next) {
    if (req.method !== "GET" && req.method !== "HEAD") return middleware(req, res, next);
    const requestPath = String(req.path || req.url || "").split("?")[0];
    if (requestPath !== "/" && requestPath !== "/index.html") return middleware(req, res, next);

    try {
      const html = ensureScript(fs.readFileSync(INDEX_FILE, "utf8"));
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.set("Surrogate-Control", "no-store");
      res.type("html");
      if (req.method === "HEAD") return res.end();
      return res.send(html);
    } catch (error) {
      console.error("HOME_HERO_RESPONSE_ERROR:", error);
      return middleware(req, res, next);
    }
  };
};
