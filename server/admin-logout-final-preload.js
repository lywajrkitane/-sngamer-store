'use strict';

// Keep the customer session alive when the administrator logs in or out
// from the same browser. Both areas intentionally use the same session
// cookie, so admin authentication must never regenerate or destroy a
// session that already contains customerId.
const express = require('express');

if (!express.application.__sngamerFinalAdminCustomerSessionPatch) {
  express.application.__sngamerFinalAdminCustomerSessionPatch = true;

  const originalPost = express.application.post;

  express.application.post = function patchedAdminPost(path, ...handlers) {
    if (path === '/api/admin/login' && handlers.length > 0) {
      const originalHandlers = handlers.slice();

      return originalPost.call(this, path, (req, res, next) => {
        // If a customer is already signed in, the legacy admin login calls
        // req.session.regenerate(). Prevent that call from replacing the
        // PostgreSQL session and dropping customerId/customerName.
        if (!req.session || !req.session.customerId) {
          let index = 0;
          const run = (err) => {
            if (err) return next(err);
            const handler = originalHandlers[index++];
            if (!handler) return next();
            return handler(req, res, run);
          };
          return run();
        }

        const originalRegenerate = req.session.regenerate.bind(req.session);
        let restored = false;

        req.session.regenerate = function preserveCustomerSession(callback) {
          // Do not rotate the session when it contains a customer identity.
          return callback(null);
        };

        const restore = () => {
          if (restored) return;
          restored = true;
          req.session.regenerate = originalRegenerate;
        };

        let index = 0;
        const run = (err) => {
          if (err) {
            restore();
            return next(err);
          }
          const handler = originalHandlers[index++];
          if (!handler) {
            restore();
            return next();
          }
          try {
            const result = handler(req, res, run);
            if (result && typeof result.finally === 'function') {
              return result.finally(restore);
            }
            // Express handlers normally finish asynchronously through res;
            // restoring here is safe because the admin handler has already
            // completed its synchronous setup and does not need regenerate
            // again after this point.
            restore();
            return result;
          } catch (error) {
            restore();
            throw error;
          }
        };

        return run();
      });
    }

    if (path === '/api/admin/logout' && handlers.length > 0) {
      const originalHandlers = handlers.slice();

      return originalPost.call(this, path, (req, res, next) => {
        if (req.session && req.session.customerId) {
          // Remove only the administrator identity. Never call destroy() and
          // never clear sngamer.sid because the customer still needs it.
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

        let index = 0;
        const run = (err) => {
          if (err) return next(err);
          const handler = originalHandlers[index++];
          if (!handler) return next();
          return handler(req, res, run);
        };
        return run();
      });
    }

    return originalPost.call(this, path, ...handlers);
  };

  console.log('SNGAMER_FINAL_ADMIN_CUSTOMER_SESSION_PATCH: active');
}
