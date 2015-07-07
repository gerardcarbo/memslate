/**
 * Created by gerard on 18/02/2015.
 */
"use strict";

var servicesMod = angular.module('memslate.services', ['ngResource', 'ngCookies',  'ionic']);

servicesMod.config(function ($httpProvider) {
    //Enable cross domain calls
    $httpProvider.defaults.useXDomain = true;
    //Remove the header used to identify ajax call  that would prevent CORS from working
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

servicesMod.constant('TranslationsProvider', 'yandex');
servicesMod.constant('BaseUrl', 'http://localhost:5000/');
//servicesMod.constant('BaseUrl', 'https://memslate.herokuapp.com/');

servicesMod.constant('YandexTranslateApiKey', 'trnsl.1.1.20140425T085916Z.05949a2c8c78dfa7.d025a7c757cb09916dca86cb06df4e0686d81430');
servicesMod.constant('YandexDictionaryApiKey', 'dict.1.1.20140425T100742Z.a6641c6755e8a074.22e10a5caa7ce385cffe8e2104a66ce60400d0bb');

servicesMod.service('SessionService', function ($cookies)
{
    this._useLocalStorage = false;
    if(typeof(Storage) !== "undefined") {
        // localStorage defined.
        this._useLocalStorage = true;
        console.log('SessionService: using local storage');
    }

    this.get = function(key)
    {
        if(this._useLocalStorage)
        {
            return localStorage.getItem(key);
        }
        return $cookies[key];
    }

    this.getObject = function(key)
    {
        var obj={};
        if(this._useLocalStorage)
        {
            obj = angular.fromJson(localStorage.getItem(key));
        }
        else
        {
            obj = angular.fromJson($cookies[key])
        }
        return msUtils.convertDateStringsToDates(obj);
    }

    this.put = function(key, value)
    {
        if(this._useLocalStorage)
        {
            localStorage.setItem(key, value);
            return;
        }
        $cookies[key] = value;
    }

    this.putObject = function(key, value)
    {
        if(this._useLocalStorage)
        {
            localStorage.setItem(key, angular.toJson(value));
            return;
        }
        $cookies[key] = angular.toJson(value);
    }

    this.remove = function(key)
    {
        if(this._useLocalStorage)
        {
            localStorage.removeItem(key);
            return;
        }
        $cookies[key] = null;
    }
});

var DesAuthorizable = {};
DesAuthorizable.deleteAuthorizationHeader = function(d,headersGetter) {
    var headers = headersGetter();
    delete headers.Authorization;

    return JSON.stringify(d);
};

servicesMod.service('LanguagesService', function ($q, $rootScope, $http, $resource, SessionService,
                                                YandexTranslateApiKey, BaseUrl)
{
    var self = this;
    angular.extend(this,DesAuthorizable);

    this.langsGotten = false;
    this.languages = {};
    this.languages.user = {};
    this.languages.user.prefered = [];

    this.getLanguages = function()
    {
        if(this.langsGotten)
        {
            var deferred = $q.defer();
            deferred.resolve(this.languages);
            return deferred.promise;
        }

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
        ).success(function (data)
            {
                self.langsGotten = true;
                yandexGet.resolve(data);
            })
            .error(function(data, status)
            {
                yandexGet.reject(status);
            });

        var promiseUserLangs = this.getUserLanguages();

        var allPromise = $q.all([promiseYandex, promiseUserLangs]).then(function(data)
        {
            self.languages.items = Object.keys(data[0].langs).map(function(item){
                return {value: item, name: data[0].langs[item]};
            });
            self.languages.dirs = data[0].dirs;
            self.languages.user = data[1];

            return self.languages;
        });
        msUtils.decoratePromise(allPromise);
        return allPromise;
    };

    this.getUserLanguages = function()
    {
        var deferedGet = $q.defer();
        var promiseGetUserLanguages = deferedGet.promise;

        var userLanguages = SessionService.getObject('userLanguages');
        if(userLanguages !== null)
        {
            deferedGet.resolve(userLanguages);
            return promiseGetUserLanguages;
        }

        $resource(BaseUrl + 'resources/userLanguages/').get({},
            function(data){
                self.languages.user = data;
                self.saveUserLanguages();
                deferedGet.resolve(data);
            },
            function(err){
                deferedGet.reject(err);
            });

        return promiseGetUserLanguages;
    };

    this.saveUserLanguages = function()
    {
        SessionService.putObject('userLanguages',this.languages.user);
    }

    this.clearUserLanguages = function()
    {
        SessionService.remove('userLanguages');
    };

    this.addPrefered = function(language)
    {
        if(language)
        {
            var pos = this.languages.user.prefered.indexOf(language);
            if(pos !== -1)
            {
                this.languages.user.prefered.splice(pos, 1);
            }
            this.languages.user.prefered.unshift(language);
            if(this.languages.user.prefered.length > 4)
            {
                this.languages.user.prefered.pop();
            }

            this.saveUserLanguages();
        }
    };

    this.fromLang = function(val)
    {
        if(val !== undefined)
        {
            this.languages.user.fromLang=val;
            this.saveUserLanguages();
        }
        else
        {
            return this.languages.user.fromLang;
        }
    }

    this.toLang = function(val)
    {
        if(val !== undefined)
        {
            this.languages.user.toLang=val;
            this.saveUserLanguages();
        }
        else
        {
            return this.languages.user.toLang;
        }
    }
});

/**
 * Translation services
 */
servicesMod.service('YandexTranslateService', function ($rootScope, $http, $resource, $q, $timeout,
                                                        TranslationRes, UserService,
                                                        YandexTranslateApiKey, YandexDictionaryApiKey)
{
    var self = this;

    angular.extend(this,DesAuthorizable);

    this.translate = function (fromLang, toLang, text)
    {
        var deferred = $q.defer();
        var promise = deferred.promise;
        msUtils.decoratePromise(promise);

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
        ).success(function (data)
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

                    deferred.resolve(translation);
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
                        ).success(function (dataTranslate) {
                            if (dataTranslate.text && dataTranslate.text.length > 0 && dataTranslate.text[0] !== translation.translate) {
                                translation.provider = 'yt';
                                translation.mainResult = dataTranslate.text[0];
                                translation.rawResult = dataTranslate;

                                deferred.resolve(translation);
                            }
                            else {
                                deferred.reject("Translation not found");
                            }
                        })
                        .error(function (data, status) {
                            deferred.reject(data.message);
                        });
                }
            }
        ).error(function (data, status) {
                deferred.reject(data.message);
            });

        return promise;
    };
});

servicesMod.factory('TranslateService', function ($injector, $q, TranslationRes, LanguagesService, TranslationSampleRes, TranslationsProvider) {
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
    if (TranslationsProvider === 'yandex') {
        var yandexTranslate = $injector.get('YandexTranslateService');
        this._translate = yandexTranslate.translate;
    }
    else
    {
        this._translate = function(fromLang, toLang, text)
        {
            var deferred = $q.defer();
            var promise = deferred.promise;
            deferred.reject('Translations provider not specified');
            return promise;
        }
    }

    this.translate = function(fromLang, toLang, text)
    {
        var deferred = $q.defer();
        var promise = deferred.promise;
        msUtils.decoratePromise(promise);

        this._translate(fromLang, toLang, text)
            .success(function(translation)
            {
                LanguagesService.fromLang(fromLang);
                LanguagesService.toLang(toLang);
                LanguagesService.addPrefered(fromLang);
                LanguagesService.addPrefered(toLang);

                var translationRes = new TranslationRes(translation);
                translationRes.$save(function () {
                    console.log('Translation Saved: id:' + translationRes.id);
                    translation.id = translationRes.id;

                    deferred.resolve(translation);
                });
            })
            .error(function(err)
            {
                deferred.reject(err);
            });

        return promise;
    };

    return this;
});

servicesMod.factory('TranslationRes', function ($resource, BaseUrl) {
    console.log("BaseUrl: " + BaseUrl);
    return $resource(BaseUrl + 'resources/translations/:id', {id: '@id'});
});

servicesMod.factory('TranslationSampleRes', function ($resource, BaseUrl) {
    return $resource(BaseUrl + 'resources/translations/:translationId/samples/:id',
        {translationId: '@translationId', id: '@id'});
});

servicesMod.service("MemoFilterService", function ($resource, BaseUrl, SessionService)
{
    this.memoFilterSettings = SessionService.getObject('memoFilterSettings');
    if (this.memoFilterSettings === null)
    {
        this.memoFilterSettings = {};
        this.memoFilterSettings.filterByString=false;
        this.memoFilterSettings.filterByDates=false;
        this.memoFilterSettings.filterByLanguages=false;
        this.memoFilterSettings.filterString="";
        this.memoFilterSettings.filterDateFrom=new Date().adjustDate(-7);
        this.memoFilterSettings.filterDateTo=new Date();

        SessionService.putObject('memoFilterSettings',this.memoFilterSettings);
    }
});

/**
 * Graphical User Interface services
 */
servicesMod.service('UI', function ($window, $timeout, $ionicLoading, $ionicBody) {
    this.toast = function (msg, duration, position) {
        if (!duration)
        {
            duration = msConfig.toastShowTime;
        }
        if (!position)
        {
            position = 'top';
        }

        // PhoneGap? Use native:
        if ($window.plugins) {
            if ($window.plugins.toast)
            {
                $window.plugins.toast.show(msg, duration, position);
            }
            return;
        }

        // … fallback / customized $ionicLoading:
        /*$ionicLoading.show({
            template: msg,
            noBackdrop: true
        });*/
        this._toast(msg,duration);
    };

    this._toast =function(message,timeout,cssClass)
    {
        timeout = timeout || 2000;
        cssClass = typeof cssClass !== 'undefined' ? cssClass : 'notification_error';

        if($('#toasts').length===0)
        {
            $ionicBody.append($('<div id="toasts-wrapper" class="flexbox-container"><div id="toasts"></div></div>'));
        }

        var $message = $('<p class="toast" style="display:none;margin:5px auto">' + message + '</p>');

        $('#toasts').append($message);
        $message.addClass(cssClass);
        $message.fadeIn(300, function() {
            window.setTimeout(function() {
                $message.fadeOut(300, function() {
                    $message.remove();
                });
            }, timeout);
        });
    };
});

servicesMod.service("ModalDialogService", ['$ionicPopup', '$q', function ($ionicPopup, $q) {
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
servicesMod.factory('UserService', function ($window)
{
    var anonymousEmail = 'anonymous@memslate.com';
    var anonymousUser = 'Anonymous';

    if(!$window.sessionStorage.name) //user not already defined
    {
        $window.sessionStorage.name = anonymousUser;
        $window.sessionStorage.email = anonymousEmail;
        $window.sessionStorage.isAuthenticated = "false";
        $window.sessionStorage.isAdmin = "false";
        $window.sessionStorage.tokenDisabled = "false";
    }

    var userService = {
        isAuthenticated: function (val)
        {
            if (val !== undefined) {
                $window.sessionStorage.isAuthenticated = val;
            }
            else {
                return JSON.parse($window.sessionStorage.isAuthenticated);
            }
        },
        isAdmin: function (val)
        {
            if (val !== undefined) {
                $window.sessionStorage.isAdmin = val;
            }
            else {
                return JSON.parse($window.sessionStorage.isAdmin);
            }
        },
        name: function (val)
        {
            if (val !== undefined) {
                $window.sessionStorage.name = val;
            }
            else {
                return $window.sessionStorage.name;
            }
        },
        email: function (val)
        {
            if (val !== undefined) {
                $window.sessionStorage.email = val;
            }
            else {
                return $window.sessionStorage.email;
            }
        },
        token: function (val)
        {
            if (val !== undefined) {
                $window.sessionStorage.token = val;
            }
            else {
                return $window.sessionStorage.token;
            }
        },
        logout: function ()
        {
            delete $window.sessionStorage.token;
            $window.sessionStorage.name = anonymousUser;
            $window.sessionStorage.email = anonymousEmail;
            $window.sessionStorage.isAdmin = false;
            $window.sessionStorage.isAuthenticated = false;
        },
        login: function(usr)
        {
            $window.sessionStorage.token = usr.token;
            $window.sessionStorage.name = usr.name;
            $window.sessionStorage.email = usr.email;
            $window.sessionStorage.isAdmin = usr.isAdmin;
            $window.sessionStorage.isAuthenticated = true;
        }
    };

    return userService;
});

servicesMod.factory('TokenInterceptor', function ($q, $window, $location, UserService) {
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
            if (response != null && response.status === 200 && UserService.token() && !UserService.isAuthenticated()) {
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

servicesMod.factory('RegistrationService', function ($window, $http, $ionicPopup, $rootScope, UserService, BaseUrl) {
    return {
        login: function (email, password) {
            return $http.post(BaseUrl + 'login', {
                email: email,
                password: password
            }).then(function (result) {
                UserService.login(result.data);

                $rootScope.$broadcast('ms:login');

                return {done: true};
            }).catch(function (err) {
                return {done: false, err: err};
            });
        },

        logout: function () {
;
            return $http.post(BaseUrl + 'logout').then(function (result) {
                return {done: true};
            }).catch(function (err) {
                return {done: false, err: err};
            }).finally(function (){
                UserService.logout();
                $rootScope.$broadcast('ms:logout')
            });
        },

        register: function (user)
        {
            return $http.post(BaseUrl + 'register', user).then(function (result) {
                UserService.login(result.data);

                $rootScope.$broadcast('ms:register');
                $rootScope.$broadcast('ms:login');

                return {done: true};
            }).catch(function (err) {
                return {done: false, err: err};
            });
        },

        unregister: function()
        {
            return $http.post(BaseUrl + 'unregister')
                .then(function (result)
                {
                    $rootScope.$broadcast('ms:unregister');
                    UserService.logout();

                    return {done: true};
                })
                .catch(function (err)
                {
                    return {done: false, err: err};
                });
        },

        changePassword: function(oldPwd, newPwd)
        {
            var data={oldPwd: oldPwd, newPwd: newPwd};
            return $http.post(BaseUrl + 'changePwd', data)
            .then(function (result)
            {
                return {done: true};
            })
            .catch(function (err)
            {
                return {done: false, err: err};
            });
        }
    };
});
