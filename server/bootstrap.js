const express = require("express");
const fs = require("fs");
const path = require("path");
const { installCustomerSystem } = require("./customer-system");
const { initCustomersTable, ensureOrderCustomerColumns } = require("./customer-bootstrap-db");

const originalListen = express.application.listen;

express.application.listen = function patchedListen(...args) {
  const app = this;
  const router = installCustomerSystem();
  const stack = app._router && app._router.stack;

  if (stack) {
    const adminInjection = function(req, res, next) {
      const target = req.path === "/admin-dashboard.html" || req.path === "/admin.html";
      if (!target || req.method !== "GET") return next();

      const file = path.join(__dirname, "..", "public", req.path.replace(/^\//, ""));
      if (!fs.existsSync(file)) return next();

      try {
        let html = fs.readFileSync(file, "utf8");
        if (!html.includes("customer-admin.js")) {
          html = html.replace(/<\/body>/i, '<script src="/customer-admin.js" defer></script></body>');
        }
        res.type("html").send(html);
      } catch (error) {
        console.error("ADMIN_HTML_INJECTION_ERROR:", error);
        next();
      }
    };

    const injectionRouter = express.Router();
    injectionRouter.use(adminInjection);

    let staticIndex = stack.length;
    for (let i = 0; i < stack.length; i++) {
      const layer = stack[i];
      if (layer && layer.handle && layer.handle.name === "serveStatic") {
        staticIndex = i;
        break;
      }
    }
    stack.splice(staticIndex, 0, ...(injectionRouter.stack || []));

    let catchAllIndex = stack.length;
    for (let i = 0; i < stack.length; i++) {
      const layer = stack[i];
      if (layer && layer.regexp && String(layer.regexp).includes("fast_star")) {
        catchAllIndex = i;
        break;
      }
    }

    stack.splice(catchAllIndex, 0, ...(router.stack || []));
  }

  ensureOrderCustomerColumns()
    .then(() => originalListen.apply(app, args))
    .catch(error => {
      console.error("CUSTOMER_ORDER_DB_BOOT_ERROR:", error);
      process.exit(1);
    });
};

(async () => {
  try {
    await initCustomersTable();
    require("./server");
  } catch (error) {
    console.error("CUSTOMER_SYSTEM_BOOT_ERROR:", error);
    process.exit(1);
  }
})();
