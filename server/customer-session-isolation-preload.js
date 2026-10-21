'use strict';

// Keep the customer identity when the admin area rotates or closes the
// shared express-session. The store uses one browser cookie, so an admin
// login must not silently log the customer account out.
const expressSession = require('express-session');

const patchedSession = function customerSafeSession(options = {}) {
  const middleware = expressSession(options);

  return function customerSafeSessionMiddleware(req, res, next) {
    middleware(req, res, function onSessionReady(err) {
      if (err) return next(err);
      if (!req.session || req.session.__sngamerCustomerIsolationPatched) return next();

      req.session.__sngamerCustomerIsolationPatched = true;

      // The admin and customer areas currently share one browser cookie.
      // Preserve the customer identity when the admin login rotates the
      // session identifier.
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
          return callback(null);
        });
      };

      // /api/admin/logout historically destroyed the whole shared session.
      // If a customer is also signed in, remove only the admin identity.
      const originalDestroy = req.session.destroy.bind(req.session);
      req.session.destroy = function preserveCustomerOnAdminDestroy(callback) {
        if (req.session.admin && req.session.customerId) {
          delete req.session.admin;
          return req.session.save((saveError) => callback(saveError || null));
        }
        return originalDestroy(callback);
      };

      // The admin logout route also calls res.clearCookie('sngamer.sid').
      // Do not clear the shared cookie when a customer session remains;
      // otherwise the server-side preservation above would be useless.
      const originalClearCookie = res.clearCookie.bind(res);
      res.clearCookie = function preserveCustomerCookie(name, options) {
        if (name === 'sngamer.sid' && req.session && req.session.customerId) {
          return res;
        }
        return originalClearCookie(name, options);
      };

      next();
    });
  };
};

Object.setPrototypeOf(patchedSession, expressSession);
Object.assign(patchedSession, expressSession);

require.cache[require.resolve('express-session')].exports = patchedSession;

console.log('SNGAMER_SESSION_ISOLATION: customer identity and cookie preserved across admin session rotation/logout');
