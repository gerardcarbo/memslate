"use strict";

angular.module('memslate', ['ionic', 'memslate.controllers', 'memslate.services', 'memslate.directives'])
    /*.config(['$sceDelegateProvider', function($sceDelegateProvider) {
        $sceDelegateProvider.resourceUrlWhitelist(['self', '.*']);
    }])*/

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

    .config(function ($stateProvider, $urlRouterProvider, $httpProvider) {
        $stateProvider

            .state('app', {
                url: "/app",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'AppCtrl'
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

            .state('app.translations', {
                url: "/translations",
                views: {
                    'menuContent': {
                        templateUrl: "templates/translations.html",
                        controller: 'TranslationsCtrl as translationsCtrl'
                    }
                }
            })

            .state('app.translation', {
                url: "/translations/:translationId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/translation.html",
                        controller: 'TranslationCtrl as translationCtrl'
                    }
                }
            });

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/translate');

        // Register middleware to ensure our auth token is passed to the server
        $httpProvider.interceptors.push('TokenInterceptor');
    });
