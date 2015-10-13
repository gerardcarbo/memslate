var app = angular.module('MyApp', ['memslate.services.translate']);

app.run(function ($q, SessionService, BaseUrlService, TranslationsProvider, TranslateService) {
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

    function onTranslationError(sl, tl,  word, error, sendResponse) {
      var translation = {};
      translation.succeeded = false;

      translation.translation = word + ': ' + ((error.data && error.data.message) || error) + " (" + sl + " > " + tl + ")";

      sendResponse(translation);
    }

    function translateWithService(sl, tl, request, sendResponse) {
      if (sl == tl) return;
      if (sl =='und')
      {
        var deferred = $q.defer();
        var promise = deferred.promise;
        msUtils.decoratePromise(promise);
        deferred.reject({status:400});
        return promise;
      }

      return TranslateService.translate(sl, tl, request.word)
        .success(function (translation) {
          onTranslationResponse(TranslationsProvider.getProvider().name, sl, tl, request.word, translation, sendResponse);
          if (request.sample && request.sample != "" && request.sample != request.word) {
            TranslateService.addTranslationSample(translation.id, request.sample);
          }
          return translation;
        })
        .error(function (error) {
          return error;
        });
    }

    function mainListener(request, sender, sendResponse) {
      switch (request.handler) {
        case 'get_last_tat_sl_tl':
          console.log('get_last_tat_sl_tl');
          sendResponse({last_tl: localStorage['last_tat_tl'], last_sl: localStorage['last_tat_sl']});
          break;
        case 'get_options':
          sendResponse({
            options: JSON.stringify({
              target_lang: Options.target_lang(),
              delay: Options.delay(),
              word_key_only: Options.word_key_only(),
              popup_show_trigger: Options.popup_show_trigger(),
              translate_by: Options.translate_by(),
              save_translation_sample: Options.save_translation_sample(),
              dismiss_on: Options.dismiss_on()
            })
          });
          break;
        case 'translate':
          console.log("translate: " + request.word);

          chrome.tabs.detectLanguage(null, function (tab_lang) {

            var sl, tl;
            sl = Options.from_lang();
            tl = Options.target_lang();
            console.log("translate: chrome tab lang: "+tab_lang+" sl:"+sl+" tl:"+tl);

            if (sl == 'auto') {
              //first try with tab_lang
              translateWithService(tab_lang, tl, request, sendResponse).error(function(error){
                //... and if failed try to detect word language.
                if(error.status==400)
                {
                  TranslateService.detect(request.word)
                    .success(function (data) {
                      translateWithService(data.lang, tl, request, sendResponse);
                    })
                    .error(function (error) {
                      console.log("failed to detect language:", error);
                      onTranslationError(sl, tl, request.word, "failed to detect language", sendResponse);
                    });
                }
                else
                {
                  onTranslationError(sl, tl, request.word, error, sendResponse);
                }
              });
            }
            else {
              translateWithService(sl, tl, request, sendResponse).error(function(error){
                onTranslationError(sl, tl, request.word, error, sendResponse);
              });
            }
          });
          break;
        default:
          console.log("Error! Unknown handler");
          sendResponse({});
      }
    }

    BaseUrlService.connect().then(function () {
      chrome.extension.onRequest.addListener(mainListener);
    });

    chrome.browserAction.onClicked.addListener(function (tab) {
      chrome.tabs.sendRequest(tab.id, 'open_type_and_translate');
    });

    chrome.runtime.onInstalled.addListener(function (details) {
      if (details.reason == 'install') {
        chrome.tabs.create({url: chrome.extension.getURL('options.html')});
      }
    });
  }
);
