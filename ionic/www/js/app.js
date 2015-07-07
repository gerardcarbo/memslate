"use strict";

angular.module('memslate', ['ionic', 'formly', 'formlyIonic', 'memslate.controllers', 'memslate.services', 'memslate.directives'],
    function config(formlyConfigProvider) {
        // set formly templates here
        formlyConfigProvider.setType({
            name: 'memslateDate',
            template: "<label class=\"item item-input\">{{options.templateOptions.label}}:<input type=\"date\" ng-model=\"model[options.key]\" style='padding-left:10px;'/></label>"
        });

        formlyConfigProvider.setType({
            name: 'memslateSelect',
            template: "<ms-select id='{{options.templateOptions.id}}' name='{{options.templateOptions.name}}' title='{{options.templateOptions.label}}' items='options.templateOptions.options' prefered-items='options.templateOptions.prefered' selected-item='model[options.key]' style='border-right: 1px;border-top-right-radius: 0px;border-bottom-right-radius: 0px;'></ms-select>"
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

    .config(function ($stateProvider, $urlRouterProvider, $httpProvider)
    {
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

            .state('app.user', {
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
