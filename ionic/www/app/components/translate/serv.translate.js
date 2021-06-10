/// <reference path="../../typings/tsd.d.ts" />
var Translate;
(function (Translate) {
    var Translation = /** @class */ (function () {
        function Translation() {
            this.fromLang = "";
            this.toLang = "";
            this.translate = "";
            this.provider = "";
            this.mainResult = "";
            this.transcription = "";
            this.rawResult = "";
        }
        return Translation;
    }());
    Translate.Translation = Translation;
    var UserLanguages = /** @class */ (function () {
        function UserLanguages() {
            this.fromLang = "";
            this.toLang = "";
            this.prefered = [];
        }
        return UserLanguages;
    }());
    Translate.UserLanguages = UserLanguages;
    var Languages = /** @class */ (function () {
        function Languages() {
            this.user = new UserLanguages();
        }
        return Languages;
    }());
    Translate.Languages = Languages;
    var TranslationsProviders = /** @class */ (function () {
        function TranslationsProviders($log, SessionService) {
            this.$log = $log;
            this.SessionService = SessionService;
            this._providers = {};
            this.getProviders = function () {
                return this._providers;
            };
            this.getProvider = function () {
                return this._provider;
            };
            this.setProvider = function (provider) {
                this.$log.log('TranslationsProvider: ' + provider);
                var providerObj = this._providers[provider];
                if (providerObj !== undefined) {
                    this._provider = providerObj;
                    this.SessionService.put('TranslateServiceProvider', provider);
                    return this._provider;
                }
                return undefined;
            };
            this._providers['Yandex'] = {
                name: 'Yandex',
                languages: 'YandexLanguagesService',
                translate: 'YandexTranslateService'
            };
            this._providers['Libre'] = {
                name: 'Libre',
                languages: 'LibreLanguagesService',
                translate: 'LibreTranslateService'
            };
        }
        TranslationsProviders.$inject = ['$log', 'SessionService'];
        return TranslationsProviders;
    }());
    Translate.TranslationsProviders = TranslationsProviders;
    var YandexLanguagesService = /** @class */ (function () {
        function YandexLanguagesService($q, $rootScope, $http, YandexTranslateApiKey) {
            this.$q = $q;
            this.$rootScope = $rootScope;
            this.$http = $http;
            this.YandexTranslateApiKey = YandexTranslateApiKey;
            this.getLanguages = function () {
                var yandexGet = this.$q.defer();
                var promiseYandex = yandexGet.promise;
                this.$http.get('https://translate.yandex.net/api/v1.5/tr.json/getLangs', {
                    params: {
                        key: this.YandexTranslateApiKey,
                        ui: 'en'
                    },
                    withCredentials: false
                }).success(function (data) {
                    yandexGet.resolve(data);
                })
                    .error(function (data, status) {
                    yandexGet.reject(status);
                });
                return promiseYandex;
            };
        }
        YandexLanguagesService.$inject = ['$q', '$rootScope', '$http', 'YandexTranslateApiKey'];
        return YandexLanguagesService;
    }());
    Translate.YandexLanguagesService = YandexLanguagesService;
    var LibreLanguagesService = /** @class */ (function () {
        function LibreLanguagesService($q, $rootScope, $http, BaseUrlService) {
            this.$q = $q;
            this.$rootScope = $rootScope;
            this.$http = $http;
            this.BaseUrlService = BaseUrlService;
            this.getLanguages = function () {
                var languagesGet = this.$q.defer();
                var promiseLanguages = languagesGet.promise;
                var langsMemslate = { langs: {} };
                this.$http.get(this.BaseUrlService.getLibreTranslate() + 'languages')
                    .success(function (data) {
                    data.map(function (lang) { langsMemslate.langs[lang.code] = lang.name; });
                    languagesGet.resolve(langsMemslate);
                })
                    .error(function (data, status) {
                    languagesGet.reject(status);
                });
                return promiseLanguages;
            };
        }
        LibreLanguagesService.$inject = ['$q', '$rootScope', '$http', 'BaseUrlService'];
        return LibreLanguagesService;
    }());
    Translate.LibreLanguagesService = LibreLanguagesService;
    var LanguagesService = /** @class */ (function () {
        function LanguagesService($q, $rootScope, $http, $resource, $injector, SessionService, BaseUrlService, TranslationsProviders) {
            this.$q = $q;
            this.$rootScope = $rootScope;
            this.$http = $http;
            this.$resource = $resource;
            this.$injector = $injector;
            this.SessionService = SessionService;
            this.BaseUrlService = BaseUrlService;
            this.TranslationsProviders = TranslationsProviders;
            this.langsGotten = false;
            this.languages = new Translate.Languages();
            this.getLanguages = function () {
                var _this_1 = this;
                if (this.langsGotten) {
                    var deferred = this.$q.defer();
                    deferred.resolve(this.languages);
                    return deferred.promise;
                }
                var promiseProviderLangs;
                if (this.TranslationsProviders.getProvider()) {
                    var languagesService = this.$injector.get(this.TranslationsProviders.getProvider().languages);
                    promiseProviderLangs = languagesService.getLanguages();
                }
                var promiseUserLangs = this.getUserLanguages();
                var _self = this;
                var allPromise = this.$q.all([promiseProviderLangs, promiseUserLangs]).then(function (data) {
                    if (data[0]) {
                        _self.languages.items = Object.keys(data[0].langs).map(function (item) {
                            return { value: item, name: data[0].langs[item] };
                        });
                        _self.languages.dirs = data[0].dirs;
                    }
                    _this_1.languages.user = data[1];
                    if (_this_1.languages.user.prefered == undefined) {
                        _this_1.languages.user.prefered = [];
                    }
                    _this_1.langsGotten = true;
                    return _this_1.languages;
                });
                msUtils.decoratePromise(allPromise);
                return allPromise;
            };
            this.getLanguage = function (langId) {
                return this.getLanguage_(langId);
            };
            this.getLanguage_ = function (langId) {
                return this.languages.items.filter(function (item) {
                    return item.value == langId;
                })[0];
            };
            this.getUserLanguages = function () {
                var _this_1 = this;
                var deferedGet = this.$q.defer();
                var promiseGetUserLanguages = deferedGet.promise;
                var userLanguages = this.SessionService.getObject('userLanguages');
                if (userLanguages !== undefined) {
                    deferedGet.resolve(userLanguages);
                    return promiseGetUserLanguages;
                }
                this.$resource(this.BaseUrlService.get() + 'resources/userLanguages/').get({}, function (data) {
                    _this_1.languages.user = data;
                    _this_1.saveUserLanguages();
                    deferedGet.resolve(data);
                }, function (err) {
                    deferedGet.reject(err);
                });
                return promiseGetUserLanguages;
            };
            this.saveUserLanguages = function () {
                this.SessionService.putObject('userLanguages', this.languages.user);
            };
            this.clearUserLanguages = function () {
                this.SessionService.remove('userLanguages');
            };
            this.addPrefered = function (language) {
                if (language) {
                    var pos = this.languages.user.prefered.indexOf(language);
                    if (pos !== -1) {
                        this.languages.user.prefered.splice(pos, 1);
                    }
                    this.languages.user.prefered.unshift(language);
                    if (this.languages.user.prefered.length > 4) {
                        this.languages.user.prefered.pop();
                    }
                    this.saveUserLanguages();
                }
            };
            this.fromLang = function (val) {
                if (val !== undefined) {
                    this.languages.user.fromLang = val;
                    this.saveUserLanguages();
                }
                else {
                    return this.languages.user.fromLang;
                }
            };
            this.toLang = function (val) {
                if (val !== undefined) {
                    this.languages.user.toLang = val;
                    this.saveUserLanguages();
                }
                else {
                    return this.languages.user.toLang;
                }
            };
        }
        LanguagesService.$inject = ['$q', '$rootScope', '$http', '$resource', '$injector', 'SessionService', 'BaseUrlService', 'TranslationsProviders'];
        return LanguagesService;
    }());
    Translate.LanguagesService = LanguagesService;
    var YandexTranslateService = /** @class */ (function () {
        function YandexTranslateService($log, $rootScope, $http, $resource, $q, $injector, $timeout, TranslationRes, YandexTranslateApiKey, YandexDictionaryApiKey) {
            this.$log = $log;
            this.$rootScope = $rootScope;
            this.$http = $http;
            this.$resource = $resource;
            this.$q = $q;
            this.$injector = $injector;
            this.$timeout = $timeout;
            this.TranslationRes = TranslationRes;
            this.YandexTranslateApiKey = YandexTranslateApiKey;
            this.YandexDictionaryApiKey = YandexDictionaryApiKey;
            this.detect = function (text) {
                var deferred = this.$q.defer();
                var promise = deferred.promise;
                msUtils.decoratePromise(promise);
                this.$http.get('https://translate.yandex.net/api/v1.5/tr.json/detect', {
                    params: {
                        key: this.YandexTranslateApiKey,
                        text: [text]
                    },
                    withCredentials: false
                }).success(function (data) {
                    deferred.resolve(data);
                })
                    .error(function (data, status) {
                    deferred.reject({ status: status, data: data });
                });
                return promise;
            };
            this.translate = function (fromLang, toLang, text) {
                var _this_1 = this;
                var deferred = this.$q.defer();
                var promise = deferred.promise;
                msUtils.decoratePromise(promise);
                /*
                 * CORS not working when user logged in -> delete Authorization token with withCredentials=false
                 */
                this.$http.get('https://dictionary.yandex.net/api/v1/dicservice.json/lookup', {
                    params: {
                        key: this.YandexDictionaryApiKey,
                        lang: fromLang + "-" + toLang,
                        text: text,
                        ui: 'en'
                    },
                    withCredentials: false
                }).success(function (data) {
                    var translation = new Translate.Translation();
                    translation.fromLang = fromLang;
                    translation.toLang = toLang;
                    translation.translate = text;
                    if (data && data.def && data.def.length > 0) {
                        translation.provider = 'yd';
                        translation.mainResult = data.def[0].tr[0].text;
                        translation.rawResult = data;
                        translation.transcription = data.def[0].ts;
                        deferred.resolve(translation);
                    }
                    else {
                        _this_1.$http.get('https://translate.yandex.net/api/v1.5/tr.json/translate', {
                            params: {
                                key: _this_1.YandexTranslateApiKey,
                                lang: fromLang + "-" + toLang,
                                text: text,
                                ui: 'en'
                            },
                            withCredentials: false
                        }).success(function (dataTranslate) {
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
                            deferred.reject({ status: status, data: data });
                        });
                    }
                }).error(function (data, status) {
                    deferred.reject({ status: status, data: data });
                });
                return promise;
            };
            $log.log('YandexTranslateService:constructor');
        }
        YandexTranslateService.$inject = ['$log', '$rootScope', '$http', '$resource', '$q', '$injector', '$timeout', 'TranslationRes', 'YandexTranslateApiKey', 'YandexDictionaryApiKey'];
        return YandexTranslateService;
    }());
    Translate.YandexTranslateService = YandexTranslateService;
    var LibreTranslateService = /** @class */ (function () {
        function LibreTranslateService($log, $rootScope, $http, $resource, $q, $injector, $timeout, TranslationRes, BaseUrlService) {
            this.$log = $log;
            this.$rootScope = $rootScope;
            this.$http = $http;
            this.$resource = $resource;
            this.$q = $q;
            this.$injector = $injector;
            this.$timeout = $timeout;
            this.TranslationRes = TranslationRes;
            this.BaseUrlService = BaseUrlService;
            this.detect = function (text) {
                var deferred = this.$q.defer();
                var promise = deferred.promise;
                msUtils.decoratePromise(promise);
                this.$http.get(this.BaseUrlService.getLibreTranslate() + 'detect')
                    .success(function (data) {
                    deferred.resolve(data[0].language);
                })
                    .error(function (data, status) {
                    deferred.reject({ status: status, data: data });
                });
                return promise;
            };
            this.translate = function (fromLang, toLang, text) {
                var deferred = this.$q.defer();
                var promise = deferred.promise;
                msUtils.decoratePromise(promise);
                /*
                 * CORS not working when user logged in -> delete Authorization token with withCredentials=false
                 */
                this.$http.post(this.BaseUrlService.getLibreTranslate() + 'translate', {
                    q: text,
                    source: fromLang,
                    target: toLang
                }).success(function (data) {
                    var translation = new Translate.Translation();
                    translation.fromLang = fromLang;
                    translation.toLang = toLang;
                    translation.translate = text;
                    if (data && data.translatedText && data.translatedText.toLowerCase() != text.toLowerCase()) {
                        translation.provider = 'li';
                        translation.mainResult = data.translatedText;
                        translation.rawResult = data;
                        translation.transcription = '';
                        deferred.resolve(translation);
                    }
                    else {
                        deferred.reject("Translation not found");
                    }
                }).error(function (data, status) {
                    deferred.reject({ status: status, data: data });
                });
                return promise;
            };
            $log.log('LibreTranslateService:constructor');
        }
        LibreTranslateService.$inject = ['$log', '$rootScope', '$http', '$resource', '$q', '$injector', '$timeout', 'TranslationRes', 'BaseUrlService'];
        return LibreTranslateService;
    }());
    Translate.LibreTranslateService = LibreTranslateService;
    var TranslateService = /** @class */ (function () {
        function TranslateService($log, $http, $injector, $q, SessionService, TranslationRes, LanguagesService, TranslationSampleRes, TranslationsProviders) {
            this.$log = $log;
            this.$http = $http;
            this.$injector = $injector;
            this.$q = $q;
            this.SessionService = SessionService;
            this.TranslationRes = TranslationRes;
            this.LanguagesService = LanguagesService;
            this.TranslationSampleRes = TranslationSampleRes;
            this.TranslationsProviders = TranslationsProviders;
            this.setProvider = function (provider) {
                var transProviderInfo = this.TranslationsProviders.setProvider(provider);
                if (transProviderInfo !== undefined) {
                    //configurable translations provider
                    this.currentTranslationsProvider = this.$injector.get(transProviderInfo.translate);
                }
            };
            this.getTranslationsGroups = function (options) {
                options.distinct = 1;
                return this.TranslationRes.query(options).$promise;
            };
            this.getTranslations = function (options) {
                return this.TranslationRes.query(options).$promise;
            };
            this.getTranslation = function (id) {
                return this.TranslationRes.get({ id: id }).$promise;
            };
            this.deleteTranslation = function (id) {
                return new this.TranslationRes({ id: id }).$delete();
            };
            this.addTranslationSample = function (translationId, sample) {
                if (sample === '')
                    return;
                var translationSample = new this.TranslationSampleRes();
                translationSample.translationId = translationId;
                translationSample.sample = sample;
                return translationSample.$save();
            };
            this.getTranslationSamples = function (translationId, onSuccess, onError) {
                return this.TranslationSampleRes.query({ translationId: translationId }, onSuccess, onError);
            };
            this.deleteTranslationSample = function (translationSampleId) {
                return this.TranslationSampleRes.delete({ id: translationSampleId });
            };
            this.detect = function (txt) {
                if (this.currentTranslationsProvider) {
                    return this.currentTranslationsProvider.detect(txt);
                }
                else {
                    var deferred = this.$q.defer();
                    var promise = deferred.promise;
                    msUtils.decoratePromise(promise);
                    deferred.reject('Translations Provider not specified');
                    return promise;
                }
            };
            this.translate = function (fromLang, toLang, text) {
                var deferred = this.$q.defer();
                var promise = deferred.promise;
                msUtils.decoratePromise(promise);
                text = text.toLowerCase();
                text = text.trimChars(' "()\'');
                if (text.length > 350) {
                    text = text.substr(0, 350) + "...";
                }
                if (this.currentTranslationsProvider) {
                    var _this = this;
                    this.currentTranslationsProvider.translate(fromLang, toLang, text)
                        .then(function (translation) {
                        translation.mainResult = translation.mainResult.toLowerCase();
                        translation.mainResult = translation.mainResult.trimChars('\'');
                        translation.mainResult = translation.mainResult.trimChars('(');
                        translation.mainResult = translation.mainResult.trimChars(')');
                        _this.LanguagesService.fromLang(fromLang);
                        _this.LanguagesService.toLang(toLang);
                        _this.LanguagesService.addPrefered(fromLang);
                        _this.LanguagesService.addPrefered(toLang);
                        if (translation.mainResult.length < 40) { //do not save phrases
                            var translationRes = new _this.TranslationRes(translation);
                            translationRes.$save(function () {
                                _this.$log.log('Translation Saved: id:' + translationRes.id);
                                translation.id = translationRes.id;
                                deferred.resolve(translation);
                            }, function (error) {
                                //retry
                                translationRes.$save(function () {
                                    _this.$log.log('Translation Saved: id:' + translationRes.id);
                                    translation.id = translationRes.id;
                                    deferred.resolve(translation);
                                }, function (error) {
                                    deferred.resolve(translation);
                                });
                            });
                        }
                        else {
                            deferred.resolve(translation);
                        }
                    })
                        .catch(function (err) {
                        deferred.reject(err);
                    });
                }
                else {
                    deferred.reject('Translations Provider not specified');
                }
                return promise;
            };
        }
        TranslateService.$inject = ['$log', '$http', '$injector', '$q', 'SessionService', 'TranslationRes', 'LanguagesService', 'TranslationSampleRes', 'TranslationsProviders'];
        return TranslateService;
    }());
    Translate.TranslateService = TranslateService;
})(Translate || (Translate = {}));
(function () {
    "use strict";
    /**
     * Translate services
     */
    var servicesMod = angular.module('memslate.services');
    servicesMod.run(function ($rootScope, SessionService, TranslateService, TranslationRes) {
        //Configure current translations provider
        var provider = 'Libre';
        TranslateService.setProvider(provider);
        //wait connected
        $rootScope.$on('ms:connected', function () {
            console.log('servicesMod: ms:connected');
        });
    });
    servicesMod.service('TranslationsProviders', Translate.TranslationsProviders);
    servicesMod.constant('YandexTranslateApiKey', 'trnsl.1.1.20140425T085916Z.05949a2c8c78dfa7.d025a7c757cb09916dca86cb06df4e0686d81430');
    servicesMod.constant('YandexDictionaryApiKey', 'dict.1.1.20140425T100742Z.a6641c6755e8a074.22e10a5caa7ce385cffe8e2104a66ce60400d0bb');
    servicesMod.factory('TranslationRes', function ($log, $resource, BaseUrlService) {
        $log.log('TranslationRes: base ' + BaseUrlService.get());
        return $resource(BaseUrlService.get() + 'resources/translations/:id', { id: '@id' }, { 'query': { method: 'GET', isArray: true, timeout: 5000 } });
    });
    servicesMod.factory('TranslationSampleRes', function ($resource, BaseUrlService) {
        return $resource(BaseUrlService.get() + 'resources/translations/:translationId/samples/:id', { translationId: '@translationId', id: '@id' });
    });
    servicesMod.service('YandexLanguagesService', Translate.YandexLanguagesService);
    servicesMod.service('YandexTranslateService', Translate.YandexTranslateService);
    servicesMod.service('LibreLanguagesService', Translate.LibreLanguagesService);
    servicesMod.service('LibreTranslateService', Translate.LibreTranslateService);
    servicesMod.service('LanguagesService', Translate.LanguagesService);
    servicesMod.service('TranslateService', Translate.TranslateService);
})();
