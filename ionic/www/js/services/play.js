(function() {
  "use strict";

  /**
   * Play services
   */
  var servicesMod = angular.module('memslate.services');

  servicesMod.factory('GamesService', function ($http, $rootScope, BaseUrlService) {
    return {
      getGames: function () {
        return $http.get(BaseUrlService.get() + 'resources/games/getAll');
      },
      getGame: function (id, params) {
        return $http.get(BaseUrlService.get() + 'resources/games/get/' + id + '/' + params);
      }
    };
  });
})();
