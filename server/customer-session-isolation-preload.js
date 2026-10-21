'use strict';

// Admin and customer share the same browser session cookie. Keep the
// customer identity alive when the admin session is regenerated or logged
// out from the same browser.
const expressSession = require('express-session');
const express = require('express');

// Route-level guard: protect both admin login and logout. The application
// historically regenerates/destroys the shared session for admin auth; doing
// that without carrying customerId over logs the customer out as a side effect.
const originalApplicationPost = express.application.post;
if (!express.application.__sngamerAdminCustomerSessionPatched) {
  express.application.__sngamerAdminCustomerSessionPatched = true;

  express.application.post = function patchedPost(path, ...handlers) {
    if (path === '/api/admin/login' && handlers.length > 0) {
      const originalHandlers = handlers.slice();

      return originalApplicationPost.call(this, path, (req, res, next) => {
        if (req.session && req.session.customerId) {
          const customerId = req.session.customerId;
          const customerName = req.session.customerName || '';
          const originalRegenerate = req.session.regenerate.bind(req.session);

          // The admin login route calls regenerate() internally. Wrap that
          // exact call so the new session receives the customer identity too.
          req.session.regenerate = function preserveCustomerOnAdminLogin(callback) {
            return originalRegenerate((error) => {
              if (error) return callback(error);

              req.session.customerId = customerId;
              req.session.customerName = customerName;
              return callback(null);
            });
          };
        }

        let index = 0;
        const runOriginal = (err) => {
          if (err) return next(err);
          const handler = originalHandlers[index++];
          if (!handler) return next();
          return handler(req, res, runOriginal);
        };
        return runOriginal();
      });
    }

    if (path === '/api/admin/logout' && handlers.length > 0) {
      const originalHandlers = handlers.slice();

      return originalApplicationPost.call(this, path, (req, res, next) => {
        if (req.session && req.session.customerId) {
          delete req.session.admin;
          return req.session.save((saveError) => {
            if (saveError) {
              console.error('SNGAMER_ADMIN_LOGOUT_CUSTOMER_PRESERVE_ERROR:', saveError);
              return res.status(500).json({
                error: 'Impossible de fermer la session administrateur'
              });
            }

            return res.json({
              success: true,
              customerSessionPreserved: true
            });
          });
        }

        // No customer is signed in, so retain the original logout behavior.
        let index = 0;
        const runOriginal = (err) => {
          if (err) return next(err);
          const handler = originalHandlers[index++];
          if (!handler) return next();
          return handler(req, res, runOriginal);
        };
        return runOriginal();
      });
    }

    return originalApplicationPost.call(this, path, ...handlers);
  };
}

const patchedSession = function customerSafeSession(options = {}) {
  const middleware = expressSession(options);

  return function customerSafeSessionMiddleware(req, res, next) {
    middleware(req, res, function onSessionReady(err) {
      if (err) return next(err);

      const installSessionGuards = () => {
        if (!req.session || req.session.__sngamerCustomerIsolationPatched) return;

        req.session.__sngamerCustomerIsolationPatched = true;

        const originalRegenerate = req.session.regenerate.bind(req.session);
        req.session.regenerate = function preserveCustomerOnRegenerate(callback) {
          const customerId = req.session.customerId;
          const customerName = req.session.customerName;

          return originalRegenerate((error) => {
            if (error) return callback(error);

            if (customerId) {
              req.session.customerId = customerId;
              req.session.customerName = customerName;
            }

            installSessionGuards();
            return callback(null);
          });
        };

        const originalDestroy = req.session.destroy.bind(req.session);
        req.session.destroy = function preserveCustomerOnDestroy(callback) {
          if (req.session.customerId) {
            delete req.session.admin;
            return req.session.save((saveError) => callback(saveError || null));
          }
          return originalDestroy(callback);
        };
      };

      installSessionGuards();

      // Legacy code may still try to clear the shared cookie.
      if (!res.__sngamerCustomerCookieGuardPatched) {
        const originalClearCookie = res.clearCookie.bind(res);
        res.clearCookie = function preserveCustomerCookie(name, options) {
          if (name === 'sngamer.sid' && req.session && req.session.customerId) {
            return res;
          }
          return originalClearCookie(name, options);
        };
        res.__sngamerCustomerCookieGuardPatched = true;
      }

      next();
    });
  };
};

Object.setPrototypeOf(patchedSession, expressSession);
Object.assign(patchedSession, expressSession);

require.cache[require.resolve('express-session')].exports = patchedSession;

console.log('SNGAMER_SESSION_ISOLATION: customer identity preserved across admin login rotation and logout');
