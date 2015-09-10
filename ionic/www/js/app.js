"use strict";

angular.module('memslate', ['ionic', 'formly', 'formlyIonic', 'oc.lazyLoad', 'ui.bootstrap', 'memslate.controllers', 'memslate.services', 'memslate.directives'],
  function config(formlyConfigProvider, TranslationsProvider) {
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

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
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
        controller: 'AppCtrl',
        resolve: {
          baseUrl: function (BaseUrlService) {
            return BaseUrlService.connect();
          }
        }
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
          game: function ($ocLazyLoad, $stateParams, $log) {
            $log.log('game js resolving..')
            return $ocLazyLoad.load("js/games/" + $stateParams.gameName + "/" + $stateParams.gameName + ".js").then(function(){
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
    $urlRouterProvider.otherwise('/app/home');

    // Register middleware to ensure our auth token is passed to the server
    $httpProvider.interceptors.push('TokenInterceptor');
  });
