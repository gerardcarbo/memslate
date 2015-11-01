(function () {
  "use strict";

  angular.module('memslate', ['ionic', 'formly', 'formlyIonic', 'oc.lazyLoad', 'ui.bootstrap', 'memslate.controllers', 'memslate.services', 'memslate.directives'])

    .filter('searchfilter', function () {
      return function (input, query) {
        var r = RegExp('(' + query + ')', 'g');
        return input.replace(r, '<span class="selected-class">$1</span>');
      }
    })

    .run(function ($ionicPlatform) {
      $ionicPlatform.ready(function () {
        // Hide the accessory bar by default
        if (window.cordova && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
          // org.apache.cordova.statusbar required
          StatusBar.styleDefault();
        }
      });
    })

    .run(function ($rootScope, $log, SessionService) {
      //watch and retrieve last state (ui-router)
      $rootScope.$on('$stateChangeSuccess', function (e, toState, toParams, fromState, fromParams) {
        var location = msUtils.getService('$location');
        if(location)
        {
          var newLocation = msUtils.getService('$location').path();
          SessionService.put('lastLocation', newLocation);
          $log.log('State: ' + newLocation);
        }
      });

      $rootScope.$on('$stateError', function (e, toState, toParams, fromState, fromParams) {
        $log.log('State Error: ', e)
        msUtils.getService('$state').go('app.home', null, {location: 'replace'});
      });

      $rootScope.$on('$stateChangeError', function (e, toState, toParams, fromState, fromParams) {
        $log.log('State Change Error: ', e);
        event.preventDefault();
        msUtils.getService('$state').go('app.home', null, {location: 'replace'});
      });
    })

    .config(function (formlyConfigProvider) {
      // set formly templates here
      formlyConfigProvider.setType({
        name: 'memslateDate',
        template: "<label class=\"item item-input\">{{options.templateOptions.label}}:<input type=\"date\" ng-model=\"model[options.key]\" style='padding-left:10px;'/></label>"
      });

      formlyConfigProvider.setType({
        name: 'memslateSelect',
        template: "<ms-select id='{{options.templateOptions.id}}' name='{{options.templateOptions.name}}' title='{{options.templateOptions.label}}' items='options.templateOptions.options' prefered-items='options.templateOptions.prefered' selected-item='model[options.key]' selector-class='{{options.templateOptions.selectorClass}}'></ms-select>"
      });
    })

    .config(function ($ionicConfigProvider) {
      $ionicConfigProvider.scrolling.jsScrolling(false);
    })

    .config(function ($stateProvider, $urlRouterProvider, $httpProvider) {
      $stateProvider

        .state('app', {
          url: "/app",
          abstract: true,
          templateUrl: "templates/menu.html",
          controller: 'AppCtrl'
        })

        .state('app.home', {
          url: "/home",
          views: {
            'menuContent': {
              templateUrl: "templates/home.html"
            }
          }
        })

        .state('app.translate', {
          url: "/translate",
          views: {
            'menuContent': {
              templateUrl: "templates/translate.html",
              controller: 'TranslateCtrl as translateCtrl'
            }
          }
        })

        .state('app.memo', {
          cache: false,
          url: "/memo",
          views: {
            'menuContent': {
              templateUrl: "templates/memo.html",
              controller: 'MemoCtrl as memoCtrl'
            }
          }
        })

        .state('app.memoFilter', {
          url: "/memoFilter",
          views: {
            'menuContent': {
              templateUrl: "templates/memoFilter.html",
              controller: 'MemoFilterCtrl as memoFilterCtrl'
            }
          }
        })

        .state('app.play', {
          url: "/play",
          views: {
            'menuContent': {
              templateUrl: "templates/play.html",
              controller: 'PlayCtrl as playCtrl'
            }
          }
        })

        .state('app.games', {
          url: "/games/:gameName",
          views: {
            'menuContent': {
              templateUrl: function ($stateParams) {
                //$log.log('game returning template...');
                return "templates/games/" + $stateParams.gameName + "/" + $stateParams.gameName + ".html"
              }
            }
          },
          resolve: {
            game: function ($state, $ocLazyLoad, $stateParams, $log) {
              $log.log('game js resolving "' + $stateParams.gameName + '"..');
              if ($stateParams.gameName === ":gameName") {
                $log.log('gameName === ":gameName"');
                $state.go('app.play', null, {location: 'replace'});
                return false;
              }
              return $ocLazyLoad.load("js/games/" + $stateParams.gameName + "/" + $stateParams.gameName + ".js").then(function () {
                $log.log('game js resolved');
                return true;
              });
            }
          }
        })

        .state('app.user', {
          cache: false,
          url: "/user",
          views: {
            'menuContent': {
              templateUrl: "templates/user.html",
              controller: 'UserCtrl as userCtrl'
            }
          }
        });

      // if none of the above states are matched, use this as the fallback
      $urlRouterProvider.otherwise(function ($injector, $location) {
        var lastState = $injector.get('SessionService').get('lastLocation') || "/app/home";
        if (lastState === "/app/games/:gameName") {
          lastState = "/app/play";
        }
        $injector.get('$log').log('Otherwise: '+lastState);
        return lastState;
      });
    });
})();
