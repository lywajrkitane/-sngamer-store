const express = require("express");
const { initCustomerDatabase, installCustomerSystem } = require("./customer-system");

const originalListen = express.application.listen;

express.application.listen = function patchedListen(...args) {
  const app = this;
  const router = installCustomerSystem();

  // The original server already registers its normal routes before listen().
  // Insert the customer routes just before the final catch-all frontend route.
  // This keeps the existing store/admin behavior intact while making the new
  // customer API available through the same Express application/session.
  const stack = app._router && app._router.stack;
  if (stack) {
    let catchAllIndex = stack.length;
    for (let i = 0; i < stack.length; i++) {
      const layer = stack[i];
      if (layer && layer.regexp && String(layer.regexp).includes("fast_star")) {
        catchAllIndex = i;
        break;
      }
    }

    const routerStack = router.stack || [];
    stack.splice(catchAllIndex, 0, ...routerStack);
  }

  // Serve the customer account enhancement on the storefront.
  // The file is loaded by the existing hero-copy hook below; no existing HTML
  // layout is replaced here.
  return originalListen.apply(app, args);
};

(async () => {
  try {
    await initCustomerDatabase();
    require("./server");
  } catch (error) {
    console.error("CUSTOMER_SYSTEM_BOOT_ERROR:", error);
    process.exit(1);
  }
})();
