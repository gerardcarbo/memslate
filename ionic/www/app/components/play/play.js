(function () {
  "use strict";

  angular.module('memslate')

    .component('msPlay', {
      templateUrl: "app/components/play/play.html",
      controllerAs: 'playCtrl',
      controller: function ($scope, $http, $compile, $timeout, $ocLazyLoad, $state, $ionicHistory, UI, GamesService) {

        var self = this;

        self.games = undefined;

        GamesService.getGames().success(function (games) {
            self.games = games;
          })
          .error(function (err) { //404 error -> try again
            GamesService.getGames().success(function (games) {
              self.games = games;
            })
          });

        self.playGame = function (gameIndex) {
          console.log("playGame:", self.games[gameIndex]);



          $state.go('app.games', {gameName: self.games[gameIndex].name_id}).then(function () {
            console.log('playGame ' + self.games[gameIndex].name_id + ' loaded')
          });
        };
      }
    })
})();
