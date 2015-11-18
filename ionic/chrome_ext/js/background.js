var app = angular.module('BackgroundApp', ['memslate.services.translate', 'memslate.services.authenticate']);

app.run(function ($q, SessionService, TranslationsProviders, TranslateService) {
    "use strict";

    RegExp.quote = function (str) {
      return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    };

    function onTranslationResponse(provider, sl, tl, word, data, sendResponse) {
      var output, translation = {tl: tl, sl: sl, succeeded: true, word: word};

      console.log('onTranslationResponse: raw ' + provider, data);

      output = [];
      if (provider === "Yandex") {
        if (data.provider == 'yd') //Yandex dictionary
        {
          data.rawResult.def.forEach(function (def) {
            var definition = {pos: def.pos, meanings: [], syn: []};
            def.tr.forEach(function (tr) {
              definition.pos = tr.pos;
              definition.meanings.push(tr.text);
              if (tr.syn) {
                tr.syn.forEach(function (syn) {
                  definition.meanings.push(syn.text);
                });
              }
              if (tr.mean) {
                tr.mean.forEach(function (mean) {
                  definition.syn.push(mean.text);
                });
              }
            });

            output.push(definition);
          })
        }
        else //Yandex translate
        {
          output = data.rawResult.text.join(' ');
        }
      }


      if (!output instanceof String) {
        output = JSON.stringify(output);
      }

      translation.translation = output;

      console.log('onTranslationResponse: ' + provider, translation);
      sendResponse(translation);
    }

    function onTranslationError(sl, tl, word, error, sendResponse) {
      var translation = {};
      translation.succeeded = false;

      translation.translation = word + ': ' + ((error.data && error.data.message) || error) + " (" + sl + " > " + tl + ")";

      sendResponse(translation);
    }

    function isLanguageNotTranslated(lang)
    {
      if(MemslateExtOptions.not_langs())
      {
        return MemslateExtOptions.not_langs().split(',').indexOf(lang)!=-1
      }
      return false;
    }

    function translateWithService(sl, tl, request, sendResponse) {
      if (sl == 'und' ||
          sl == tl ||
          isLanguageNotTranslated(sl)) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        msUtils.decoratePromise(promise);
        deferred.reject({status: 400});
        return promise;
      }

      return TranslateService.translate(sl, tl, request.word)
        .success(function (translation) {
          onTranslationResponse(TranslationsProviders.getProvider().name, sl, tl, request.word, translation, sendResponse);
          if (request.sample && request.sample != "" && request.sample != request.word) {
            TranslateService.addTranslationSample(translation.id, request.sample);
          }
          return translation;
        })
        .error(function (error) {
          return error;
        });
    }

    function getOptions() {
      return {
        options: JSON.stringify({
          to_lang: MemslateExtOptions.to_lang(),
          delay: MemslateExtOptions.delay(),
          translate_by: MemslateExtOptions.translate_by(),
          save_translation_sample: MemslateExtOptions.save_translation_sample(),
          dismiss_on: MemslateExtOptions.dismiss_on()
        })
      };
    }

    function mainListener(request, sender, sendResponse) {
      switch (request.handler) {
        case 'get_last_tat_sl_tl':
          console.log('get_last_tat_sl_tl');
          sendResponse({last_tl: localStorage['last_tat_tl'], last_sl: localStorage['last_tat_sl']});
          break;
        case 'options_changed':
          chrome.tabs.query({}, function (tabs) {
            for (var i = 0; i < tabs.length; ++i) {
              chrome.tabs.sendMessage(tabs[i].id, 'options_changed');
            }
          });
          break;
        case 'get_options':
          console.log("sending options: " + request.handler);
          sendResponse(getOptions());
          break;
        case 'translate':
          console.log("translate: " + request.word);

          chrome.tabs.detectLanguage(null, function (tab_lang) {

            var sl, tl;
            sl = MemslateExtOptions.from_lang();
            tl = MemslateExtOptions.to_lang();
            console.log("translate: chrome tab lang: " + tab_lang + " sl:" + sl + " tl:" + tl);

            if (sl == 'auto') {
              if(isLanguageNotTranslated(tab_lang))
              {
                console.log("'auto' -> "+tab_lang+" not translated!");
                return;
              }
              //first try with tab_lang
              translateWithService(tab_lang, tl, request, sendResponse).error(function (error) {
                console.log("'auto' translation failed:", error);
                //... and if failed try to detect word language.
                if (error.status == 400) {
                  TranslateService.detect(request.word)
                    .success(function (data) {
                      translateWithService(data.lang, tl, request, sendResponse).error(function (error) {
                        console.log("translation failed:", error);
                        onTranslationError(sl, tl, request.word, error, sendResponse);
                      });
                    })
                    .error(function (error) {
                      console.log("failed to detect language:", error);
                      onTranslationError(sl, tl, request.word, "failed to detect language", sendResponse);
                    });
                }
                else {
                  onTranslationError(sl, tl, request.word, error, sendResponse);
                }
              });
            }
            else {
              translateWithService(sl, tl, request, sendResponse).error(function (error) {
                console.log("translation failed:", error);
                onTranslationError(sl, tl, request.word, error, sendResponse);
              });
            }
          });
          break;
        default:
          console.log("Error! Unknown handler: " + request.handler);
          sendResponse({});
      }
    }

    chrome.extension.onRequest.addListener(mainListener);

    chrome.runtime.onInstalled.addListener(function (details) {
      if (details.reason == 'install') {
        chrome.tabs.create({url: chrome.extension.getURL('chrome_ext/options.html')});
      }
    });
  }
);
