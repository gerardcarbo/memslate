/**
 * Created by gerard on 18/02/2015.
 */
"use strict";

var module=angular.module('memslate.services', ['ngResource','ionic']);

module.constant('TranslationsProvider','yandex');
/**
 * Translation services
 */
module.service('YandexTranslateService',function($http, $q, TranslationRes){
    this.translate = function(fromLang, toLang, text)
    {
        var deferred = $q.defer();
        var promise = deferred.promise;
        decoratePromise(promise);

        $http.get('https://dictionary.yandex.net/api/v1/dicservice.json/lookup',
            {
                params: {
                    key: 'dict.1.1.20140425T100742Z.a6641c6755e8a074.22e10a5caa7ce385cffe8e2104a66ce60400d0bb',
                    lang: fromLang + "-" + toLang,
                    text: text,
                    ui: 'en'
                }
            }
        ).success(function(data, status)
            {
                var translation={};
                translation.fromLang=fromLang;
                translation.toLang=toLang;
                translation.translate=text;

                if(data.def && data.def.length>0)
                {
                    translation.provider='yd';
                    translation.mainResult=data.def[0].tr[0].text;
                    translation.rawResult=data;
                    translation.transcription=data.def[0].ts;

                    deferred.resolve(translation);

                    var translationRes=new TranslationRes(translation);
                    translationRes.$save(function(){
                        console.log('Translation Saved: id:'+translationRes.id);
                        translation.id=translationRes.id;
                    });
                }
                else
                {
                    $http.get('https://translate.yandex.net/api/v1.5/tr.json/translate',
                        {
                            params: {
                                key: 'trnsl.1.1.20140425T085916Z.05949a2c8c78dfa7.d025a7c757cb09916dca86cb06df4e0686d81430',
                                lang: fromLang + "-" + toLang,
                                text: text,
                                ui: 'en'
                            }
                        }
                    ).success(function(data, status) {
                            if(data.text && data.text.length>0)
                            {
                                translation.provider='yt';
                                translation.mainResult=data.text[0];
                                translation.rawResult=data;
                                deferred.resolve(translation);
                            }
                            else
                            {
                                deferred.reject("Translation not found");
                            }
                    });
                }
            }
        ).error(function(data, status) {
            deferred.reject(status);
        });

        return promise;
    };
});

module.factory('TranslateService', function($injector,TranslationsProvider) {
    if(TranslationsProvider=='yandex')
        return $injector.get('YandexTranslateService');
    else
        return null;
});

module.factory('TranslationRes', function ($resource) {
    return $resource('http://localhost:5000/resources/translations/:translationId');
});

/**
 * Graphical User Interface services
 */
module.service('UI', function($window, $ionicLoading) {
    this.toast = function (msg, duration, position) {
        if (!duration)
            duration = 1500;
        if (!position)
            position = 'top';

        // PhoneGap? Use native:
        if ($window.plugins) {
            if ($window.plugins.toast)
                $window.plugins.toast.show(msg, duration, position,
                    function (a) {
                    }, function (err) {
                    });
            return;
        }

        // … fallback / customized $ionicLoading:
        $ionicLoading.show({
            template: msg,
            noBackdrop: true,
            duration: duration
        });

    };
});

module.service("ModalDialogService",['$ionicPopup','$q',function($modal,$q){
    this.showYesNoModal=function(title,msg)
    {
        var deferred = $q.defer();
        var promise = deferred.promise;

        var confirmPopup = $ionicPopup.confirm({
            title: title,
            template: msg
        });
        confirmPopup.then(function(res) {
            if(res) {
                deferred.resolve('yes');
            } else {
                deferred.resolve('no');
            }
        });

        return promise;
    };
}]);

/**
 * Authentication services
 */
module.factory('AuthenticationService', function() {
    var auth = {
        isAuthenticated: false,
        isAdmin: false
    }

    return auth;
});

module.factory('TokenInterceptor', function($q, $window, $location, AuthenticationService) {
    return {
        request: function(config) {
            config.headers = config.headers || {};
            if ($window.localStorage.token) {
                config.headers.Authorization = 'Bearer ' + $window.localStorage.token;
            }
            return config;
        },

        requestError: function(rejection) {
            return $q.reject(rejection);
        },

        /* Set Authentication.isAuthenticated to true if 200 received */
        response: function(response) {
            if (response != null && response.status == 200 && $window.localStorage.token && !AuthenticationService.isAuthenticated) {
                AuthenticationService.isAuthenticated = true;
            }
            return response || $q.when(response);
        },

        /* Revoke client authentication if 401 is received */
        responseError: function(rejection) {
            if (rejection != null && rejection.status === 401 && ($window.localStorage.token || AuthenticationService.isAuthenticated)) {
                delete $window.localStorage.token;
                AuthenticationService.isAuthenticated = false;
                $location.path("/register");
            }

            return $q.reject(rejection);
        }
    };
});

module.factory('RegistrationService', function($window, $http, $ionicPopup, $rootScope, AuthenticationService) {
    return {
        login: function(email, password) {
            return $http.post('/login', {
                email: email,
                password: password
            }).then(function(result) {
                $rootScope.user = result.data;
                console.log(result.data);
                AuthenticationService.isAuthenticated = true;
                AuthenticationService.isAdmin = result.data.isAdmin;

                $window.sessionStorage.name     = result.data.name;
                $window.sessionStorage.isAdmin = result.data.isAdmin;
                $window.localStorage.token      = result.data.token;
            }).catch(function(err) {
                $ionicPopup.alert({
                    title: 'Login Failed',
                    content: err.data
                });
            });
        },

        logout: function() {
            delete $window.localStorage.token;
        },

        register: function(user) {
            return $http.post('/register', user).then(function(result) {
                $rootScope.user = result.data;
                AuthenticationService.isAuthenticated = true;
                $window.sessionStorage.name     = result.data.name;
                $window.sessionStorage.isAdmin = result.data.isAdmin;
                $window.localStorage.token      = result.data.token;
                console.log(result.data);
            }).catch(function(err) {
                $ionicPopup.alert({
                    title: 'Failed',
                    content: err.data
                });
            });
        }
    }
});