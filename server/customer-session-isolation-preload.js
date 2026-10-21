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
        if (!req.session || req.session.__sngamerCustomerIsolationPatched) {
          return;
        }

        req.session.__sngamerCustomerIsolationPatched = true;

        // Keep the customer identity across express-session's regenerate().
        // IMPORTANT: regenerate() replaces req.session, so these guards must
        // be installed again on the newly-created session object.
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

            // express-session replaced req.session, so restore the guards
            // before the caller continues using the regenerated session.
            installSessionGuards();
            return callback(null);
          });
        };

        // Admin logout must remove only the admin identity when a customer
        // remains signed in. Otherwise the shared session is destroyed.
        const originalDestroy = req.session.destroy.bind(req.session);
        req.session.destroy = function preserveCustomerOnAdminDestroy(callback) {
          if (req.session.admin && req.session.customerId) {
            delete req.session.admin;
            return req.session.save((saveError) => callback(saveError || null));
          }
          return originalDestroy(callback);
        };
      };

      installSessionGuards();

      // The admin logout route historically clears the shared browser cookie.
      // Keep it when a customer identity is still present.
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
