'use strict';

const express = require('express');

function install(app) {
  const stack = app._router && app._router.stack;
  if (!stack || app.__sngAnalyticsBaselineUiInstalled) return;
  app.__sngAnalyticsBaselineUiInstalled = true;

  const injector = express.Router();
  injector.use((req, res, next) => {
    if (req.path !== '/admin.html' && req.path !== '/admin-dashboard.html') return next();
    const originalSend = res.send.bind(res);
    res.send = body => {
      try {
        if (typeof body === 'string' && body.includes('</body>') && !body.includes('/analytics-reset-admin.js')) {
          body = body.replace('</body>', '<script src="/analytics-reset-admin.js?v=20261020-reset1" defer></script></body>');
        }
      } catch (e) {
        console.error('ANALYTICS_BASELINE_UI_INJECT_ERROR:', e.message);
      }
      return originalSend(body);
    };
    next();
  });
  stack.unshift(...injector.stack);
}

const target = express.application;
const existingListen = target.listen;
let currentListen = existingListen;
function wrap(nextListen) {
  return function analyticsBaselineUiListen(...args) {
    try { install(this); } catch (e) { console.error('ANALYTICS_BASELINE_UI_INSTALL_ERROR:', e); }
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
