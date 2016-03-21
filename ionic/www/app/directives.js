(function () {
  "use strict";

  var app = angular.module('memslate.directives', ['memslate.services', 'memslate.services.ui']);

  /*
   * This directive allows us to pass a function in on an enter key to do what
   * we want.
   */
  app.directive('msEnterPressed', function () {
    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if (event.which === 13) {
          scope.$apply(function () {
            scope.$eval(attrs.msEnterPressed);
          });

          event.preventDefault();
        }
      });
    };
  });
})();


