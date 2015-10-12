var app = angular.module('MyApp', ['memslate.services.translate']);

app.run(function (SessionService, BaseUrlService, TranslationsProvider, TranslateService) {
    "use strict";

    RegExp.quote = function (str) {
      return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    };

    function figureOutSlTl(tab_lang) {
      var res = {};

      if (Options.target_lang() == tab_lang && Options.reverse_lang()) {
        res.tl = Options.reverse_lang();
        res.sl = Options.target_lang();
        console.log('reverse translate into: ', {tl: res.tl, sl: res.sl});
      }
      else {
        res.tl = Options.target_lang();
        res.sl = Options.from_lang();
        console.log('normal translate into:', {tl: res.tl, sl: res.sl});
      }

      return res;
    }

    function translate_google(word, sl, tl, onresponse, sendResponse, ga_event_name) {
      var options = {
        url: "https://translate.googleapis.com/translate_a/single?dt=t&dt=bd",
        data: {
          client: 'gtx',
          q: word,
          sl: sl,
          tl: tl,
          dj: 1,
          source: 'bubble'
        },
        dataType: 'json',
        success: function on_success(data) {
          onresponse(data, word, tl, sendResponse);
        },
        error: function (xhr, status, e) {
          console.log({e: e, xhr: xhr});
        }
      };

      $.ajax(options);
    }

    function on_translation_response_google(data, word, tl, sendResponse) {
      var output, translation = {tl: tl};

      console.log('raw_translation: google ', data);

      if (!data.dict && !data.sentences ||
        (data.sentences && data.sentences[0].trans.match(new RegExp(MemsExt.regexp_escape(word), 'i')))) {

        translation.succeeded = false;

        if (data.src == tl || Options.do_not_show_oops()) {
          output = '';
        }
        else {
          output = 'Oops.. Translation not found.';
        }
      }
      else {
        translation.succeeded = true;
        translation.word = word;

        output = [];
        if (data.dict) { // full translation
          data.dict.forEach(function (t) {
            output.push({pos: t.pos, meanings: t.terms});
          });
        } else { // single word or sentence(s)
          data.sentences.forEach(function (s) {
            output.push(s.trans)
          });
          output = output.join(" ")
        }

        translation.sl = data.src;
      }

      if (!output instanceof String) {
        output = JSON.stringify(output);
      }

      translation.translation = output;

      console.log('response: google ', translation);
      sendResponse(translation);
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
              if (tr.syn)
              {
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

    function onTranslationError(sl, tl, error, sendResponse) {
      var translation = {};
      translation.succeeded = false;

      translation.translation = 'Translation not found: '+ ((error.data && error.data.message) || error) + " ("+sl+" > "+tl+")";

      sendResponse(translation);
    }

    function translateWithService(sl, tl, request, sendResponse) {
      if(sl == tl) return;

      TranslateService.translate(sl, tl, request.word)
        .success(function (translation) {
          onTranslationResponse(TranslationsProvider.getProvider().name, sl, tl, request.word, translation, sendResponse);
          if(request.sample && request.sample != "" && request.sample != request.word)
          {
            TranslateService.addTranslationSample(translation.id, request.sample);
          }
        })
        .error(function (error) {
          onTranslationError(sl, tl, error, sendResponse);
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
              save_translation_sample: Options.save_translation_sample()
            })
          });
          break;
        case 'translate':
          console.log("received to translate: " + request.word);

          chrome.tabs.detectLanguage(null, function (tab_lang) {
            var sl, tl;
            // hack: presence of request.tl/sl means this came from popup translate
            if (request.tl && request.sl) {
              localStorage['last_tat_tl'] = request.tl;
              localStorage['last_tat_sl'] = request.sl;
              sl = request.sl;
              tl = request.tl;
            } else {
              var sltl = figureOutSlTl(tab_lang);
              sl = sltl.sl;
              tl = sltl.tl;
            }

            if (sl == 'auto') {
              TranslateService.detect(request.word)
                .success(function (data) {
                  translateWithService(data.lang, tl, request, sendResponse);
                })
                .error(function (error) {
                  console.log("failed to detect language:",error);
                });
            }
            else {
              translateWithService(sl, tl, request, sendResponse);
            }

            //translate_google(request.word, sl, tl, on_translation_response_google, sendResponse);
          });
          break;
        default:
          console.log("Error! Unknown handler");
          sendResponse({});
      }
    }

    BaseUrlService.connect().then(function(){
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
