const fs = require("fs");
const path = require("path");
const express = require("express");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");
const HERO_GUARD = `<style id="sngamer-home-hero-first-paint">.hero .heroIn > div:first-child > p.heroAnnouncement:not(.sngHomeHeroBody),.hero .heroIn > div:first-child > p.heroSlogan{visibility:hidden!important;opacity:0!important;pointer-events:none!important}</style>`;
const HERO_SCRIPT = `<script src="/home-hero.js?v=20261024-firstpaint1" defer data-sngamer-home-hero="true"></script>`;

function prepareIndex() {
  if (!fs.existsSync(INDEX_FILE)) return;
  const original = fs.readFileSync(INDEX_FILE, "utf8");
  let html = original;

  if (!html.includes('id="sngamer-home-hero-first-paint"')) {
    html = html.replace(/<\/head>/i, HERO_GUARD + "</head>");
  }

  if (!html.includes('data-sngamer-home-hero="true"')) {
    html = html.replace(/<\/head>/i, HERO_SCRIPT + "</head>");
  }

  if (html !== original) fs.writeFileSync(INDEX_FILE, html, "utf8");
}

try {
  prepareIndex();
} catch (error) {
  console.error("HOME_HERO_FIRST_PAINT_PRELOAD_ERROR:", error);
}

// Also patch already-read HTML responses in case another preload has already
// loaded index.html before this preload runs. This keeps the first paint guard
// server-side and does not alter the announcement audio control.
const originalStatic = express.static;
express.static = function patchedStatic(root, options) {
  const middleware = originalStatic(root, options);
  const publicRoot = path.resolve(root || "");
  const expectedRoot = path.resolve(PUBLIC_DIR);
  if (publicRoot !== expectedRoot) return middleware;

  return function sngamerHomeHeroFirstPaintStatic(req, res, next) {
    if (req.method !== "GET" && req.method !== "HEAD") return middleware(req, res, next);
    const requestPath = req.path || req.url || "";
    if (requestPath !== "/" && requestPath !== "/index.html") return middleware(req, res, next);

    try {
      let html = fs.readFileSync(INDEX_FILE, "utf8");
      if (!html.includes('id="sngamer-home-hero-first-paint"')) html = html.replace(/<\/head>/i, HERO_GUARD + "</head>");
      if (!html.includes('data-sngamer-home-hero="true"')) html = html.replace(/<\/head>/i, HERO_SCRIPT + "</head>");
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.type("html");
      if (req.method === "HEAD") return res.end();
      return res.send(html);
    } catch (error) {
      console.error("HOME_HERO_FIRST_PAINT_RESPONSE_ERROR:", error);
      return middleware(req, res, next);
    }
  };
};
