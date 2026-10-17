const express = require("express");
const fs = require("fs");
const path = require("path");

const originalStatic = express.static;

express.static = function paytechAwareStatic(root, options) {
  const originalMiddleware = originalStatic(root, options);
  const publicRoot = path.resolve(root);

  // Keep the Express static-handler name so the existing bootstrap ordering
  // logic continues to detect the static layer correctly.
  return function serveStatic(req, res, next) {
    const pathname = String(req.path || req.url || "").split("?")[0];
    const isHome = req.method === "GET" && (pathname === "/" || pathname === "/index.html");

    if (!isHome) return originalMiddleware(req, res, next);

    const indexPath = path.join(publicRoot, "index.html");
    if (!fs.existsSync(indexPath)) return originalMiddleware(req, res, next);

    try {
      let html = fs.readFileSync(indexPath, "utf8");
      const scriptTag = '<script src="/paytech-checkout.js?v=20261017-2010"></script>';
      if (!html.includes("/paytech-checkout.js")) {
        html = html.replace(/<\/body>/i, `${scriptTag}</body>`);
      }
      res.type("html").send(html);
    } catch (error) {
      console.error("PAYTECH_STATIC_INJECTION_ERROR:", error);
      return originalMiddleware(req, res, next);
    }
  };
};
