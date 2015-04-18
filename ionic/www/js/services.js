/**
 * Created by gerard on 18/02/2015.
 */
"use strict";

var module = angular.module('memslate.services', ['ngResource', 'ionic']);

module.config(function ($httpProvider) {
    //Enable cross domain calls
    $httpProvider.defaults.useXDomain = true;
    //Remove the header used to identify ajax call  that would prevent CORS from working
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

module.constant('TranslationsProvider', 'yandex');
//module.constant('BaseUrl', 'http://localhost:5000/');
module.constant('BaseUrl', 'https://memslate.herokuapp.com/');

module.constant('YandexTranslateApiKey', 'trnsl.1.1.20140425T085916Z.05949a2c8c78dfa7.d025a7c757cb09916dca86cb06df4e0686d81430');
module.constant('YandexDictionaryApiKey', 'dict.1.1.20140425T100742Z.a6641c6755e8a074.22e10a5caa7ce385cffe8e2104a66ce60400d0bb');

var DesAuthorizable = {};
DesAuthorizable.deleteAuthorizationHeader = function(d,headersGetter) {
    var headers = headersGetter();
    delete headers['Authorization'];

    return JSON.stringify(d);
};

module.service('LanguagesService', function ($q, $rootScope, $http, $resource,
                                                YandexTranslateApiKey, BaseUrl)
{
    var self=this;
    angular.extend(this,DesAuthorizable);

    this.getLanguages = function()
    {
        if(this.languages)
        {
            var deferred = $q.defer();
            deferred.resolve(this.languages);
            return deferred.promise;
        }

        this.languages = {};

        var yandexGet = $q.defer();
        var promiseYandex = yandexGet.promise;


        $http.get('https://translate.yandex.net/api/v1.5/tr.json/getLangs',
            {
                params: {
                    key: YandexTranslateApiKey,
                    ui: 'en'
                },
                transformRequest: this.deleteAuthorizationHeader
            }
        ).success(function (data, status)
            {
                yandexGet.resolve(data);
            })
            .error(function(data, status)
            {
                yandexGet.reject(status);
            });

        var promiseUserLangs=this.getUserLanguages();

        var allPromise = $q.all([promiseYandex,promiseUserLangs]).then(function(data)
        {
            self.languages.items=Object.keys(data[0].langs).map(function(item){
                return {value:item, name:data[0].langs[item]};
            });
            self.languages.dirs=data[0].dirs;
            self.languages.selectedFrom=data[1].fromLang;
            self.languages.selectedTo=data[1].toLang;
            self.languages.prefered=data[1].prefered;

            return self.languages;
        });
        decoratePromise(allPromise);
        return allPromise;
    };

    this.getUserLanguages = function()
    {
        var deferedGet = $q.defer();
        var promiseGetUserLanguages = deferedGet.promise;

        $resource(BaseUrl + 'resources/userLanguages/').get({},
            function(data){deferedGet.resolve(data)},
            function(err){deferedGet.reject(err)});

        return promiseGetUserLanguages
    }

    this.addPrefered = function(language)
    {
        if(language)
        {
            var pos=this.languages.prefered.indexOf(language);
            if(pos!=-1)
            {
                this.languages.prefered.splice(pos,1);
            }
            this.languages.prefered.unshift(language);
            if(this.languages.prefered.length>4)
            {
                this.languages.prefered.pop();
            }
        }
    };

    this.getLanguages();
});

/**
 * Translation services
 */
module.service('YandexTranslateService', function ($rootScope, $http, $resource, $q, $timeout,
                                                   TranslationRes, UserService,
                                                   YandexTranslateApiKey, YandexDictionaryApiKey)
{
    var self=this;

    angular.extend(this,DesAuthorizable);

    this.translate = function (fromLang, toLang, text)
    {
        var deferred = $q.defer();
        var promise = deferred.promise;
        decoratePromise(promise);

        /*
         * CORS not working when user logged in -> delete Authorization token with deleteAuthorizationHeader
         */
        $http.get('https://dictionary.yandex.net/api/v1/dicservice.json/lookup',
            {
                params: {
                    key: YandexDictionaryApiKey,
                    lang: fromLang + "-" + toLang,
                    text: text,
                    ui: 'en'
                },
                transformRequest: this.deleteAuthorizationHeader
            }
        ).success(function (data, status)
            {
                var translation = {};
                translation.fromLang = fromLang;
                translation.toLang = toLang;
                translation.translate = text;

                if (data && data.def && data.def.length > 0)
                {
                    translation.provider = 'yd';
                    translation.mainResult = data.def[0].tr[0].text;
                    translation.rawResult = data;
                    translation.transcription = data.def[0].ts;

                    var translationRes = new TranslationRes(translation);
                    translationRes.$save(function () {
                        console.log('Translation Saved: id:' + translationRes.id);
                        translation.id = translationRes.id;

                        deferred.resolve(translation);
                    });
                }
                else
                {
                    $http.get('https://translate.yandex.net/api/v1.5/tr.json/translate',
                        {
                            params: {
                                key: YandexTranslateApiKey,
                                lang: fromLang + "-" + toLang,
                                text: text,
                                ui: 'en'
                            },
                            transformRequest: self.deleteAuthorizationHeader
                        }
                    ).success(function (data, status) {
                            if (data.text && data.text.length > 0 && data.text[0] != translation.translate) {
                                translation.provider = 'yt';
                                translation.mainResult = data.text[0];
                                translation.rawResult = data;

                                var translationRes = new TranslationRes(translation);
                                translationRes.$save(function () {
                                    console.log('Translation Saved: id:' + translationRes.id);
                                    translation.id = translationRes.id;

                                    deferred.resolve(translation);
                                });
                            }
                            else {
                                deferred.reject("Translation not found");
                            }
                        });
                }
            }
        ).error(function (data, status) {
                deferred.reject(status);
            });

        return promise;
    };
});

module.factory('TranslateService', function ($injector, TranslationRes, TranslationSampleRes, TranslationsProvider) {
    //own methods
    this.getTranslations = function (options, onSuccess, onError) {
        return TranslationRes.query(options, onSuccess, onError);
    };

    this.deleteTranslation = function (id) {
        return new TranslationRes({id: id}).$delete();
    };

    this.addTranslationSample = function (translationId, sample) {
        var translationSample = new TranslationSampleRes();
        translationSample.translationId = translationId;
        translationSample.sample = sample;
        return translationSample.$save();
    };

    this.getTranslationSamples = function (translationId, onSuccess, onError) {
        return TranslationSampleRes.query({translationId: translationId}, onSuccess, onError);
    };

    this.deleteTranslationSample = function (translationSampleId) {
        return TranslationSampleRes.delete({id: translationSampleId});
    };

    //configurable translations provider
    if (TranslationsProvider == 'yandex') {
        var yandexTranslate = $injector.get('YandexTranslateService');
        return angular.extend(yandexTranslate, this);
    }
    else
        return null;
});

module.factory('TranslationRes', function ($resource, BaseUrl) {
    console.log("BaseUrl: "+BaseUrl);
    return $resource(BaseUrl + 'resources/translations/:id', {id: '@id'});
});

module.factory('TranslationSampleRes', function ($resource, BaseUrl) {
    return $resource(BaseUrl + 'resources/translations/:translationId/samples/:id',
        {translationId: '@translationId', id: '@id'});
});

/**
 * Graphical User Interface services
 */
module.service('UI', function ($window, $ionicLoading) {
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

module.service("ModalDialogService", ['$ionicPopup', '$q', function ($ionicPopup, $q) {
    this.showYesNoModal = function (title, msg) {
        var deferred = $q.defer();
        var promise = deferred.promise;

        var confirmPopup = $ionicPopup.confirm({
            title: title,
            template: msg
        });
        confirmPopup.then(function (res) {
            if (res) {
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
module.factory('UserService', function ($window)
{
    var anonymousEmail='anonymous@memslate.com';
    var anonymousUser='Anonymous';

    if(!$window.sessionStorage.name) //user not already defined
    {
        $window.sessionStorage.name=anonymousUser;
        $window.sessionStorage.email=anonymousEmail;
        $window.sessionStorage.isAuthenticated="false";
        $window.sessionStorage.isAdmin="false";
        $window.sessionStorage.tokenDisabled="false";
    }

    var user = {
        isAuthenticated: function (val) {
            if (val !== undefined) {
                $window.sessionStorage.isAuthenticated = val;
            }
            else {
                return JSON.parse($window.sessionStorage.isAuthenticated);
            }
        },
        isAdmin: function (val) {
            if (val !== undefined) {
                $window.sessionStorage.isAdmin = val;
            }
            else {
                return JSON.parse($window.sessionStorage.isAdmin);
            }
        },
        name: function (val) {
            if (val !== undefined) {
                $window.sessionStorage.name = val;
            }
            else {
                return $window.sessionStorage.name;
            }
        },
        email: function (val) {
            if (val !== undefined) {
                $window.sessionStorage.email = val;
            }
            else {
                return $window.sessionStorage.email;
            }
        },
        token: function (val) {
            if (val !== undefined) {
                $window.sessionStorage.token = val;
            }
            else {
                return $window.sessionStorage.token;
            }
        },
        logout: function () {
            delete $window.sessionStorage.token;
            $window.sessionStorage.name=anonymousEmail;
            $window.sessionStorage.email=anonymousUser;
            $window.sessionStorage.isAdmin=false;
            $window.sessionStorage.isAuthenticated=false;
        },
        login:function(user)
        {
            $window.sessionStorage.token=user.token;
            $window.sessionStorage.name=user.name;
            $window.sessionStorage.email=user.email;
            $window.sessionStorage.isAdmin=user.isAdmin;
            $window.sessionStorage.isAuthenticated=true;
        }
    };

    return user;
});

module.factory('TokenInterceptor', function ($q, $window, $location, UserService) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            if (UserService.token()) {
                config.headers.Authorization = 'Bearer ' + UserService.token();
            }
            return config;
        },

        requestError: function (rejection) {
            return $q.reject(rejection);
        },

        /* Set Authentication.isAuthenticated to true if 200 received */
        response: function (response) {
            if (response != null && response.status == 200 && UserService.token() && !UserService.isAuthenticated()) {
                UserService.isAuthenticated(true);
            }
            return response || $q.when(response);
        },

        /* Revoke client authentication if 401 is received */
        responseError: function (rejection) {
            if (rejection != null && rejection.status === 401 && (UserService.token() || UserService.isAuthenticated())) {
                UserService.token(null);
                UserService.isAuthenticated(false);
            }

            return $q.reject(rejection);
        }
    };
});

module.factory('RegistrationService', function ($window, $http, $ionicPopup, $rootScope, UserService, BaseUrl) {
    return {
        login: function (email, password) {
            return $http.post(BaseUrl + 'login', {
                email: email,
                password: password
            }).then(function (result) {
                console.log(result.data);
                UserService.login(result.data);

                $rootScope.$broadcast('ms:login');

                return {done: true};
            }).catch(function (err) {
                return {done: false, err: err};
            });
        },

        logout: function () {
            UserService.logout();

            $rootScope.$broadcast('ms:logout');
        },

        register: function (user) {
            return $http.post(BaseUrl + 'register', user).then(function (result) {
                UserService.login(result.data);

                $rootScope.$broadcast('ms:register');
                $rootScope.$broadcast('ms:login');

                return {done: true};
            }).catch(function (err) {
                return {done: false, err: err};
            });
        }
    }
});