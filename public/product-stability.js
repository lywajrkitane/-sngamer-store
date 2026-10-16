/* Product stability guard intentionally disabled.
   Product rendering and section filtering now belong exclusively to app.js.
   The former secondary renderer used a different category classifier and
   could replace the main grid with an empty result after returning from Profile. */
(function () {
  "use strict";
  // Deliberately does not mutate #products or intercept navigation.
})();
