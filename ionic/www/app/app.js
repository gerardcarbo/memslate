(function () {
  "use strict";

  angular.module('memslate', ['ionic', 'formly', 'formlyIonic', 'ngCordova', 'oc.lazyLoad', 'ui.bootstrap',
      'memslate.services', 'memslate.services.ui', 'memslate.directives', 'memslate.filters'])

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
      $rootScope.$on('$stateChangeSuccess', function (e, toState, toParams, fromState, fromParams) {
        //watch and retrieve last state (ui-router)
        var location = msUtils.getService('$location');
        if (location) {
          var newLocation = msUtils.getService('$location').path();
          SessionService.put('lastLocation', newLocation);
          $log.log('State: ' + newLocation);
        }

        //disable back when comming from home
        console.log("$stateChangeSuccess: from: ",fromState.name)
        if (fromState.name=="app.home") {
            console.log("$stateChangeSuccess: disableBack");
            var ionicHistory = msUtils.getService('$ionicHistory');
            ionicHistory.nextViewOptions({disableBack: true});
        }
      });

      $rootScope.$on('$stateError', function (e, toState, toParams, fromState, fromParams) {
        $log.log('State Error: ', e);
        msUtils.getService('$state').go('app.home', null, {location: 'replace'});
      });

      $rootScope.$on('$stateChangeError', function (e, toState, toParams, fromState, fromParams) {
        $log.log('State Change Error: ', e);
        e.preventDefault();
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
        template: "<ms-select id='{{options.templateOptions.id}}' name='{{options.templateOptions.name}}' title='{{options.templateOptions.label}}' items='options.templateOptions.options' " +
        "prefered-items='options.templateOptions.prefered' selected-item='model[options.key]' " +
        "selector-class='{{options.templateOptions.selectorClass}}' unselected-text='{{options.templateOptions.unselectedText}}'></ms-select>"
      });
    })

    .config(function ($ionicConfigProvider) {
      $ionicConfigProvider.scrolling.jsScrolling(false);
    })

    .config(function ($stateProvider, $urlRouterProvider) {
      $stateProvider

        .state('app', {
          url: "/app",
          abstract: true,
          template: "<ms-app></ms-app>",
        })

        .state('app.home', {
          url: "/home",
          views: {
            'menuContent': {
              templateUrl: "app/components/home/home.html"
            }
          }
        })

        .state('app.translate', {
          url: "/translate",
          views: {
            'menuContent': {
              template: "<ion-view view-title='Translate' class='translate'><ion-nav-title><img src='img/icon.svg' class='logo'>Translate</ion-nav-title>" +
              "<ms-translate></ms-translate>" +
              "</ion-view>",
            }
          }
        })

        .state('app.memo', {
          cache: false,
          url: "/memo",
          views: {
            'menuContent': {
              template: "<ion-view view-title='Memo'><ion-nav-title ><img src='img/icon.svg' class='logo'>Memo</ion-nav-title>" +
              "<ms-memo></ms-memo>" +
              "</ion-view>"
            }
          }
        })

        .state('app.memoFilter', {
          url: "/memoFilter",
          views: {
            'menuContent': {
              template: "<ion-view view-title='Order and Filter'><ms-memo-filter></ms-memo-filter></ion-view>"
            }
          }
        })

        .state('app.play', {
          url: "/play",
          views: {
            'menuContent': {
              template: "<ion-view view-title='Play' class='translate'><ion-nav-title><img src='img/icon.svg' class='logo'>Play</ion-nav-title>" +
              "<ms-play></ms-play>" +
              "</ion-view>"
            }
          }
        })

        .state('app.games', {
          url: "/games/:gameName",
          views: {
            'menuContent': {
              templateUrl: function ($stateParams) {
                var url = "app/components/play/games/basic-test/" + $stateParams.gameName.toDash() + ".html";
                console.log('game returning template: ' + url);
                return url;
              }
            }
          },
          resolve: {
            game: function ($state, $ocLazyLoad, $stateParams, $log) {
              $log.log('game js resolving "' + $stateParams.gameName + '"..');
              if ($stateParams.gameName === ":gameName") { //game name not provided -> load play page
                $log.log('gameName === ":gameName"');
                $state.go('app.play', null, {location: 'replace'});
                return false;
              }

              //load game's css and js
              $ocLazyLoad.load("app/components/play/games/" + $stateParams.gameName + "/" + $stateParams.gameName + ".css");
              return $ocLazyLoad.load("app/components/play/games/" + $stateParams.gameName + "/" + $stateParams.gameName + ".js").then(function () {
                $log.log('game "' + $stateParams.gameName + '" resolved');
                return true;
              });
            }
          }
        })

        .state('app.privacyPol', {
          cache: false,
          url: "/privacyPol",
          views: {
            'menuContent': {
              templateUrl: "app/components/home/privacyPolicy.html"
            }
          }
        })

        .state('app.user', {
          cache: false,
          url: "/user/:param",
          views: {
            'menuContent': {
              template: "<ion-view view-title='User'><ion-nav-title><img src='img/icon.svg' class='logo'>{{msAppCtrl.userName()}} Account</ion-nav-title>" +
              "<ms-user></ms-user>" +
              "</ion-view>"
            }
          }
        });

      // if none of the above states are matched, use this as the fallback
      $urlRouterProvider.otherwise(function ($injector, $location) {
        var lastState = $injector.get('SessionService').get('lastLocation') || "/app/home";
        if (lastState === "/app/games/:gameName") {
          lastState = "/app/play";
        }
        $injector.get('$log').log('Otherwise: ' + lastState);
        return lastState;
      });
    })

})();
