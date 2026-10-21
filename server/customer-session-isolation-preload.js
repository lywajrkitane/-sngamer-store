'use strict';

// The admin and customer areas share the same browser session cookie.
// Keep the customer identity alive when the admin session is rotated or
// when the admin logs out.
const expressSession = require('express-session');

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

        // A customer session must never be destroyed by an admin logout.
        // This is intentionally based only on customerId, not on the admin
        // flag, because the admin flag may already have been cleared by
        // another middleware before legacy logout code runs.
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

      // HARD GUARD: intercept every POST variant of the admin logout endpoint
      // before server.js can call destroy() or clearCookie(). Use originalUrl
      // as the primary check so this remains reliable even if Express has not
      // populated req.path yet.
      const requestPath = String(req.originalUrl || req.url || '').split('?')[0];
      if (req.method === 'POST' && requestPath === '/api/admin/logout' && req.session.customerId) {
        delete req.session.admin;
        return req.session.save((saveError) => {
          if (saveError) {
            console.error('SNGAMER_ADMIN_LOGOUT_SAVE_ERROR:', saveError);
            return res.status(500).json({ error: 'Impossible de fermer la session administrateur' });
          }
          return res.json({ success: true, customerSessionPreserved: true });
        });
      }

      // Legacy logout code may still attempt to clear the shared cookie.
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

console.log('SNGAMER_SESSION_ISOLATION: customer identity preserved across admin session rotation/logout');
