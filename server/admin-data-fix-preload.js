/* SNGAMER STORE — ADMIN DATA FIX PRELOAD
   Compatibility shim only.

   The admin pages now receive their client scripts through bootstrap.js and
   their inline order-details/refund UI is already part of admin-dashboard.html
   and admin.html. Keeping this preload file as a no-op is intentional because
   Render may still reference it in the configured start command.
*/
