const express = require('express');

function installProductAnalytics(app) {
  const stack = app._router && app._router.stack;
  if (!stack || app.__sngProductAnalyticsInstalled) return;
  app.__sngProductAnalyticsInstalled = true;

  const injector = express.Router();
  injector.use((req, res, next) => {
    try {
      if (typeof res.send !== 'function') return next();
      const send = res.send.bind(res);
      res.send = function (body) {
        try {
          if (
            (req.path === '/admin.html' || req.path === '/admin-dashboard.html') &&
            typeof body === 'string' &&
            body.includes('</body>') &&
            !body.includes('/product-analytics-admin.js')
          ) {
            body = body.replace(
              '</body>',
              '<script src="/product-analytics-admin.js?v=20261020-products1" defer></script></body>'
            );
          }
        } catch (e) {
          console.error('PRODUCT_ANALYTICS_HTML_INJECT_ERROR:', e.message);
        }
        return send(body);
      };
    } catch (e) {
      console.error('PRODUCT_ANALYTICS_SEND_WRAP_ERROR:', e.message);
    }
    next();
  });

  stack.unshift(...injector.stack);
}

const target = express.application;
const existingListen = target.listen;
let currentListen = existingListen;

function wrap(nextListen) {
  return function productAnalyticsAwareListen(...args) {
    try { installProductAnalytics(this); }
    catch (e) { console.error('PRODUCT_ANALYTICS_INSTALL_ERROR:', e); }
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
