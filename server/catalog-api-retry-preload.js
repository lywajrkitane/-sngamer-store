const express = require('express');

const target = express.application;
const existingListen = target.listen;
let currentListen = existingListen;

function installCatalogRetry(app) {
  const stack = app._router && app._router.stack;
  if (!stack || app.__sngCatalogRetryInstalled) return;
  const layer = stack.find(l => l && l.route && l.route.path === '/api/products' && l.route.methods?.get);
  if (!layer || !layer.route || !Array.isArray(layer.route.stack)) return;

  const routeLayer = layer.route.stack[layer.route.stack.length - 1];
  const original = routeLayer && routeLayer.handle;
  if (typeof original !== 'function') return;

  app.__sngCatalogRetryInstalled = true;
  routeLayer.handle = async function catalogRetryHandler(req, res, next) {
    const MAX_ATTEMPTS = 4;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      let failed = false;
      let statusCode = 200;
      const originalStatus = res.status;
      const originalJson = res.json;
      const originalSend = res.send;

      res.status = function statusWithRetry(code) {
        statusCode = code;
        return originalStatus.call(this, code);
      };
      res.json = function jsonWithRetry(body) {
        if (statusCode >= 500 && attempt < MAX_ATTEMPTS && !res.headersSent) {
          failed = true;
          return res;
        }
        return originalJson.call(this, body);
      };
      res.send = function sendWithRetry(body) {
        if (statusCode >= 500 && attempt < MAX_ATTEMPTS && !res.headersSent) {
          failed = true;
          return res;
        }
        return originalSend.call(this, body);
      };

      try {
        await original.call(this, req, res, next);
      } catch (error) {
        failed = true;
        if (attempt === MAX_ATTEMPTS) throw error;
      } finally {
        res.status = originalStatus;
        res.json = originalJson;
        res.send = originalSend;
      }

      if (!failed) return;
      await new Promise(resolve => setTimeout(resolve, 600 * attempt));
    }
  };
}

function wrapListen(nextListen) {
  return function catalogRetryListen(...args) {
    try {
      installCatalogRetry(this);
    } catch (error) {
      console.error('SNGAMER_CATALOG_RETRY_INSTALL_ERROR:', error);
    }
    return nextListen.apply(this, args);
  };
}

Object.defineProperty(target, 'listen', {
  configurable: true,
  enumerable: false,
  get() { return currentListen; },
  set(nextListen) { currentListen = wrapListen(nextListen); }
});

currentListen = wrapListen(existingListen);
