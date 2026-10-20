const express = require('express');

function installProductPerformanceFix(app) {
  const stack = app._router && app._router.stack;
  if (!stack || app.__sngProductPerformanceFixInstalled) return;
  app.__sngProductPerformanceFixInstalled = true;

  const injector = express.Router();
  injector.use((req, res, next) => {
    try {
      const originalSend = res.send.bind(res);
      res.send = function (body) {
        try {
          if ((req.path === '/admin.html' || req.path === '/admin-dashboard.html') && typeof body === 'string' && body.includes('</body>') && !body.includes('/product-performance-fix.js')) {
            body = body.replace('</body>', '<script src="/product-performance-fix.js?v=20261020-products2" defer></script></body>');
          }
        } catch (e) {
          console.error('PRODUCT_PERFORMANCE_FIX_INJECT_ERROR:', e.message);
        }
        return originalSend(body);
      };
    } catch (e) {
      console.error('PRODUCT_PERFORMANCE_FIX_WRAP_ERROR:', e.message);
    }
    next();
  });
  stack.unshift(...injector.stack);
}

const target = express.application;
const existingListen = target.listen;
let currentListen = existingListen;
function wrap(nextListen) {
  return function productPerformanceFixAwareListen(...args) {
    try { installProductPerformanceFix(this); } catch (e) { console.error('PRODUCT_PERFORMANCE_FIX_INSTALL_ERROR:', e); }
    return nextListen.apply(this, args);
  };
}
Object.defineProperty(target, 'listen', {
  configurable: true,
  enumerable: false,
  get() { return currentListen; },
  set(nextListen) { currentListen = wrap(nextListen); }
});
currentListen = wrap(existingListen);
