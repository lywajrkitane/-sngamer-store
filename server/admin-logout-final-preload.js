'use strict';

// Final guard for the shared admin/customer session.
// The application historically uses one express-session cookie for both areas.
// Admin authentication must therefore never erase an already signed-in customer.
const express = require('express');

if (!express.application.__sngamerFinalAdminLogoutPatch) {
  express.application.__sngamerFinalAdminLogoutPatch = true;

  const originalListen = express.application.listen;

  express.application.listen = function patchedListen(...args) {
    const app = this;

    try {
      const stack = app._router && app._router.stack;
      if (Array.isArray(stack)) {
        // ADMIN LOGIN: preserve an existing customer session while the
        // original handler validates the administrator credentials.
        for (const layer of stack) {
          const route = layer && layer.route;
          if (!route || route.path !== '/api/admin/login' || !route.methods?.post) continue;
          if (route.__sngamerFinalLoginPatched) continue;

          const routeLayers = Array.isArray(route.stack) ? route.stack.slice() : [];
          if (!routeLayers.length) continue;

          route.__sngamerFinalLoginPatched = true;
          const originalHandler = routeLayers[0].handle;
          const primaryLayer = routeLayers[0];

          primaryLayer.handle = function finalAdminLoginHandler(req, res, next) {
            if (!req.session || !req.session.customerId) {
              return originalHandler(req, res, next);
            }

            const originalRegenerate = req.session.regenerate;
            let restored = false;

            // The original admin route calls regenerate(). When a customer is
            // already signed in, keep this same PostgreSQL-backed session so
            // customerId/customerName cannot be lost during admin login.
            req.session.regenerate = function preserveCustomerSession(callback) {
              return callback(null);
            };

            const restoreRegenerate = () => {
              if (restored) return;
              restored = true;
              req.session.regenerate = originalRegenerate;
            };

            try {
              const result = originalHandler(req, res, next);
              if (result && typeof result.finally === 'function') {
                return result.finally(restoreRegenerate);
              }
              restoreRegenerate();
              return result;
            } catch (error) {
              restoreRegenerate();
              throw error;
            }
          };

          route.stack = routeLayers;
          console.log('SNGAMER_FINAL_ADMIN_LOGIN_PATCH: customer session preserved');
          break;
        }

        // ADMIN LOGOUT: remove ONLY the admin identity. Never destroy or
        // clear the shared session while a customer is signed in.
        for (const layer of stack) {
          const route = layer && layer.route;
          if (!route || route.path !== '/api/admin/logout' || !route.methods?.post) continue;
          if (route.__sngamerFinalLogoutPatched) continue;

          const routeLayers = Array.isArray(route.stack) ? route.stack.slice() : [];
          if (!routeLayers.length) continue;

          route.__sngamerFinalLogoutPatched = true;
          const originalHandlers = routeLayers.map((item) => item.handle);
          const primaryLayer = routeLayers[0];

          primaryLayer.handle = function finalAdminLogoutHandler(req, res, next) {
            if (req.session && req.session.customerId) {
              delete req.session.admin;

              return req.session.save((saveError) => {
                if (saveError) {
                  console.error('SNGAMER_FINAL_ADMIN_LOGOUT_SAVE_ERROR:', saveError);
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
            const runOriginal = (err) => {
              if (err) return next(err);
              const handler = originalHandlers[index++];
              if (!handler) return next();
              return handler(req, res, runOriginal);
            };

            return runOriginal();
          };

          route.stack = [primaryLayer];
          console.log('SNGAMER_FINAL_ADMIN_LOGOUT_PATCH: active');
          break;
        }
      }
    } catch (error) {
      console.error('SNGAMER_FINAL_ADMIN_LOGOUT_PATCH_ERROR:', error);
    }

    return originalListen.apply(this, args);
  };
}
