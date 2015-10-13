Options = (function(){
    return {
      target_lang: function(lang) {
        if (lang) {
          localStorage['target_lang'] = lang;
        }
        return localStorage['target_lang'];
      },
      from_lang: function(lang) {
        if (lang) {
          localStorage['from_lang'] = lang;
        }
        return localStorage['from_lang'] || 'auto';
      },
      word_key_only: function(arg) {
        if (arg != undefined) {
          localStorage['word_key_only'] = arg;
        }
        return localStorage['word_key_only'] ? parseInt( localStorage['word_key_only'] ) : 0;
      },
      selection_key_only: function(arg) {
        if (arg != undefined) {
          localStorage['selection_key_only'] = arg;
        }
        return parseInt( localStorage['selection_key_only'] );
      },
      translate_by: function(arg) {
        if (arg == 'click' || arg == 'point') {
          localStorage.translate_by = arg;
        }
        return localStorage.translate_by || 'click';
      },
      delay: function(ms) {
        if (ms != undefined && !isNaN(parseFloat(ms)) && isFinite(ms)) {
          localStorage['delay'] = ms;
        }
        return localStorage['delay'] == undefined ? 700 : parseInt(localStorage['delay']);
      },
      popup_show_trigger: function(arg) {
        if (arg != undefined) {
          localStorage['popup_show_trigger'] = arg;
        }
        return localStorage['popup_show_trigger'] || 'alt';
      },
      save_translation_sample: function(arg) {
        if (arg != undefined) {
          localStorage['save_translation_sample'] = arg;
        }
        return parseInt(localStorage['save_translation_sample']);
      },
      dismiss_on: function(arg) {
        if (arg != undefined) {
          localStorage['dismiss_on'] = arg;
        }
        return localStorage['dismiss_on'] === undefined ? 'mousemove':localStorage['dismiss_on'];
      }
    };
})();
