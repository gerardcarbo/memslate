/// <reference path="../../typings/tsd.d.ts" />
declare var msUtils: any;

module Translate {

    export class Translation {
        fromLang: string = "";
        toLang: string = "";
        translate: string = "";
        provider: string = "";
        mainResult: string = "";
        transcription: string = "";
        rawResult: string = "";
    }

    interface Dictionary {
        [index: string]: string;
    }

    export class UserLanguages {
        fromLang: string = "";
        toLang: string = "";
        prefered: string[] = [];
    }

    export class Languages {
        items: Dictionary;
        user: UserLanguages = new UserLanguages();
    }

    interface ILanguagesProvider {
        getLanguages(): Languages;
    }

    interface ILanguagesService extends ILanguagesProvider {
        getLanguage(langId: string): string;

        getUserLanguages(): UserLanguages;
    }

    interface ITranslationsProvider {
        detect(text): ng.IPromise<void>

        translate(fromLang, toLang, text): ng.IPromise<void>
    }

    export class TranslationsProviders {
        static $inject = ['$log', 'SessionService'];
        _providers = {};

        constructor(public $log, public SessionService) {
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

        public getProviders = function () {
            return this._providers;
        };

        public getProvider = function () {
            return this._provider;
        };

        public setProvider = function (provider) {
            this.$log.log('TranslationsProvider: ' + provider);
            var providerObj = this._providers[provider];
            if (providerObj !== undefined) {
                this._provider = providerObj;
                this.SessionService.put('TranslateServiceProvider', provider);
                return this._provider;
            }
            return undefined;
        };
    }

    export class YandexLanguagesService implements ILanguagesProvider {
        static $inject = ['$q', '$rootScope', '$http', 'YandexTranslateApiKey'];

        constructor(public $q, public $rootScope, public $http, public YandexTranslateApiKey) {
        }

        public getLanguages = function () {
            var yandexGet = this.$q.defer();
            var promiseYandex = yandexGet.promise;

            this.$http.get('https://translate.yandex.net/api/v1.5/tr.json/getLangs',
                {
                    params: {
                        key: this.YandexTranslateApiKey,
                        ui: 'en'
                    },
                    withCredentials: false
                }
            ).success(function (data) {
                yandexGet.resolve(data);
            })
                .error(function (data, status) {
                    yandexGet.reject(status);
                });

            return promiseYandex;
        };
    }

    export class LibreLanguagesService implements ILanguagesProvider {
        static $inject = ['$q', '$rootScope', '$http', 'BaseUrlService'];

        constructor(public $q, public $rootScope, public $http, public BaseUrlService) {
        }

        public getLanguages = function () {
            var languagesGet = this.$q.defer();
            var promiseLanguages = languagesGet.promise;

            var langsMemslate = { langs: {} };
            this.$http.get(this.BaseUrlService.getLibreTranslate() + 'languages')
                .success(function (data) {
                    data.map(function (lang) { langsMemslate.langs[lang.code] = lang.name })
                    languagesGet.resolve(langsMemslate);
                })
                .error(function (data, status) {
                    languagesGet.reject(status);
                });

            return promiseLanguages;
        };
    }

    export class LanguagesService implements ILanguagesService {
        langsGotten: boolean = false;

        public languages: Languages = new Translate.Languages();

        static $inject = ['$q', '$rootScope', '$http', '$resource', '$injector', 'SessionService', 'BaseUrlService', 'TranslationsProviders'];

        constructor(public $q, public $rootScope, public $http, public $resource, public $injector,
            public SessionService, public BaseUrlService, public TranslationsProviders) {
        }

        public getLanguages = function () {
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
            var allPromise = this.$q.all([promiseProviderLangs, promiseUserLangs]).then((data) => {
                if (data[0]) {
                    _self.languages.items = Object.keys(data[0].langs).map(function (item) {
                        return { value: item, name: data[0].langs[item] };
                    });
                    _self.languages.dirs = data[0].dirs;
                }
                this.languages.user = data[1];
                if (this.languages.user.prefered == undefined) {
                    this.languages.user.prefered = [];
                }
                this.langsGotten = true;

                return this.languages;
            });
            msUtils.decoratePromise(allPromise);
            return allPromise;
        };

        public getLanguage = function (langId) {
            return this.getLanguage_(langId);
        };

        getLanguage_ = function (langId) {
            return this.languages.items.filter(function (item) {
                return item.value == langId
            })[0];
        };

        public getUserLanguages = function () {
            var deferedGet = this.$q.defer();
            var promiseGetUserLanguages = deferedGet.promise;

            var userLanguages = this.SessionService.getObject('userLanguages');
            if (userLanguages !== undefined) {
                deferedGet.resolve(userLanguages);
                return promiseGetUserLanguages;
            }

            this.$resource(this.BaseUrlService.get() + 'resources/userLanguages/').get({},
                (data) => {
                    this.languages.user = data;
                    this.saveUserLanguages();
                    deferedGet.resolve(data);
                },
                (err) => {
                    deferedGet.reject(err);
                });

            return promiseGetUserLanguages;
        };

        saveUserLanguages = function () {
            this.SessionService.putObject('userLanguages', this.languages.user);
        };

        clearUserLanguages = function () {
            this.SessionService.remove('userLanguages');
        };

        public addPrefered = function (language) {
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

        public fromLang = function (val) {
            if (val !== undefined) {
                this.languages.user.fromLang = val;
                this.saveUserLanguages();
            }
            else {
                return this.languages.user.fromLang;
            }
        };

        public toLang = function (val) {
            if (val !== undefined) {
                this.languages.user.toLang = val;
                this.saveUserLanguages();
            }
            else {
                return this.languages.user.toLang;
            }
        };
    }

    export class YandexTranslateService implements ITranslationsProvider {
        static $inject = ['$log', '$rootScope', '$http', '$resource', '$q', '$injector', '$timeout', 'TranslationRes', 'YandexTranslateApiKey', 'YandexDictionaryApiKey'];

        constructor(public $log, public $rootScope, public $http, public $resource, public $q, public $injector, public $timeout, public TranslationRes, public YandexTranslateApiKey, public YandexDictionaryApiKey) {
            $log.log('YandexTranslateService:constructor');
        }

        public detect = function (text) {
            var deferred = this.$q.defer();
            var promise = deferred.promise;
            msUtils.decoratePromise(promise);

            this.$http.get('https://translate.yandex.net/api/v1.5/tr.json/detect',
                {
                    params: {
                        key: this.YandexTranslateApiKey,
                        text: [text]
                    },
                    withCredentials: false
                }
            ).success(function (data) {
                deferred.resolve(data);
            })
                .error(function (data, status) {
                    deferred.reject({ status: status, data: data });
                });

            return promise;
        };

        public translate = function (fromLang, toLang, text) {
            var deferred = this.$q.defer();
            var promise = deferred.promise;
            msUtils.decoratePromise(promise);

            /*
             * CORS not working when user logged in -> delete Authorization token with withCredentials=false
             */
            this.$http.get('https://dictionary.yandex.net/api/v1/dicservice.json/lookup',
                {
                    params: {
                        key: this.YandexDictionaryApiKey,
                        lang: fromLang + "-" + toLang,
                        text: text,
                        ui: 'en'
                    },
                    withCredentials: false
                }
            ).success((data) => {
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
                    this.$http.get('https://translate.yandex.net/api/v1.5/tr.json/translate',
                        {
                            params: {
                                key: this.YandexTranslateApiKey,
                                lang: fromLang + "-" + toLang,
                                text: text,
                                ui: 'en'
                            },
                            withCredentials: false
                        }
                    ).success((dataTranslate) => {
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
                        .error((data, status) => {
                            deferred.reject({ status: status, data: data });
                        });
                }
            }
            ).error(function (data, status) {
                deferred.reject({ status: status, data: data });
            });

            return promise;
        };
    }


    export class LibreTranslateService implements ITranslationsProvider {
        static $inject = ['$log', '$rootScope', '$http', '$resource', '$q', '$injector', '$timeout', 'TranslationRes', 'BaseUrlService'];

        constructor(public $log, public $rootScope, public $http, public $resource, public $q, public $injector, public $timeout, public TranslationRes, public BaseUrlService) {
            $log.log('LibreTranslateService:constructor');
        }

        public detect = function (text) {
            var deferred = this.$q.defer();
            var promise = deferred.promise;
            msUtils.decoratePromise(promise);

            this.$http.post(this.BaseUrlService.getLibreTranslate() + 'detect',
                {
                    q: text,
                })
                .success(function (data) {
                    deferred.resolve(data[0].language);
                })
                .error(function (data, status) {
                    deferred.reject({ status: status, data: data });
                });

            return promise;
        };

        public translate = function (fromLang, toLang, text) {
            var deferred = this.$q.defer();
            var promise = deferred.promise;
            msUtils.decoratePromise(promise);

            /*
             * CORS not working when user logged in -> delete Authorization token with withCredentials=false
             */
            this.$http.post(this.BaseUrlService.getLibreTranslate() + 'translate',
                {
                    q: text,
                    source: fromLang,
                    target: toLang
                })
                .success((data) => {
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
                    } else {
                        deferred.reject("Translation not found");
                    }
                }
                ).error(function (data, status) {
                    deferred.reject({ status: status, data: data });
                });

            return promise;
        };
    }

    export class TranslateService implements ITranslationsProvider {

        static $inject = ['$log', '$http', '$injector', '$q', 'SessionService', 'TranslationRes', 'LanguagesService', 'TranslationSampleRes', 'TranslationsProviders'];

        currentTranslationsProvider: ITranslationsProvider;

        constructor(public $log, public $http, public $injector, public $q, public SessionService, public TranslationRes, public LanguagesService, public TranslationSampleRes, public TranslationsProviders) {
        }

        public setProvider = function (provider: string) {
            var transProviderInfo = this.TranslationsProviders.setProvider(provider);
            if (transProviderInfo !== undefined) {
                //configurable translations provider
                this.currentTranslationsProvider = this.$injector.get(transProviderInfo.translate);
            }

        };

        public getTranslationsGroups = function (options) {
            options.distinct = 1;
            return this.TranslationRes.query(options).$promise;
        };

        public getTranslations = function (options) {
            return this.TranslationRes.query(options).$promise;
        };

        public getTranslation = function (id: number) {
            return this.TranslationRes.get({ id: id }).$promise;
        };

        public deleteTranslation = function (id: number) {
            return new this.TranslationRes({ id: id }).$delete();
        };

        public addTranslationSample = function (translationId: number, sample) {
            if (sample === '') return;
            var translationSample = new this.TranslationSampleRes();
            translationSample.translationId = translationId;
            translationSample.sample = sample;
            return translationSample.$save();
        };

        public getTranslationSamples = function (translationId: number, onSuccess, onError) {
            return this.TranslationSampleRes.query({ translationId: translationId }, onSuccess, onError);
        };

        public deleteTranslationSample = function (translationSampleId: number) {
            return this.TranslationSampleRes.delete({ id: translationSampleId });
        };

        public detect = function (txt: string) {
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

        public translate = function (fromLang, toLang, text) {
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
                    .then((translation) => {
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
                            translationRes.$save(
                                () => {
                                    _this.$log.log('Translation Saved: id:' + translationRes.id);
                                    translation.id = translationRes.id;
                                    deferred.resolve(translation);
                                },
                                (error) => {
                                    //retry
                                    translationRes.$save(() => {
                                        _this.$log.log('Translation Saved: id:' + translationRes.id);
                                        translation.id = translationRes.id;
                                        deferred.resolve(translation);
                                    },
                                        (error) => {
                                            deferred.resolve(translation);
                                        });
                                });
                        } else {
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
}

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
        return $resource(BaseUrlService.get() + 'resources/translations/:id',
            { id: '@id' },
            { 'query': { method: 'GET', isArray: true, timeout: 5000 } });
    });

    servicesMod.factory('TranslationSampleRes', function ($resource, BaseUrlService) {
        return $resource(BaseUrlService.get() + 'resources/translations/:translationId/samples/:id',
            { translationId: '@translationId', id: '@id' });
    });

    servicesMod.service('YandexLanguagesService', Translate.YandexLanguagesService);

    servicesMod.service('YandexTranslateService', Translate.YandexTranslateService);

    servicesMod.service('LibreLanguagesService', Translate.LibreLanguagesService);

    servicesMod.service('LibreTranslateService', Translate.LibreTranslateService);

    servicesMod.service('LanguagesService', Translate.LanguagesService);

    servicesMod.service('TranslateService', Translate.TranslateService);
})
    ();

