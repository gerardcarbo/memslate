(function () {
  "use strict";

  /**
   * Translate services
   */
  var servicesMod = angular.module('memslate.services.translate', ['memslate.services', 'ngResource']);

  servicesMod.run(function(SessionService, TranslateService){
    //Configure current translations provider
    var provider = SessionService.get('TranslateServiceProvider') || 'Yandex';
    TranslateService.setProvider(provider);
  });

  servicesMod.service('TranslationsProvider', function ($log, SessionService) {
    this._providers = {};
    this._providers['Yandex'] = {
      name: 'Yandex',
      languages: 'YandexLanguagesService',
      translate: 'YandexTranslateService'
    };

    this.getProviders = function () {
      return this._providers;
    };

    this.getProvider = function () {
      return this._provider;
    };

    this.setProvider = function (provider) {
      $log.log('TranslationsProvider: '+provider);
      var providerObj = this._providers[provider];
      if (providerObj !== undefined) {
        this._provider = providerObj;
        SessionService.put('TranslateServiceProvider', provider);
        return this._provider;
      }
      return undefined;
    };
  });

  servicesMod.constant('YandexTranslateApiKey', 'trnsl.1.1.20140425T085916Z.05949a2c8c78dfa7.d025a7c757cb09916dca86cb06df4e0686d81430');
  servicesMod.constant('YandexDictionaryApiKey', 'dict.1.1.20140425T100742Z.a6641c6755e8a074.22e10a5caa7ce385cffe8e2104a66ce60400d0bb');

  servicesMod.factory('TranslationRes', function ($log, $resource, BaseUrlService) {
    return $resource(BaseUrlService.get() + 'resources/translations/:id', {id: '@id'});
  });

  servicesMod.factory('TranslationSampleRes', function ($resource, BaseUrlService) {
    return $resource(BaseUrlService.get() + 'resources/translations/:translationId/samples/:id',
      {translationId: '@translationId', id: '@id'});
  });

  servicesMod.service('YandexLanguagesService', function ($q, $rootScope, $http, $resource,
                                                          YandexTranslateApiKey) {
    var self = this;

    this.getLanguages = function () {
      var yandexGet = $q.defer();
      var promiseYandex = yandexGet.promise;

      $http.get('https://translate.yandex.net/api/v1.5/tr.json/getLangs',
        {
          params: {
            key: YandexTranslateApiKey,
            ui: 'en'
          },
          withCredentials: false
        }
      ).success(function (data) {
          self.langsGotten = true;
          yandexGet.resolve(data);
        })
        .error(function (data, status) {
          yandexGet.reject(status);
        });

      return promiseYandex;
    };
  });

  servicesMod.service('LanguagesService', function ($q, $rootScope, $http, $resource, $injector,
                                                    SessionService, BaseUrlService, TranslationsProvider) {
    var self = this;

    this.langsGotten = false;
    this.languages = {};
    this.languages.user = {};
    this.languages.user.prefered = [];

    this.getLanguages = function () {
      if (this.langsGotten) {
        var deferred = $q.defer();
        deferred.resolve(this.languages);
        return deferred.promise;
      }

      var promiseProviderLangs;
      if(TranslationsProvider.getProvider())
      {
        var languagesService = $injector.get(TranslationsProvider.getProvider().languages);
        promiseProviderLangs = languagesService.getLanguages();
      }

      var promiseUserLangs = this.getUserLanguages();

      var allPromise = $q.all([promiseProviderLangs, promiseUserLangs]).then(function (data) {
        if(data[0])
        {
          self.languages.items = Object.keys(data[0].langs).map(function (item) {
            return {value: item, name: data[0].langs[item]};
          });
          self.languages.dirs = data[0].dirs;
        }
        self.languages.user = data[1];
        self.langsGotten = true;

        return self.languages;
      });
      msUtils.decoratePromise(allPromise);
      return allPromise;
    };

    this.getLanguage = function (langId) {
      return this.getLanguage_(langId);
    };

    this.getLanguage_ = function (langId) {
      return this.languages.items.filter(function (item) {
        return item.value == langId
      })[0];
    };

    this.getUserLanguages = function () {
      var deferedGet = $q.defer();
      var promiseGetUserLanguages = deferedGet.promise;

      var userLanguages = SessionService.getObject('userLanguages');
      if (userLanguages !== null) {
        deferedGet.resolve(userLanguages);
        return promiseGetUserLanguages;
      }

      $resource(BaseUrlService.get() + 'resources/userLanguages/').get({},
        function (data) {
          self.languages.user = data;
          self.saveUserLanguages();
          deferedGet.resolve(data);
        },
        function (err) {
          deferedGet.reject(err);
        });

      return promiseGetUserLanguages;
    };

    this.saveUserLanguages = function () {
      SessionService.putObject('userLanguages', this.languages.user);
    };

    this.clearUserLanguages = function () {
      SessionService.remove('userLanguages');
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
    }

    this.toLang = function (val) {
      if (val !== undefined) {
        this.languages.user.toLang = val;
        this.saveUserLanguages();
      }
      else {
        return this.languages.user.toLang;
      }
    }
  });

  servicesMod.service('YandexTranslateService', function ($rootScope, $http, $resource, $q, $timeout,
                                                          TranslationRes,
                                                          YandexTranslateApiKey, YandexDictionaryApiKey) {
    var self = this;

    this.detect = function (text) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      msUtils.decoratePromise(promise);

      $http.get('https://translate.yandex.net/api/v1.5/tr.json/detect',
        {
          params: {
            key: YandexTranslateApiKey,
            text: [text]
          },
          withCredentials: false
        }
      ).success(function (data) {
          deferred.resolve(data);
        })
        .error(function (data, status) {
          deferred.reject({status: status, data: data});
        });

      return promise;
    };

    this.translate = function (fromLang, toLang, text) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      msUtils.decoratePromise(promise);

      /*
       * CORS not working when user logged in -> delete Authorization token with withCredentials=false
       */
      $http.get('https://dictionary.yandex.net/api/v1/dicservice.json/lookup',
        {
          params: {
            key: YandexDictionaryApiKey,
            lang: fromLang + "-" + toLang,
            text: text,
            ui: 'en'
          },
          withCredentials: false
        }
      ).success(function (data) {
          var translation = {};
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
            $http.get('https://translate.yandex.net/api/v1.5/tr.json/translate',
              {
                params: {
                  key: YandexTranslateApiKey,
                  lang: fromLang + "-" + toLang,
                  text: text,
                  ui: 'en'
                },
                withCredentials: false
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
                deferred.reject({status: status, data: data});
              });
          }
        }
      ).error(function (data, status) {
          deferred.reject({status: status, data: data});
        });

      return promise;
    };
  });

  servicesMod.factory('TranslateService', function ($log, $injector, $q, SessionService, TranslationRes, LanguagesService, TranslationSampleRes, TranslationsProvider) {

    this.setProvider = function (provider) {
      var transProvider = TranslationsProvider.setProvider(provider);
      if (transProvider !== undefined) {
        //configurable translations provider
        var yandexTranslate = $injector.get(transProvider.translate);
        this._translate = yandexTranslate.translate;
        this._detect = yandexTranslate.detect;
      }
      else {
        this._translate = this._detect = function (fromLang, toLang, text) {
          var deferred = $q.defer();
          var promise = deferred.promise;
          deferred.reject('Translations provider not specified');
          return promise;
        }
      }
    };

    this.getTranslations = function (options) {
      return TranslationRes.query(options).$promise;
    };

    this.getTranslation = function (id) {
      return TranslationRes.get({id: id}).$promise;
    };

    this.deleteTranslation = function (id) {
      return new TranslationRes({id: id}).$delete();
    };

    this.addTranslationSample = function (translationId, sample) {
      if(sample === '') return;
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

    this.detect = function(txt)
    {
      return this._detect(txt);
    }

    this.translate = function (fromLang, toLang, text) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      msUtils.decoratePromise(promise);

      this._translate(fromLang, toLang, text)
        .success(function (translation) {
          LanguagesService.fromLang(fromLang);
          LanguagesService.toLang(toLang);
          LanguagesService.addPrefered(fromLang);
          LanguagesService.addPrefered(toLang);

          var translationRes = new TranslationRes(translation);
          translationRes.$save(function () {
            $log.log('Translation Saved: id:' + translationRes.id);
            translation.id = translationRes.id;

            deferred.resolve(translation);
          });
        })
        .error(function (err) {
          deferred.reject(err);
        });

      return promise;
    };


    return this;
  });

})
();

