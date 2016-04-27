(function () {
  "use strict";

  angular.module('memslate.filters', [])

    .filter('searchfilter', function () {
      return function (input, query) {
        var r = RegExp('(' + query + ')', 'gi');
        return input.replace(r, '<span class="selected-class">$1</span>');
      }
    })

    .filter('unsafe', function ($sce) {
      return function (val) {
        return $sce.trustAsHtml(val);
      };
    });
})();
