'use strict';

// Final guard for the shared admin/customer session.
// The application historically uses one express-session cookie for both areas.
// Admin logout must therefore remove ONLY the admin identity and must never
// destroy the shared session or clear sngamer.sid while a customer is signed in.
const express = require('express');

if (!express.application.__sngamerFinalAdminLogoutPatch) {
  express.application.__sngamerFinalAdminLogoutPatch = true;

  const originalListen = express.application.listen;

  express.application.listen = function patchedListen(...args) {
    const app = this;

    try {
      const stack = app._router && app._router.stack;
      if (Array.isArray(stack)) {
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

          // Only the replacement handler is needed. Keeping the remaining
          // legacy handlers would allow a second response/destroy() call.
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
